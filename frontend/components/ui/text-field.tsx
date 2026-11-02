"use client";

import { useId, type InputHTMLAttributes } from "react";

import { fieldClass } from "./field-styles";

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
        <label htmlFor={inputId} className="text-xs font-medium text-ink-700">
          {label}
        </label>
      ) : null}
      <input
        id={inputId}
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy}
        className={`${fieldClass({ error: Boolean(error) })} ${className}`.trim()}
        {...inputProps}
      />
      {error ? (
        <p id={`${inputId}-error`} className="text-xs text-danger-700">
          {error}
        </p>
      ) : null}
    </div>
  );
}
