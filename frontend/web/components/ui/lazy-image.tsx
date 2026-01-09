"use client";

import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { ImageOff } from "lucide-react";

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  containerClassName?: string;
  fallbackIcon?: React.ReactNode;
}

export function LazyImage({
  src,
  alt,
  className,
  containerClassName,
  fallbackIcon,
}: LazyImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  // Reset state when src changes and check if image is already loaded
  useEffect(() => {
    const img = imgRef.current;
    if (!img) return;

    // If the image is already complete (cached), mark as loaded
    if (img.complete && img.naturalWidth > 0) {
      setIsLoading(false);
      setHasError(false);
    } else if (img.complete && img.naturalWidth === 0) {
      // Image failed to load
      setIsLoading(false);
      setHasError(true);
    } else {
      // Image is still loading
      setIsLoading(true);
      setHasError(false);
    }
  }, [src]);

  if (hasError) {
    return (
      <div
        className={cn(
          "flex items-center justify-center bg-muted",
          containerClassName
        )}
      >
        {fallbackIcon || (
          <ImageOff className="h-8 w-8 text-muted-foreground/50" />
        )}
      </div>
    );
  }

  return (
    <div className={cn("relative overflow-hidden", containerClassName)}>
      {/* Skeleton shimmer effect */}
      {isLoading && (
        <div className="absolute inset-0 z-10 overflow-hidden bg-muted">
          <div className="absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent via-white/40 dark:via-white/10 to-transparent" />
        </div>
      )}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        className={cn(
          "transition-opacity duration-300",
          isLoading ? "opacity-0" : "opacity-100",
          className
        )}
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setIsLoading(false);
          setHasError(true);
        }}
      />
    </div>
  );
}
