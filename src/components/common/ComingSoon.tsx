import { Card, CardContent } from "../ui/card";
import { Rocket, Sparkles, Clock } from "lucide-react";

interface ComingSoonProps {
  title?: string;
  description?: string;
  icon?: "rocket" | "sparkles" | "clock";
  className?: string;
}

export function ComingSoon({
  title = "Coming Soon",
  description = "This feature is currently under development. Stay tuned for exciting updates!",
  icon = "rocket",
  className = "",
}: ComingSoonProps) {
  const icons = {
    rocket: Rocket,
    sparkles: Sparkles,
    clock: Clock,
  };

  const Icon = icons[icon];

  return (
    <div className={`flex items-center justify-center min-h-[400px] p-6 ${className}`}>
      <Card className="max-w-md w-full border-2 border-dashed border-muted">
        <CardContent className="pt-12 pb-12 px-8 text-center">
          {/* Icon with gradient background */}
          <div className="mb-6 flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-chart-1/20 rounded-full blur-xl" />
              <div className="relative bg-gradient-to-br from-primary to-chart-1 rounded-full p-4">
                <Icon className="h-12 w-12 text-primary-foreground" />
              </div>
            </div>
          </div>

          {/* Title */}
          <h2 className="text-3xl font-bold text-foreground mb-3 bg-gradient-to-r from-primary to-chart-1 bg-clip-text ">
            {title}
          </h2>

          {/* Description */}
          <p className="text-muted-foreground text-base leading-relaxed mb-6">
            {description}
          </p>

          {/* Animated dots */}
          <div className="flex items-center justify-center gap-2">
            <span className="h-2 w-2 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]" />
            <span className="h-2 w-2 rounded-full bg-chart-1 animate-bounce [animation-delay:-0.15s]" />
            <span className="h-2 w-2 rounded-full bg-chart-2 animate-bounce" />
          </div>

          {/* Optional badge */}
          <div className="mt-8 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-muted text-sm text-muted-foreground">
            <Sparkles className="h-4 w-4" />
            <span>We're working on something amazing</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}