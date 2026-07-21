import { motion } from "framer-motion";
import { Link } from "wouter";
import { MainLayout } from "@/layouts/MainLayout";
import { Button } from "@/components/ui/button";
import glassImagePath from "../../assets/glass2.png";
import fabricsImagePath from "../../assets/fabrics.png";
import woodImagePath from "../../assets/wood.png";
import leatherImagePath from "../../assets/leather.png";

export default function HomeCoatingPage() {
  const products = [
    {
      name: "Glass",
      type: "Nano Ceramic Coating for Glass",
      durability: "2 Years",
      description: "Superior hydrophobic protection for all glass surfaces, making them easier to clean and resistant to water spots.",
      image: glassImagePath,
    },
    {
      name: "Fabric",
      type: "Nano Ceramic Coating for Fabric",
      durability: "2 Years",
      description: "Shields fabrics from stains and liquids while maintaining breathability and the natural feel of the material.",
      image: fabricsImagePath,
    },
    {
      name: "Wood",
      type: "Nano Ceramic Coating for Wood",
      durability: "2 Years",
      description: "Enhances the natural beauty of wood while providing protection against moisture, UV damage, and staining.",
      image: woodImagePath,
    },
    {
      name: "Leather",
      type: "Nano Ceramic Coating for Leather",
      durability: "2 Years",
      description: "Preserves leather surfaces against cracking, fading, and liquid damage without altering the material's natural properties.",
      image: leatherImagePath,
    },
  ];

  const features = [
    {
      title: "Water & Stain Repellent",
      description: "Creates an invisible barrier that repels water, oils, and stains, keeping surfaces cleaner for longer.",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
        </svg>
      )
    },
    {
      title: "Chemical Resistance",
      description: "Protects surfaces from harsh cleaning chemicals, acids, and alkalis that can damage natural materials.",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
        </svg>
      )
    },
    {
      title: "Mold & Mildew Prevention",
      description: "Inhibits the growth of mold and mildew on coated surfaces, particularly important in bathroom and kitchen areas.",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      )
    },
    {
      title: "UV Resistance",
      description: "Prevents fading and deterioration from sun exposure, preserving the natural beauty of your surfaces.",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      )
    }
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
                P91 Home Care
              </h1>
              <p className="text-xl md:text-2xl text-white/80 mb-8">
                Premium Protection for Your Living Spaces.
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
                Explore beyond vehicles with our Home Series, designed to protect and preserve your living spaces. Our Nano Ceramic Coating solutions are developed to enhance the durability and aesthetics of a wide range of household surfaces.
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
                Our Home Series Range
              </motion.h2>
              <motion.p variants={fadeIn} className="text-neutral-600 max-w-3xl mx-auto text-lg">
                Specialized protection for the surfaces that matter most in your home.
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
                  <div className="w-full h-[220px] bg-neutral-100 relative overflow-hidden">
                    {product.image && (
                      <img 
                        src={product.image}
                        alt={`${product.name} - P91 Home Series Coating`}
                        className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                      />
                    )}
                    {!product.image && (
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="text-neutral-400 text-sm">Product Image</div>
                      </div>
                    )}
                  </div>
                  
                  {/* Product Details */}
                  <div className="relative p-6">
                    <h3 className="font-header text-2xl font-bold mb-2 text-neutral-900">{product.name}</h3>
                    <div className="text-sm text-primary font-medium mb-4">{product.type}</div>
                    
                    <div className="bg-neutral-50 p-4 rounded mb-6">
                      <div className="text-sm text-neutral-500 mb-1">Durability</div>
                      <div className="font-bold text-neutral-900">{product.durability}</div>
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
        
        {/* Features Section */}
        <section className="py-20 bg-neutral-900 text-white">
          <div className="container mx-auto px-4 max-w-6xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="font-header text-4xl font-bold mb-6 text-white">Why Choose P91 Home Care</h2>
              <p className="text-white/80 max-w-3xl mx-auto">
                Our home care products provide exceptional benefits that protect your surfaces while enhancing their appearance.
              </p>
            </motion.div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="bg-neutral-800 p-6 rounded-lg"
                >
                  <div className="flex flex-col items-center text-center">
                    <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mb-4">
                      {feature.icon && <div className="text-primary">{feature.icon}</div>}
                    </div>
                    <h3 className="text-lg font-bold mb-2 text-white">{feature.title}</h3>
                    <p className="text-white/80 text-sm">{feature.description}</p>
                  </div>
                </motion.div>
              ))}
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
              Ready to Protect Your Home?
            </motion.h2>
            
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
              className="text-neutral-600 mb-10 text-lg"
            >
              Schedule a consultation today and discover how P91 Home Care
              can transform and protect your living spaces.
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
