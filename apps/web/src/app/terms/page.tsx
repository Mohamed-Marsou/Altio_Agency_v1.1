import type { Metadata } from "next";
import Navbar from "@/components/layout/Navbar/Navbar";
import LegalPage from "@/components/sections/LegalPage/LegalPage";
import { getLegal } from "@/lib/content";

export const metadata: Metadata = {
  title: "Terms of service | Altio",
  description: "The free design, the payment schedule, free changes, ownership and the Managed pack.",
};

// /terms/ : the terms of service.
export default function TermsPage() {
  return (
    <>
      <Navbar currentPath="/terms/" />
      <main>
        <LegalPage doc={getLegal().terms} />
      </main>
    </>
  );
}
