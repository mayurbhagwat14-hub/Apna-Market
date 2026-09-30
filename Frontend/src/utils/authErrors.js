import { toast } from 'react-hot-toast';

export const AUTH_ERROR_CODES = {
  ACCOUNT_EXISTS: 'ACCOUNT_EXISTS',
  VENDOR_PENDING: 'VENDOR_PENDING',
  ACCOUNT_RESTRICTED: 'ACCOUNT_RESTRICTED',
};

export const parseAuthError = (error, fallback = 'Something went wrong. Please try again.') => {
  const data = error?.response?.data;
  return {
    message: data?.message || fallback,
    code: data?.code || null,
    status: error?.response?.status || null,
  };
};

export const isAccountExistsError = (errorOrResponse) => {
  const code = errorOrResponse?.code || errorOrResponse?.response?.data?.code;
  const message = String(
    errorOrResponse?.message || errorOrResponse?.response?.data?.message || ''
  ).toLowerCase();
  return (
    code === AUTH_ERROR_CODES.ACCOUNT_EXISTS ||
    message.includes('already exists') ||
    message.includes('already registered')
  );
};

/**
 * Handle auth API errors — redirect existing users to login instead of signup loop.
 * @returns {boolean} true if handled (caller should stop)
 */
export const handleAuthFlowError = (error, navigate, { panel = 'user', phone = '' } = {}) => {
  const { message, code } = parseAuthError(error);

  if (code === AUTH_ERROR_CODES.VENDOR_PENDING) {
    toast.error(message, { duration: 6000 });
    return true;
  }

  if (code === AUTH_ERROR_CODES.ACCOUNT_RESTRICTED) {
    toast.error(message, { duration: 6000 });
    return true;
  }

  if (code === AUTH_ERROR_CODES.ACCOUNT_EXISTS || isAccountExistsError({ code, message })) {
    const loginPath = panel === 'vendor' ? '/vendor/login' : '/user/login';
    toast.error('This number is already registered. Please sign in.', { duration: 5000 });
    navigate(loginPath, {
      replace: true,
      state: { phone: phone.replace(/\D/g, '').slice(0, 10), fromSignup: true },
    });
    return true;
  }

  toast.error(message);
  return false;
};

export const getNetworkAuthMessage = (error, fallback) => {
  if (error?.code === 'ECONNABORTED') {
    return 'Request timed out. Please check your internet and try again.';
  }
  if (!error?.response) {
    return 'Cannot reach server. Please check your connection and try again.';
  }
  return parseAuthError(error, fallback).message;
};
