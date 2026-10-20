import type { Metadata } from "next";
import Navbar from "@/components/layout/Navbar/Navbar";
import CtaBand from "@/components/sections/CtaBand/CtaBand";
import ReferralsSections from "@/components/sections/ReferralsPage/ReferralsSections";
import Reveal from "@/components/ui/Reveal/Reveal";
import { getSite } from "@/lib/content";

export const metadata: Metadata = {
  title: "Referrals | Altio",
  description: "Bring a client, get rewarded. Introduce a business to Altio and choose your reward once they are a client.",
};

// The Referrals page: how it works, the reward choices, the rules and the form.
export default function ReferralsPage() {
  return (
    <>
      <Navbar currentPath="/referrals/" />
      <main>
        <ReferralsSections whatsappNumber={getSite().whatsappNumber} />
        <Reveal>
          <CtaBand />
        </Reveal>
      </main>
    </>
  );
}
