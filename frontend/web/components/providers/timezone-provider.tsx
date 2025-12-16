"use client";

import { useEffect } from "react";

export function TimezoneProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Set timezone cookie on client side
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    document.cookie = `timezone=${timezone}; path=/; max-age=31536000; samesite=lax`;
  }, []);

  return <>{children}</>;
}
