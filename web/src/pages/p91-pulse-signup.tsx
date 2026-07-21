import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import {
  User,
  Phone,
  Upload,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  MapPin,
  Wrench,
} from "lucide-react";
import { Link, useSearch } from "wouter";
import p91PulseLogo from "@assets/P91 PULSE logo-02_1761587817659.png";
import GooglePlacesAutocomplete, { PlaceDetails } from "@/components/google-places-autocomplete";

// Countries data (for the phone dial code)
const COUNTRIES = [
  { code: "IN", name: "India", dialCode: "+91" },
  { code: "US", name: "United States", dialCode: "+1" },
  { code: "CA", name: "Canada", dialCode: "+1" },
  { code: "GB", name: "United Kingdom", dialCode: "+44" },
  { code: "AU", name: "Australia", dialCode: "+61" }
];

// Indian States and Union Territories (territory = state)
const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat",
  "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh",
  "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab",
  "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh",
  "Uttarakhand", "West Bengal", "Andaman and Nicobar Islands", "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Jammu and Kashmir", "Ladakh",
  "Lakshadweep", "Puducherry"
];

type SignupStep = 'personal' | 'verification' | 'serviceArea' | 'success';

interface PersonalInfo {
  firstName: string;
  lastName: string;
  email: string; // optional for installers
  countryCode: string;
  phoneNumber: string;
  password: string;
  confirmPassword: string;
  profilePicture: File | null;
}

interface ServiceArea {
  state: string;        // mandatory
  pincode: string;      // optional — narrows coverage to a region
  placeDetails: PlaceDetails | null; // optional Google Maps add-on
}

