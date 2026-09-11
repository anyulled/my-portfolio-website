interface InstagramSendResponse {
  recipient_id?: string;
  message_id?: string;
}

const getGraphApiVersion = () => {
  const version = process.env.INSTAGRAM_GRAPH_API_VERSION;
  if (!version) {
    throw new Error("INSTAGRAM_GRAPH_API_VERSION is required");
  }
  return version;
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
