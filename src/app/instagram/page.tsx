import { getAuthenticatedOperator } from "@/services/instagram/auth";
import {
  getInstagramDatabase,
  listConnectedInstagramAccounts,
} from "@/services/instagram/repository";
import { redirect } from "next/navigation";
import InstagramInbox from "./InstagramInbox";

interface InstagramPageProps {
  searchParams: Promise<{
    error?: string;
    reference?: string;
  }>;
}

export default async function InstagramPage({
  searchParams,
}: InstagramPageProps) {
  const operator = await getAuthenticatedOperator();
  if (!operator) {
    redirect("/instagram/login");
  }

  const connectedAccounts = await listConnectedInstagramAccounts(
    getInstagramDatabase(),
  );

  const params = await searchParams;
  const connectionError =
    params.error === "oauth_failed"
      ? { reference: params.reference }
      : undefined;

  return (
    <InstagramInbox
      connectionError={connectionError}
      connectedAccounts={connectedAccounts}
    />
  );
}
