import { motion } from "framer-motion";
import { Link } from "wouter";
import { MainLayout } from "@/layouts/MainLayout";

// Import product images
import p3ImagePath from "../../assets/3.png";
import p5ImagePath from "../../assets/5.png";
import p7ImagePath from "../../assets/7.png";
import graphineImagePath from "../../assets/graphine.png";
import trimImagePath from "../../assets/Trim.png";
import glassImagePath from "../../assets/glass.png";

export default function CeramicCoatingPage() {
  const products = [
    {
      name: "P91 3",
      type: "Nano Ceramic Coating",
      hardness: "9H",
      durability: "3 Years",
      description: "Ideal for daily drivers seeking basic protection with a lasting shine.",
      featured: false,
    },
    {
      name: "P91 5",
      type: "Nano Ceramic Coating",
      hardness: "9H",
      durability: "3 Years",
      description: "Enhanced protection with extended water repellency and gloss.",
      featured: false,
    },
    {
      name: "P91 7",
      type: "Nano Ceramic Coating",
      hardness: "10H",
      durability: "7 Years",
      description: "Long-term shield with ultra-gloss, best suited for premium vehicles.",
      featured: true,
    },
    {
      name: "P91 Graphene",
      type: "Graphene Ceramic Coating",
      hardness: "10H",
      durability: "5 Years",
      description: "Advanced coating infused with graphene for higher heat resistance, slickness, and UV protection.",
      featured: true,
    },
  ];

  const specialtyProducts = [
    {
      name: "P91 Trim",
      application: "Plastic & Rubber Trims",
      durability: "2 Years",
      description: "Restores and protects exterior trims from fading, cracking, and UV damage.",
    },
    {
      name: "P91 Glass",
      application: "Windshields & Windows",
      durability: "2 Years",
      description: "Enhances visibility with superior hydrophobic properties for safe driving in all conditions.",
    },
  ];

  const benefits = [
    "Long-lasting durability (up to 7 years)",
    "Enhanced gloss & color depth",
    "Superior UV & chemical resistance",
    "Easy-to-clean hydrophobic surface",
    "Advanced nano & graphene technology",
  ];

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
      },
    },
  };

  return (
    <MainLayout>
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
                P91 Ceramic Coating
              </h1>
              <p className="text-xl md:text-2xl text-white/80 mb-8">
                Advanced Protection. Lasting Brilliance.
              </p>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.6 }}
              >
                <Link href="/contact" className="inline-block px-10 py-4 bg-primary text-white font-medium tracking-wide uppercase text-sm hover:bg-primary/90 transition-colors">
                  Request Consultation
                </Link>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Introduction Section */}
        <section className="py-20">
          <div className="container mx-auto px-4 max-w-4xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <p className="text-lg md:text-xl text-neutral-600 leading-relaxed">
                At P91, we offer a premium range of ceramic coatings engineered to enhance and protect every aspect of your vehicle. Each product is formulated using advanced nanotechnology to deliver superior gloss, long-lasting durability, and targeted functionality—ensuring a flawless finish and unmatched protection.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Main Products Section */}
        <section className="py-16 bg-neutral-50">
          <div className="container mx-auto px-4 max-w-6xl">
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.3 }}
              className="text-center mb-16"
            >
              <motion.h2 variants={fadeIn} className="font-header text-4xl font-bold mb-6 text-neutral-900">
                Our Ceramic Coating Range
              </motion.h2>
              <motion.p variants={fadeIn} className="text-neutral-600 max-w-3xl mx-auto text-lg">
                Choose the perfect ceramic coating based on your vehicle's needs and desired level of protection.
              </motion.p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {products.map((product, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="bg-white rounded-lg shadow-md overflow-hidden"
                >
                  {/* Product Image */}
                  <div className="w-full h-[250px] bg-neutral-100 relative overflow-hidden">
                    <img 
                      src={product.name === "P91 3" ? p3ImagePath : 
                           product.name === "P91 5" ? p5ImagePath : 
                           product.name === "P91 7" ? p7ImagePath : 
                           product.name === "P91 Graphene" ? graphineImagePath : 
                           "/assets/P91-logo.png"}
                      alt={`${product.name} - P91 Ceramic Coating`}
                      className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                    />
                    {product.featured && (
                      <div className="absolute top-0 right-0 bg-primary text-white px-4 py-1 text-sm font-medium z-10">
                        FEATURED
                      </div>
                    )}
                  </div>
                  
                  {/* Product Details */}
                  <div className={`relative p-6 ${product.featured ? 'bg-primary/5' : ''}`}>
                    <h3 className="font-header text-2xl font-bold mb-2 text-neutral-900">{product.name}</h3>
                    <div className="text-sm text-primary font-medium mb-4">{product.type}</div>
                    
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="bg-neutral-50 p-4 rounded">
                        <div className="text-sm text-neutral-500 mb-1">Hardness</div>
                        <div className="font-bold text-neutral-900">{product.hardness}</div>
                      </div>
                      <div className="bg-neutral-50 p-4 rounded">
                        <div className="text-sm text-neutral-500 mb-1">Durability</div>
                        <div className="font-bold text-neutral-900">{product.durability}</div>
                      </div>
                    </div>
                    
                    <p className="text-neutral-600 mb-6">{product.description}</p>
                    
                    <Link href="/contact" className="inline-block w-full py-3 border border-primary text-primary text-center font-medium hover:bg-primary hover:text-white transition-colors">
                      Request Quote
                    </Link>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
        
        {/* Specialty Products Section */}
        <section className="py-16">
          <div className="container mx-auto px-4 max-w-6xl">
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.3 }}
              className="text-center mb-16"
            >
              <motion.h2 variants={fadeIn} className="font-header text-4xl font-bold mb-6 text-neutral-900">
                Specialty Coatings
              </motion.h2>
              <motion.p variants={fadeIn} className="text-neutral-600 max-w-3xl mx-auto text-lg">
                Complete your vehicle protection with our specialized solutions for trim and glass surfaces.
              </motion.p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {specialtyProducts.map((product, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="bg-white rounded-lg shadow-md overflow-hidden"
                >
                  {/* Product Image */}
                  <div className="w-full h-[250px] bg-neutral-100 relative overflow-hidden">
                    <img 
                      src={product.name === "P91 Trim" ? trimImagePath : 
                           product.name === "P91 Glass" ? glassImagePath : 
                           "/assets/P91-logo.png"}
                      alt={`${product.name} - P91 Specialty Coating`}
                      className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                    />
                  </div>
                  
                  {/* Product Details */}
                  <div className="p-6">
                    <h3 className="font-header text-2xl font-bold mb-2 text-neutral-900">{product.name}</h3>
                    
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="bg-neutral-50 p-4 rounded">
                        <div className="text-sm text-neutral-500 mb-1">Application</div>
                        <div className="font-bold text-neutral-900">{product.application}</div>
                      </div>
                      <div className="bg-neutral-50 p-4 rounded">
                        <div className="text-sm text-neutral-500 mb-1">Durability</div>
                        <div className="font-bold text-neutral-900">{product.durability}</div>
                      </div>
                    </div>
                    
                    <p className="text-neutral-600 mb-6">{product.description}</p>
                    
                    <Link href="/contact" className="inline-block w-full py-3 border border-primary text-primary text-center font-medium hover:bg-primary hover:text-white transition-colors">
                      Request Quote
                    </Link>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
        
        {/* Benefits Section */}
        <section className="py-20 bg-neutral-900 text-white">
          <div className="container mx-auto px-4 max-w-6xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="font-header text-4xl font-bold mb-6 text-white">Why Choose P91 Ceramic Coatings</h2>
              <p className="text-white/80 max-w-3xl mx-auto">
                Our ceramic coatings provide exceptional benefits that protect your vehicle's finish while enhancing its appearance.
              </p>
            </motion.div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {benefits.map((benefit, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="bg-neutral-800 p-6 rounded-lg"
                >
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center mr-4">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <p className="text-lg font-medium">{benefit}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
        
        {/* Application Process Section */}
        <section className="py-20">
          <div className="container mx-auto px-4 max-w-6xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="font-header text-4xl font-bold mb-6 text-neutral-900">Professional Application Process</h2>
              <p className="text-neutral-600 max-w-3xl mx-auto">
                Our ceramic coating is applied by trained professionals following a meticulous process to ensure optimal results.
              </p>
            </motion.div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                viewport={{ once: true }}
                className="bg-white p-6 rounded-lg shadow-sm border border-neutral-100"
              >
                <div className="text-primary text-4xl font-bold mb-4">01</div>
                <h3 className="font-header text-xl font-bold mb-2 text-neutral-900">Surface Preparation</h3>
                <p className="text-neutral-600">Thorough cleaning and decontamination of all surfaces to ensure proper adhesion.</p>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                viewport={{ once: true }}
                className="bg-white p-6 rounded-lg shadow-sm border border-neutral-100"
              >
                <div className="text-primary text-4xl font-bold mb-4">02</div>
                <h3 className="font-header text-xl font-bold mb-2 text-neutral-900">Paint Correction</h3>
                <p className="text-neutral-600">Professional polishing to remove imperfections and restore the paint's original luster.</p>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                viewport={{ once: true }}
                className="bg-white p-6 rounded-lg shadow-sm border border-neutral-100"
              >
                <div className="text-primary text-4xl font-bold mb-4">03</div>
                <h3 className="font-header text-xl font-bold mb-2 text-neutral-900">Coating Application</h3>
                <p className="text-neutral-600">Precise application of ceramic coating layer by layer for maximum coverage and protection.</p>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                viewport={{ once: true }}
                className="bg-white p-6 rounded-lg shadow-sm border border-neutral-100"
              >
                <div className="text-primary text-4xl font-bold mb-4">04</div>
                <h3 className="font-header text-xl font-bold mb-2 text-neutral-900">Curing & Inspection</h3>
                <p className="text-neutral-600">Controlled curing environment and final quality check to ensure perfect results.</p>
              </motion.div>
            </div>
          </div>
        </section>
        
        {/* CTA Section */}
        <section className="py-20 bg-neutral-50">
          <div className="container mx-auto px-4 max-w-4xl text-center">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="font-header text-4xl font-bold mb-8 text-neutral-900"
            >
              Ready to Protect Your Vehicle?
            </motion.h2>
            
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
              className="text-neutral-600 mb-10 text-lg"
            >
              Schedule a consultation today and discover how P91 Ceramic Coatings
              can transform and protect your vehicle's appearance.
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
    </MainLayout>
  );
}