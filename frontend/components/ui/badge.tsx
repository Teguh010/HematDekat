type BadgeVariant = "default" | "success" | "warning" | "danger" | "muted";

type BadgeProps = {
  variant?: BadgeVariant;
  className?: string;
  children: React.ReactNode;
};

const variantClasses: Record<BadgeVariant, string> = {
  default: "bg-ink-100 text-ink-700",
  success: "bg-brand-50 text-brand-700",
  warning: "bg-warn-50 text-warn-700",
  danger: "bg-danger-50 text-danger-700",
  muted: "bg-ink-100 text-ink-600",
};

export function Badge({ variant = "default", className = "", children }: BadgeProps) {
  return <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${variantClasses[variant]} ${className}`}>{children}</span>;
}
