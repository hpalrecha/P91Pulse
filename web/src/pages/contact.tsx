import { ContactSection } from "@/components/contact/ContactSection";

export default function ContactPage() {
  const locations = [
    {
      name: "Corporate Headquarters",
      address: "Ward 117, 49, Bannerghatta Rd, Ayappa Garden, Shanti Nagar, Bengaluru, Karnataka 560030",
      phone: "+91 79753 79525",
      email: "info@p91india.com",
      hours: "Monday - Friday: 10:00 AM - 7:00 PM\nSaturday: 10:00 AM - 5:00 PM\nSunday: Closed"
    }
  ];

  return (
    <div className="pt-20">
      {/* Hero Section */}
      <div className="relative h-[40vh] flex items-center justify-center">
        <div 
          className="absolute inset-0 opacity-80" 
          style={{
            backgroundImage: "url('https://images.unsplash.com/photo-1596524430615-b46475ddff6e?ixlib=rb-1.2.1&auto=format&fit=crop&w=1920&h=1080&q=80')",
            backgroundSize: "cover",
            backgroundPosition: "center"
          }}
        ></div>
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent"></div>
        
        <div className="container mx-auto px-4 z-10 text-center">
          <h1 className="font-header font-bold text-4xl md:text-5xl lg:text-6xl text-white mb-4">
            Contact Us
          </h1>
          <p className="text-neutral-100 text-lg md:text-xl max-w-3xl mx-auto">
            We're here to answer your questions and provide the premium service you deserve
          </p>
        </div>
      </div>

      {/* Contact Form Section */}
      <section className="py-20 bg-white">
        <ContactSection />
      </section>

      {/* Locations */}
      <section className="py-20 bg-neutral-100">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="font-header font-bold text-3xl md:text-4xl mb-4">Our Location</h2>
            <p className="text-neutral-500 max-w-3xl mx-auto">
              Visit our headquarters to experience P91 products and services firsthand.
            </p>
          </div>

          <div className="max-w-md mx-auto">
            {locations.map((location, index) => (
              <div key={index} className="bg-white rounded-lg overflow-hidden shadow-md hover-scale">
                <div className="h-48">
                  <img 
                    src={`https://images.unsplash.com/photo-160${5000 + index * 100}?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&h=400&q=80`}
                    alt={location.name} 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-6">
                  <h3 className="font-header font-bold text-xl mb-3">{location.name}</h3>
                  <div className="space-y-3">
                    <div className="flex items-start">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary mr-3 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <p className="text-neutral-600 text-sm">{location.address}</p>
                    </div>
                    <div className="flex items-start">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary mr-3 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      <p className="text-neutral-600 text-sm">{location.phone}</p>
                    </div>
                    <div className="flex items-start">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary mr-3 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <p className="text-neutral-600 text-sm">{location.email}</p>
                    </div>
                    <div className="flex items-start">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary mr-3 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-neutral-600 text-sm whitespace-pre-line">{location.hours}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Map */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="font-header font-bold text-3xl md:text-4xl mb-4">Find Us</h2>
            <p className="text-neutral-500 max-w-3xl mx-auto">
              Visit our headquarters in Bengaluru to experience the P91 difference firsthand.
            </p>
          </div>

          <div className="rounded-xl overflow-hidden shadow-lg h-[500px]">
            <iframe 
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3888.034106355809!2d77.60150107481401!3d12.962346215193305!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bae15d3cd3ea65f%3A0x2ce54d2e1eb4a98f!2s49%2C%20Bannerghatta%20Rd%2C%20Ayappa%20Garden%2C%20Shanti%20Nagar%2C%20Bengaluru%2C%20Karnataka%20560030!5e0!3m2!1sen!2sin!4v1680068772076!5m2!1sen!2sin" 
              width="100%" 
              height="100%" 
              style={{ border: 0 }} 
              allowFullScreen 
              loading="lazy"
              title="P91 Headquarters Location"
            ></iframe>
          </div>
        </div>
      </section>

      {/* Connect */}
      <section className="py-20 bg-black text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="font-header font-bold text-3xl md:text-4xl mb-6">Connect With Us</h2>
          <p className="text-neutral-300 max-w-2xl mx-auto mb-8">
            Follow us on social media for the latest product updates, installation showcases, and special offers.
          </p>
          <div className="flex justify-center space-x-6">
            {/* Instagram */}
            <a href="https://www.instagram.com/p91india/" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="text-white hover:text-primary transition">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
              </svg>
            </a>
            {/* Facebook */}
            <a href="https://www.facebook.com/people/P91-India/61575397563898/" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="text-white hover:text-primary transition">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="currentColor" viewBox="0 0 24 24">
                <path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z"/>
              </svg>
            </a>
            {/* WhatsApp */}
            <a href="https://wa.me/919916888363" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp" className="text-white hover:text-primary transition">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
