import { useState } from "react";
import { Button } from "@/core/components/ui/button";
import { cn } from "@/lib/utils";

const DEFAULT_COLORS = [
  "#ef4444", // red-500
  "#f97316", // orange-500
  "#eab308", // yellow-500
  "#22c55e", // green-500
  "#06b6d4", // cyan-500
  "#3b82f6", // blue-500
  "#8b5cf6", // violet-500
  "#ec4899", // pink-500
  "#f59e0b", // amber-500
  "#10b981", // emerald-500
  "#6366f1", // indigo-500
  "#84cc16", // lime-500
  "#f43f5e", // rose-500
  "#14b8a6", // teal-500
  "#8b5cf6", // purple-500
  "#6b7280", // gray-500
];

interface ColorPickerProps {
  value?: string;
  onChange: (color: string) => void;
  colors?: string[];
  className?: string;
}

export function ColorPicker({ value, onChange, colors = DEFAULT_COLORS, className }: ColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <Button
        type="button"
        variant="outline"
        className={cn("w-full justify-start text-left font-normal", className)}
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-2">
          <div
            className="h-4 w-4 rounded border border-gray-300"
            style={{ backgroundColor: value || "#6b7280" }}
          />
          <span>{value || "Choose a color"}</span>
        </div>
      </Button>
      
      {isOpen && (
        <div className="absolute top-full left-0 z-50 mt-1 w-auto p-3 bg-white border rounded-md shadow-md">
          <div className="grid grid-cols-4 gap-2">
            {colors.map((color) => (
              <button
                key={color}
                type="button"
                className={cn(
                  "h-8 w-8 rounded border-2 border-transparent hover:border-gray-300 focus:border-gray-400 focus:outline-none",
                  value === color && "border-gray-600"
                )}
                style={{ backgroundColor: color }}
                onClick={() => {
                  onChange(color);
                  setIsOpen(false);
                }}
                title={color}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}