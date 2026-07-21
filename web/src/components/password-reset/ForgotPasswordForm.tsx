import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import axios from 'axios';

// Define form schema
const formSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

type FormValues = z.infer<typeof formSchema>;

export function ForgotPasswordForm() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
    },
  });

  async function onSubmit(data: FormValues) {
    setIsSubmitting(true);
    
    try {
      const response = await axios.post('/api/auth/forgot-password', {
        email: data.email,
      });
      
      setEmailSent(true);
      toast({
        title: "Password Reset Email Sent",
        description: "If your email is registered, you will receive password reset instructions.",
        variant: "default",
      });
      
    } catch (error: any) {
      console.error("Error requesting password reset:", error);
      
      const errorMessage = error.response?.data?.message || 
        "Failed to send password reset email. Please try again later.";
      
      toast({
        title: "Request Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Forgot Password</CardTitle>
        <CardDescription>
          Enter your email address and we'll send you a link to reset your password.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {emailSent ? (
          <div className="text-center space-y-4">
            <div className="text-green-600 text-lg font-medium">Email Sent!</div>
            <p>
              If your email is registered in our system, you will receive password 
              reset instructions shortly. Please check your inbox.
            </p>
            <p className="text-sm text-gray-500">
              Don't forget to check your spam or junk folder.
            </p>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter your email address" 
                        type="email" 
                        {...field} 
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormDescription>
                      We'll send a password reset link to this email address.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isSubmitting}
              >
                {isSubmitting ? "Sending..." : "Send Reset Link"}
              </Button>
            </form>
          </Form>
        )}
      </CardContent>
      <CardFooter className="flex justify-center">
        <Button 
          variant="link" 
          onClick={() => window.history.back()}
          disabled={isSubmitting}
        >
          Back to Login
        </Button>
      </CardFooter>
    </Card>
  );
}