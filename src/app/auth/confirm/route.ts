import { createInstagramAuthClient } from "@/services/instagram/auth";
import { NextResponse } from "next/server";

const getErrorDetails = (error: unknown) => {
  if (error instanceof Error) {
    return { name: error.name, message: error.message };
  }

  return { name: "UnknownError", message: String(error) };
};

export async function GET(request: Request) {
  const url = new URL(request.url);
  const requestId = crypto.randomUUID();
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type");
  const code = url.searchParams.get("code");
  const redirectUrl = new URL("/instagram", url.origin);

  const confirmationError = await (async () => {
    try {
      if (code) {
        const client = await createInstagramAuthClient();
        const { error } = await client.auth.exchangeCodeForSession(code);
        if (!error) {
          console.info(
            JSON.stringify({
              event: "instagram_auth_confirmation_succeeded",
              flow: "code",
              requestId,
            }),
          );
          return null;
        }

        return error;
      }

      if (tokenHash && (type === "email" || type === "invite")) {
        const client = await createInstagramAuthClient();
        const { error } = await client.auth.verifyOtp({
          token_hash: tokenHash,
          type,
        });
        if (!error) {
          console.info(
            JSON.stringify({
              event: "instagram_auth_confirmation_succeeded",
              flow: type,
              requestId,
            }),
          );
          return null;
        }

        return error;
      }

      return new Error("Unsupported confirmation parameters");
    } catch (error) {
      return error;
    }
  })();

  if (!confirmationError) {
    return NextResponse.redirect(redirectUrl);
  }

  console.error(
    JSON.stringify({
      event: "instagram_auth_confirmation_failed",
      flow: code
        ? "code"
        : tokenHash
          ? (type ?? "token_hash")
          : "missing_parameters",
      requestId,
      error: getErrorDetails(confirmationError),
    }),
  );

  redirectUrl.pathname = "/instagram/login";
  redirectUrl.searchParams.set("error", "confirmation_failed");
  redirectUrl.searchParams.set("reference", requestId);
  return NextResponse.redirect(redirectUrl);
}
