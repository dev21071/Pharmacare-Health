import React, { useState, useMemo, useEffect } from 'react';
import {
  Search,
  Pill,
  ShieldAlert,
  X,
  BellPlus,
  Info,
  ChevronRight,
  Plus,
  Trash2,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { MedicineItem, AppLanguage } from '../../types';
import { SEED_MEDICINES } from '../../data/seedData';
import { getTranslation } from '../../i18n/translations';
import { api } from '../../services/api';

interface MedicinesScreenProps {
  lang: AppLanguage;
  onSelectForReminder: (medicine: { name: string; generic: string; dosage: string }) => void;
  onRegisterBackHandler?: (handler: () => boolean) => () => void;
  showToast: (type: 'success' | 'info' | 'error' | 'warning', title: string, message: string) => void;
}

export const MedicinesScreen: React.FC<MedicinesScreenProps> = ({
  lang,
  onSelectForReminder,
  onRegisterBackHandler,
  showToast,
}) => {
  const [medicines, setMedicines] = useState<MedicineItem[]>(SEED_MEDICINES);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedMedicine, setSelectedMedicine] = useState<MedicineItem | null>(null);

  // Add Medicine Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [newName, setNewName] = useState('');
  const [newGenericName, setNewGenericName] = useState('');
  const [newCategory, setNewCategory] = useState('General Health');
  const [newStrength, setNewStrength] = useState('500mg');
  const [newDosageForm, setNewDosageForm] = useState('Tablet');
  const [newUses, setNewUses] = useState('');
  const [newDosageGuidelines, setNewDosageGuidelines] = useState('1 tablet after meals as advised');
  const [newPrescriptionRequired, setNewPrescriptionRequired] = useState(false);
  const [newPrecautions, setNewPrecautions] = useState('Keep out of reach of children. Consult doctor if pregnant.');
  const [newSideEffects, setNewSideEffects] = useState('Mild nausea, dizziness (rare)');
  const [newStorage, setNewStorage] = useState('Store in cool and dry place away from direct sunlight');

  // Delete Medicine State
  const [deleteTarget, setDeleteTarget] = useState<MedicineItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch medicines from backend on mount
  const loadMedicines = async () => {
    try {
      const list = await api.getMedicines();
      if (Array.isArray(list) && list.length > 0) {
        setMedicines(list);
      }
    } catch {
      // offline fallback maintains existing seed data
    }
  };

  useEffect(() => {
    loadMedicines();
  }, []);

  // Multi-step back handler
  useEffect(() => {
    if (!onRegisterBackHandler) return;
    return onRegisterBackHandler(() => {
      if (deleteTarget) {
        setDeleteTarget(null);
        return true;
      }
      if (selectedMedicine) {
        setSelectedMedicine(null);
        return true;
      }
      if (showAddModal) {
        setShowAddModal(false);
        return true;
      }
      return false;
    });
  }, [onRegisterBackHandler, deleteTarget, selectedMedicine, showAddModal]);

  const categories = [
    'All',
    'Pain Relief',
    'Antibiotics',
    'Diabetes',
    'Hypertension',
    'Gastrointestinal',
    'Respiratory',
    'Vitamins & Supplements',
    'Dermatology',
    'General Health',
  ];

  const filteredMedicines = useMemo(() => {
    return medicines.filter((med) => {
      const matchesCategory = selectedCategory === 'All' || med.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchesQuery =
        !q ||
        med.name.toLowerCase().includes(q) ||
        med.genericName.toLowerCase().includes(q) ||
        (Array.isArray(med.uses) && med.uses.some((u) => u.toLowerCase().includes(q)));
      return matchesCategory && matchesQuery;
    });
  }, [medicines, searchQuery, selectedCategory]);

  const handleCreateReminder = (med: MedicineItem) => {
    onSelectForReminder({
      name: med.name,
      generic: med.genericName,
      dosage: `${med.strength} (${med.dosageForm})`,
    });
    setSelectedMedicine(null);
    showToast('info', 'Schedule Reminder', `Configuring dose reminder for ${med.name}`);
  };

  const handleAddMedicineSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) {
      showToast('error', 'Validation Error', 'Please enter a medicine name.');
      return;
    }

    setIsSaving(true);
    try {
      const payload: Partial<MedicineItem> = {
        name: newName.trim(),
        genericName: newGenericName.trim() || newName.trim(),
        category: newCategory,
        strength: newStrength.trim() || '500mg',
        dosageForm: newDosageForm,
        uses: newUses.trim()
          ? newUses.split(',').map((s) => s.trim()).filter(Boolean)
          : ['General wellness and symptom relief'],
        dosageGuidelines: newDosageGuidelines.trim() || 'As directed by physician',
        prescriptionRequired: newPrescriptionRequired,
        precautions: newPrecautions.trim()
          ? [newPrecautions.trim()]
          : ['Keep out of reach of children'],
        sideEffects: newSideEffects.trim()
          ? newSideEffects.split(',').map((s) => s.trim()).filter(Boolean)
          : ['None reported under normal use'],
        storage: newStorage.trim() || 'Store in cool and dry place',
      };

      const saved = await api.saveMedicine(payload);
      setMedicines((prev) => {
        const exists = prev.findIndex((m) => m.id === saved.id);
        if (exists >= 0) {
          const updated = [...prev];
          updated[exists] = saved;
          return updated;
        }
        return [saved, ...prev];
      });

      showToast('success', 'Medicine Added', `${saved.name} was successfully registered.`);
      setShowAddModal(false);
      // Reset form
      setNewName('');
      setNewGenericName('');
      setNewUses('');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save medicine';
      showToast('error', 'Save Failed', msg);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await api.deleteMedicine(deleteTarget.id);
      setMedicines((prev) => prev.filter((m) => m.id !== deleteTarget.id));
      showToast('info', 'Medicine Removed', `${deleteTarget.name} and associated reminder references removed.`);
      setDeleteTarget(null);
      if (selectedMedicine?.id === deleteTarget.id) {
        setSelectedMedicine(null);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete medicine';
      showToast('error', 'Delete Failed', msg);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="p-4 space-y-4 max-w-md mx-auto pb-24">
      {/* 1. Clinical Disclaimer Banner */}
      <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-3 flex items-start gap-2.5 text-xs text-amber-900">
        <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <p className="leading-snug">
          <strong>Clinical Reference Only:</strong> Never adjust prescribed medications without consulting your registered medical practitioner.
        </p>
      </div>

      {/* 2. Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
        <input
          id="input-medicine-search"
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={getTranslation(lang, 'medicines.searchPlaceholder')}
          className="w-full pl-10 pr-9 py-2.5 rounded-xl bg-white border border-slate-200/80 text-sm font-medium text-slate-800 shadow-xs focus:outline-hidden focus:ring-2 focus:ring-[#0EA5E9]"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="w-6 h-6 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 absolute right-2.5 top-3 flex items-center justify-center"
            aria-label="Clear search"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* 3. Category Horizontal Pills */}
      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar -mx-1 px-1">
        {categories.map((cat) => {
          const isSelected = selectedCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold shrink-0 transition-all ${
                isSelected
                  ? 'bg-[#0F4C81] text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300'
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* 4. Results counter & Add Custom Medicine Button */}
      <div className="flex items-center justify-between text-xs font-semibold text-slate-500 px-1">
        <span>
          Showing {filteredMedicines.length} medicine{filteredMedicines.length !== 1 ? 's' : ''}
        </span>
        <div className="flex items-center gap-2.5">
          {(searchQuery || selectedCategory !== 'All') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('All');
              }}
              className="text-[#0EA5E9] hover:underline"
            >
              Reset Filters
            </button>
          )}
          <button
            onClick={() => setShowAddModal(true)}
            id="btn-add-custom-medicine"
            className="px-2.5 py-1 rounded-lg bg-[#0F4C81] hover:bg-[#0c3c66] text-white text-xs font-bold flex items-center gap-1 shadow-2xs transition-all active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Medicine</span>
          </button>
        </div>
      </div>

      {/* 5. Medicine Cards List */}
      <div className="space-y-3">
        {filteredMedicines.map((med) => (
          <div
            key={med.id}
            className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs hover:border-sky-300 transition-all relative"
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm font-extrabold text-[#0F172A]">{med.name}</h3>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      med.prescriptionRequired
                        ? 'bg-rose-50 text-rose-700 border border-rose-100'
                        : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                    }`}
                  >
                    {med.prescriptionRequired ? 'Rx Required' : 'OTC'}
                  </span>
                  {((med as any).isCustom || !med.id.startsWith('seed_') || !!(med as any).userId) && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-100">
                      My Medicine
                    </span>
                  )}
                </div>
                <p className="text-xs font-medium text-slate-500 italic mt-0.5">
                  {med.genericName}
                </p>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                  {med.strength}
                </span>
                {((med as any).isCustom || !med.id.startsWith('seed_') || !!(med as any).userId) && (
                  <button
                    onClick={() => setDeleteTarget(med)}
                    id={`btn-delete-medicine-${med.id}`}
                    title="Delete custom medicine"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Uses tags */}
            <div className="flex flex-wrap gap-1.5 my-2.5">
              {(Array.isArray(med.uses) ? med.uses : []).slice(0, 2).map((use, uIdx) => (
                <span
                  key={uIdx}
                  className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-sky-50 text-[#0F4C81] border border-sky-100"
                >
                  {use}
                </span>
              ))}
              {Array.isArray(med.uses) && med.uses.length > 2 && (
                <span className="text-[11px] font-medium px-1.5 py-0.5 rounded-md text-slate-400">
                  +{med.uses.length - 2} more
                </span>
              )}
            </div>

            {/* Bottom actions */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100 mt-2">
              <button
                onClick={() => setSelectedMedicine(med)}
                id={`btn-view-medicine-${med.id}`}
                className="text-xs font-bold text-slate-600 hover:text-[#0F4C81] flex items-center gap-1"
              >
                <span>View Details</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => handleCreateReminder(med)}
                id={`btn-add-reminder-${med.id}`}
                className="px-3 py-1.5 rounded-xl bg-[#E0F2FE] hover:bg-sky-200 active:scale-95 text-[#0F4C81] text-xs font-bold flex items-center gap-1.5 transition-all"
              >
                <BellPlus className="w-3.5 h-3.5 text-[#0EA5E9]" />
                <span>Set Reminder</span>
              </button>
            </div>
          </div>
        ))}

        {filteredMedicines.length === 0 && (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-8 text-center">
            <Pill className="w-10 h-10 text-slate-300 mx-auto mb-2 -rotate-45" />
            <h4 className="text-sm font-bold text-slate-700">No medicines found</h4>
            <p className="text-xs text-slate-400 mt-1">
              Try a different keyword, brand name, or add your own medicine.
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="mt-3.5 px-4 py-2 rounded-xl bg-[#0F4C81] text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-2xs hover:bg-[#0c3c66]"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Custom Medicine</span>
            </button>
          </div>
        )}
      </div>

      {/* 6. Detail Modal */}
      {selectedMedicine && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-200">
            {/* Header */}
            <div className="p-4 border-b border-slate-200 flex items-start justify-between bg-slate-50/80">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-extrabold text-[#0F172A]">
                    {selectedMedicine.name}
                  </h3>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      selectedMedicine.prescriptionRequired
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {selectedMedicine.prescriptionRequired ? 'Prescription Required' : 'OTC'}
                  </span>
                </div>
                <p className="text-xs font-medium text-slate-500 italic mt-0.5">
                  {selectedMedicine.genericName} • {selectedMedicine.dosageForm} ({selectedMedicine.strength})
                </p>
              </div>
              <button
                onClick={() => setSelectedMedicine(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 space-y-4 overflow-y-auto">
              {/* Uses */}
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Clinical Indications / Uses
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {(Array.isArray(selectedMedicine.uses) ? selectedMedicine.uses : []).map((u: string, i: number) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 rounded-lg bg-sky-50 text-[#0F4C81] text-xs font-semibold border border-sky-100"
                    >
                      {u}
                    </span>
                  ))}
                </div>
              </div>

              {/* Dosage */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                <h4 className="text-xs font-bold text-slate-700 mb-1">Standard Adult Dosage</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {selectedMedicine.dosageGuidelines}
                </p>
              </div>

              {/* Precautions */}
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Precautions & Warnings
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed bg-amber-50/60 border border-amber-200/60 p-3 rounded-xl">
                  {Array.isArray(selectedMedicine.precautions)
                    ? selectedMedicine.precautions.join(' • ')
                    : selectedMedicine.precautions}
                </p>
              </div>

              {/* Side effects */}
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Common Side Effects
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {(Array.isArray(selectedMedicine.sideEffects) ? selectedMedicine.sideEffects : []).map((se: string, i: number) => (
                    <span
                      key={i}
                      className="text-xs font-medium px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 border border-rose-100"
                    >
                      {se}
                    </span>
                  ))}
                </div>
              </div>

              {/* Storage */}
              <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-600">
                <Info className="w-4 h-4 text-[#0EA5E9] shrink-0" />
                <span>
                  <strong>Storage:</strong> {selectedMedicine.storage}
                </span>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-200 bg-white flex gap-2">
              {((selectedMedicine as any).isCustom || !selectedMedicine.id.startsWith('seed_') || !!(selectedMedicine as any).userId) && (
                <button
                  type="button"
                  onClick={() => setDeleteTarget(selectedMedicine)}
                  id="btn-modal-delete-medicine"
                  className="px-3.5 py-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
                  title="Delete this medicine"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete</span>
                </button>
              )}
              <button
                onClick={() => handleCreateReminder(selectedMedicine)}
                id="btn-modal-create-reminder"
                className="flex-1 py-3 px-4 rounded-xl bg-[#0EA5E9] hover:bg-[#0284C7] active:scale-[0.99] text-white font-bold text-sm shadow-sm flex items-center justify-center gap-2 transition-all"
              >
                <BellPlus className="w-4 h-4" />
                <span>Set Dose Reminder for {selectedMedicine.name.split(' ')[0]}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. Add Custom Medicine Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-200">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#0F4C81] text-white flex items-center justify-center">
                  <Pill className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">Add Medicine</h3>
                  <p className="text-[11px] text-slate-500">Save new medicine to your personal catalog</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddMedicineSubmit} className="p-5 space-y-3.5 overflow-y-auto flex-1">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Medicine Name <span className="text-rose-500">*</span>
                </label>
                <input
                  id="input-new-med-name"
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Pantocid, Telma, Metformin"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-900 focus:ring-2 focus:ring-[#0EA5E9] focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Generic / Salt Name
                  </label>
                  <input
                    type="text"
                    value={newGenericName}
                    onChange={(e) => setNewGenericName(e.target.value)}
                    placeholder="e.g. Pantoprazole"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 focus:ring-2 focus:ring-[#0EA5E9] focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Strength / Dose
                  </label>
                  <input
                    type="text"
                    value={newStrength}
                    onChange={(e) => setNewStrength(e.target.value)}
                    placeholder="e.g. 40mg, 500mg, 10ml"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 focus:ring-2 focus:ring-[#0EA5E9] focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Category
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 focus:ring-2 focus:ring-[#0EA5E9] focus:outline-hidden bg-white"
                  >
                    {categories.filter((c) => c !== 'All').map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Dosage Form
                  </label>
                  <select
                    value={newDosageForm}
                    onChange={(e) => setNewDosageForm(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 focus:ring-2 focus:ring-[#0EA5E9] focus:outline-hidden bg-white"
                  >
                    <option value="Tablet">Tablet</option>
                    <option value="Capsule">Capsule</option>
                    <option value="Syrup">Syrup</option>
                    <option value="Injection">Injection</option>
                    <option value="Cream">Cream</option>
                    <option value="Drops">Drops</option>
                    <option value="Inhaler">Inhaler</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Uses / Indications (comma separated)
                </label>
                <input
                  type="text"
                  value={newUses}
                  onChange={(e) => setNewUses(e.target.value)}
                  placeholder="e.g. Acid reflux, Heartburn, Gastric ulcer"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 focus:ring-2 focus:ring-[#0EA5E9] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Dosage Guidelines
                </label>
                <input
                  type="text"
                  value={newDosageGuidelines}
                  onChange={(e) => setNewDosageGuidelines(e.target.value)}
                  placeholder="e.g. Take 1 tablet empty stomach in the morning"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 focus:ring-2 focus:ring-[#0EA5E9] focus:outline-hidden"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-xs font-bold text-slate-700">Requires Prescription (Rx)</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newPrescriptionRequired}
                    onChange={(e) => setNewPrescriptionRequired(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0EA5E9]"></div>
                </label>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSaving}
                  id="btn-save-medicine-submit"
                  className="w-full py-3 px-4 rounded-xl bg-[#0F4C81] hover:bg-[#0c3c66] active:scale-[0.99] text-white font-bold text-sm shadow-sm flex items-center justify-center gap-2 transition-all disabled:opacity-60"
                >
                  {isSaving ? (
                    <span>Saving Medicine...</span>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      <span>Save to Medicine Catalog</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 8. Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-5 max-w-sm w-full border border-slate-200 shadow-xl space-y-3.5">
            <div className="w-10 h-10 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-5 h-5" />
            </div>
            <div className="text-center">
              <h3 className="text-base font-extrabold text-slate-900">
                Delete Medicine?
              </h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Are you sure you want to remove <strong>{deleteTarget.name}</strong> from your personal catalog? Associated dose reminders will also be cleaned up.
              </p>
            </div>
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="flex-1 py-2 px-3 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDeleteConfirm}
                id="btn-confirm-delete-medicine"
                className="flex-1 py-2 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors disabled:opacity-60"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
