import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function DistributorsPage() {
  const benefits = [
    {
      title: "Exclusive Territory",
      description: "Become the exclusive distributor of P91 products in your designated region with protected territory rights.",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
        </svg>
      )
    },
    {
      title: "Premium Product Line",
      description: "Offer your customers the highest quality protection products that deliver outstanding performance and durability.",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
        </svg>
      )
    },
    {
      title: "Marketing Support",
      description: "Receive comprehensive marketing materials, digital assets, and promotional support to drive sales in your region.",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
        </svg>
      )
    },
    {
      title: "Technical Training",
      description: "Comprehensive training program for your team on product knowledge, application techniques, and troubleshooting.",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path d="M12 14l9-5-9-5-9 5 9 5z" />
          <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" />
        </svg>
      )
    },
    {
      title: "Business Development",
      description: "Ongoing business consulting and development support to help you grow your distribution network successfully.",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      )
    },
    {
      title: "Installer Network",
      description: "Access to our growing network of certified installers, and support in recruiting and training new installers.",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      )
    }
  ];

  const steps = [
    {
      number: "01",
      title: "Initial Inquiry",
      description: "Submit your distributor application with information about your business, experience, and market potential."
    },
    {
      number: "02",
      title: "Business Assessment",
      description: "Our team evaluates your application and conducts a market analysis of your proposed territory."
    },
    {
      number: "03",
      title: "Discovery Meeting",
      description: "Meet with our business development team to discuss the partnership opportunity in detail."
    },
    {
      number: "04",
      title: "Distributor Agreement",
      description: "Upon approval, we formalize our partnership with a comprehensive distributor agreement."
    },
    {
      number: "05",
      title: "Training & Setup",
      description: "Complete our distributor training program and receive your initial inventory and marketing materials."
    }
  ];

  return (
    <div className="pt-20">
      {/* Hero Section */}
      <div className="relative h-[60vh] flex items-center justify-center">
        <div 
          className="absolute inset-0 opacity-80" 
          style={{
            backgroundImage: "url('https://images.unsplash.com/photo-1560179707-f14e90ef3623?ixlib=rb-1.2.1&auto=format&fit=crop&w=1920&h=1080&q=80')",
            backgroundSize: "cover",
            backgroundPosition: "center"
          }}
        ></div>
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent"></div>
        
        <div className="container mx-auto px-4 z-10 text-center">
          <h1 className="font-header font-bold text-4xl md:text-5xl lg:text-6xl text-white mb-4">
            Become a P91 Distributor
          </h1>
          <p className="text-neutral-100 text-lg md:text-xl max-w-3xl mx-auto mb-8">
            Partner with India's premier protection products brand and grow your business
          </p>
          <Link href="#apply" className="px-8 py-3 bg-primary text-secondary font-medium rounded-md hover:shadow-neon transition">
            Apply Now
          </Link>
        </div>
      </div>

      {/* Distributor Overview */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center gap-12">
            <div className="w-full md:w-1/2">
              <div className="relative rounded-xl overflow-hidden shadow-lg h-[500px]">
                <img 
                  src="https://images.unsplash.com/photo-1577415124269-fc1140a69e91?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&h=1000&q=80"
                  alt="P91 Distributor Network" 
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            
            <div className="w-full md:w-1/2">
              <div className="max-w-lg">
                <h2 className="font-header font-bold text-3xl md:text-4xl mb-6">Join Our Premium Distribution Network</h2>
                <div className="space-y-4">
                  <p className="text-neutral-500">
                    P91 India is seeking strategic distribution partners to help expand our premium protection solutions across the country. As the demand for high-quality automotive and home protection products continues to grow, now is the perfect time to join our network.
                  </p>
                  <p className="text-neutral-500">
                    Our distributors represent the P91 brand in their territories, supplying certified installers with our complete product line and providing technical support to ensure exceptional results for end customers.
                  </p>
                  <p className="text-neutral-500">
                    With comprehensive marketing support, technical training, and business development assistance, we equip our distributors with everything they need to build a successful business with P91 products.
                  </p>
                </div>
                
                <div className="mt-8">
                  <h3 className="font-header font-bold text-xl mb-4">Ideal Partner Profile</h3>
                  <ul className="space-y-2">
                    <li className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      Experience in automotive aftermarket or related industries
                    </li>
                    <li className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      Established business infrastructure and sales network
                    </li>
                    <li className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      Passion for premium products and exceptional service
                    </li>
                    <li className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      Financial capability for inventory and business development
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 bg-neutral-100">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="font-header font-bold text-3xl md:text-4xl mb-4">Distributor Benefits</h2>
            <p className="text-neutral-500 max-w-3xl mx-auto">
              Partnering with P91 India offers significant advantages for your business growth and success.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {benefits.map((benefit, index) => (
              <div key={index} className="bg-white rounded-lg p-8 shadow-md hover-scale">
                <div className="mb-4">
                  {benefit.icon}
                </div>
                <h3 className="font-header font-bold text-xl mb-2">{benefit.title}</h3>
                <p className="text-neutral-500">
                  {benefit.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Application Process */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="font-header font-bold text-3xl md:text-4xl mb-4">Application Process</h2>
            <p className="text-neutral-500 max-w-3xl mx-auto">
              Becoming a P91 distributor involves a straightforward but thorough process to ensure mutual success.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
            {steps.map((step, index) => (
              <Card key={index} className="hover-scale">
                <CardContent className="pt-6">
                  <div className="text-4xl font-header font-bold text-primary mb-4">{step.number}</div>
                  <h3 className="font-header font-bold text-xl mb-2">{step.title}</h3>
                  <p className="text-neutral-500 text-sm">
                    {step.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Application Form */}
      <section id="apply" className="py-20 bg-black text-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="font-header font-bold text-3xl md:text-4xl mb-4 text-white">Start Your Application</h2>
            <p className="text-neutral-300 max-w-3xl mx-auto">
              Take the first step toward becoming a P91 distributor by submitting your initial inquiry below.
            </p>
          </div>

          <div className="max-w-3xl mx-auto">
            <div className="bg-white rounded-xl p-8 shadow-lg">
              <p className="mb-6 text-neutral-600">
                To protect the integrity of our distributor network, we conduct a thorough evaluation process. Please complete the form below to start the conversation about becoming a P91 distributor in your region.
              </p>
              
              <Button asChild className="w-full px-8 py-6 bg-primary text-white font-medium rounded-md text-lg hover:bg-primary/90 transition-colors shadow-lg">
                <Link href="/contact">
                  Contact Our Business Development Team
                </Link>
              </Button>
              
              <p className="mt-4 text-sm text-neutral-600 text-center">
                Our team will reach out to you within 2 business days to discuss the next steps.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-neutral-100">
        <div className="container mx-auto px-4 text-center">
          <h2 className="font-header font-bold text-3xl md:text-4xl mb-6">Join Our Growing Network</h2>
          <p className="text-neutral-500 max-w-2xl mx-auto mb-8">
            P91 India is expanding rapidly, with strategic distribution opportunities available across the country. Contact us today to explore how you can become part of our success story.
          </p>
          <Button asChild className="px-8 py-6 bg-primary text-white font-medium rounded-md text-lg hover:bg-primary/90 transition-colors shadow-lg">
            <Link href="/contact">
              Schedule a Discovery Call
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
