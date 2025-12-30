import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { Testimonial } from "@/lib/testimonials";
import chalk from "chalk";
import { ReadonlyRequestCookies } from "next/dist/server/web/spec-extension/adapters/request-cookies";

const createDbClient = (cookies: ReadonlyRequestCookies) =>
  createServerClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookies.getAll();
        },
        setAll(
          cookie: { name: string; value: string; options: CookieOptions }[],
        ) {
          try {
            for (const { name, value, options } of cookie) {
              cookies.set(name, value, options);
            }
          } catch {
            console.error("Error setting cookies");
          }
        },
      },
    },
  );

export const Testimonials = async (): Promise<Array<Testimonial>> => {
  const cookieStore = await cookies();
  const supabase = createDbClient(cookieStore);

  console.log(chalk.gray("[ supabase ] retrieving testimonials from database"));
  const { data: testimonials, error } = await supabase
    .from("testimonials")
    .select("id, name, content, location, rating, featured, date:created_at")
    .eq("status_id", "2");

  if (error) {
    console.error(
      chalk.red("[ supabase ] Error retrieving testimonials:", error.message),
    );
    return [];
  }
  console.log(
    chalk.green(`[ supabase ] retrieved ${testimonials?.length} testimonies`),
  );

  return testimonials || [];
};

export interface PricingPackageRecord {
  id: string;
  inserted_at: string;
  express_price: number | null;
  experience_price: number | null;
  deluxe_price: number | null;
}

export type PricingPackageInsert = {
  express_price: number | null;
  experience_price: number | null;
  deluxe_price: number | null;
};

export const getLatestPricing =
  async (): Promise<PricingPackageRecord | null> => {
    const cookieStore = await cookies();
    const supabase = createDbClient(cookieStore);

    console.log(
      chalk.gray("[ supabase ] retrieving latest pricing from database"),
    );
    const { data, error } = await supabase
      .from("pricing_packages")
      .select("id, inserted_at, express_price, experience_price, deluxe_price")
      .order("inserted_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error(
        chalk.red(
          "[ supabase ] Error retrieving latest pricing:",
          error.message,
        ),
      );
      return null;
    }

    if (!data) {
      console.log(chalk.yellow("[ supabase ] No pricing packages found"));
      return null;
    }

    return data;
  };

export const insertPricing = async (
  prices: PricingPackageInsert,
): Promise<PricingPackageRecord | null> => {
  const cookieStore = await cookies();
  const supabase = createDbClient(cookieStore);

  console.log(chalk.gray("[ supabase ] inserting pricing packages"));
  const { data, error } = await supabase
    .from("pricing_packages")
    .insert(prices)
    .select("id, inserted_at, express_price, experience_price, deluxe_price")
    .single();

  if (error) {
    console.error(
      chalk.red(
        "[ supabase ] Error inserting pricing packages:",
        error.message,
      ),
    );
    return null;
  }

  return data;
};
