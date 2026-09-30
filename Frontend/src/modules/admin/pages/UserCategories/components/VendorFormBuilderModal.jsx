import React, { useState, useEffect } from 'react';
import { FiPlus, FiTrash2, FiSave, FiSliders, FiEdit2 } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import Modal from '../../../../../components/ui/Modal';
import { categoryService } from '../../../../../services/catalogService';

const FIELD_TYPES = [
  { value: 'text', label: 'Text Input' },
  { value: 'number', label: 'Number Input' },
  { value: 'select', label: 'Single Select Dropdown' },
  { value: 'multiselect', label: 'Multi-Select Buttons' },
  { value: 'textarea', label: 'Text Area' },
  { value: 'toggle', label: 'Toggle Switch (Yes/No)' },
  { value: 'date', label: 'Date Picker' },
  { value: 'time', label: 'Time Picker' },
  { value: 'file', label: 'Document / File Upload' },
];

const SCHEMA_META = {
  vendorFormSchema: {
    title: 'Service Details Form',
    description: 'Profile & category-specific fields vendors fill when creating a listing (e.g. license, experience).'
  },
  catalogItemSchema: {
    title: 'Menu Item Form',
    description: 'Fields for each menu/sub-service item (e.g. tiffin type, driver day/night rate).'
  },
  pricingFormSchema: {
    title: 'Pricing Form',
    description: 'Custom pricing fields for this category (replaces fixed pricing step).'
  },
  availabilityFormSchema: {
    title: 'Availability Form',
    description: 'When the vendor is available — fully admin-defined fields.'
  },
  serviceAreaFormSchema: {
    title: 'Service Area Form',
    description: 'City, pincodes, radius — define fields admin needs.'
  },
  bookingRulesFormSchema: {
    title: 'Booking Rules Form',
    description: 'Cancellation, advance booking, etc. as admin-defined fields.'
  },
  documentsFormSchema: {
    title: 'Documents Form',
    description: 'Extra document/certificate fields plus portfolio photos step.'
  }
};

