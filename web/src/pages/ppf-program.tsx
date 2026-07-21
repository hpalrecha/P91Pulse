import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Shield, 
  Users, 
  TrendingUp, 
  Clock, 
  Phone, 
  MapPin, 
  Star,
  CheckCircle,
  ArrowRight,
  Zap,
  Target,
  Award,
  Building,
  Smartphone,
  BarChart3,
  FileText,
  CreditCard,
  Wrench,
  Eye,
  Calendar,
  HeadphonesIcon,
  Camera,
  DollarSign,
  Gauge,
  Check,
  Mail
} from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import PartnerApplicationForm from "@/components/forms/PartnerApplicationForm";

// Import product images
import ppfBasicImagePath from "../assets/ppf-basic.png";
import p3ImagePath from "../assets/3.png";
import p5ImagePath from "../assets/5.png";
import p7ImagePath from "../assets/7.png";
import graphineImagePath from "../assets/graphine.png";
import trimImagePath from "../assets/Trim.png";
import glassImagePath from "../assets/glass.png";
import ppfRangeImagePath from "@assets/P91 Web page-02_1755175559508.jpg";
import p91PulseDashboardPath from "@assets/image_1755172075904.png";

export default function PPFProgramPage() {
  const [showApplicationForm, setShowApplicationForm] = useState(false);

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-white pt-20">
        <div className="container-premium relative z-10">
          <div className="text-center max-w-5xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              <motion.h1 
                className="text-5xl lg:text-7xl font-oxanium font-bold text-gray-900 mb-6 leading-tight"
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: 0.2 }}
              >
                The only partnership you need
                <motion.span 
                  className="block text-primary"
                  initial={{ opacity: 0, x: -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.8, delay: 0.5 }}
                >
                  to scale your detailing business
                </motion.span>
              </motion.h1>
              <motion.p 
                className="text-xl lg:text-2xl text-gray-600 mb-8 font-sarabun leading-relaxed max-w-4xl mx-auto"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.7 }}
              >
                We deliver the products, leads, installers, warranty & system. You deliver perfection.
              </motion.p>

              <motion.div 
                className="flex flex-col sm:flex-row gap-4 justify-center mb-12"
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.9 }}
              >
                <Button 
                  size="lg" 
                  className="bg-primary hover:bg-primary/90 text-white px-12 py-4 text-lg font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
                  onClick={() => setShowApplicationForm(true)}
                >
                  Become a P91 Partner
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="border-primary text-primary hover:bg-primary/10 px-12 py-4 text-lg font-semibold rounded-lg transition-all transform hover:scale-105"
                  onClick={() => setShowApplicationForm(true)}
                >
                  Check Eligibility
                </Button>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Who This Is For Section */}
      <motion.section 
        className="py-20 bg-gray-50"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        <div className="container-premium">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl font-oxanium font-bold text-gray-900 mb-6">Who This Is For</h2>
            <p className="text-xl text-gray-600 font-sarabun max-w-4xl mx-auto">
              Studios and detailing brands that want to add or scale PPF without juggling multiple vendors, freelancers, and agencies. If you deliver clean work and follow SOPs, we'll keep your bay busy—and profitable.
            </p>
          </motion.div>
          <motion.div 
            className="text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            viewport={{ once: true }}
          >
            
              <Button size="lg" className="bg-primary hover:bg-primary/90 text-white px-8 py-3 font-semibold transform hover:scale-105 transition-all" onClick={() => setShowApplicationForm(true)}>
                Become a PPF Partner
              </Button>
            
          </motion.div>
        </div>
      </motion.section>

      {/* What You Get Section */}
      <motion.section 
        className="py-20 bg-gray-50"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        <div className="container-premium">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl font-oxanium font-bold text-gray-900 mb-6">What You Get When You Partner with P91</h2>
            <p className="text-xl text-gray-600 font-sarabun max-w-4xl mx-auto">
              Complete business acceleration package designed to maximize your revenue, minimize your hassles, and scale your PPF business with confidence.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              viewport={{ once: true }}
            >
              <Card className="h-full border-2 hover:border-primary/50 transition-all duration-300">
                <CardHeader>
                  <Shield className="h-10 w-10 text-primary mb-3" />
                  <CardTitle className="font-oxanium text-lg">Complete Range of Products</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 text-sm mb-3">Premium PPF range plus ceramic coating solutions with flexible credit periods that keep your cash flow smooth and inventory always stocked.</p>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">PPF Films</span>
                      <span className="text-xs font-semibold text-primary">Available</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">Ceramic Coating</span>
                      <Badge className="text-xs bg-primary/10 text-primary">Launching Soon</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
            >
              <Card className="h-full border-2 hover:border-primary/50 transition-all duration-300">
                <CardHeader>
                  <Target className="h-10 w-10 text-primary mb-3" />
                  <CardTitle className="font-oxanium text-lg">Qualified Leads</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 text-sm">Pre-qualified customer leads delivered directly to boost your revenue with higher conversion rates.</p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              viewport={{ once: true }}
            >
              <Card className="h-full border-2 hover:border-primary/50 transition-all duration-300">
                <CardHeader>
                  <Users className="h-10 w-10 text-primary mb-3" />
                  <CardTitle className="font-oxanium text-lg">Installer at Your Disposal</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 text-sm">Access to trained installers for easy execution of jobs without hiring and training headaches.</p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              viewport={{ once: true }}
            >
              <Card className="h-full border-2 hover:border-primary/50 transition-all duration-300">
                <CardHeader>
                  <Award className="h-10 w-10 text-primary mb-3" />
                  <CardTitle className="font-oxanium text-lg">Training to Deliver Better</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 text-sm">Monthly hands-on training sessions and product knowledge workshops to enhance your expertise.</p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              viewport={{ once: true }}
            >
              <Card className="h-full border-2 hover:border-primary/50 transition-all duration-300">
                <CardHeader>
                  <Camera className="h-10 w-10 text-primary mb-3" />
                  <CardTitle className="font-oxanium text-lg">Content Creation & Recognition</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 text-sm">Professional content creation and Pan-India recognition to build your brand presence.</p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              viewport={{ once: true }}
            >
              <Card className="h-full border-2 hover:border-primary/50 transition-all duration-300">
                <CardHeader>
                  <Star className="h-10 w-10 text-primary mb-3" />
                  <CardTitle className="font-oxanium text-lg">Local Influencer Boost</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 text-sm">Local influencer partnerships and social media amplification to increase your market reach.</p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.7 }}
              viewport={{ once: true }}
            >
              <Card className="h-full border-2 hover:border-primary/50 transition-all duration-300">
                <CardHeader>
                  <Eye className="h-10 w-10 text-primary mb-3" />
                  <CardTitle className="font-oxanium text-lg">Demo Tools for Customer Experience</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 text-sm">Interactive demo tools that let customers experience PPF benefits firsthand for higher conversions.</p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.8 }}
              viewport={{ once: true }}
            >
              <Card className="h-full border-2 hover:border-primary/50 transition-all duration-300">
                <CardHeader>
                  <Smartphone className="h-10 w-10 text-primary mb-3" />
                  <CardTitle className="font-oxanium text-lg">Access to P91 Pulse</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 text-sm">Complete software platform to manage leads, inventory, installations, and customer relationships.</p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.9 }}
              viewport={{ once: true }}
            >
              <Card className="h-full border-2 hover:border-primary/50 transition-all duration-300">
                <CardHeader>
                  <Calendar className="h-10 w-10 text-primary mb-3" />
                  <CardTitle className="font-oxanium text-lg">Advance Booking Management</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 text-sm">Dedicated booking portal for your store to reduce no-shows and optimize scheduling.</p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1.0 }}
              viewport={{ once: true }}
            >
              <Card className="h-full border-2 hover:border-primary/50 transition-all duration-300">
                <CardHeader>
                  <HeadphonesIcon className="h-10 w-10 text-primary mb-3" />
                  <CardTitle className="font-oxanium text-lg">Dedicated Sales Team</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 text-sm">Professional sales team that follows up and helps you close end-user leads effectively.</p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1.1 }}
              viewport={{ once: true }}
            >
              <Card className="h-full border-2 hover:border-primary/50 transition-all duration-300">
                <CardHeader>
                  <CreditCard className="h-10 w-10 text-primary mb-3" />
                  <CardTitle className="font-oxanium text-lg">EMI Options</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 text-sm">Flexible EMI options to offer clients for quick conversion and increased deal sizes.</p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1.2 }}
              viewport={{ once: true }}
            >
              <Card className="h-full border-2 hover:border-primary/50 transition-all duration-300">
                <CardHeader>
                  <Shield className="h-10 w-10 text-primary mb-3" />
                  <CardTitle className="font-oxanium text-lg">Insurance to Sell</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 text-sm">Additional insurance products to offer for extra margins while providing relief to clients.</p>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          <div className="text-center bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg p-8">
            <h3 className="text-2xl font-oxanium font-bold text-gray-900 mb-4">Everything You Need to Scale Your PPF Business</h3>
            <p className="text-gray-600 max-w-3xl mx-auto mb-6">
              From products to profits, training to technology - we provide a complete ecosystem designed to accelerate your success in the PPF industry.
            </p>
            
              <Button 
                size="lg" 
                className="bg-primary hover:bg-primary/90 text-white px-12 py-4 text-lg font-semibold" 
                onClick={() => setShowApplicationForm(true)}
              >
                Get All These Benefits - Partner Now
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            
          </div>
        </div>
      </motion.section>

      {/* P91 PPF Range Section */}
      <section className="py-20 bg-white">
        <div className="container-premium">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-oxanium font-bold text-gray-900 mb-6">Our PPF Range for You to Excel</h2>
            <p className="text-xl text-gray-600 font-sarabun max-w-4xl mx-auto mb-8">
              Purpose-built films for Indian roads and weather. Three lines, one standard: self-healing, hydrophobic, UV-stable, stain-resistant, peel-safe adhesive, high optical clarity.
            </p>
            
            {/* Hero Product Image */}
            <div className="rounded-lg mb-12 overflow-hidden">
              <img 
                src={ppfRangeImagePath}
                alt="P91 PPF Product Range - Professional Paint Protection Film"
                className="w-full h-auto object-cover rounded-lg"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-12">
            {/* P91 Basic */}
            <Card className="border-2 hover:border-primary/50 transition-all duration-300">
              <CardHeader>
                <CardTitle className="font-oxanium text-2xl text-center">P91 Basic</CardTitle>
                <p className="text-center text-gray-600 font-sarabun">Everyday clarity + dependable protection for daily drivers</p>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 mb-6">
                  <li className="flex items-center">
                    <Check className="h-4 w-4 text-primary mr-2" />
                    Smooth install, easy edge work
                  </li>
                  <li className="flex items-center">
                    <Check className="h-4 w-4 text-primary mr-2" />
                    Consistent finish across panels
                  </li>
                  <li className="flex items-center">
                    <Check className="h-4 w-4 text-primary mr-2" />
                    Ideal for hoods, bumpers, mirrors
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* P91 Matte */}
            <Card className="border-2 hover:border-primary/50 transition-all duration-300">
              <CardHeader>
                <CardTitle className="font-oxanium text-2xl text-center">P91 Matte</CardTitle>
                <p className="text-center text-gray-600 font-sarabun">Factory-matte stealth with uniform texture and low haze</p>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 mb-6">
                  <li className="flex items-center">
                    <Check className="h-4 w-4 text-primary mr-2" />
                    Converts gloss to matte
                  </li>
                  <li className="flex items-center">
                    <Check className="h-4 w-4 text-primary mr-2" />
                    Preserves color depth underneath
                  </li>
                  <li className="flex items-center">
                    <Check className="h-4 w-4 text-primary mr-2" />
                    Premium SUV/4×4 builds
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* P91 Spectrum */}
            <Card className="border-2 hover:border-primary/50 transition-all duration-300">
              <CardHeader>
                <CardTitle className="font-oxanium text-2xl text-center">P91 Spectrum</CardTitle>
                <p className="text-center text-gray-600 font-sarabun">100+ color options: solids, metallics, pearls, and special effects</p>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 mb-6">
                  <li className="flex items-center">
                    <Check className="h-4 w-4 text-primary mr-2" />
                    Show-car style with PPF protection
                  </li>
                  <li className="flex items-center">
                    <Check className="h-4 w-4 text-primary mr-2" />
                    Color + impact resistance in one
                  </li>
                  <li className="flex items-center">
                    <Check className="h-4 w-4 text-primary mr-2" />
                    Premium upsells, influencer builds
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Technical Specifications */}
          <Card className="bg-gray-50 border-0">
            <CardContent className="p-8">
              <h3 className="text-2xl font-oxanium font-bold mb-6 text-center">Technical Specifications</h3>
              <div className="grid md:grid-cols-3 gap-8">
                <div className="space-y-4">
                  <h4 className="font-semibold text-lg text-primary">Material Properties</h4>
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <Shield className="h-4 w-4 text-primary mr-2" />
                      <span className="text-sm">Multi-layer TPU construction</span>
                    </div>
                    <div className="flex items-center">
                      <Shield className="h-4 w-4 text-primary mr-2" />
                      <span className="text-sm">Self-healing topcoat (60°C activation)</span>
                    </div>
                    <div className="flex items-center">
                      <Shield className="h-4 w-4 text-primary mr-2" />
                      <span className="text-sm">UV-stable polymer base</span>
                    </div>
                    <div className="flex items-center">
                      <Shield className="h-4 w-4 text-primary mr-2" />
                      <span className="text-sm">Thickness: 150-200 microns</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <h4 className="font-semibold text-lg text-primary">Performance Features</h4>
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <Eye className="h-4 w-4 text-primary mr-2" />
                      <span className="text-sm">98%+ optical clarity</span>
                    </div>
                    <div className="flex items-center">
                      <Eye className="h-4 w-4 text-primary mr-2" />
                      <span className="text-sm">Hydrophobic surface coating</span>
                    </div>
                    <div className="flex items-center">
                      <Eye className="h-4 w-4 text-primary mr-2" />
                      <span className="text-sm">Stain-resistant technology</span>
                    </div>
                    <div className="flex items-center">
                      <Eye className="h-4 w-4 text-primary mr-2" />
                      <span className="text-sm">Temperature range: -40°C to 80°C</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <h4 className="font-semibold text-lg text-primary">Installation & Support</h4>
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <Wrench className="h-4 w-4 text-primary mr-2" />
                      <span className="text-sm">Peel-safe acrylic adhesive</span>
                    </div>
                    <div className="flex items-center">
                      <Wrench className="h-4 w-4 text-primary mr-2" />
                      <span className="text-sm">Pre-cut pattern database</span>
                    </div>
                    <div className="flex items-center">
                      <Wrench className="h-4 w-4 text-primary mr-2" />
                      <span className="text-sm">24-hour cure time</span>
                    </div>
                    <div className="flex items-center">
                      <Wrench className="h-4 w-4 text-primary mr-2" />
                      <span className="text-sm">Indian climate optimized</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="text-center mt-8">
            
              <Button size="lg" className="bg-primary hover:bg-primary/90 text-white px-8 py-3 font-semibold transform hover:scale-105 transition-all" onClick={() => setShowApplicationForm(true)}>
                Become a PPF Partner
              </Button>
            
          </div>
        </div>
      </section>

      {/* Ceramic Coating Product Range Section */}
      <motion.section 
        className="py-20 bg-gradient-to-br from-primary/5 to-primary/10"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        <div className="container-premium">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl font-oxanium font-bold text-gray-900 mb-6">Ceramic Coating Range</h2>
            <div className="flex items-center justify-center mb-4">
              <Badge className="text-sm bg-primary/10 text-primary px-4 py-2 font-semibold">Launching Soon</Badge>
            </div>
            <p className="text-xl text-gray-600 font-sarabun max-w-4xl mx-auto">
              Advanced Protection. Lasting Brilliance. Complete your offering with our premium ceramic coating solutions designed to complement your PPF services.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              viewport={{ once: true }}
            >
              <Card className="h-full border-2 hover:border-primary/50 transition-all duration-300">
                <CardHeader className="text-center">
                  <div className="w-full h-32 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4 overflow-hidden">
                    <img 
                      src={p3ImagePath}
                      alt="P91 3 Nano Ceramic Coating"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <CardTitle className="font-oxanium text-xl">P91 3</CardTitle>
                  <p className="text-sm text-gray-500">Nano Ceramic Coating</p>
                </CardHeader>
                <CardContent className="text-center">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500">Hardness:</span>
                      <span className="text-xs font-semibold">9H</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500">Durability:</span>
                      <span className="text-xs font-semibold">3 Years</span>
                    </div>
                    <p className="text-xs text-gray-600 pt-2">Ideal for daily drivers seeking basic protection with a lasting shine.</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
            >
              <Card className="h-full border-2 hover:border-primary/50 transition-all duration-300">
                <CardHeader className="text-center">
                  <div className="w-full h-32 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4 overflow-hidden">
                    <img 
                      src={p5ImagePath}
                      alt="P91 5 Nano Ceramic Coating"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <CardTitle className="font-oxanium text-xl">P91 5</CardTitle>
                  <p className="text-sm text-gray-500">Nano Ceramic Coating</p>
                </CardHeader>
                <CardContent className="text-center">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500">Hardness:</span>
                      <span className="text-xs font-semibold">9H</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500">Durability:</span>
                      <span className="text-xs font-semibold">3 Years</span>
                    </div>
                    <p className="text-xs text-gray-600 pt-2">Enhanced protection with extended water repellency and gloss.</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              viewport={{ once: true }}
            >
              <Card className="h-full border-2 border-primary hover:border-primary transition-all duration-300">
                <CardHeader className="text-center">
                  <div className="w-full h-32 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4 overflow-hidden relative">
                    <img 
                      src={p7ImagePath}
                      alt="P91 7 Nano Ceramic Coating"
                      className="w-full h-full object-cover"
                    />
                    <Badge className="absolute top-2 right-2 text-xs bg-primary text-white">Featured</Badge>
                  </div>
                  <CardTitle className="font-oxanium text-xl text-primary">P91 7</CardTitle>
                  <p className="text-sm text-gray-500">Nano Ceramic Coating</p>
                </CardHeader>
                <CardContent className="text-center">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500">Hardness:</span>
                      <span className="text-xs font-semibold text-primary">10H</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500">Durability:</span>
                      <span className="text-xs font-semibold text-primary">7 Years</span>
                    </div>
                    <p className="text-xs text-gray-600 pt-2">Long-term shield with ultra-gloss, best suited for premium vehicles.</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              viewport={{ once: true }}
            >
              <Card className="h-full border-2 border-primary hover:border-primary transition-all duration-300">
                <CardHeader className="text-center">
                  <div className="w-full h-32 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4 overflow-hidden relative">
                    <img 
                      src={graphineImagePath}
                      alt="P91 Graphene Ceramic Coating"
                      className="w-full h-full object-cover"
                    />
                    <Badge className="absolute top-2 right-2 text-xs bg-primary text-white">Featured</Badge>
                  </div>
                  <CardTitle className="font-oxanium text-lg text-primary">P91 Graphene</CardTitle>
                  <p className="text-sm text-gray-500">Graphene Ceramic Coating</p>
                </CardHeader>
                <CardContent className="text-center">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500">Hardness:</span>
                      <span className="text-xs font-semibold text-primary">10H</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500">Durability:</span>
                      <span className="text-xs font-semibold text-primary">5 Years</span>
                    </div>
                    <p className="text-xs text-gray-600 pt-2">Advanced coating infused with graphene for higher heat resistance, slickness, and UV protection.</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Specialty Products */}
          <div className="mb-12">
            <h3 className="text-2xl font-oxanium font-bold text-gray-900 mb-8 text-center">Specialty Applications</h3>
            <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="h-full border-2 hover:border-primary/50 transition-all duration-300">
                  <CardHeader className="text-center">
                    <div className="w-full h-24 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4 overflow-hidden">
                      <img 
                        src={trimImagePath}
                        alt="P91 Trim - Plastic & Rubber Trims"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <CardTitle className="font-oxanium text-xl">P91 Trim</CardTitle>
                    <p className="text-sm text-gray-500">Plastic & Rubber Trims</p>
                  </CardHeader>
                  <CardContent className="text-center">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-500">Durability:</span>
                        <span className="text-xs font-semibold">2 Years</span>
                      </div>
                      <p className="text-xs text-gray-600 pt-2">Restores and protects exterior trims from fading, cracking, and UV damage.</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                viewport={{ once: true }}
              >
                <Card className="h-full border-2 hover:border-primary/50 transition-all duration-300">
                  <CardHeader className="text-center">
                    <div className="w-full h-24 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4 overflow-hidden">
                      <img 
                        src={glassImagePath}
                        alt="P91 Glass - Windshields & Windows"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <CardTitle className="font-oxanium text-xl">P91 Glass</CardTitle>
                    <p className="text-sm text-gray-500">Windshields & Windows</p>
                  </CardHeader>
                  <CardContent className="text-center">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-500">Durability:</span>
                        <span className="text-xs font-semibold">2 Years</span>
                      </div>
                      <p className="text-xs text-gray-600 pt-2">Enhances visibility with superior hydrophobic properties for safe driving in all conditions.</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </div>

          {/* Benefits */}
          <div className="bg-white rounded-lg p-8 shadow-sm">
            <h3 className="text-2xl font-oxanium font-bold text-gray-900 mb-6 text-center">Key Benefits</h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 text-primary mr-3 flex-shrink-0" />
                <span className="text-sm text-gray-600">Long-lasting durability (up to 7 years)</span>
              </div>
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 text-primary mr-3 flex-shrink-0" />
                <span className="text-sm text-gray-600">Enhanced gloss & color depth</span>
              </div>
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 text-primary mr-3 flex-shrink-0" />
                <span className="text-sm text-gray-600">Superior UV & chemical resistance</span>
              </div>
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 text-primary mr-3 flex-shrink-0" />
                <span className="text-sm text-gray-600">Easy-to-clean hydrophobic surface</span>
              </div>
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 text-primary mr-3 flex-shrink-0" />
                <span className="text-sm text-gray-600">Advanced nano & graphene technology</span>
              </div>
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 text-primary mr-3 flex-shrink-0" />
                <span className="text-sm text-gray-600">Professional application support</span>
              </div>
            </div>
            
            <div className="text-center mt-8">
              
                <Button size="lg" className="bg-primary hover:bg-primary/90 text-white px-8 py-3 font-semibold">
                  Get Early Access - Partner Now
                </Button>
              
            </div>
          </div>
        </div>
      </motion.section>

      {/* P91 Pulse Section */}
      <motion.section 
        className="py-20 bg-gradient-to-br from-primary/5 to-white"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        <div className="container-premium">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl lg:text-5xl font-oxanium font-bold text-gray-900 mb-6">
              P91 Pulse — Built to Accelerate Your Success
            </h2>
            <p className="text-xl text-gray-600 font-sarabun max-w-4xl mx-auto mb-8">
              Powerful but simple platform that puts comprehensive business tools at your fingertips. Manage your shop, customers, warranties, and analytics to boost performance.
            </p>
          </motion.div>

          {/* Dashboard Preview */}
          <motion.div 
            className="grid lg:grid-cols-2 gap-12 items-center mb-16"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true }}
          >
            <div>
              <h3 className="text-3xl font-oxanium font-bold text-gray-900 mb-6">
                Complete Business Dashboard
              </h3>
              <p className="text-lg text-gray-600 mb-6 font-sarabun">
                Monitor your shop performance with real-time analytics, track warranty registrations, manage customer relationships, and access comprehensive business insights—all from one unified platform.
              </p>
              <div className="space-y-4">
                <motion.div 
                  className="flex items-center"
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                  viewport={{ once: true }}
                >
                  <BarChart3 className="h-6 w-6 text-primary mr-3" />
                  <span className="text-gray-700">Real-time business analytics & reporting</span>
                </motion.div>
                <motion.div 
                  className="flex items-center"
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.5 }}
                  viewport={{ once: true }}
                >
                  <Award className="h-6 w-6 text-primary mr-3" />
                  <span className="text-gray-700">eWarranty management & tracking</span>
                </motion.div>
                <motion.div 
                  className="flex items-center"
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.6 }}
                  viewport={{ once: true }}
                >
                  <Users className="h-6 w-6 text-primary mr-3" />
                  <span className="text-gray-700">AI-powered lead management system</span>
                </motion.div>
                <motion.div 
                  className="flex items-center"
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.7 }}
                  viewport={{ once: true }}
                >
                  <Smartphone className="h-6 w-6 text-primary mr-3" />
                  <span className="text-gray-700">Mobile-first design for on-the-go access</span>
                </motion.div>
              </div>
            </div>
            
            {/* Dashboard Screenshot Placeholder */}
            <motion.div 
              className="bg-white rounded-xl shadow-2xl p-8"
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              viewport={{ once: true }}
            >
              <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg p-4 overflow-hidden">
                <img 
                  src={p91PulseDashboardPath}
                  alt="P91 Pulse Dashboard - Interactive Analytics & Controls"
                  className="w-full h-auto object-contain rounded-lg shadow-lg"
                />
              </div>
            </motion.div>
          </motion.div>

          {/* Features Grid */}
          <motion.div 
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            viewport={{ once: true }}
          >
            {[
              {
                title: "eWarranty Hub for Growth",
                description: "Register, manage, and claim PPF & coating warranties with real-time tracking and automated alerts.",
                icon: <Award className="w-10 h-10 text-primary mb-3" />
              },
              {
                title: "Lead Engine for You",
                description: "Capture, track, and convert leads with AI-powered system offering intelligent follow-ups and analytics.",
                icon: <Users className="w-10 h-10 text-primary mb-3" />
              },
              {
                title: "Product Library",
                description: "Full access to P91's SKUs with specifications, installation guides, and marketing media.",
                icon: <FileText className="w-10 h-10 text-primary mb-3" />
              },
              {
                title: "Business Analytics",
                description: "Detailed insights, sales trends, performance metrics, and strategic decision-making tools.",
                icon: <BarChart3 className="w-10 h-10 text-primary mb-3" />
              },
              {
                title: "Skills Hub for Excellence",
                description: "On-demand training, installation guides, certification modules, and expert workshops.",
                icon: <Building className="w-10 h-10 text-primary mb-3" />
              },
              {
                title: "Marketing Toolkit",
                description: "Ready-to-use creatives, social media assets, branding tools, and customizable templates.",
                icon: <Camera className="w-10 h-10 text-primary mb-3" />
              }
            ].map((feature, index) => (
              <motion.div
                key={feature.title}
                className="bg-white rounded-xl p-8 shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <div className="text-center">
                  {feature.icon}
                  <h3 className="text-lg font-oxanium font-bold text-gray-900 mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-gray-600 font-sarabun leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Mobile App Preview */}
          <motion.div 
            className="bg-white rounded-xl p-8 shadow-xl"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true }}
          >
            <div className="text-center mb-8">
              <h3 className="text-3xl font-oxanium font-bold text-gray-900 mb-4">
                Access Anywhere, Anytime
              </h3>
              <p className="text-lg text-gray-600 font-sarabun max-w-3xl mx-auto">
                Lightweight, mobile-first platform designed for professionals on the go. Run your business from your smartphone with the same power as desktop.
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              <motion.div 
                className="text-center"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                viewport={{ once: true }}
              >
                <div className="bg-primary/10 rounded-lg h-48 flex items-center justify-center mb-4">
                  <Smartphone className="h-16 w-16 text-primary" />
                </div>
                <h4 className="font-oxanium font-bold text-gray-900 mb-2">Mobile Dashboard</h4>
                <p className="text-sm text-gray-600 font-sarabun">Full-featured mobile interface</p>
              </motion.div>
              
              <motion.div 
                className="text-center"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.5 }}
                viewport={{ once: true }}
              >
                <div className="bg-primary/10 rounded-lg h-48 flex items-center justify-center mb-4">
                  <Target className="h-16 w-16 text-primary" />
                </div>
                <h4 className="font-oxanium font-bold text-gray-900 mb-2">Real-time Sync</h4>
                <p className="text-sm text-gray-600 font-sarabun">Instant updates across devices</p>
              </motion.div>
              
              <motion.div 
                className="text-center"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.6 }}
                viewport={{ once: true }}
              >
                <div className="bg-primary/10 rounded-lg h-48 flex items-center justify-center mb-4">
                  <Zap className="h-16 w-16 text-primary" />
                </div>
                <h4 className="font-oxanium font-bold text-gray-900 mb-2">Lightning Fast</h4>
                <p className="text-sm text-gray-600 font-sarabun">Optimized for speed & efficiency</p>
              </motion.div>
            </div>
          </motion.div>

          <motion.div 
            className="text-center mt-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            viewport={{ once: true }}
          >
            
              <Button size="lg" className="bg-primary hover:bg-primary/90 text-white px-8 py-3 font-semibold transform hover:scale-105 transition-all" onClick={() => setShowApplicationForm(true)}>
                Become a PPF Partner
              </Button>
            
          </motion.div>
        </div>
      </motion.section>

      {/* One-Roof Promise Section */}
      <motion.section 
        className="py-20 bg-gradient-to-br from-primary/5 to-primary/10"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        <div className="container-premium">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl font-oxanium font-bold text-gray-900 mb-6">Your Complete Growth Partnership Under One Roof</h2>
            <p className="text-xl text-gray-600 font-sarabun max-w-4xl mx-auto">
              With P91, you get Product + Pipeline + Process + Platform—under one roof.
            </p>
          </motion.div>

          <motion.div 
            className="grid lg:grid-cols-2 gap-12"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true }}
          >
            {/* Product */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              viewport={{ once: true }}
            >
              <Card className="border-2 hover:border-primary/50 transition-all duration-300 transform hover:scale-105">
                <CardHeader>
                  <div className="flex items-center mb-4">
                    <Shield className="h-8 w-8 text-primary mr-3" />
                    <CardTitle className="font-oxanium text-2xl">Product</CardTitle>
                  </div>
                </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <Check className="h-4 w-4 text-primary mr-2 mt-1" />
                    <span>Full P91 PPF range (Basic, Matte, SpectraMe) with reliable supply</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-4 w-4 text-primary mr-2 mt-1" />
                    <span>Pre-cut pattern support for faster, cleaner installs</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-4 w-4 text-primary mr-2 mt-1" />
                    <span>Starter tool kit recommendations, consumables checklist</span>
                  </li>
                </ul>
              </CardContent>
              </Card>
            </motion.div>

            {/* Pipeline */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
            >
              <Card className="border-2 hover:border-primary/50 transition-all duration-300 transform hover:scale-105">
              <CardHeader>
                <div className="flex items-center mb-4">
                  <TrendingUp className="h-8 w-8 text-primary mr-3" />
                  <CardTitle className="font-oxanium text-2xl">Pipeline</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <Check className="h-4 w-4 text-primary mr-2 mt-1" />
                    <span>Qualified leads routed to your studio (₹0 ad spend from you)</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-4 w-4 text-primary mr-2 mt-1" />
                    <span>Dedicated call center that follows up till booking fee is paid</span>
                  </li>
                </ul>
              </CardContent>
              </Card>
            </motion.div>

            {/* Process */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              viewport={{ once: true }}
            >
              <Card className="border-2 hover:border-primary/50 transition-all duration-300 transform hover:scale-105">
              <CardHeader>
                <div className="flex items-center mb-4">
                  <Wrench className="h-8 w-8 text-primary mr-3" />
                  <CardTitle className="font-oxanium text-2xl">Process</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <Check className="h-4 w-4 text-primary mr-2 mt-1" />
                    <span>P91 SOPs, job cards, QC checklists, and install audits</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-4 w-4 text-primary mr-2 mt-1" />
                    <span>On-demand installers to solve manpower gaps instantly</span>
                  </li>
                </ul>
              </CardContent>
              </Card>
            </motion.div>

            {/* Platform */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              viewport={{ once: true }}
            >
              <Card className="border-2 hover:border-primary/50 transition-all duration-300 transform hover:scale-105">
              <CardHeader>
                <div className="flex items-center mb-4">
                  <Smartphone className="h-8 w-8 text-primary mr-3" />
                  <CardTitle className="font-oxanium text-2xl">Platform: P91 Pulse</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <Check className="h-4 w-4 text-primary mr-2 mt-1" />
                    <span>One login to manage leads, jobs, warranty, claims, inventory, analytics</span>
                  </li>
                </ul>
              </CardContent>
              </Card>
            </motion.div>
          </motion.div>

          <motion.div 
            className="text-center mt-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            viewport={{ once: true }}
          >
            
              <Button size="lg" className="bg-primary hover:bg-primary/90 text-white px-8 py-3 font-semibold transform hover:scale-105 transition-all" onClick={() => setShowApplicationForm(true)}>
                Become a PPF Partner
              </Button>
            
          </motion.div>
        </div>
      </motion.section>



      {/* Marketing Section */}
      <motion.section 
        className="py-20 bg-gray-50"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        <div className="container-premium">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl font-oxanium font-bold text-gray-900 mb-6">Marketing Engine Built for Your Business Growth</h2>
            
            {/* Marketing Gallery Preview */}
            <motion.div 
              className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12"
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
            >
              <div className="bg-white rounded-lg h-32 flex items-center justify-center shadow-sm">
                <div className="text-center">
                  <Camera className="h-8 w-8 text-primary mx-auto mb-2" />
                  <p className="text-xs text-gray-500">Content Creation</p>
                </div>
              </div>
              <div className="bg-white rounded-lg h-32 flex items-center justify-center shadow-sm">
                <div className="text-center">
                  <Target className="h-8 w-8 text-primary mx-auto mb-2" />
                  <p className="text-xs text-gray-500">Social Media</p>
                </div>
              </div>
              <div className="bg-white rounded-lg h-32 flex items-center justify-center shadow-sm">
                <div className="text-center">
                  <Zap className="h-8 w-8 text-primary mx-auto mb-2" />
                  <p className="text-xs text-gray-500">Ad Campaigns</p>
                </div>
              </div>
              <div className="bg-white rounded-lg h-32 flex items-center justify-center shadow-sm">
                <div className="text-center">
                  <MapPin className="h-8 w-8 text-primary mx-auto mb-2" />
                  <p className="text-xs text-gray-500">Local SEO</p>
                </div>
              </div>
            </motion.div>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            {/* Paid Performance */}
            <Card className="border-2 hover:border-primary/50 transition-all duration-300">
              <CardHeader>
                <Zap className="h-12 w-12 text-primary mb-4" />
                <CardTitle className="font-oxanium text-xl">Paid Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">Meta/Google/Maps campaigns with city & model playbooks (Thar, Creta, Fortuner, etc.)</p>
              </CardContent>
            </Card>

            {/* Local SEO & Maps */}
            <Card className="border-2 hover:border-primary/50 transition-all duration-300">
              <CardHeader>
                <MapPin className="h-12 w-12 text-primary mb-4" />
                <CardTitle className="font-oxanium text-xl">Local SEO & Maps</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">Google Business Profile optimization, weekly posts, geo-tagged photos, directory cleanup</p>
              </CardContent>
            </Card>

            {/* Content Engine */}
            <Card className="border-2 hover:border-primary/50 transition-all duration-300">
              <CardHeader>
                <Camera className="h-12 w-12 text-primary mb-4" />
                <CardTitle className="font-oxanium text-xl">Content Engine</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">Monthly in-store shoot (reels/shorts/photos), we script, shoot, edit, and post</p>
              </CardContent>
            </Card>
          </div>

          <div className="text-center mt-8">
            
              <Button size="lg" className="bg-primary hover:bg-primary/90 text-white px-8 py-3 font-semibold">
                Become a PPF Partner
              </Button>
            
          </div>
        </div>
      </motion.section>

      {/* Expansion Plan Section */}
      <section className="py-20 bg-gray-50">
        <div className="container-premium">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-oxanium font-bold text-gray-900 mb-6">Your Territory, Your Growth — Join Our 2025 Expansion</h2>
            <p className="text-xl text-gray-600 font-sarabun max-w-3xl mx-auto">
              We're onboarding Pan-India with priority clusters. Early partners get territory preference, creator slots, and first access to new programs.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card className="text-center">
              <CardHeader>
                <CardTitle className="font-oxanium text-lg text-primary">North</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li>Delhi</li>
                  <li>Chandigarh</li>
                  <li>Jaipur</li>
                  <li>Lucknow</li>
                  <li>Kanpur</li>
                  <li>Ludhiana</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <CardTitle className="font-oxanium text-lg text-primary">West</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li>Mumbai</li>
                  <li>Pune</li>
                  <li>Ahmedabad</li>
                  <li>Surat</li>
                  <li>Vadodara</li>
                  <li>Rajkot</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <CardTitle className="font-oxanium text-lg text-primary">South</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li>Bengaluru</li>
                  <li>Chennai</li>
                  <li>Hyderabad</li>
                  <li>Coimbatore</li>
                  <li>Kochi</li>
                  <li>Visakhapatnam</li>
                  <li>Goa / Mangalore region</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <CardTitle className="font-oxanium text-lg text-primary">Central & East</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li>Kolkata</li>
                  <li>Nagpur</li>
                  <li>Indore</li>
                  <li>Bhopal</li>
                  <li>Guwahati</li>
                  <li>Patna</li>
                </ul>
              </CardContent>
            </Card>
          </div>

          <div className="text-center mt-12">
            
              <Button size="lg" className="bg-primary hover:bg-primary/90 text-white px-8 py-3 font-semibold">
                Become a PPF Partner
              </Button>
            
          </div>
        </div>
      </section>

      {/* OEM Tie-ups Section */}
      <motion.section 
        className="py-20 bg-gradient-to-br from-primary/5 to-primary/10"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        <div className="container-premium">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl font-oxanium font-bold text-gray-900 mb-6">Access to Automobile OEM Tie-ups</h2>
            <p className="text-xl text-gray-600 font-sarabun max-w-4xl mx-auto">
              P91 is securing partnerships with major car and bike manufacturers across India. As our partner, you'll get exclusive opportunities to execute installations directly from OEM showrooms and service centers, creating a steady revenue stream with premium margins.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              viewport={{ once: true }}
            >
              <Card className="h-full border-2 hover:border-primary/50 transition-all duration-300">
                <CardHeader>
                  <Building className="h-12 w-12 text-primary mb-4" />
                  <CardTitle className="font-oxanium text-xl">OEM Showroom Access</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">Direct partnerships with car manufacturers enable you to offer PPF installation right at the point of sale, capturing customers when they're most excited about protecting their new vehicle.</p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
            >
              <Card className="h-full border-2 hover:border-primary/50 transition-all duration-300">
                <CardHeader>
                  <TrendingUp className="h-12 w-12 text-primary mb-4" />
                  <CardTitle className="font-oxanium text-xl">Premium Revenue Stream</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">OEM tie-ups command higher margins and guaranteed volumes. These partnerships provide consistent monthly revenue with pre-qualified customers who value quality protection.</p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              viewport={{ once: true }}
            >
              <Card className="h-full border-2 hover:border-primary/50 transition-all duration-300">
                <CardHeader>
                  <MapPin className="h-12 w-12 text-primary mb-4" />
                  <CardTitle className="font-oxanium text-xl">Pan-India Network</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">From Maruti to Mahindra, Hyundai to Honda - our OEM partnerships span across multiple brands, giving you access to diverse customer segments and vehicle categories.</p>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          <div className="bg-white rounded-lg p-8 shadow-sm">
            <h3 className="text-2xl font-oxanium font-bold text-gray-900 mb-6 text-center">Smart Money Opportunities</h3>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-primary mt-1 mr-3 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-gray-900 text-sm">New Vehicle Protection</h4>
                    <p className="text-gray-600 text-sm">Install PPF during PDI process at dealerships, capturing customers at peak buying intent</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-primary mt-1 mr-3 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-gray-900 text-sm">Service Center Partnerships</h4>
                    <p className="text-gray-600 text-sm">Reach existing customers during routine services with protection upgrade offers</p>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-primary mt-1 mr-3 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-gray-900 text-sm">Corporate Fleet Access</h4>
                    <p className="text-gray-600 text-sm">Bulk installation opportunities with fleet operators and corporate vehicle programs</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-primary mt-1 mr-3 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-gray-900 text-sm">Exclusive Territory Rights</h4>
                    <p className="text-gray-600 text-sm">First access to OEM partnerships in your region with protected territory coverage</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Demo Tools Display Section */}
      <section className="py-20 bg-gray-50">
        <div className="container-premium">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-oxanium font-bold text-gray-900 mb-6">Demo Tools Display</h2>
            <p className="text-xl text-gray-600 font-sarabun max-w-4xl mx-auto">
              We don't just provide products and branding - we equip you with interactive demo tools that let customers experience PPF quality firsthand. These tools transform browsers into buyers by making the invisible benefits of PPF tangible and convincing.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-center mb-12">
            <div className="space-y-6">
              <h3 className="text-2xl font-oxanium font-bold text-gray-900">Experience-Driven Sales Tools</h3>
              <p className="text-gray-600 leading-relaxed">
                Our demo tools are designed to address every customer concern and showcase PPF benefits through hands-on interaction. Each tool demonstrates specific value propositions that directly address common objections and accelerate purchase decisions.
              </p>
              
              <div className="space-y-4">
                <div className="flex items-start">
                  <Eye className="h-6 w-6 text-primary mt-1 mr-3 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-gray-900">Visual Impact Demonstrations</h4>
                    <p className="text-gray-600 text-sm">Before/after samples showing paint protection effectiveness over time</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <Shield className="h-6 w-6 text-primary mt-1 mr-3 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-gray-900">Durability Testing Kits</h4>
                    <p className="text-gray-600 text-sm">Interactive tools that let customers test scratch resistance and impact protection</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <Smartphone className="h-6 w-6 text-primary mt-1 mr-3 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-gray-900">Digital Visualization Tools</h4>
                    <p className="text-gray-600 text-sm">AR apps and digital previews showing how PPF enhances vehicle appearance</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <motion.div
                className="bg-white rounded-lg overflow-hidden shadow-sm border-2 border-gray-100 hover:border-primary/30 transition-all duration-300"
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                viewport={{ once: true }}
              >
                <div className="relative">
                  <img 
                    src="/demo-tool-1.jpg" 
                    alt="Scratch Test Kit Demo Tool" 
                    className="w-full h-auto object-contain"
                  />
                  <div className="p-4 text-center">
                    <h4 className="font-oxanium font-semibold text-gray-900">Scratch Test Kit</h4>
                    <p className="text-xs text-gray-500 mt-1">Interactive scratch resistance demo</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                className="bg-white rounded-lg overflow-hidden shadow-sm border-2 border-gray-100 hover:border-primary/30 transition-all duration-300"
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                viewport={{ once: true }}
              >
                <div className="relative">
                  <img 
                    src="/demo-tool-2.jpg" 
                    alt="UV Protection Tester Demo Tool" 
                    className="w-full h-auto object-contain"
                  />
                  <div className="p-4 text-center">
                    <h4 className="font-oxanium font-semibold text-gray-900">UV Protection Tester</h4>
                    <p className="text-xs text-gray-500 mt-1">Window film UV ray blocking demonstration</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                className="bg-white rounded-lg overflow-hidden shadow-sm border-2 border-gray-100 hover:border-primary/30 transition-all duration-300"
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                viewport={{ once: true }}
              >
                <div className="relative">
                  <img 
                    src="/demo-tool-3.jpg" 
                    alt="Impact Tester Demo Tool" 
                    className="w-full h-auto object-contain"
                  />
                  <div className="p-4 text-center">
                    <h4 className="font-oxanium font-semibold text-gray-900">Impact Tester</h4>
                    <p className="text-xs text-gray-500 mt-1">Physical protection demonstration</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                className="bg-white rounded-lg overflow-hidden shadow-sm border-2 border-gray-100 hover:border-primary/30 transition-all duration-300"
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                viewport={{ once: true }}
              >
                <div className="relative">
                  <img 
                    src="/demo-tool-4.jpg" 
                    alt="Hydrophobicity Tester Demo Tool" 
                    className="w-full h-auto object-contain"
                  />
                  <div className="p-4 text-center">
                    <h4 className="font-oxanium font-semibold text-gray-900">Hydrophobicity Tester</h4>
                    <p className="text-xs text-gray-500 mt-1">Water repelling properties demonstration</p>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>

          <div className="bg-primary/5 rounded-lg p-8">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-oxanium font-bold text-gray-900 mb-4">Convert Easily with Hands-On Experience</h3>
              <p className="text-gray-600 max-w-3xl mx-auto">
                These demo tools eliminate customer hesitation by providing tangible proof of PPF benefits. When customers can touch, test, and see the difference, conversion rates increase dramatically.
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="bg-white rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <Target className="h-8 w-8 text-primary" />
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">Address Objections</h4>
                <p className="text-sm text-gray-600">Demo tools directly counter common concerns about visibility, durability, and value</p>
              </div>
              <div className="text-center">
                <div className="bg-white rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <Zap className="h-8 w-8 text-primary" />
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">Accelerate Decisions</h4>
                <p className="text-sm text-gray-600">Interactive experience reduces decision time from weeks to minutes</p>
              </div>
              <div className="text-center">
                <div className="bg-white rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="h-8 w-8 text-primary" />
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">Increase Conversions</h4>
                <p className="text-sm text-gray-600">Partners report 3x higher conversion rates with demo tool presentations</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Training and Product Knowledge Section */}
      <motion.section 
        className="py-20 bg-white"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        <div className="container-premium">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl font-oxanium font-bold text-gray-900 mb-6">Training & Product Knowledge Sessions</h2>
            <p className="text-xl text-gray-600 font-sarabun max-w-4xl mx-auto">
              We conduct hands-on, free training sessions every month and comprehensive product knowledge sessions in each city. This ensures you deliver better, faster, and with superior quality that builds customer trust and drives referrals.
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-12 items-center mb-12">
            <div className="space-y-8">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="border-2 hover:border-primary/50 transition-all duration-300">
                  <CardHeader>
                    <Wrench className="h-10 w-10 text-primary mb-3" />
                    <CardTitle className="font-oxanium text-lg">Monthly Hands-On Training</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 text-sm mb-4">Practical installation workshops covering advanced techniques, troubleshooting, and quality standards that set you apart from competitors.</p>
                    <ul className="space-y-2">
                      <li className="flex items-center text-sm text-gray-600"><CheckCircle className="h-4 w-4 text-primary mr-2" />Advanced installation patterns</li>
                      <li className="flex items-center text-sm text-gray-600"><CheckCircle className="h-4 w-4 text-primary mr-2" />Complex curve handling</li>
                      <li className="flex items-center text-sm text-gray-600"><CheckCircle className="h-4 w-4 text-primary mr-2" />Quality control processes</li>
                    </ul>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                viewport={{ once: true }}
              >
                <Card className="border-2 hover:border-primary/50 transition-all duration-300">
                  <CardHeader>
                    <FileText className="h-10 w-10 text-primary mb-3" />
                    <CardTitle className="font-oxanium text-lg">Product Knowledge Sessions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 text-sm mb-4">Deep-dive sessions on film properties, customer communication, and sales techniques that convert prospects into loyal customers.</p>
                    <ul className="space-y-2">
                      <li className="flex items-center text-sm text-gray-600"><CheckCircle className="h-4 w-4 text-primary mr-2" />Technical specifications</li>
                      <li className="flex items-center text-sm text-gray-600"><CheckCircle className="h-4 w-4 text-primary mr-2" />Customer education techniques</li>
                      <li className="flex items-center text-sm text-gray-600"><CheckCircle className="h-4 w-4 text-primary mr-2" />Warranty claim handling</li>
                    </ul>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            <div className="space-y-6">
              <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg p-8">
                <h3 className="text-2xl font-oxanium font-bold text-gray-900 mb-6">City-Wide Training Network</h3>
                
                <div className="grid md:grid-cols-2 gap-6 mb-6">
                  <div className="text-center">
                    <div className="bg-primary text-white rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-3 text-2xl font-bold">
                      50+
                    </div>
                    <p className="font-semibold text-gray-900">Training Cities</p>
                    <p className="text-sm text-gray-600">Nationwide coverage</p>
                  </div>
                  <div className="text-center">
                    <div className="bg-primary text-white rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-3 text-2xl font-bold">
                      12
                    </div>
                    <p className="font-semibold text-gray-900">Sessions Per Year</p>
                    <p className="text-sm text-gray-600">Monthly consistency</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-900">What Makes Our Training Different:</h4>
                  <div className="space-y-3">
                    <div className="flex items-start">
                      <Clock className="h-5 w-5 text-primary mt-1 mr-3 flex-shrink-0" />
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">Real-Time Problem Solving</p>
                        <p className="text-sm text-gray-600">Address actual challenges from your installations</p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <Users className="h-5 w-5 text-primary mt-1 mr-3 flex-shrink-0" />
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">Peer Learning Network</p>
                        <p className="text-sm text-gray-600">Connect with successful partners and share best practices</p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <Award className="h-5 w-5 text-primary mt-1 mr-3 flex-shrink-0" />
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">Certification Programs</p>
                        <p className="text-sm text-gray-600">Earn advanced installer credentials and customer trust</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center">
            <h3 className="text-2xl font-oxanium font-bold text-gray-900 mb-4">Deliver Better, Faster, Nicer</h3>
            <p className="text-gray-600 max-w-3xl mx-auto mb-8">
              Our training ensures you're not just installing PPF - you're delivering an experience that builds trust, drives referrals, and establishes your reputation as the premium PPF installer in your market.
            </p>
            
              <Button size="lg" className="bg-primary hover:bg-primary/90 text-white px-8 py-3 font-semibold">
                Join Our Training Network
              </Button>
            
          </div>
        </div>
      </motion.section>

      {/* Installer Network Section */}
      <section className="py-20 bg-gray-50">
        <div className="container-premium">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-oxanium font-bold text-gray-900 mb-6">Installer Network</h2>
            <p className="text-xl text-gray-600 font-sarabun max-w-4xl mx-auto">
              We have a network of skilled installers Pan-India available at your fingertips. This solves your biggest problem - manpower. Scale your business without the headache of hiring, training, or managing additional staff.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-center mb-12">
            <div className="space-y-6">
              <h3 className="text-2xl font-oxanium font-bold text-gray-900">Manpower Made Easy</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Our certified installer network operates across major cities, providing you with on-demand skilled professionals who maintain P91's quality standards. Whether you need temporary support during peak seasons or full-time installation teams, we've got you covered.
              </p>
              
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h4 className="font-oxanium font-semibold text-gray-900 text-lg mb-4">Network Highlights</h4>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="bg-primary text-white rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-2 text-lg font-bold">
                      500+
                    </div>
                    <p className="text-sm font-semibold text-gray-900">Certified Installers</p>
                  </div>
                  <div className="text-center">
                    <div className="bg-primary text-white rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-2 text-lg font-bold">
                      25+
                    </div>
                    <p className="text-sm font-semibold text-gray-900">Major Cities</p>
                  </div>
                  <div className="text-center">
                    <div className="bg-primary text-white rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-2 text-lg font-bold">
                      24/7
                    </div>
                    <p className="text-sm font-semibold text-gray-900">Availability</p>
                  </div>
                  <div className="text-center">
                    <div className="bg-primary text-white rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-2 text-lg font-bold">
                      P91
                    </div>
                    <p className="text-sm font-semibold text-gray-900">Quality Certified</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <Card className="border-2 hover:border-primary/50 transition-all duration-300">
                <CardHeader>
                  <Users className="h-10 w-10 text-primary mb-3" />
                  <CardTitle className="font-oxanium text-lg">On-Demand Support</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 text-sm mb-4">Access skilled installers when you need them - for rush orders, peak seasons, or expansion into new locations.</p>
                  <ul className="space-y-2">
                    <li className="flex items-center text-sm text-gray-600"><CheckCircle className="h-4 w-4 text-primary mr-2" />Same-day availability in major cities</li>
                    <li className="flex items-center text-sm text-gray-600"><CheckCircle className="h-4 w-4 text-primary mr-2" />Flexible engagement models</li>
                    <li className="flex items-center text-sm text-gray-600"><CheckCircle className="h-4 w-4 text-primary mr-2" />Pre-vetted and certified professionals</li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="border-2 hover:border-primary/50 transition-all duration-300">
                <CardHeader>
                  <Shield className="h-10 w-10 text-primary mb-3" />
                  <CardTitle className="font-oxanium text-lg">Quality Guaranteed</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 text-sm mb-4">Every installer in our network is P91-certified and maintains our quality standards with continuous monitoring.</p>
                  <ul className="space-y-2">
                    <li className="flex items-center text-sm text-gray-600"><CheckCircle className="h-4 w-4 text-primary mr-2" />P91 installation certification</li>
                    <li className="flex items-center text-sm text-gray-600"><CheckCircle className="h-4 w-4 text-primary mr-2" />Quality score tracking</li>
                    <li className="flex items-center text-sm text-gray-600"><CheckCircle className="h-4 w-4 text-primary mr-2" />Customer feedback monitoring</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="bg-primary/5 rounded-lg p-8 text-center">
            <h3 className="text-2xl font-oxanium font-bold text-gray-900 mb-4">Easy Execution of Your Jobs</h3>
            <p className="text-gray-600 max-w-3xl mx-auto mb-6">
              Focus on growing your business while we handle the manpower challenges. Our installer network ensures you never say 'no' to a customer due to capacity constraints.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <div className="flex items-center text-primary font-semibold">
                <Phone className="h-5 w-5 mr-2" />
                Installer Helpline: +91 98765 43210
              </div>
              <div className="flex items-center text-primary font-semibold">
                <Mail className="h-5 w-5 mr-2" />
                network@p91.in
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How Partnership Works Section */}
      <section className="py-20 bg-gray-50">
        <div className="container-premium">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-oxanium font-bold text-gray-900 mb-6">Your Journey to P91 Partnership Success</h2>
            
            {/* Partnership Journey Visual */}
            <div className="bg-white rounded-lg p-8 mb-12 shadow-sm">
              <div className="flex items-center justify-center space-x-4 overflow-x-auto">
                {[1, 2, 3, 4, 5, 6].map((step, index) => (
                  <div key={step} className="flex items-center">
                    <div className="w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center font-bold">
                      {step}
                    </div>
                    {index < 5 && <ArrowRight className="h-6 w-6 text-gray-400 mx-2" />}
                  </div>
                ))}
              </div>
              <p className="text-gray-500 text-sm mt-4">From application to full partnership in 6 simple steps</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { step: "1", title: "Apply", desc: "City, capacity, bay photos" },
              { step: "2", title: "Onboard", desc: "P91 branding, pricing, SOP handover, Pulse login" },
              { step: "3", title: "Train", desc: "Team hands-on + pattern library walkthrough" },
              { step: "4", title: "Go Live", desc: "Leads start; content shoot scheduled" },
              { step: "5", title: "Install & Register", desc: "Job cards, 1-click warranty" },
              { step: "6", title: "Grow", desc: "Reviews, referrals, repeat customers; scale with P91 support" }
            ].map((item, index) => (
              <Card key={index} className="text-center border-2 hover:border-primary/50 transition-all duration-300">
                <CardHeader>
                  <div className="w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center mx-auto mb-4 font-bold text-lg">
                    {item.step}
                  </div>
                  <CardTitle className="font-oxanium text-xl">{item.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">{item.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center mt-12">
            
              <Button size="lg" className="bg-primary hover:bg-primary/90 text-white px-8 py-3 font-semibold">
                Become a PPF Partner
              </Button>
            
          </div>
        </div>
      </section>

      {/* Partner Eligibility Section */}
      <section className="py-20 bg-white">
        <div className="container-premium">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-oxanium font-bold text-gray-900 mb-6">Ready to Start? Here's What You Need</h2>
          </div>

          <div className="max-w-2xl mx-auto">
            <Card className="border-2 border-primary/20">
              <CardContent className="p-8">
                <ul className="space-y-4">
                  <li className="flex items-start">
                    <CheckCircle className="h-6 w-6 text-primary mr-3 mt-1 flex-shrink-0" />
                    <span>Clean, dust-controlled bay(s) with basic photo/video readiness</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-6 w-6 text-primary mr-3 mt-1 flex-shrink-0" />
                    <span>Plotter (nice to have) or use our pre-cut support</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-6 w-6 text-primary mr-3 mt-1 flex-shrink-0" />
                    <span>Commitment to P91 SOPs & service SLAs</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>

          <div className="text-center mt-8">
            
              <Button size="lg" className="bg-primary hover:bg-primary/90 text-white px-8 py-3 font-semibold">
                Become a PPF Partner
              </Button>
            
          </div>
        </div>
      </section>

      {/* FAQs Section */}
      <section className="py-20 bg-gray-50">
        <div className="container-premium">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-oxanium font-bold text-gray-900 mb-6">Questions You Might Have</h2>
          </div>

          <div className="max-w-4xl mx-auto space-y-6">
            {[
              {
                q: "Do I need a plotter?",
                a: "No. Pre-cut support is available; a plotter is recommended as your volume grows."
              },
              {
                q: "Who owns the customer?",
                a: "You do. We route demand and support the experience; the job and relationship are yours."
              },
              {
                q: "Is there a program fee?",
                a: "City/scope-based. Typically recovered from the first few installs."
              },
              {
                q: "How fast do leads start?",
                a: "In active cities, within days post-onboarding."
              }
            ].map((faq, index) => (
              <Card key={index} className="border-l-4 border-l-primary">
                <CardContent className="p-6">
                  <h3 className="font-oxanium font-bold text-lg mb-2">{faq.q}</h3>
                  <p className="text-gray-600">{faq.a}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center mt-12">
            
              <Button size="lg" className="bg-primary hover:bg-primary/90 text-white px-8 py-3 font-semibold">
                Become a PPF Partner
              </Button>
            
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 bg-gradient-to-br from-primary to-primary/80 text-white">
        <div className="container-premium text-center">
          <h2 className="text-4xl lg:text-5xl font-oxanium font-bold mb-6">
            Final Call — One Roof. No Runaround.
          </h2>
          <p className="text-xl mb-8 font-sarabun max-w-3xl mx-auto opacity-90">
            With P91, you get the film, the demand, the process, and the platform—under one roof. No chasing vendors. No agency overhead. Just clean installs and steady revenue.
          </p>
          
            <Button size="lg" className="bg-white text-primary hover:bg-gray-100 px-12 py-4 text-lg font-semibold">
              Become a PPF Partner Now
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-16 bg-white border-t">
        <div className="container-premium">
          <div className="text-center">
            <h3 className="text-2xl font-oxanium font-bold text-gray-900 mb-4">Questions? Let's Connect</h3>
            <p className="text-gray-600 mb-6">Ready to discuss your PPF partnership? Reach out to our team.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <a href="tel:+919876543210" className="flex items-center text-primary hover:text-primary/80 font-semibold">
                <Phone className="h-5 w-5 mr-2" />
                +91 98765 43210
              </a>
              <a href="mailto:partners@p91.in" className="flex items-center text-primary hover:text-primary/80 font-semibold">
                <Mail className="h-5 w-5 mr-2" />
                partners@p91.in
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Partner Application Form Dialog */}
      <PartnerApplicationForm 
        open={showApplicationForm} 
        setOpen={setShowApplicationForm} 
      />
    </div>
  );
}