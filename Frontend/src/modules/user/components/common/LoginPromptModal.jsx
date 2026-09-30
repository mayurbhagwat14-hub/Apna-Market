import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FiX, FiHeart, FiLock, FiArrowRight } from 'react-icons/fi';

const LoginPromptModal = ({ isOpen, onClose, title = "Create your Apna Market account", message = "Login to save shops, follow businesses and personalize your experience." }) => {
  const navigate = useNavigate();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div 
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm bg-white rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl border border-neutral-100 relative animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-200"
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-neutral-100 text-neutral-400 hover:text-neutral-700 transition-colors cursor-pointer"
          aria-label="Close"
        >
          <FiX className="w-5 h-5" />
        </button>

        {/* Header Icon */}
        <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-[#016A54] flex items-center justify-center mb-4 mx-auto shadow-xs border border-emerald-100">
          <FiHeart className="w-7 h-7 text-[#016A54] fill-emerald-100" />
        </div>

        {/* Title & Description */}
        <div className="text-center space-y-2 mb-6">
          <h3 className="text-lg font-black text-neutral-900 tracking-tight">
            {title}
          </h3>
          <p className="text-xs text-neutral-500 font-medium leading-relaxed px-2">
            {message}
          </p>
        </div>

        {/* Buttons */}
        <div className="space-y-2.5">
          <button
            type="button"
            onClick={() => {
              onClose();
              navigate('/user/login');
            }}
            className="w-full py-3.5 rounded-full bg-[#016A54] hover:bg-[#015443] text-white font-extrabold text-xs tracking-wide shadow-md shadow-[#016A54]/25 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Login / Sign Up</span>
            <FiArrowRight className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={onClose}
            className="w-full py-3 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-bold text-xs active:scale-98 transition-all cursor-pointer"
          >
            Continue Exploring
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginPromptModal;
