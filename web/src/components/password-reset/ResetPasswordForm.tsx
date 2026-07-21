import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import axios from 'axios';
import { Link, useLocation } from 'wouter';
import { Check, AlertCircle, Lock, Loader, LogIn } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Define form schema with password validation
const formSchema = z.object({
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type FormValues = z.infer<typeof formSchema>;

interface ResetPasswordFormProps {
  token: string;
}

export function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [tokenValid, setTokenValid] = useState(true);
  const [countdown, setCountdown] = useState(5);
  const [, setLocation] = useLocation();

  // Use effect for auto-redirect after successful password reset
  useEffect(() => {
    let redirectTimer: NodeJS.Timeout;
    
    if (resetSuccess) {
      redirectTimer = setInterval(() => {
        setCountdown(prev => {
          const newCount = prev - 1;
          if (newCount <= 0) {
            clearInterval(redirectTimer);
            setLocation('/erp/login');
          }
          return newCount;
        });
      }, 1000);
    }
    
    return () => {
      if (redirectTimer) clearInterval(redirectTimer);
    };
  }, [resetSuccess, setLocation]);

  // Verify token validity on component mount
  useEffect(() => {
    const verifyToken = async () => {
      try {
        await axios.get(`/api/auth/verify-reset-token?token=${token}`);
      } catch (error) {
        console.error("Invalid or expired token:", error);
        setTokenValid(false);
      }
    };

    if (token) {
      verifyToken();
    } else {
      setTokenValid(false);
    }
  }, [token]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  async function onSubmit(data: FormValues) {
    setIsSubmitting(true);
    
    try {
      const response = await axios.post('/api/auth/reset-password', {
        token,
        newPassword: data.password,
      });
      
      setResetSuccess(true);
      toast({
        title: "Password Reset Successful",
        description: "Your password has been updated. You can now log in with your new password.",
        variant: "default",
      });
      
    } catch (error: any) {
      console.error("Error resetting password:", error);
      
      const errorMessage = error.response?.data?.message || 
        "Failed to reset password. The link may have expired or is invalid.";
      
      toast({
        title: "Reset Failed",
        description: errorMessage,
        variant: "destructive",
      });

      // If token is invalid or expired, update UI state
      if (error.response?.status === 400) {
        setTokenValid(false);
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  // Show error if token is invalid
  if (!tokenValid) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="text-red-600">Invalid Reset Link</CardTitle>
          <CardDescription>
            This password reset link is invalid or has expired
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              The password reset link you clicked is no longer valid. This could be because:
              <ul className="list-disc ml-5 mt-2">
                <li>The link has expired (links are valid for 1 hour)</li>
                <li>The link has already been used</li>
                <li>The link has been modified</li>
              </ul>
            </AlertDescription>
          </Alert>
          <p className="mb-4">Please request a new password reset link to continue.</p>
          <div className="flex justify-center mt-4">
            <Button asChild>
              <Link href="/erp/forgot-password">
                Request New Link
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <div className="flex items-center mb-2">
          <Lock className="mr-2 h-5 w-5 text-primary" />
          <CardTitle>Reset Your Password</CardTitle>
        </div>
        <CardDescription>
          Create a new password for your P91 India account
        </CardDescription>
      </CardHeader>
      <CardContent>
        {resetSuccess ? (
          <div className="text-center space-y-4">
            <div className="bg-green-50 p-4 rounded-lg border border-green-200 mb-4">
              <div className="flex justify-center mb-3">
                <div className="rounded-full bg-green-100 p-2">
                  <Check className="h-6 w-6 text-green-600" />
                </div>
              </div>
              <div className="text-green-600 text-lg font-medium">Password Updated Successfully!</div>
              <p className="text-gray-600 mt-2">
                Your password has been reset. You can now log in with your new password.
              </p>
              <div className="mt-4 bg-blue-50 p-3 rounded-md border border-blue-100">
                <p className="text-blue-700 font-medium text-sm">
                  Important: Remember to log in with your username, not your email address.
                </p>
              </div>
            </div>
            <p className="text-sm text-gray-500">
              Redirecting to login in {countdown} seconds...
            </p>
            <Button asChild className="mt-2 w-full">
              <Link href="/erp/login" className="flex items-center justify-center">
                <LogIn className="mr-2 h-4 w-4" />
                Go to Login Now
              </Link>
            </Button>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New Password</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter your new password" 
                        type="password" 
                        {...field} 
                        disabled={isSubmitting}
                        className="bg-white"
                      />
                    </FormControl>
                    <FormDescription>
                      Must be at least 8 characters with uppercase, lowercase, and numbers.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm Password</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Confirm your new password" 
                        type="password" 
                        {...field} 
                        disabled={isSubmitting}
                        className="bg-white"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader className="mr-2 h-4 w-4 animate-spin" /> 
                    Resetting...
                  </>
                ) : (
                  "Reset Password"
                )}
              </Button>

              <div className="text-center text-sm mt-4">
                <Link href="/erp/login" className="text-primary hover:underline">
                  Return to login
                </Link>
              </div>
            </form>
          </Form>
        )}
      </CardContent>
    </Card>
  );
}