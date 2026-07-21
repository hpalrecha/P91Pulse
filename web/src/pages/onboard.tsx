import { useState } from 'react';
import { useRoute } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle2 } from 'lucide-react';

// Public onboarding page — the invitee fills this after a distributor/admin
// sends them the /onboard/:token link. Submits to the public signup endpoint
// which creates a PENDING user for admin/NSM approval.
export default function OnboardPage() {
  const [, params] = useRoute('/onboard/:token');
  const token = params?.token || '';
  const { data: invite, isLoading } = useQuery<any>({
    queryKey: [`/api/erp/invites/${token}`],
    enabled: !!token,
  });

  const [form, setForm] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const set = (k: string) => (e: any) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e: any) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const res = await apiRequest('POST', '/api/erp/onboarding/signup', { ...form, token });
      await res.json();
      setDone(true);
    } catch (err: any) {
      setError((err?.message || 'Something went wrong').replace(/^\d+:\s*/, ''));
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  }
  if (!invite?.valid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <Card className="max-w-md w-full"><CardContent className="py-10 text-center">
          <p className="text-lg font-semibold">Invite not valid</p>
          <p className="text-sm text-muted-foreground mt-2">This invitation link is invalid or has expired. Please ask your distributor or P91 admin for a new one.</p>
        </CardContent></Card>
      </div>
    );
  }
  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <Card className="max-w-md w-full"><CardContent className="py-10 text-center">
          <CheckCircle2 className="h-10 w-10 text-emerald-600 mx-auto mb-3" />
          <p className="text-lg font-semibold">Registration submitted</p>
          <p className="text-sm text-muted-foreground mt-2">Your account is pending approval. You'll be able to log in once an administrator approves it.</p>
        </CardContent></Card>
      </div>
    );
  }

  const role = String(invite.role || '').replace(/_/g, ' ');
  const isInstaller = invite.role === 'installer';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <Card className="max-w-lg w-full">
        <CardHeader>
          <CardTitle>Join P91 Pulse as a <span className="capitalize">{role}</span></CardTitle>
          <p className="text-sm text-muted-foreground">
            {invite.invitedBy ? `Invited by ${invite.invitedBy}. ` : ''}Fill in your details to request access.
          </p>
        </CardHeader>
        <CardContent>
          <form className="space-y-3" onSubmit={submit}>
            <Field label="Full name *"><Input required value={form.name || ''} onChange={set('name')} placeholder="Your name" /></Field>
            <Field label="Mobile number *"><Input required value={form.phone || invite.phone || ''} onChange={set('phone')} placeholder="10-digit mobile number" /></Field>
            <Field label="Email"><Input type="email" value={form.email || invite.email || ''} onChange={set('email')} placeholder="you@example.com (optional)" /></Field>
            <Field label="Password *"><Input required type="password" value={form.password || ''} onChange={set('password')} placeholder="Minimum 6 characters" /></Field>
            {!isInstaller && <Field label="Business / studio name"><Input value={form.businessName || ''} onChange={set('businessName')} placeholder="Your shop name" /></Field>}
            <div className="grid grid-cols-2 gap-3">
              <Field label="State *"><Input required value={form.state || ''} onChange={set('state')} placeholder="e.g. Maharashtra" /></Field>
              <Field label="Pincode"><Input value={form.postalCode || ''} onChange={set('postalCode')} placeholder="6-digit" /></Field>
            </div>
            <Field label="City"><Input value={form.city || ''} onChange={set('city')} placeholder="City" /></Field>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Submit for approval'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm">
      <span className="block text-xs text-muted-foreground mb-1">{label}</span>
      {children}
    </label>
  );
}
