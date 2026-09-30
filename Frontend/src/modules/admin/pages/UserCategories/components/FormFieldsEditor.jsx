import React, { useState } from 'react';
import { FiEdit2, FiTrash2 } from 'react-icons/fi';
import { toast } from 'react-hot-toast';

const FIELD_TYPES = [
  { value: 'text', label: 'Text Input' },
  { value: 'number', label: 'Number Input' },
  { value: 'select', label: 'Single Select Dropdown' },
  { value: 'multiselect', label: 'Multi-Select Buttons' },
  { value: 'textarea', label: 'Text Area' },
  { value: 'toggle', label: 'Toggle Switch (Yes/No)' },
  { value: 'date', label: 'Date Picker' },
  { value: 'time', label: 'Time Picker' },
  { value: 'file', label: 'Document / File Upload' }
];

/**
 * Inline field editor panel — meant to live inside AdminModal, not as a stacked overlay.
 */
const FormFieldsEditor = ({ formDef, onSave, saveLabel = 'Save Fields' }) => {
  const [fields, setFields] = useState(formDef.fields || []);
  const [editingIndex, setEditingIndex] = useState(null);
  const [newField, setNewField] = useState({
    key: '', label: '', type: 'text', optionsText: '', required: false, helpText: '', minValue: '', maxValue: ''
  });

  const resetDraft = () => {
    setNewField({ key: '', label: '', type: 'text', optionsText: '', required: false, helpText: '', minValue: '', maxValue: '' });
    setEditingIndex(null);
  };

  const handleAdd = () => {
    if (!newField.label.trim()) {
      toast.error('Enter field label');
      return;
    }
    const key = newField.key.trim() || newField.label.trim().toLowerCase().replace(/[^a-z0-9]+/g, '');
    const options = (newField.type === 'select' || newField.type === 'multiselect')
      ? newField.optionsText.split(',').map((s) => s.trim()).filter(Boolean)
      : [];
    const fieldObj = {
      key,
      label: newField.label.trim(),
      type: newField.type,
      options,
      required: Boolean(newField.required),
      helpText: newField.helpText.trim() || null,
      minValue: newField.type === 'number' && newField.minValue !== '' ? Number(newField.minValue) : null,
      maxValue: newField.type === 'number' && newField.maxValue !== '' ? Number(newField.maxValue) : null,
      order: editingIndex !== null ? fields[editingIndex]?.order || editingIndex + 1 : fields.length + 1
    };
    if (editingIndex !== null) {
      const updated = [...fields];
      updated[editingIndex] = fieldObj;
      setFields(updated);
    } else {
      setFields([...fields, fieldObj]);
    }
    resetDraft();
  };

  return (
    <div className="flex flex-col h-full min-h-[320px]">
      <div className="flex-1 space-y-4">
        <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4 space-y-3">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
            {editingIndex !== null ? 'Edit field' : 'Add new field'}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              type="text"
              value={newField.label}
              onChange={(e) => setNewField((p) => ({ ...p, label: e.target.value }))}
              placeholder="Field label *"
              className="px-3 py-2.5 text-sm rounded-xl border border-slate-300 bg-white outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400"
            />
            <select
              value={newField.type}
              onChange={(e) => setNewField((p) => ({ ...p, type: e.target.value }))}
              className="px-3 py-2.5 text-sm rounded-xl border border-slate-300 bg-white font-medium outline-none focus:ring-2 focus:ring-indigo-500/30"
            >
              {FIELD_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          {(newField.type === 'select' || newField.type === 'multiselect') && (
            <input
              type="text"
              value={newField.optionsText}
              onChange={(e) => setNewField((p) => ({ ...p, optionsText: e.target.value }))}
              placeholder="Options: Veg, Non-Veg, Jain"
              className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-300 bg-white outline-none focus:ring-2 focus:ring-indigo-500/30"
            />
          )}
          <label className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600">
            <input
              type="checkbox"
              checked={newField.required}
              onChange={(e) => setNewField((p) => ({ ...p, required: e.target.checked }))}
              className="rounded border-slate-300 text-indigo-600"
            />
            Required field
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleAdd}
              className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700 transition-colors"
            >
              {editingIndex !== null ? 'Update Field' : 'Add Field'}
            </button>
            {editingIndex !== null && (
              <button
                type="button"
                onClick={resetDraft}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
            Fields ({fields.length})
          </p>
          {fields.map((f, i) => (
            <div
              key={`${f.key}_${i}`}
              className="flex items-center justify-between gap-3 p-3.5 rounded-xl border border-slate-100 bg-white shadow-sm"
            >
              <div className="min-w-0">
                <p className="text-sm font-bold text-slate-800 truncate">
                  {f.label}{f.required ? ' *' : ''}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">{f.type} · {f.key}</p>
              </div>
              <div className="flex gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setNewField({
                      key: f.key,
                      label: f.label,
                      type: f.type,
                      optionsText: (f.options || []).join(', '),
                      required: f.required || false,
                      helpText: f.helpText || '',
                      minValue: f.minValue ?? '',
                      maxValue: f.maxValue ?? ''
                    });
                    setEditingIndex(i);
                  }}
                  className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                  title="Edit"
                >
                  <FiEdit2 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFields(fields.filter((_, idx) => idx !== i));
                    if (editingIndex === i) resetDraft();
                  }}
                  className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                  title="Delete"
                >
                  <FiTrash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
          {fields.length === 0 && (
            <div className="text-center py-10 rounded-xl border border-dashed border-slate-200 bg-slate-50/50">
              <p className="text-sm text-slate-500">No fields yet</p>
              <p className="text-xs text-slate-400 mt-1">Add questions vendors will answer on this step</p>
            </div>
          )}
        </div>
      </div>

      <div className="pt-4 mt-4 border-t border-slate-100">
        <button
          type="button"
          onClick={() => onSave(fields)}
          className="w-full py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700 transition-colors"
        >
          {saveLabel}
        </button>
      </div>
    </div>
  );
};

export default FormFieldsEditor;
