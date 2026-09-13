import { getInstagramGraphApiVersion } from "./config";

interface InstagramSendResponse {
  recipient_id?: string;
  message_id?: string;
}

interface InstagramProfileResponse {
  username?: unknown;
}

const getGraphApiVersion = () => {
  return getInstagramGraphApiVersion();
};

const getGraphApiUrl = (instagramUserId: string) =>
  `https://graph.instagram.com/${getGraphApiVersion()}/${instagramUserId}/messages`;

const isInstagramSendResponse = (
  value: unknown,
): value is InstagramSendResponse =>
  typeof value === "object" &&
  value !== null &&
  (typeof (value as { message_id?: unknown }).message_id === "string" ||
    typeof (value as { recipient_id?: unknown }).recipient_id === "string");

const getInstagramUsername = (value: unknown) => {
  if (typeof value !== "object" || value === null) {
    return null;
  }

  const username = (value as InstagramProfileResponse).username;
  return typeof username === "string" && username.length > 0 ? username : null;
};

export const resolveInstagramUsername = async (
  accessToken: string,
  instagramUserId: string,
) => {
  const profileUrl = new URL(
    `https://graph.instagram.com/${getGraphApiVersion()}/${instagramUserId}`,
  );
  profileUrl.searchParams.set("fields", "username");

  const response = await fetch(profileUrl, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) {
    return null;
  }

  return getInstagramUsername(await response.json());
};

export const sendInstagramText = async (
  accessToken: string,
  instagramUserId: string,
  recipientId: string,
  text: string,
) => {
  const response = await fetch(getGraphApiUrl(instagramUserId), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      recipient: { id: recipientId },
      message: { text },
    }),
  });

  const payload: unknown = await response.json();
  if (!response.ok || !isInstagramSendResponse(payload)) {
    throw new Error("Instagram message delivery failed");
  }

  return payload;
};
