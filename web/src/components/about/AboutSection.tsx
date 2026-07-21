export function AboutSection() {
  const stats = [
    { value: "50+", label: "Certified Installers Nationwide" },
    { value: "10K+", label: "Vehicles Protected" },
    { value: "7+", label: "Years of Excellence" },
    { value: "100%", label: "Customer Satisfaction" }
  ];

  return (
    <section id="about" className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center gap-12">
          <div className="w-full md:w-1/2">
            <div className="relative h-[500px] rounded-xl overflow-hidden shadow-lg scroll-trigger">
              <img 
                src="/assets/studio-interior.jpg"
                alt="P91 Flagship store interior" 
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end">
                <div className="p-8">
                  <h3 className="font-oxanium text-white text-2xl font-bold mb-2">Precision & Excellence</h3>
                  <p className="text-neutral-100">Setting industry standards since 2010</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="w-full md:w-1/2">
            <div className="max-w-lg">
              <h2 className="font-oxanium font-bold text-3xl md:text-4xl mb-6 scroll-trigger">About P91 India</h2>
              <div className="space-y-4 scroll-trigger">
                <p className="text-neutral-500">
                  P91 India is a premier provider of automotive and home surface protection solutions, dedicated to delivering products that exceed expectations in quality and performance.
                </p>
                <p className="text-neutral-500">
                  Founded on principles of innovation and excellence, we've revolutionized the protection industry with cutting-edge technologies and formulations that offer unparalleled durability and aesthetic enhancement.
                </p>
                <p className="text-neutral-500">
                  Our nationwide network of certified installers ensures consistent, professional application across India, backed by comprehensive warranties and exceptional customer service.
                </p>
              </div>
              
              <div className="mt-8 grid grid-cols-2 gap-6 scroll-trigger">
                {stats.map((stat, index) => (
                  <div key={index}>
                    <h4 className="font-oxanium font-bold text-xl text-primary mb-2">{stat.value}</h4>
                    <p className="text-neutral-900">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
