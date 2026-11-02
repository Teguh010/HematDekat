import Link from "next/link";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";

const baseClasses = [
  "inline-flex items-center justify-center rounded-lg font-medium transition-colors",
  "focus-ring",
  "disabled:pointer-events-none disabled:opacity-50",
].join(" ");

const variantClasses = {
  primary: "bg-brand-600 text-on-brand hover:bg-brand-700",
  secondary: "border border-ink-300 bg-surface text-ink-700 hover:bg-ink-50",
  ghost: "text-ink-600 hover:bg-ink-100 hover:text-ink-900",
};

const sizeClasses = {
  sm: "h-8 px-3 text-sm",
  md: "h-9 px-4 text-sm",
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
