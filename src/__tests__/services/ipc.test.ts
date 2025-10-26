import { fetchLatestIpc } from "@/services/ipc";

describe("fetchLatestIpc", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = jest.fn() as unknown as typeof fetch;
  });

  afterEach(() => {
    jest.clearAllMocks();
    if (originalFetch) {
      global.fetch = originalFetch;
    }
  });

  it("returns the Valor field from the IPC API response", async () => {
    const mockResponse = {
      ok: true,
      json: jest.fn().mockResolvedValue([
        {
          Data: [
            {
              Valor: 1.5,
            },
          ],
        },
      ]),
    } as unknown as Response;

    (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

    await expect(fetchLatestIpc()).resolves.toBe(1.5);
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it("throws an error when the response is not ok", async () => {
    const mockResponse = {
      ok: false,
      status: 500,
      json: jest.fn(),
    } as unknown as Response;

    (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

    await expect(fetchLatestIpc()).rejects.toThrow(
      "Failed to retrieve IPC data via fetch (status 500)",
    );
  });

  it("throws an error when data entries are missing", async () => {
    const mockResponse = {
      ok: true,
      json: jest.fn().mockResolvedValue([
        {
          Data: [],
        },
      ]),
    } as unknown as Response;

    (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

    await expect(fetchLatestIpc()).rejects.toThrow(
      "IPC response does not include any data entries",
    );
  });

  it("throws an error when Valor is not numeric", async () => {
    const mockResponse = {
      ok: true,
      json: jest.fn().mockResolvedValue([
        {
          Data: [
            {
              Valor: "not-a-number",
            },
          ],
        },
      ]),
    } as unknown as Response;

    (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

    await expect(fetchLatestIpc()).rejects.toThrow(
      "IPC response does not include a numeric Valor value",
    );
  });
});
