import dynamic from "next/dynamic";
import { Header } from "@/sections/Header";
import { Hero } from "@/sections/Hero";
import { About } from "@/sections/About";
import { ChatPreview } from "@/sections/ChatPreview";
import { Timeline } from "@/sections/Timeline";
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
        <ChatPreview />
        <Timeline />
        <CTA />
      </main>
      <Footer />
    </>
  );
}
