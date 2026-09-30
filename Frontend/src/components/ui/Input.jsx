import React, { forwardRef, useId } from 'react';

/**
 * Shared text input — auth-aligned (56px, rounded-[14px], validation states).
 */
const Input = forwardRef(
  (
    {
      label,
      error,
      hint,
      leftIcon: LeftIcon,
      rightIcon: RightIcon,
      onRightIconClick,
      prefix,
      className = '',
      inputClassName = '',
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
          <label
            htmlFor={inputId}
            className="block text-sm sm:text-[15px] font-medium text-neutral-900 mb-2"
          >
            {label}
            {required && <span className="text-error-500 ml-0.5" aria-hidden>*</span>}
          </label>
        )}

        <div
          className={[
            'relative flex items-center h-12 sm:h-14 overflow-hidden bg-white transition-colors',
            'rounded-[14px] border',
            hasError
              ? 'border-error-500 focus-within:ring-2 focus-within:ring-error-500/20'
              : 'border-neutral-200 focus-within:border-primary-500 focus-within:ring-2 focus-within:ring-primary-500/20',
            disabled ? 'opacity-50 bg-neutral-50 cursor-not-allowed' : '',
          ]
            .filter(Boolean)
            .join(' ')}
        >
          {(LeftIcon || prefix) && (
            <div className="flex items-center gap-2 pl-4 pr-3 border-r border-neutral-200 h-full shrink-0 bg-neutral-50/80">
              {LeftIcon && <LeftIcon className="h-[18px] w-[18px] text-primary-500" aria-hidden />}
              {prefix && (
                <span className="text-base font-medium text-neutral-900 whitespace-nowrap">
                  {prefix}
                </span>
              )}
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            disabled={disabled}
            aria-invalid={hasError || undefined}
            aria-describedby={describedBy}
            required={required}
            className={[
              'block w-full h-full px-4 border-none outline-none bg-transparent',
              'text-base font-medium text-neutral-900 placeholder:text-neutral-400',
              'focus:ring-0 disabled:cursor-not-allowed',
              inputClassName,
            ].join(' ')}
            {...props}
          />

          {RightIcon && (
            onRightIconClick ? (
              <button
                type="button"
                onClick={onRightIconClick}
                className="pr-4 shrink-0 text-neutral-400 hover:text-neutral-700"
                aria-label="Toggle visibility"
                tabIndex={-1}
              >
                <RightIcon className="h-[18px] w-[18px]" aria-hidden />
              </button>
            ) : (
              <div className="pr-4 shrink-0">
                <RightIcon className="h-[18px] w-[18px] text-neutral-400" aria-hidden />
              </div>
            )
          )}
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

Input.displayName = 'Input';

export default Input;
