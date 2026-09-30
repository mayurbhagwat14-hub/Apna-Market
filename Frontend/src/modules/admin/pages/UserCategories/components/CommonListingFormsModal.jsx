import React, { useEffect, useState } from 'react';
import {
  FiPlus, FiEdit2, FiTrash2, FiSave, FiChevronUp, FiChevronDown,
  FiLayers, FiImage, FiFileText, FiGlobe, FiArrowLeft
} from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import Modal from '../../../../../components/ui/Modal';
import { categoryService } from '../../../../../services/catalogService';
import { slugifyFormKey } from '../../../../vendor/utils/listingFormConfig';
import FormFieldsEditor from './FormFieldsEditor';

const TYPE_OPTIONS = [
  { value: 'fields', label: 'Custom Fields Form', icon: FiFileText, hint: 'Same fields for every service category' },
  { value: 'menu', label: 'Menu / Packages', icon: FiLayers, hint: 'Common menu step for all categories' },
  { value: 'photos', label: 'Photos & Docs', icon: FiImage, hint: 'Portfolio upload step for all categories' }
];

const CommonListingFormsModal = ({ isOpen, onClose, onSaveSuccess }) => {
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState('fields');
  const [editingFieldsForm, setEditingFieldsForm] = useState(null);

  useEffect(() => {
    if (!isOpen) {
      setEditingFieldsForm(null);
      return;
    }
    const load = async () => {
      try {
        setLoading(true);
        const res = await categoryService.getCommonListingForms();
        if (res.success) {
          setForms((res.commonListingForms || []).sort((a, b) => (a.order || 0) - (b.order || 0)));
        }
      } catch {
        toast.error('Failed to load common forms');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [isOpen]);

  const handleModalClose = () => {
    if (editingFieldsForm) {
      setEditingFieldsForm(null);
      return;
    }
    onClose();
  };

  const addForm = () => {
    const title = newTitle.trim();
    if (!title) {
      toast.error('Enter a form heading');
      return;
    }
    const key = slugifyFormKey(title);
    if (forms.some((f) => f.key === key)) {
      toast.error('A form with this name already exists');
      return;
    }
    setForms((prev) => [
      ...prev,
      {
        id: `common_${Date.now()}`,
        key,
        title,
        type: newType,
        enabled: true,
        applyToAll: true,
        order: prev.length,
        fields: []
      }
    ]);
    setNewTitle('');
    setNewType('fields');
    toast.success(`"${title}" added — open Edit Fields to add questions`);
  };

  const updateForm = (id, patch) => {
    setForms((prev) => prev.map((f) => (f.id === id ? { ...f, ...patch } : f)));
  };

  const removeForm = (id) => {
    if (!window.confirm('Delete this common form from all categories?')) return;
    setForms((prev) => prev.filter((f) => f.id !== id).map((f, i) => ({ ...f, order: i })));
  };

  const moveForm = (index, dir) => {
    const next = [...forms];
    const j = index + dir;
    if (j < 0 || j >= next.length) return;
    [next[index], next[j]] = [next[j], next[index]];
    setForms(next.map((f, i) => ({ ...f, order: i })));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const res = await categoryService.updateCommonListingForms(forms.map((f, i) => ({ ...f, order: i })));
      if (res.success) {
        toast.success('Common forms saved');
        if (onSaveSuccess) onSaveSuccess(res.commonListingForms);
        setEditingFieldsForm(null);
        onClose();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const listHeader = (
    <div className="min-w-0 pr-2">
      <div className="flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600">
          <FiGlobe className="w-4 h-4" />
        </span>
        <div className="min-w-0">
          <h2 className="text-base font-bold text-slate-900 truncate">Common Listing Forms</h2>
          <p className="text-xs text-slate-500 truncate">One form — all service categories</p>
        </div>
      </div>
    </div>
  );

  const fieldsHeader = (
    <div className="flex items-center gap-3 min-w-0 pr-2">
      <button
        type="button"
        onClick={() => setEditingFieldsForm(null)}
        className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors shrink-0"
        aria-label="Back to forms list"
      >
        <FiArrowLeft className="w-5 h-5" />
      </button>
      <div className="min-w-0">
        <h2 className="text-base font-bold text-slate-900 truncate">{editingFieldsForm?.title}</h2>
        <p className="text-xs text-slate-500 truncate">Edit fields · applies to all categories</p>
      </div>
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleModalClose}
      size="lg"
      header={editingFieldsForm ? fieldsHeader : listHeader}
      showClose={!editingFieldsForm}
      contentClassName="p-5 sm:p-6"
      footer={!editingFieldsForm ? (
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl inline-flex items-center gap-2 disabled:opacity-50 transition-colors"
          >
            <FiSave className="w-4 h-4" /> Save Common Forms
          </button>
        </div>
      ) : null}
    >
      {editingFieldsForm ? (
        <FormFieldsEditor
          key={editingFieldsForm.id}
          formDef={editingFieldsForm}
          saveLabel="Apply Fields"
          onSave={(fields) => {
            updateForm(editingFieldsForm.id, { fields });
            setEditingFieldsForm(null);
            toast.success('Fields updated — click Save Common Forms when done');
          }}
        />
      ) : (
        <div className="space-y-5">
          <div className="rounded-xl bg-indigo-50 border border-indigo-100 px-4 py-3 text-xs text-indigo-900 leading-relaxed">
            Create forms once here — vendors see them on <strong>every</strong> category (Tiffin, Driver, Salon, etc.).
          </div>

          <div className="rounded-xl border border-dashed border-indigo-200 bg-indigo-50/30 p-4 space-y-3">
            <h3 className="text-xs font-bold text-indigo-900 uppercase tracking-wide">Add common form</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Form heading e.g. Business Info"
                className="px-3 py-2.5 text-sm rounded-xl border border-slate-300 bg-white outline-none focus:ring-2 focus:ring-indigo-500/30"
              />
              <select
                value={newType}
                onChange={(e) => setNewType(e.target.value)}
                className="px-3 py-2.5 text-sm rounded-xl border border-slate-300 bg-white font-medium outline-none focus:ring-2 focus:ring-indigo-500/30"
              >
                {TYPE_OPTIONS.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <p className="text-xs text-slate-500">{TYPE_OPTIONS.find((t) => t.value === newType)?.hint}</p>
            <button
              type="button"
              onClick={addForm}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700 transition-colors"
            >
              <FiPlus className="w-4 h-4" /> Add Form
            </button>
          </div>

          {loading ? (
            <p className="text-sm text-slate-500 py-12 text-center">Loading forms...</p>
          ) : forms.length === 0 ? (
            <div className="text-center py-12 rounded-xl border border-dashed border-slate-200 bg-slate-50/50">
              <p className="text-sm font-semibold text-slate-500">No common forms yet</p>
              <p className="text-xs text-slate-400 mt-1">Add your first form above</p>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                {forms.length} form{forms.length !== 1 ? 's' : ''} · shown before category forms
              </p>
              {forms.map((form, index) => {
                const TypeIcon = TYPE_OPTIONS.find((t) => t.value === form.type)?.icon || FiFileText;
                return (
                  <div
                    key={form.id}
                    className={`rounded-xl border p-4 transition-colors ${form.enabled !== false ? 'border-slate-200 bg-white shadow-sm' : 'border-slate-100 bg-slate-50 opacity-60'}`}
                  >
                    <div className="flex gap-3">
                      <div className="flex flex-col gap-0.5 pt-1 shrink-0">
                        <button type="button" onClick={() => moveForm(index, -1)} disabled={index === 0} className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30 rounded">
                          <FiChevronUp className="w-4 h-4" />
                        </button>
                        <button type="button" onClick={() => moveForm(index, 1)} disabled={index === forms.length - 1} className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30 rounded">
                          <FiChevronDown className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="flex-1 min-w-0 space-y-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[10px] font-bold uppercase tracking-wide text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">Common</span>
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                            <TypeIcon className="w-3 h-3" />
                            {TYPE_OPTIONS.find((t) => t.value === form.type)?.label}
                          </span>
                          <label className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 ml-auto">
                            <input type="checkbox" checked={form.enabled !== false} onChange={(e) => updateForm(form.id, { enabled: e.target.checked })} className="rounded border-slate-300 text-indigo-600" />
                            Enabled
                          </label>
                          <label className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600">
                            <input type="checkbox" checked={form.applyToAll !== false} onChange={(e) => updateForm(form.id, { applyToAll: e.target.checked })} className="rounded border-slate-300 text-indigo-600" />
                            All categories
                          </label>
                        </div>

                        <input
                          type="text"
                          value={form.title}
                          onChange={(e) => updateForm(form.id, { title: e.target.value, key: slugifyFormKey(e.target.value) || form.key })}
                          className="w-full px-3 py-2 text-sm font-bold text-slate-900 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500/30"
                        />

                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs text-slate-500">{(form.fields || []).length} fields</span>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => setEditingFieldsForm(form)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-bold hover:bg-indigo-100 transition-colors"
                            >
                              <FiEdit2 className="w-3.5 h-3.5" /> Edit Fields
                            </button>
                            <button type="button" onClick={() => removeForm(form.id)} className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors">
                              <FiTrash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </Modal>
  );
};

export default CommonListingFormsModal;
