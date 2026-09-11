import LoginForm from "./LoginForm";

interface InstagramLoginPageProps {
  searchParams: Promise<{
    error?: string;
    reference?: string;
  }>;
}

export default async function InstagramLoginPage({
  searchParams,
}: InstagramLoginPageProps) {
  const params = await searchParams;
  const initialMessage =
    params.error === "confirmation_failed"
      ? `The access link could not be confirmed. Request a new one.${
          params.reference ? ` Reference: ${params.reference}` : ""
        }`
      : undefined;

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-md items-center px-6 py-12">
      <LoginForm initialMessage={initialMessage} />
    </main>
  );
}
