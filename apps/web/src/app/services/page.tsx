import type { Metadata } from "next";
import Navbar from "@/components/layout/Navbar/Navbar";
import CtaBand from "@/components/sections/CtaBand/CtaBand";
import ProofStrip from "@/components/sections/ProofStrip/ProofStrip";
import Included from "@/components/sections/ServicesPage/Included";
import ServiceBlock from "@/components/sections/ServicesPage/ServiceBlock";
import ServicesHero from "@/components/sections/ServicesPage/ServicesHero";
import Reveal from "@/components/ui/Reveal/Reveal";
import { getServicesPage } from "@/lib/content";

export const metadata: Metadata = {
  title: "Services | Altio",
  description:
    "Business websites, online stores, web apps and managed care for businesses in Morocco. Every service starts with a free design.",
};

// The Services page: hero, the trust strip, the four services (one per pack),
// what every pack includes, and the closing call to action. The Footer comes
// from the root layout. Every section below the hero slides up with <Reveal>.
export default function ServicesPage() {
  const { items } = getServicesPage();

  return (
    <>
      <Navbar currentPath="/services/" />
      <main>
        <ServicesHero />
        <Reveal>
          <ProofStrip />
        </Reveal>
        {items.map((item, index) => (
          <Reveal key={item.id}>
            <ServiceBlock item={item} index={index} />
          </Reveal>
        ))}
        <Reveal>
          <Included />
        </Reveal>
        <Reveal>
          <CtaBand />
        </Reveal>
      </main>
    </>
  );
}
