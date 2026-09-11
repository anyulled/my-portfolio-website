import { getAuthenticatedOperator } from "@/services/instagram/auth";
import { redirect } from "next/navigation";
import InstagramInbox from "./InstagramInbox";

export default async function InstagramPage() {
  const operator = await getAuthenticatedOperator();
  if (!operator) {
    redirect("/instagram/login");
  }

  return <InstagramInbox />;
}
