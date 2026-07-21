import { ReactNode, useEffect, Suspense } from "react";
import { Navbar } from "@/components/navbar/Navbar";
import { Footer } from "@/components/footer/Footer";
import { Toaster } from "@/components/ui/toaster";

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  // Implement scroll reveal animation for elements with scroll-trigger class
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('scroll-visible');
          }
        });
      },
      {
        root: null,
        rootMargin: '0px',
        threshold: 0.1,
      }
    );

    const scrollTriggerElements = document.querySelectorAll('.scroll-trigger');
    scrollTriggerElements.forEach((el) => observer.observe(el));

    return () => {
      scrollTriggerElements.forEach((el) => observer.unobserve(el));
    };
  }, []);

  return (
    <div className="font-sans antialiased bg-white text-black min-h-screen flex flex-col overflow-x-hidden">
      <Navbar />
      <main className="flex-grow">
        {/* Suspense lives inside the layout so lazy page chunks load without
            tearing down the Navbar/Footer — only the content area shows the
            spinner. */}
        <Suspense
          fallback={
            <div className="min-h-[60vh] flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          }
        >
          {children}
        </Suspense>
      </main>
      <Footer />
      <Toaster />
      
      {/* Apple-style scroll to top button */}
      <button 
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className="fixed bottom-8 right-8 w-12 h-12 rounded-full bg-black/80 backdrop-blur-sm text-white flex items-center justify-center opacity-0 invisible transition-all duration-300 hover:bg-black z-50 hover:shadow-apple scroll-to-top"
        aria-label="Scroll to top"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M5 10l7-7m0 0l7 7m-7-7v18" />
        </svg>
      </button>
      
      {/* Custom scroll-to-top styles added to MainLayout */}
      
      {/* Add scroll class to body when scrolled for global styling */}
      <script dangerouslySetInnerHTML={{
        __html: `
          window.addEventListener('scroll', () => {
            if (window.scrollY > 100) {
              document.body.classList.add('scrolled');
            } else {
              document.body.classList.remove('scrolled');
            }
          });
        `
      }} />
    </div>
  );
}
