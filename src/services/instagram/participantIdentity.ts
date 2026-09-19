import { resolveInstagramProfile, type InstagramProfile } from "./metaClient";

export const resolveStoredParticipantProfile = async (
  username: string | null,
  accessToken: string | undefined,
  participantId: string,
): Promise<InstagramProfile | null> => {
  if (!accessToken) {
    return username
      ? {
          username,
          name: null,
          biography: null,
          followersCount: null,
          profilePictureUrl: null,
        }
      : null;
  }

  return resolveInstagramProfile(accessToken, participantId).catch(() =>
    username
      ? {
          username,
          name: null,
          biography: null,
          followersCount: null,
          profilePictureUrl: null,
        }
      : null,
  );
};
