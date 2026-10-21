import Navbar from "@/components/layout/Navbar/Navbar";
import Hero from "@/components/sections/Hero/Hero";
import ProofStrip from "@/components/sections/ProofStrip/ProofStrip";
import Problem from "@/components/sections/Problem/Problem";
import Audiences from "@/components/sections/Audiences/Audiences";
import Services from "@/components/sections/Services/Services";
import Process from "@/components/sections/Process/Process";
import Work from "@/components/sections/Work/Work";
import Packs from "@/components/sections/Packs/Packs";
import Why from "@/components/sections/Why/Why";
import Faq from "@/components/sections/Faq/Faq";
import CtaBand from "@/components/sections/CtaBand/CtaBand";
import Reveal from "@/components/ui/Reveal/Reveal";

// The Home page = a list of sections, top to bottom (the Footer comes from the
// root layout, so every page has it).
export default function Home() {
  return (
    <>
      <Navbar currentPath="/" />
      <main>
        {/* The Hero is the first thing seen, so it is NOT wrapped. Every section
            below is wrapped in <Reveal>: it slides up when scrolled into view. */}
        <Hero />
        <Reveal>
          <ProofStrip />
        </Reveal>
        <Reveal>
          <Problem />
        </Reveal>
        <Reveal>
          <Audiences />
        </Reveal>
        <Reveal>
          <Services />
        </Reveal>
        <Reveal>
          <Process />
        </Reveal>
        <Reveal>
          <Work />
        </Reveal>
        <Reveal>
          <Packs />
        </Reveal>
        <Reveal>
          <Why />
        </Reveal>
        <Reveal>
          <Faq />
        </Reveal>
        <Reveal>
          <CtaBand />
        </Reveal>
      </main>
    </>
  );
}
