"use client";

import { AuthGate } from "@/components/AuthGate";
import { CadernoApp } from "@/components/CadernoApp";

export default function Home() {
  return <AuthGate>{(session) => <CadernoApp session={session} />}</AuthGate>;
}
