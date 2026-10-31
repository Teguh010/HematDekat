import Link from "next/link";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";

const baseClasses = [
  "inline-flex items-center justify-center rounded-full font-semibold transition",
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400",
  "disabled:pointer-events-none disabled:opacity-50",
].join(" ");

const variantClasses = {
  primary: "bg-emerald-500 text-slate-950 hover:bg-emerald-400",
  secondary: "border border-white/10 bg-slate-800 text-slate-200 hover:border-emerald-400",
  ghost: "text-slate-300 hover:text-white",
};

const sizeClasses = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2 text-sm",
};

type SharedProps = {
  variant?: keyof typeof variantClasses;
  size?: keyof typeof sizeClasses;
  className?: string;
  children: ReactNode;
};

type ButtonAsButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  SharedProps & {
    href?: undefined;
  };

type ButtonAsLinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> &
  SharedProps & {
    href: string;
  };

type ButtonProps = ButtonAsButtonProps | ButtonAsLinkProps;

export function Button(props: ButtonProps) {
  const { variant = "primary", size = "md", className = "", children } = props;
  const classes = [baseClasses, variantClasses[variant], sizeClasses[size], className].filter(Boolean).join(" ");

  if ("href" in props && props.href) {
    const { href, ...linkProps } = props;

    return (
      <Link href={href} className={classes} {...linkProps}>
        {children}
      </Link>
    );
  }

  const { type = "button", ...buttonProps } = props as ButtonAsButtonProps;

  return (
    <button type={type} className={classes} {...buttonProps}>
      {children}
    </button>
  );
}
