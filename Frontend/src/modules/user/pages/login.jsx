import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { FiPhone, FiArrowRight, FiCheckCircle, FiChevronLeft, FiUserPlus, FiLock } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import { z } from 'zod';
import { userAuthService } from '../../../services/authService';
import { useBranding } from '../../../context/BrandingContext';
import { APP_NAME } from '../../../theme/brand';
import { AuthShell, Button, Input, OtpInput } from '../../../components/ui';
import { getNetworkAuthMessage } from '../../../utils/authErrors';

const phoneSchema = z.object({
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Please enter a valid 10-digit Indian phone number'),
});

const hasStoredUserSession = () => {
  const token = sessionStorage.getItem('accessToken') || localStorage.getItem('accessToken');
  const userData = sessionStorage.getItem('userData') || localStorage.getItem('userData');
  return Boolean(token && userData);
};

const Login = () => {
  const { branding } = useBranding();
  const name = branding?.appName || APP_NAME;
  const navigate = useNavigate();
  const location = useLocation();
  const [step, setStep] = useState('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [otpToken, setOtpToken] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const phoneInputRef = useRef(null);
  const otpSubmitLock = useRef(false);
  const phoneSubmitLock = useRef(false);

  const canSendOtp = phoneNumber.length === 10;

  const getAuthErrorMessage = (error, fallback) => getNetworkAuthMessage(error, fallback);

  useEffect(() => {
    if (location.state?.phone) {
      const clean = String(location.state.phone).replace(/\D/g, '').slice(0, 10);
      if (clean.length === 10) setPhoneNumber(clean);
    }
    if (location.state?.fromSignup) {
      toast('You already have an account. Sign in with OTP.', { icon: 'ℹ️', duration: 5000 });
      window.history.replaceState({}, '', location.pathname);
    }
  }, [location.state, location.pathname]);

  useEffect(() => {
    let interval;
    if (resendTimer > 0) {
      interval = setInterval(() => setResendTimer((p) => p - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  useEffect(() => {
    if (hasStoredUserSession()) {
      navigate('/user', { replace: true });
      return;
    }
    if (step === 'phone') setTimeout(() => phoneInputRef.current?.focus(), 100);
  }, [step, navigate]);

  useEffect(() => {
    const otpValue = otp.join('');
    if (otpValue.length === 6 && !isLoading && otpToken && step === 'otp' && !otpSubmitLock.current) {
      handleOtpSubmit();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [otp, otpToken, step]);

  const handlePhoneSubmit = async (e) => {
    e.preventDefault();
    if (phoneSubmitLock.current || isLoading) return;

    const validationResult = phoneSchema.safeParse({ phone: phoneNumber });
    if (!validationResult.success) {
      toast.error(validationResult.error.errors[0].message);
      return;
    }

    phoneSubmitLock.current = true;
    setIsLoading(true);
    try {
      const cleanPhone = phoneNumber.replace(/\D/g, '');
      const response = await userAuthService.sendOTP(cleanPhone);
      if (response.success) {
        setOtpToken(response.token || 'verification-pending');
        setOtp(['', '', '', '', '', '']);
        otpSubmitLock.current = false;
        setStep('otp');
        setResendTimer(120);
        toast.success(
          <div className="flex items-center gap-2">
            <FiCheckCircle className="text-success-500" />
            <span>OTP sent successfully!</span>
          </div>
        );
      } else {
        toast.error(response.message || 'Failed to send OTP');
      }
    } catch (error) {
      toast.error(getAuthErrorMessage(error, 'Failed to send OTP. Please try again.'));
    } finally {
      phoneSubmitLock.current = false;
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
      const response = await userAuthService.verifyLogin({
        phone: phoneNumber.replace(/\D/g, ''),
        otp: otpValue,
      });

      if (response.success) {
        if (response.isNewUser) {
          toast.success('Phone verified! Please complete your registration.');
          navigate('/user/signup', {
            state: { phone: phoneNumber, verificationToken: response.verificationToken },
          });
        } else {
          toast.success('Welcome back!');
          navigate('/user', { replace: true });
        }
      } else {
        toast.error(response.message || 'Verification failed');
        otpSubmitLock.current = false;
      }
    } catch (error) {
      otpSubmitLock.current = false;
      toast.error(getAuthErrorMessage(error, 'Verification failed. Please try again.'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthShell
      title={
        step === 'phone' ? (
          <>
            Welcome <span className="text-primary-500">back</span>
          </>
        ) : (
          'Verify Phone'
        )
      }
      subtitle={
        step === 'phone' ? (
          <>
            Sign in to continue your <span className="text-primary-500 font-semibold">{name}</span>{' '}
            experience
          </>
        ) : (
          `We've sent a code to +91 ${phoneNumber}`
        )
      }
      showShield={false}
    >
      {step === 'phone' ? (
        <form className="space-y-4 sm:space-y-5" onSubmit={handlePhoneSubmit}>
          <Input
            ref={phoneInputRef}
            label="Mobile Number"
            leftIcon={FiPhone}
            prefix="+91"
            type="tel"
            inputMode="numeric"
            autoComplete="tel"
            placeholder="Enter your mobile number"
            value={phoneNumber}
            onChange={(e) => {
              const val = e.target.value.replace(/\D/g, '');
              if (val.length <= 10) setPhoneNumber(val);
            }}
          />

          <Button
            type="submit"
            variant="primary"
            size="xl"
            fullWidth
            isLoading={isLoading}
            disabled={!canSendOtp}
            icon={FiArrowRight}
            iconPosition="right"
          >
            Get OTP
          </Button>

          <div className="relative my-1">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-neutral-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-3 bg-white text-neutral-500">
                New to <span className="text-primary-500 font-semibold">{name}</span>?
              </span>
            </div>
          </div>

          <Link to="/user/signup" className="block">
            <Button type="button" variant="outline" size="xl" fullWidth icon={FiUserPlus}>
              Create an account
            </Button>
          </Link>

          <div className="bg-primary-50/80 rounded-xl sm:rounded-2xl p-3 sm:p-4 flex items-center gap-3">
            <div className="bg-primary-100 p-2.5 rounded-full shrink-0">
              <FiLock className="h-4 w-4 text-neutral-900" aria-hidden />
            </div>
            <div className="min-w-0">
              <p className="text-sm sm:text-[15px] text-neutral-900 leading-snug">
                Your data is <span className="text-primary-500 font-bold">safe and secure</span> with us.
              </p>
              <p className="text-xs sm:text-[13px] text-neutral-500 mt-0.5 font-medium">
                We never share your details with anyone.
              </p>
            </div>
          </div>
        </form>
      ) : (
        <form className="space-y-4 sm:space-y-5" onSubmit={handleOtpSubmit}>
          <OtpInput value={otp} onChange={setOtp} disabled={isLoading} />

          <div className="flex items-center justify-between gap-2 text-xs sm:text-sm">
            <button
              type="button"
              onClick={() => {
                setOtp(['', '', '', '', '', '']);
                setOtpToken('');
                otpSubmitLock.current = false;
                setStep('phone');
                setResendTimer(0);
              }}
              className="flex items-center font-medium text-neutral-500 hover:text-neutral-800 shrink-0"
            >
              <FiChevronLeft className="mr-0.5" /> Change
            </button>

            <button
              type="button"
              disabled={isLoading || resendTimer > 0}
              onClick={async () => {
                if (isLoading || resendTimer > 0) return;
                try {
                  setIsLoading(true);
                  const response = await userAuthService.sendOTP(phoneNumber.replace(/\D/g, ''));
                  if (response.success) {
                    setOtpToken(response.token || 'verification-pending');
                    otpSubmitLock.current = false;
                    setResendTimer(120);
                    toast.success('OTP resent!');
                  }
                } catch {
                  toast.error('Error sending OTP');
                } finally {
                  setIsLoading(false);
                }
              }}
              className="font-medium text-primary-500 hover:text-primary-700 disabled:opacity-50 text-right"
            >
              {resendTimer > 0
                ? `Resend ${Math.floor(resendTimer / 60)}:${String(resendTimer % 60).padStart(2, '0')}`
                : 'Resend OTP'}
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
            Verify & Continue
          </Button>
        </form>
      )}
    </AuthShell>
  );
};

export default Login;
