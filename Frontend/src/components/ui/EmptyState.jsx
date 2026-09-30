import React from 'react';
import { FiInbox, FiSearch, FiAlertCircle, FiCalendar, FiWifi } from 'react-icons/fi';
import Button from './Button';

const ICONS = {
  inbox: FiInbox,
  search: FiSearch,
  alert: FiAlertCircle,
  calendar: FiCalendar,
  offline: FiWifi,
};

const EmptyState = ({
  icon = 'inbox',
  title = 'Nothing here yet',
  message = 'There is no data to display at the moment.',
  actionLabel,
  onAction,
  className = '',
}) => {
  const Icon = typeof icon === 'string' ? ICONS[icon] || FiInbox : icon;

  return (
    <div
      className={`w-full py-12 px-4 flex flex-col items-center justify-center text-center ${className}`}
    >
      <div className="w-20 h-20 rounded-full flex items-center justify-center mb-4 bg-primary-50">
        <Icon className="w-10 h-10 text-primary-500" aria-hidden />
      </div>
      <h3 className="text-lg font-bold text-neutral-900 mb-2">{title}</h3>
      <p className="text-sm text-neutral-500 mb-6 max-w-sm">{message}</p>
      {actionLabel && onAction && (
        <Button variant="primary" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
};

export default EmptyState;
