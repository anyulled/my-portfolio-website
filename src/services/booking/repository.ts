import { createClient } from "@supabase/supabase-js";
import type { FormValues } from "@/app/booking-a-session/types";

const getRequiredEnvironmentValue = (
  name: "SUPABASE_URL" | "SUPABASE_SERVICE_ROLE_KEY",
) => {
  const value =
    name === "SUPABASE_URL"
      ? process.env.SUPABASE_URL
      : process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!value) {
    throw new Error(`${name} is required`);
  }
  return value;
};

const getBookingDatabase = () =>
  createClient(
    getRequiredEnvironmentValue("SUPABASE_URL"),
    getRequiredEnvironmentValue("SUPABASE_SERVICE_ROLE_KEY"),
    { auth: { autoRefreshToken: false, persistSession: false } },
  );

const findSourceConversation = async (
  database: ReturnType<typeof getBookingDatabase>,
  leadCorrelationToken: string | null,
) => {
  if (!leadCorrelationToken) {
    return null;
  }

  const result = await database
    .from("instagram_conversations")
    .select("instagram_conversation_id, instagram_accounts(handle)")
    .eq("response_correlation_token", leadCorrelationToken)
    .maybeSingle();
  if (result.error) {
    throw result.error;
  }

  return result.data as {
    instagram_conversation_id: string;
    instagram_accounts: Array<{ handle: string }>;
  } | null;
};

export const persistBookingSubmission = async (
  values: FormValues,
  leadCorrelationToken: string | null,
) => {
  const database = getBookingDatabase();
  const sourceConversation = await findSourceConversation(
    database,
    leadCorrelationToken,
  );
  const sourceAccount = sourceConversation?.instagram_accounts[0];
  const { data, error } = await database
    .from("model_booking_submissions")
    .insert({
      lead_correlation_token: leadCorrelationToken,
      source_account_handle: sourceAccount?.handle ?? null,
      source_conversation_id:
        sourceConversation?.instagram_conversation_id ?? null,
      full_name: values.fullName,
      social_account: values.socialAccount,
      email: values.email,
      country: values.country,
      height: Number(values.height),
      chest: Number(values.chest),
      waist: Number(values.waist),
      hips: Number(values.hips),
      tattoos: values.tattoos ?? null,
      hair_color: values.hairColor,
      eye_color: values.eyeColor,
      implants: values.implants,
      start_date: values.startDate,
      end_date: values.endDate,
      rates: values.rates,
      model_release: values.modelRelease,
      payment_types: values.paymentTypes,
    })
    .select("id")
    .single();

  if (error || !data) {
    throw error ?? new Error("Booking submission was not persisted");
  }

  return data.id as string;
};

export const updateBookingEmailState = async (
  submissionId: string,
  state: "sent" | "failed",
  errorMessage?: string,
) => {
  const database = getBookingDatabase();
  const { error } = await database
    .from("model_booking_submissions")
    .update({ email_state: state, email_error: errorMessage ?? null })
    .eq("id", submissionId);

  if (error) {
    throw error;
  }
};
