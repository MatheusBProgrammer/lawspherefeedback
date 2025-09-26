"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";

interface RedirectButtonProps {
  url: string;
  children: React.ReactNode;
  className?: string;
  countdownSeconds?: number;
}

export function RedirectButton({
  url,
  children,
  className = "",
  countdownSeconds = 30,
}: RedirectButtonProps) {
  const [timeLeft, setTimeLeft] = useState(countdownSeconds);
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    if (timeLeft <= 0) {
      setIsRedirecting(true);
      window.location.href = url;
      return;
    }

    const timer = setTimeout(() => {
      setTimeLeft(timeLeft - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [timeLeft, url]);

  const handleClick = () => {
    setIsRedirecting(true);
    window.location.href = url;
  };

  // Calculate the stroke-dasharray for the circular progress
  const circumference = 2 * Math.PI * 45; // radius = 45
  const strokeDasharray = circumference;
  const strokeDashoffset =
    circumference - (timeLeft / countdownSeconds) * circumference;

  return (
    <div className="relative inline-block w-full max-w-sm mx-auto">
      <Button
        onClick={handleClick}
        disabled={isRedirecting}
        className={`relative overflow-hidden w-full min-h-[44px] ${className}`}
        size="default"
      >
        <div className="flex items-center justify-center gap-1 sm:gap-2">
          <ExternalLink className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
          <span className="text-xs sm:text-base font-medium">{children}</span>
          {!isRedirecting && (
            <span className="text-xs font-medium flex-shrink-0 bg-white/20 px-1 py-0.5 rounded">
              {timeLeft}s
            </span>
          )}
        </div>
      </Button>

      {/* Circular Progress Ring */}
      <div className="absolute inset-0 pointer-events-none">
        <svg
          className="w-full h-full transform -rotate-90"
          viewBox="0 0 100 100"
        >
          <circle
            cx="50"
            cy="50"
            r="45"
            stroke="currentColor"
            strokeWidth="2"
            fill="none"
            className="text-white/20"
          />
          <circle
            cx="50"
            cy="50"
            r="45"
            stroke="currentColor"
            strokeWidth="2"
            fill="none"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            className="text-white transition-all duration-1000 ease-linear"
            style={{
              strokeLinecap: "round",
            }}
          />
        </svg>
      </div>
    </div>
  );
}
