import { AboutSection } from "@/components/about/AboutSection";

export default function AboutPage() {
  return (
    <div className="pt-20">
      <div className="bg-black text-white py-20 mb-8">
        <div className="container mx-auto px-4 text-center">
          <h1 className="font-header font-bold text-4xl md:text-5xl mb-4 text-white">About P91 India</h1>
          <p className="text-white max-w-2xl mx-auto">
            Premium automotive and home protection solutions for those who demand excellence
          </p>
        </div>
      </div>
      <AboutSection />
    </div>
  );
}
