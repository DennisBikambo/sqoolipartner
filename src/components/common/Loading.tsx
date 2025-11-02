import { Card, CardContent } from "../ui/card";
import { Loader2 } from "lucide-react";

interface LoadingProps {
  message?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function Loading({
  message = "Loading...",
  className = "",
  size = "md",
}: LoadingProps) {
  const sizeClasses = {
    sm: "min-h-[200px]",
    md: "min-h-[400px]",
    lg: "min-h-[600px]",
  };

  const iconSizes = {
    sm: "h-8 w-8",
    md: "h-12 w-12",
    lg: "h-16 w-16",
  };

  return (
    <div className={`flex items-center justify-center ${sizeClasses[size]} p-6 ${className}`}>
      <Card className="max-w-md w-full border border-muted shadow-sm">
        <CardContent className="pt-12 pb-12 px-8 text-center">
          {/* Animated loader with gradient background */}
          <div className="mb-6 flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-chart-1/20 rounded-full blur-xl animate-pulse" />
              <div className="relative">
                <Loader2 className={`${iconSizes[size]} text-primary animate-spin`} />
              </div>
            </div>
          </div>

          {/* Loading message */}
          <p className="text-muted-foreground text-base">
            {message}
          </p>

          {/* Animated dots */}
          <div className="flex items-center justify-center gap-2 mt-4">
            <span className="h-2 w-2 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]" />
            <span className="h-2 w-2 rounded-full bg-chart-1 animate-bounce [animation-delay:-0.15s]" />
            <span className="h-2 w-2 rounded-full bg-chart-2 animate-bounce" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}