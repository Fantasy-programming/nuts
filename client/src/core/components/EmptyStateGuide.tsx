import { Button } from "@/core/components/ui/button";
import { useNavigate } from "@tanstack/react-router";
import { type LucideIcon } from "lucide-react";

interface EmptyStateGuideProps {
  Icon: LucideIcon;
  title: string;
  description: string;
  ctaText: string;
  ctaTarget?: string; // Optional route to navigate to
  onCtaClick?: () => void; // Optional custom click handler
}

export function EmptyStateGuide({
  Icon,
  title,
  description,
  ctaText,
  ctaTarget = "/dashboard/accounts",
  onCtaClick
}: EmptyStateGuideProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    if (onCtaClick) {
      onCtaClick();
    } else if (ctaTarget) {
      navigate({ to: ctaTarget });
    }
  };

  return (
    // This is the full-screen overlay
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-background/60 backdrop-blur-xs">
      <div className="flex w-full max-w-[80%] md:max-w-md flex-col items-center rounded-xl border bg-card p-8 text-center shadow-lg">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full border bg-background">
          <Icon className="h-8 w-8 text-primary" />
        </div>
        <h2 className=" text-md md:text-xl font-semibold text-card-foreground">
          {title}
        </h2>
        <p className="mt-2  text-xs md:text-sm text-muted-foreground">
          {description}
        </p>
        <Button onClick={handleClick} className="mt-6">
          {ctaText}
        </Button>
      </div>
    </div>
  );
}
