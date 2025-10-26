"use client";

import { usePathname } from "next/navigation";
import { ReactNode } from "react";

export function Pathnames({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isUnauthorized = pathname === "/unauthorized";

  if (isUnauthorized) {
    return null;
  }

  return <>{children}</>;
}