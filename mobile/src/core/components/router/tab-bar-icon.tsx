import React, { type ElementType } from "react";

import { Icon } from "@/core/components/ui/icon";

const TabBarIcon = ({
  icon,
  size = "md",
  className,
  color,
}: {
  icon: ElementType;
  size?: "md" | "sm" | "lg" | "xl" | "2xs" | "xs";
  className?: string;
  color?: string;
}) => {
  return <Icon as={icon} size={size} className={className} color={color} />;
};

export default TabBarIcon;
