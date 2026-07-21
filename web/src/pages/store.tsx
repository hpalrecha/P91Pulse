import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import bannerImage from "../assets/banner.jpg";
import productDisplayImage from "../assets/product-display.jpg";
import customerWaitingAreaImage from "../assets/customer-waiting-area.jpg";
import outerImage from "../assets/outer.jpg";
import bayAreaImage from "../assets/bay-area.jpg";

export default function StorePage() {
  const storeImages = [
    {
      src: outerImage,
      alt: "P91 Flagship Store Exterior"
    },
    {
      src: customerWaitingAreaImage,
      alt: "Customer Waiting Area"
    },
    {
      src: bayAreaImage,
      alt: "Service Bay"
    },
    {
      src: productDisplayImage,
      alt: "Product Display"
    }
  ];

  const facilities = [
    {
      title: "Service Bays",
      description: "Climate-controlled application areas with state-of-the-art filtration and lighting systems for perfect installation results.",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
        </svg>
      )
    },
    {
      title: "Showroom",
      description: "Interactive displays showcasing our complete range of protection products and their effects on different surfaces.",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
        </svg>
      )
    },
    {
      title: "Consultation Areas",
      description: "Private spaces for personalized discussions about your specific protection needs with our expert advisors.",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      )
    },
    {
      title: "Customer Lounge",
      description: "Comfortable waiting area with premium amenities, Wi-Fi, and refreshments while your vehicle is being serviced.",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    }
  ];

  return (
    <div className="pt-20">
      {/* Hero Section */}
      <div className="relative h-[60vh] flex items-center justify-center">
        <div 
          className="absolute inset-0 opacity-80" 
          style={{
            backgroundImage: `url(${bannerImage})`,
            backgroundSize: "cover",
            backgroundPosition: "center"
          }}
        ></div>
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent"></div>
        
        <div className="container mx-auto px-4 z-10 text-center">
          <h1 className="font-header font-bold text-4xl md:text-5xl lg:text-6xl text-white mb-4">
            P91 Flagship Store
          </h1>
          <p className="text-neutral-100 text-lg md:text-xl max-w-3xl mx-auto mb-8">
            Experience premium protection solutions in our state-of-the-art facility
          </p>
          <Link href="#location" className="px-8 py-3 bg-primary text-secondary font-medium rounded-md hover:shadow-neon transition">
            Find Us
          </Link>
        </div>
      </div>

      {/* Store Gallery */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="font-header font-bold text-3xl md:text-4xl mb-4">Take a Tour</h2>
            <p className="text-neutral-500 max-w-3xl mx-auto">
              Our flagship store offers a premium experience for all your vehicle and home protection needs.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {storeImages.map((image, index) => (
              <div key={index} className="rounded-xl overflow-hidden shadow-lg hover-scale">
                <img 
                  src={image.src}
                  alt={image.alt} 
                  className="w-full h-auto object-contain"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Facilities */}
      <section className="py-20 bg-neutral-100">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="font-header font-bold text-3xl md:text-4xl mb-4">Our Facilities</h2>
            <p className="text-neutral-500 max-w-3xl mx-auto">
              P91 India's flagship store is designed to provide the ultimate customer experience.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {facilities.map((facility, index) => (
              <div key={index} className="bg-white rounded-lg p-8 shadow-md hover-scale">
                <div className="mb-4">
                  {facility.icon}
                </div>
                <h3 className="font-header font-bold text-xl mb-2">{facility.title}</h3>
                <p className="text-neutral-500">
                  {facility.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Location & Hours */}
      <section id="location" className="py-20 bg-neutral-900 text-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="font-header font-bold text-3xl md:text-4xl mb-4">Visit Us</h2>
            <p className="text-neutral-300 max-w-3xl mx-auto">
              Experience the P91 difference at our state-of-the-art flagship store in Bangalore.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="rounded-xl overflow-hidden shadow-lg h-[400px]">
              <iframe 
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3888.6792112498445!2d77.60214957504723!3d12.931929115954287!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bae15c89b495a6b%3A0xe67f7d3a5a9e6c34!2s49%2C%2013th%20Cross%20Rd%2C%20Ayappa%20Garden%2C%20Adugodi%2C%20Bengaluru%2C%20Karnataka%20560027!5e0!3m2!1sen!2sin!4v1712051195844!5m2!1sen!2sin" 
                width="100%" 
                height="100%" 
                style={{ border: 0 }} 
                allowFullScreen 
                loading="lazy"
                title="P91 Flagship Store Location"
              ></iframe>
            </div>
            
            <div className="flex flex-col justify-center">
              <div className="space-y-6">
                <div>
                  <h3 className="font-header font-bold text-xl mb-2 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Location
                  </h3>
                  <p className="text-neutral-300 pl-7">
                    49, 13th Cross Rd, Ayappa Garden, Adugodi, Bengaluru, Karnataka 560027
                  </p>
                </div>
                
                <div>
                  <h3 className="font-header font-bold text-xl mb-2 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Hours
                  </h3>
                  <ul className="text-neutral-300 pl-7 space-y-1">
                    <li>Monday - Friday: 10:00 AM - 7:00 PM</li>
                    <li>Saturday: 10:00 AM - 5:00 PM</li>
                    <li>Sunday: Closed</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="font-header font-bold text-xl mb-2 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    Contact
                  </h3>
                  <p className="text-neutral-300 pl-7">
                    +91 74066 19191 / info@p91india.com
                  </p>
                </div>
              </div>
              
              <div className="mt-8">
                <Button asChild className="inline-flex items-center px-6 py-3 bg-primary text-secondary font-medium rounded-md hover:shadow-neon transition">
                  <Link href="/contact">
                    Schedule a Consultation
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Franchise Opportunity Section */}
      <section className="py-20 bg-gradient-to-r from-primary/10 to-primary/5">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="font-header font-bold text-3xl md:text-4xl mb-6">Become a P91 Car Care Franchise</h2>
              <p className="text-neutral-600 text-lg mb-6">
                Join the growing network of P91 authorized franchise locations and become part of India's premium automotive protection brand. As a franchise owner, you'll benefit from our established reputation, proven business model, and comprehensive support.
              </p>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary mr-2 mt-1 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Exclusive territory rights in your location</span>
                </li>
                <li className="flex items-start">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary mr-2 mt-1 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Comprehensive training for you and your staff</span>
                </li>
                <li className="flex items-start">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary mr-2 mt-1 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Marketing and operational support</span>
                </li>
                <li className="flex items-start">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary mr-2 mt-1 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Access to premium P91 products and proprietary techniques</span>
                </li>
              </ul>
              <Button asChild className="px-8 py-3 bg-primary text-white font-medium hover:bg-primary/90 transition-all">
                <Link href="/contact">
                  Apply for Franchise
                </Link>
              </Button>
            </div>
            <div className="rounded-lg overflow-hidden shadow-lg">
              <img 
                src={outerImage}
                alt="P91 Franchise Store Exterior" 
                className="w-full h-auto object-contain"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="font-header font-bold text-3xl md:text-4xl mb-6">Premium Treatment for Your Valuable Assets</h2>
          <p className="text-neutral-500 max-w-2xl mx-auto mb-8">
            Our flagship store offers the complete range of P91 protection solutions, professionally applied by our certified specialists.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button asChild className="px-8 py-6 bg-secondary text-primary text-glow hover:shadow-neon">
              <Link href="/contact">
                Book Your Appointment
              </Link>
            </Button>
            <Button asChild variant="outline" className="px-8 py-6">
              <Link href="/products/ppf">
                Explore Our Products
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