export default function P91PulseSignupPage() {
  const searchParams = useSearch();
  const inviteToken = new URLSearchParams(searchParams).get('invite');

  const [currentStep, setCurrentStep] = useState<SignupStep>('personal');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [verificationToken, setVerificationToken] = useState('');
  // Detailer (retailer) and installer share the SAME form/flow — only the role differs.
  const [userType, setUserType] = useState<'detailer' | 'installer'>('detailer');
  // Detailers can run a team of installers — optional team size (installer count).
  const [teamSize, setTeamSize] = useState('');
  // Detailers operate a business/shop — capture the business name (detailers only).
  const [businessName, setBusinessName] = useState('');

  const [personalInfo, setPersonalInfo] = useState<PersonalInfo>({
    firstName: '',
    lastName: '',
    email: '',
    countryCode: '+91',
    phoneNumber: '',
    password: '',
    confirmPassword: '',
    profilePicture: null
  });

  const [serviceArea, setServiceArea] = useState<ServiceArea>({
    state: '',
    pincode: '',
    placeDetails: null,
  });

  const fullPhone = `${personalInfo.countryCode} ${personalInfo.phoneNumber}`.trim();

  const handlePersonalInfoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation — phone is the primary key; email is optional
    if (!personalInfo.firstName || !personalInfo.lastName || !personalInfo.phoneNumber ||
        !personalInfo.password) {
      toast({
        title: "Missing Information",
        description: "First name, last name, phone and password are required",
        variant: "destructive",
      });
      return;
    }

    // Detailers run a business — business name is required for them (installers are individuals).
    if (userType === 'detailer' && !businessName.trim()) {
      toast({
        title: "Missing Information",
        description: "Business name is required for detailers",
        variant: "destructive",
      });
      return;
    }

    if (personalInfo.phoneNumber.replace(/\D/g, '').length < 10) {
      toast({
        title: "Invalid Phone",
        description: "Please enter a valid 10-digit phone number",
        variant: "destructive",
      });
      return;
    }

    if (personalInfo.password !== personalInfo.confirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "Passwords do not match",
        variant: "destructive",
      });
      return;
    }

    if (personalInfo.password.length < 8) {
      toast({
        title: "Weak Password",
        description: "Password must be at least 8 characters long",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Send OTP to the phone for verification
      const response = await fetch('/api/pulse-signup/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: fullPhone,
          email: personalInfo.email || undefined,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setVerificationToken(data.token);
        setCurrentStep('verification');
        toast({
          title: "OTP Sent",
          description: "Please check your phone for the verification code",
        });
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to send verification code",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Network error. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOtpVerification = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!otpCode || otpCode.length < 4) {
      toast({
        title: "Invalid OTP",
        description: "Please enter the code sent to your phone",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/pulse-signup/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: fullPhone,
          otp: otpCode,
          token: verificationToken
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setCurrentStep('serviceArea');
        toast({
          title: "Phone Verified",
          description: "Verification successful. Tell us your service area.",
        });
      } else {
        toast({
          title: "Invalid OTP",
          description: data.error || "Invalid verification code",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Network error. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleServiceAreaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!serviceArea.state) {
      toast({
        title: "Missing Information",
        description: "Please select the state you cover",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();

      // Personal info (email optional)
      formData.append('firstName', personalInfo.firstName);
      formData.append('lastName', personalInfo.lastName);
      if (personalInfo.email) formData.append('email', personalInfo.email);
      formData.append('password', personalInfo.password);
      if (personalInfo.profilePicture) {
        formData.append('profilePicture', personalInfo.profilePicture);
      }

      // Service area — state mandatory, pincode optional
      formData.append('state', serviceArea.state);
      if (serviceArea.pincode) formData.append('postalCode', serviceArea.pincode);

      // Optional Google Places location add-on
      if (serviceArea.placeDetails) {
        const p = serviceArea.placeDetails;
        formData.append('businessAddress', p.formattedAddress);
        formData.append('country', p.country);
        if (p.city) formData.append('city', p.city);
        if (p.street) formData.append('street', p.street);
        formData.append('latitude', p.latitude.toString());
        formData.append('longitude', p.longitude.toString());
        formData.append('placeName', p.name);
        formData.append('placeId', p.placeId);
      }

      formData.append('userType', userType);
      if (userType === 'detailer' && teamSize) formData.append('teamSize', teamSize);
      if (userType === 'detailer' && businessName.trim()) formData.append('businessName', businessName.trim());
      formData.append('verificationToken', verificationToken);
      if (inviteToken) formData.append('inviteToken', inviteToken);

      const response = await fetch('/api/pulse-signup/register', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setCurrentStep('success');
        toast({
          title: "Registration Successful",
          description: "Your application has been submitted for review",
        });
      } else {
        toast({
          title: "Registration Failed",
          description: data.error || "Please try again",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Network error. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select a file smaller than 1MB",
          variant: "destructive",
        });
        return;
      }
      if (!file.type.includes('image/jpeg') && !file.type.includes('image/png')) {
        toast({
          title: "Invalid file type",
          description: "Only JPG or PNG files are allowed",
          variant: "destructive",
        });
        return;
      }
      setPersonalInfo({ ...personalInfo, profilePicture: file });
    }
  };

  if (currentStep === 'success') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center pt-24 pb-12 px-4">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <img src={p91PulseLogo} alt="P91 Pulse" className="h-16 mx-auto" />
          </div>
          <Card>
            <CardContent className="text-center py-12">
              <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-6" />
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Registration Successful!</h2>
              <p className="text-gray-600 mb-6">
                Your P91 Pulse application has been submitted. Our team will review it and
                you'll be able to sign in with your phone number once approved.
              </p>
              <div className="space-y-3">
                <Button asChild className="w-full">
                  <Link href="/p91-pulse">Back to P91 Pulse</Link>
                </Button>
                <Button variant="outline" asChild className="w-full">
                  <Link href="/erp/login">Go to Login</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 pt-24 pb-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Logo */}
        <div className="text-center mb-8">
          <img src={p91PulseLogo} alt="P91 Pulse" className="h-20 mx-auto mb-6" />
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Join P91 Pulse</h1>
          <p className="text-gray-600">Register as a detailer or installer</p>
        </div>

        {/* Progress indicator */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center space-x-4">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
              currentStep === 'personal' ? 'bg-blue-600 text-white' :
              ['verification', 'serviceArea'].includes(currentStep) ? 'bg-green-500 text-white' : 'bg-gray-300'
            }`}>1</div>
            <div className={`w-12 h-1 ${
              ['verification', 'serviceArea'].includes(currentStep) ? 'bg-green-500' : 'bg-gray-300'
            }`}></div>
            <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
              currentStep === 'verification' ? 'bg-blue-600 text-white' :
              currentStep === 'serviceArea' ? 'bg-green-500 text-white' : 'bg-gray-300'
            }`}>2</div>
            <div className={`w-12 h-1 ${
              currentStep === 'serviceArea' ? 'bg-green-500' : 'bg-gray-300'
            }`}></div>
            <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
              currentStep === 'serviceArea' ? 'bg-blue-600 text-white' : 'bg-gray-300'
            }`}>3</div>
          </div>
        </div>

        {/* Personal Information Step */}
        {currentStep === 'personal' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Your Details
              </CardTitle>
              <CardDescription>Tell us about yourself</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePersonalInfoSubmit} className="space-y-6">
                <div className="p-4 bg-gray-50 rounded-lg border">
                  <Label className="text-base font-semibold mb-3 block">Register as *</Label>
                  <div className="flex gap-6">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="userType"
                        value="detailer"
                        checked={userType === 'detailer'}
                        onChange={() => setUserType('detailer')}
                        className="w-4 h-4 text-blue-600"
                      />
                      <span className="font-medium">Detailer</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="userType"
                        value="installer"
                        checked={userType === 'installer'}
                        onChange={() => setUserType('installer')}
                        className="w-4 h-4 text-blue-600"
                      />
                      <span className="font-medium">Installer</span>
                    </label>
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name *</Label>
                    <Input
                      id="firstName"
                      value={personalInfo.firstName}
                      onChange={(e) => setPersonalInfo({...personalInfo, firstName: e.target.value})}
                      placeholder="First Name"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name *</Label>
                    <Input
                      id="lastName"
                      value={personalInfo.lastName}
                      onChange={(e) => setPersonalInfo({...personalInfo, lastName: e.target.value})}
                      placeholder="Last Name"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="phone">Mobile Number * <span className="text-xs text-gray-500">(used to sign in)</span></Label>
                  <div className="flex gap-2">
                    <Select value={personalInfo.countryCode} onValueChange={(value) =>
                      setPersonalInfo({...personalInfo, countryCode: value})}>
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {COUNTRIES.map((country) => (
                          <SelectItem key={country.code} value={country.dialCode}>
                            {country.code} {country.dialCode}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      type="tel"
                      value={personalInfo.phoneNumber}
                      onChange={(e) => setPersonalInfo({...personalInfo, phoneNumber: e.target.value})}
                      placeholder="Phone number"
                      className="flex-1"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="email">Email <span className="text-xs text-gray-500">(optional)</span></Label>
                  <Input
                    id="email"
                    type="email"
                    value={personalInfo.email}
                    onChange={(e) => setPersonalInfo({...personalInfo, email: e.target.value})}
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="password">Password *</Label>
                    <Input
                      id="password"
                      type="password"
                      value={personalInfo.password}
                      onChange={(e) => setPersonalInfo({...personalInfo, password: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="confirmPassword">Confirm Password *</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={personalInfo.confirmPassword}
                      onChange={(e) => setPersonalInfo({...personalInfo, confirmPassword: e.target.value})}
                      required
                    />
                  </div>
                </div>

                {userType === 'detailer' && (
                  <div>
                    <Label htmlFor="businessName">Business Name *</Label>
                    <Input
                      id="businessName"
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      placeholder="e.g. Premium Auto Care"
                      required
                    />
                  </div>
                )}

                {userType === 'detailer' && (
                  <div>
                    <Label htmlFor="teamSize">Team Size <span className="text-xs text-gray-500">(number of installers in your team — optional)</span></Label>
                    <Input
                      id="teamSize"
                      type="number"
                      min={0}
                      inputMode="numeric"
                      value={teamSize}
                      onChange={(e) => setTeamSize(e.target.value)}
                    />
                  </div>
                )}

                <div>
                  <Label htmlFor="profilePicture">Profile Picture <span className="text-xs text-gray-500">(optional)</span></Label>
                  <div className="mt-2">
                    <input
                      id="profilePicture"
                      type="file"
                      accept="image/jpeg,image/png"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => document.getElementById('profilePicture')?.click()}
                      className="w-full"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      {personalInfo.profilePicture ? personalInfo.profilePicture.name : 'Choose File'}
                    </Button>
                    <p className="text-xs text-gray-500 mt-1">
                      Only JPG or PNG files allowed. Max file size: 1 MB
                    </p>
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? "Sending..." : "Send OTP"}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Phone Verification Step */}
        {currentStep === 'verification' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="h-5 w-5" />
                Phone Verification
              </CardTitle>
              <CardDescription>
                We've sent a verification code to {fullPhone}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleOtpVerification} className="space-y-6">
                <div>
                  <Label htmlFor="otp">Verification Code *</Label>
                  <Input
                    id="otp"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    placeholder="Enter the code"
                    maxLength={6}
                    required
                  />
                </div>

                <div className="flex gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setCurrentStep('personal')}
                    className="flex-1"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                  </Button>
                  <Button type="submit" className="flex-1" disabled={isSubmitting}>
                    {isSubmitting ? "Verifying..." : "Verify & Continue"}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Service Area Step */}
        {currentStep === 'serviceArea' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wrench className="h-5 w-5" />
                Service Area
              </CardTitle>
              <CardDescription>Where do you take install jobs?</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleServiceAreaSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="state">State *</Label>
                    <Select value={serviceArea.state} onValueChange={(value) =>
                      setServiceArea({...serviceArea, state: value})}>
                      <SelectTrigger id="state">
                        <SelectValue placeholder="Select your state" />
                      </SelectTrigger>
                      <SelectContent>
                        {INDIAN_STATES.map((s) => (
                          <SelectItem key={s} value={s}>{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-gray-500 mt-1">
                      You'll cover this whole state unless you add a pincode.
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="pincode">Pincode <span className="text-xs text-gray-500">(optional)</span></Label>
                    <Input
                      id="pincode"
                      value={serviceArea.pincode}
                      onChange={(e) => setServiceArea({...serviceArea, pincode: e.target.value})}
                      placeholder="e.g. 560001"
                      inputMode="numeric"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Add a pincode to get leads only from that region.
                    </p>
                  </div>
                </div>

                <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2 text-sm font-medium text-blue-800 dark:text-blue-300">
                    <MapPin className="h-4 w-4" />
                    Pin your location (optional)
                  </div>
                  <GooglePlacesAutocomplete
                    value={serviceArea.placeDetails}
                    onChange={(place) => setServiceArea((prev) => ({
                      ...prev,
                      placeDetails: place,
                      state: place?.state && INDIAN_STATES.includes(place.state) ? place.state : prev.state,
                      pincode: place?.postalCode || prev.pincode,
                    }))}
                    label="Location"
                    placeholder="Search your area on Google Maps..."
                  />
                  <p className="text-xs text-blue-700 dark:text-blue-300 mt-3">
                    Optional — pinning your area helps us route nearby jobs to you. It fills in your state and pincode.
                  </p>
                </div>

                <div className="flex gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setCurrentStep('verification')}
                    className="flex-1"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                  </Button>
                  <Button type="submit" className="flex-1" disabled={isSubmitting}>
                    {isSubmitting ? "Registering..." : "Register"}
                    <CheckCircle2 className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-gray-600">
            Already have an account?{" "}
            <Link href="/erp/login" className="text-blue-600 hover:underline">
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
