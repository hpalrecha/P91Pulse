import { useState } from 'react';
import { useParams, useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ArrowLeft, Printer, Clock, FileText, Info } from 'lucide-react';

// UI Components
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import SidebarLayout from '@/components/layouts/sidebar-layout';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Separator } from '@/components/ui/separator';
import { 
  ContactSubmission, 
  InstallerApplication, 
  WarrantyRegistration 
} from '@shared/schema';

// Format date string
const formatDate = (dateValue: string | Date | undefined | null) => {
  if (!dateValue) return 'N/A';
  try {
    if (dateValue instanceof Date) {
      return format(dateValue, 'MMM dd, yyyy h:mm a');
    }
    return format(new Date(dateValue), 'MMM dd, yyyy h:mm a');
  } catch (error) {
    return String(dateValue);
  }
};

// Define form configurations
const formConfigs = {
  'contact-submissions': {
    title: 'Contact Form Submission',
    apiEndpoint: '/api/contact-submissions',
    backPath: '/erp/admin/webforms/contact-submissions',
    sections: [
      {
        title: 'Contact Information',
        fields: [
          { label: 'Name', key: 'name' },
          { label: 'Email', key: 'email' },
          { label: 'Subject', key: 'subject' },
          { label: 'Submission Date', key: 'createdAt', formatter: formatDate },
        ]
      },
      {
        title: 'Message',
        fields: [
          { label: 'Message', key: 'message', type: 'longText' },
        ]
      }
    ]
  },
  'installer-applications': {
    title: 'Installer Application',
    apiEndpoint: '/api/installer-applications',
    backPath: '/erp/admin/webforms/installer-applications',
    sections: [
      {
        title: 'Business Information',
        fields: [
          { label: 'Business Name', key: 'businessName' },
          { label: 'Business Type', key: 'businessType' },
          { label: 'City', key: 'city' },
          { label: 'Application Date', key: 'createdAt', formatter: formatDate },
          { label: 'Terms Accepted', key: 'termsAccepted', formatter: (value: boolean) => value ? 'Yes' : 'No' },
        ]
      },
      {
        title: 'Contact Information',
        fields: [
          { label: 'Contact Person', key: 'name' },
          { label: 'Email', key: 'email' },
          { label: 'Phone', key: 'phone' },
        ]
      },
      {
        title: 'Additional Information',
        fields: [
          { label: 'Message', key: 'message', type: 'longText' },
        ]
      }
    ]
  },
  'warranty-registrations': {
    title: 'Warranty Registration',
    apiEndpoint: '/api/warranty-registrations',
    backPath: '/erp/admin/warranty-registrations',
    sections: [
      {
        title: 'Warranty Information',
        fields: [
          { label: 'Warranty Code', key: 'warrantyCode' },
          { label: 'Product Type', key: 'productType' },
          { label: 'Installation Date', key: 'installationDate', formatter: formatDate },
          { label: 'Registration Date', key: 'createdAt', formatter: formatDate },
          { label: 'Status', key: 'status', formatter: (value: string) => {
            const statusMap: Record<string, { label: string, color: string }> = {
              'pending': { label: 'Pending', color: 'bg-blue-100 text-blue-800' },
              'approved': { label: 'Approved', color: 'bg-green-100 text-green-800' },
              'rejected': { label: 'Rejected', color: 'bg-red-100 text-red-800' },
              'on-hold': { label: 'On Hold', color: 'bg-yellow-100 text-yellow-800' }
            };
            const status = statusMap[value] || { label: value || 'Pending', color: 'bg-blue-100 text-blue-800' };
            return <Badge className={status.color}>{status.label}</Badge>;
          }},
          { label: 'Status Date', key: 'statusDate', formatter: formatDate },
          { label: 'Status Notes', key: 'statusNotes', type: 'longText' }
        ]
      },
      {
        title: 'Installer & Store Details',
        fields: [
          { label: 'Installer Name', key: 'installer' },
          { label: 'Installer Mobile', key: 'installerMobile' },
          { label: 'Store Name', key: 'storeName' },
          { label: 'Store Email', key: 'storeEmail' },
          { label: 'Store Location', key: 'storeLocation' },
        ]
      },
      {
        title: 'Customer Information',
        fields: [
          { label: 'Name', key: 'name' },
          { label: 'Email', key: 'email' },
          { label: 'Phone', key: 'phone' },
        ]
      },
      {
        title: 'Vehicle Information',
        fields: [
          { label: 'Make', key: 'vehicleMake' },
          { label: 'Model', key: 'vehicleModel' },
          { label: 'Year', key: 'vehicleYear' },
          { label: 'Color', key: 'vehicleColor' },
          { label: 'VIN/Registration', key: 'vehicleVIN' },
        ]
      },
      {
        title: 'PPF Installation Areas',
        fields: [
          { label: 'Full Car PPF', key: 'fullCarPPF', formatter: (value: boolean) => value ? 'Yes' : 'No' },
          { label: 'Partial Car PPF', key: 'partialCarPPF', formatter: (value: boolean) => value ? 'Yes' : 'No' },
          { label: 'Front Fender', key: 'frontFender', formatter: (value: boolean) => value ? 'Yes' : 'No' },
          { label: 'Front Bumper', key: 'frontBumper', formatter: (value: boolean) => value ? 'Yes' : 'No' },
          { label: 'Front Bonnet', key: 'frontBonnet', formatter: (value: boolean) => value ? 'Yes' : 'No' },
          { label: 'A-Pillar', key: 'aPillar', formatter: (value: boolean) => value ? 'Yes' : 'No' },
          { label: 'Doors', key: 'doors', formatter: (value: boolean) => value ? 'Yes' : 'No' },
          { label: 'Roof', key: 'roof', formatter: (value: boolean) => value ? 'Yes' : 'No' },
          { label: 'Rear Fender', key: 'rearFender', formatter: (value: boolean) => value ? 'Yes' : 'No' },
          { label: 'Back Cover', key: 'backCover', formatter: (value: boolean) => value ? 'Yes' : 'No' },
          { label: 'Light Reflector', key: 'lightReflector', formatter: (value: boolean) => value ? 'Yes' : 'No' },
          { label: 'Head Light', key: 'headLight', formatter: (value: boolean) => value ? 'Yes' : 'No' },
        ]
      },
      {
        title: 'Product Details',
        fields: [
          { 
            label: 'Lot Numbers', 
            key: 'lotNumbers', 
            type: 'longText',
            formatter: (value: any[]) => {
              if (!value || !Array.isArray(value)) return 'N/A';
              return value.map(item => `${item.lotNumber}: ${item.quantity}`).join('\n');
            } 
          },
        ]
      }
    ]
  }
};

