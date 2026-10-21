import type { Metadata } from "next";
import Navbar from "@/components/layout/Navbar/Navbar";
import CtaBand from "@/components/sections/CtaBand/CtaBand";
import FreeDesignSections from "@/components/sections/FreeDesignPage/FreeDesignSections";
import Reveal from "@/components/ui/Reveal/Reveal";
import { getSite } from "@/lib/content";

export const metadata: Metadata = {
  title: "Free design | Altio",
  description:
    "Get a custom homepage design in 48 to 72 hours, free and with no obligation. See your website before you pay.",
};

// The Free design landing page: the offer, a short form, what you get and what
// happens next.
export default function FreeDesignPage() {
  return (
    <>
      <Navbar currentPath="/free-design/" />
      <main>
        <FreeDesignSections whatsappNumber={getSite().whatsappNumber} />
        <Reveal>
          <CtaBand />
        </Reveal>
      </main>
    </>
  );
}
