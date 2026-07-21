import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import MobileMenu from "./MobileMenu";
import P91Logo from "@assets/P91 (1).png";

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [location] = useLocation();

  // Handle scroll effect for nav background
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  // Determine if current route is active
  const isActive = (path: string) => {
    return location === path;
  };

  // Check if we're on the home page
  const isHomePage = location === '/';

  return (
    <header 
      className={`fixed w-full z-50 transition-all duration-300 ${
        scrolled 
          ? "bg-white/95 backdrop-blur-sm shadow-subtle py-3" 
          : "bg-transparent py-5"
      }`}
    >
      <div className="container-premium">
        <nav className="flex justify-between items-center">
          {/* Logo */}
          <motion.div 
            className="flex-shrink-0 mr-16"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <Link href="/" className="block">
              <img 
                src={P91Logo}
                alt="P91 India Logo"
                className="h-auto max-w-full"
                style={{ maxWidth: '75px', maxHeight: '75px' }}
              />
            </Link>
          </motion.div>

          {/* Desktop Navigation - Left-aligned with reduced spacing */}
          <div className="hidden lg:flex items-center space-x-5 flex-grow justify-start">
            <NavItem href="/" label="Home" active={isActive('/')} scrolled={scrolled} isHomePage={isHomePage} />
            <NavItem href="/about" label="About Us" active={isActive('/about')} scrolled={scrolled} isHomePage={isHomePage} />
            
            <NavDropdown 
              label="Products" 
              scrolled={scrolled}
              isHomePage={isHomePage}
              items={[
                { href: "/products/ppf", label: "Paint Protection Film (PPF)" },
                { href: "/products/ceramic", label: "Automotive Ceramic Coating" },
                { href: "/products/home-coating", label: "Home Series Ceramic Coating" }
              ]}
            />

            <NavItem href="/store" label="Flagship Store" active={isActive('/store')} scrolled={scrolled} isHomePage={isHomePage} />
            
            <NavDropdown 
              label="Partners" 
              scrolled={scrolled}
              isHomePage={isHomePage}
              items={[
                { href: "/partners/distributors", label: "Distributors" },
                { href: "/partners/installers", label: "Installers" },
                { href: "/ppfprogram", label: "PPF Program" }
              ]}
            />

            <NavItem href="/p91-pulse" label="P91 Pulse" active={isActive('/p91-pulse')} scrolled={scrolled} isHomePage={isHomePage} />
            <NavItem href="/warranty" label="eWarranty" active={isActive('/warranty')} scrolled={scrolled} isHomePage={isHomePage} />
            <NavItem href="/contact" label="Contact" active={isActive('/contact')} scrolled={scrolled} isHomePage={isHomePage} />
          </div>

          {/* CTA Buttons - Right-aligned */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="hidden md:flex items-center"
          >
            {location === '/p91-pulse' ? (
              <>
                {/* Login to P91 Pulse button - Black box style */}
                <Link 
                  href="/erp/login" 
                  className={`hidden md:inline-block ${
                    !scrolled && isHomePage 
                      ? "btn-premium bg-neutral-900 text-white hover:bg-neutral-800"
                      : "btn-premium bg-neutral-900 text-white hover:bg-neutral-800"
                  }`}
                >
                  Login to P91 Pulse
                </Link>
                
                {/* Text-only "Sign Up" button positioned to the right with margin */}
                <Link 
                  href="/erp/signup" 
                  className={`hidden md:inline-block font-medium text-sm ml-3
                    ${!scrolled && isHomePage 
                      ? "text-white hover:text-white/80" 
                      : "text-neutral-700 hover:text-neutral-900"
                    } transition-colors`}
                >
                  Sign Up
                </Link>
              </>
            ) : (
              <Link 
                href="/p91-pulse-signup" 
                className={`hidden md:inline-block ${
                  !scrolled && isHomePage 
                    ? "btn-premium bg-transparent text-white border border-white hover:bg-white hover:text-black"
                    : "btn-premium"
                }`}
              >
                Become Installer
              </Link>
            )}
          </motion.div>

          {/* Mobile Menu Button */}
          <button 
            type="button" 
            className={`lg:hidden ${
              scrolled 
                ? 'text-neutral-900' 
                : isHomePage ? 'text-white' : 'text-black'
            } transition duration-300`}
            onClick={toggleMobileMenu}
            aria-label="Toggle mobile menu"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </nav>
      </div>

      {/* Mobile Navigation Menu */}
      <AnimatePresence>
        {mobileMenuOpen && <MobileMenu isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />}
      </AnimatePresence>
    </header>
  );
}

