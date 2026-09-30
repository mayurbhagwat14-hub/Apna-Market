import React, { useEffect, useState } from 'react';
import { FiX, FiEdit2, FiSave } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import { categoryService } from '../../../../../services/catalogService';
import VendorFormBuilderModal from './VendorFormBuilderModal';
import { ADMIN_SCHEMA_OPTIONS } from '../../../../vendor/utils/listingFormConfig';

const ListingFormSetupModal = ({ isOpen, onClose, category, onSaveSuccess }) => {
  const [sectionConfig, setSectionConfig] = useState({});
  const [schemas, setSchemas] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingSchema, setEditingSchema] = useState(null);

  useEffect(() => {
    if (!isOpen || !category) return;
    const load = async () => {
      try {
        setLoading(true);
        const res = await categoryService.getFormSchema(category.id || category._id);
        if (res.success) {
          setSectionConfig(res.listingSectionConfig || {});
          setSchemas({
            vendorFormSchema: res.vendorFormSchema || [],
            catalogItemSchema: res.catalogItemSchema || [],
            pricingFormSchema: res.pricingFormSchema || [],
            availabilityFormSchema: res.availabilityFormSchema || [],
            serviceAreaFormSchema: res.serviceAreaFormSchema || [],
            bookingRulesFormSchema: res.bookingRulesFormSchema || [],
            documentsFormSchema: res.documentsFormSchema || []
          });
        }
      } catch {
        toast.error('Could not load listing form config');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [isOpen, category]);

  const toggleSection = (sectionKey) => {
    setSectionConfig((prev) => ({
      ...prev,
      [sectionKey]: {
        ...(prev[sectionKey] || {}),
        enabled: !(prev[sectionKey]?.enabled !== false)
      }
    }));
  };

  const updateTitle = (sectionKey, title) => {
    setSectionConfig((prev) => ({
      ...prev,
      [sectionKey]: { ...(prev[sectionKey] || {}), title }
    }));
  };

  const handleSaveConfig = async () => {
    try {
      setSaving(true);
      const res = await categoryService.updateFormSchema(category.id || category._id, {
        listingSectionConfig: sectionConfig
      });
      if (res.success) {
        toast.success('Listing sections updated');
        if (onSaveSuccess) onSaveSuccess(res.category);
      }
    } catch {
      toast.error('Failed to save section config');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen || !category) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
            <div>
              <h2 className="text-base font-black text-slate-900">Listing Forms: {category.title}</h2>
              <p className="text-xs text-slate-500">Enable sections and define fields — vendor sees only what you configure here.</p>
            </div>
            <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-200 text-slate-500">
              <FiX className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 overflow-y-auto flex-1 space-y-3">
            {loading ? (
              <p className="text-sm text-slate-500">Loading...</p>
            ) : (
              ADMIN_SCHEMA_OPTIONS.map(({ key, label, section }) => {
                const enabled = sectionConfig[section]?.enabled !== false;
                const fieldCount = (schemas[key] || []).length;
                return (
                  <div key={key} className="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={enabled}
                          onChange={() => toggleSection(section)}
                          className="rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                        />
                        <span className="text-sm font-black text-slate-900">{label}</span>
                        <span className="text-[10px] font-bold text-slate-400">{fieldCount} fields</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => setEditingSchema(key)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary-50 text-primary-700 text-xs font-bold hover:bg-primary-100"
                      >
                        <FiEdit2 className="w-3.5 h-3.5" /> Edit Fields
                      </button>
                    </div>
                    {enabled && (
                      <input
                        type="text"
                        value={sectionConfig[section]?.title || label}
                        onChange={(e) => updateTitle(section, e.target.value)}
                        placeholder="Step title shown to vendor"
                        className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200"
                      />
                    )}
                  </div>
                );
              })
            )}
          </div>

          <div className="px-6 py-4 border-t border-slate-200 flex justify-end gap-2 bg-slate-50">
            <button onClick={onClose} className="px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-lg">Close</button>
            <button
              onClick={handleSaveConfig}
              disabled={saving}
              className="px-4 py-2 text-sm font-black text-white bg-primary-600 hover:bg-primary-700 rounded-lg inline-flex items-center gap-2 disabled:opacity-50"
            >
              <FiSave className="w-4 h-4" /> Save Sections
            </button>
          </div>
        </div>
      </div>

      <VendorFormBuilderModal
        isOpen={Boolean(editingSchema)}
        onClose={() => setEditingSchema(null)}
        category={category}
        targetSchema={editingSchema}
        onSaveSuccess={(updatedCat) => {
          setSchemas((prev) => ({
            ...prev,
            [editingSchema]: updatedCat[editingSchema] || []
          }));
          if (onSaveSuccess) onSaveSuccess(updatedCat);
        }}
      />
    </>
  );
};

export default ListingFormSetupModal;
