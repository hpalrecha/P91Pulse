import { Link } from "wouter";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import mobileVideoPath from "@assets/PPF (1080 x 1920 px).mp4";
import desktopVideoPath from "@assets/Untitled design (7).mp4";

export function Hero() {
  const [isMobile, setIsMobile] = useState(false);
  
  // Detect if device is mobile
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    // Check initially
    checkIfMobile();
    
    // Add resize listener
    window.addEventListener('resize', checkIfMobile);
    
    // Cleanup
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  return (
    <section className="relative h-screen overflow-hidden bg-white">
      {/* Video Background - Responsive based on device */}
      <div className="absolute inset-0 w-full h-full">
        <video 
          className="absolute inset-0 w-full h-full object-cover"
          src={isMobile ? mobileVideoPath : desktopVideoPath}
          autoPlay
          muted
          loop
          playsInline
        />
        <div className="absolute inset-0 bg-black/30"></div>
      </div>
      
      {/* Content overlay with title, description and button */}
      <div className="relative z-10 flex flex-col justify-end items-center h-full text-center px-4 pb-16 md:pb-24">
        <motion.div 
          className="max-w-3xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-1">
            Protection Beyond Expectations
          </h1>
          
          <p className={`text-sm sm:text-base md:text-lg text-white/80 mb-6 md:mb-8 ${isMobile ? 'whitespace-normal px-4' : 'whitespace-nowrap'}`}>
            Explore our Glossy, Matte, and Color PPF range for superior protection and lasting elegance
          </p>
          
          <Link href="/products/ppf" className="btn-premium bg-transparent text-white border border-white hover:bg-white hover:text-black transition-colors px-5 py-1.5 sm:px-6 sm:py-2 text-xs sm:text-sm rounded-full">
            Learn More
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
