import type { ReactNode } from "react";

const paddingClasses = {
  sm: "p-3",
  md: "p-4",
};

type CardProps = {
  as?: "div" | "section" | "article";
  padding?: keyof typeof paddingClasses;
  className?: string;
  children: ReactNode;
};

export function Card({ as: Tag = "div", padding = "md", className = "", children }: CardProps) {
  return (
    <Tag className={`rounded-xl border border-slate-200 bg-white ${paddingClasses[padding]} ${className}`}>
      {children}
    </Tag>
  );
}
