import { useSearchParams } from "next/navigation";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: " Authentication Callback",
};

export default function CallbackPage() {
  const searchParams = useSearchParams();
  const success = searchParams.get("success");

  return (
    <div className="pt-32 text-center w-full">
      {success === "true" ? (
        <h1>Authentication Successful!</h1>
      ) : (
        <h1>Authentication Failed</h1>
      )}
      <p>You can now make requests to the Flickr API.</p>
    </div>
  );
}
