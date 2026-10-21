import type { Metadata } from "next";
import Navbar from "@/components/layout/Navbar/Navbar";
import AboutBody from "@/components/sections/AboutPage/AboutBody";
import AboutHero from "@/components/sections/AboutPage/AboutHero";
import CtaBand from "@/components/sections/CtaBand/CtaBand";
import Reveal from "@/components/ui/Reveal/Reveal";

export const metadata: Metadata = {
  title: "About | Altio",
  description:
    "Altio is an agency of full-stack engineers and designers in Tangier. We design first, build properly and stay reachable after launch.",
};

// The About page: hero, the facts, our story, principles, how the team works,
// where we are, and the closing call to action. The Footer comes from the layout.
export default function AboutPage() {
  return (
    <>
      <Navbar currentPath="/about/" />
      <main>
        <AboutHero />
        <AboutBody />
        <Reveal>
          <CtaBand />
        </Reveal>
      </main>
    </>
  );
}
