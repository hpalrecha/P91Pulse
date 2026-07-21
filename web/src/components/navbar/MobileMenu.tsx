import { useState } from "react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";

interface MobileMenuProps {
  isOpen: boolean;
  onClose?: () => void;
}

export default function MobileMenu({ isOpen, onClose }: MobileMenuProps) {
  const [productsMenuOpen, setProductsMenuOpen] = useState(false);
  const [partnersMenuOpen, setPartnersMenuOpen] = useState(false);
  const [location] = useLocation();

  const toggleProductsMenu = () => {
    setProductsMenuOpen(!productsMenuOpen);
    if (!productsMenuOpen) setPartnersMenuOpen(false); // Close other menu when opening this one
  };

  const togglePartnersMenu = () => {
    setPartnersMenuOpen(!partnersMenuOpen);
    if (!partnersMenuOpen) setProductsMenuOpen(false); // Close other menu when opening this one
  };

  const isActive = (path: string) => {
    return location === path;
  };

  // Animation variants
  const menuVariants = {
    hidden: { 
      opacity: 0,
      height: 0,
      transition: { 
        duration: 0.3,
        ease: "easeInOut"
      } 
    },
    visible: { 
      opacity: 1,
      height: "auto",
      transition: { 
        duration: 0.4,
        ease: "easeInOut"
      } 
    }
  };

  const containerVariants = {
    hidden: { 
      opacity: 0,
      y: -20,
      transition: { staggerChildren: 0.05, staggerDirection: -1 }
    },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        duration: 0.3,
        staggerChildren: 0.07,
        delayChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -10 },
    visible: { opacity: 1, x: 0 }
  };

  return (
    <motion.div 
      className="lg:hidden glass-panel border-t border-neutral-100 fixed top-[60px] left-0 right-0 overflow-hidden z-50"
      initial="hidden"
      animate="visible"
      exit="hidden"
      variants={menuVariants}
    >
      <div className="container-premium py-5">
        <motion.div 
          className="space-y-5"
          variants={containerVariants}
        >
          {/* Navigation links */}
          <NavLink href="/" label="Home" active={isActive('/')} variants={itemVariants} onClose={onClose} />
          <NavLink href="/p91-pulse" label="P91 Pulse" active={isActive('/p91-pulse')} variants={itemVariants} onClose={onClose} />
          <NavLink href="/about" label="About Us" active={isActive('/about')} variants={itemVariants} onClose={onClose} />
          
          {/* Products dropdown */}
          <motion.div className="relative" variants={itemVariants}>
            <button 
              className={`flex items-center justify-between w-full py-2 font-medium 
                ${productsMenuOpen ? 'text-neutral-900 font-semibold' : 'text-neutral-700 hover:text-neutral-900'} 
                transition-colors duration-200`}
              onClick={toggleProductsMenu}
            >
              Products
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className={`h-4 w-4 transition-transform duration-300 ${productsMenuOpen ? 'rotate-180' : ''}`} 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            <AnimatePresence>
              {productsMenuOpen && (
                <motion.div 
                  className="pl-4 space-y-4 mt-3 overflow-hidden"
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                  variants={{
                    hidden: { opacity: 0, height: 0 },
                    visible: { opacity: 1, height: "auto", transition: { duration: 0.3 } }
                  }}
                >
                  <SubNavLink 
                    href="/products/ppf" 
                    label="Paint Protection Film (PPF)" 
                    onClick={() => {
                      setProductsMenuOpen(false);
                      if (onClose) onClose();
                    }}
                  />
                  <SubNavLink 
                    href="/products/ceramic" 
                    label="Automotive Ceramic Coating" 
                    onClick={() => {
                      setProductsMenuOpen(false);
                      if (onClose) onClose();
                    }}
                  />
                  <SubNavLink 
                    href="/products/home-coating" 
                    label="Home Series Ceramic Coating" 
                    onClick={() => {
                      setProductsMenuOpen(false);
                      if (onClose) onClose();
                    }}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
          
          <NavLink href="/store" label="Flagship Store" active={isActive('/store')} variants={itemVariants} onClose={onClose} />
          
          {/* Partners dropdown */}
          <motion.div className="relative" variants={itemVariants}>
            <button 
              className={`flex items-center justify-between w-full py-2 font-medium 
                ${partnersMenuOpen ? 'text-neutral-900 font-semibold' : 'text-neutral-700 hover:text-neutral-900'} 
                transition-colors duration-200`}
              onClick={togglePartnersMenu}
            >
              Partners
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className={`h-4 w-4 transition-transform duration-300 ${partnersMenuOpen ? 'rotate-180' : ''}`} 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            <AnimatePresence>
              {partnersMenuOpen && (
                <motion.div 
                  className="pl-4 space-y-4 mt-3 overflow-hidden"
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                  variants={{
                    hidden: { opacity: 0, height: 0 },
                    visible: { opacity: 1, height: "auto", transition: { duration: 0.3 } }
                  }}
                >
                  <SubNavLink 
                    href="/partners/distributors" 
                    label="Distributors" 
                    onClick={() => {
                      setPartnersMenuOpen(false);
                      if (onClose) onClose();
                    }}
                  />
                  <SubNavLink 
                    href="/partners/installers" 
                    label="Installers" 
                    onClick={() => {
                      setPartnersMenuOpen(false);
                      if (onClose) onClose();
                    }}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
          
          <NavLink href="/warranty" label="eWarranty" active={isActive('/warranty')} variants={itemVariants} onClose={onClose} />
          <NavLink href="/contact" label="Contact" active={isActive('/contact')} variants={itemVariants} onClose={onClose} />
          
          {/* CTA Buttons - Conditionally show different buttons on P91 Pulse page */}
          <motion.div 
            className="pt-4 space-y-3"
            variants={itemVariants}
          >
            {location === '/p91-pulse' ? (
              <>
                {/* Login to P91 Pulse button - Black box style */}
                <Link 
                  href="/erp/login" 
                  className="block w-full btn-premium bg-neutral-900 text-white hover:bg-neutral-800 text-center"
                  onClick={(e) => {
                    // Prevent default behavior
                    e.stopPropagation();
                    
                    // Close the mobile menu if onClose is provided
                    if (onClose) onClose();
                    
                    // Navigate manually to avoid scrolling issues
                    window.location.href = "/erp/login";
                  }}
                >
                  Login to P91 Pulse
                </Link>
                
                {/* Text-only "Sign Up" button */}
                <Link 
                  href="/erp/signup" 
                  className="block w-full text-neutral-700 hover:text-neutral-900 text-center py-2 font-medium"
                  onClick={(e) => {
                    // Prevent default behavior
                    e.stopPropagation();
                    
                    // Close the mobile menu if onClose is provided
                    if (onClose) onClose();
                    
                    // Navigate manually to avoid scrolling issues
                    window.location.href = "/erp/signup";
                  }}
                >
                  Sign Up
                </Link>
              </>
            ) : (
              <Link 
                href="/partners/installers" 
                className="block w-full btn-premium text-center"
                onClick={(e) => {
                  // Prevent default behavior
                  e.stopPropagation();
                  
                  // Close the mobile menu if onClose is provided
                  if (onClose) onClose();
                  
                  // Navigate manually to avoid scrolling issues
                  window.location.href = "/p91-pulse-signup";
                }}
              >
                Become Installer
              </Link>
            )}
          </motion.div>
        </motion.div>
      </div>
    </motion.div>
  );
}

// Helper component for nav links
interface NavLinkProps {
  href: string;
  label: string;
  active: boolean;
  variants: any;
  onClose?: () => void;
}

function NavLink({ href, label, active, variants, onClose }: NavLinkProps) {
  return (
    <motion.div variants={variants}>
      <Link 
        href={href} 
        className={`block py-2 font-medium text-base
          ${active ? 'text-neutral-900 font-semibold' : 'text-neutral-700 hover:text-neutral-900'}
          transition-colors duration-200`}
        onClick={(e) => {
          // Prevent the default behavior
          e.stopPropagation();
          
          // Close mobile menu if onClose is provided
          if (onClose) onClose();
          
          // Navigate manually to avoid scrolling issues
          window.location.href = href;
        }}
      >
        {label}
      </Link>
    </motion.div>
  );
}

// Helper component for sub-nav links
interface SubNavLinkProps {
  href: string;
  label: string;
  onClick?: () => void;
}

function SubNavLink({ href, label, onClick }: SubNavLinkProps) {
  const [location] = useLocation();
  const active = location === href;
  
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2 }}
    >
      <Link 
        href={href} 
        className={`block py-2 text-sm 
          ${active ? 'text-neutral-900 font-medium' : 'text-neutral-600 hover:text-neutral-800'}
          transition-colors duration-200`}
        onClick={(e) => {
          // Prevent the default behavior
          e.stopPropagation();
          
          // Call the provided onClick handler if it exists
          if (onClick) onClick();
          
          // Navigate manually to avoid scrolling issues
          window.location.href = href;
        }}
      >
        {label}
      </Link>
    </motion.div>
  );
}
