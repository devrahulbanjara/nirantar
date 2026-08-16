import { SignUp } from "@clerk/nextjs";

import { AuthShell } from "@/components/auth-shell";
import { clerkAppearance } from "@/lib/clerk-appearance";

export default function SignUpPage() {
  return (
    <AuthShell>
      <SignUp
        appearance={clerkAppearance}
        fallbackRedirectUrl="/"
        signInUrl="/sign-in"
      />
    </AuthShell>
  );
}
