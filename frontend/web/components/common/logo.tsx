"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import Image from "next/image";

interface LogoProps {
  className?: string;
  width?: number;
  height?: number;
  showName?: boolean;
}

export function Logo({
  className,
  width = 120,
  height = 40,
  showName = true,
}: LogoProps) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch by only rendering after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // Return a placeholder with the same dimensions to avoid layout shift
    return (
      <div
        style={{ width: showName ? width + 80 : width, height }}
        className={className}
      />
    );
  }

  const logoSrc =
    resolvedTheme === "dark"
      ? "/dark-theme-logo.svg"
      : "/light-theme-logo.svg";

  return (
    <div className={`flex items-center gap-2 ${className || ""}`}>
      <Image
        src={logoSrc}
        alt="HandFull"
        width={width}
        height={height}
        priority
      />
      {showName && (
        <span className="text-xl font-bold tracking-tight">HandFull</span>
      )}
    </div>
  );
}
