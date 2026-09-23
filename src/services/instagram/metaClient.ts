import { getInstagramGraphApiVersion } from "./config";

interface InstagramSendResponse {
  recipient_id?: string;
  message_id?: string;
}

export interface InstagramProfile {
  username: string | null;
  name: string | null;
  biography: string | null;
  followersCount: number | null;
  profilePictureUrl: string | null;
}

export interface InstagramConversationMessage {
  conversationId: string;
  messageId: string;
  participantId: string;
  text: string;
  timestamp: string;
}

interface InstagramProfileResponse {
  username?: unknown;
  name?: unknown;
  biography?: unknown;
  followers_count?: unknown;
  profile_picture_url?: unknown;
}

interface InstagramConversationMessageResponse {
  id?: unknown;
  from?: { id?: unknown };
  message?: unknown;
  created_time?: unknown;
  is_echo?: unknown;
}

interface InstagramConversationResponse {
  id?: unknown;
  messages?: {
    data?: unknown;
    paging?: { next?: unknown };
  };
}

interface InstagramConversationMessagePageResponse {
  data?: unknown;
  paging?: { next?: unknown };
}

interface InstagramConversationsPage {
  data?: unknown;
  paging?: { next?: unknown };
}

interface InstagramConversationMessagePage {
  messages: Array<InstagramConversationMessage>;
  nextPage: string | null;
  truncated: boolean;
  outboundMessagesSkipped: number;
}

export interface InstagramConversationSyncResult {
  messages: Array<InstagramConversationMessage>;
  truncated: boolean;
  outboundMessagesSkipped: number;
}

const getGraphApiVersion = () => {
  return getInstagramGraphApiVersion();
};

const getGraphApiUrl = (instagramUserId: string) =>
  `https://graph.instagram.com/${getGraphApiVersion()}/${instagramUserId}/messages`;

const getConversationsApiUrl = (instagramUserId: string) =>
  `https://graph.instagram.com/${getInstagramGraphApiVersion()}/${instagramUserId}/conversations`;

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

const toOptionalString = (value: unknown) =>
  typeof value === "string" && value.length > 0 ? value : null;

const toOptionalNumber = (value: unknown) =>
  typeof value === "number" && Number.isFinite(value) ? value : null;

const parseConversationMessagePage = (
  conversationId: string | null,
  page: InstagramConversationMessagePageResponse | undefined,
  accountId: string,
): InstagramConversationMessagePage => {
  if (!conversationId || !page) {
    return {
      messages: [],
      nextPage: null,
      truncated: false,
      outboundMessagesSkipped: 0,
    };
  }

  const messages = Array.isArray(page.data) ? page.data : [];

  return {
    messages: messages.flatMap((value) => {
      if (typeof value !== "object" || value === null) {
        return [];
      }

      const message = value as InstagramConversationMessageResponse;
      const participantId = message.from?.id;
      const text = message.message;
      const messageId = message.id;
      const createdTime = message.created_time;
      if (
        typeof participantId !== "string" ||
        participantId === accountId ||
        typeof text !== "string" ||
        typeof messageId !== "string" ||
        typeof createdTime !== "string" ||
        message.is_echo === true
      ) {
        return [];
      }

      const timestamp = new Date(createdTime);
      if (Number.isNaN(timestamp.valueOf())) {
        return [];
      }

      return [
        {
          conversationId,
          messageId,
          participantId,
          text,
          timestamp: timestamp.toISOString(),
        },
      ];
    }),
    nextPage: typeof page.paging?.next === "string" ? page.paging.next : null,
    truncated: false,
    outboundMessagesSkipped: messages.filter(
      (value) =>
        typeof value === "object" &&
        value !== null &&
        ((value as InstagramConversationMessageResponse).from?.id ===
          accountId ||
          (value as InstagramConversationMessageResponse).is_echo === true),
    ).length,
  };
};