type FormConfig = {
  title: string;
  apiEndpoint: string;
  backPath: string;
  sections: {
    title: string;
    fields: {
      label: string;
      key: string;
      type?: string;
      formatter?: (value: any) => any;
    }[];
  }[];
};

// Helper to print entry details
const printEntry = () => {
  window.print();
};

export default function WebformEntryDetails() {
  const params = useParams<{ formName: string, id: string }>();
  const [, setLocation] = useLocation();
  const entryId = parseInt(params.id || "0");
  const formName = params.formName;
  
  // Validate formName
  const validFormName = formName && formName in formConfigs 
    ? formName as keyof typeof formConfigs
    : null;
  
  if (!validFormName) {
    setTimeout(() => setLocation('/erp/admin/webforms'), 0);
    return (
      <SidebarLayout>
        <div className="p-6">Redirecting to webforms index...</div>
      </SidebarLayout>
    );
  }

  const config = formConfigs[validFormName] as FormConfig;
  
  // Fetch data for the current form
  const { data = [], isLoading } = useQuery<any[]>({
    queryKey: [config.apiEndpoint],
  });

  // Find the specific entry by ID
  const entry = data.find(item => item.id === entryId);

  // Handle back button
  const handleBack = () => {
    setLocation(config.backPath);
  };

  return (
    <SidebarLayout>
      <div className="p-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div className="flex items-center">
            <Button 
              variant="outline"
              onClick={handleBack}
              className="mr-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to List
            </Button>
            <div>
              <h1 className="text-2xl font-bold">{config.title} Details</h1>
              <p className="text-gray-500">
                Viewing detailed information for this submission
              </p>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={printEntry}
              className="print:hidden"
            >
              <Printer className="h-4 w-4 mr-2" />
              Print / Export PDF
            </Button>
          </div>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <p className="text-gray-500">Loading submission details...</p>
          </div>
        ) : !entry ? (
          <div className="text-center p-12 bg-gray-50 rounded-md">
            <p className="text-gray-500">Submission not found.</p>
          </div>
        ) : (
          <div>
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Info className="h-5 w-5 mr-2" />
                  Submission Overview
                </CardTitle>
                <CardDescription>
                  ID: {entry.id} • Submitted on: {formatDate(entry.createdAt)}
                </CardDescription>
              </CardHeader>
            </Card>

            <Tabs defaultValue="details" className="w-full">
              <TabsList className="mb-6">
                <TabsTrigger value="details" className="flex items-center">
                  <FileText className="h-4 w-4 mr-2" />
                  Form Details
                </TabsTrigger>
                {entry.statusHistory && (
                  <TabsTrigger value="history" className="flex items-center">
                    <Clock className="h-4 w-4 mr-2" />
                    Status History
                  </TabsTrigger>
                )}
              </TabsList>
              
              <TabsContent value="details" className="space-y-6">
                {config.sections.map((section, index) => (
                  <Card key={index}>
                    <CardHeader>
                      <CardTitle>{section.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {section.fields.some(field => entry[field.key]) ? (
                        <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                          {section.fields.map((field, fieldIndex) => {
                            // Skip empty fields unless required by configuration
                            if (entry[field.key] === undefined && !field.formatter) return null;
                            
                            const value = field.formatter 
                              ? field.formatter(entry[field.key])
                              : entry[field.key] || 'N/A';
                            
                            if (field.type === 'longText') {
                              return (
                                <div key={fieldIndex} className="col-span-1 md:col-span-2">
                                  <dt className="text-sm font-medium text-gray-500">{field.label}</dt>
                                  <dd className="mt-1 text-base whitespace-pre-wrap">{value}</dd>
                                </div>
                              );
                            }
                            
                            return (
                              <div key={fieldIndex}>
                                <dt className="text-sm font-medium text-gray-500">{field.label}</dt>
                                <dd className="mt-1 text-base">{value}</dd>
                              </div>
                            );
                          })}
                        </dl>
                      ) : (
                        <p className="text-gray-500 text-center py-4">No {section.title.toLowerCase()} provided</p>
                      )}
                    </CardContent>
                  </Card>
                ))}

                {/* Attached Images Section */}
                {(() => {
                  // Check for photos or images in different possible formats
                  const photos = entry.photos || entry.images || entry.attachments;
                  
                  // Helper function to determine if we have valid photos to display
                  const hasPhotos = () => {
                    if (!photos) return false;
                    
                    if (Array.isArray(photos) && photos.length > 0) return true;
                    
                    if (typeof photos === 'string') {
                      // Check if it's a non-empty string
                      if (photos.trim().length > 0) return true;
                      
                      // Try to parse as JSON
                      try {
                        const parsed = JSON.parse(photos);
                        return Array.isArray(parsed) && parsed.length > 0;
                      } catch (e) {
                        // Not valid JSON, but still might be a direct image path
                        return true;
                      }
                    }
                    
                    return false;
                  };
                  
                  // If no photos, don't render the section
                  if (!hasPhotos()) return null;
                  
                  return (
                    <Card>
                      <CardHeader>
                        <CardTitle>Attached Images</CardTitle>
                        <CardDescription>
                          Images uploaded with this submission
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        {(() => {
                          // Case 1: Photos is an array
                          if (photos && Array.isArray(photos) && photos.length > 0) {
                            return (
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {photos.map((photo, index) => (
                                  <div key={index} className="border rounded-md overflow-hidden">
                                    <div className="relative aspect-video">
                                      <img 
                                        src={photo} 
                                        alt={`Attached image ${index + 1}`} 
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                          console.error(`Error loading image ${index}`, e);
                                          e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAwIiBoZWlnaHQ9IjM1MCIgdmlld0JveD0iMCAwIDUwMCAzNTAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjUwMCIgaGVpZ2h0PSIzNTAiIGZpbGw9IiNlZWUiLz48dGV4dCB4PSIyNTAiIHk9IjE3NSIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjI0IiBmaWxsPSIjYWFhIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBhbGlnbm1lbnQtYmFzZWxpbmU9Im1pZGRsZSI+SW1hZ2UgTG9hZCBFcnJvcjwvdGV4dD48L3N2Zz4=';
                                        }}
                                      />
                                    </div>
                                    <div className="p-2 bg-gray-50 flex justify-between items-center">
                                      <span className="text-sm text-gray-500">Image {index + 1}</span>
                                      {photo.startsWith('data:') ? (
                                        <button
                                          onClick={() => {
                                            // Open a new window with just the image for base64 images
                                            const win = window.open("", "_blank");
                                            if (win) {
                                              win.document.write(`
                                                <html>
                                                  <head>
                                                    <title>Image Viewer</title>
                                                    <style>body{margin:0;display:flex;justify-content:center;align-items:center;height:100vh;background:#f5f5f5;}</style>
                                                  </head>
                                                  <body>
                                                    <img src="${photo}" style="max-width:90%;max-height:90%;" />
                                                  </body>
                                                </html>
                                              `);
                                            }
                                          }}
                                          className="text-blue-500 hover:text-blue-700 text-sm flex items-center"
                                        >
                                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                          </svg>
                                          View Full Size
                                        </button>
                                      ) : (
                                        <a 
                                          href={photo} 
                                          target="_blank" 
                                          rel="noopener noreferrer" 
                                          className="text-blue-500 hover:text-blue-700 text-sm flex items-center"
                                        >
                                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                          </svg>
                                          View Full Size
                                        </a>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            );
                          }
                          
                          // Case 2: Photos is a string (possibly stringified JSON)
                          if (photos && typeof photos === 'string') {
                            try {
                              // Try to parse it as JSON
                              const parsedPhotos = JSON.parse(photos);
                              if (Array.isArray(parsedPhotos) && parsedPhotos.length > 0) {
                                return (
                                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {parsedPhotos.map((photo, index) => (
                                      <div key={index} className="border rounded-md overflow-hidden">
                                        <div className="relative aspect-video">
                                          <img 
                                            src={photo} 
                                            alt={`Attached image ${index + 1}`} 
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                              console.error(`Error loading image ${index}`, e);
                                              e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAwIiBoZWlnaHQ9IjM1MCIgdmlld0JveD0iMCAwIDUwMCAzNTAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjUwMCIgaGVpZ2h0PSIzNTAiIGZpbGw9IiNlZWUiLz48dGV4dCB4PSIyNTAiIHk9IjE3NSIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjI0IiBmaWxsPSIjYWFhIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBhbGlnbm1lbnQtYmFzZWxpbmU9Im1pZGRsZSI+SW1hZ2UgTG9hZCBFcnJvcjwvdGV4dD48L3N2Zz4=';
                                            }}
                                          />
                                        </div>
                                        <div className="p-2 bg-gray-50 flex justify-between items-center">
                                          <span className="text-sm text-gray-500">Image {index + 1}</span>
                                          {photo.startsWith('data:') ? (
                                            <button
                                              onClick={() => {
                                                // Open a new window with just the image for base64 images
                                                const win = window.open("", "_blank");
                                                if (win) {
                                                  win.document.write(`
                                                    <html>
                                                      <head>
                                                        <title>Image Viewer</title>
                                                        <style>body{margin:0;display:flex;justify-content:center;align-items:center;height:100vh;background:#f5f5f5;}</style>
                                                      </head>
                                                      <body>
                                                        <img src="${photo}" style="max-width:90%;max-height:90%;" />
                                                      </body>
                                                    </html>
                                                  `);
                                                }
                                              }}
                                              className="text-blue-500 hover:text-blue-700 text-sm flex items-center"
                                            >
                                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                              </svg>
                                              View Full Size
                                            </button>
                                          ) : (
                                            <a 
                                              href={photo} 
                                              target="_blank" 
                                              rel="noopener noreferrer" 
                                              className="text-blue-500 hover:text-blue-700 text-sm flex items-center"
                                            >
                                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                              </svg>
                                              View Full Size
                                            </a>
                                          )}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                );
                              }
                            } catch (e) {
                              console.error("Failed to parse photos string as JSON:", e);
                            }
                            
                            // If it's a string but not JSON or failed to parse, display a single image
                            return (
                              <div className="text-center">
                                <div className="border rounded-md overflow-hidden inline-block max-w-xl">
                                  <div className="relative aspect-video">
                                    <img 
                                      src={photos} 
                                      alt="Attached image" 
                                      className="w-full h-full object-cover"
                                      onError={(e) => {
                                        console.error("Error loading image from string", e);
                                        e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAwIiBoZWlnaHQ9IjM1MCIgdmlld0JveD0iMCAwIDUwMCAzNTAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjUwMCIgaGVpZ2h0PSIzNTAiIGZpbGw9IiNlZWUiLz48dGV4dCB4PSIyNTAiIHk9IjE3NSIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjI0IiBmaWxsPSIjYWFhIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBhbGlnbm1lbnQtYmFzZWxpbmU9Im1pZGRsZSI+SW1hZ2UgTG9hZCBFcnJvcjwvdGV4dD48L3N2Zz4=';
                                      }}
                                    />
                                  </div>
                                  <div className="p-2 bg-gray-50 flex justify-center">
                                    {photos.startsWith('data:') ? (
                                      <button
                                        onClick={() => {
                                          // Open a new window with just the image for base64 images
                                          const win = window.open("", "_blank");
                                          if (win) {
                                            win.document.write(`
                                              <html>
                                                <head>
                                                  <title>Image Viewer</title>
                                                  <style>body{margin:0;display:flex;justify-content:center;align-items:center;height:100vh;background:#f5f5f5;}</style>
                                                </head>
                                                <body>
                                                  <img src="${photos}" style="max-width:90%;max-height:90%;" />
                                                </body>
                                              </html>
                                            `);
                                          }
                                        }}
                                        className="text-blue-500 hover:text-blue-700 text-sm flex items-center"
                                      >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                        </svg>
                                        View Full Size
                                      </button>
                                    ) : (
                                      <a 
                                        href={photos} 
                                        target="_blank" 
                                        rel="noopener noreferrer" 
                                        className="text-blue-500 hover:text-blue-700 text-sm flex items-center"
                                      >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                        </svg>
                                        View Full Size
                                      </a>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          }
                          
                          return (
                            <div className="text-center p-4 bg-gray-50 rounded-md">
                              <p className="text-gray-500">No images available</p>
                            </div>
                          );
                        })()}
                      </CardContent>
                    </Card>
                  );
                })()}
              </TabsContent>
              
              {entry.statusHistory && (
                <TabsContent value="history" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Status History</CardTitle>
                      <CardDescription>
                        Changes to the status of this submission over time
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {Array.isArray(entry.statusHistory) && entry.statusHistory.length > 0 ? (
                        <div className="space-y-6">
                          {entry.statusHistory.map((statusItem: any, index: number) => (
                            <div key={index} className="border-b pb-4 last:border-0">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  {(() => {
                                    const statusMap: Record<string, string> = {
                                      'pending': 'bg-blue-100 text-blue-800',
                                      'approved': 'bg-green-100 text-green-800',
                                      'rejected': 'bg-red-100 text-red-800',
                                      'on-hold': 'bg-yellow-100 text-yellow-800'
                                    };
                                    const color = statusMap[statusItem.status] || 'bg-blue-100 text-blue-800';
                                    return (
                                      <Badge className={color}>
                                        {statusItem.status.charAt(0).toUpperCase() + statusItem.status.slice(1)}
                                      </Badge>
                                    );
                                  })()}
                                </div>
                                <span className="text-sm text-gray-500">
                                  {formatDate(statusItem.date)}
                                </span>
                              </div>
                              {statusItem.reason && (
                                <p className="mt-2 text-sm text-gray-700">{statusItem.reason}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500 text-center py-4">No status history available</p>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              )}
            </Tabs>
          </div>
        )}
      </div>
      
      {/* Add print-specific styles */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .p-8, .p-8 * {
            visibility: visible;
          }
          .p-8 {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .print\\:hidden {
            display: none !important;
          }
        }
      `}</style>
    </SidebarLayout>
  );
}