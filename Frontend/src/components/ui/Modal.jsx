import React, { useEffect, useId } from 'react';
import { createPortal } from 'react-dom';
import { FiX } from 'react-icons/fi';

const SIZE_CLASSES = {
  sm: 'max-w-md',
  md: 'max-w-xl',
  lg: 'max-w-3xl',
  xl: 'max-w-5xl',
  full: 'max-w-[min(96vw,72rem)]',
};

/**
 * Shared modal — soft depth, rounded-3xl, focus trap basics via Escape + backdrop.
 */
const Modal = ({
  isOpen,
  onClose,
  title,
  header,
  children,
  footer,
  size = 'md',
  className = '',
  contentClassName = 'p-5',
  showClose = true,
  closeOnBackdrop = true,
  zIndex = 9999,
}) => {
  const titleId = useId();

  useEffect(() => {
    if (!isOpen) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    const prevPadding = document.body.style.paddingRight;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = 'hidden';
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
      document.body.style.paddingRight = prevPadding;
    };
  }, [isOpen, onClose]);

  if (!isOpen || typeof document === 'undefined') return null;

  const hasHeader = Boolean(header || title || showClose);

  return createPortal(
    <div
      className="fixed inset-0 flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ zIndex }}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? titleId : undefined}
    >
      <button
        type="button"
        className="absolute inset-0 bg-neutral-950/50 backdrop-blur-[2px] border-0 cursor-default"
        aria-label="Close dialog"
        onClick={closeOnBackdrop ? onClose : undefined}
      />

      <div
        className={[
          'relative z-10 w-full bg-white shadow-2xl flex flex-col max-h-[min(92dvh,900px)]',
          'rounded-t-2xl sm:rounded-2xl border border-neutral-200/80',
          'animate-fade-in',
          SIZE_CLASSES[size] || SIZE_CLASSES.md,
          className,
        ].join(' ')}
        onClick={(e) => e.stopPropagation()}
      >
        {hasHeader && (
          <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-neutral-100 shrink-0 bg-gradient-to-r from-neutral-50 to-white">
            {header || (title ? (
              <h2 id={titleId} className="text-lg font-bold text-neutral-900 truncate">
                {title}
              </h2>
            ) : (
              <span />
            ))}
            {showClose && (
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl text-neutral-500 hover:bg-neutral-100 hover:text-neutral-800 transition-colors shrink-0"
                aria-label="Close"
              >
                <FiX className="w-5 h-5" />
              </button>
            )}
          </div>
        )}

        <div className={['overflow-y-auto flex-1 min-h-0 overscroll-contain', contentClassName].join(' ')}>
          {children}
        </div>

        {footer && (
          <div className="px-5 py-4 border-t border-neutral-100 shrink-0 bg-neutral-50/90">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};

export default Modal;
