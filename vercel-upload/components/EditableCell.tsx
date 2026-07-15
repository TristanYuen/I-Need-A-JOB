import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type EditableCellProps = {
  value?: string;
  onChange: (value: string) => void;
  focusId?: string;
  className?: string;
} & Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "className">;

export function EditableCell({
  value,
  onChange,
  focusId,
  className,
  ...inputProps
}: EditableCellProps) {
  return (
    <div className="h-full w-full" onClick={(event) => event.stopPropagation()}>
      <input
        {...inputProps}
        data-focus-cell={focusId}
        value={value ?? ""}
        onChange={(event) => onChange(event.target.value)}
        className={cn(
          "h-9 w-full rounded-md border border-transparent bg-transparent px-2 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 hover:border-slate-200 hover:bg-white focus:border-indigo-300 focus:bg-white focus:ring-2 focus:ring-indigo-100",
          className
        )}
      />
    </div>
  );
}

