import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";

export default function SimplifiedClaimForm() {
  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>Simplified Claim Form</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4">This is a simplified test of the claim form to check routing.</p>
          <div className="flex space-x-4">
            <Button asChild>
              <Link href="/erp/distributor/claims">Back to Claims</Link>
            </Button>
            <Button>Submit Test Claim</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}