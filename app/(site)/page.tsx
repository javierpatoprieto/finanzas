import { Hero } from "@/components/Hero";
import { FluidDivider } from "@/components/FluidDivider";
import {
  AboutSection,
  WhatSection,
  WorkSection,
  JourneySection,
  TrustSection,
  CtaSection,
} from "@/components/sections";

// Sincronizado con TONE_BG en Section.tsx — cinema palette
const T = {
  hero:  "#051236",
  about: "#0A1A33",
  what:  "#2A1614",
  work:  "#F2EBD5",
  team:  "#131C2E",
  trust: "#16201A",
};

export default function HomePage() {
  return (
    <>
      <Hero />
      <FluidDivider from={T.hero}  to={T.about} />
      <AboutSection />
      <FluidDivider from={T.about} to={T.what} />
      <WhatSection />
      <FluidDivider from={T.what}  to={T.work} />
      <WorkSection />
      <FluidDivider from={T.work}  to={T.team} />
      <JourneySection />
      <FluidDivider from={T.team}  to={T.trust} />
      <TrustSection />
      <FluidDivider from={T.trust} to={T.hero} />
      <CtaSection />
    </>
  );
}
