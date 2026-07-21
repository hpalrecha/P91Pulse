import { Hero } from "@/components/hero/Hero";
import { FeaturedProducts } from "@/components/products/FeaturedProducts";
import { AboutSection } from "@/components/about/AboutSection";
import { FlagshipStore } from "@/components/store/FlagshipStore";
import { InstallerLocatorSection } from "@/components/installers/InstallerLocatorSection";
import { BecomeInstaller } from "@/components/installers/BecomeInstaller";
import { ContactSection } from "@/components/contact/ContactSection";

export default function HomePage() {
  return (
    <>
      <Hero />
      <FeaturedProducts />
      <AboutSection />
      <FlagshipStore />
      <InstallerLocatorSection />
      <BecomeInstaller />
      <ContactSection />
    </>
  );
}
