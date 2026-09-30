import React from 'react';
import { FiUpload, FiX } from 'react-icons/fi';
import { Spinner } from './Spinner';

/** Document upload tile for KYC (Aadhaar / PAN). */
const DocumentUpload = ({
  label,
  preview,
  uploading = false,
  onUpload,
  onRemove,
  accept = 'image/*,application/pdf',
}) => (
  <div className="space-y-2">
    <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">{label}</p>
    {preview ? (
      <div className="relative group overflow-hidden rounded-xl border border-neutral-200">
        <img src={preview} alt="" className="w-full h-28 object-cover" />
        <div className="absolute inset-0 bg-neutral-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <button
            type="button"
            onClick={onRemove}
            className="bg-error-500 text-white rounded-full p-2 shadow-lg hover:bg-error-600"
            aria-label={`Remove ${label}`}
          >
            <FiX size={16} />
          </button>
        </div>
      </div>
    ) : (
      <div className="relative flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-neutral-200 rounded-xl hover:border-primary-500 hover:bg-primary-50/40 transition-all bg-white">
        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10 rounded-xl">
            <Spinner size="md" />
          </div>
        )}
        <label className="flex flex-col items-center cursor-pointer w-full h-full justify-center">
          <div className="p-2.5 bg-primary-50 text-primary-600 rounded-full mb-1">
            <FiUpload className="w-5 h-5" aria-hidden />
          </div>
          <span className="text-[10px] text-neutral-500 font-bold">Upload</span>
          <input
            type="file"
            className="sr-only"
            accept={accept}
            onChange={onUpload}
            disabled={uploading}
          />
        </label>
      </div>
    )}
  </div>
);

export default DocumentUpload;
