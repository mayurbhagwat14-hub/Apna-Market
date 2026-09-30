import React, { forwardRef, useId } from 'react';
import { FiChevronDown } from 'react-icons/fi';

const Select = forwardRef(
  (
    {
      label,
      error,
      hint,
      options = [],
      placeholder = 'Select…',
      className = '',
      id,
      disabled = false,
      required = false,
      ...props
    },
    ref
  ) => {
    const autoId = useId();
    const inputId = id || autoId;
    const describedBy = error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined;
    const hasError = Boolean(error);

    return (
      <div className={`w-full ${className}`}>
        {label && (
          <label htmlFor={inputId} className="block text-[15px] font-medium text-neutral-900 mb-2">
            {label}
            {required && <span className="text-error-500 ml-0.5" aria-hidden>*</span>}
          </label>
        )}

        <div className="relative">
          <select
            ref={ref}
            id={inputId}
            disabled={disabled}
            aria-invalid={hasError || undefined}
            aria-describedby={describedBy}
            required={required}
            className={[
              'w-full h-14 appearance-none px-4 pr-10 rounded-[14px] border bg-white outline-none transition-colors',
              'text-[15px] font-medium text-neutral-900',
              hasError
                ? 'border-error-500 focus:ring-2 focus:ring-error-500/20'
                : 'border-neutral-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20',
              disabled ? 'opacity-50 bg-neutral-50 cursor-not-allowed' : '',
            ]
              .filter(Boolean)
              .join(' ')}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((opt) => {
              const value = typeof opt === 'string' ? opt : opt.value;
              const labelText = typeof opt === 'string' ? opt : opt.label;
              return (
                <option key={value} value={value}>
                  {labelText}
                </option>
              );
            })}
          </select>
          <FiChevronDown
            className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400"
            aria-hidden
          />
        </div>

        {error && (
          <p id={`${inputId}-error`} className="mt-1.5 text-xs font-medium text-error-600" role="alert">
            {error}
          </p>
        )}
        {!error && hint && (
          <p id={`${inputId}-hint`} className="mt-1.5 text-xs text-neutral-500">
            {hint}
          </p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';

export default Select;
