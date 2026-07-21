import { useState, useEffect } from "react";
import { useLocation, useRoute } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Building2, CheckCircle, AlertCircle, User, Mail, Phone, MapPin, Lock } from "lucide-react";
import GooglePlacesAutocomplete, { PlaceDetails } from "@/components/google-places-autocomplete";

interface InviteInfo {
  distributorName: string;
  distributorBusiness: string;
  email: string | null;
  role: string;
  expiresAt: string;
}

export default function RegisterDetailerPage() {
  const [, setLocation] = useLocation();
  const [inviteValid, setInviteValid] = useState<boolean | null>(null);
  const [inviteInfo, setInviteInfo] = useState<InviteInfo | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [inviteToken, setInviteToken] = useState<string>('');

  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    name: '',
    email: '',
    phone: '',
    studioName: '',
    placeDetails: null as PlaceDetails | null,
    storePhone: '',
    ownerPhone: ''
  });

  useEffect(() => {
    // Get invite token from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('invite');
    
    if (!token) {
      toast({
        title: "Invalid Link",
        description: "No invitation token found in the URL",
        variant: "destructive",
      });
      setInviteValid(false);
      return;
    }

    setInviteToken(token);
    validateInvite(token);
  }, []);

  const validateInvite = async (token: string) => {
    try {
      const response = await fetch(`/api/invite/validate/${token}`);
      const data = await response.json();

      if (data.valid) {
        setInviteValid(true);
        setInviteInfo(data.invite);
        
        // Pre-fill email if provided
        if (data.invite.email) {
          setFormData(prev => ({ ...prev, email: data.invite.email }));
        }
      } else {
        setInviteValid(false);
        toast({
          title: "Invalid Invitation",
          description: data.error || "This invitation link is invalid or expired",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error validating invite:', error);
      setInviteValid(false);
      toast({
        title: "Error",
        description: "Failed to validate invitation",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive",
      });
      return;
    }

    if (!formData.username || !formData.password || !formData.name || !formData.email || !formData.studioName || !formData.placeDetails) {
      toast({
        title: "Error",
        description: "Please fill in all required fields including shop location",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);

    try {
      const registrationData = {
        inviteToken,
        username: formData.username,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        studioName: formData.studioName,
        studioCity: formData.placeDetails?.city || '',
        studioAddress: formData.placeDetails?.formattedAddress || '',
        studioLatitude: formData.placeDetails?.latitude.toString() || '',
        studioLongitude: formData.placeDetails?.longitude.toString() || '',
        googleMapLink: '',
        storePhone: formData.storePhone,
        ownerPhone: formData.ownerPhone,
        placeId: formData.placeDetails?.placeId || '',
        placeName: formData.placeDetails?.name || ''
      };

      const response = await fetch('/api/register-with-invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(registrationData),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Registration Successful!",
          description: "Your detailer account has been created successfully. You can now log in.",
        });
        
        // Redirect to login page after 2 seconds
        setTimeout(() => {
          setLocation('/erp/login');
        }, 2000);
      } else {
        toast({
          title: "Registration Failed",
          description: data.error || "Please try again",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Registration error:', error);
      toast({
        title: "Registration Failed",
        description: "Please check your connection and try again",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (inviteValid === null) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-600">Validating invitation...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!inviteValid) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="text-center py-12">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Invalid Invitation</h3>
            <p className="text-gray-600 mb-6">
              This invitation link is invalid, expired, or has been used up.
            </p>
            <Button onClick={() => setLocation('/')}>
              Go Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Invitation Info */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center gap-3">
              <CheckCircle className="h-6 w-6 text-green-600" />
              <div>
                <CardTitle className="text-xl">Valid Invitation</CardTitle>
                <p className="text-gray-600">You've been invited to join P91 as a detailer</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-gray-500" />
                <span className="font-medium">Distributor:</span>
                <span>{inviteInfo?.distributorName}</span>
              </div>
              {inviteInfo?.distributorBusiness && (
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-gray-500" />
                  <span className="font-medium">Business:</span>
                  <span>{inviteInfo.distributorBusiness}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-green-50 text-green-700">
                  {inviteInfo?.role?.toUpperCase()} Registration
                </Badge>
                <span className="text-sm text-gray-600">
                  Expires: {new Date(inviteInfo?.expiresAt || '').toLocaleDateString()}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Registration Form */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-oxanium">Complete Your Registration</CardTitle>
            <p className="text-gray-600">Fill in your details to create your detailer account</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Account Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Account Information
                </h3>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="username">Username *</Label>
                    <Input
                      id="username"
                      value={formData.username}
                      onChange={(e) => setFormData({...formData, username: e.target.value})}
                      placeholder="Choose a username"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="name">Full Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      placeholder="Your full name"
                      required
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="password">Password *</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="password"
                        type="password"
                        value={formData.password}
                        onChange={(e) => setFormData({...formData, password: e.target.value})}
                        placeholder="Create a password"
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="confirmPassword">Confirm Password *</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="confirmPassword"
                        type="password"
                        value={formData.confirmPassword}
                        onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                        placeholder="Confirm your password"
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Contact Information
                </h3>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="email">Email Address *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      placeholder="your@email.com"
                      required
                      disabled={!!inviteInfo?.email} // Disable if email is pre-filled from invite
                    />
                    {inviteInfo?.email && (
                      <p className="text-xs text-gray-600 mt-1">Email pre-filled from invitation</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                        placeholder="Your phone number"
                        className="pl-10"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Studio Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Studio Information
                </h3>
                
                <div>
                  <Label htmlFor="studioName">Studio Name *</Label>
                  <Input
                    id="studioName"
                    value={formData.studioName}
                    onChange={(e) => setFormData({...formData, studioName: e.target.value})}
                    placeholder="Your studio/business name"
                    required
                  />
                </div>

                <GooglePlacesAutocomplete
                  value={formData.placeDetails}
                  onChange={(place) => setFormData({...formData, placeDetails: place})}
                  label="Studio Location"
                  placeholder="Search for your studio on Google Maps..."
                  required
                />

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="storePhone">Store Phone</Label>
                    <Input
                      id="storePhone"
                      type="tel"
                      value={formData.storePhone}
                      onChange={(e) => setFormData({...formData, storePhone: e.target.value})}
                      placeholder="Store contact number"
                    />
                  </div>
                  <div>
                    <Label htmlFor="ownerPhone">Owner Phone</Label>
                    <Input
                      id="ownerPhone"
                      type="tel"
                      value={formData.ownerPhone}
                      onChange={(e) => setFormData({...formData, ownerPhone: e.target.value})}
                      placeholder="Owner contact number"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-6">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setLocation('/')}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-primary hover:bg-primary/90"
                >
                  {submitting ? "Creating Account..." : "Complete Registration"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}