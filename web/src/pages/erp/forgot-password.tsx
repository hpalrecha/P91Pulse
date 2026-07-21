import React from 'react';
import { ForgotPasswordForm } from '@/components/password-reset/ForgotPasswordForm';
import { Link } from 'wouter';

export default function ForgotPasswordPage() {
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
          <ForgotPasswordForm />
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