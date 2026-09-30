import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { FiUser, FiMail, FiPhone, FiArrowRight, FiChevronLeft, FiCheckCircle, FiLock } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import { z } from 'zod';
import { userAuthService } from '../../../services/authService';
import { useBranding } from '../../../context/BrandingContext';
import { APP_NAME } from '../../../theme/brand';
import { AuthShell, Button, Input, OtpInput, StepIndicator } from '../../../components/ui';
import {
  handleAuthFlowError,
  getNetworkAuthMessage,
  isAccountExistsError,
  AUTH_ERROR_CODES,
} from '../../../utils/authErrors';

const signupSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Name must be at least 2 characters'),
  email: z
    .string()
    .optional()
    .refine((val) => !val || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim()), 'Invalid email address'),
  phoneNumber: z
    .string()
    .trim()
    .regex(/^[6-9]\d{9}$/, 'Please enter a valid 10-digit Indian phone number'),
});

const Signup = () => {
  const { branding } = useBranding();
  const name = branding?.appName || APP_NAME;
  const navigate = useNavigate();
  const location = useLocation();
  const [step, setStep] = useState('details');
  const [formData, setFormData] = useState({ name: '', email: '', phoneNumber: '' });
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [otpToken, setOtpToken] = useState('');
  const [verificationToken, setVerificationToken] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [fieldErrors, setFieldErrors] = useState({});
  const nameInputRef = useRef(null);
  const otpSubmitLock = useRef(false);
  const detailsSubmitLock = useRef(false);

  const canSubmitDetails = verificationToken
    ? formData.name.trim().length >= 2
    : formData.name.trim().length >= 2 && /^[6-9]\d{9}$/.test(formData.phoneNumber);

  const getAuthErrorMessage = (error, fallback) => getNetworkAuthMessage(error, fallback);

  const redirectToLogin = (phone) => {
    navigate('/user/login', {
      replace: true,
      state: { phone: phone.replace(/\D/g, '').slice(0, 10), fromSignup: true },
    });
  };

  useEffect(() => {
    const token = sessionStorage.getItem('accessToken') || localStorage.getItem('accessToken');
    const userData = sessionStorage.getItem('userData') || localStorage.getItem('userData');
    if (token && userData) {
      navigate('/user', { replace: true });
    }
  }, [navigate]);

  useEffect(() => {
    let interval;
    if (resendTimer > 0) {
      interval = setInterval(() => setResendTimer((p) => p - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  useEffect(() => {
    if (location.state?.phone && location.state?.verificationToken) {
      const cleanPhone = String(location.state.phone).replace(/\D/g, '').slice(0, 10);
      setFormData((prev) => ({ ...prev, phoneNumber: cleanPhone }));
      setVerificationToken(location.state.verificationToken);
    }
  }, [location.state]);

  useEffect(() => {
    if (step === 'details') setTimeout(() => nameInputRef.current?.focus(), 100);
  }, [step]);

  useEffect(() => {
    const otpValue = otp.join('');
    if (otpValue.length === 6 && !isLoading && otpToken && step === 'otp' && !otpSubmitLock.current) {
      handleOtpSubmit();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [otp, otpToken, step]);

  const handleDetailsSubmit = async (e) => {
    e.preventDefault();
    if (detailsSubmitLock.current || isLoading) return;

    setFieldErrors({});

    if (!verificationToken) {
      const validationResult = signupSchema.safeParse({
        name: formData.name.trim(),
        email: formData.email.trim() || undefined,
        phoneNumber: formData.phoneNumber.trim(),
      });

      if (!validationResult.success) {
        const errs = {};
        validationResult.error.errors.forEach((err) => {
          errs[err.path[0]] = err.message;
          toast.error(err.message);
        });
        setFieldErrors(errs);
        return;
      }
    } else if (formData.name.trim().length < 2) {
      toast.error('Please enter a valid name (at least 2 characters)');
      return;
    }

    detailsSubmitLock.current = true;
    setIsLoading(true);

    if (verificationToken) {
      try {
        const response = await userAuthService.register({
          name: formData.name.trim(),
          email: formData.email.trim() || null,
          verificationToken,
        });
        if (response.success) {
          try {
            const { registerFCMToken } = await import('../../../services/pushNotificationService');
            await registerFCMToken('user', true);
          } catch (err) {
            console.error(err);
          }
          toast.success(
            <div className="flex flex-col">
              <span className="font-bold">Welcome to {name}!</span>
              <span className="text-xs">Your account has been created successfully.</span>
            </div>,
            { icon: <FiCheckCircle className="text-success-500" /> }
          );
          navigate('/user', { replace: true });
        } else if (response.code === AUTH_ERROR_CODES.ACCOUNT_EXISTS || isAccountExistsError(response)) {
          redirectToLogin(formData.phoneNumber);
        } else {
          toast.error(response.message || 'Registration failed');
        }
      } catch (error) {
        if (!handleAuthFlowError(error, navigate, { panel: 'user', phone: formData.phoneNumber })) {
          toast.error(getAuthErrorMessage(error, 'Registration failed'));
        }
      } finally {
        detailsSubmitLock.current = false;
        setIsLoading(false);
      }
      return;
    }

    try {
      const response = await userAuthService.sendOTP(
        formData.phoneNumber.trim(),
        formData.email.trim() || null,
        'signup'
      );
      if (response.success) {
        setOtpToken(response.token || 'verification-pending');
        setOtp(['', '', '', '', '', '']);
        otpSubmitLock.current = false;
        setStep('otp');
        setResendTimer(120);
        toast.success('OTP sent successfully');
      } else if (response.code === AUTH_ERROR_CODES.ACCOUNT_EXISTS || isAccountExistsError(response)) {
        redirectToLogin(formData.phoneNumber);
      } else {
        toast.error(response.message || 'Failed to send OTP');
      }
    } catch (error) {
      if (!handleAuthFlowError(error, navigate, { panel: 'user', phone: formData.phoneNumber })) {
        toast.error(getAuthErrorMessage(error, 'Failed to send OTP. Please try again.'));
      }
    } finally {
      detailsSubmitLock.current = false;
      setIsLoading(false);
    }
  };

  const handleOtpSubmit = async (e) => {
    if (e) e.preventDefault();
    if (otpSubmitLock.current || isLoading) return;

    const otpValue = otp.join('');
    if (otpValue.length !== 6) {
      toast.error('Please enter complete OTP');
      return;
    }
    if (!otpToken) {
      toast.error('Please request OTP first');
      return;
    }

    otpSubmitLock.current = true;
    setIsLoading(true);
    try {
      const response = await userAuthService.register({
        name: formData.name.trim(),
        email: formData.email.trim() || null,
        phone: formData.phoneNumber.trim(),
        otp: otpValue,
        token: otpToken,
      });
      if (response.success) {
        try {
          const { registerFCMToken } = await import('../../../services/pushNotificationService');
          await registerFCMToken('user', true);
        } catch (fcmError) {
          console.error('FCM Registration failed on signup:', fcmError);
        }
        toast.success(
          <div className="flex flex-col">
            <span className="font-bold">Welcome to {name}!</span>
            <span className="text-xs">Account created successfully.</span>
          </div>,
          { icon: <FiCheckCircle className="text-success-500" /> }
        );
        navigate('/user', { replace: true });
      } else if (response.code === AUTH_ERROR_CODES.ACCOUNT_EXISTS || isAccountExistsError(response)) {
        redirectToLogin(formData.phoneNumber);
        otpSubmitLock.current = false;
      } else {
        toast.error(response.message || 'Registration failed');
        otpSubmitLock.current = false;
      }
    } catch (error) {
      otpSubmitLock.current = false;
      if (!handleAuthFlowError(error, navigate, { panel: 'user', phone: formData.phoneNumber })) {
        toast.error(getAuthErrorMessage(error, 'Registration failed. Please try again.'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const stepIndex = step === 'details' ? 0 : 1;

  return (
    <AuthShell
      onBack={() => navigate('/user/login')}
      title={step === 'details' ? 'Create Account' : 'Verify Phone'}
      subtitle={
        step === 'details' ? (
          <>
            Join <span className="text-primary-500 font-semibold">{name}</span> to start booking
            services
          </>
        ) : (
          `We've sent a 6-digit code to +91 ${formData.phoneNumber}`
        )
      }
      showShield={false}
    >
      <StepIndicator
        steps={verificationToken ? ['Profile', 'Done'] : ['Profile', 'Verify']}
        current={stepIndex}
        className="mb-4 sm:mb-6"
      />

      {step === 'details' ? (
        <form onSubmit={handleDetailsSubmit} className="space-y-4 sm:space-y-5">
          <Input
            ref={nameInputRef}
            label="Full Name"
            leftIcon={FiUser}
            name="name"
            required
            value={formData.name}
            error={fieldErrors.name}
            onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
            placeholder="Enter your full name"
          />

          <Input
            label="Email"
            hint="Optional"
            leftIcon={FiMail}
            name="email"
            type="email"
            value={formData.email}
            error={fieldErrors.email}
            onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))}
            placeholder="you@example.com"
          />

          {!verificationToken && (
            <Input
              label="Phone Number"
              leftIcon={FiPhone}
              prefix="+91"
              name="phoneNumber"
              type="tel"
              inputMode="numeric"
              autoComplete="tel"
              required
              value={formData.phoneNumber}
              error={fieldErrors.phoneNumber}
              onChange={(e) =>
                setFormData((p) => ({
                  ...p,
                  phoneNumber: e.target.value.replace(/\D/g, '').slice(0, 10),
                }))
              }
              placeholder="9876543210"
            />
          )}

          {verificationToken && formData.phoneNumber && (
            <div className="rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-left">
              <p className="text-xs font-medium text-neutral-500">Verified mobile</p>
              <p className="text-sm font-semibold text-neutral-900 mt-0.5">+91 {formData.phoneNumber}</p>
            </div>
          )}

          <Button
            type="submit"
            variant="primary"
            size="xl"
            fullWidth
            isLoading={isLoading}
            disabled={!canSubmitDetails}
            icon={FiArrowRight}
            iconPosition="right"
          >
            {verificationToken ? 'Complete Registration' : 'Send OTP'}
          </Button>

          <p className="text-center text-xs sm:text-sm text-neutral-500">
            Already have an account?{' '}
            <Link to="/user/login" className="text-primary-500 font-semibold hover:underline">
              Sign in
            </Link>
          </p>

          <div className="bg-primary-50/80 rounded-xl sm:rounded-2xl p-3 sm:p-4 flex items-center gap-3">
            <div className="bg-primary-100 p-2.5 rounded-full shrink-0">
              <FiLock className="h-4 w-4 text-neutral-900" aria-hidden />
            </div>
            <div className="min-w-0">
              <p className="text-sm sm:text-[15px] text-neutral-900 leading-snug">
                Your data is <span className="text-primary-500 font-bold">safe and secure</span> with us.
              </p>
            </div>
          </div>
        </form>
      ) : (
        <form onSubmit={handleOtpSubmit} className="space-y-4 sm:space-y-5">
          <OtpInput value={otp} onChange={setOtp} disabled={isLoading} />

          <div className="flex items-center justify-between gap-2 text-xs sm:text-sm">
            <button
              type="button"
              onClick={() => {
                setOtp(['', '', '', '', '', '']);
                otpSubmitLock.current = false;
                setStep('details');
              }}
              className="flex items-center font-medium text-neutral-500 hover:text-neutral-800 shrink-0"
            >
              <FiChevronLeft className="mr-0.5" /> Edit details
            </button>
            <button
              type="button"
              disabled={isLoading || resendTimer > 0}
              onClick={async () => {
                if (isLoading || resendTimer > 0) return;
                try {
                  setIsLoading(true);
                  const response = await userAuthService.sendOTP(
                    formData.phoneNumber,
                    formData.email || null,
                    'signup'
                  );
                  if (response.success) {
                    setOtpToken(response.token || 'verification-pending');
                    otpSubmitLock.current = false;
                    setResendTimer(120);
                    toast.success('New code sent!');
                  }
                } catch {
                  toast.error('Failed to resend code');
                } finally {
                  setIsLoading(false);
                }
              }}
              className="font-medium text-primary-500 hover:text-primary-700 disabled:opacity-50 text-right"
            >
              {resendTimer > 0
                ? `Resend in ${Math.floor(resendTimer / 60)}:${String(resendTimer % 60).padStart(2, '0')}`
                : 'Resend code'}
            </button>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="xl"
            fullWidth
            isLoading={isLoading}
            disabled={otp.join('').length !== 6}
            icon={FiArrowRight}
            iconPosition="right"
          >
            Create Account
          </Button>
        </form>
      )}
    </AuthShell>
  );
};

export default Signup;
