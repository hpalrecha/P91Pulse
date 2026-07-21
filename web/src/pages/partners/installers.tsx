import { BecomeInstaller } from "@/components/installers/BecomeInstaller";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import installingAreaImage from "../../assets/installing-area.jpg";

export default function InstallersPage() {
  const benefits = [
    {
      title: "Premium Products",
      description: "Gain access to P91's exclusive line of top-tier protection products that deliver exceptional results for your customers.",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
        </svg>
      )
    },
    {
      title: "Technical Training",
      description: "Receive comprehensive training on proper application techniques to ensure flawless installations and satisfied customers.",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path d="M12 14l9-5-9-5-9 5 9 5z" />
          <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" />
        </svg>
      )
    },
    {
      title: "Marketing Support",
      description: "Access professional marketing materials, digital assets, and promotional support to grow your installation business.",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
        </svg>
      )
    },
    {
      title: "Business Growth",
      description: "Expand your service offerings and increase revenue by adding premium protection services to your business.",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      )
    }
  ];

  const requirements = [
    {
      title: "Proper Facility",
      description: "Clean, climate-controlled installation space that meets our standards for dust control and lighting."
    },
    {
      title: "Business License",
      description: "Valid business license and appropriate insurance coverage for your operation."
    },
    {
      title: "Installation Experience",
      description: "Existing experience in automotive detailing, film installation, or similar technical work."
    },
    {
      title: "Commitment to Quality",
      description: "Dedication to maintaining P91's high standards for installation quality and customer service."
    }
  ];

  return (
    <div className="pt-20">
      {/* Hero Section */}
      <div className="relative h-[60vh] flex items-center justify-center">
        <div 
          className="absolute inset-0 opacity-80" 
          style={{
            backgroundImage: `url(${installingAreaImage})`,
            backgroundSize: "cover",
            backgroundPosition: "center"
          }}
        ></div>
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent"></div>
        
        <div className="container mx-auto px-4 z-10 text-center">
          <h1 className="font-header font-bold text-4xl md:text-5xl lg:text-6xl text-white mb-4">
            Become an Authorized P91 Center
          </h1>
          <p className="text-neutral-100 text-lg md:text-xl max-w-3xl mx-auto mb-8">
            Join our network of premium car detailing studios and service centers
          </p>
          <a href="#application-form" className="px-8 py-3 bg-primary text-secondary font-medium rounded-md hover:shadow-neon transition">
            Apply Now
          </a>
        </div>
      </div>

      {/* APC Overview */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center gap-12">
            <div className="w-full md:w-1/2">
              <div className="relative rounded-xl overflow-hidden shadow-lg">
                <img 
                  src={installingAreaImage}
                  alt="P91 Authorized Service Center" 
                  className="w-full h-auto object-contain"
                />
              </div>
            </div>
            
            <div className="w-full md:w-1/2">
              <div className="max-w-lg">
                <h2 className="font-header font-bold text-3xl md:text-4xl mb-6">Why Become an Authorized P91 Center?</h2>
                <div className="space-y-4">
                  <p className="text-neutral-500">
                    P91 India is expanding our network of Authorized P91 Centers (APCs) across the country. We're inviting established car detailing studios to partner with us and elevate their service offerings with our premium nano-ceramic protection solutions.
                  </p>
                  <p className="text-neutral-500">
                    As an APC, your studio will gain exclusive access to P91's complete product range, comprehensive technical training, and premium brand association to enhance your market position and boost revenue.
                  </p>
                  <p className="text-neutral-500">
                    This partnership is ideal for quality-focused detailing businesses looking to add high-value protection services and align with India's leading premium protection brand.
                  </p>
                </div>
                
                <div className="mt-8">
                  <Link href="#application-form" className="inline-flex items-center px-6 py-3 bg-secondary text-primary transition rounded-md font-medium">
                    Join Our Network
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section id="benefits" className="py-20 bg-neutral-100">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="font-header font-bold text-3xl md:text-4xl mb-4">APC Partnership Benefits</h2>
            <p className="text-neutral-500 max-w-3xl mx-auto">
              Partnering with P91 India offers significant advantages for your detailing business.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
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

      {/* Requirements */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="font-header font-bold text-3xl md:text-4xl mb-4">APC Requirements</h2>
            <p className="text-neutral-500 max-w-3xl mx-auto">
              To maintain our high standards, we have specific requirements for Authorized P91 Centers.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {requirements.map((item, index) => (
              <div key={index} className="border border-neutral-200 rounded-lg p-6 hover-scale">
                <h3 className="font-header font-bold text-xl mb-2 flex items-center">
                  <span className="w-8 h-8 bg-primary text-secondary rounded-full flex items-center justify-center mr-3 text-sm">
                    {index + 1}
                  </span>
                  {item.title}
                </h3>
                <p className="text-neutral-500 pl-11">
                  {item.description}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <p className="text-neutral-500 max-w-2xl mx-auto mb-6">
              Meeting these requirements is just the first step. Our APC certification process includes comprehensive training and evaluation to ensure your studio is fully prepared to represent the P91 brand.
            </p>
            <Button asChild className="px-8 py-3 bg-secondary text-primary">
              <a href="#application-form">
                Apply for APC Status
              </a>
            </Button>
          </div>
        </div>
      </section>

      {/* Application Form */}
      <section id="application-form" className="py-20 bg-black">
        <BecomeInstaller />
      </section>

      {/* Join Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="font-header font-bold text-3xl md:text-4xl mb-6">Join Our Elite Network Today</h2>
          <p className="text-neutral-500 max-w-2xl mx-auto mb-8">
            Take your detailing business to the next level by becoming an Authorized P91 Center. Submit your application today, and our team will guide you through the certification process.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button asChild className="px-8 py-6 bg-secondary text-primary">
              <a href="#application-form">
                Submit Your Application
              </a>
            </Button>
            <Button asChild variant="outline" className="px-8 py-6">
              <Link href="/contact">
                Contact for More Information
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
