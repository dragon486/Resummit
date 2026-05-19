import { auth } from "@/auth";
import { LandingClient } from "./LandingClient";

export default async function Page() {
  const session = await auth();

  return <LandingClient hasSession={!!session?.user} />;
}
