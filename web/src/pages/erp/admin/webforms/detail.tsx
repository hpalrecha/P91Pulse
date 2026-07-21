import React from 'react';
import { useLocation, useParams } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { apiRequest } from '@/lib/queryClient';
import SidebarLayout from '@/components/layouts/sidebar-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Calendar, Clock, Printer, Download } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function WebformDetail() {
  const params = useParams<{ formType: string; id: string }>();
  const [, setLocation] = useLocation();
  const formTypeId = params.formType;
  const submissionId = parseInt(params.id, 10);

  // Function to format endpoint based on form type
  const getApiEndpoint = (formType: string, id: number) => {
    switch (formType) {
      case 'contact':
        return `/api/contact-submissions/${id}`;
      case 'installer-application':
        return `/api/installer-applications/${id}`;
      case 'warranty-registration':
        return `/api/warranty-registrations/${id}`;
      default:
        return '';
    }
  };

  // Query to fetch submission data
  const { data: submission, isLoading, error } = useQuery({
    queryKey: [getApiEndpoint(formTypeId, submissionId)],
    queryFn: async () => {
      try {
        // For warranty registrations we already have a specific endpoint
        if (formTypeId === 'warranty-registration') {
          const response = await apiRequest('GET', getApiEndpoint(formTypeId, submissionId));
          return await response.json();
        }
        
        // For other form types, we'll query the list and filter by ID
        // (until we have specific endpoints for individual submissions)
        const response = await apiRequest('GET', getApiEndpoint(formTypeId, 0).split('/0')[0]);
        const allSubmissions = await response.json();
        return allSubmissions.find((sub: any) => sub.id === submissionId);
      } catch (err) {
        console.error(`Error fetching submission details:`, err);
        throw err;
      }
    },
    enabled: !isNaN(submissionId)
  });

  // Function to get human-readable form name
  const getFormName = (formType: string) => {
    switch (formType) {
      case 'contact':
        return 'Contact Form Submission';
      case 'installer-application':
        return 'Installer Application';
      case 'warranty-registration':
        return 'Warranty Registration';
      default:
        return 'Form Submission';
    }
  };

  // Function to print the submission details
  const printSubmissionDetails = () => {
    window.print();
  };
  
  // Function to export submission details to CSV
  const exportToCSV = (data: any) => {
    if (!data) return;
    
    // Determine headers and values based on form type
    let headers: string[] = [];
    let values: any[] = [];
    
    // Common fields
    headers.push('ID', 'Submission Date', 'Name', 'Email');
    values.push(
      data.id,
      format(new Date(data.createdAt), 'yyyy-MM-dd HH:mm:ss'),
      data.name,
      data.email
    );
    
    if (data.phone) {
      headers.push('Phone');
      values.push(data.phone);
    }
    
    // Form-specific fields
    switch (formTypeId) {
      case 'contact':
        headers.push('Subject', 'Message');
        values.push(data.subject, data.message);
        break;
        
      case 'installer-application':
        headers.push(
          'Business Name', 'Business Type', 'Address', 'City', 'State', 'ZIP Code',
          'Years in Business', 'Current Products', 'Installation Volume', 'Additional Info'
        );
        values.push(
          data.businessName, data.businessType, data.address, data.city, data.state, data.zipCode,
          data.yearsInBusiness, data.currentProducts, data.installationVolume, data.additionalInfo
        );
        break;
        
      case 'warranty-registration':
        // Installer & Store Details
        headers.push(
          'Product Type', 'Warranty Code', 'Installation Date', 'Installer',
          'Installer Mobile', 'Store Email', 'Store Name', 'Store Location',
          
          // Vehicle Details
          'Vehicle Make', 'Vehicle Model', 'Vehicle Color', 'Vehicle VIN/Registration',
          
          // PPF Installation Areas (if available)
          'Full Car PPF', 'Partial Car PPF', 'Front Fender', 'Front Bumper',
          'Front Bonnet', 'A-Pillar', 'Doors', 'Roof', 'Rear Fender',
          'Back Cover', 'Light Reflector', 'Headlight',
          
          // Lot Numbers
          'Lot Numbers', 'Status'
        );
        
        // Prepare values with null handling for potentially missing fields
        const ppfAreas = [];
        if (data.fullCarPPF) ppfAreas.push('Full Car');
        if (data.partialCarPPF) ppfAreas.push('Partial Car');
        if (data.frontFender) ppfAreas.push('Front Fender');
        if (data.frontBumper) ppfAreas.push('Front Bumper');
        if (data.frontBonnet) ppfAreas.push('Front Bonnet');
        if (data.aPillar) ppfAreas.push('A-Pillar');
        if (data.doors) ppfAreas.push('Doors');
        if (data.roof) ppfAreas.push('Roof');
        if (data.rearFender) ppfAreas.push('Rear Fender');
        if (data.backCover) ppfAreas.push('Back Cover');
        if (data.lightReflector) ppfAreas.push('Light Reflector');
        if (data.headLight) ppfAreas.push('Headlight');
        
        // Format lot numbers if available
        const lotNumbersStr = data.lotNumbers ? 
          (Array.isArray(data.lotNumbers) ? 
            data.lotNumbers.map((ln: any) => `${ln.lotNumber} (${ln.quantity})`).join(', ') : 
            data.lotNumbers) : 
          '';
          
        values.push(
          data.productType || '', 
          data.warrantyCode || '', 
          data.installationDate || '', 
          data.installer || '',
          data.installerMobile || '', 
          data.storeEmail || '', 
          data.storeName || '', 
          data.storeLocation || '',
          
          data.vehicleMake || data.carMake || '', 
          data.vehicleModel || data.carModel || '', 
          data.vehicleColor || data.carColor || '', 
          data.vehicleVIN || data.carRegOrVIN || data.vin || '',
          
          data.fullCarPPF ? 'Yes' : 'No',
          data.partialCarPPF ? 'Yes' : 'No',
          data.frontFender ? 'Yes' : 'No',
          data.frontBumper ? 'Yes' : 'No',
          data.frontBonnet ? 'Yes' : 'No',
          data.aPillar ? 'Yes' : 'No',
          data.doors ? 'Yes' : 'No',
          data.roof ? 'Yes' : 'No',
          data.rearFender ? 'Yes' : 'No',
          data.backCover ? 'Yes' : 'No',
          data.lightReflector ? 'Yes' : 'No',
          data.headLight ? 'Yes' : 'No',
          
          lotNumbersStr,
          data.status || 'pending'
        );
        
        if (data.statusNotes) {
          headers.push('Status Notes');
          values.push(data.statusNotes);
        }
        break;
    }
    
    // Create CSV content - just one row for a single submission
    const csvContent = [
      headers.join(','),
      values.map(value => `"${String(value || '').replace(/"/g, '""')}"`).join(',')
    ].join('\n');
    
    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${formTypeId}_submission_${submissionId}_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    
    // Trigger download
    link.click();
    
    // Clean up
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Render component-specific details cards based on form type
  const renderFormSpecificDetails = () => {
    if (!submission) return null;

    switch (formTypeId) {
      case 'contact':
        return (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Message Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Subject</h3>
                  <p className="mt-1">{submission.subject}</p>
                </div>
                <Separator />
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Message</h3>
                  <p className="mt-1 whitespace-pre-line">{submission.message}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      
      case 'installer-application':
        return (
          <>
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Business Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Business Name</h3>
                    <p className="mt-1">{submission.businessName}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Business Type</h3>
                    <p className="mt-1">{submission.businessType}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Business Address</h3>
                    <p className="mt-1">{submission.address}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">City</h3>
                    <p className="mt-1">{submission.city}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">State</h3>
                    <p className="mt-1">{submission.state}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">ZIP Code</h3>
                    <p className="mt-1">{submission.zipCode}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Experience & Operations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Years in Business</h3>
                    <p className="mt-1">{submission.yearsInBusiness}</p>
                  </div>
                  <Separator />
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Current Products Used</h3>
                    <p className="mt-1">{submission.currentProducts}</p>
                  </div>
                  <Separator />
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Installation Volume</h3>
                    <p className="mt-1">{submission.installationVolume}</p>
                  </div>
                  <Separator />
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Additional Information</h3>
                    <p className="mt-1 whitespace-pre-line">{submission.additionalInfo}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        );
      
      case 'warranty-registration':
        // For lot numbers display
        const lotNumbersDisplay = submission.lotNumbers ? 
          (Array.isArray(submission.lotNumbers) 
            ? submission.lotNumbers.map((ln: any, idx: number) => (
              <div key={idx} className="flex items-center space-x-2 bg-gray-50 p-2 rounded">
                <div>#{ln.lotNumber}</div>
                <div className="text-sm text-gray-500">Qty: {ln.quantity}</div>
              </div>
            ))
            : submission.lotNumbers
          ) : null;
          
        // Prepare the PPF area display
        const ppfAreas = [];
        if (submission.fullCarPPF) ppfAreas.push('Full Car');
        if (submission.partialCarPPF) ppfAreas.push('Partial Car');
        if (submission.frontFender) ppfAreas.push('Front Fender');
        if (submission.frontBumper) ppfAreas.push('Front Bumper');
        if (submission.frontBonnet) ppfAreas.push('Front Bonnet');
        if (submission.aPillar) ppfAreas.push('A-Pillar');
        if (submission.doors) ppfAreas.push('Doors');
        if (submission.roof) ppfAreas.push('Roof');
        if (submission.rearFender) ppfAreas.push('Rear Fender');
        if (submission.backCover) ppfAreas.push('Back Cover');
        if (submission.lightReflector) ppfAreas.push('Light Reflector');
        if (submission.headLight) ppfAreas.push('Headlight');
        
        return (
          <>
            {/* Installer & Store Information */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Installer & Store Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Installer Name</h3>
                    <p className="mt-1">{submission.installer}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Installer Mobile</h3>
                    <p className="mt-1">{submission.installerMobile || "Not provided"}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Store Name</h3>
                    <p className="mt-1">{submission.storeName || "Not provided"}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Store Email</h3>
                    <p className="mt-1">{submission.storeEmail || "Not provided"}</p>
                  </div>
                  <div className="md:col-span-2">
                    <h3 className="text-sm font-medium text-gray-500">Store Location</h3>
                    <p className="mt-1">{submission.storeLocation || "Not provided"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Product Information */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Product Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Product Type</h3>
                    <p className="mt-1">{submission.productType}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Warranty Code</h3>
                    <p className="mt-1">
                      <Badge variant="outline">{submission.warrantyCode}</Badge>
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Date of Installation</h3>
                    <p className="mt-1">{submission.installationDate}</p>
                  </div>
                  
                  {lotNumbersDisplay && (
                    <div className="md:col-span-2">
                      <h3 className="text-sm font-medium text-gray-500">Lot Numbers</h3>
                      <div className="mt-1 flex flex-wrap gap-2">
                        {lotNumbersDisplay}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Vehicle Information */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Vehicle Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Make</h3>
                    <p className="mt-1">{submission.vehicleMake || submission.carMake}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Model</h3>
                    <p className="mt-1">{submission.vehicleModel || submission.carModel}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Color</h3>
                    <p className="mt-1">{submission.vehicleColor || submission.carColor}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">VIN/Registration</h3>
                    <p className="mt-1">{submission.vehicleVIN || submission.carRegOrVIN || submission.vin}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* PPF Installation Areas */}
            {ppfAreas.length > 0 && (
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>PPF Installation Areas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {ppfAreas.map((area, index) => (
                      <Badge key={index} variant="secondary">{area}</Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Warranty Status */}
            {submission.status && (
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Warranty Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center">
                    <Badge className="mr-2" variant={
                      submission.status === 'approved' ? 'default' :
                      submission.status === 'rejected' ? 'destructive' :
                      submission.status === 'pending' ? 'outline' : 'secondary'
                    }>
                      {submission.status.charAt(0).toUpperCase() + submission.status.slice(1)}
                    </Badge>
                    {submission.statusDate && (
                      <span className="text-sm text-gray-500">
                        Updated on {format(new Date(submission.statusDate), 'MMM dd, yyyy')}
                      </span>
                    )}
                  </div>
                  {submission.statusNotes && (
                    <div className="mt-4">
                      <h3 className="text-sm font-medium text-gray-500">Notes</h3>
                      <p className="mt-1 whitespace-pre-line">{submission.statusNotes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </>
        );
        
      default:
        return null;
    }
  };

  return (
    <SidebarLayout activeModule="webforms">
      <div className="p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <Button
              variant="ghost"
              size="sm"
              className="mb-2"
              onClick={() => setLocation(`/erp/admin/webforms/list/${formTypeId}`)}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to List
            </Button>
            <h1 className="text-2xl font-bold">{getFormName(formTypeId)} Details</h1>
          </div>
          
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" onClick={printSubmissionDetails}>
              <Printer className="mr-2 h-4 w-4" />
              Print
            </Button>
            {submission && (
              <Button variant="outline" size="sm" onClick={() => exportToCSV(submission)}>
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="py-20 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-gray-500">Loading submission details...</p>
          </div>
        ) : error ? (
          <div className="py-20 text-center text-red-500">
            <p>Error loading submission details. Please try again.</p>
          </div>
        ) : !submission ? (
          <div className="py-20 text-center text-red-500">
            <p>Submission not found.</p>
          </div>
        ) : (
          <div>
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Submission Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Submission Date</h3>
                    <div className="mt-1 flex items-center">
                      <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                      {format(new Date(submission.createdAt), 'MMMM dd, yyyy')}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Submission Time</h3>
                    <div className="mt-1 flex items-center">
                      <Clock className="h-4 w-4 mr-2 text-gray-400" />
                      {format(new Date(submission.createdAt), 'hh:mm a')}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Name</h3>
                    <p className="mt-1">{submission.name}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Email</h3>
                    <p className="mt-1">{submission.email}</p>
                  </div>
                  {submission.phone && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Phone</h3>
                      <p className="mt-1">{submission.phone}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {renderFormSpecificDetails()}
          </div>
        )}
      </div>
    </SidebarLayout>
  );
}