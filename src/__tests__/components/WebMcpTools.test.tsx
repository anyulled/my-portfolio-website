import WebMcpTools from "@/components/WebMcpTools";
import { act, render } from "@testing-library/react";

type RegisteredTool = {
  name: string;
  execute: (input: { package?: string }) => Promise<unknown>;
};

describe("WebMcpTools", () => {
  const tools: RegisteredTool[] = [];
  const openContactDialog = jest.fn();
  let registrationSignal: AbortSignal;

  beforeEach(() => {
    tools.length = 0;
    openContactDialog.mockReset();
    global.fetch = jest.fn();
    Object.defineProperty(document, "modelContext", {
      configurable: true,
      value: {
        registerTool: jest.fn(
          (tool: RegisteredTool, options: { signal: AbortSignal }) => {
            tools.push(tool);
            registrationSignal = options.signal;
            return Promise.resolve();
          },
        ),
      },
    });
  });

  afterEach(() => {
    delete (document as Document & { modelContext?: unknown }).modelContext;
    delete (global as unknown as { fetch?: typeof fetch }).fetch;
    jest.restoreAllMocks();
  });

  it("reads public information and opens an enquiry without submitting it", async () => {
    const fetchMock = jest.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ packages: [{ id: "express", price: 200 }] }),
    } as Response);

    const { unmount } = render(
      <WebMcpTools openContactDialog={openContactDialog} />,
    );
    const information = tools.find(
      (tool) => tool.name === "get_boudoir_services",
    );
    const enquiry = tools.find((tool) => tool.name === "open_session_enquiry");

    expect(await information?.execute({})).toEqual({
      packages: [{ id: "express", price: 200 }],
    });
    expect(fetchMock).toHaveBeenCalledWith("/api/assistant-information");
    await act(async () => {
      expect(await enquiry?.execute({ package: "express" })).toEqual({
        status: "form_opened",
        submissionRequired: true,
      });
    });
    expect(openContactDialog).toHaveBeenCalledWith("express");
    unmount();
    expect(registrationSignal.aborted).toBe(true);
  });

  it("rejects unsupported package values and unavailable information", async () => {
    jest.mocked(global.fetch).mockResolvedValue({ ok: false } as Response);
    render(<WebMcpTools openContactDialog={openContactDialog} />);
    const information = tools.find(
      (tool) => tool.name === "get_boudoir_services",
    );
    const enquiry = tools.find((tool) => tool.name === "open_session_enquiry");

    await expect(information?.execute({})).rejects.toThrow(
      "Service information is unavailable",
    );
    await expect(enquiry?.execute({ package: "unknown" })).rejects.toThrow(
      "Unknown package",
    );
    expect(openContactDialog).not.toHaveBeenCalled();
  });

  it("does nothing in browsers without WebMCP", () => {
    delete (document as Document & { modelContext?: unknown }).modelContext;

    render(<WebMcpTools openContactDialog={openContactDialog} />);

    expect(tools).toHaveLength(0);
  });

  it("keeps the site usable when the experimental browser rejects tool registration", async () => {
    Object.defineProperty(document, "modelContext", {
      configurable: true,
      value: { registerTool: () => Promise.reject(new Error("unsupported")) },
    });

    render(<WebMcpTools openContactDialog={openContactDialog} />);
    await Promise.resolve();

    expect(openContactDialog).not.toHaveBeenCalled();
  });
});
