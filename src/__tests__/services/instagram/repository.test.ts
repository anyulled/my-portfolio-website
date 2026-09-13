import {
  findInstagramAccount,
  getInstagramConversationForDelivery,
  listConnectedInstagramAccounts,
  upsertInstagramAccount,
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
  const order = jest.fn().mockResolvedValue(result);
  const eq = jest.fn().mockReturnValue({ maybeSingle, order });
  const inFilter = jest.fn().mockReturnValue({ eq });
  const select = jest.fn().mockReturnValue({ in: inFilter, eq });
  const from = jest.fn().mockReturnValue({ select });

  return {
    database: { from } as never,
    from,
    select,
    inFilter,
    eq,
    maybeSingle,
    order,
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
      "id, handle, instagram_user_id, instagram_webhook_user_id, access_token",
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

const createFallbackDatabase = (
  results: Array<{ data: unknown; error: unknown }>,
  updateResult: { error: unknown } = { error: null },
  upsertResult: { error: unknown } = { error: null },
) => {
  const from = jest.fn().mockImplementation(() => {
    const result = results.shift() ?? { data: null, error: null };
    const maybeSingle = jest.fn().mockResolvedValue(result);
    const order = jest.fn().mockResolvedValue(result);
    const eq = jest.fn().mockReturnValue({ maybeSingle, order });
    const inFilter = jest.fn().mockReturnValue({ eq });
    const select = jest.fn().mockReturnValue({ in: inFilter, eq });
    const updateEq = jest.fn().mockResolvedValue(updateResult);
    const update = jest.fn().mockReturnValue({ eq: updateEq });
    const upsert = jest.fn().mockResolvedValue(upsertResult);
    return { select, update, updateEq, upsert };
  });

  return { database: { from } as never, from };
};

describe("findInstagramAccount webhook identity resolution", () => {
  const originalGraphApiVersion = process.env.INSTAGRAM_GRAPH_API_VERSION;

  beforeEach(() => {
    process.env.INSTAGRAM_GRAPH_API_VERSION = "26.0";
  });

  afterEach(() => {
    if (originalGraphApiVersion === undefined) {
      delete process.env.INSTAGRAM_GRAPH_API_VERSION;
    } else {
      process.env.INSTAGRAM_GRAPH_API_VERSION = originalGraphApiVersion;
    }
    jest.restoreAllMocks();
  });

  it("uses the persisted webhook identifier", async () => {
    const account = {
      id: "account-row-id",
      handle: "anyulled",
      instagram_user_id: "api-account-id",
      instagram_webhook_user_id: "webhook-account-id",
      access_token: "access-token",
    };
    const { database, from } = createFallbackDatabase([
      { data: null, error: null },
      { data: account, error: null },
    ]);

    await expect(
      findInstagramAccount(database, ["webhook-account-id"]),
    ).resolves.toEqual(account);

    expect(from).toHaveBeenCalledTimes(2);
  });

  it("resolves and persists an unknown webhook identifier through Meta", async () => {
    const account = {
      id: "account-row-id",
      handle: "anyulled",
      instagram_user_id: "api-account-id",
      instagram_webhook_user_id: null,
      access_token: "access-token",
    };
    const { database, from } = createFallbackDatabase([
      { data: null, error: null },
      { data: null, error: null },
      { data: [account], error: null },
    ]);
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ username: "anyulled" }),
    });

    await expect(
      findInstagramAccount(database, ["webhook-account-id"]),
    ).resolves.toEqual({
      ...account,
      instagram_webhook_user_id: "webhook-account-id",
    });

    expect(from).toHaveBeenCalledTimes(4);
  });

  it("continues resolving when an account username does not match", async () => {
    const firstAccount = {
      id: "first-account-row-id",
      handle: "sensuelleboudoir",
      instagram_user_id: "first-api-account-id",
      instagram_webhook_user_id: null,
      access_token: "first-access-token",
    };
    const matchingAccount = {
      id: "matching-account-row-id",
      handle: "anyulled",
      instagram_user_id: "matching-api-account-id",
      instagram_webhook_user_id: null,
      access_token: "matching-access-token",
    };
    const { database } = createFallbackDatabase([
      { data: null, error: null },
      { data: null, error: null },
      { data: [firstAccount, matchingAccount], error: null },
    ]);
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ username: "anyulled" }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ username: "anyulled" }),
      });

    await expect(
      findInstagramAccount(database, ["webhook-account-id"]),
    ).resolves.toMatchObject({ id: matchingAccount.id });
  });

  it("propagates errors while listing active accounts for fallback", async () => {
    const error = new Error("active accounts unavailable");
    const { database } = createFallbackDatabase([
      { data: null, error: null },
      { data: null, error: null },
      { data: null, error },
    ]);

    await expect(
      findInstagramAccount(database, ["webhook-account-id"]),
    ).rejects.toBe(error);
  });

  it("propagates errors while saving a resolved webhook identifier", async () => {
    const account = {
      id: "account-row-id",
      handle: "anyulled",
      instagram_user_id: "api-account-id",
      instagram_webhook_user_id: null,
      access_token: "access-token",
    };
    const error = new Error("webhook identifier could not be saved");
    const { database } = createFallbackDatabase(
      [
        { data: null, error: null },
        { data: null, error: null },
        { data: [account], error: null },
      ],
      { error },
    );
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ username: "anyulled" }),
    });

    await expect(
      findInstagramAccount(database, ["webhook-account-id"]),
    ).rejects.toBe(error);
  });
});

