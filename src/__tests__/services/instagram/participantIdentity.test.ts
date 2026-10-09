import { resolveInstagramProfile } from "@/services/instagram/metaClient";
import { resolveStoredParticipantProfile } from "@/services/instagram/participantIdentity";

jest.mock("@/services/instagram/metaClient", () => ({
  resolveInstagramProfile: jest.fn(),
}));

describe("resolveStoredParticipantProfile", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it.each(["stored-name", null])(
    "retains live profile fields when its username is missing and the stored username is %s",
    async (username) => {
      const profile = {
        username: null,
        name: "Model Name",
        biography: "Barcelona model",
        followersCount: 1234,
        profilePictureUrl: "https://example.com/profile.jpg",
      };
      jest.mocked(resolveInstagramProfile).mockResolvedValue(profile);

      await expect(
        resolveStoredParticipantProfile(
          username,
          "access-token",
          "participant-id",
        ),
      ).resolves.toEqual({ ...profile, username });
    },
  );

  it("preserves the stored username when Meta returns no profile", async () => {
    jest.mocked(resolveInstagramProfile).mockResolvedValue(null);

    await expect(
      resolveStoredParticipantProfile(
        "stored-name",
        "access-token",
        "participant-id",
      ),
    ).resolves.toEqual({
      username: "stored-name",
      name: null,
      biography: null,
      followersCount: null,
      profilePictureUrl: null,
    });
  });

  it("uses the stored username when no account token is available", async () => {
    await expect(
      resolveStoredParticipantProfile("modelname", undefined, "participant-id"),
    ).resolves.toEqual({
      username: "modelname",
      name: null,
      biography: null,
      followersCount: null,
      profilePictureUrl: null,
    });
    expect(resolveInstagramProfile).not.toHaveBeenCalled();
  });

  it("returns no profile when no token or username is available", async () => {
    await expect(
      resolveStoredParticipantProfile(null, undefined, "participant-id"),
    ).resolves.toBeNull();
  });

  it("resolves the live profile with the connected account token", async () => {
    jest.mocked(resolveInstagramProfile).mockResolvedValue({
      username: "modelname",
      name: "Model Name",
      biography: "Barcelona model",
      followersCount: 1234,
      profilePictureUrl: "https://example.com/profile.jpg",
    });

    await expect(
      resolveStoredParticipantProfile(
        "stored-name",
        "access-token",
        "participant-id",
      ),
    ).resolves.toEqual({
      username: "modelname",
      name: "Model Name",
      biography: "Barcelona model",
      followersCount: 1234,
      profilePictureUrl: "https://example.com/profile.jpg",
    });
    expect(resolveInstagramProfile).toHaveBeenCalledWith(
      "access-token",
      "participant-id",
    );
  });

  it("falls back to the stored username when Meta rejects the lookup", async () => {
    jest
      .mocked(resolveInstagramProfile)
      .mockRejectedValue(new Error("profile unavailable"));

    await expect(
      resolveStoredParticipantProfile(
        "stored-name",
        "access-token",
        "participant-id",
      ),
    ).resolves.toEqual({
      username: "stored-name",
      name: null,
      biography: null,
      followersCount: null,
      profilePictureUrl: null,
    });
  });

  it("returns no profile when Meta rejects and no username is stored", async () => {
    jest
      .mocked(resolveInstagramProfile)
      .mockRejectedValue(new Error("profile unavailable"));

    await expect(
      resolveStoredParticipantProfile(null, "access-token", "participant-id"),
    ).resolves.toBeNull();
  });
});
