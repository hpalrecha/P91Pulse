import { Link } from "wouter";

export function FlagshipStore() {
  return (
    <section id="store" className="py-20 bg-neutral-900 text-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="font-oxanium font-bold text-3xl md:text-4xl mb-4 scroll-trigger text-white">Experience P91 at Our Flagship Store</h2>
          <p className="text-white max-w-3xl mx-auto scroll-trigger">
            Visit our state-of-the-art facility to witness the transformation your vehicle deserves.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="rounded-xl overflow-hidden shadow-lg h-[400px] scroll-trigger">
            <img 
              src="/assets/studio-exterior.jpg"
              alt="P91 Flagship Store Exterior" 
              className="w-full h-full object-cover"
            />
          </div>
          
          <div className="flex flex-col justify-center">
            <div className="space-y-6 scroll-trigger">
              <div>
                <h3 className="font-oxanium font-bold text-xl mb-2 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Location
                </h3>
                <p className="text-white pl-7">
                  Ward 117, 49, Bannerghatta Rd, Ayappa Garden, Shanti Nagar, Bengaluru, Karnataka 560030
                </p>
              </div>
              
              <div>
                <h3 className="font-oxanium font-bold text-xl mb-2 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Hours
                </h3>
                <p className="text-white pl-7">
                  Open All Days
                </p>
              </div>
              
              <div>
                <h3 className="font-oxanium font-bold text-xl mb-2 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  Contact
                </h3>
                <p className="text-white pl-7">
                  +91 079753 79525 / info@p91india.com
                </p>
              </div>
            </div>
            
            <div className="mt-8">
              <a 
                href="https://wa.link/jghbcj" 
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-6 py-3 bg-primary text-black font-medium rounded-md hover:shadow-lg transition scroll-trigger"
              >
                Schedule a Consultation
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
