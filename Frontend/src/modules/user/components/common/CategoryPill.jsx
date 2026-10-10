import React from 'react';

const CategoryPill = ({ label, active = false, onClick, count = null }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 active:scale-95 cursor-pointer flex items-center gap-1.5 ${
        active
          ? 'bg-[#016A54] text-white shadow-md shadow-[#016A54]/20 border border-transparent'
          : 'bg-white text-neutral-600 border border-black/[0.04] shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-sm hover:text-neutral-900'
      }`}
    >
      <span>{label}</span>
      {count !== null && (
        <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${active ? 'bg-white/20 text-white' : 'bg-neutral-100 text-neutral-500'}`}>
          {count}
        </span>
      )}
    </button>
  );
};

export default CategoryPill;