const fetchConversationMessagePages = async (
  accessToken: string,
  accountId: string,
  conversationId: string,
  page: InstagramConversationMessagePage,
  pageCount: number,
): Promise<InstagramConversationMessagePage> => {
  if (!page.nextPage) {
    return page;
  }
  if (pageCount >= 10) {
    return { ...page, truncated: true };
  }

  const response = await fetch(page.nextPage, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) {
    throw new Error("Instagram conversations lookup failed");
  }

  const nextPage = parseConversationMessagePage(
    conversationId,
    (await response.json()) as InstagramConversationMessagePageResponse,
    accountId,
  );
  return fetchConversationMessagePages(
    accessToken,
    accountId,
    conversationId,
    {
      messages: [...page.messages, ...nextPage.messages],
      nextPage: nextPage.nextPage,
      truncated: page.truncated || nextPage.truncated,
      outboundMessagesSkipped:
        page.outboundMessagesSkipped + nextPage.outboundMessagesSkipped,
    },
    pageCount + 1,
  );
};

const getConversationMessages = async (
  accessToken: string,
  conversation: InstagramConversationResponse,
  accountId: string,
) =>
  fetchConversationMessagePages(
    accessToken,
    accountId,
    typeof conversation.id === "string" ? conversation.id : "",
    parseConversationMessagePage(
      typeof conversation.id === "string" ? conversation.id : null,
      conversation.messages,
      accountId,
    ),
    1,
  );

const parseConversationsPage = async (
  accessToken: string,
  payload: InstagramConversationsPage,
  accountId: string,
): Promise<InstagramConversationSyncResult & { nextPage: string | null }> => {
  const conversations = Array.isArray(payload.data) ? payload.data : [];
  const conversationResults = await Promise.all(
    conversations.flatMap((conversation) =>
      typeof conversation === "object" && conversation !== null
        ? [
            getConversationMessages(
              accessToken,
              conversation as InstagramConversationResponse,
              accountId,
            ),
          ]
        : [],
    ),
  );
  return {
    messages: conversationResults.flatMap((result) => result.messages),
    truncated: conversationResults.some((result) => result.truncated),
    outboundMessagesSkipped: conversationResults.reduce(
      (count, result) => count + result.outboundMessagesSkipped,
      0,
    ),
    nextPage:
      typeof payload.paging?.next === "string" ? payload.paging.next : null,
  };
};

export const listInstagramConversationMessages = async (
  accessToken: string,
  instagramUserId: string,
): Promise<InstagramConversationSyncResult> => {
  const url = new URL(getConversationsApiUrl(instagramUserId));
  url.searchParams.set("platform", "instagram");
  url.searchParams.set(
    "fields",
    "id,messages.limit(20){id,from,message,created_time,is_echo}",
  );
  url.searchParams.set("limit", "50");

  const fetchPage = async (
    nextPage: string | null,
    pageCount: number,
    result: InstagramConversationSyncResult,
  ): Promise<InstagramConversationSyncResult> => {
    if (!nextPage || pageCount >= 10) {
      return { ...result, truncated: result.truncated || Boolean(nextPage) };
    }

    const response = await fetch(nextPage, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!response.ok) {
      throw new Error("Instagram conversations lookup failed");
    }

    const page = await parseConversationsPage(
      accessToken,
      (await response.json()) as InstagramConversationsPage,
      instagramUserId,
    );
    return fetchPage(page.nextPage, pageCount + 1, {
      messages: [...result.messages, ...page.messages],
      truncated: result.truncated || page.truncated,
      outboundMessagesSkipped:
        result.outboundMessagesSkipped + page.outboundMessagesSkipped,
    });
  };

  return fetchPage(url.toString(), 0, {
    messages: [],
    truncated: false,
    outboundMessagesSkipped: 0,
  });
};

export const resolveInstagramProfile = async (
  accessToken: string,
  instagramUserId: string,
): Promise<InstagramProfile | null> => {
  const profileUrl = new URL(
    `https://graph.instagram.com/${getGraphApiVersion()}/${instagramUserId}`,
  );
  profileUrl.searchParams.set(
    "fields",
    "username,name,biography,followers_count,profile_picture_url",
  );

  const response = await fetch(profileUrl, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) {
    return null;
  }

  const profile = (await response.json()) as InstagramProfileResponse;
  return {
    username: toOptionalString(profile.username),
    name: toOptionalString(profile.name),
    biography: toOptionalString(profile.biography),
    followersCount: toOptionalNumber(profile.followers_count),
    profilePictureUrl: toOptionalString(profile.profile_picture_url),
  };
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
