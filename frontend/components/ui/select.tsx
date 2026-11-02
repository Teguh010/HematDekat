import type { SelectHTMLAttributes } from "react";

import { fieldClass, type FieldSize } from "./field-styles";

type SelectProps = Omit<SelectHTMLAttributes<HTMLSelectElement>, "size"> & {
  error?: boolean;
  fieldSize?: Exclude<FieldSize, "area">;
  width?: "full" | "auto";
};

export function Select({ error, fieldSize = "md", width = "full", className = "", ...selectProps }: SelectProps) {
  return <select className={`${fieldClass({ error, size: fieldSize, width })} ${className}`.trim()} {...selectProps} />;
}
