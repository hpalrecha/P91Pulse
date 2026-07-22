import { useState } from 'react';
import { useLocation } from 'wouter';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import p91PulseLogo from "@assets/P91 PULSE logo-02_1761587817659.png";

// Form validation schema
const formSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  // Initialize form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: '',
      password: '',
    },
  });
  
  // Form submission handler
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setLoading(true);
    
    try {
      const response = await apiRequest(
        'POST',
        '/api/auth/login',
        {
          username: values.username,
          password: values.password,
        }
      );
      
      const userData = await response.json();

      // Central login: a VAS-native user (OEM/dealership/salesperson/showroom)
      // isn't a Pulse user — send them to the VAS website.
      if (userData.redirectToVas) {
        window.location.href = userData.redirectToVas;
        return;
      }

      if (!userData.success && userData.message) {
        throw new Error(userData.message);
      }

      const user = userData.data || userData;

      // Drop any cached queries from a previous session in this browser so the new
      // user's /api/erp/me + dashboard data are fetched fresh (fixes stale name/KPIs).
      queryClient.clear();

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
      } else if (['national_sales_manager', 'regional_sales_manager', 'salesperson'].includes(user.role)) {
        setLocation('/erp/sales/dashboard');
      } else {
        setLocation('/erp');
      }
    } catch (error) {
      console.error('Login error:', error);
      toast({
        variant: 'destructive',
        title: 'Login Failed',
        description: 'Invalid username or password. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <img 
            src={p91PulseLogo} 
            alt="P91 Pulse" 
            className="h-16 mx-auto"
          />
        </div>
        
        <Card className="w-full">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-primary">Welcome Back</CardTitle>
            <CardDescription>
              Login to access the P91 Pulse management system
            </CardDescription>
          </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username or Email</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter your username or email" 
                        {...field} 
                        disabled={loading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input 
                        type="password" 
                        placeholder="Enter your password" 
                        {...field} 
                        disabled={loading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="flex justify-end mb-2">
                <Button
                  variant="link"
                  className="text-sm p-0 h-auto"
                  type="button"
                  onClick={() => setLocation('/erp/forgot-password')}
                >
                  Forgot password?
                </Button>
              </div>
              
              <Button 
                type="submit" 
                className="w-full" 
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                    <span>Logging in...</span>
                  </div>
                ) : (
                  'Login'
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-3">
          <p className="text-sm text-center text-gray-500">
            Don't have an account? Contact your distributor or P91 admin to get access.
          </p>
          <div className="flex flex-col space-y-2">
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => setLocation('/')}
            >
              Return to Website
            </Button>
          </div>
        </CardFooter>
        </Card>
      </div>
    </div>
  );
}