import { SignIn } from "@clerk/nextjs";

import { AuthShell } from "@/components/auth-shell";
import { clerkAppearance } from "@/lib/clerk-appearance";

export default function SignInPage() {
  return (
    <AuthShell>
      <SignIn
        appearance={clerkAppearance}
        fallbackRedirectUrl="/"
        signUpUrl="/sign-up"
      />
    </AuthShell>
  );
}
