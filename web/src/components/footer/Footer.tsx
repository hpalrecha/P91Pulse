import { Link } from "wouter";
import { motion } from "framer-motion";
import P91Logo from "@assets/P91 (1).png";

export function Footer() {
  // Animation variants
  const footerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6 }
    }
  };

  return (
    <footer className="bg-black text-white pt-20 pb-12 relative overflow-hidden">
      {/* Accent line at top - Apple-style design element */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary/20 via-primary to-primary/20"></div>
      
      {/* Subtle pattern overlay */}
      <div className="absolute inset-0 opacity-5 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
      
      <div className="container-premium relative z-10">
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-y-14 gap-x-8"
          variants={footerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          <motion.div className="lg:col-span-4" variants={itemVariants}>
            <div className="mb-6">
              <Link href="/" className="inline-block">
                <img 
                  src={P91Logo}
                  alt="P91 India Logo"
                  className="h-auto max-w-full"
                  style={{ maxWidth: '75px', maxHeight: '75px' }}
                />
              </Link>
            </div>
            <p className="text-neutral-400 mb-8 max-w-md text-base">
              Premium automotive and home protection solutions for those who expect nothing but the best. Elevating protection to an art form.
            </p>
            <div className="flex space-x-5">
              {/* Instagram */}
              <a href="https://www.instagram.com/p91india/" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="w-10 h-10 bg-neutral-900 hover:bg-neutral-800 rounded-full flex items-center justify-center transition-all duration-300 hover:text-primary">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </a>
              {/* Facebook */}
              <a href="https://www.facebook.com/people/P91-India/61575397563898/" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="w-10 h-10 bg-neutral-900 hover:bg-neutral-800 rounded-full flex items-center justify-center transition-all duration-300 hover:text-primary">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z"/>
                </svg>
              </a>
              {/* WhatsApp */}
              <a href="https://wa.me/919916888363" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp" className="w-10 h-10 bg-neutral-900 hover:bg-neutral-800 rounded-full flex items-center justify-center transition-all duration-300 hover:text-primary">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
              </a>
            </div>
          </motion.div>
          
          <motion.div className="lg:col-span-2" variants={itemVariants}>
            <h4 className="font-oxanium font-bold text-lg mb-6 text-white">Quick Links</h4>
            <ul className="space-y-4">
              <li>
                <Link href="/" className="text-neutral-400 hover:text-primary transition-colors duration-300 inline-block">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-neutral-400 hover:text-primary transition-colors duration-300 inline-block">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/products/ppf" className="text-neutral-400 hover:text-primary transition-colors duration-300 inline-block">
                  Products
                </Link>
              </li>
              <li>
                <Link href="/store" className="text-neutral-400 hover:text-primary transition-colors duration-300 inline-block">
                  Flagship Store
                </Link>
              </li>
              <li>
                <Link href="/warranty" className="text-neutral-400 hover:text-primary transition-colors duration-300 inline-block">
                  eWarranty
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-neutral-400 hover:text-primary transition-colors duration-300 inline-block">
                  Contact
                </Link>
              </li>
            </ul>
          </motion.div>
          
          <motion.div className="lg:col-span-3" variants={itemVariants}>
            <h4 className="font-oxanium font-bold text-lg mb-6 text-white">Products</h4>
            <ul className="space-y-4">
              <li>
                <Link href="/products/ppf" className="text-neutral-400 hover:text-primary transition-colors duration-300 inline-block">
                  Paint Protection Film
                </Link>
              </li>
              <li>
                <Link href="/products/automotive-coating" className="text-neutral-400 hover:text-primary transition-colors duration-300 inline-block">
                  Automotive Ceramic Coating
                </Link>
              </li>
              <li>
                <Link href="/products/home-coating" className="text-neutral-400 hover:text-primary transition-colors duration-300 inline-block">
                  Home Series Ceramic Coating
                </Link>
              </li>
              <li>
                <Link href="/products/ppf" className="text-neutral-400 hover:text-primary transition-colors duration-300 inline-block">
                  Maintenance Products
                </Link>
              </li>
              <li>
                <Link href="/products/ppf" className="text-neutral-400 hover:text-primary transition-colors duration-300 inline-block">
                  Professional Tools
                </Link>
              </li>
            </ul>
          </motion.div>
          
          <motion.div className="lg:col-span-3" variants={itemVariants}>
            <h4 className="font-oxanium font-bold text-lg mb-6 text-white">Contact</h4>
            <ul className="space-y-5">
              <li className="flex items-start">
                <div className="w-10 h-10 rounded-full bg-neutral-900 flex items-center justify-center shrink-0 mr-4 text-primary">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div>
                  <span className="text-neutral-400 text-base">
                    Ward 117, 49, Bannerghatta Rd, Ayappa Garden, Shanti Nagar, <br />
                    Bengaluru, Karnataka 560030
                  </span>
                </div>
              </li>
              <li className="flex items-start">
                <div className="w-10 h-10 rounded-full bg-neutral-900 flex items-center justify-center shrink-0 mr-4 text-primary">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </div>
                <div>
                  <span className="text-neutral-400 text-base">+91 79753 79525</span>
                </div>
              </li>
              <li className="flex items-start">
                <div className="w-10 h-10 rounded-full bg-neutral-900 flex items-center justify-center shrink-0 mr-4 text-primary">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <a href="mailto:info@p91india.com" className="text-neutral-400 hover:text-primary transition-colors duration-300 text-base">info@p91india.com</a>
                </div>
              </li>
            </ul>
          </motion.div>
        </motion.div>
        
        {/* Newsletter section */}
        <motion.div 
          className="mt-20 mb-16 p-8 md:p-10 bg-neutral-900 rounded-2xl"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          viewport={{ once: true }}
        >
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
            <div className="md:col-span-7">
              <h3 className="text-white text-2xl font-oxanium font-bold mb-2">Stay updated with our latest products</h3>
              <p className="text-neutral-400">Subscribe to our newsletter for exclusive updates and offers.</p>
            </div>
            <div className="md:col-span-5">
              <div className="flex">
                <input 
                  type="email" 
                  placeholder="Your email address" 
                  className="flex-grow py-3 px-4 bg-neutral-800 text-white border border-neutral-700 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-transparent transition-all duration-300" 
                />
                <button className="btn-premium-accent rounded-l-none py-3">
                  Subscribe
                </button>
              </div>
            </div>
          </div>
        </motion.div>
        
        {/* Copyright section */}
        <div className="border-t border-neutral-800 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-neutral-500 text-sm">© {new Date().getFullYear()} P91 India. All rights reserved.</p>
          <div className="mt-4 md:mt-0">
            <ul className="flex flex-wrap justify-center gap-x-8">
              <li><a href="#" className="text-neutral-500 hover:text-primary text-sm transition-colors duration-300">Privacy Policy</a></li>
              <li><a href="#" className="text-neutral-500 hover:text-primary text-sm transition-colors duration-300">Terms of Service</a></li>
              <li><a href="#" className="text-neutral-500 hover:text-primary text-sm transition-colors duration-300">Warranty Policy</a></li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
}
