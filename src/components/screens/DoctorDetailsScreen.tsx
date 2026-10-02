import React, { useState } from 'react';
import {
  ArrowLeft,
  ShieldCheck,
  Star,
  Clock,
  MapPin,
  Phone,
  Calendar,
  CheckCircle2,
  Share2,
  Building2,
  FileCheck
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Doctor, Appointment, AppLanguage } from '../../types';
import { api } from '../../services/api';

interface DoctorDetailsScreenProps {
  doctor: Doctor;
  lang: AppLanguage;
  onBack: () => void;
  showToast: (type: 'success' | 'info' | 'error' | 'warning', title: string, message: string) => void;
}

export const DoctorDetailsScreen: React.FC<DoctorDetailsScreenProps> = ({
  doctor,
  lang,
  onBack,
  showToast,
}) => {
  const [selectedDay, setSelectedDay] = useState('Today');
  const [selectedSlot, setSelectedSlot] = useState('11:30 AM');
  const [bookingLoading, setBookingLoading] = useState(false);
  const [confirmedBooking, setConfirmedBooking] = useState<Appointment | null>(null);

  const days = ['Today', 'Tomorrow', 'In 2 Days'];
  const slots = ['10:00 AM', '11:30 AM', '02:00 PM', '05:00 PM', '06:30 PM'];

  const handleBookAppointment = async () => {
    setBookingLoading(true);
    try {
      const apt = await api.bookAppointment({
        doctorId: doctor.id,
        doctorName: doctor.name,
        doctorSpecialty: doctor.specialty,
        hospitalClinic: doctor.hospitalClinic,
        day: selectedDay,
        timeSlot: selectedSlot,
        consultationFee: doctor.consultationFee,
      });

      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 },
      });
      setConfirmedBooking(apt);
      showToast(
        'success',
        'Appointment Confirmed',
        `Ref: ${apt.bookingRef} for ${selectedDay} at ${selectedSlot}`
      );
    } catch {
      showToast('error', 'Booking Failed', 'Unable to book consultation slot.');
    } finally {
      setBookingLoading(false);
    }
  };

  return (
    <div className="p-4 space-y-4 max-w-md mx-auto pb-24">
      {/* Top back row */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          id="btn-back-to-doctor-list"
          className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-[#0F4C81] p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Specialists</span>
        </button>

        <button
          onClick={() => {
            navigator.clipboard.writeText(
              `${doctor.name}, ${doctor.specialty} at ${doctor.hospitalClinic}. Contact: ${doctor.contactPhone}`
            );
            showToast('info', 'Doctor Info Copied', 'Profile details copied to clipboard.');
          }}
          className="p-1.5 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100"
        >
          <Share2 className="w-4 h-4" />
        </button>
      </div>

      {/* Profile Card */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-2xl bg-[#0F4C81] text-white text-lg font-black flex items-center justify-center shadow-xs shrink-0">
            {doctor.name.replace('Dr. ', '').slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-extrabold text-[#0F172A] truncate">{doctor.name}</h2>
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            </div>
            <p className="text-xs font-bold text-[#0EA5E9]">{doctor.specialty}</p>
            <p className="text-xs text-slate-500 mt-0.5">{doctor.qualification}</p>

            <div className="flex items-center gap-2 mt-2">
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-100 flex items-center gap-1">
                <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                <span>{doctor.rating}</span>
                <span className="text-slate-400 font-normal">({doctor.reviewsCount})</span>
              </span>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                {doctor.experienceYears} yrs experience
              </span>
            </div>
          </div>
        </div>

        {/* Hospital & Address */}
        <div className="mt-4 pt-4 border-t border-slate-100 space-y-2 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
            <span className="font-semibold text-slate-800">{doctor.hospitalClinic}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
            <span>{doctor.location || doctor.address || `${doctor.city}, India`}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-400 shrink-0" />
            <span>{doctor.timings}</span>
          </div>
          <div className="flex items-center gap-2">
            <FileCheck className="w-4 h-4 text-slate-400 shrink-0" />
            <span>Medical Council Reg: {doctor.registrationNumber}</span>
          </div>
        </div>
      </div>

      {/* About Doctor */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
          About Specialist
        </h3>
        <p className="text-xs text-slate-600 leading-relaxed">{doctor.about}</p>

        <div className="mt-3 pt-3 border-t border-slate-100">
          <span className="text-[11px] font-bold text-slate-500 block mb-1.5">
            Available Consultation Days:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {doctor.availableDays.map((day) => (
              <span
                key={day}
                className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700"
              >
                {day}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Booking Slot Box */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-extrabold text-[#0F172A]">Book Consultation</h3>
            <p className="text-xs text-slate-500">In-person hospital appointment</p>
          </div>
          <span className="text-sm font-black text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100">
            ₹{doctor.consultationFee}
          </span>
        </div>

        {confirmedBooking ? (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 space-y-2 text-xs text-emerald-900">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span className="font-extrabold text-sm">Consultation Slot Confirmed!</span>
            </div>
            <p>
              <strong>Booking Ref:</strong> {confirmedBooking.bookingRef}
            </p>
            <p>
              <strong>Schedule:</strong> {confirmedBooking.day} at {confirmedBooking.timeSlot}
            </p>
            <p className="text-[11px] text-emerald-800">
              Please present your booking reference at the reception counter of {doctor.hospitalClinic}.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Day selector */}
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">Select Day</label>
              <div className="grid grid-cols-3 gap-2">
                {days.map((day) => (
                  <button
                    key={day}
                    onClick={() => setSelectedDay(day)}
                    className={`py-2 px-2 rounded-xl text-xs font-bold transition-all ${
                      selectedDay === day
                        ? 'bg-[#0F4C81] text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>

            {/* Time Slot selector */}
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">
                Available Time Slot
              </label>
              <div className="grid grid-cols-3 gap-2">
                {slots.map((slot) => (
                  <button
                    key={slot}
                    onClick={() => setSelectedSlot(slot)}
                    className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all ${
                      selectedSlot === slot
                        ? 'bg-[#0EA5E9] text-white shadow-xs'
                        : 'bg-slate-50 border border-slate-200 text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            </div>

            {/* Book button */}
            <button
              onClick={handleBookAppointment}
              id="btn-book-consultation"
              disabled={bookingLoading}
              className="w-full py-3 px-4 rounded-xl bg-[#0EA5E9] hover:bg-[#0284C7] active:scale-[0.99] disabled:opacity-60 text-white font-bold text-sm shadow-sm flex items-center justify-center gap-2 transition-all"
            >
              <Calendar className="w-4 h-4" />
              <span>
                {bookingLoading
                  ? 'Confirming Slot...'
                  : `Book Consultation (₹${doctor.consultationFee})`}
              </span>
            </button>
          </div>
        )}

        {/* Call clinic directly */}
        <div className="mt-4 pt-3 border-t border-slate-100 text-center">
          <a
            href={`tel:${doctor.contactPhone}`}
            id="btn-call-doctor-clinic"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-[#0F4C81]"
          >
            <Phone className="w-3.5 h-3.5" />
            <span>Call Clinic Directly ({doctor.contactPhone})</span>
          </a>
        </div>
      </div>
    </div>
  );
};
