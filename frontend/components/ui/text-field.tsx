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
    <div className="space-y-1">
      {label ? (
        <label htmlFor={inputId} className="text-xs font-medium text-slate-700">
          {label}
        </label>
      ) : null}
      <input
        id={inputId}
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy}
        className={`h-9 w-full rounded-lg border bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 focus-visible:border-emerald-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 ${
          error ? "border-red-300 bg-red-50" : "border-slate-300"
        } ${className}`}
        {...inputProps}
      />
      {error ? (
        <p id={`${inputId}-error`} className="text-xs text-red-700">
          {error}
        </p>
      ) : null}
    </div>
  );
}
