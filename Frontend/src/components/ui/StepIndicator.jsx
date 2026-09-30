import React from 'react';
import { FiCheck } from 'react-icons/fi';

/**
 * Horizontal step indicator for multi-step auth / KYC.
 * @param {string[]} steps - labels
 * @param {number} current - 0-based index
 */
const StepIndicator = ({ steps = [], current = 0, className = '' }) => {
  if (!steps.length) return null;

  return (
    <div className={`w-full ${className}`}>
      <ol className="flex items-center justify-between gap-1">
        {steps.map((label, i) => {
          const done = i < current;
          const active = i === current;
          return (
            <li key={label} className="flex-1 flex flex-col items-center gap-1.5 min-w-0">
              <div className="flex items-center w-full">
                {i > 0 && (
                  <div
                    className={`h-0.5 flex-1 rounded-full ${done || active ? 'bg-primary-500' : 'bg-neutral-200'}`}
                  />
                )}
                <div
                  className={[
                    'w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-[11px] sm:text-xs font-bold shrink-0 border-2 transition-colors',
                    done
                      ? 'bg-primary-500 border-primary-500 text-white'
                      : active
                        ? 'bg-white border-primary-500 text-primary-600'
                        : 'bg-white border-neutral-200 text-neutral-400',
                  ].join(' ')}
                  aria-current={active ? 'step' : undefined}
                >
                  {done ? <FiCheck className="w-4 h-4" strokeWidth={3} /> : i + 1}
                </div>
                {i < steps.length - 1 && (
                  <div
                    className={`h-0.5 flex-1 rounded-full ${done ? 'bg-primary-500' : 'bg-neutral-200'}`}
                  />
                )}
              </div>
              <span
                className={`text-[10px] sm:text-xs font-semibold truncate max-w-full px-0.5 ${
                  active || done ? 'text-primary-600' : 'text-neutral-400'
                }`}
              >
                {label}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
};

export default StepIndicator;
