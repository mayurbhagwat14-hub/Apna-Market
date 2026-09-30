import React, { useEffect, useState } from 'react';
import {
  FiPlus, FiEdit2, FiTrash2, FiSave, FiChevronUp, FiChevronDown,
  FiLayers, FiImage, FiFileText, FiDownload, FiArrowLeft
} from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import Modal from '../../../../../components/ui/Modal';
import { categoryService } from '../../../../../services/catalogService';
import { slugifyFormKey } from '../../../../vendor/utils/listingFormConfig';
import FormFieldsEditor from './FormFieldsEditor';

const TYPE_OPTIONS = [
  { value: 'fields', label: 'Custom Fields Form', icon: FiFileText, hint: 'Vendor fills admin-defined fields (one step)' },
  { value: 'menu', label: 'Menu / Packages', icon: FiLayers, hint: 'Multiple items — tiffin types, driver packages' },
  { value: 'photos', label: 'Photos & Docs', icon: FiImage, hint: 'Portfolio photos + optional extra fields' }
];

const ListingFormsManagerModal = ({ isOpen, onClose, category, onSaveSuccess }) => {
  const [forms, setForms] = useState([]);
  const [commonForms, setCommonForms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState('fields');
  const [editingFieldsForm, setEditingFieldsForm] = useState(null);

  useEffect(() => {
    if (!isOpen || !category) {
      setEditingFieldsForm(null);
      return;
    }
    const load = async () => {
      try {
        setLoading(true);
        const res = await categoryService.getFormSchema(category.id || category._id);
        if (res.success) {
          let list = res.listingForms || [];
          setCommonForms((res.commonListingForms || []).filter((f) => f.enabled !== false && f.applyToAll !== false));
          if (!list.length && (res.vendorFormSchema || []).length) {
            list = [{
              id: `seed_${Date.now()}`,
              key: 'service_details',
              title: 'Service Details',
              type: 'fields',
              enabled: true,
              order: 0,
              fields: res.vendorFormSchema
            }];
          }
          setForms(list.sort((a, b) => (a.order || 0) - (b.order || 0)));
        }
      } catch {
        toast.error('Failed to load forms');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [isOpen, category]);

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
      { id: `form_${Date.now()}`, key, title, type: newType, enabled: true, order: prev.length, fields: [] }
    ]);
    setNewTitle('');
    setNewType('fields');
    toast.success(`"${title}" added`);
  };

  const importFromCommon = (commonForm) => {
    if (forms.some((f) => f.key === commonForm.key)) {
      toast.error(`"${commonForm.title}" is already in this category`);
      return;
    }
    setForms((prev) => [
      ...prev,
      {
        id: `import_${commonForm.id}_${Date.now()}`,
        key: commonForm.key,
        title: commonForm.title,
        type: commonForm.type || 'fields',
        enabled: true,
        order: prev.length,
        fields: [...(commonForm.fields || [])],
        commonFormId: commonForm.id,
        source: 'common'
      }
    ]);
    toast.success(`Imported "${commonForm.title}"`);
  };

  const updateForm = (id, patch) => {
    setForms((prev) => prev.map((f) => (f.id === id ? { ...f, ...patch } : f)));
  };

  const removeForm = (id) => {
    if (!window.confirm('Delete this form step?')) return;
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
      const res = await categoryService.updateFormSchema(category.id || category._id, {
        listingForms: forms.map((f, i) => ({ ...f, order: i }))
      });
      if (res.success) {
        toast.success('Listing forms saved');
        if (onSaveSuccess) onSaveSuccess(res.category);
        setEditingFieldsForm(null);
        onClose();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  if (!category) return null;

  const listHeader = (
    <div className="min-w-0 pr-2">
      <h2 className="text-base font-bold text-slate-900 truncate">Listing Forms</h2>
      <p className="text-xs text-slate-500 truncate">{category.title} · each form = one vendor step</p>
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
        <p className="text-xs text-slate-500 truncate">{category.title} · edit step fields</p>
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
            className="px-5 py-2 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl inline-flex items-center gap-2 disabled:opacity-50 transition-colors"
          >
            <FiSave className="w-4 h-4" /> Save All Forms
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
            toast.success('Fields updated — click Save All Forms when done');
          }}
        />
      ) : (
        <div className="space-y-5">
          {commonForms.length > 0 && (
            <div className="rounded-xl bg-indigo-50 border border-indigo-100 p-4 space-y-3">
              <div>
                <p className="text-xs font-bold text-indigo-900 uppercase tracking-wide">Auto-applied common forms</p>
                <p className="text-xs text-indigo-700 mt-1">Vendors already see these on every category.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {commonForms.map((cf) => (
                  <span
                    key={cf.id}
                    className="inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-lg bg-white border border-indigo-200 text-indigo-800"
                  >
                    {cf.title} · {(cf.fields || []).length} fields
                  </span>
                ))}
              </div>
              <div className="pt-2 border-t border-indigo-100">
                <p className="text-[11px] font-bold text-slate-600 uppercase mb-2">Import from common library</p>
                <div className="flex flex-wrap gap-2">
                  {commonForms.map((cf) => (
                    <button
                      key={`import_${cf.id}`}
                      type="button"
                      onClick={() => importFromCommon(cf)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
                    >
                      <FiDownload className="w-3.5 h-3.5" /> {cf.title}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="rounded-xl border border-dashed border-emerald-200 bg-emerald-50/40 p-4 space-y-3">
            <h3 className="text-xs font-bold text-emerald-900 uppercase tracking-wide">Add category form</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="e.g. Service Details, Menu"
                className="px-3 py-2.5 text-sm rounded-xl border border-slate-300 bg-white outline-none focus:ring-2 focus:ring-emerald-500/30"
              />
              <select
                value={newType}
                onChange={(e) => setNewType(e.target.value)}
                className="px-3 py-2.5 text-sm rounded-xl border border-slate-300 bg-white font-medium outline-none focus:ring-2 focus:ring-emerald-500/30"
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
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 transition-colors"
            >
              <FiPlus className="w-4 h-4" /> Add Form
            </button>
          </div>

          {loading ? (
            <p className="text-sm text-slate-500 py-12 text-center">Loading...</p>
          ) : forms.length === 0 ? (
            <div className="text-center py-12 rounded-xl border border-dashed border-slate-200 bg-slate-50/50">
              <p className="text-sm font-semibold text-slate-500">No forms for this category</p>
              <p className="text-xs text-slate-400 mt-1">Add a form or import from common library</p>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                Category steps ({forms.length})
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
                          <span className="text-[10px] font-bold text-slate-400">STEP {index + 1}</span>
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                            <TypeIcon className="w-3 h-3" />
                            {TYPE_OPTIONS.find((t) => t.value === form.type)?.label}
                          </span>
                          {form.source === 'common' && (
                            <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">Imported</span>
                          )}
                          <label className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 ml-auto">
                            <input type="checkbox" checked={form.enabled !== false} onChange={(e) => updateForm(form.id, { enabled: e.target.checked })} className="rounded border-slate-300 text-emerald-600" />
                            Show to vendor
                          </label>
                        </div>

                        <input
                          type="text"
                          value={form.title}
                          onChange={(e) => updateForm(form.id, { title: e.target.value, key: slugifyFormKey(e.target.value) || form.key })}
                          className="w-full px-3 py-2 text-sm font-bold text-slate-900 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-emerald-500/30"
                        />

                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs text-slate-500">
                            {(form.fields || []).length} fields
                            {form.type === 'menu' ? ' · item schema' : ''}
                            {form.type === 'photos' ? ' · + photos' : ''}
                          </span>
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

export default ListingFormsManagerModal;
