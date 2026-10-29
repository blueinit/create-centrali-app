import { SignUp } from "@clerk/nextjs";
import { authConfigured } from "@/lib/auth";
import { AuthSetupNotice } from "@/app/AuthSetupNotice";

export default function SignUpPage() {
  if (!authConfigured) return <AuthSetupNotice />;

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
      <SignUp routing="path" path="/sign-up" />
    </div>
  );
}
