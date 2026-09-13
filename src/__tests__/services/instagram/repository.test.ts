import {
  findInstagramAccount,
  listConnectedInstagramAccounts,
} from "@/services/instagram/repository";

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

const createFindDatabase = (result: { data: unknown; error: unknown }) => {
  const maybeSingle = jest.fn().mockResolvedValue(result);
  const eq = jest.fn().mockReturnValue({ maybeSingle });
  const inFilter = jest.fn().mockReturnValue({ eq });
  const select = jest.fn().mockReturnValue({ in: inFilter });
  const from = jest.fn().mockReturnValue({ select });

  return {
    database: { from } as never,
    from,
    select,
    inFilter,
    eq,
    maybeSingle,
  };
};

describe("findInstagramAccount", () => {
  it("matches any account identifier delivered by Meta", async () => {
    const account = {
      id: "account-row-id",
      handle: "anyulled",
      instagram_user_id: "recipient-account-id",
      access_token: "access-token",
    };
    const { database, from, select, inFilter, eq, maybeSingle } =
      createFindDatabase({ data: account, error: null });

    await expect(
      findInstagramAccount(database, [
        "entry-account-id",
        "recipient-account-id",
      ]),
    ).resolves.toEqual(account);

    expect(from).toHaveBeenCalledWith("instagram_accounts");
    expect(select).toHaveBeenCalledWith(
      "id, handle, instagram_user_id, access_token",
    );
    expect(inFilter).toHaveBeenCalledWith("instagram_user_id", [
      "entry-account-id",
      "recipient-account-id",
    ]);
    expect(eq).toHaveBeenCalledWith("active", true);
    expect(maybeSingle).toHaveBeenCalled();
  });

  it("rejects an empty list of account identifiers", async () => {
    const { database } = createFindDatabase({ data: null, error: null });

    await expect(findInstagramAccount(database, [])).rejects.toThrow(
      "Instagram account identifier is missing",
    );
  });

  it("rejects when no active account matches the identifiers", async () => {
    const { database } = createFindDatabase({ data: null, error: null });

    await expect(
      findInstagramAccount(database, ["unknown-account-id"]),
    ).rejects.toThrow("Instagram account is not configured");
  });

  it("propagates account lookup errors", async () => {
    const error = new Error("database unavailable");
    const { database } = createFindDatabase({ data: null, error });

    await expect(findInstagramAccount(database, ["account-id"])).rejects.toBe(
      error,
    );
  });
});
