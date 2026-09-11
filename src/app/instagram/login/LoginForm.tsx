"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { createInstagramBrowserAuthClient } from "@/services/instagram/browserAuth";
import { useState } from "react";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submitLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setMessage("");
    const client = createInstagramBrowserAuthClient();
    const { error } = await client.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: false,
        emailRedirectTo: `${window.location.origin}/auth/confirm`,
      },
    });
    setMessage(
      error
        ? "Unable to send the access link."
        : "Check your email for the access link.",
    );
    setSubmitting(false);
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
