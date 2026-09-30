import { colors, radius } from '../theme/tokens';

let toast = null;

export const initToast = (toastFunction) => {
  toast = toastFunction;
};

const baseStyle = {
  borderRadius: radius.xl,
  padding: '12px 16px',
  fontSize: '14px',
  fontWeight: '600',
  fontFamily: "'Plus Jakarta Sans', sans-serif",
};

export const showToast = {
  success: (message) => {
    if (!toast) {
      alert(message);
      return;
    }
    toast.success(message, {
      duration: 3000,
      position: 'top-center',
      style: { ...baseStyle, background: colors.success[500], color: '#fff' },
    });
  },

  error: (message) => {
    if (!toast) {
      alert(message);
      return;
    }
    toast.error(message, {
      duration: 4000,
      position: 'top-center',
      style: { ...baseStyle, background: colors.error[500], color: '#fff' },
    });
  },

  info: (message) => {
    if (!toast) {
      alert(message);
      return;
    }
    toast(message, {
      duration: 3000,
      position: 'top-center',
      style: { ...baseStyle, background: colors.info[500], color: '#fff' },
    });
  },

  warning: (message) => {
    if (!toast) {
      alert(message);
      return;
    }
    toast(message, {
      duration: 3500,
      position: 'top-center',
      style: { ...baseStyle, background: colors.warning[500], color: '#fff' },
    });
  },

  loading: (message) => {
    if (!toast) return null;
    return toast.loading(message, {
      position: 'top-center',
      style: { ...baseStyle, background: colors.primary[600], color: '#fff' },
    });
  },

  dismiss: (id) => {
    if (toast?.dismiss) toast.dismiss(id);
  },
};

export default showToast;
