import { OtplessLogin } from "@/components/auth/otpless-login";

export default function OtplessLoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-md">
        <OtplessLogin />
      </div>
    </div>
  );
}