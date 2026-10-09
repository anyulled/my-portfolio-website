import { resolveInstagramProfile, type InstagramProfile } from "./metaClient";

export const resolveStoredParticipantProfile = async (
  username: string | null,
  accessToken: string | undefined,
  participantId: string,
): Promise<InstagramProfile | null> => {
  const storedProfile = username
    ? {
        username,
        name: null,
        biography: null,
        followersCount: null,
        profilePictureUrl: null,
      }
    : null;
  if (!accessToken) {
    return storedProfile;
  }

  const profile = await resolveInstagramProfile(
    accessToken,
    participantId,
  ).catch(() => null);
  return profile
    ? { ...profile, username: profile.username ?? username }
    : storedProfile;
};
