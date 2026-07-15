import dynamic from "next/dynamic";
import { AgentConsole } from "@/components/agent/AgentConsole";
import { Footer } from "@/sections/Footer";
import { Header } from "@/sections/Header";

const SpaceScene = dynamic(() => import("@/components/three/SpaceScene"));

export default function AgentDemoPage() {
  return (
    <>
      <SpaceScene />
      <Header />
      <main>
        <AgentConsole />
      </main>
      <Footer />
    </>
  );
}
