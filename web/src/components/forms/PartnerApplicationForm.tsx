import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { Upload, X, User, Phone, Mail, MapPin, Camera, Instagram, Facebook } from "lucide-react";

const SERVICES_OPTIONS = [
  "Paint Protection Film (PPF)",
  "Ceramic Coating", 
  "Window Tinting",
  "Automotive Detailing",
  "Paint Correction",
  "Other Services"
];

interface PartnerApplicationFormProps {
  open: boolean;
  setOpen: (open: boolean) => void;
}

export function PartnerApplicationForm({ open, setOpen }: PartnerApplicationFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [storePhotos, setStorePhotos] = useState<File[]>([]);
  
  const [formData, setFormData] = useState({
    ownerName: "",
    storeName: "",
    email: "",
    phone: "",
    city: "",
    pinCode: "",
    googleMapsLocation: "",
    services: [] as string[],
    instagramHandle: "",
    facebookPage: "",
    termsAccepted: false,
    source: "ppf_program_form"
  });

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (storePhotos.length + files.length > 2) {
      toast({
        title: "Too many photos",
        description: "You can upload maximum 2 store photos",
        variant: "destructive",
      });
      return;
    }
    setStorePhotos([...storePhotos, ...files]);
  };

  const removePhoto = (index: number) => {
    setStorePhotos(storePhotos.filter((_, i) => i !== index));
  };

  const handleServiceToggle = (service: string) => {
    const newServices = formData.services.includes(service)
      ? formData.services.filter(s => s !== service)
      : [...formData.services, service];
    setFormData({ ...formData, services: newServices });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.termsAccepted) {
      toast({
        title: "Terms Required",
        description: "Please accept the terms and conditions",
        variant: "destructive",
      });
      return;
    }

    if (formData.services.length === 0) {
      toast({
        title: "Services Required", 
        description: "Please select at least one service you offer",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // TODO: Upload photos to storage and get URLs
      const storePhotoUrls: string[] = []; // For now, empty array
      
      const applicationData = {
        ...formData,
        storePhotos: storePhotoUrls,
      };

      const response = await fetch("/api/ppf-partner-applications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(applicationData),
      });

      if (response.ok) {
        toast({
          title: "Application Submitted!",
          description: "Thank you for your interest in becoming a P91 partner. We'll contact you soon.",
        });
        setOpen(false);
        // Reset form
        setFormData({
          ownerName: "",
          storeName: "",
          email: "",
          phone: "",
          city: "",
          pinCode: "",
          googleMapsLocation: "",
          services: [],
          instagramHandle: "",
          facebookPage: "",
          termsAccepted: false,
          source: "ppf_program_form"
        });
        setStorePhotos([]);
      } else {
        const errorData = await response.json();
        toast({
          title: "Submission Failed",
          description: errorData.message || "Please try again later",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error submitting application:", error);
      toast({
        title: "Submission Failed",
        description: "Please check your connection and try again",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-oxanium text-primary">
            Become a P91 PPF Partner
          </DialogTitle>
          <DialogDescription>
            Join our network of premium automotive protection partners. Fill out this simple form to get started.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg font-oxanium">
                <User className="h-5 w-5" />
                Contact Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="ownerName">Your Name *</Label>
                <Input
                  id="ownerName"
                  value={formData.ownerName}
                  onChange={(e) => setFormData({...formData, ownerName: e.target.value})}
                  placeholder="Enter your full name"
                  required
                />
              </div>

              <div>
                <Label htmlFor="storeName">Store Name *</Label>
                <Input
                  id="storeName"
                  value={formData.storeName}
                  onChange={(e) => setFormData({...formData, storeName: e.target.value})}
                  placeholder="Enter your store/business name"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email">Email Address *</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      placeholder="your@email.com"
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="phone">Phone Number *</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      placeholder="+91 9876543210"
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Location */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg font-oxanium">
                <MapPin className="h-5 w-5" />
                Shop Location
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="city">City *</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => setFormData({...formData, city: e.target.value})}
                    placeholder="e.g. Mumbai, Delhi, Bangalore"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="pinCode">PIN Code *</Label>
                  <Input
                    id="pinCode"
                    value={formData.pinCode}
                    onChange={(e) => setFormData({...formData, pinCode: e.target.value})}
                    placeholder="400001"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="googleMapsLocation">Shop Google Maps Link</Label>
                <Input
                  id="googleMapsLocation"
                  value={formData.googleMapsLocation}
                  onChange={(e) => setFormData({...formData, googleMapsLocation: e.target.value})}
                  placeholder="Paste your Google Maps location link here"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Optional: Share your Google Maps link to help customers find you easily
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Services */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-oxanium">Services You Offer *</CardTitle>
              <CardDescription>Select all services your shop currently provides</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {SERVICES_OPTIONS.map((service) => (
                  <div key={service} className="flex items-center space-x-2">
                    <Checkbox
                      id={service}
                      checked={formData.services.includes(service)}
                      onCheckedChange={() => handleServiceToggle(service)}
                    />
                    <Label htmlFor={service} className="text-sm font-normal">
                      {service}
                    </Label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Store Photos */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg font-oxanium">
                <Camera className="h-5 w-5" />
                Store Photos
              </CardTitle>
              <CardDescription>Upload 1-2 photos of your shop (optional but recommended)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <Label htmlFor="photos" className="cursor-pointer">
                    <span className="text-primary font-semibold">Click to upload store photos</span>
                    <span className="text-gray-500 block text-sm">Upload up to 2 photos (JPG, PNG)</span>
                  </Label>
                  <Input
                    id="photos"
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                </div>

                {storePhotos.length > 0 && (
                  <div className="grid grid-cols-2 gap-4">
                    {storePhotos.map((photo, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={URL.createObjectURL(photo)}
                          alt={`Store photo ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="absolute top-2 right-2 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => removePhoto(index)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Social Media */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-oxanium">Social Media (Optional)</CardTitle>
              <CardDescription>Help customers find you on social platforms</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="instagramHandle">Instagram Handle</Label>
                <div className="relative">
                  <Instagram className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="instagramHandle"
                    value={formData.instagramHandle}
                    onChange={(e) => setFormData({...formData, instagramHandle: e.target.value})}
                    placeholder="@yourshopname"
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="facebookPage">Facebook Page</Label>
                <div className="relative">
                  <Facebook className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="facebookPage"
                    value={formData.facebookPage}
                    onChange={(e) => setFormData({...formData, facebookPage: e.target.value})}
                    placeholder="Facebook page URL"
                    className="pl-10"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Terms */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start space-x-2">
                <Checkbox
                  id="termsAccepted"
                  checked={formData.termsAccepted}
                  onCheckedChange={(checked) => setFormData({...formData, termsAccepted: checked as boolean})}
                />
                <Label htmlFor="termsAccepted" className="text-sm leading-relaxed">
                  I agree to the <a href="/terms" className="text-primary underline">Terms and Conditions</a> and want to become a P91 authorized partner *
                </Label>
              </div>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-primary hover:bg-primary/90"
            >
              {isSubmitting ? "Submitting..." : "Submit Application"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default PartnerApplicationForm;