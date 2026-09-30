import React, { useRef, useEffect } from 'react';

/**
 * 6-digit OTP input row with paste + keyboard nav.
 */
const OtpInput = ({ value = ['', '', '', '', '', ''], onChange, disabled = false, autoFocus = true }) => {
  const refs = useRef([]);

  useEffect(() => {
    if (autoFocus) {
      setTimeout(() => refs.current[0]?.focus(), 80);
    }
  }, [autoFocus]);

  const update = (next) => onChange?.(next);

  const handleChange = (index, raw) => {
    if (disabled) return;
    if (raw && !/^\d+$/.test(raw)) return;

    if (raw.length > 1) {
      if (index === 0 && raw.length >= 6) {
        const chars = raw.replace(/\D/g, '').slice(0, 6).split('');
        const next = [...value];
        chars.forEach((c, i) => {
          next[i] = c;
        });
        update(next);
        refs.current[Math.min(chars.length, 5)]?.focus();
      }
      return;
    }

    const next = [...value];
    next[index] = raw;
    update(next);
    if (raw && index < 5) refs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !value[index] && index > 0) {
      refs.current[index - 1]?.focus();
    }
  };

  return (
    <div className="flex justify-center gap-1.5 sm:gap-2.5 py-1 sm:py-2 max-w-full" role="group" aria-label="One-time password">
      {value.map((digit, index) => (
        <input
          key={index}
          ref={(el) => {
            refs.current[index] = el;
          }}
          type="text"
          inputMode="numeric"
          autoComplete={index === 0 ? 'one-time-code' : 'off'}
          maxLength={1}
          value={digit}
          disabled={disabled}
          aria-label={`Digit ${index + 1}`}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          className="w-10 h-12 sm:w-11 sm:h-14 text-center text-base sm:text-xl font-bold rounded-lg sm:rounded-xl border border-neutral-200 bg-neutral-50 text-neutral-900 outline-none transition-colors focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 disabled:opacity-50"
        />
      ))}
    </div>
  );
};

export default OtpInput;