// NavItem Component for cleaner structure
interface NavItemProps {
  href: string;
  label: string;
  active: boolean;
  scrolled: boolean;
  isHomePage?: boolean;
}

function NavItem({ href, label, active, scrolled, isHomePage = false }: NavItemProps) {
  return (
    <motion.div 
      className="nav-item relative"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Link 
        href={href} 
        className={`py-2 inline-block font-medium transition-colors duration-300 text-sm tracking-wide
          ${active 
            ? scrolled 
              ? 'text-neutral-900 font-semibold' 
              : isHomePage 
                ? 'text-white font-semibold' 
                : 'text-black font-semibold'
            : scrolled 
              ? 'text-neutral-600 hover:text-neutral-900'
              : isHomePage 
                ? 'text-white hover:text-white/80' 
                : 'text-black hover:text-neutral-900'
          }
        `}
        onClick={(e) => {
          // Prevent default behavior
          e.stopPropagation();
          
          // Navigate manually to avoid scrolling issues
          window.location.href = href;
        }}
      >
        {label}
        {active && (
          <motion.div 
            className={`absolute bottom-0 left-0 right-0 h-0.5 ${
              scrolled 
                ? 'bg-neutral-900' 
                : isHomePage 
                  ? 'bg-white' 
                  : 'bg-primary'
            }`}
            layoutId="navIndicator"
          />
        )}
      </Link>
    </motion.div>
  );
}

// NavDropdown Component
interface NavDropdownProps {
  label: string;
  items: {href: string; label: string}[];
  scrolled: boolean;
  isHomePage?: boolean;
}

function NavDropdown({ label, items, scrolled, isHomePage = false }: NavDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  // Close dropdown when clicking outside or moving mouse away
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      // Check if click is outside dropdown
      if (dropdownRef.current && !dropdownRef.current.contains(target)) {
        setIsOpen(false);
      }
    };

    // Handle mouse leave
    const handleMouseLeave = () => {
      // Add a small delay before closing to prevent accidental closures
      setTimeout(() => {
        setIsOpen(false);
      }, 300);
    };

    // Close when another navigation item is clicked
    const handleNavigationClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (target.closest('.nav-item') && !target.closest('.nav-dropdown')) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('click', handleNavigationClick);
    
    // Only add mouseLeave listener to the dropdown element if it exists
    const dropdownElement = dropdownRef.current;
    if (dropdownElement) {
      dropdownElement.addEventListener('mouseleave', handleMouseLeave);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('click', handleNavigationClick);
      
      if (dropdownElement) {
        dropdownElement.removeEventListener('mouseleave', handleMouseLeave);
      }
    };
  }, [isOpen]);

  return (
    <motion.div 
      ref={dropdownRef}
      className="nav-item relative nav-dropdown"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <button 
        onClick={toggleDropdown}
        className={`py-2 inline-flex items-center font-medium transition-colors duration-300 text-sm tracking-wide
          ${scrolled 
            ? 'text-neutral-600 hover:text-neutral-900' 
            : isHomePage
              ? 'text-white hover:text-white/80'
              : 'text-black hover:text-neutral-900'
          }
        `}
      >
        {label}
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          className={`h-3.5 w-3.5 ml-1 mt-0.5 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      <div 
        className={`dropdown-menu absolute left-0 mt-2 w-56 glass-panel shadow-premium rounded-sm py-1 transition-all duration-300 
        ${isOpen 
          ? 'opacity-100 visible translate-y-0 pointer-events-auto' 
          : 'opacity-0 invisible -translate-y-3 pointer-events-none'
        }`}
      >
        {items.map((item, index) => (
          <Link 
            key={index}
            href={item.href} 
            className="block px-4 py-2.5 text-sm text-neutral-700 hover:text-neutral-900 hover:bg-neutral-100 transition-colors duration-200"
            onClick={(e) => {
              // Prevent any default behaviors
              e.stopPropagation();
              
              // Close dropdown 
              setIsOpen(false);
              
              // Navigate to the href manually instead of relying on default link behavior
              window.location.href = item.href;
            }}
          >
            {item.label}
          </Link>
        ))}
      </div>
    </motion.div>
  );
}
