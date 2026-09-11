"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useState } from "react";

interface LoginResponse {
  message: string;
  requestId?: string;
}

interface LoginFormProps {
  initialMessage?: string;
}

export default function LoginForm({ initialMessage = "" }: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState(initialMessage);
  const [submitting, setSubmitting] = useState(false);

  const submitLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setMessage("");
    try {
      const response = await fetch("/api/instagram/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const result = (await response.json()) as LoginResponse;
      const reference = result.requestId
        ? ` Reference: ${result.requestId}`
        : "";
      setMessage(
        response.ok ? result.message : `${result.message}${reference}`,
      );
    } catch {
      setMessage("Unable to send the access link.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Instagram inbox</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={submitLogin} className="space-y-4">
          <Input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Your authorized email"
            required
          />
          <Button type="submit" disabled={submitting} className="w-full">
            {submitting ? "Sending…" : "Send access link"}
          </Button>
          {message && (
            <p className="text-sm text-muted-foreground">{message}</p>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
