"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type {
  InstagramConversationRecord,
  ReviewDecision,
} from "@/services/instagram/types";
import { useEffect, useState } from "react";

interface InboxError {
  message: string;
  requestId?: string;
  resolution?: string;
}

const reviewDecisions: Array<{ value: ReviewDecision; label: string }> = [
  { value: "model_form", label: "Send model form" },
  { value: "pricing", label: "Send pricing" },
  { value: "ignore", label: "Ignore" },
];

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const getInboxError = (result: unknown): InboxError => {
  if (!isRecord(result)) {
    return { message: "Unable to load conversations." };
  }

  return {
    message:
      typeof result.message === "string"
        ? result.message
        : "Unable to load conversations.",
    requestId:
      typeof result.requestId === "string" ? result.requestId : undefined,
    resolution:
      typeof result.resolution === "string" ? result.resolution : undefined,
  };
};

const getConversations = (
  result: unknown,
): InstagramConversationRecord[] | null => {
  if (!isRecord(result) || !Array.isArray(result.conversations)) {
    return null;
  }

  return result.conversations as InstagramConversationRecord[];
};

export default function InstagramInbox() {
  const [conversations, setConversations] = useState<
    InstagramConversationRecord[]
  >([]);
  const [error, setError] = useState<InboxError | null>(null);

  const loadConversations = async () => {
    setError(null);

    try {
      const response = await fetch("/api/instagram/conversations");
      const result: unknown = await response.json();

      if (!response.ok) {
        setError(getInboxError(result));
        return;
      }

      const nextConversations = getConversations(result);
      if (nextConversations) {
        setConversations(nextConversations);
        return;
      }

      setError({ message: "The inbox returned an invalid response." });
    } catch {
      setError({
        message: "Unable to reach the Instagram inbox.",
        resolution: "Check your connection and retry.",
      });
    }
  };

  useEffect(() => {
    void loadConversations();
  }, []);

  const decide = async (conversationId: string, decision: ReviewDecision) => {
    const response = await fetch(
      `/api/instagram/conversations/${conversationId}/decision`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision }),
      },
    );
    if (!response.ok) {
      setError({ message: "Unable to apply the decision. Please retry." });
      return;
    }
    setConversations((current) =>
      current.filter((conversation) => conversation.id !== conversationId),
    );
  };

  return (
    <main className="mx-auto max-w-5xl space-y-6 px-6 py-12">
      <div>
        <h1 className="text-3xl font-semibold">Instagram inbox</h1>
        <p className="text-muted-foreground">
          Review ambiguous conversations from both accounts.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <a href="/api/instagram/oauth/start?account=anyulled">
              Connect @anyulled
            </a>
          </Button>
          <Button asChild variant="outline">
            <a href="/api/instagram/oauth/start?account=sensuelleboudoir">
              Connect @sensuelleboudoir
            </a>
          </Button>
        </div>
      </div>
      {error && (
        <div className="space-y-2 text-sm text-destructive" role="alert">
          <p>{error.message}</p>
          {error.resolution && <p>{error.resolution}</p>}
          {error.requestId && <p>Reference: {error.requestId}</p>}
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => void loadConversations()}>
              Retry loading conversations
            </Button>
            {error.message.includes("session has expired") && (
              <Button asChild variant="outline">
                <a href="/instagram/login">Sign in again</a>
              </Button>
            )}
          </div>
        </div>
      )}
      {!error && conversations.length === 0 && (
        <p>No conversations need attention.</p>
      )}
      {conversations.map((conversation) => (
        <Card key={conversation.id}>
          <CardHeader>
            <CardTitle className="flex flex-wrap items-center justify-between gap-2 text-xl">
              <span>
                @
                {conversation.participantUsername ?? conversation.participantId}
              </span>
              <span className="text-sm font-normal text-muted-foreground">
                {conversation.accountHandle} · {conversation.detectedLanguage}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>{conversation.lastMessage}</p>
            <p className="text-sm text-muted-foreground">
              Classification: {conversation.classification} · confidence{" "}
              {conversation.confidence}
            </p>
            <div className="flex flex-wrap gap-2">
              {reviewDecisions.map((decision) => (
                <Button
                  key={decision.value}
                  variant={decision.value === "ignore" ? "outline" : "default"}
                  onClick={() => void decide(conversation.id, decision.value)}
                >
                  {decision.label}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </main>
  );
}
