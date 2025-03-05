import "ldrs/tailChase";
import { useSpinDelay } from "spin-delay";

// Default values shown
interface SpinnerProps {
  delay?: number;
  minDuration?: number;
}

export function Spinner({ delay = 500, minDuration = 200 }: SpinnerProps) {
  const showSpinner = useSpinDelay(true, {
    delay,
    minDuration,
  });

  if (!showSpinner) {
    return null;
  }

  return (
    <div className="flex h-full w-full items-center justify-center">
      <l-tail-chase size="45" speed="1.5" color="currentColor"></l-tail-chase>
    </div>
  );
}
