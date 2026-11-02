import type { ReactNode } from "react";

const paddingClasses = {
  sm: "p-3",
  md: "p-4",
  lg: "p-6",
};

type CardProps = {
  as?: "div" | "section" | "article";
  padding?: keyof typeof paddingClasses;
  className?: string;
  children: ReactNode;
};

export function Card({ as: Tag = "div", padding = "md", className = "", children }: CardProps) {
  return (
    <Tag className={`rounded-xl border border-ink-200 bg-surface ${paddingClasses[padding]} ${className}`}>
      {children}
    </Tag>
  );
}
