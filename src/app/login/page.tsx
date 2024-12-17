import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: " Login",
};

export default function LoginPage() {
  return (
    <div className="pt-32 text-center w-full">
      <h1>Login with Flickr</h1>
      <Link href="/api/oauth/request-token">
        <button>Connect to Flickr</button>
      </Link>
    </div>
  );
}
