type BadgeVariant = "default" | "success" | "warning" | "muted";

type BadgeProps = {
  variant?: BadgeVariant;
  className?: string;
  children: React.ReactNode;
};

const variantClasses: Record<BadgeVariant, string> = {
  default: "border border-white/10 bg-slate-800 text-slate-200",
  success: "border border-emerald-400/30 bg-emerald-500/10 text-emerald-300",
  warning: "border border-amber-500/30 bg-amber-500/10 text-amber-200",
  muted: "border border-slate-700 bg-slate-700 text-slate-300",
};

export function Badge({ variant = "default", className = "", children }: BadgeProps) {
  return <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.2em] ${variantClasses[variant]} ${className}`}>{children}</span>;
}
