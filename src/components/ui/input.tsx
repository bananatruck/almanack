import { type InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, className = "", id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-[var(--text-secondary)]"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`
            w-full px-3 py-2.5 rounded-[var(--radius-md)]
            bg-[var(--bg-tertiary)] border
            text-[var(--text-primary)] text-sm
            placeholder:text-[var(--text-muted)]
            transition-all duration-150 ease-out
            focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] focus:border-transparent
            ${
              error
                ? "border-[var(--color-error)] focus:ring-[var(--color-error)]"
                : "border-[var(--border-primary)] hover:border-[var(--text-tertiary)]"
            }
            ${className}
          `}
          {...props}
        />
        {error && (
          <p className="text-xs text-[var(--color-error)]">{error}</p>
        )}
        {helperText && !error && (
          <p className="text-xs text-[var(--text-tertiary)]">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export default Input;
