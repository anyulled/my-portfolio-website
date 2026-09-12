import { getInstagramGraphApiVersion } from "@/services/instagram/config";

describe("getInstagramGraphApiVersion", () => {
  const originalVersion = process.env.INSTAGRAM_GRAPH_API_VERSION;

  afterEach(() => {
    if (originalVersion === undefined) {
      delete process.env.INSTAGRAM_GRAPH_API_VERSION;
    } else {
      process.env.INSTAGRAM_GRAPH_API_VERSION = originalVersion;
    }
  });

  it("adds the required prefix when the environment value omits it", () => {
    process.env.INSTAGRAM_GRAPH_API_VERSION = "26.0";

    expect(getInstagramGraphApiVersion()).toBe("v26.0");
  });

  it("preserves an already prefixed environment value", () => {
    process.env.INSTAGRAM_GRAPH_API_VERSION = "v26.0";

    expect(getInstagramGraphApiVersion()).toBe("v26.0");
  });
});
