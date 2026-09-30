import React from 'react';
import { FiCheck } from 'react-icons/fi';

export const FormInput = ({ label, type = 'text', value, onChange, placeholder, ...props }) => (
  <div>
    {label && (
      <label className="block text-[11px] font-bold text-neutral-600 uppercase tracking-wider mb-1.5">
        {label}
      </label>
    )}
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-medium focus:ring-2 focus:outline-none transition-colors ${
        props.error 
          ? 'border-red-300 focus:ring-red-500 focus:border-red-500 bg-red-50' 
          : 'border-neutral-300 focus:ring-primary-500 focus:border-primary-500 bg-white'
      }`}
      {...props}
    />
    {props.error && (
      <p className="text-[10px] text-red-600 mt-1 font-semibold">{props.error}</p>
    )}
  </div>
);

export const FormTextarea = ({ label, value, onChange, placeholder, rows = 2 }) => (
  <div>
    {label && (
      <label className="block text-[11px] font-bold text-neutral-600 uppercase tracking-wider mb-1.5">
        {label}
      </label>
    )}
    <textarea
      rows={rows}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-xs font-medium focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none resize-none"
    />
  </div>
);

/**
 * Renders one admin-configured vendorFormSchema field.
 */
const DynamicField = ({ field, value, onChange, onToggleMulti }) => {
  const { label, type, options = [], required, helpText } = field;
  const marked = `${label}${required ? ' *' : ''}`;

  switch (type) {
    case 'text':
      return <FormInput label={marked} value={value || ''} onChange={onChange} placeholder={helpText || ''} />;
    case 'number': {
      let error = null;
      if (value !== '' && value !== null && value !== undefined) {
        const numVal = Number(value);
        if (field.minValue !== null && field.minValue !== undefined && numVal < field.minValue) {
          error = `Minimum value is ${field.minValue}`;
        } else if (field.maxValue !== null && field.maxValue !== undefined && numVal > field.maxValue) {
          error = `Maximum value is ${field.maxValue}`;
        }
      }
      return (
        <FormInput 
          label={marked} 
          type="number" 
          value={value || ''} 
          onChange={onChange} 
          placeholder={helpText || ''} 
          min={field.minValue} 
          max={field.maxValue}
          error={error}
        />
      );
    }
    case 'textarea':
      return <FormTextarea label={marked} value={value || ''} onChange={onChange} placeholder={helpText || ''} />;
    case 'date':
      return <FormInput label={marked} type="date" value={value || ''} onChange={onChange} />;
    case 'time':
      return <FormInput label={marked} type="time" value={value || ''} onChange={onChange} />;
    case 'select':
      return (
        <div>
          <label className="block text-[11px] font-bold text-neutral-600 uppercase tracking-wider mb-1.5">{marked}</label>
          {helpText && <p className="text-[10px] text-neutral-400 mb-1.5">{helpText}</p>}
          <select
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 bg-white text-xs font-medium focus:ring-2 focus:ring-primary-500 outline-none"
          >
            <option value="">Select...</option>
            {options.map((o) => (
              <option key={o} value={o}>{o}</option>
            ))}
          </select>
        </div>
      );
    case 'multiselect': {
      const selectedValues = Array.isArray(value) ? value : [];
      return (
        <div>
          <label className="block text-[11px] font-bold text-neutral-600 uppercase tracking-wider mb-1.5">{marked}</label>
          {helpText && <p className="text-[10px] text-neutral-400 mb-1.5">{helpText}</p>}
          <div className="flex flex-wrap gap-1.5">
            {options.map((o) => {
              const sel = selectedValues.includes(o);
              return (
                <button
                  key={o}
                  type="button"
                  onClick={() => onToggleMulti(o)}
                  className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold border transition-all active:scale-95 ${
                    sel
                      ? 'bg-primary-600 text-white border-primary-600'
                      : 'bg-white text-neutral-600 border-neutral-200 hover:border-primary-300'
                  }`}
                >
                  {sel && <FiCheck className="w-3 h-3 inline mr-0.5" />}
                  {o}
                </button>
              );
            })}
          </div>
        </div>
      );
    }
    case 'toggle':
      return (
        <div className="flex items-center justify-between py-2">
          <div>
            <span className="text-xs font-bold text-neutral-700">{label}</span>
            {helpText && <p className="text-[10px] text-neutral-400">{helpText}</p>}
          </div>
          <button
            type="button"
            onClick={() => onChange(!value)}
            className={`w-11 h-6 rounded-full transition-all relative ${value ? 'bg-primary-600' : 'bg-neutral-300'}`}
          >
            <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all shadow-sm ${value ? 'left-[22px]' : 'left-0.5'}`} />
          </button>
        </div>
      );
    case 'file':
      return (
        <div>
          <label className="block text-[11px] font-bold text-neutral-600 uppercase tracking-wider mb-1.5">{marked}</label>
          {helpText && <p className="text-[10px] text-neutral-400 mb-1.5">{helpText}</p>}
          {value && typeof value === 'string' && (
            <p className="text-[10px] text-primary-600 font-medium mb-1.5 truncate">
              {value.startsWith('data:') ? 'File selected' : value}
            </p>
          )}
          <input
            type="file"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              const reader = new FileReader();
              reader.onload = () => onChange(reader.result);
              reader.readAsDataURL(file);
            }}
            className="w-full text-xs file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-primary-50 file:text-primary-700"
          />
        </div>
      );
    default:
      return <FormInput label={marked} value={value || ''} onChange={onChange} />;
  }
};

export const DynamicFormFields = ({ schema = [], values = {}, onChange, onToggleMulti }) => {
  if (!schema.length) {
    return (
      <p className="text-xs text-neutral-500">No extra fields configured for this service yet.</p>
    );
  }

  return (
    <div className="space-y-3">
      {[...schema]
        .sort((a, b) => (a.order || 0) - (b.order || 0))
        .map((field) => (
          <DynamicField
            key={field.key}
            field={field}
            value={values[field.key]}
            onChange={(v) => onChange(field.key, v)}
            onToggleMulti={(v) => onToggleMulti(field.key, v)}
          />
        ))}
    </div>
  );
};

export default DynamicField;
