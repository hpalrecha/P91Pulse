import { motion } from "framer-motion";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { MainLayout } from "@/layouts/MainLayout";

export default function AutomotiveCoatingPage() {
  const features = [
    {
      title: "9H Hardness",
      description: "Our ceramic coating provides extreme surface hardness (9H on the pencil scale), protecting against minor scratches and swirl marks.",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      )
    },
    {
      title: "Hydrophobic Effect",
      description: "Creates an incredible water-repelling surface that prevents water spots and makes cleaning your vehicle effortless.",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
        </svg>
      )
    },
    {
      title: "UV Protection",
      description: "Shields your paint from harmful ultraviolet rays, preventing oxidation and fading for years of protection.",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      )
    },
    {
      title: "Chemical Resistance",
      description: "Protects against chemical stains and etching from environmental contaminants like bird droppings, bug splatter, and tree sap.",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
        </svg>
      )
    }
  ];

  const packages = [
    {
      name: "Gloss Pro",
      description: "Entry-level ceramic protection with up to 3 years of durability",
      warranty: "3 Years",
      features: [
        "9H Hardness Protection",
        "Hydrophobic Properties",
        "UV Resistance",
        "Chemical Resistance",
        "Enhanced Gloss Finish"
      ]
    },
    {
      name: "Elite Shield",
      description: "Advanced formula with enhanced durability and appearance",
      warranty: "5 Years",
      features: [
        "Enhanced 9H Hardness Protection",
        "Superior Hydrophobic Properties",
        "Advanced UV Resistance",
        "Chemical & Stain Resistance",
        "Ultra Gloss Finish",
        "Anti-Static Properties"
      ]
    },
    {
      name: "Quantum Series",
      description: "Our flagship ceramic coating with maximum protection",
      warranty: "7 Years",
      features: [
        "Ultimate 9H+ Hardness Protection",
        "Extreme Hydrophobic Effect",
        "Maximum UV Protection",
        "Superior Chemical Resistance",
        "Mirror-Like Gloss Enhancement",
        "Anti-Static Properties",
        "Heat Resistance",
        "Infrared Rejection Technology"
      ]
    }
  ];

  return (
      <div className="pt-24">
        {/* Hero Section */}
        <section className="relative h-[50vh] md:h-[60vh] bg-neutral-900 flex items-center">
          <div className="absolute inset-0 bg-black/60 z-10"></div>
          <div className="container mx-auto px-4 relative z-20 text-white">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="max-w-3xl mx-auto text-center"
            >
              <h1 className="font-header text-5xl md:text-6xl font-bold mb-6 text-white">
                Automotive Ceramic Coating
              </h1>
              <p className="text-xl md:text-2xl text-white/80 mb-8">
                Next-generation paint protection with unmatched gloss and durability.
              </p>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.6 }}
              >
                <Link href="/contact" className="inline-block px-10 py-4 bg-primary text-white font-medium tracking-wide uppercase text-sm hover:bg-primary/90 transition-colors">
                  Schedule Application
                </Link>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Product Overview */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row items-center gap-12">
              <div className="w-full md:w-1/2">
                <div className="relative rounded-xl overflow-hidden shadow-lg h-[500px]">
                  <img 
                    src="https://images.unsplash.com/photo-1619588346361-a2144b6c0dfc?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&h=1000&q=80"
                    alt="Ceramic coating application" 
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
              
              <div className="w-full md:w-1/2">
                <div className="max-w-lg">
                  <h2 className="font-header font-bold text-3xl md:text-4xl mb-6">The Ultimate Paint Protection</h2>
                  <div className="space-y-4">
                    <p className="text-neutral-500">
                      P91 India's Automotive Ceramic Coating is a liquid polymer that chemically bonds with your vehicle's paint to create a permanent protective layer that won't wash away or break down over time.
                    </p>
                    <p className="text-neutral-500">
                      Unlike traditional waxes and sealants that require frequent reapplication, our ceramic coating provides years of protection with a single professional application, maintaining its gloss and protective properties for the long term.
                    </p>
                    <p className="text-neutral-500">
                      The revolutionary hydrophobic properties create a surface that repels water, dirt, and contaminants, making your vehicle easier to clean and maintaining its showroom-new appearance with minimal maintenance.
                    </p>
                  </div>
                  
                  <div className="mt-8">
                    <h3 className="font-header font-bold text-xl mb-4">Why Choose Ceramic Coating?</h3>
                    <ul className="space-y-2">
                      <li className="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                        Long-lasting protection (up to 7 years)
                      </li>
                      <li className="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                        Enhanced gloss and depth of color
                      </li>
                      <li className="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                        Resistance to environmental contaminants
                      </li>
                      <li className="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                        Easier maintenance and cleaning
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-20 bg-neutral-100">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="font-header font-bold text-3xl md:text-4xl mb-4 text-neutral-900">Key Features & Benefits</h2>
              <p className="text-neutral-600 max-w-3xl mx-auto">
                Our ceramic coating represents the pinnacle of automotive surface protection technology.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {features.map((feature, index) => (
                <div key={index} className="bg-white rounded-lg p-8 shadow-md hover-scale">
                  <div className="mb-4">
                    {feature.icon}
                  </div>
                  <h3 className="font-header font-bold text-xl mb-2">{feature.title}</h3>
                  <p className="text-neutral-600">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Packages */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="font-header font-bold text-3xl md:text-4xl mb-4 text-neutral-900">Protection Packages</h2>
              <p className="text-neutral-600 max-w-3xl mx-auto">
                Choose the perfect level of protection for your vehicle from our range of ceramic coating packages.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {packages.map((pkg, index) => (
                <div key={index} className="border border-neutral-200 rounded-lg overflow-hidden shadow-md hover-scale">
                  <div className="bg-secondary text-white p-6">
                    <h3 className="font-header font-bold text-2xl mb-1">{pkg.name}</h3>
                    <p className="text-white text-sm mb-2">{pkg.description}</p>
                    <div className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      <span className="text-primary font-medium">{pkg.warranty} Warranty</span>
                    </div>
                  </div>
                  <div className="p-6">
                    <ul className="space-y-2">
                      {pkg.features.map((feature, fidx) => (
                        <li key={fidx} className="flex items-start">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                          </svg>
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="mt-6">
                      <Button asChild className="w-full bg-secondary text-white hover:shadow-neon">
                        <Link href="/contact">
                          Request Quote
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Call to Action */}
        <section className="py-20 bg-neutral-900 text-white">
          <div className="container mx-auto px-4 text-center">
            <h2 className="font-header font-bold text-3xl md:text-4xl mb-6 text-white">Experience the Ceramic Difference</h2>
            <p className="text-white/80 max-w-2xl mx-auto mb-8">
              Visit our flagship store for a demonstration or schedule a consultation with our ceramic coating specialists.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Button asChild className="px-8 py-4 bg-primary text-white hover:shadow-neon">
                <Link href="/contact">
                  Book a Consultation
                </Link>
              </Button>
              <Button asChild variant="outline" className="px-8 py-4 border-white text-white hover:bg-white/10">
                <Link href="/warranty">
                  View Warranty Details
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </div>
  );
}