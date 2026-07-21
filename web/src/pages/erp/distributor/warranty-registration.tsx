import { useLocation } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import WarrantyRegistrationForm from '@/components/warranty/WarrantyRegistrationForm';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function DistributorWarrantyRegistrationPage() {
  const [, setLocation] = useLocation();

  // Handle successful form submission
  const handleSuccess = () => {
    setLocation('/erp/distributor/warranties');
  };

  // Go back to warranty dashboard
  const handleBackToDashboard = () => {
    setLocation('/erp/distributor/warranties');
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center mb-8">
        <Button 
          variant="ghost" 
          className="mr-4" 
          onClick={handleBackToDashboard}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Warranty Dashboard
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Register New Warranty</CardTitle>
          <CardDescription>
            Complete the form below to register a new warranty for your customer
          </CardDescription>
        </CardHeader>
        <CardContent>
          <WarrantyRegistrationForm 
            userRole="distributor" 
            onSuccess={handleSuccess}
          />
        </CardContent>
      </Card>
    </div>
  );
}