import { createBrowserClient } from "@supabase/ssr";

const getRequiredEnvironmentValue = (
  name: "NEXT_PUBLIC_SUPABASE_URL" | "NEXT_PUBLIC_SUPABASE_ANON_KEY",
) => {
  const value =
    name === "NEXT_PUBLIC_SUPABASE_URL"
      ? process.env.NEXT_PUBLIC_SUPABASE_URL
      : process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!value) {
    throw new Error(`${name} is required`);
  }
  return value;
};

export const createInstagramBrowserAuthClient = () =>
  createBrowserClient(
    getRequiredEnvironmentValue("NEXT_PUBLIC_SUPABASE_URL"),
    getRequiredEnvironmentValue("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
  );
