"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type {
  InstagramConversationRecord,
  ReviewDecision,
} from "@/services/instagram/types";
import { useEffect, useState } from "react";

const reviewDecisions: Array<{ value: ReviewDecision; label: string }> = [
  { value: "model_form", label: "Send model form" },
  { value: "pricing", label: "Send pricing" },
  { value: "ignore", label: "Ignore" },
];

export default function InstagramInbox() {
  const [conversations, setConversations] = useState<
    InstagramConversationRecord[]
  >([]);
  const [error, setError] = useState("");

  const loadConversations = async () => {
    const response = await fetch("/api/instagram/conversations");
    if (!response.ok) {
      setError("Unable to load conversations.");
      return;
    }
    const result: unknown = await response.json();
    if (
      typeof result === "object" &&
      result !== null &&
      "conversations" in result
    ) {
      setConversations(
        (result as { conversations: InstagramConversationRecord[] })
          .conversations,
      );
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
      setError("Unable to apply the decision.");
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
            <a href="/api/instagram/oauth/start?account=sensuelleboidoir">
              Connect @sensuelleboidoir
            </a>
          </Button>
        </div>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      {conversations.length === 0 && <p>No conversations need attention.</p>}
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
