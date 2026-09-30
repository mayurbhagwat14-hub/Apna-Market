import React from 'react';
import { FiCheck, FiStar, FiShield } from 'react-icons/fi';
import { bookingStatusColors, colors } from '../../theme';

const SIZE = {
  sm: 'text-[10px] px-2 py-0.5 gap-1',
  md: 'text-xs px-2.5 py-1 gap-1',
  lg: 'text-sm px-3 py-1.5 gap-1.5',
};

const VARIANT = {
  neutral: 'bg-neutral-100 text-neutral-600',
  primary: 'bg-primary-50 text-primary-700',
  success: 'bg-success-50 text-success-700',
  warning: 'bg-warning-50 text-warning-700',
  error: 'bg-error-50 text-error-700',
  info: 'bg-info-50 text-info-700',
};

const STATUS_LABELS = {
  searching: 'Searching',
  requested: 'Requested',
  awaiting_payment: 'Awaiting Payment',
  pending: 'Pending',
  confirmed: 'Confirmed',
  accepted: 'Accepted',
  assigned: 'Assigned',
  journey_started: 'On the way',
  visited: 'Visited',
  in_progress: 'In Progress',
  work_done: 'Work Done',
  completed: 'Completed',
  cancelled: 'Cancelled',
  rejected: 'Rejected',
};

/**
 * Badge — verified, rating, booking-status, semantic pills.
 */
const Badge = ({
  children,
  variant = 'neutral',
  status,
  size = 'md',
  className = '',
  ...props
}) => {
  const sizeClass = SIZE[size] || SIZE.md;

  if (variant === 'verified') {
    return (
      <span
        className={`inline-flex items-center font-bold rounded-full bg-success-50 text-success-700 ${sizeClass} ${className}`}
        {...props}
      >
        <FiShield className="w-3 h-3" aria-hidden />
        {children || 'Verified'}
      </span>
    );
  }

  if (variant === 'rating') {
    return (
      <span
        className={`inline-flex items-center font-bold rounded-full bg-warning-50 text-warning-700 ${sizeClass} ${className}`}
        {...props}
      >
        <FiStar className="w-3 h-3 fill-current" aria-hidden />
        {children}
      </span>
    );
  }

  if (variant === 'status' || status) {
    const key = String(status || children || '')
      .toLowerCase()
      .replace(/\s+/g, '_');
    const tone = bookingStatusColors[key] || {
      bg: colors.neutral[100],
      text: colors.neutral[600],
    };
    const label = STATUS_LABELS[key] || children || status;

    return (
      <span
        className={`inline-flex items-center font-bold rounded-full ${sizeClass} ${className}`}
        style={{ backgroundColor: tone.bg, color: tone.text }}
        {...props}
      >
        {label}
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center font-bold rounded-full ${VARIANT[variant] || VARIANT.neutral} ${sizeClass} ${className}`}
      {...props}
    >
      {variant === 'success' && !children ? <FiCheck className="w-3 h-3" /> : null}
      {children}
    </span>
  );
};

export default Badge;
