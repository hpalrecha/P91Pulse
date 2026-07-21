import { useState, useEffect } from 'react';
import { useParams, useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ArrowLeft } from 'lucide-react';

// UI Components
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import SidebarLayout from '@/components/layouts/sidebar-layout';
import { InstallerApplication } from '@shared/schema';

// Format date string
const formatDate = (dateValue: string | Date | undefined | null) => {
  if (!dateValue) return 'N/A';
  try {
    if (dateValue instanceof Date) {
      return format(dateValue, 'MMM dd, yyyy');
    }
    return format(new Date(dateValue), 'MMM dd, yyyy');
  } catch (error) {
    return String(dateValue);
  }
};

export default function InstallerApplicationDetail() {
  const params = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const entryId = parseInt(params.id || "0");
  
  // Fetch all installer applications
  const { data = [], isLoading } = useQuery<InstallerApplication[]>({
    queryKey: ['/api/installer-applications'],
  });

  // Find the specific entry by ID
  const entry = data.find(item => item.id === entryId);

  return (
    <SidebarLayout>
      <div className="p-8">
        <div className="flex items-center mb-6">
          <Button 
            variant="outline"
            onClick={() => setLocation(`/erp/admin/webforms/installer-applications`)}
            className="mr-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Installer Applications
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Installer Application Details</h1>
            <p className="text-gray-500">Viewing detailed information for this application</p>
          </div>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <p className="text-gray-500">Loading application details...</p>
          </div>
        ) : !entry ? (
          <div className="text-center p-12 bg-gray-50 rounded-md">
            <p className="text-gray-500">Application not found.</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg border shadow-sm">
              <h2 className="text-xl font-semibold mb-4">Business Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Business Name</h3>
                  <p className="text-base">{entry.businessName}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Business Type</h3>
                  <p className="text-base">{entry.businessType}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">City</h3>
                  <p className="text-base">{entry.city}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Date</h3>
                  <p className="text-base">{formatDate(entry.createdAt)}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Terms Accepted</h3>
                  <p className="text-base">{entry.termsAccepted ? 'Yes' : 'No'}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg border shadow-sm">
              <h2 className="text-xl font-semibold mb-4">Contact Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Contact Person</h3>
                  <p className="text-base">{entry.name}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Email</h3>
                  <p className="text-base">{entry.email}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Phone</h3>
                  <p className="text-base">{entry.phone}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg border shadow-sm">
              <h2 className="text-xl font-semibold mb-4">Additional Information</h2>
              <p className="text-base whitespace-pre-wrap">{entry.message}</p>
            </div>
          </div>
        )}
      </div>
    </SidebarLayout>
  );
}