import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiUser, FiMail, FiPhone, FiCamera, FiImage, FiX } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { userAuthService } from '../../../../services/authService';
import { Button, Input, Loader } from '../../../../components/ui';
import { gradients, themeColors } from '../../../../theme';
import flutterBridge from '../../../../utils/flutterBridge';

import { z } from "zod";

// Zod schema
const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address").refine(val => val.includes('@'), "Invalid email address"),
});

const UpdateProfile = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    profilePhoto: '', // URL
  });
  const [photoPreview, setPhotoPreview] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isFlutter, setIsFlutter] = useState(flutterBridge.isFlutter);
  const [showSourceSheet, setShowSourceSheet] = useState(false);

  // Sync flutter bridge state
  useEffect(() => {
    flutterBridge.waitForFlutter().then(ready => {
      setIsFlutter(ready);
    });
  }, []);

  const handleNativeCamera = async () => {
    try {
      const file = await flutterBridge.openCamera();
      if (file) {
        setPhotoFile(file);
        setPhotoPreview(URL.createObjectURL(file));
        flutterBridge.hapticFeedback('success');
      }
    } catch (error) {
      console.error('Native camera failed:', error);
    }
  };

  const handleImageClick = () => {
    setShowSourceSheet(true);
  };

  // Fetch user profile on component mount
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        // First check localStorage
        const storedUserData = localStorage.getItem('userData');
        if (storedUserData) {
          const userData = JSON.parse(storedUserData);
          setFormData({
            name: userData.name || '',
            email: userData.email || '',
            phone: userData.phone || '',
            profilePhoto: userData.profilePhoto || '',
          });
        }

        // Fetch fresh data from API
        const response = await userAuthService.getProfile();
        if (response.success && response.user) {
          const user = response.user;
          setFormData({
            name: user.name || '',
            email: user.email || '',
            phone: user.phone || '',
            profilePhoto: user.profilePhoto || '',
          });

          // Update localStorage with fresh data including photo
          if (storedUserData) {
            const updatedLocal = { ...JSON.parse(storedUserData), ...user };
            localStorage.setItem('userData', JSON.stringify(updatedLocal));
          }
        }
      } catch (error) {
        // Use localStorage data if API fails
        const storedUserData = localStorage.getItem('userData');
        if (storedUserData) {
          const userData = JSON.parse(storedUserData);
          setFormData({
            name: userData.name || '',
            email: userData.email || '',
            phone: userData.phone || '',
            profilePhoto: userData.profilePhoto || '',
          });
        } else {
          toast.error('Failed to load profile data');
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, []);

  // Upload file helper
  const uploadFile = async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    let baseUrl = import.meta.env.VITE_API_BASE_URL || '';
    if (!baseUrl) {
      if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        baseUrl = 'http://localhost:5000';
      } else {
        baseUrl = window.location.origin;
      }
    }
    baseUrl = baseUrl.replace(/\/api$/, '');
    const response = await fetch(`${baseUrl}/api/image/upload`, {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();
    if (!data.success) throw new Error(data.message || 'Upload failed');
    return data.imageUrl;
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size should be less than 5MB');
        return;
      }
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  // Format phone number for display
  const formatPhoneNumber = (phone) => {
    if (!phone) return '';
    if (phone.startsWith('+91')) return phone;
    if (phone.length === 10) return `+91 ${phone}`;
    return phone;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async () => {
    // Zod Validation
    const validationResult = profileSchema.safeParse({
      name: formData.name.trim(),
      email: formData.email.trim()
    });

    if (!validationResult.success) {
      toast.error(validationResult.error.errors[0].message);
      return;
    }

    setIsSaving(true);
    setUploading(true);
    try {
      const response = await userAuthService.updateProfile({
        name: formData.name.trim(),
        email: formData.email.trim() || null,
      });

      if (response.success) {
        toast.success('Profile updated successfully!');
        // authService.updateProfile already updates localStorage with response.user
        // but let's ensure we have the latest data
        if (response.user) {
          const storedUserData = localStorage.getItem('userData');
          if (storedUserData) {
            const existingData = JSON.parse(storedUserData);
            const updatedData = { ...existingData, ...response.user };
            localStorage.setItem('userData', JSON.stringify(updatedData));
          } else {
            localStorage.setItem('userData', JSON.stringify(response.user));
          }
        }
        navigate('/user/account');
      } else {
        toast.error(response.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Profile update error:', error);
      toast.error(error.response?.data?.message || 'Failed to update profile. Please try again.');
    } finally {
      setIsSaving(false);
      setUploading(false);
    }
  };

  const handleBack = () => {
    navigate('/user/account');
  };

  return (
    <div className="min-h-screen bg-[#FBFBFA] pb-24 w-full max-w-lg mx-auto shadow-xs relative font-sans text-neutral-900">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-[#F0F2F1] px-4 py-3.5">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleBack}
            className="w-9 h-9 rounded-full bg-[#F5F7F6] flex items-center justify-center text-neutral-800 hover:bg-[#EAEFEA] active:scale-95 transition-all"
            aria-label="Back"
          >
            <FiArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-bold text-neutral-900">Update Profile</h1>
        </div>
      </header>

      <main className="px-4 py-5">
        {/* Profile Form */}
        <div className="space-y-4">
          {/* User Profile Avatar Display (No Photo Upload) */}
          <div className="flex flex-col items-center justify-center mb-6">
            <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-[#ADE2D7]/50 shadow-md bg-[#EDF8F5] flex items-center justify-center text-[#016A54]">
              {formData.name ? (
                <span className="text-3xl font-black">{formData.name.charAt(0).toUpperCase()}</span>
              ) : (
                <FiUser className="w-10 h-10 text-[#016A54]" />
              )}
            </div>
            <p className="text-neutral-400 text-xs mt-2 font-medium">User Profile</p>
          </div>

          {/* Full Name */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Full Name
            </label>
            <div className="relative">
              <div
                className="absolute left-3 top-1/2 transform -translate-y-1/2"
                style={{ color: themeColors.button }}
              >
                <FiUser className="w-5 h-5" />
              </div>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                disabled={isLoading}
                className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:border-transparent transition-all"
                style={{
                  focusRingColor: themeColors.button,
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = themeColors.button;
                  e.target.style.boxShadow = '0 0 0 3px rgba(1, 106, 84, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#d1d5db';
                  e.target.style.boxShadow = 'none';
                }}
                placeholder="Enter your full name"
              />
            </div>
          </div>

          {/* Email Address */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Email Address
            </label>
            <div className="relative">
              <div
                className="absolute left-3 top-1/2 transform -translate-y-1/2"
                style={{ color: themeColors.button }}
              >
                <FiMail className="w-5 h-5" />
              </div>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                disabled={isLoading}
                className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:border-transparent transition-all"
                onFocus={(e) => {
                  e.target.style.borderColor = themeColors.button;
                  e.target.style.boxShadow = '0 0 0 3px rgba(1, 106, 84, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#d1d5db';
                  e.target.style.boxShadow = 'none';
                }}
                placeholder="Enter your email address"
              />
            </div>
          </div>

          {/* Phone Number */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Phone Number
            </label>
            <div className="relative">
              <div
                className="absolute left-3 top-1/2 transform -translate-y-1/2"
                style={{ color: themeColors.button }}
              >
                <FiPhone className="w-5 h-5" />
              </div>
              <input
                type="tel"
                name="phone"
                value={formatPhoneNumber(formData.phone)}
                disabled
                className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-300 bg-gray-50 text-gray-600 cursor-not-allowed"
                placeholder="Phone number cannot be changed"
              />
              <p className="text-xs text-gray-500 mt-1 ml-1">
                Phone number cannot be changed for security reasons
              </p>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="mt-6">
          <Button
            type="button"
            fullWidth
            variant="primary"
            onClick={handleSave}
            disabled={isLoading || isSaving}
            isLoading={isSaving}
          >
            Save changes
          </Button>
        </div>
      </main>


    </div>
  );
};

export default UpdateProfile;

