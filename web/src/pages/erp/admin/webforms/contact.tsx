import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Mail, Calendar, User, Phone, MessageSquare } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface ContactSubmission {
  id: number;
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  status: 'new' | 'responded' | 'closed';
  createdAt: string;
  updatedAt?: string;
}

export default function ContactSubmissionsPage() {
  const [, setLocation] = useLocation();
  const [selectedSubmission, setSelectedSubmission] = useState<ContactSubmission | null>(null);

  // Fetch contact submissions
  const { data: submissions, isLoading, error } = useQuery<ContactSubmission[]>({
    queryKey: ['/api/contact-submissions'],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', '/api/contact-submissions');
        if (response.ok) {
          return await response.json();
        }
        // If endpoint doesn't exist, return empty array
        return [];
      } catch (error) {
        console.log('Contact submissions endpoint not available');
        return [];
      }
    }
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'responded':
        return <Badge className="bg-green-100 text-green-800">Responded</Badge>;
      case 'closed':
        return <Badge className="bg-gray-100 text-gray-800">Closed</Badge>;
      default:
        return <Badge className="bg-blue-100 text-blue-800">New</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center mb-6">
          <Button 
            variant="outline"
            onClick={() => setLocation('/erp/admin/webforms')}
            className="mr-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Web Forms
          </Button>
          <h1 className="text-2xl font-bold">Contact Form Submissions</h1>
        </div>
        <div className="flex justify-center items-center h-64">
          <p className="text-gray-500">Loading contact submissions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center mb-6">
        <Button 
          variant="outline"
          onClick={() => setLocation('/erp/admin/webforms')}
          className="mr-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Web Forms
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Contact Form Submissions</h1>
          <p className="text-gray-500">Customer inquiries and messages from the contact form</p>
        </div>
      </div>

      {error ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-red-600">
              <p>Failed to load contact submissions. The contact form endpoint may not be configured yet.</p>
              <p className="text-sm text-gray-500 mt-2">Contact your developer to set up the contact form API.</p>
            </div>
          </CardContent>
        </Card>
      ) : !submissions || submissions.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <Mail className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No contact submissions yet</h3>
              <p className="text-gray-500">
                Contact form submissions from your website will appear here when customers send messages.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {submissions.map((submission) => (
            <Card key={submission.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-xl font-semibold flex items-center gap-2">
                      <User className="h-5 w-5" />
                      {submission.name}
                    </CardTitle>
                    <CardDescription className="mt-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="h-4 w-4" />
                        {submission.email}
                      </div>
                      {submission.phone && (
                        <div className="flex items-center gap-2 text-sm mt-1">
                          <Phone className="h-4 w-4" />
                          {submission.phone}
                        </div>
                      )}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(submission.status)}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Subject</h4>
                    <p className="text-gray-700">{submission.subject}</p>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" />
                      Message
                    </h4>
                    <p className="text-gray-700 bg-gray-50 p-3 rounded-md">
                      {submission.message}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Calendar className="h-4 w-4" />
                      Submitted: {formatDate(submission.createdAt)}
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Mail className="h-4 w-4 mr-2" />
                        Reply
                      </Button>
                      <Button variant="outline" size="sm">
                        Mark as Responded
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}