describe("upsertInstagramAccount", () => {
  it("stores the connected account credentials without changing webhook identity", async () => {
    const { database, from } = createFallbackDatabase([]);

    await expect(
      upsertInstagramAccount(database, {
        handle: "anyulled",
        instagram_user_id: "api-account-id",
        access_token: "access-token",
        token_expires_at: null,
      }),
    ).resolves.toBeUndefined();

    const query = from.mock.results[0]?.value as { upsert: jest.Mock };
    expect(query.upsert).toHaveBeenCalledWith(
      {
        handle: "anyulled",
        instagram_user_id: "api-account-id",
        access_token: "access-token",
        token_expires_at: null,
        active: true,
      },
      { onConflict: "handle" },
    );
  });

  it("propagates account persistence errors", async () => {
    const error = new Error("account persistence failed");
    const { database } = createFallbackDatabase([], { error: null }, { error });

    await expect(
      upsertInstagramAccount(database, {
        handle: "anyulled",
        instagram_user_id: "api-account-id",
        access_token: "access-token",
        token_expires_at: null,
      }),
    ).rejects.toBe(error);
  });
});

const createDeliveryDatabase = (data: unknown) => {
  const single = jest.fn().mockResolvedValue({ data, error: null });
  const eq = jest.fn().mockReturnValue({ single });
  const select = jest.fn().mockReturnValue({ eq });
  const from = jest.fn().mockReturnValue({ select });

  return { database: { from } as never, select, eq, single };
};

describe("getInstagramConversationForDelivery", () => {
  const baseConversation = {
    id: "conversation-row-id",
    participant_id: "participant-id",
    detected_language: "it",
    response_route: "model_form",
    response_sent_at: null,
  };
  const account = {
    handle: "anyulled",
    instagram_user_id: "stored-account-id",
    access_token: "access-token",
  };

  it.each([
    ["a related account object", account, account],
    ["a related account array", [account], account],
  ])("normalizes %s", async (_description, relation, expectedAccount) => {
    const { database, select, eq, single } = createDeliveryDatabase({
      ...baseConversation,
      instagram_accounts: relation,
    });

    await expect(
      getInstagramConversationForDelivery(database, "conversation-row-id"),
    ).resolves.toEqual({
      ...baseConversation,
      instagram_accounts: expectedAccount,
    });

    expect(select).toHaveBeenCalledWith(
      "id, participant_id, detected_language, response_route, response_sent_at, instagram_accounts(handle, instagram_user_id, access_token)",
    );
    expect(eq).toHaveBeenCalledWith("id", "conversation-row-id");
    expect(single).toHaveBeenCalled();
  });

  it("returns no account when the relation is empty", async () => {
    const { database } = createDeliveryDatabase({
      ...baseConversation,
      instagram_accounts: [],
    });

    await expect(
      getInstagramConversationForDelivery(database, "conversation-row-id"),
    ).resolves.toEqual({
      ...baseConversation,
      instagram_accounts: null,
    });
  });
});
