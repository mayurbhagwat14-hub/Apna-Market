import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiMail, FiLock, FiEye, FiEyeOff, FiArrowRight } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import { adminAuthService } from '../../../services/authService';
import { APP_NAME } from '../../../theme/brand';
import { AuthShell, Button, Input } from '../../../components/ui';

const AdminLogin = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: 'admin@admin.com',
    password: 'admin123',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const fillDemoCredentials = () => {
    setFormData({
      email: 'admin@admin.com',
      password: 'admin123',
    });
    toast.success('Demo credentials applied!');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.email || !formData.password) {
      toast.error('Please enter both email and password');
      return;
    }

    setIsLoading(true);
    try {
      const response = await adminAuthService.login(
        formData.email,
        formData.password,
        rememberMe
      );
      if (response.success) {
        if (rememberMe) localStorage.setItem('adminRememberMe', 'true');
        toast.success('Login successful!');
        navigate('/admin/dashboard');
      } else {
        toast.error(response.message || 'Login failed');
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message || 'Login failed. Please check your credentials.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthShell
      title={
        <>
          Admin{' '}
          <span className="bg-gradient-to-r from-primary-500 to-secondary-500 bg-clip-text text-transparent">
            Login
          </span>
        </>
      }
      subtitle={`Access the ${APP_NAME} control panel`}
      showShield={false}
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <Input
          label="Email Address"
          leftIcon={FiMail}
          type="email"
          name="email"
          required
          value={formData.email}
          onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))}
          placeholder="admin@admin.com"
          autoComplete="username"
        />

        <Input
          label="Password"
          leftIcon={FiLock}
          type={showPassword ? 'text' : 'password'}
          name="password"
          required
          value={formData.password}
          onChange={(e) => setFormData((p) => ({ ...p, password: e.target.value }))}
          placeholder="Enter your password"
          autoComplete="current-password"
          rightIcon={showPassword ? FiEyeOff : FiEye}
          onRightIconClick={() => setShowPassword((v) => !v)}
        />

        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            className="w-4 h-4 rounded border-neutral-300 text-primary-500 focus:ring-primary-500"
          />
          <span className="text-sm text-neutral-700">Remember me</span>
        </label>

        <Button
          type="submit"
          variant="primary"
          size="xl"
          fullWidth
          isLoading={isLoading}
          icon={FiArrowRight}
          iconPosition="right"
        >
          Login
        </Button>
      </form>

      <div className="mt-6 p-4 rounded-2xl bg-primary-50 border border-primary-100 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-primary-700 mb-1">Demo credentials</h3>
          <div className="text-xs text-neutral-600 space-y-0.5">
            <p><span className="font-medium text-neutral-800">Email:</span> admin@admin.com</p>
            <p><span className="font-medium text-neutral-800">Password:</span> admin123</p>
          </div>
        </div>
        <button
          type="button"
          onClick={fillDemoCredentials}
          className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-primary-600 hover:bg-primary-700 text-white transition-colors cursor-pointer"
        >
          Auto-fill
        </button>
      </div>
    </AuthShell>
  );
};

export default AdminLogin;
