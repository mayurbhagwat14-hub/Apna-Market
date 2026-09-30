import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiChevronDown, FiLoader, FiSave, FiCheckCircle } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import api from '../../../../services/api';
import { DynamicFormFields } from '../../components/common/DynamicField';

const EditServiceForm = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [openId, setOpenId] = useState(null);
  const [answersByCategory, setAnswersByCategory] = useState({});
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await api.get('/vendors/categories');
        const list = res.data?.categories || [];
        setCategories(list);
        const initial = {};
        list.forEach((cat) => {
          const id = cat.id || cat._id;
          initial[id] = { ...(cat.enrollment?.dynamicAnswers || {}) };
        });
        setAnswersByCategory(initial);
        if (list.length === 1) setOpenId(list[0].id || list[0]._id);
      } catch (err) {
        console.error(err);
        toast.error('Failed to load service form fields');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const updateAnswer = (categoryId, key, value) => {
    setAnswersByCategory((prev) => ({
      ...prev,
      [categoryId]: { ...(prev[categoryId] || {}), [key]: value }
    }));
  };

  const toggleMulti = (categoryId, key, value) => {
    setAnswersByCategory((prev) => {
      const current = Array.isArray(prev[categoryId]?.[key]) ? prev[categoryId][key] : [];
      const updated = current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
      return { ...prev, [categoryId]: { ...(prev[categoryId] || {}), [key]: updated } };
    });
  };

  const handleSave = async (category) => {
    const categoryId = category.id || category._id;
    try {
      setSavingId(categoryId);
      const res = await api.patch(`/vendors/category-enrollment/${categoryId}/answers`, {
        dynamicAnswers: answersByCategory[categoryId] || {}
      });
      if (res.data?.success) {
        toast.success(res.data.message || 'Service form saved');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save answers');
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 pb-24">
      <header className="sticky top-0 z-40 bg-white border-b border-neutral-200 px-4 py-3.5 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/vendor/profile')}
            className="p-1.5 rounded-lg hover:bg-neutral-100 text-neutral-700 active:scale-95"
          >
            <FiArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-base font-black text-neutral-900 tracking-tight">Edit Service Form</h1>
            <p className="text-[10px] text-neutral-400 font-medium">Admin-defined fields for your services</p>
          </div>
        </div>
      </header>

      <main className="p-4 max-w-xl mx-auto space-y-3">
        {loading ? (
          <div className="flex justify-center py-16">
            <FiLoader className="w-6 h-6 text-primary-600 animate-spin" />
          </div>
        ) : categories.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center border border-neutral-200">
            <p className="text-sm font-bold text-neutral-800">No service categories found</p>
            <p className="text-xs text-neutral-500 mt-1">Complete signup or wait for categories to load.</p>
          </div>
        ) : (
          categories.map((cat) => {
            const id = cat.id || cat._id;
            const isOpen = openId === id;
            const schema = cat.vendorFormSchema || [];
            const status = cat.enrollmentStatus || 'not_applied';

            return (
              <div key={id} className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setOpenId(isOpen ? null : id)}
                  className="w-full px-4 py-3.5 flex items-center gap-3 text-left"
                >
                  {cat.iconUrl && (
                    <img src={cat.iconUrl} alt="" className="w-9 h-9 rounded-lg object-contain bg-neutral-50 border border-neutral-100" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-black text-neutral-900 truncate">{cat.title}</p>
                    <p className="text-[10px] text-neutral-400 font-medium">
                      {schema.length} field{schema.length !== 1 ? 's' : ''} · {status.replace('_', ' ')}
                    </p>
                  </div>
                  <FiChevronDown className={`w-4 h-4 text-neutral-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </button>

                {isOpen && (
                  <div className="px-4 pb-4 border-t border-neutral-100 pt-3 space-y-4">
                    {schema.length === 0 ? (
                      <p className="text-xs text-neutral-500">
                        The admin has not configured extra signup fields for this category yet.
                      </p>
                    ) : (
                      <DynamicFormFields
                        schema={schema}
                        values={answersByCategory[id] || {}}
                        onChange={(key, value) => updateAnswer(id, key, value)}
                        onToggleMulti={(key, value) => toggleMulti(id, key, value)}
                      />
                    )}
                    <button
                      type="button"
                      disabled={savingId === id || schema.length === 0}
                      onClick={() => handleSave(cat)}
                      className="w-full py-2.5 rounded-xl bg-primary-600 text-white text-sm font-bold hover:bg-primary-700 disabled:opacity-40 flex items-center justify-center gap-2"
                    >
                      {savingId === id ? <FiLoader className="w-4 h-4 animate-spin" /> : <FiSave className="w-4 h-4" />}
                      {savingId === id ? 'Saving...' : 'Save answers'}
                    </button>
                    <p className="text-[10px] text-neutral-400 flex items-center gap-1">
                      <FiCheckCircle className="w-3 h-3 text-primary-500" />
                      Updates apply immediately and do not take your listing offline.
                    </p>
                  </div>
                )}
              </div>
            );
          })
        )}
      </main>
    </div>
  );
};

export default EditServiceForm;
