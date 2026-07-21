import React, { useState } from 'react';
import { useLocation, useParams } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { apiRequest } from '@/lib/queryClient';
import SidebarLayout from '@/components/layouts/sidebar-layout';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Search, FileText, Calendar, Download } from 'lucide-react';

export default function WebformsList() {
  const params = useParams<{ formType: string }>();
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState('');
  
  // Function to export submissions data to CSV
  const exportToCSV = (data: any[]) => {
    if (!data || data.length === 0) return;
    
    // Determine headers based on form type
    let headers: string[] = [];
    
    switch (params.formType) {
      case 'contact':
        headers = ['ID', 'Date', 'Name', 'Email', 'Subject', 'Message'];
        break;
      case 'installer-application':
        headers = [
          'ID', 'Date', 'Name', 'Email', 'Phone', 'Business Name', 
          'Business Type', 'Address', 'City', 'State', 'ZIP Code',
          'Years in Business', 'Current Products', 'Installation Volume', 
          'Additional Info'
        ];
        break;
      case 'warranty-registration':
        headers = [
          'ID', 'Date', 'Name', 'Email', 'Phone', 
          // Installer & Store Details
          'Product Type', 'Warranty Code', 'Installation Date', 'Installer',
          'Installer Mobile', 'Store Email', 'Store Name', 'Store Location',
          // Vehicle Details
          'Vehicle Make', 'Vehicle Model', 'Vehicle Color', 'Vehicle VIN/Registration',
          // PPF Installation Areas
          'Full Car PPF', 'Partial Car PPF', 'Front Fender', 'Front Bumper',
          'Front Bonnet', 'A-Pillar', 'Doors', 'Roof', 'Rear Fender',
          'Back Cover', 'Light Reflector', 'Headlight',
          // Lot Numbers
          'Lot Numbers', 'Status'
        ];
        break;
      default:
        headers = Object.keys(data[0]);
    }
    
    // Format data rows based on form type
    const rows = data.map((item) => {
      const formattedDate = format(new Date(item.createdAt), 'yyyy-MM-dd HH:mm:ss');
      
      switch (params.formType) {
        case 'contact':
          return [
            item.id,
            formattedDate,
            item.name,
            item.email,
            item.subject,
            item.message
          ];
        case 'installer-application':
          return [
            item.id,
            formattedDate,
            item.name,
            item.email,
            item.phone,
            item.businessName,
            item.businessType,
            item.address,
            item.city,
            item.state,
            item.zipCode,
            item.yearsInBusiness,
            item.currentProducts,
            item.installationVolume,
            item.additionalInfo
          ];
        case 'warranty-registration':
          // Prepare values with null handling for potentially missing fields
          const ppfAreas = [];
          if (item.fullCarPPF) ppfAreas.push('Full Car');
          if (item.partialCarPPF) ppfAreas.push('Partial Car');
          if (item.frontFender) ppfAreas.push('Front Fender');
          if (item.frontBumper) ppfAreas.push('Front Bumper');
          if (item.frontBonnet) ppfAreas.push('Front Bonnet');
          if (item.aPillar) ppfAreas.push('A-Pillar');
          if (item.doors) ppfAreas.push('Doors');
          if (item.roof) ppfAreas.push('Roof');
          if (item.rearFender) ppfAreas.push('Rear Fender');
          if (item.backCover) ppfAreas.push('Back Cover');
          if (item.lightReflector) ppfAreas.push('Light Reflector');
          if (item.headLight) ppfAreas.push('Headlight');
          
          // Format lot numbers if available
          const lotNumbersStr = item.lotNumbers ? 
            (Array.isArray(item.lotNumbers) ? 
              item.lotNumbers.map((ln: any) => `${ln.lotNumber} (${ln.quantity})`).join(', ') : 
              item.lotNumbers) : 
            '';
            
          return [
            item.id,
            formattedDate,
            item.name,
            item.email,
            item.phone,
            
            // Installer & Store Details
            item.productType || '',
            item.warrantyCode || '',
            item.installationDate || '',
            item.installer || '',
            item.installerMobile || '',
            item.storeEmail || '',
            item.storeName || '',
            item.storeLocation || '',
            
            // Vehicle Details
            item.vehicleMake || item.carMake || '',
            item.vehicleModel || item.carModel || '',
            item.vehicleColor || item.carColor || '',
            item.vehicleVIN || item.carRegOrVIN || item.vin || '',
            
            // PPF Installation Areas
            item.fullCarPPF ? 'Yes' : 'No',
            item.partialCarPPF ? 'Yes' : 'No',
            item.frontFender ? 'Yes' : 'No',
            item.frontBumper ? 'Yes' : 'No',
            item.frontBonnet ? 'Yes' : 'No',
            item.aPillar ? 'Yes' : 'No',
            item.doors ? 'Yes' : 'No',
            item.roof ? 'Yes' : 'No',
            item.rearFender ? 'Yes' : 'No',
            item.backCover ? 'Yes' : 'No',
            item.lightReflector ? 'Yes' : 'No',
            item.headLight ? 'Yes' : 'No',
            
            // Lot Numbers & Status
            lotNumbersStr,
            item.status || 'pending'
          ];
        default:
          return Object.values(item);
      }
    });
    
    // Create CSV content
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell || '').replace(/"/g, '""')}"`).join(','))
    ].join('\n');
    
    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${params.formType}_submissions_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    
    // Trigger download
    link.click();
    
    // Clean up
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Function to format endpoint based on form type
  const getApiEndpoint = (formType: string) => {
    switch (formType) {
      case 'contact':
        return '/api/contact-submissions';
      case 'installer-application':
        return '/api/installer-applications';
      case 'warranty-registration':
        return '/api/warranty-registrations';
      default:
        return '';
    }
  };

  // Query to fetch submissions data
  const { data: submissions, isLoading, error } = useQuery({
    queryKey: [getApiEndpoint(params.formType)],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', getApiEndpoint(params.formType));
        return await response.json();
      } catch (err) {
        console.error(`Error fetching ${params.formType} submissions:`, err);
        throw err;
      }
    },
    enabled: !!params.formType
  });

  // Function to get human-readable form name
  const getFormName = (formType: string) => {
    switch (formType) {
      case 'contact':
        return 'Contact Form Submissions';
      case 'installer-application':
        return 'Installer Applications';
      case 'warranty-registration':
        return 'Warranty Registrations';
      default:
        return 'Form Submissions';
    }
  };

  // Function to view submission details
  const viewSubmissionDetails = (id: number) => {
    setLocation(`/erp/admin/webforms/detail/${params.formType}/${id}`);
  };

  // Filter submissions based on search term
  const filteredSubmissions = submissions?.filter((submission: any) => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    
    // Common fields to search in all form types
    const nameMatch = submission.name?.toLowerCase().includes(searchLower);
    const emailMatch = submission.email?.toLowerCase().includes(searchLower);
    
    // Form-specific fields
    if (params.formType === 'contact') {
      return nameMatch || emailMatch || 
        submission.subject?.toLowerCase().includes(searchLower) ||
        submission.message?.toLowerCase().includes(searchLower);
    }
    
    if (params.formType === 'installer-application') {
      return nameMatch || emailMatch || 
        submission.businessName?.toLowerCase().includes(searchLower) ||
        submission.city?.toLowerCase().includes(searchLower) ||
        submission.phone?.includes(searchTerm);
    }
    
    if (params.formType === 'warranty-registration') {
      return nameMatch || emailMatch || 
        submission.warrantyCode?.toLowerCase().includes(searchLower) ||
        submission.productType?.toLowerCase().includes(searchLower) ||
        submission.phone?.includes(searchTerm);
    }
    
    return false;
  });

  // Generate table columns based on form type
  const renderTableColumns = () => {
    switch (params.formType) {
      case 'contact':
        return (
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Subject</TableHead>
            <TableHead>Message</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        );
      
      case 'installer-application':
        return (
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Business</TableHead>
            <TableHead>Contact</TableHead>
            <TableHead>Location</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        );
      
      case 'warranty-registration':
        return (
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Contact</TableHead>
            <TableHead>Product</TableHead>
            <TableHead>Warranty Code</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        );
        
      default:
        return (
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Details</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        );
    }
  };

  // Generate table rows based on form type
  const renderTableRows = () => {
    if (!filteredSubmissions || filteredSubmissions.length === 0) {
      return (
        <TableRow>
          <TableCell colSpan={6} className="text-center py-10">
            No submissions found
          </TableCell>
        </TableRow>
      );
    }

    return filteredSubmissions.map((submission: any) => {
      switch (params.formType) {
        case 'contact':
          return (
            <TableRow 
              key={submission.id} 
              className="cursor-pointer hover:bg-gray-50"
              onClick={() => viewSubmissionDetails(submission.id)}
            >
              <TableCell className="font-medium">
                {format(new Date(submission.createdAt), 'MMM dd, yyyy')}
              </TableCell>
              <TableCell>{submission.name}</TableCell>
              <TableCell>{submission.email}</TableCell>
              <TableCell>{submission.subject}</TableCell>
              <TableCell className="max-w-xs truncate">{submission.message}</TableCell>
              <TableCell className="text-right">
                <Button variant="ghost" size="sm">View</Button>
              </TableCell>
            </TableRow>
          );
        
        case 'installer-application':
          return (
            <TableRow 
              key={submission.id} 
              className="cursor-pointer hover:bg-gray-50"
              onClick={() => viewSubmissionDetails(submission.id)}
            >
              <TableCell className="font-medium">
                {format(new Date(submission.createdAt), 'MMM dd, yyyy')}
              </TableCell>
              <TableCell>{submission.name}</TableCell>
              <TableCell>{submission.businessName}</TableCell>
              <TableCell>
                <div>{submission.email}</div>
                <div className="text-xs text-gray-500">{submission.phone}</div>
              </TableCell>
              <TableCell>{submission.city}</TableCell>
              <TableCell className="text-right">
                <Button variant="ghost" size="sm">View</Button>
              </TableCell>
            </TableRow>
          );
        
        case 'warranty-registration':
          return (
            <TableRow 
              key={submission.id} 
              className="cursor-pointer hover:bg-gray-50"
              onClick={() => viewSubmissionDetails(submission.id)}
            >
              <TableCell className="font-medium">
                {format(new Date(submission.createdAt), 'MMM dd, yyyy')}
              </TableCell>
              <TableCell>{submission.name}</TableCell>
              <TableCell>
                <div>{submission.email}</div>
                <div className="text-xs text-gray-500">{submission.phone}</div>
              </TableCell>
              <TableCell>{submission.productType}</TableCell>
              <TableCell>
                <Badge variant="outline">{submission.warrantyCode}</Badge>
              </TableCell>
              <TableCell className="text-right">
                <Button variant="ghost" size="sm">View</Button>
              </TableCell>
            </TableRow>
          );
          
        default:
          return null;
      }
    });
  };

  return (
    <SidebarLayout activeModule="webforms">
      <div className="p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <Button
              variant="ghost"
              size="sm"
              className="mb-2"
              onClick={() => setLocation('/erp/admin/webforms')}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Forms
            </Button>
            <h1 className="text-2xl font-bold">{getFormName(params.formType)}</h1>
            <p className="text-gray-500 mt-1">
              View and manage all submissions for this form.
            </p>
          </div>
          
          <div className="flex flex-col md:flex-row gap-2 items-end md:items-center">
            {submissions && submissions.length > 0 && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => exportToCSV(filteredSubmissions)} 
                className="mb-2 md:mb-0 mr-2"
              >
                <Download className="mr-2 h-4 w-4" />
                Export to CSV
              </Button>
            )}
            <div className="relative w-full md:w-auto">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <Input
                className="pl-9 w-full md:w-80"
                placeholder="Search submissions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>

        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="py-10 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mx-auto"></div>
                <p className="mt-2 text-gray-500">Loading submissions...</p>
              </div>
            ) : error ? (
              <div className="py-10 text-center text-red-500">
                <p>Error loading submissions. Please try again.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  {renderTableColumns()}
                </TableHeader>
                <TableBody>
                  {renderTableRows()}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </SidebarLayout>
  );
}