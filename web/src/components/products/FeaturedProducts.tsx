import { Link } from "wouter";
import { motion } from "framer-motion";

export function FeaturedProducts() {
  const products = [
    {
      id: "ppf",
      title: "Paint Protection Film (PPF)",
      description: "Virtually invisible urethane film that protects vehicle paint from stone chips, bug stains, and minor abrasions.",
      image: "/assets/ppf.png",
      link: "/products/ppf",
      features: ["Self-healing technology", "10-year warranty", "Invisible protection"]
    },
    {
      id: "automotive-coating",
      title: "Automotive Ceramic Coating",
      description: "Liquid polymer that creates a permanent bond with vehicle paint, providing superior protection and shine.",
      image: "/assets/auto-coating.png",
      link: "/products/automotive-coating",
      features: ["Ultra gloss finish", "UV protection", "5-year durability"]
    },
    {
      id: "home-coating",
      title: "Home Series Ceramic Coating",
      description: "Advanced protection for kitchen countertops, bathroom surfaces, glass, and more with long-lasting hydrophobic properties.",
      image: "/assets/fabric-coating.png",
      link: "/products/home-coating",
      features: ["Stain resistant", "Easy to clean", "Long-lasting protection"]
    }
  ];

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.2
      }
    }
  };
  
  const itemVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.8, ease: [0.215, 0.61, 0.355, 1] }
    }
  };

  return (
    <section id="products" className="py-28 bg-white relative overflow-hidden">
      {/* Background subtle pattern */}
      <div className="absolute inset-0 bg-gradient-to-b from-gray-50 to-white"></div>
      
      {/* Subtle accent line */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-neutral-200 via-neutral-300 to-neutral-200"></div>
      
      <div className="container-premium relative z-10">
        <motion.div 
          className="text-center mb-20"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
        >
          <h2 className="font-oxanium font-bold text-4xl md:text-5xl lg:text-6xl mb-6 tracking-tight">
            Premium Protection Solutions
          </h2>
          <p className="text-neutral-600 text-lg max-w-3xl mx-auto font-light leading-relaxed">
            P91 India offers best-in-class protection for automotive and home surfaces, combining cutting-edge technology with exceptional performance.
          </p>
        </motion.div>

        <motion.div 
          className="grid grid-cols-1 md:grid-cols-3 gap-10 lg:gap-12"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          {products.map((product) => (
            <motion.div 
              key={product.id}
              id={product.id} 
              className="premium-card group"
              variants={itemVariants}
            >
              <div className="relative h-72 overflow-hidden bg-neutral-100 flex items-center justify-center">
                <img 
                  src={product.image} 
                  alt={product.title}
                  className="w-auto h-auto max-w-[80%] max-h-[80%] object-contain transition-transform duration-700 group-hover:scale-110"
                />
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                
                {/* Hover state label */}
                <div className="absolute bottom-0 left-0 right-0 p-6 translate-y-full group-hover:translate-y-0 transition-transform duration-500">
                  <span className="inline-block px-3 py-1 bg-neutral-900 text-white text-xs font-medium rounded-full">
                    Premium Protection
                  </span>
                </div>
              </div>
              
              <div className="p-8">
                <h3 className="font-oxanium font-bold text-2xl mb-3 tracking-tight">{product.title}</h3>
                <p className="text-neutral-600 mb-6">
                  {product.description}
                </p>
                
                {/* Features list - Apple-style bullet points */}
                <ul className="mb-6 space-y-2">
                  {product.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-neutral-900 mr-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                      </span>
                      <span className="text-neutral-700 text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <Link 
                  href={product.link}
                  className="inline-flex items-center justify-center w-full py-3 px-4 border border-neutral-200 rounded-xl text-black font-medium hover:bg-black hover:text-white hover:border-black transition-all duration-300 group"
                >
                  <span>Learn More</span>
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    className="h-4 w-4 ml-2 transition-transform duration-300 group-hover:translate-x-1" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </Link>
              </div>
            </motion.div>
          ))}
        </motion.div>
        
        {/* Apple-style CTA section */}
        <motion.div 
          className="mt-24 text-center"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          viewport={{ once: true }}
        >
          <h3 className="font-oxanium font-bold text-2xl md:text-3xl mb-6">
            Ready to experience premium protection?
          </h3>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link href="/products/ppf" className="btn-premium">
              View All Products
            </Link>
            <Link href="/partners/installers" className="btn-premium-outline">
              Find Installer
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
