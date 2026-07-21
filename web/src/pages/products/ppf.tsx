import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { MainLayout } from "@/layouts/MainLayout";
import ppfBasicImagePath from "../../assets/ppf-basic.png";
import installingAreaImagePath from "../../assets/installing-area.jpg";

export default function PPFPage() {
  // State for active product tab
  const [activeTab, setActiveTab] = useState("basics");

  // Variants for animations
  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.6 }
    }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  // P91 Basics product details from TDS document
  const basicsDetails = [
    {
      title: "ULTRA-GLOSS FINISH",
      description: "Our P91 Basics film provides a stunning high-gloss finish with a 94.6 GU gloss meter reading at 60°."
    },
    {
      title: "HYDROPHOBIC SURFACE",
      description: "The hydrophobic top coating repels water, making it easier to keep your vehicle clean and maintained."
    },
    {
      title: "SUPERIOR SELF-HEALING",
      description: "100% thermal self-healing technology eliminates light scratches and swirl marks with heat application."
    },
    {
      title: "UV PROTECTION",
      description: "Blocks over 95% of harmful UV rays, preventing paint fading and deterioration over time."
    }
  ];

  // P91 Basics technical specifications from TDS document
  const basicsSpecifications = [
    { property: "Top Film Thickness", value: "52 μm" },
    { property: "Total Thickness", value: "178 μm" },
    { property: "Gloss Level", value: "94.6 GU (Gloss Units)" },
    { property: "UV Rejection", value: "95.8%" },
    { property: "Tensile Strength", value: "21.32 MPa" },
    { property: "Elongation at Break", value: "336.53%" },
    { property: "Surface Type", value: "Hydrophobic" },
    { property: "Self-Healing", value: "100% Thermal Self-Healing" },
    { property: "Warranty", value: "5 Years Limited" }
  ];

  return (
      <div className="pt-20 bg-white">
      {/* Hero Section - Black background with minimal text */}
      <section className="relative h-[80vh] w-full overflow-hidden bg-black">
        <div className="absolute inset-0"></div>
        
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
          <div className="space-y-6">
            <motion.h1 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="font-header text-5xl md:text-7xl text-white font-bold tracking-tight mb-6"
            >
              PAINT PROTECTION FILM
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="text-white/90 text-xl max-w-2xl mx-auto mb-8"
            >
              ULTIMATE PROTECTION FOR YOUR VEHICLE
            </motion.p>
            
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              <Link href="/contact" className="inline-block px-10 py-4 bg-primary text-white font-medium tracking-wide uppercase text-sm hover:bg-primary/90 transition-colors">
                Request Consultation
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Product Selection Tabs */}
      <section className="pt-16 pb-8">
        <div className="container mx-auto px-4 max-w-6xl">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-12"
          >
            <h2 className="font-header text-4xl font-bold mb-6 text-neutral-900">OUR PPF PRODUCT RANGE</h2>
            <p className="text-neutral-600 max-w-3xl mx-auto text-lg">
              Explore our premium paint protection film range, designed to provide the ultimate protection for your vehicle.
            </p>
          </motion.div>

          <Tabs defaultValue="basics" className="w-full" onValueChange={setActiveTab}>
            <TabsList className="flex w-full mb-12 relative z-10 border-none p-1 shadow-md rounded-lg bg-white overflow-hidden">
              <TabsTrigger 
                value="basics" 
                className="flex-1 text-lg py-4 font-semibold data-[state=active]:bg-primary data-[state=active]:text-white rounded-md transition-all duration-300"
              >
                P91 Basics
              </TabsTrigger>
              <TabsTrigger 
                value="prime" 
                className="flex-1 text-lg py-4 font-semibold data-[state=active]:bg-primary data-[state=active]:text-white rounded-md transition-all duration-300"
              >
                P91 Prime
                <span className="ml-2 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded font-medium">Coming Soon</span>
              </TabsTrigger>
              <TabsTrigger 
                value="spectrum" 
                className="flex-1 text-lg py-4 font-semibold data-[state=active]:bg-primary data-[state=active]:text-white rounded-md transition-all duration-300"
              >
                P91 Spectrum
                <span className="ml-2 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded font-medium">Coming Soon</span>
              </TabsTrigger>
            </TabsList>
            
            {/* P91 Basics Content */}
            <TabsContent value="basics" className="mt-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                <motion.div 
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.8 }}
                  className="rounded-lg overflow-hidden shadow-lg"
                >
                  <div className="w-full h-auto relative overflow-hidden">
                    <img 
                      src={ppfBasicImagePath}
                      alt="P91 Basics Paint Protection Film" 
                      className="w-full h-auto object-contain py-6"
                    />
                  </div>
                </motion.div>
                
                <div className="space-y-6">
                  <motion.h3 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.6 }}
                    className="font-header text-3xl font-bold text-neutral-900"
                  >
                    P91 BASICS
                  </motion.h3>
                  
                  <motion.p 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.6, delay: 0.1 }}
                    className="text-neutral-600 text-lg"
                  >
                    Our flagship product, P91 Basics is a premium paint protection film offering top-notch performance, durability, and reliability. Basics top coat is bonded to the film at a molecular level during the manufacturing process, virtually eliminating the need for waxes or after-market top coatings.
                  </motion.p>
                  
                  <motion.p 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="text-neutral-600 text-lg"
                  >
                    Hydrophobic and highly damage-resistant, Basics also boasts super self-healing properties and puncture resistance, effectively shielding against surface-level nicks and scratches. Combined with UV-resistant, anti-yellowing adhesives and an ultra-gloss finish, our technology results in beautiful, long-lasting protection wherever you go.
                  </motion.p>
                  
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                    className="pt-4"
                  >
                    <Link href="/contact" className="btn-premium">
                      Request Quote
                    </Link>
                  </motion.div>
                </div>
              </div>
            </TabsContent>
            
            {/* P91 Prime Content (Coming Soon) */}
            <TabsContent value="prime" className="mt-8">
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.6 }}
                  className="w-32 h-32 rounded-full bg-neutral-100 flex items-center justify-center mb-8"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </motion.div>
                
                <motion.h3 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.6, delay: 0.1 }}
                  className="font-header text-3xl font-bold text-neutral-900 mb-4"
                >
                  P91 PRIME - COMING SOON
                </motion.h3>
                
                <motion.p 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className="text-neutral-600 text-lg max-w-2xl mx-auto mb-8"
                >
                  We're developing our next generation PPF film with enhanced features and properties. 
                  Sign up to be notified when P91 Prime is available.
                </motion.p>
                
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                >
                  <Link href="/contact" className="btn-premium">
                    Notify Me
                  </Link>
                </motion.div>
              </div>
            </TabsContent>
            
            {/* P91 Spectrum Content (Coming Soon) */}
            <TabsContent value="spectrum" className="mt-8">
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.6 }}
                  className="w-32 h-32 rounded-full bg-neutral-100 flex items-center justify-center mb-8"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                  </svg>
                </motion.div>
                
                <motion.h3 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.6, delay: 0.1 }}
                  className="font-header text-3xl font-bold text-neutral-900 mb-4"
                >
                  P91 SPECTRUM - COMING SOON
                </motion.h3>
                
                <motion.p 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className="text-neutral-600 text-lg max-w-2xl mx-auto mb-8"
                >
                  Our upcoming color-shifting and specialty finish PPF line will offer unique 
                  customization options while maintaining our signature protection. 
                  Leave your details to be among the first to experience P91 Spectrum.
                </motion.p>
                
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                >
                  <Link href="/contact" className="btn-premium">
                    Notify Me
                  </Link>
                </motion.div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* Product Features Section */}
      {activeTab === "basics" && (
        <section className="py-20 bg-neutral-50">
          <div className="container mx-auto px-4 max-w-6xl">
            <motion.div 
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.3 }}
              className="text-center mb-16"
            >
              <motion.h2 variants={fadeIn} className="font-header text-4xl font-bold mb-6 text-neutral-900">
                KEY FEATURES OF P91 BASICS
              </motion.h2>
              <motion.p variants={fadeIn} className="text-neutral-600 max-w-3xl mx-auto text-lg leading-relaxed">
                P91 Basics represents the pinnacle of automotive surface protection technology,
                offering unmatched clarity, durability, and self-healing capabilities. Engineered with precision
                to preserve your vehicle's appearance while providing invisible armor against environmental hazards.
              </motion.p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              {basicsDetails.map((detail, index) => (
                <motion.div 
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="bg-white p-8 rounded-lg shadow-sm border border-neutral-100"
                >
                  <h3 className="font-header text-xl font-bold mb-3 text-neutral-900">{detail.title}</h3>
                  <p className="text-neutral-600">{detail.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Technical Specifications - Only show for Basics */}
      {activeTab === "basics" && (
        <section className="py-20 bg-white">
          <div className="container mx-auto px-4 max-w-4xl">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="font-header text-4xl font-bold mb-6 text-neutral-900">TECHNICAL SPECIFICATIONS</h2>
              <p className="text-neutral-600 max-w-3xl mx-auto">
                Every aspect of P91 Basics Paint Protection Film is precisely engineered to deliver 
                optimal performance and longevity.
              </p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="overflow-hidden rounded-lg shadow-sm border border-neutral-200"
            >
              <div className="bg-white">
                {basicsSpecifications.map((spec, index) => (
                  <div 
                    key={index} 
                    className={`flex border-b border-neutral-200 last:border-0 ${index % 2 === 0 ? 'bg-white' : 'bg-neutral-50'}`}
                  >
                    <div className="w-1/2 p-4 font-medium text-neutral-900 border-r border-neutral-200">{spec.property}</div>
                    <div className="w-1/2 p-4 text-neutral-600">{spec.value}</div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>
      )}

      {/* Installation Showcase */}
      <section className="py-24">
        <div className="container mx-auto px-4 max-w-6xl">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="font-header text-4xl font-bold mb-6 text-neutral-900">PROFESSIONAL INSTALLATION</h2>
            <p className="text-neutral-600 max-w-3xl mx-auto">
              Our certified technicians utilize state-of-the-art facilities and proprietary techniques 
              to ensure flawless application of P91 Paint Protection Film.
            </p>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="relative rounded-lg overflow-hidden shadow-lg"
          >
            <div className="w-full h-[500px] relative overflow-hidden">
              <img 
                src={installingAreaImagePath}
                alt="P91 Installation Facility" 
                className="w-full h-full object-cover"
              />
            </div>
          </motion.div>
          
          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              viewport={{ once: true }}
              className="bg-white p-8 rounded-lg shadow-sm border border-neutral-200"
            >
              <div className="text-primary text-4xl font-bold mb-4">01</div>
              <h3 className="font-header text-xl font-bold mb-2">PRECISION CUTTING</h3>
              <p className="text-neutral-600">Computer-designed patterns ensure perfect fitment for every vehicle model.</p>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
              className="bg-white p-8 rounded-lg shadow-sm border border-neutral-200"
            >
              <div className="text-primary text-4xl font-bold mb-4">02</div>
              <h3 className="font-header text-xl font-bold mb-2">CLEAN ENVIRONMENT</h3>
              <p className="text-neutral-600">Controlled installation space eliminates contamination for flawless results.</p>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              viewport={{ once: true }}
              className="bg-white p-8 rounded-lg shadow-sm border border-neutral-200"
            >
              <div className="text-primary text-4xl font-bold mb-4">03</div>
              <h3 className="font-header text-xl font-bold mb-2">EXPERT TECHNICIANS</h3>
              <p className="text-neutral-600">Highly trained specialists with years of experience in film application.</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Coverage Options */}
      <section className="py-20 bg-neutral-900 text-white">
        <div className="container mx-auto px-4 max-w-6xl">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="font-header text-4xl font-bold mb-6 text-white">COVERAGE PACKAGES</h2>
            <p className="text-white/80 max-w-3xl mx-auto">
              Select the level of protection that meets your needs and driving conditions.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              viewport={{ once: true }}
              className="bg-neutral-800 p-8 rounded-lg"
            >
              <h3 className="font-header text-2xl font-bold mb-6 text-primary">PARTIAL FRONT</h3>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Partial Hood</span>
                </li>
                <li className="flex items-start">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Front Fenders (partial)</span>
                </li>
                <li className="flex items-start">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Side Mirrors</span>
                </li>
              </ul>
              <div className="mt-8">
                <Link href="/contact" className="inline-block w-full py-3 border border-primary text-primary text-center font-medium hover:bg-primary hover:text-white transition-colors">
                  Get Quote
                </Link>
              </div>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
              className="bg-neutral-800 p-8 rounded-lg relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 bg-primary text-white px-4 py-1 text-sm font-medium">
                MOST POPULAR
              </div>
              <h3 className="font-header text-2xl font-bold mb-6 text-primary">FULL FRONT</h3>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Complete Hood</span>
                </li>
                <li className="flex items-start">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Front Bumper</span>
                </li>
                <li className="flex items-start">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Front Fenders (complete)</span>
                </li>
                <li className="flex items-start">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Side Mirrors</span>
                </li>
                <li className="flex items-start">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Headlights</span>
                </li>
              </ul>
              <div className="mt-8">
                <Link href="/contact" className="inline-block w-full py-3 border border-primary text-primary text-center font-medium hover:bg-primary hover:text-white transition-colors">
                  Get Quote
                </Link>
              </div>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              viewport={{ once: true }}
              className="bg-neutral-800 p-8 rounded-lg"
            >
              <h3 className="font-header text-2xl font-bold mb-6 text-primary">FULL VEHICLE</h3>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Complete Front Coverage</span>
                </li>
                <li className="flex items-start">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span>All Doors & Side Panels</span>
                </li>
                <li className="flex items-start">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Trunk & Rear Bumper</span>
                </li>
                <li className="flex items-start">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Roof & Pillars</span>
                </li>
                <li className="flex items-start">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span>All Exterior Trim</span>
                </li>
              </ul>
              <div className="mt-8">
                <Link href="/contact" className="inline-block w-full py-3 border border-primary text-primary text-center font-medium hover:bg-primary hover:text-white transition-colors">
                  Get Quote
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4 max-w-4xl text-center">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="font-header text-4xl font-bold mb-8 text-neutral-900"
          >
            PRESERVE YOUR VEHICLE'S PERFECTION
          </motion.h2>
          
          <motion.p 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
            className="text-neutral-600 mb-10 text-lg"
          >
            Schedule a consultation today and discover how P91 Paint Protection Film 
            can safeguard your vehicle's finish for years to come.
          </motion.p>
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            viewport={{ once: true }}
          >
            <Link href="/contact" className="inline-block px-12 py-5 bg-primary text-white font-medium tracking-wide uppercase hover:bg-primary/90 transition-colors">
              Contact Us
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
}