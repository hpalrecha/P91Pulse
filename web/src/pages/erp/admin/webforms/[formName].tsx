import { useState } from 'react';
import { useParams, useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ArrowLeft, Download, Search, Eye } from 'lucide-react';

// UI Components
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import SidebarLayout from '@/components/layouts/sidebar-layout';
import { ContactSubmission, InstallerApplication, WarrantyRegistration } from '@shared/schema';

// Form configurations for each form type
const formConfigs = {
  'contact-submissions': {
    title: 'Contact Form Submissions',
    description: 'View all inquiries submitted through the contact form',
    queryKey: '/api/contact-submissions',
    headers: ['Date', 'Name', 'Email', 'Subject', 'Message', 'Actions'],
    renderRow: (item: ContactSubmission, navigate: (path: string) => void) => (
      <tr key={item.id} className="hover:bg-gray-50">
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(item.createdAt)}</td>
        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.name}</td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.email}</td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.subject}</td>
        <td className="px-6 py-4 max-w-xs truncate text-sm text-gray-500">{item.message}</td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-primary">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => {
              // Using window.location for more reliable navigation
              window.location.href = `/erp/admin/webforms/entry/contact-submissions/${item.id}`;
            }}
          >
            <Eye className="h-4 w-4 mr-1" />
            View
          </Button>
        </td>
      </tr>
    ),
  },
  'installer-applications': {
    title: 'Installer Applications',
    description: 'View all applications to become an authorized P91 installer',
    queryKey: '/api/installer-applications',
    headers: ['Date', 'Business Name', 'Contact Person', 'Email', 'City', 'Business Type', 'Actions'],
    renderRow: (item: InstallerApplication, navigate: (path: string) => void) => (
      <tr key={item.id} className="hover:bg-gray-50">
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(item.createdAt)}</td>
        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.businessName}</td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.name}</td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.email}</td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.city}</td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.businessType}</td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-primary">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => {
              // Using window.location for more reliable navigation
              window.location.href = `/erp/admin/webforms/entry/installer-applications/${item.id}`;
            }}
          >
            <Eye className="h-4 w-4 mr-1" />
            View
          </Button>
        </td>
      </tr>
    ),
  },
  'warranty-registrations': {
    title: 'Warranty Registrations',
    description: 'View all warranty registrations submitted by customers',
    queryKey: '/api/warranty-registrations',
    headers: ['Date', 'Warranty Code', 'Customer Name', 'Email', 'Phone', 'Product', 'Installer', 'Status', 'Actions'],
    renderRow: (item: WarrantyRegistration, navigate: (path: string) => void) => (
      <tr key={item.id} className="hover:bg-gray-50">
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(item.createdAt)}</td>
        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.warrantyCode}</td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.name}</td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.email}</td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.phone}</td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.productType}</td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.installer}</td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
          <Badge variant="outline" className="bg-green-50 text-green-700 hover:bg-green-50">
            Registered
          </Badge>
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-primary">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => {
              // Using window.location for more reliable navigation
              window.location.href = `/erp/admin/webforms/entry/warranty-registrations/${item.id}`;
            }}
          >
            <Eye className="h-4 w-4 mr-1" />
            View
          </Button>
        </td>
      </tr>
    ),
  },
};

// Format date string
const formatDate = (dateString: string) => {
  try {
    return format(new Date(dateString), 'MMM dd, yyyy');
  } catch (error) {
    return dateString;
  }
};

// Filter function for all data types
const filterData = (data: any[], term: string) => {
  if (!term.trim()) return data;
  
  return data.filter((item) => {
    // Common fields to search in all data types
    const searchFields = ['name', 'email', 'phone', 'businessName', 'message', 'subject', 'warrantyCode', 'productType', 'installer'];
    
    return searchFields.some(field => {
      return item[field] && item[field].toString().toLowerCase().includes(term.toLowerCase());
    });
  });
};

// Export data to CSV
const exportToCSV = (data: any[], filename: string) => {
  if (!data || data.length === 0) return;
  
  // Get headers from the first item
  const headers = Object.keys(data[0]);
  
  // Convert data to CSV format
  const csvRows = [];
  csvRows.push(headers.join(','));
  
  // Add data rows
  for (const row of data) {
    const values = headers.map(header => {
      const value = row[header];
      // Handle values that contain commas, double quotes, or newlines
      const escaped = (value === null || value === undefined) 
        ? '' 
        : String(value).replace(/"/g, '""');
      return `"${escaped}"`;
    });
    csvRows.push(values.join(','));
  }
  
  // Create and download the CSV file
  const csvString = csvRows.join('\n');
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export default function WebformEntries() {
  const params = useParams();
  const formName = params.formName;
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState('');
  
  // Type guard for formName
  const validFormName = formName && formName in formConfigs 
    ? formName as keyof typeof formConfigs 
    : null;
  
  // If form name is invalid, redirect back to webforms index
  if (!validFormName) {
    setTimeout(() => setLocation('/erp/admin/webforms'), 0);
    return (
      <SidebarLayout>
        <div className="p-6">Redirecting to webforms index...</div>
      </SidebarLayout>
    );
  }
  
  const config = formConfigs[validFormName];

  // Fetch data for the current form
  const { data = [], isLoading } = useQuery<any[]>({
    queryKey: [config.queryKey],
  });

  // Filter data based on search term
  const filteredData = filterData(data, searchTerm);

  return (
    <SidebarLayout>
      <div className="p-8">
        <div className="flex items-center mb-6">
          <Button 
            variant="outline"
            onClick={() => setLocation('/erp/admin/webforms')}
            className="mr-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Forms
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{config.title}</h1>
            <p className="text-gray-500">{config.description}</p>
          </div>
        </div>
        
        <div className="flex justify-between items-center mb-4">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              type="search"
              placeholder="Search submissions..."
              className="pl-8 w-[300px]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <Button 
            variant="outline" 
            onClick={() => exportToCSV(data, validFormName)}
          >
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <p className="text-gray-500">Loading submissions...</p>
          </div>
        ) : filteredData.length === 0 ? (
          <div className="text-center p-12 bg-gray-50 rounded-md">
            <p className="text-gray-500">No entries found for this form.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-md border">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  {config.headers.map((header) => (
                    <th key={header} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredData.map((item) => config.renderRow(item, setLocation))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </SidebarLayout>
  );
}