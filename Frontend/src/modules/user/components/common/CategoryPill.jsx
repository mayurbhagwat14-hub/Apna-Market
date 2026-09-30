import React from 'react';

const CategoryPill = ({ label, active = false, onClick, count = null }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 active:scale-95 cursor-pointer flex items-center gap-1.5 ${
        active
          ? 'bg-primary-700 text-white shadow-xs'
          : 'bg-white text-neutral-600 border border-neutral-200/80 hover:border-neutral-300 hover:text-neutral-900 shadow-2xs'
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