const VendorFormBuilderModal = ({ isOpen, onClose, category, onSaveSuccess, targetSchema = 'vendorFormSchema' }) => {
  const meta = SCHEMA_META[targetSchema] || SCHEMA_META.vendorFormSchema;
  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // New field form state
  const [newField, setNewField] = useState({
    key: '',
    label: '',
    type: 'text',
    optionsText: '',
    required: false,
    helpText: '',
    minValue: '',
    maxValue: '',
  });

  const [editingIndex, setEditingIndex] = useState(null);

  useEffect(() => {
    if (category && isOpen) {
      loadCategorySchema();
    }
  }, [category, isOpen]);

  const loadCategorySchema = async () => {
    try {
      setLoading(true);
      const res = await categoryService.getFormSchema(category.id || category._id);
      const targetArray = res[targetSchema];
      const fallbackArray = category[targetSchema];
      
      if (res.success && targetArray) {
        setFields(targetArray);
      } else {
        setFields(fallbackArray || []);
      }
    } catch (err) {
      console.error(`Error loading ${targetSchema}:`, err);
      const fallbackArray = category[targetSchema];
      setFields(fallbackArray || []);
    } finally {
      setLoading(false);
    }
  };

  const handleAddField = () => {
    if (!newField.label.trim()) {
      toast.error('Please enter a field label');
      return;
    }

    const key = newField.key.trim() || newField.label.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    const options = (newField.type === 'select' || newField.type === 'multiselect')
      ? newField.optionsText.split(',').map(s => s.trim()).filter(Boolean)
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
      order: fields.length + 1
    };

    if (editingIndex !== null) {
      const updated = [...fields];
      updated[editingIndex] = fieldObj;
      setFields(updated);
      setEditingIndex(null);
      toast.success('Field updated locally');
    } else {
      setFields([...fields, fieldObj]);
      toast.success('Field added locally');
    }

    setNewField({ key: '', label: '', type: 'text', optionsText: '', required: false, helpText: '', minValue: '', maxValue: '' });
  };

  const handleEditField = (index) => {
    const f = fields[index];
    setNewField({
      key: f.key,
      label: f.label,
      type: f.type,
      optionsText: (f.options || []).join(', '),
      required: f.required || false,
      helpText: f.helpText || '',
      minValue: f.minValue !== null && f.minValue !== undefined ? f.minValue : '',
      maxValue: f.maxValue !== null && f.maxValue !== undefined ? f.maxValue : '',
    });
    setEditingIndex(index);
  };

  const handleDeleteField = (index) => {
    setFields(fields.filter((_, i) => i !== index));
    if (editingIndex === index) setEditingIndex(null);
  };

  const handleSaveSchema = async () => {
    try {
      setSaving(true);
      const payload = {};
      payload[targetSchema] = fields;
      
      const res = await categoryService.updateFormSchema(category.id || category._id, payload);

      if (res.success) {
        toast.success(`Schema for "${category.title}" updated successfully!`);
        if (onSaveSuccess) onSaveSuccess(res.category);
        onClose();
      }
    } catch (err) {
      console.error('Save vendor schema error:', err);
      toast.error(err.response?.data?.message || 'Failed to save form schema');
    } finally {
      setSaving(false);
    }
  };

  if (!category) return null;

  const modalHeader = (
    <div className="flex items-center gap-2 min-w-0 pr-2">
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-100 text-primary-600 shrink-0">
        <FiSliders className="w-4 h-4" />
      </span>
      <div className="min-w-0">
        <h2 className="text-base font-bold text-slate-900 truncate">{meta.title}: {category.title}</h2>
        <p className="text-xs text-slate-500 truncate">{meta.description}</p>
      </div>
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      header={modalHeader}
      contentClassName="p-5 sm:p-6"
      footer={
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl">Cancel</button>
          <button onClick={handleSaveSchema} disabled={saving} className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl inline-flex items-center gap-2 disabled:opacity-50">
            <FiSave className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Schema'}
          </button>
        </div>
      }
    >
      <div className="space-y-6">
          {/* Add / Edit Form Card */}
          <div className="bg-primary-50/50 p-4 rounded-xl border border-primary-100 space-y-3">
            <h3 className="text-xs font-black text-blue-900 uppercase tracking-wider">
              {editingIndex !== null ? 'Edit Field' : 'Add New Custom Field'}
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Field Label *</label>
                <input type="text" value={newField.label} onChange={e => setNewField(p => ({ ...p, label: e.target.value }))}
                  placeholder="e.g. License Number, Driving Experience" className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white outline-none focus:ring-2 focus:ring-primary-400" />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Field Key (System ID)</label>
                <input type="text" value={newField.key} onChange={e => setNewField(p => ({ ...p, key: e.target.value }))}
                  placeholder="Auto-generated if blank" className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white outline-none focus:ring-2 focus:ring-primary-400" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Input Type</label>
                <select value={newField.type} onChange={e => setNewField(p => ({ ...p, type: e.target.value }))}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white outline-none focus:ring-2 focus:ring-primary-400 font-semibold">
                  {FIELD_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Help Text / Hint</label>
                <input type="text" value={newField.helpText} onChange={e => setNewField(p => ({ ...p, helpText: e.target.value }))}
                  placeholder="e.g. 12 digits without spaces" className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white outline-none focus:ring-2 focus:ring-primary-400" />
              </div>
            </div>

            {newField.type === 'number' && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Min Value (Optional)</label>
                  <input type="number" value={newField.minValue} onChange={e => setNewField(p => ({ ...p, minValue: e.target.value }))}
                    placeholder="e.g. 100" className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white outline-none focus:ring-2 focus:ring-primary-400" />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Max Value (Optional)</label>
                  <input type="number" value={newField.maxValue} onChange={e => setNewField(p => ({ ...p, maxValue: e.target.value }))}
                    placeholder="e.g. 5000" className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white outline-none focus:ring-2 focus:ring-primary-400" />
                </div>
              </div>
            )}

            {(newField.type === 'select' || newField.type === 'multiselect') && (
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Options (Comma separated)</label>
                <input type="text" value={newField.optionsText} onChange={e => setNewField(p => ({ ...p, optionsText: e.target.value }))}
                  placeholder="Option 1, Option 2, Option 3" className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white outline-none focus:ring-2 focus:ring-primary-400" />
              </div>
            )}

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                <input type="checkbox" checked={newField.required} onChange={e => setNewField(p => ({ ...p, required: e.target.checked }))} className="w-4 h-4 text-primary-500 rounded" />
                <span>Is Required Field?</span>
              </label>

              <div className="flex items-center gap-2">
                {editingIndex !== null && (
                  <button type="button" onClick={() => { setEditingIndex(null); setNewField({ key: '', label: '', type: 'text', optionsText: '', required: false, helpText: '', minValue: '', maxValue: '' }); }}
                    className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-lg">Cancel</button>
                )}
                <button type="button" onClick={handleAddField} className="px-4 py-1.5 bg-primary-500 text-white text-xs font-bold rounded-lg flex items-center gap-1 hover:bg-primary-600">
                  <FiPlus /> {editingIndex !== null ? 'Update Field' : 'Add Field'}
                </button>
              </div>
            </div>
          </div>

          {/* List of Existing Fields */}
          <div>
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider mb-2">Current Form Fields ({fields.length})</h3>
            {loading ? (
              <p className="text-xs text-slate-400 py-4 text-center">Loading schema...</p>
            ) : fields.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center border border-dashed rounded-xl">No custom fields added yet for this category.</p>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {fields.map((f, i) => (
                  <div key={f.key || i} className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between gap-3 hover:border-primary-200 transition-colors">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-slate-900">{f.label}</span>
                        {f.required && <span className="text-[9px] font-bold bg-red-100 text-red-700 px-1.5 py-0.5 rounded">Required</span>}
                        <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded uppercase">{f.type}</span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-0.5">Key: <code className="text-slate-600">{f.key}</code> 
                      {f.options?.length > 0 && ` • Options: ${f.options.join(', ')}`}
                      {(f.minValue !== null && f.minValue !== undefined) && ` • Min: ${f.minValue}`}
                      {(f.maxValue !== null && f.maxValue !== undefined) && ` • Max: ${f.maxValue}`}
                      </p>
                    </div>

                    <div className="flex items-center gap-1">
                      <button onClick={() => handleEditField(i)} className="p-1.5 text-primary-500 hover:bg-primary-50 rounded-lg"><FiEdit2 className="w-3.5 h-3.5" /></button>
                      <button onClick={() => handleDeleteField(i)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"><FiTrash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
      </div>
    </Modal>
  );
};

export default VendorFormBuilderModal;
