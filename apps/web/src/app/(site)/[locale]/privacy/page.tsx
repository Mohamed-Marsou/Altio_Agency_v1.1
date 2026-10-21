import type { Metadata } from "next";
import Navbar from "@/components/layout/Navbar/Navbar";
import LegalPage from "@/components/sections/LegalPage/LegalPage";
import { getLegal } from "@/lib/content";

export const metadata: Metadata = {
  title: "Privacy and cookies | Altio",
  description: "What data Altio collects (almost none today), how we use it, and your rights.",
};

// /privacy/ : the privacy policy, with the cookies section inside it.
export default function PrivacyPage() {
  return (
    <>
      <Navbar currentPath="/privacy/" />
      <main>
        <LegalPage doc={getLegal().privacy} />
      </main>
    </>
  );
}
