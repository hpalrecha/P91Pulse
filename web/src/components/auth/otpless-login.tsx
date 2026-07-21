import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';
import { apiRequest } from '@/lib/queryClient';
import { Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

// Main OTPless Login Component
export function OtplessLogin() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isVerifying, setIsVerifying] = useState(false);
  const [activeTab, setActiveTab] = useState('otp');
  const [sentOTP, setSentOTP] = useState(false);
  const [phone, setPhone] = useState('');
  
  // Phone form schema
  const phoneSchema = z.object({
    phone: z.string()
      .min(10, 'Phone number must be at least 10 digits')
      .max(15, 'Phone number must not exceed 15 digits')
      .regex(/^\+?\d+$/, 'Phone number must contain only digits with optional + prefix')
      .transform(val => val.startsWith('+') ? val : `+91${val}`)
  });
  
  // OTP form schema
  const otpSchema = z.object({
    otp: z.string()
      .min(4, 'OTP must be at least 4 digits')
      .max(6, 'OTP must not exceed 6 digits')
      .regex(/^\d+$/, 'OTP must contain only digits')
  });
  
  // Initialize phone form
  const phoneForm = useForm<z.infer<typeof phoneSchema>>({
    resolver: zodResolver(phoneSchema),
    defaultValues: {
      phone: ''
    }
  });
  
  // Initialize OTP form
  const otpForm = useForm<z.infer<typeof otpSchema>>({
    resolver: zodResolver(otpSchema),
    defaultValues: {
      otp: ''
    }
  });
  
  // Function to send OTP
  const sendOTP = async (values: z.infer<typeof phoneSchema>) => {
    try {
      setIsVerifying(true);
      
      // Check if the phone number exists in our database
      const response = await apiRequest('POST', '/api/auth/send-otp', {
        phone: values.phone
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to send OTP');
      }
      
      // Store phone for verification step
      setPhone(values.phone);
      setSentOTP(true);
      
      toast({
        title: 'OTP Sent',
        description: 'Please check your phone for the OTP',
      });
      
    } catch (error: any) {
      console.error('Send OTP error:', error);
      toast({
        variant: 'destructive',
        title: 'Failed to Send OTP',
        description: error.message || 'Could not send OTP. Please try again.',
      });
    } finally {
      setIsVerifying(false);
    }
  };
  
  // Function to verify OTP
  const verifyOTP = async (values: z.infer<typeof otpSchema>) => {
    try {
      setIsVerifying(true);
      
      // Send the data to our backend to validate user
      const response = await apiRequest('POST', '/api/auth/verify-otp', {
        phone: phone,
        otp: values.otp
      });
      
      // Process the response
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'OTP verification failed');
      }
      
      const user = data.data || data;
      
      toast({
        title: 'Login Successful',
        description: `Welcome back, ${user.name}!`,
      });

      // If a `next` query param is present and points to a safe same-origin
      // ERP path, redirect there (e.g. when arriving from an email link).
      const nextParam = new URLSearchParams(window.location.search).get('next');
      const isSafeNext =
        !!nextParam &&
        nextParam.startsWith('/erp/') &&
        !nextParam.startsWith('/erp/login') &&
        !nextParam.startsWith('/erp/otpless-login') &&
        !nextParam.startsWith('//');
      if (isSafeNext && nextParam) {
        setLocation(nextParam);
        return;
      }

      // Otherwise fall back to the role-based default landing page
      if (user.role === 'admin') {
        setLocation('/erp/admin/dashboard');
      } else if (user.role === 'distributor') {
        setLocation('/erp/distributor/dashboard');
      } else if (user.role === 'detailer' || user.role === 'installer') {
        setLocation('/erp/detailer/dashboard');
      } else {
        setLocation('/erp');
      }
    } catch (error: any) {
      console.error('OTP verification error:', error);
      toast({
        variant: 'destructive',
        title: 'Login Failed',
        description: error.message || 'Could not verify your identity. Please try again.',
      });
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-2xl text-center">Login</CardTitle>
        <CardDescription className="text-center">
          Sign in to your P91 account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="otp">OTP Login</TabsTrigger>
            <TabsTrigger value="password">Password Login</TabsTrigger>
          </TabsList>
          
          <TabsContent value="otp">
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground text-center mb-4">
                Log in with your registered phone number
              </p>

              {isVerifying ? (
                <div className="flex justify-center items-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <span className="ml-2">Processing...</span>
                </div>
              ) : !sentOTP ? (
                // Phone number input form
                <Form {...phoneForm}>
                  <form onSubmit={phoneForm.handleSubmit(sendOTP)} className="space-y-4">
                    <FormField
                      control={phoneForm.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone Number</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Enter your registered phone number" 
                              {...field} 
                              disabled={isVerifying}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <Button 
                      type="submit" 
                      className="w-full"
                      disabled={isVerifying}
                    >
                      Send OTP
                    </Button>
                  </form>
                </Form>
              ) : (
                // OTP verification form
                <Form {...otpForm}>
                  <form onSubmit={otpForm.handleSubmit(verifyOTP)} className="space-y-4">
                    <FormField
                      control={otpForm.control}
                      name="otp"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Enter OTP</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Enter the OTP sent to your phone" 
                              {...field} 
                              disabled={isVerifying}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="flex flex-col space-y-2">
                      <Button 
                        type="submit" 
                        className="w-full"
                        disabled={isVerifying}
                      >
                        Verify OTP
                      </Button>
                      
                      <Button 
                        type="button"
                        variant="outline"
                        className="w-full"
                        onClick={() => setSentOTP(false)}
                        disabled={isVerifying}
                      >
                        Change Phone Number
                      </Button>
                    </div>
                  </form>
                </Form>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="password">
            <p className="text-sm text-muted-foreground text-center mb-4">
              Continue with your username and password
            </p>
            <Button 
              variant="outline" 
              className="w-full" 
              onClick={() => setLocation('/erp/login')}
            >
              Go to Password Login
            </Button>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}