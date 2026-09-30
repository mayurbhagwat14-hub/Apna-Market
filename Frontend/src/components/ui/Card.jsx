import React from 'react';

/**
 * Base Card shell — interaction containers only (per design rules).
 */
const Card = ({
  children,
  className = '',
  padding = 'md',
  interactive = false,
  onClick,
  as: Comp = 'div',
  ...props
}) => {
  const paddingClass = {
    none: '',
    sm: 'p-3',
    md: 'p-4 sm:p-5',
    lg: 'p-6',
  }[padding] || 'p-4 sm:p-5';

  return (
    <Comp
      onClick={onClick}
      className={[
        'bg-white border border-neutral-100 rounded-3xl',
        'shadow-[0_4px_12px_-2px_rgba(1, 106, 84,0.08),0_2px_6px_-1px_rgba(1, 106, 84,0.04)]',
        paddingClass,
        interactive || onClick
          ? 'cursor-pointer transition-all duration-200 hover:shadow-md hover:border-primary-100 active:scale-[0.99]'
          : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...props}
    >
      {children}
    </Comp>
  );
};

export default Card;
