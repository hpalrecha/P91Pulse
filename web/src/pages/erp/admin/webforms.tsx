import { useEffect } from 'react';
import { useLocation } from 'wouter';

// This is a compatibility file that redirects to the new webforms index page
export default function AdminWebForms() {
  const [, setLocation] = useLocation();
  
  useEffect(() => {
    // Redirect to the new webforms index page
    setLocation('/erp/admin/webforms');
  }, [setLocation]);
  
  return null;
}