"use client";

import { useId, type InputHTMLAttributes } from "react";

type TextFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: React.ReactNode;
  error?: string;
};

export function TextField({ label, id, error, className = "", ...inputProps }: TextFieldProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const describedBy = [error ? `${inputId}-error` : undefined, inputProps["aria-describedby"]].filter(Boolean).join(" ") || undefined;

  return (
    <div className="space-y-2">
      {label ? (
        <label htmlFor={inputId} className="text-sm font-medium text-slate-200">
          {label}
        </label>
      ) : null}
      <input
        id={inputId}
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy}
        className={`w-full rounded-xl border bg-slate-800 px-3 py-2.5 text-sm text-white placeholder:text-slate-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400 ${
          error ? "border-red-500/30 bg-red-500/5" : "border-white/10"
        } ${className}`}
        {...inputProps}
      />
      {error ? (
        <p id={`${inputId}-error`} className="text-sm text-red-200">
          {error}
        </p>
      ) : null}
    </div>
  );
}
