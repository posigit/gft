import React from "react";
import { IconType } from "react-icons";

interface IconWrapperProps {
  icon: IconType;
  size?: number;
  className?: string;
}

// This is a workaround for TypeScript issues with react-icons v5
// The IconType from react-icons is returning ReactNode instead of ReactElement
export const IconWrapper: React.FC<IconWrapperProps> = ({
  icon: Icon,
  size = 20,
  className = "",
}) => {
  // Using createElement instead of JSX to avoid TypeScript errors
  return React.createElement(Icon as any, { size, className });
};
