import { listConnectedInstagramAccounts } from "@/services/instagram/repository";

const createDatabase = (result: { data: unknown; error: unknown }) => {
  const order = jest.fn().mockResolvedValue(result);
  const eq = jest.fn().mockReturnValue({ order });
  const select = jest.fn().mockReturnValue({ eq });
  const from = jest.fn().mockReturnValue({ select });

  return { database: { from } as never, from, select, eq, order };
};

describe("listConnectedInstagramAccounts", () => {
  it("returns supported active account handles", async () => {
    const { database, from, select, eq, order } = createDatabase({
      data: [
        { handle: "anyulled" },
        { handle: "sensuelleboudoir" },
        { handle: "unknown-account" },
      ],
      error: null,
    });

    const accounts = await listConnectedInstagramAccounts(database);

    expect(accounts).toEqual(["anyulled", "sensuelleboudoir"]);
    expect(from).toHaveBeenCalledWith("instagram_accounts");
    expect(select).toHaveBeenCalledWith("handle");
    expect(eq).toHaveBeenCalledWith("active", true);
    expect(order).toHaveBeenCalledWith("handle");
  });

  it("returns no handles when the database has no rows", async () => {
    const { database } = createDatabase({ data: null, error: null });

    await expect(listConnectedInstagramAccounts(database)).resolves.toEqual([]);
  });

  it("propagates database errors", async () => {
    const error = new Error("database unavailable");
    const { database } = createDatabase({ data: null, error });

    await expect(listConnectedInstagramAccounts(database)).rejects.toBe(error);
  });
});
