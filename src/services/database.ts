import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { Testimonial } from "@/lib/testimonials";
import chalk from "chalk";
import {
  ReadonlyRequestCookies
} from "next/dist/server/web/spec-extension/adapters/request-cookies";

function createDbCLient(cookies: ReadonlyRequestCookies) {
  return createServerClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookies.getAll();
        },
        setAll(cookie) {
          try {
            cookie.forEach(({ name, value, options }) =>
              cookies.set(name, value, options)
            );
          } catch {
            console.error("Error setting cookies");
          }
        },
      },
    },
  );
}

export async function Testimonials(): Promise<Array<Testimonial>> {
  const cookieStore = await cookies();
  const supabase = createDbCLient(cookieStore);

  console.log(chalk.gray("[ supabase ] retrieving testimonials from database"));
  const { data: testimonials, error } = await supabase
    .from("testimonials")
    .select("id, name, content, location, rating, featured, date:created_at")
    .eq("status_id", "2");

  if (error) {
    console.error(
      chalk.red("[ supabase ] Error retrieving testimonials:", error.message)
    );
    return [];
  }
  console.log(
    chalk.green(`[ supabase ] retrieved ${testimonials?.length} testimonies`)
  );

  return testimonials || [];
}
