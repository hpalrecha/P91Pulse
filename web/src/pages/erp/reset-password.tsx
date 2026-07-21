import React, { useEffect, useState } from 'react';
import { ResetPasswordForm } from '@/components/password-reset/ResetPasswordForm';
import { Link, useLocation } from 'wouter';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

export default function ResetPasswordPage() {
  const [location] = useLocation();
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      // Parse the URL to extract the token parameter
      const url = new URL(window.location.href);
      const tokenParam = url.searchParams.get('token');
      
      if (!tokenParam) {
        setError('Reset token is missing. Please use the link from your email.');
      } else {
        setToken(tokenParam);
      }
    } catch (err) {
      console.error('Error parsing URL:', err);
      setError('Invalid reset link. Please try requesting a new password reset.');
    } finally {
      setIsLoading(false);
    }
  }, [location]);

  return (
    <div className="min-h-screen flex flex-col">
      <header className="py-4 px-6 border-b">
        <div className="container mx-auto">
          <Link href="/">
            <div className="flex items-center">
              <img src="/assets/P91-logo.png" alt="P91 Logo" className="h-8 w-auto mr-2" />
              <span className="text-xl font-bold">P91 India</span>
            </div>
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md">
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : error ? (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
              <div className="mt-4 flex justify-center">
                <Button asChild>
                  <Link href="/erp/forgot-password">Request New Reset Link</Link>
                </Button>
              </div>
            </Alert>
          ) : token ? (
            <ResetPasswordForm token={token} />
          ) : null}
        </div>
      </main>

      <footer className="py-4 border-t">
        <div className="container mx-auto text-center text-sm text-gray-500">
          &copy; {new Date().getFullYear()} P91 India. All rights reserved.
        </div>
      </footer>
    </div>
  );
}