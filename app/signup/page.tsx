"use client";

import { useEffect } from "react";
import { signIn } from "next-auth/react";

export default function SignupPage() {
  useEffect(() => {
    signIn("discord", { redirect: true, callbackUrl: "/" });
  }, []);

  return (
    <div className="max-w-md mx-auto px-4 py-16 flex items-center justify-center min-h-screen">
      <div className="text-center">
        <p className="text-slate-400">Wird weitergeleitet...</p>
      </div>
    </div>
  );
}