import Navbar from "@/components/layout/Navbar/Navbar";
import Hero from "@/components/sections/Hero/Hero";
import Audiences from "@/components/sections/Audiences/Audiences";
import Problem from "@/components/sections/Problem/Problem";
import Reveal from "@/components/ui/Reveal/Reveal";

// The Home page = a list of sections, top to bottom. We add one per step.
export default function Home() {
  return (
    <>
      <Navbar currentPath="/" />
      <main>
        {/* The Hero is the first thing seen, so it is NOT wrapped. Every section
            below is wrapped in <Reveal>: it slides up when scrolled into view. */}
        <Hero />
        <Reveal>
          <Problem />
        </Reveal>
        <Reveal>
          <Audiences />
        </Reveal>
      </main>
    </>
  );
}
