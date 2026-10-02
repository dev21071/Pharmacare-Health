import React, { useState, useMemo, useEffect } from 'react';
import {
  Stethoscope,
  Search,
  Plus,
  Star,
  Clock,
  Phone,
  ArrowRight,
  ShieldCheck,
  Edit2,
  Trash2,
  X,
  UserCheck,
  AlertTriangle
} from 'lucide-react';
import { Doctor, AppLanguage } from '../../types';

interface DoctorsScreenProps {
  doctors: Doctor[];
  lang: AppLanguage;
  onSelectDoctor: (doctor: Doctor) => void;
  onSaveCustomDoctor: (doctorData: Partial<Doctor>) => Promise<void>;
  onDeleteCustomDoctor: (id: string) => Promise<void>;
  onRegisterBackHandler?: (handler: () => boolean) => () => void;
  showToast: (type: 'success' | 'info' | 'error' | 'warning', title: string, message: string) => void;
}

export const DoctorsScreen: React.FC<DoctorsScreenProps> = ({
  doctors,
  lang,
  onSelectDoctor,
  onSaveCustomDoctor,
  onDeleteCustomDoctor,
  onRegisterBackHandler,
  showToast,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>('All');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingDoc, setEditingDoc] = useState<Doctor | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Multi-step back handler: close delete dialog or add doctor modal
  useEffect(() => {
    if (!onRegisterBackHandler) return;
    return onRegisterBackHandler(() => {
      if (deleteConfirmId) {
        setDeleteConfirmId(null);
        return true;
      }
      if (showAddModal) {
        setShowAddModal(false);
        setEditingDoc(null);
        return true;
      }
      return false;
    });
  }, [onRegisterBackHandler, deleteConfirmId, showAddModal]);

  // Form
  const [name, setName] = useState('');
  const [specialty, setSpecialty] = useState('General Physician');
  const [qualification, setQualification] = useState('MBBS');
  const [experienceYears, setExperienceYears] = useState(5);
  const [hospitalClinic, setHospitalClinic] = useState('');
  const [city, setCity] = useState('Ahmedabad');
  const [consultationFee, setConsultationFee] = useState(500);
  const [contactPhone, setContactPhone] = useState('');
  const [timings, setTimings] = useState('10:00 AM – 2:00 PM, 5:00 PM – 8:00 PM');
  const [about, setAbout] = useState('');

  const specialties = [
    'All',
    'General Physician',
    'Cardiologist',
    'Pediatrician',
    'Neurologist',
    'Orthopedic',
    'Dermatologist',
    'Gynaecologist',
    'Added by you',
  ];

  const filteredDoctors = useMemo(() => {
    return doctors.filter((doc) => {
      if (selectedSpecialty === 'Added by you' && !doc.isCustom) return false;
      if (selectedSpecialty !== 'All' && selectedSpecialty !== 'Added by you' && doc.specialty !== selectedSpecialty) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          doc.name.toLowerCase().includes(q) ||
          doc.specialty.toLowerCase().includes(q) ||
          doc.hospitalClinic.toLowerCase().includes(q) ||
          doc.city.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [doctors, selectedSpecialty, searchQuery]);

  const handleOpenAddModal = (doc?: Doctor) => {
    if (doc) {
      setEditingDoc(doc);
      setName(doc.name);
      setSpecialty(doc.specialty);
      setQualification(doc.qualification);
      setExperienceYears(doc.experienceYears);
      setHospitalClinic(doc.hospitalClinic);
      setCity(doc.city);
      setConsultationFee(doc.consultationFee);
      setContactPhone(doc.contactPhone);
      setTimings(doc.timings);
      setAbout(doc.about);
    } else {
      setEditingDoc(null);
      setName('');
      setSpecialty('General Physician');
      setQualification('MBBS');
      setExperienceYears(5);
      setHospitalClinic('Private Clinic');
      setCity('Ahmedabad');
      setConsultationFee(500);
      setContactPhone('+91 98765 43210');
      setTimings('10:00 AM – 2:00 PM, 5:00 PM – 8:00 PM');
      setAbout('Consultant Specialist');
    }
    setShowAddModal(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('error', 'Missing Name', 'Please enter the doctor name.');
      return;
    }

    try {
      await onSaveCustomDoctor({
        id: editingDoc?.id,
        name: name.trim(),
        specialty,
        qualification,
        experienceYears,
        hospitalClinic,
        city,
        consultationFee,
        contactPhone,
        timings,
        about,
        isCustom: true,
      });
      setShowAddModal(false);
      showToast(
        'success',
        editingDoc ? 'Doctor Updated' : 'Doctor Added',
        `${name} saved to your personal directory.`
      );
    } catch {
      showToast('error', 'Save Error', 'Failed to save doctor.');
    }
  };

  return (
    <div className="p-4 space-y-4 max-w-md mx-auto pb-24">
      {/* 1. Header with Add button */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex items-center justify-between">
        <div>
          <h2 className="text-base font-extrabold text-[#0F4C81]">Find a Doctor</h2>
          <p className="text-xs font-medium text-slate-500">
            Consult verified specialists & physicians
          </p>
        </div>

        <button
          onClick={() => handleOpenAddModal()}
          id="btn-header-add-doctor"
          className="px-3.5 py-2 rounded-xl bg-[#0EA5E9] hover:bg-[#0284C7] active:scale-95 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Add Doctor</span>
        </button>
      </div>

      {/* 2. Search */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
        <input
          id="doctor-search-input"
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by doctor name, specialty, clinic..."
          className="w-full pl-10 pr-9 py-2.5 rounded-xl bg-white border border-slate-200/80 text-sm font-medium text-slate-800 shadow-xs focus:outline-hidden focus:ring-2 focus:ring-[#0EA5E9]"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="w-6 h-6 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 absolute right-2.5 top-3 flex items-center justify-center"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* 3. Specialty horizontal pills */}
      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar -mx-1 px-1">
        {specialties.map((spec) => {
          const isSelected = selectedSpecialty === spec;
          return (
            <button
              key={spec}
              onClick={() => setSelectedSpecialty(spec)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold shrink-0 transition-all ${
                isSelected
                  ? 'bg-[#0F4C81] text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300'
              }`}
            >
              {spec}
            </button>
          );
        })}
      </div>

      {/* 4. Results info */}
      <div className="flex items-center justify-between text-xs font-semibold text-slate-500 px-1">
        <span>
          {filteredDoctors.length} specialist{filteredDoctors.length !== 1 ? 's' : ''} available
        </span>
        {(searchQuery || selectedSpecialty !== 'All') && (
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedSpecialty('All');
            }}
            className="text-[#0EA5E9] hover:underline"
          >
            Reset Filters
          </button>
        )}
      </div>

      {/* 5. Doctor List */}
      <div className="space-y-3">
        {filteredDoctors.map((doc) => (
          <div
            key={doc.id}
            className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs hover:border-sky-300 transition-all"
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-[#E0F2FE] text-[#0F4C81] font-bold text-sm flex items-center justify-center shrink-0">
                  {doc.name.replace('Dr. ', '').slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-extrabold text-[#0F172A]">{doc.name}</h3>
                    {doc.isCustom ? (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-purple-50 text-[#6B21A8]">
                        My Doctor
                      </span>
                    ) : (
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    )}
                  </div>
                  <p className="text-xs font-semibold text-[#0EA5E9]">{doc.specialty}</p>
                  <p className="text-[11px] text-slate-400">
                    {doc.qualification} • {doc.experienceYears} yrs experience
                  </p>
                </div>
              </div>

              <span className="text-xs font-extrabold px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-100 shrink-0">
                ₹{doc.consultationFee}
              </span>
            </div>

            <p className="text-xs text-slate-600 mb-2.5">
              {doc.hospitalClinic}, {doc.city}
            </p>

            {/* Timings row */}
            <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-50 p-2 rounded-xl border border-slate-100 mb-3">
              <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="truncate">{doc.timings}</span>
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <div className="flex items-center gap-2">
                <a
                  href={`tel:${doc.contactPhone}`}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-all"
                >
                  <Phone className="w-3 h-3 text-slate-500" />
                  <span>Call</span>
                </a>

                {doc.isCustom && (
                  <>
                    <button
                      onClick={() => handleOpenAddModal(doc)}
                      id={`btn-edit-doc-${doc.id}`}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeleteConfirmId(doc.id)}
                      id={`btn-delete-doc-${doc.id}`}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </>
                )}
              </div>

              <button
                onClick={() => onSelectDoctor(doc)}
                id={`btn-view-doc-${doc.id}`}
                className="px-3.5 py-1.5 rounded-xl bg-[#0EA5E9] hover:bg-[#0284C7] active:scale-95 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all"
              >
                <span>View & Book</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* 6. Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-200">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
              <h3 className="text-base font-extrabold text-[#0F172A]">
                {editingDoc ? 'Edit Doctor' : 'Add Custom Doctor'}
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-5 space-y-4 overflow-y-auto">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Doctor Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Dr. Ramesh Trivedi"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-[#0EA5E9]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Specialty</label>
                  <input
                    type="text"
                    value={specialty}
                    onChange={(e) => setSpecialty(e.target.value)}
                    placeholder="e.g. Cardiologist"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Qualification</label>
                  <input
                    type="text"
                    value={qualification}
                    onChange={(e) => setQualification(e.target.value)}
                    placeholder="e.g. MBBS, MD"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Experience (Years)
                  </label>
                  <input
                    type="number"
                    value={experienceYears}
                    onChange={(e) => setExperienceYears(Number(e.target.value))}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Consultation Fee (₹)
                  </label>
                  <input
                    type="number"
                    value={consultationFee}
                    onChange={(e) => setConsultationFee(Number(e.target.value))}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Hospital / Clinic Name
                </label>
                <input
                  type="text"
                  value={hospitalClinic}
                  onChange={(e) => setHospitalClinic(e.target.value)}
                  placeholder="e.g. Shanti Clinic"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm font-medium text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Contact Phone</label>
                <input
                  type="tel"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm font-medium text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Clinic Timings</label>
                <input
                  type="text"
                  value={timings}
                  onChange={(e) => setTimings(e.target.value)}
                  placeholder="10:00 AM – 2:00 PM, 5:00 PM – 8:00 PM"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  id="btn-save-doctor-submit"
                  className="w-full py-3 px-4 rounded-xl bg-[#0EA5E9] hover:bg-[#0284C7] text-white font-bold text-sm shadow-sm transition-all"
                >
                  {editingDoc ? 'Update Doctor' : 'Save Doctor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white max-w-sm w-full rounded-2xl p-5 shadow-xl border border-slate-200">
            <div className="flex items-center gap-3 mb-3 text-rose-600">
              <AlertTriangle className="w-6 h-6" />
              <h4 className="text-sm font-extrabold text-[#0F172A]">Delete Doctor?</h4>
            </div>
            <p className="text-xs text-slate-600 mb-5 leading-relaxed">
              Remove this physician from your personal directory?
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 py-2 px-3 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  await onDeleteCustomDoctor(deleteConfirmId);
                  setDeleteConfirmId(null);
                  showToast('info', 'Doctor Removed', 'Physician removed from directory.');
                }}
                className="flex-1 py-2 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
