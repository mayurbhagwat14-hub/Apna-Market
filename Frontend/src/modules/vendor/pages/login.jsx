import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { FiPhone, FiArrowRight, FiChevronLeft, FiCheckCircle } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import { z } from 'zod';
import { sendOTP, verifyLogin } from '../services/authService';
import { useBranding } from '../../../context/BrandingContext';
import { APP_NAME } from '../../../theme/brand';
import { AuthShell, Button, Input, OtpInput } from '../../../components/ui';
import { getNetworkAuthMessage } from '../../../utils/authErrors';

const phoneSchema = z.object({
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Please enter a valid 10-digit Indian phone number'),
});

const VendorLogin = () => {
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

  const getAuthErrorMessage = (error, fallback) => getNetworkAuthMessage(error, fallback);

  useEffect(() => {
    if (location.state?.phone) {
      const clean = String(location.state.phone).replace(/\D/g, '').slice(0, 10);
      if (clean.length === 10) setPhoneNumber(clean);
    }
    if (location.state?.fromSignup) {
      toast('Provider account already exists. Sign in with OTP.', { icon: 'ℹ️', duration: 5000 });
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
    const token =
      sessionStorage.getItem('vendorAccessToken') || localStorage.getItem('vendorAccessToken');
    if (token) {
      navigate('/vendor', { replace: true });
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

    const cleanPhone = phoneNumber.replace(/\D/g, '');
    phoneSubmitLock.current = true;
    setIsLoading(true);
    try {
      const response = await sendOTP(cleanPhone, 'login');
      if (response.success) {
        if (response.vendor?.adminApproval?.toLowerCase() === 'pending') {
          toast.error('Your account is currently under review. Please wait for admin approval.', {
            duration: 5000,
          });
          return;
        }
        setOtpToken(response.token || 'verification-pending');
        setOtp(['', '', '', '', '', '']);
        otpSubmitLock.current = false;
        setStep('otp');
        setResendTimer(120);
        toast.success('OTP sent successfully');
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
      const response = await verifyLogin({
        phone: phoneNumber.replace(/\D/g, ''),
        otp: otpValue,
      });

      if (response.success) {
        if (response.isNewUser) {
          toast.success('Phone verified! Please complete registration.');
          navigate('/vendor/signup', {
            state: {
              phone: phoneNumber.replace(/\D/g, ''),
              verificationToken: response.verificationToken,
            },
          });
        } else if (
          response.vendor?.adminApproval === 'PENDING' ||
          response.vendor?.adminApproval === 'pending'
        ) {
          toast.error('Your account is currently under review. Please wait for admin approval.', {
            duration: 5000,
          });
          localStorage.removeItem('vendorAccessToken');
          localStorage.removeItem('vendorRefreshToken');
          localStorage.removeItem('vendorData');
          sessionStorage.removeItem('vendorAccessToken');
          sessionStorage.removeItem('vendorRefreshToken');
          sessionStorage.removeItem('vendorData');
          otpSubmitLock.current = false;
          setIsLoading(false);
        } else {
          toast.success(
            <div className="flex flex-col">
              <span className="font-bold">Welcome Back!</span>
              <span className="text-xs">Successfully logged into your vendor account.</span>
            </div>,
            { icon: <FiCheckCircle className="text-success-500" /> }
          );
          navigate('/vendor', { replace: true });
        }
      } else {
        otpSubmitLock.current = false;
        setIsLoading(false);
        toast.error(response.message || 'Login failed');
      }
    } catch (error) {
      otpSubmitLock.current = false;
      setIsLoading(false);
      toast.error(getAuthErrorMessage(error, 'Verification failed. Please try again.'));
    }
  };

  return (
    <AuthShell
      title={
        step === 'phone' ? (
          <>
            Provider{' '}
            <span className="bg-gradient-to-r from-primary-500 to-secondary-500 bg-clip-text text-transparent">
              Login
            </span>
          </>
        ) : (
          'Verify Identity'
        )
      }
      subtitle={
        step === 'phone'
          ? `Manage your ${name} services and bookings`
          : `We've sent a 6-digit code to ${phoneNumber}`
      }
      showShield={false}
    >
      {step === 'phone' ? (
        <form onSubmit={handlePhoneSubmit} className="space-y-4 sm:space-y-5">
          <Input
            ref={phoneInputRef}
            label="Phone Number"
            leftIcon={FiPhone}
            prefix="+91"
            type="tel"
            inputMode="numeric"
            autoComplete="tel"
            required
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
            placeholder="9876543210"
          />

          <Button
            type="submit"
            variant="primary"
            size="xl"
            fullWidth
            isLoading={isLoading}
            disabled={phoneNumber.length < 10}
            icon={FiArrowRight}
            iconPosition="right"
          >
            Get Started
          </Button>

          <p className="text-center text-sm text-neutral-500">
            Don&apos;t have a provider account?{' '}
            <Link to="/vendor/signup" className="text-primary-500 font-semibold hover:underline">
              Register Now
            </Link>
          </p>
        </form>
      ) : (
        <form onSubmit={handleOtpSubmit} className="space-y-4 sm:space-y-5">
          <OtpInput value={otp} onChange={setOtp} disabled={isLoading} />

          <div className="flex items-center justify-between text-sm">
            <button
              type="button"
              onClick={() => {
                setOtp(['', '', '', '', '', '']);
                setOtpToken('');
                setStep('phone');
                setResendTimer(0);
              }}
              className="flex items-center font-medium text-neutral-500 hover:text-neutral-800"
            >
              <FiChevronLeft className="mr-1" /> Edit number
            </button>
            <button
              type="button"
              disabled={resendTimer > 0}
              onClick={async () => {
                if (resendTimer > 0) return;
                try {
                  const response = await sendOTP(phoneNumber.replace(/\D/g, ''), 'login');
                  if (response.success) {
                    setOtpToken(response.token || 'verification-pending');
                    setResendTimer(120);
                    toast.success('New code sent!');
                  }
                } catch {
                  toast.error('Failed to resend code');
                }
              }}
              className="font-medium text-primary-500 disabled:opacity-50"
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
            Login to Dashboard
          </Button>
        </form>
      )}
    </AuthShell>
  );
};

export default VendorLogin;
