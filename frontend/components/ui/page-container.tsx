import type { ReactNode } from "react";

const sizeClasses = {
  sm: "max-w-xl",
  md: "max-w-2xl",
  lg: "max-w-4xl",
  xl: "max-w-5xl",
} as const;

type PageContainerProps = {
  size?: keyof typeof sizeClasses;
  children: ReactNode;
};

// Page root: centered column with the standard page padding. The layout owns <main>.
export function PageContainer({ size = "xl", children }: PageContainerProps) {
  return <div className={`mx-auto w-full ${sizeClasses[size]} px-4 py-5 sm:px-6`}>{children}</div>;
}
