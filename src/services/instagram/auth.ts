import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const getRequiredEnvironmentValue = (
  name: "SUPABASE_URL" | "SUPABASE_ANON_KEY",
) => {
  const value =
    name === "SUPABASE_URL"
      ? process.env.SUPABASE_URL
      : process.env.SUPABASE_ANON_KEY;
  if (!value) {
    throw new Error(`${name} is required`);
  }
  return value;
};

export const createInstagramAuthClient = async () => {
  const cookieStore = await cookies();
  return createServerClient(
    getRequiredEnvironmentValue("SUPABASE_URL"),
    getRequiredEnvironmentValue("SUPABASE_ANON_KEY"),
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            return undefined;
          }
        },
      },
    },
  );
};

export const getAuthenticatedOperator = async () => {
  const client = await createInstagramAuthClient();
  const { data, error } = await client.auth.getUser();
  const configuredEmail = process.env.INSTAGRAM_ADMIN_EMAIL?.toLowerCase();
  const authenticatedEmail = data.user?.email?.toLowerCase();

  if (error || !authenticatedEmail || !configuredEmail) {
    return null;
  }

  return authenticatedEmail === configuredEmail ? data.user : null;
};
