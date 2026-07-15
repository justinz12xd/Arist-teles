import dynamic from "next/dynamic";
import { Header } from "@/sections/Header";
import { Hero } from "@/sections/Hero";
import { About } from "@/sections/About";
import { Timeline } from "@/sections/Timeline";
import { Tracks } from "@/sections/Tracks";
import { Prizes } from "@/sections/Prizes";
import { Speakers } from "@/sections/Speakers";
import { Partners } from "@/sections/Partners";
import { FAQ } from "@/sections/FAQ";
import { CTA } from "@/sections/CTA";
import { Footer } from "@/sections/Footer";

const SpaceScene = dynamic(() => import("@/components/three/SpaceScene"));

export default function Home() {
  return (
    <>
      <SpaceScene />
      <Header />
      <main>
        <Hero />
        <About />
        <Timeline />
        <Tracks />
        <Prizes />
        <Speakers />
        <Partners />
        <FAQ />
        <CTA />
      </main>
      <Footer />
    </>
  );
}
