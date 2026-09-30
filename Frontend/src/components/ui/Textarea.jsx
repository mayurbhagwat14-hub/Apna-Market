import React, { forwardRef, useId } from 'react';

const Textarea = forwardRef(
  (
    {
      label,
      error,
      hint,
      className = '',
      rows = 4,
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

        <textarea
          ref={ref}
          id={inputId}
          rows={rows}
          disabled={disabled}
          aria-invalid={hasError || undefined}
          aria-describedby={describedBy}
          required={required}
          className={[
            'w-full px-4 py-3.5 rounded-[14px] border bg-white outline-none transition-colors',
            'text-[15px] font-medium text-neutral-900 placeholder:text-neutral-400 resize-y min-h-[112px]',
            hasError
              ? 'border-error-500 focus:ring-2 focus:ring-error-500/20'
              : 'border-neutral-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20',
            disabled ? 'opacity-50 bg-neutral-50 cursor-not-allowed' : '',
          ]
            .filter(Boolean)
            .join(' ')}
          {...props}
        />

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

Textarea.displayName = 'Textarea';

export default Textarea;
