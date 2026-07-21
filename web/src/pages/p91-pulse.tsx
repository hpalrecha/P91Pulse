import { Button } from "@/components/ui/button";
import { 
  ChevronRight, 
  Cpu, 
  Award, 
  FileText, 
  BarChart3, 
  Users, 
  Image, 
  ArrowRight, 
  ArrowUpRight, 
  TrendingUp, 
  Calendar, 
  DollarSign,
  MessageSquare,
  Layers,
  AlertCircle,
  CheckCircle2
} from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "wouter";
import bannerBgPath from "@assets/banner.jpg";

export default function P91PulsePage() {
  // Animation variants for staggered animations
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5
      }
    }
  };

  // Feature cards data with enhanced descriptions
  const features = [
    {
      title: "eWarranty Dashboard",
      description: "Register, manage, and claim PPF & coating warranties with real-time tracking and alerts. Streamline the entire warranty lifecycle.",
      icon: <Award className="w-10 h-10 text-primary mb-4" />
    },
    {
      title: "Product Library",
      description: "Full access to P91's Protect & Care SKUs with specification sheets, installation guides, and marketing media in one central location.",
      icon: <FileText className="w-10 h-10 text-primary mb-4" />
    },
    {
      title: "Lead Manager",
      description: "Capture, track, and convert leads with our AI-powered system that offers intelligent follow-ups and conversion analytics.",
      icon: <Users className="w-10 h-10 text-primary mb-4" />
    },
    {
      title: "Learning Hub",
      description: "Access on-demand training, detailed installation guides, certification modules, and expert workshops to master P91 products.",
      icon: <Cpu className="w-10 h-10 text-primary mb-4" />
    },
    {
      title: "Insights & Reports",
      description: "Get detailed business analytics, sales trends, product movement analysis, and performance metrics to drive strategic decisions.",
      icon: <BarChart3 className="w-10 h-10 text-primary mb-4" />
    },
    {
      title: "Marketing Toolkit",
      description: "Access ready-to-use creatives, social media assets, branding tools, and customizable templates to enhance your marketing efforts.",
      icon: <Image className="w-10 h-10 text-primary mb-4" />
    }
  ];

  const benefits = [
    {
      title: "Scale Smart",
      description: "Run your studio or dealership with clarity and precision. Our intelligent dashboards and tools provide the insights you need to make data-driven decisions.",
      icon: <ChevronRight className="w-6 h-6 text-primary" />
    },
    {
      title: "Stay Synced",
      description: "One unified channel for product updates, technical support, and business resources. Keep your team aligned with the latest P91 innovations and practices.",
      icon: <ChevronRight className="w-6 h-6 text-primary" />
    },
    {
      title: "Built for Speed",
      description: "Lightweight, mobile-first, superfast platform designed for professionals on the go. Access critical tools and information from anywhere, anytime.",
      icon: <ChevronRight className="w-6 h-6 text-primary" />
    }
  ];

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section - Centered text on clean background */}
      <section className="relative bg-gray-50 flex items-center overflow-hidden py-16 md:py-32">
        <div className="container-premium mx-auto px-4">
          <motion.div 
            className="max-w-3xl mx-auto text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="w-16 h-1 bg-primary mb-8 mx-auto"></div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-header font-bold mb-6 leading-tight text-neutral-900">
              Maximize Your Shop Performance
            </h1>
            <p className="text-xl md:text-2xl mb-10 text-neutral-700 leading-relaxed">
              P91 Pulse is a powerful but simple platform that puts a wide selection of
              tools at your fingertips. Now, you can manage your shop, customers, and
              more to boost your shop performance.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link href="/p91-pulse-signup">
                <Button size="lg" className="btn-premium-accent h-12 px-8 text-lg font-bold">
                  SIGN UP
                </Button>
              </Link>
              <Link href="/erp/login">
                <Button size="lg" variant="outline" className="border-neutral-900 text-neutral-900 hover:bg-neutral-900 hover:text-white h-12 px-8 text-lg">
                  Login to P91 Pulse
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Introduction Section with Dashboard */}
      <section className="py-16 md:py-28 bg-white">
        <div className="container-premium mx-auto px-4">
          <motion.div 
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <div className="separator mx-auto"></div>
            <h2 className="text-3xl md:text-4xl font-header font-bold mb-8">The Power of Integration</h2>
            <p className="text-lg md:text-xl text-neutral-700 leading-relaxed">
              P91 Pulse is the central ecosystem for all authorized P91 partners — from installers to distributors. 
              It's built to streamline operations, deliver actionable insights, and empower your business with tools that matter.
            </p>
          </motion.div>

          {/* Dashboard Mockup */}
          <motion.div
            className="max-w-6xl mx-auto bg-white rounded-lg shadow-lg overflow-hidden mb-12"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
          >
            {/* Dashboard Header */}
            <div className="bg-neutral-100 px-6 py-4 border-b border-neutral-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <span className="w-3 h-3 bg-primary rounded-full mr-2"></span>
                  <h3 className="text-lg font-bold text-neutral-900">Dashboard Overview</h3>
                </div>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" className="text-xs px-2 py-1 h-8">
                    Today
                  </Button>
                  <Button variant="outline" size="sm" className="text-xs px-2 py-1 h-8 bg-neutral-200">
                    This Week
                  </Button>
                  <Button variant="outline" size="sm" className="text-xs px-2 py-1 h-8">
                    This Month
                  </Button>
                </div>
              </div>
            </div>

            {/* Dashboard Main Content */}
            <div className="p-6">
              {/* Dashboard Stats Row */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                {/* Stat Card 1 */}
                <div className="bg-neutral-50 rounded p-4 border border-neutral-200">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="text-sm font-medium text-neutral-500">Total Warranties</h4>
                    <div className="p-2 bg-blue-100 rounded-full">
                      <Award className="h-4 w-4 text-blue-600" />
                    </div>
                  </div>
                  <div className="flex items-end">
                    <span className="text-2xl font-bold text-neutral-900">237</span>
                    <span className="ml-2 text-xs text-green-600 flex items-center">
                      <TrendingUp className="h-3 w-3 mr-1" /> +12.5%
                    </span>
                  </div>
                </div>

                {/* Stat Card 2 */}
                <div className="bg-neutral-50 rounded p-4 border border-neutral-200">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="text-sm font-medium text-neutral-500">Pending Claims</h4>
                    <div className="p-2 bg-amber-100 rounded-full">
                      <AlertCircle className="h-4 w-4 text-amber-600" />
                    </div>
                  </div>
                  <div className="flex items-end">
                    <span className="text-2xl font-bold text-neutral-900">12</span>
                    <span className="ml-2 text-xs text-red-600 flex items-center">
                      <TrendingUp className="h-3 w-3 mr-1 rotate-180" /> -3.2%
                    </span>
                  </div>
                </div>

                {/* Stat Card 3 */}
                <div className="bg-neutral-50 rounded p-4 border border-neutral-200">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="text-sm font-medium text-neutral-500">Monthly Revenue</h4>
                    <div className="p-2 bg-green-100 rounded-full">
                      <DollarSign className="h-4 w-4 text-green-600" />
                    </div>
                  </div>
                  <div className="flex items-end">
                    <span className="text-2xl font-bold text-neutral-900">₹42,580</span>
                    <span className="ml-2 text-xs text-green-600 flex items-center">
                      <TrendingUp className="h-3 w-3 mr-1" /> +8.7%
                    </span>
                  </div>
                </div>

                {/* Stat Card 4 */}
                <div className="bg-neutral-50 rounded p-4 border border-neutral-200">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="text-sm font-medium text-neutral-500">Customer Satisfaction</h4>
                    <div className="p-2 bg-violet-100 rounded-full">
                      <MessageSquare className="h-4 w-4 text-violet-600" />
                    </div>
                  </div>
                  <div className="flex items-end">
                    <span className="text-2xl font-bold text-neutral-900">98%</span>
                    <span className="ml-2 text-xs text-green-600 flex items-center">
                      <TrendingUp className="h-3 w-3 mr-1" /> +2.3%
                    </span>
                  </div>
                </div>
              </div>

              {/* Recent Activity Section */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Recent Warranties */}
                <div className="col-span-2 border border-neutral-200 rounded-md overflow-hidden">
                  <div className="bg-neutral-50 px-4 py-3 border-b border-neutral-200">
                    <h3 className="font-medium">Recent Warranty Registrations</h3>
                  </div>
                  <div className="divide-y divide-neutral-100">
                    <div className="p-4 flex items-center justify-between hover:bg-neutral-50">
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-full bg-neutral-200 flex items-center justify-center mr-3">
                          <span className="text-sm font-medium">AK</span>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium">Arun Kumar</h4>
                          <p className="text-xs text-neutral-500">PPF Spectrum - Maruti Swift</p>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800 mr-3">Approved</span>
                        <span className="text-xs text-neutral-500">Today</span>
                      </div>
                    </div>
                    
                    <div className="p-4 flex items-center justify-between hover:bg-neutral-50">
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-full bg-neutral-200 flex items-center justify-center mr-3">
                          <span className="text-sm font-medium">MS</span>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium">Mohan Singh</h4>
                          <p className="text-xs text-neutral-500">Ceramic Pro - Hyundai Creta</p>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <span className="px-2 py-1 text-xs rounded-full bg-amber-100 text-amber-800 mr-3">Pending</span>
                        <span className="text-xs text-neutral-500">Yesterday</span>
                      </div>
                    </div>
                    
                    <div className="p-4 flex items-center justify-between hover:bg-neutral-50">
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-full bg-neutral-200 flex items-center justify-center mr-3">
                          <span className="text-sm font-medium">PJ</span>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium">Priya Joshi</h4>
                          <p className="text-xs text-neutral-500">PPF Basic - Kia Seltos</p>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800 mr-3">Approved</span>
                        <span className="text-xs text-neutral-500">2 days ago</span>
                      </div>
                    </div>
                  </div>
                  <div className="px-4 py-3 bg-neutral-50 border-t border-neutral-200">
                    <a href="#" className="text-xs text-primary font-medium flex items-center">
                      View all warranties <ArrowRight className="ml-1 h-3 w-3" />
                    </a>
                  </div>
                </div>

                {/* Upcoming Tasks */}
                <div className="border border-neutral-200 rounded-md overflow-hidden">
                  <div className="bg-neutral-50 px-4 py-3 border-b border-neutral-200">
                    <h3 className="font-medium">Upcoming Tasks</h3>
                  </div>
                  <div className="divide-y divide-neutral-100">
                    <div className="p-4 hover:bg-neutral-50">
                      <div className="flex items-center mb-2">
                        <Calendar className="h-4 w-4 text-neutral-500 mr-2" />
                        <span className="text-xs text-neutral-500">April 24, 2025</span>
                      </div>
                      <h4 className="text-sm font-medium mb-1">Complete warranty verification</h4>
                      <div className="flex items-center">
                        <div className="w-4 h-4 rounded-full bg-blue-500 mr-2"></div>
                        <span className="text-xs text-neutral-500">Medium Priority</span>
                      </div>
                    </div>
                    
                    <div className="p-4 hover:bg-neutral-50">
                      <div className="flex items-center mb-2">
                        <Calendar className="h-4 w-4 text-neutral-500 mr-2" />
                        <span className="text-xs text-neutral-500">April 25, 2025</span>
                      </div>
                      <h4 className="text-sm font-medium mb-1">Train new detailers on system</h4>
                      <div className="flex items-center">
                        <div className="w-4 h-4 rounded-full bg-red-500 mr-2"></div>
                        <span className="text-xs text-neutral-500">High Priority</span>
                      </div>
                    </div>
                    
                    <div className="p-4 hover:bg-neutral-50">
                      <div className="flex items-center mb-2">
                        <Calendar className="h-4 w-4 text-neutral-500 mr-2" />
                        <span className="text-xs text-neutral-500">April 26, 2025</span>
                      </div>
                      <h4 className="text-sm font-medium mb-1">Review monthly inventory</h4>
                      <div className="flex items-center">
                        <div className="w-4 h-4 rounded-full bg-green-500 mr-2"></div>
                        <span className="text-xs text-neutral-500">Low Priority</span>
                      </div>
                    </div>
                  </div>
                  <div className="px-4 py-3 bg-neutral-50 border-t border-neutral-200">
                    <a href="#" className="text-xs text-primary font-medium flex items-center">
                      View all tasks <ArrowRight className="ml-1 h-3 w-3" />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          <div className="text-center mt-8">
            <p className="text-neutral-600 md:text-lg max-w-3xl mx-auto">
              Say goodbye to scattered data and hello to a unified platform designed specifically for automotive protection professionals.
            </p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 md:py-28 bg-neutral-50">
        <div className="container-premium mx-auto px-4">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="separator mx-auto"></div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-header font-bold">
              Core Features
            </h2>
            <p className="text-lg text-neutral-600 mt-4 max-w-2xl mx-auto">
              Everything you need to manage your P91 business in one powerful platform
            </p>
          </motion.div>
          
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {features.map((feature, index) => (
              <motion.div 
                key={index} 
                className="premium-card rounded-sm p-8 hover:translate-y-[-5px]"
                variants={itemVariants}
              >
                {feature.icon}
                <h3 className="text-xl font-header font-bold mb-3">{feature.title}</h3>
                <p className="text-neutral-600">{feature.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Why P91 Pulse Section */}
      <section className="py-16 md:py-28 bg-white scroll-trigger">
        <div className="container-premium mx-auto px-4">
          <motion.div 
            className="max-w-4xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="text-center mb-16">
              <div className="separator mx-auto"></div>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-header font-bold mb-4">
                Why P91 Pulse?
              </h2>
              <p className="text-lg text-neutral-700">
                Because you deserve more than just products — you need a platform that grows with you.
              </p>
            </div>
            
            <div className="space-y-8">
              {benefits.map((benefit, index) => (
                <motion.div 
                  key={index}
                  className="flex flex-col md:flex-row items-start gap-6 p-8 rounded-sm premium-card"
                  variants={itemVariants}
                >
                  <div className="bg-primary/10 p-3 rounded-full flex-shrink-0">
                    {benefit.icon}
                  </div>
                  <div>
                    <h3 className="text-xl font-header font-bold mb-2">{benefit.title}</h3>
                    <p className="text-neutral-600">{benefit.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Testimonial Section */}
      <section className="py-16 md:py-28 bg-neutral-900 text-white">
        <div className="container-premium mx-auto px-4">
          <motion.div 
            className="max-w-4xl mx-auto text-center"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="separator separator-white mx-auto"></div>
            <svg className="w-16 h-16 mx-auto mb-8 text-primary" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9.13 5.89C9.57 5.4 10.26 5.33 10.78 5.73C11.3 6.13 11.39 6.85 10.96 7.35L7.65 11.34C7.24 11.83 7.22 12.52 7.6 13.03L10.95 17.34C11.39 17.91 11.25 18.72 10.64 19.11C10.03 19.5 9.2 19.35 8.76 18.78L4.31 13.18C3.92 12.69 3.92 12 4.31 11.5L9.13 5.89Z" fill="currentColor"/>
              <path d="M15.13 5.89C15.57 5.4 16.26 5.33 16.78 5.73C17.3 6.13 17.39 6.85 16.96 7.35L13.65 11.34C13.24 11.83 13.22 12.52 13.6 13.03L16.95 17.34C17.39 17.91 17.25 18.72 16.64 19.11C16.03 19.5 15.2 19.35 14.76 18.78L10.31 13.18C9.92 12.69 9.92 12 10.31 11.5L15.13 5.89Z" fill="currentColor"/>
            </svg>
            <p className="text-xl md:text-2xl lg:text-3xl leading-relaxed mb-8">
              Pulse has completely transformed the way I run my detailing studio — from tracking warranty jobs to accessing marketing kits and training materials, everything I need is in one place. It's been a game-changer for our productivity.
            </p>
            <div className="flex items-center justify-center">
              <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center mr-4">
                <span className="text-white font-bold text-lg">RJ</span>
              </div>
              <div className="text-left">
                <p className="font-medium text-white text-lg">Rohit Jain</p>
                <p className="text-primary">Authorized P91 Partner – Surat</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Partners Stats Section */}
      <section className="py-16 md:py-20 bg-white">
        <div className="container-premium mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <motion.div 
              className="text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <h3 className="text-4xl md:text-5xl font-header font-bold text-primary mb-2">250+</h3>
              <p className="text-lg text-neutral-700">Active Partners</p>
            </motion.div>
            
            <motion.div 
              className="text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <h3 className="text-4xl md:text-5xl font-header font-bold text-primary mb-2">15,000+</h3>
              <p className="text-lg text-neutral-700">eWarranties Registered</p>
            </motion.div>
            
            <motion.div 
              className="text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <h3 className="text-4xl md:text-5xl font-header font-bold text-primary mb-2">95%</h3>
              <p className="text-lg text-neutral-700">Partner Satisfaction</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24 bg-primary text-white">
        <div className="container-premium mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-header font-bold mb-6">
              Plug into the Pulse
            </h2>
            <p className="text-lg md:text-xl mb-10 max-w-2xl mx-auto">
              Join P91 Pulse today to streamline your business operations and boost your performance.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/p91-pulse-signup">
                <Button size="lg" className="bg-white text-primary hover:bg-white/90 h-14 px-10 text-lg font-bold">
                  SIGN UP NOW <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/erp/login">
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10 h-14 px-10 text-lg">
                  Login to P91 Pulse
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 md:py-24 bg-white scroll-trigger">
        <div className="container-premium mx-auto px-4">
          <div className="text-center mb-16">
            <div className="separator mx-auto"></div>
            <h2 className="text-3xl md:text-4xl font-header font-bold mb-4">
              Frequently Asked Questions
            </h2>
          </div>
          
          <div className="max-w-4xl mx-auto">
            <div className="space-y-6">
              <div className="premium-card p-6 rounded-sm">
                <h3 className="text-xl font-header font-bold mb-2">Who can access P91 Pulse?</h3>
                <p className="text-neutral-600">P91 Pulse is exclusively available to authorized P91 partners, including distributors, installers, and detailers. If you're interested in becoming a partner, please contact us.</p>
              </div>
              
              <div className="premium-card p-6 rounded-sm">
                <h3 className="text-xl font-header font-bold mb-2">Is there a cost to use P91 Pulse?</h3>
                <p className="text-neutral-600">P91 Pulse is provided free of charge to all authorized P91 partners as part of our commitment to your business success.</p>
              </div>
              
              <div className="premium-card p-6 rounded-sm">
                <h3 className="text-xl font-header font-bold mb-2">How do I get support for P91 Pulse?</h3>
                <p className="text-neutral-600">We provide comprehensive support via email, chat, and phone. Once logged in, you'll have access to our dedicated support team who can assist with any questions.</p>
              </div>
              
              <div className="premium-card p-6 rounded-sm">
                <h3 className="text-xl font-header font-bold mb-2">Can I access P91 Pulse on mobile devices?</h3>
                <p className="text-neutral-600">Yes, P91 Pulse is fully responsive and designed to work on all devices, allowing you to manage your business on the go.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-12 md:py-16 bg-neutral-50">
        <div className="container-premium mx-auto px-4 text-center">
          <p className="text-lg text-neutral-700 mb-6">
            Ready to take your P91 partnership to the next level?
          </p>
          <Link href="/contact" className="btn-premium-accent inline-block">
            Contact Us Today
          </Link>
        </div>
      </section>
    </div>
  );
}