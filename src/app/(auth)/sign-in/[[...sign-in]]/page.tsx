"use client";

import { SignIn } from "@clerk/nextjs";
import { useEffect, useState } from "react";

export default function SignInPage() {
  const [redirectUrl, setRedirectUrl] = useState("/dashboard");

  useEffect(() => {
    const hash = window.location.hash.replace(/^#\/?\??/, "");
    const params = new URLSearchParams(hash);
    const redirect = params.get("redirect");

    if (redirect && redirect.startsWith("/")) {
      setRedirectUrl(redirect);
    }
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-orange-50 to-teal-50 p-4">
      <SignIn fallbackRedirectUrl={redirectUrl} forceRedirectUrl={redirectUrl} />
    </div>
  );
}
