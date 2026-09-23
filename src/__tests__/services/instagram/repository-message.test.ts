import { hasInstagramMessage } from "@/services/instagram/repository";

const createDatabase = (result: { data: unknown; error: unknown }) => {
  const maybeSingle = jest.fn().mockResolvedValue(result);
  const eq = jest.fn().mockReturnValue({ maybeSingle });
  const select = jest.fn().mockReturnValue({ eq });
  const from = jest.fn().mockReturnValue({ select });

  return { database: { from } as never, from, select, eq, maybeSingle };
};

describe("hasInstagramMessage", () => {
  it.each([
    ["an existing message", { id: "message-row-id" }, true],
    ["a missing message", null, false],
  ])("returns %s", async (_description, data, expected) => {
    const { database, from, select, eq, maybeSingle } = createDatabase({
      data,
      error: null,
    });

    await expect(hasInstagramMessage(database, "message-id")).resolves.toBe(
      expected,
    );

    expect(from).toHaveBeenCalledWith("instagram_messages");
    expect(select).toHaveBeenCalledWith("id");
    expect(eq).toHaveBeenCalledWith("instagram_message_id", "message-id");
    expect(maybeSingle).toHaveBeenCalled();
  });

  it("propagates lookup errors", async () => {
    const error = new Error("message lookup failed");
    const { database } = createDatabase({ data: null, error });

    await expect(hasInstagramMessage(database, "message-id")).rejects.toBe(
      error,
    );
  });
});
