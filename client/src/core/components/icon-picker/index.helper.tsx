import { LucideIcon } from "lucide-react";
import * as LucideIcons from "lucide-react";

/**
 * Returns a Lucide icon component given its name
 * @param name The name of the icon (e.g., "Camera", "ChevronRight")
 * @returns The icon component or undefined if not found
 */
export function getIconByName(name: string): LucideIcon | undefined {
  // Handle edge cases
  if (!name || typeof name !== "string") return undefined;

  // Get the icon component from LucideIcons
  const icon = LucideIcons[name as keyof typeof LucideIcons] as LucideIcon | undefined;

  // Only return if it's a valid icon component
  if (icon && name[0] === name[0].toUpperCase() && name !== "default") {
    return icon;
  }

  return undefined;
}

/**
 * Safely renders a Lucide icon component by name
 * @param name The name of the icon
 * @param props Props to pass to the icon component (className, size, etc.)
 * @returns JSX element or null if icon not found
 */
export function renderIcon(name: string, props?: React.ComponentProps<LucideIcon>) {
  const IconComponent = getIconByName(name);
  return IconComponent ? <IconComponent {...props} /> : null;
}
