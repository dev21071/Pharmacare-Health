var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_path2 = __toESM(require("path"), 1);
var import_cors = __toESM(require("cors"), 1);
var import_jsonwebtoken = __toESM(require("jsonwebtoken"), 1);
var import_vite = require("vite");

// server/repository.ts
var import_fs = __toESM(require("fs"), 1);
var import_path = __toESM(require("path"), 1);

// src/data/seedData.ts
var SEED_DOCTORS = [
  {
    id: "doc-1",
    name: "Dr. Rajesh Patel",
    specialty: "Cardiologist",
    qualification: "MBBS, MD (Medicine), DM (Cardiology), FACC",
    experienceYears: 16,
    location: "Navrangpura",
    city: "Ahmedabad",
    hospitalClinic: "Apex Heart & Vascular Institute",
    consultationFee: 800,
    availableDays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
    timings: "10:00 AM \u2013 2:00 PM, 5:00 PM \u2013 8:30 PM",
    contactPhone: "+91 79 2640 1199",
    languages: ["English", "Hindi", "Gujarati"],
    rating: 4.9,
    reviewsCount: 230,
    about: "Senior Interventional Cardiologist specializing in preventive cardiology, coronary angioplasty, heart failure management, and hypertension control with over 16 years of academic and clinical expertise.",
    registrationNumber: "G-34821 (Gujarat Medical Council)",
    isAvailableToday: true,
    email: "dr.rajesh.patel@apexheart.in",
    address: "Suite 401, Apex Heart Tower, Near St. Xavier\u2019s College, Navrangpura, Ahmedabad"
  },
  {
    id: "doc-2",
    name: "Dr. Meera Shah",
    specialty: "Dermatologist",
    qualification: "MBBS, MD (Dermatology, Venereology & Leprosy)",
    experienceYears: 11,
    location: "Bodakdev, SG Highway",
    city: "Ahmedabad",
    hospitalClinic: "SkinCare & Laser Aesthetics Center",
    consultationFee: 600,
    availableDays: ["Mon", "Wed", "Fri", "Sat"],
    timings: "11:00 AM \u2013 3:00 PM, 6:00 PM \u2013 9:00 PM",
    contactPhone: "+91 79 2684 2200",
    languages: ["English", "Hindi", "Gujarati"],
    rating: 4.8,
    reviewsCount: 185,
    about: "Expert clinical and cosmetic dermatologist specializing in chronic eczema, psoriasis management, severe acne therapies, pediatric skin allergies, and advanced laser interventions.",
    registrationNumber: "G-41290 (Gujarat Medical Council)",
    isAvailableToday: true,
    email: "dr.meera@skincarecenter.in",
    address: "Ground Floor, Gala Business Park, Near Rajpath Club, Bodakdev, SG Highway, Ahmedabad"
  },
  {
    id: "doc-3",
    name: "Dr. Amit Joshi",
    specialty: "General Physician",
    qualification: "MBBS, MD (General Medicine)",
    experienceYears: 14,
    location: "Paldi",
    city: "Ahmedabad",
    hospitalClinic: "Sanjivani Multispeciality Clinic",
    consultationFee: 400,
    availableDays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
    timings: "09:00 AM \u2013 1:00 PM, 4:30 PM \u2013 8:30 PM",
    contactPhone: "+91 79 2658 3311",
    languages: ["English", "Hindi", "Gujarati"],
    rating: 4.9,
    reviewsCount: 312,
    about: "Dedicated family physician with extensive experience diagnosing infectious fevers (dengue, malaria, typhoid), metabolic disorders, thyroid anomalies, and geriatric preventive wellness.",
    registrationNumber: "G-28954 (Gujarat Medical Council)",
    isAvailableToday: true,
    email: "dr.amitjoshi@sanjivaniclinic.in",
    address: "Near Bhattha Cross Road, Opp. Sharda Mandir School, Paldi, Ahmedabad"
  },
  {
    id: "doc-4",
    name: "Dr. Neha Desai",
    specialty: "Pediatrician",
    qualification: "MBBS, DCH, DNB (Pediatrics)",
    experienceYears: 12,
    location: "Satellite",
    city: "Ahmedabad",
    hospitalClinic: "Little Stars Children Hospital",
    consultationFee: 500,
    availableDays: ["Mon", "Tue", "Thu", "Fri", "Sat"],
    timings: "10:30 AM \u2013 1:30 PM, 5:30 PM \u2013 8:30 PM",
    contactPhone: "+91 79 2673 4422",
    languages: ["English", "Hindi", "Gujarati"],
    rating: 4.8,
    reviewsCount: 198,
    about: "Compassionate child specialist handling newborn intensive care, vaccination schedules, pediatric asthma, childhood infections, and developmental milestone assessments.",
    registrationNumber: "G-37812 (Gujarat Medical Council)",
    isAvailableToday: true,
    email: "drneha@littlestarskids.org",
    address: "2nd Floor, Star Plaza, Jodhpur Cross Roads, Satellite, Ahmedabad"
  },
  {
    id: "doc-5",
    name: "Dr. Ananya Trivedi",
    specialty: "Gynecologist",
    qualification: "MBBS, MS (Obstetrics & Gynecology), FMAS",
    experienceYears: 15,
    location: "Vastrapur",
    city: "Ahmedabad",
    hospitalClinic: "Matritva Women & Maternity Clinic",
    consultationFee: 700,
    availableDays: ["Mon", "Tue", "Wed", "Thu", "Fri"],
    timings: "11:00 AM \u2013 2:00 PM, 6:00 PM \u2013 8:30 PM",
    contactPhone: "+91 79 2676 7788",
    languages: ["English", "Hindi", "Gujarati"],
    rating: 4.9,
    reviewsCount: 264,
    about: "Specialist obstetrician and laparoscopic surgeon focusing on high-risk pregnancy management, PCOS/PCOD hormonal balancing, infertility evaluation, and menopause transition.",
    registrationNumber: "G-31209 (Gujarat Medical Council)",
    isAvailableToday: true,
    email: "ananya.trivedi@matritvaclinic.com",
    address: "Near Vastrapur Lake, Alpha One Mall Road, Vastrapur, Ahmedabad"
  },
  {
    id: "doc-6",
    name: "Dr. Vikramaditya Rathore",
    specialty: "Orthopedic",
    qualification: "MBBS, MS (Orthopedics), M.Ch (Ortho)",
    experienceYears: 18,
    location: "Ellisbridge",
    city: "Ahmedabad",
    hospitalClinic: "Shalby Orthopedic & Joint Care Institute",
    consultationFee: 900,
    availableDays: ["Mon", "Wed", "Thu", "Sat"],
    timings: "09:30 AM \u2013 1:30 PM, 4:00 PM \u2013 7:00 PM",
    contactPhone: "+91 79 2657 5500",
    languages: ["English", "Hindi", "Gujarati"],
    rating: 4.8,
    reviewsCount: 340,
    about: "Renowned orthopedic surgeon specializing in knee and hip joint replacements, sports ligament reconstructions (ACL/PCL), spinal disc problems, and osteoporosis management.",
    registrationNumber: "G-24510 (Gujarat Medical Council)",
    isAvailableToday: true,
    email: "dr.rathore@shalbyortho.in",
    address: "Opposite Karnavati Hospital, Ellisbridge, Ahmedabad"
  },
  {
    id: "doc-7",
    name: "Dr. Pooja Mehta",
    specialty: "Dentist",
    qualification: "BDS, MDS (Prosthodontics & Implantology)",
    experienceYears: 9,
    location: "Maninagar",
    city: "Ahmedabad",
    hospitalClinic: "Smile Craft Dental & Implant Center",
    consultationFee: 400,
    availableDays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
    timings: "10:00 AM \u2013 1:30 PM, 5:00 PM \u2013 9:00 PM",
    contactPhone: "+91 79 2546 8833",
    languages: ["English", "Hindi", "Gujarati"],
    rating: 4.7,
    reviewsCount: 160,
    about: "Expert dental surgeon focusing on pain-free root canals, dental implants, orthodontic aligners, smile designing, and comprehensive oral disease prevention.",
    registrationNumber: "D-12845 (Gujarat Dental Council)",
    isAvailableToday: true,
    email: "pooja.mehta@smilecraftdental.in",
    address: "1st Floor, Krishna Complex, Near Rambaug Police Station, Maninagar, Ahmedabad"
  },
  {
    id: "doc-8",
    name: "Dr. Sandeep Kothari",
    specialty: "Neurologist",
    qualification: "MBBS, MD (Medicine), DM (Neurology)",
    experienceYears: 17,
    location: "Drive-In Road",
    city: "Ahmedabad",
    hospitalClinic: "NeuroCare Brain & Spine Hospital",
    consultationFee: 1e3,
    availableDays: ["Tue", "Wed", "Thu", "Fri", "Sat"],
    timings: "11:00 AM \u2013 3:30 PM",
    contactPhone: "+91 79 2749 9900",
    languages: ["English", "Hindi", "Gujarati"],
    rating: 4.9,
    reviewsCount: 280,
    about: "Leading neurologist managing migraine and intractable headaches, epilepsy/seizures, acute stroke rehabilitation, neuropathy, Parkinson\u2019s disease, and neuro-muscular disorders.",
    registrationNumber: "G-26780 (Gujarat Medical Council)",
    isAvailableToday: true,
    email: "dr.kothari@neurocarehospital.in",
    address: "Drive-In Road, Near Himalaya Mall, Memnagar, Ahmedabad"
  },
  {
    id: "doc-9",
    name: "Dr. Ketan Barot",
    specialty: "ENT Specialist",
    qualification: "MBBS, MS (ENT), DLO",
    experienceYears: 13,
    location: "Ashram Road",
    city: "Ahmedabad",
    hospitalClinic: "Barot Ear, Nose & Throat Hospital",
    consultationFee: 500,
    availableDays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
    timings: "10:00 AM \u2013 2:00 PM, 5:30 PM \u2013 8:30 PM",
    contactPhone: "+91 79 2658 1234",
    languages: ["English", "Hindi", "Gujarati"],
    rating: 4.8,
    reviewsCount: 175,
    about: "Senior ENT and Head-Neck specialist treating chronic sinusitis, allergic nasal polyps, tinnitus, hearing loss, vertigo/dizziness, and microscopic ear surgeries.",
    registrationNumber: "G-33981 (Gujarat Medical Council)",
    isAvailableToday: true,
    email: "drketan@barotenthospital.com",
    address: "Opp. Gujarat Chamber of Commerce, Ashram Road, Ahmedabad"
  },
  {
    id: "doc-10",
    name: "Dr. Sunita Sharma",
    specialty: "Cardiologist",
    qualification: "MBBS, MD, DM (Cardiology), FESC",
    experienceYears: 20,
    location: "Bandra West",
    city: "Mumbai",
    hospitalClinic: "Lilavati Heart & Health Research Center",
    consultationFee: 1200,
    availableDays: ["Mon", "Tue", "Wed", "Fri"],
    timings: "11:00 AM \u2013 3:00 PM",
    contactPhone: "+91 22 2675 1100",
    languages: ["English", "Hindi", "Marathi"],
    rating: 4.9,
    reviewsCount: 410,
    about: "Distinguished adult cardiologist with two decades of experience in non-invasive cardiac imaging, complex valve disorders, and preventive coronary regimens.",
    registrationNumber: "M-19842 (Maharashtra Medical Council)",
    isAvailableToday: false,
    email: "dr.sunita.sharma@lilavatihospital.com",
    address: "A-791, Bandra Reclamation, Bandra West, Mumbai, Maharashtra"
  },
  {
    id: "doc-11",
    name: "Dr. Harshil Vora",
    specialty: "General Physician",
    qualification: "MBBS, MD (Medicine)",
    experienceYears: 10,
    location: "Athwa Lines",
    city: "Surat",
    hospitalClinic: "Surat Care Medical Center",
    consultationFee: 450,
    availableDays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
    timings: "09:00 AM \u2013 1:00 PM, 5:00 PM \u2013 9:00 PM",
    contactPhone: "+91 261 245 8899",
    languages: ["English", "Hindi", "Gujarati"],
    rating: 4.8,
    reviewsCount: 145,
    about: "Expert internal medicine clinician focused on diabetic care, acute seasonal viral syndromes, hypertension, and preventive health screenings for families.",
    registrationNumber: "G-43901 (Gujarat Medical Council)",
    isAvailableToday: true,
    email: "drharshil@suratcare.in",
    address: "Athwa Lines, Opp. Circuit House, Surat, Gujarat"
  },
  {
    id: "doc-12",
    name: "Dr. Bhavna Swaminathan",
    specialty: "Dermatologist",
    qualification: "MBBS, DVD, MD (Dermatology)",
    experienceYears: 14,
    location: "Indiranagar",
    city: "Bangalore",
    hospitalClinic: "Aura Skin & Hair Clinic",
    consultationFee: 750,
    availableDays: ["Mon", "Wed", "Thu", "Sat"],
    timings: "10:30 AM \u2013 2:30 PM, 6:00 PM \u2013 8:30 PM",
    contactPhone: "+91 80 2521 4400",
    languages: ["English", "Hindi", "Kannada", "Tamil"],
    rating: 4.8,
    reviewsCount: 220,
    about: "Consultant dermatologist and trichologist specializing in alopecia, autoimmune dermatoses, pigmentary disorders, and holistic skin health protocols.",
    registrationNumber: "K-27190 (Karnataka Medical Council)",
    isAvailableToday: true,
    email: "bhavna@auraskinclinic.in",
    address: "100 Feet Road, HAL 2nd Stage, Indiranagar, Bangalore, Karnataka"
  }
];
var INITIAL_SAMPLE_REMINDERS = [
  {
    id: "rem-sample-1",
    medicineName: "Paracetamol (500mg)",
    genericName: "Acetaminophen",
    dosage: "1 Tablet (500mg)",
    frequency: "Twice Daily",
    times: ["08:30", "20:30"],
    startDate: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
    instructions: "After Food",
    active: true,
    notes: "Take after breakfast and dinner for fever reduction",
    colorTag: "#0EA5E9",
    doseLogs: [],
    createdAt: Date.now() - 864e5
  },
  {
    id: "rem-sample-2",
    medicineName: "Vitamin D3 (Calcirol)",
    genericName: "Cholecalciferol",
    dosage: "1 Tablet (60,000 IU)",
    frequency: "Once Daily",
    times: ["13:00"],
    startDate: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
    instructions: "With Food",
    active: true,
    notes: "Take with lunch for bone strength",
    colorTag: "#10B981",
    doseLogs: [],
    createdAt: Date.now() - 864e5
  }
];
var SAMPLE_PRESCRIPTION_BASE64 = "data:image/svg+xml;utf8," + encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="600" height="800" viewBox="0 0 600 800" fill="none">
  <rect width="600" height="800" fill="#FFFFFF" rx="8"/>
  <rect x="20" y="20" width="560" height="760" stroke="#CBD5E1" stroke-width="2" rx="6" fill="#F8FAFC"/>
  <!-- Header -->
  <rect x="40" y="40" width="520" height="90" rx="8" fill="#0F4C81"/>
  <text x="60" y="75" fill="#FFFFFF" font-family="sans-serif" font-size="22" font-weight="bold">APOLLO HEALTH CLINIC</text>
  <text x="60" y="100" fill="#93C5FD" font-family="sans-serif" font-size="12">Dr. Amit Patel, MBBS, MD (Medicine) \u2022 Reg: G-14820</text>
  <text x="60" y="118" fill="#E2E8F0" font-family="sans-serif" font-size="11">Paldi Cross Roads, Ahmedabad \u2022 Tel: +91 79 2658 9000</text>
  
  <!-- Patient Info -->
  <rect x="40" y="145" width="520" height="60" rx="6" fill="#FFFFFF" stroke="#E2E8F0"/>
  <text x="55" y="170" fill="#64748B" font-family="sans-serif" font-size="11">Patient Name:</text>
  <text x="135" y="170" fill="#0F172A" font-family="sans-serif" font-size="13" font-weight="bold">Rahul Sharma</text>
  <text x="360" y="170" fill="#64748B" font-family="sans-serif" font-size="11">Date:</text>
  <text x="395" y="170" fill="#0F172A" font-family="sans-serif" font-size="12" font-weight="bold">21 Sep 2026</text>
  <text x="55" y="192" fill="#64748B" font-family="sans-serif" font-size="11">Age / Sex: 42 Y / Male</text>
  <text x="360" y="192" fill="#64748B" font-family="sans-serif" font-size="11">Diagnosis: Acute Upper Resp. Infection</text>
  
  <!-- Rx Symbol -->
  <text x="45" y="260" fill="#0F4C81" font-family="serif" font-size="44" font-weight="bold">\u211E</text>
  
  <!-- Med 1 -->
  <text x="100" y="250" fill="#0F172A" font-family="sans-serif" font-size="15" font-weight="bold">1. Tab. Amoxicillin + Clavulanic Acid 625mg</text>
  <text x="100" y="272" fill="#475569" font-family="sans-serif" font-size="12">Dosage: 1 tablet every 12 hours after meals (1 - 0 - 1) x 5 days</text>
  
  <!-- Med 2 -->
  <text x="100" y="320" fill="#0F172A" font-family="sans-serif" font-size="15" font-weight="bold">2. Tab. Paracetamol 650mg</text>
  <text x="100" y="342" fill="#475569" font-family="sans-serif" font-size="12">Dosage: 1 tablet SOS if fever > 100\xB0F (Max 3/day after food)</text>
  
  <!-- Med 3 -->
  <text x="100" y="390" fill="#0F172A" font-family="sans-serif" font-size="15" font-weight="bold">3. Cap. Pantoprazole 40mg</text>
  <text x="100" y="412" fill="#475569" font-family="sans-serif" font-size="12">Dosage: 1 capsule in morning on empty stomach (1 - 0 - 0) x 5 days</text>
  
  <!-- General Advice -->
  <rect x="40" y="460" width="520" height="120" rx="6" fill="#EFF6FF" stroke="#BFDBFE"/>
  <text x="55" y="485" fill="#1E40AF" font-family="sans-serif" font-size="12" font-weight="bold">Clinical Instructions & Follow-up:</text>
  <text x="55" y="510" fill="#1E3A8A" font-family="sans-serif" font-size="11">\u2022 Drink warm fluids and steam inhalation twice daily.</text>
  <text x="55" y="530" fill="#1E3A8A" font-family="sans-serif" font-size="11">\u2022 Complete entire antibiotic course without skipping doses.</text>
  <text x="55" y="550" fill="#1E3A8A" font-family="sans-serif" font-size="11">\u2022 Follow-up in clinic after 5 days if symptoms persist.</text>
  
  <!-- Signature -->
  <line x1="380" y1="710" x2="520" y2="710" stroke="#64748B" stroke-width="1.5"/>
  <text x="400" y="730" fill="#0F172A" font-family="sans-serif" font-size="12" font-weight="bold">Dr. Amit Patel</text>
  <text x="410" y="745" fill="#64748B" font-family="sans-serif" font-size="10">Consulting Physician</text>
</svg>`);

// server/repository.ts
function normalizePhone(phone) {
  if (!phone) return "";
  return phone.replace(/[^\d+]/g, "");
}
function phonesMatch(p1, p2) {
  if (!p1 || !p2) return false;
  if (p1 === p2) return true;
  const n1 = normalizePhone(p1);
  const n2 = normalizePhone(p2);
  if (n1 === n2) return true;
  const dig1 = p1.replace(/\D/g, "");
  const dig2 = p2.replace(/\D/g, "");
  if (dig1 && dig2 && dig1 === dig2) return true;
  if (dig1.length >= 10 && dig2.length >= 10 && dig1.slice(-10) === dig2.slice(-10)) {
    return true;
  }
  return false;
}
var DATA_DIR = import_path.default.join(process.cwd(), ".data");
var DATA_FILE = import_path.default.join(DATA_DIR, "pharmacare_db.json");
var JsonFileRepository = class {
  constructor() {
    this.data = this.loadData();
  }
  loadData() {
    const loaded = {
      users: {},
      reminders: {},
      prescriptions: {},
      doctors: [...SEED_DOCTORS],
      appointments: [],
      caregiverCodes: [],
      connections: [],
      alerts: [],
      devices: {},
      nudges: [],
      subscriptions: {}
    };
    try {
      if (!import_fs.default.existsSync(DATA_DIR)) {
        import_fs.default.mkdirSync(DATA_DIR, { recursive: true });
      }
      if (import_fs.default.existsSync(DATA_FILE)) {
        const raw = import_fs.default.readFileSync(DATA_FILE, "utf-8");
        const parsed = JSON.parse(raw);
        return {
          ...loaded,
          ...parsed,
          devices: parsed.devices || {},
          nudges: parsed.nudges || [],
          subscriptions: parsed.subscriptions || {}
        };
      }
    } catch (e) {
      console.warn("Could not read persistent DB file, initializing fresh:", e);
    }
    return loaded;
  }
  persist() {
    try {
      if (!import_fs.default.existsSync(DATA_DIR)) {
        import_fs.default.mkdirSync(DATA_DIR, { recursive: true });
      }
      import_fs.default.writeFileSync(DATA_FILE, JSON.stringify(this.data, null, 2), "utf-8");
    } catch (e) {
      console.error("Failed to write to persistent DB file:", e);
    }
  }
  async getUserByPhone(phone) {
    let found = null;
    if (this.data.users[phone]) {
      found = this.data.users[phone];
    } else {
      for (const key of Object.keys(this.data.users)) {
        if (phonesMatch(key, phone)) {
          found = this.data.users[key];
          break;
        }
      }
    }
    if (found) {
      const sub = await this.getSubscription(phone);
      found.plan = sub.plan;
      found.subscriptionStatus = sub.status;
      found.subscriptionExpiry = sub.expiryDate;
    }
    return found;
  }
  async saveUser(user) {
    this.data.users[user.mobile] = user;
    this.persist();
    return user;
  }
  async getReminders(phone) {
    if (this.data.reminders[phone]) {
      return this.data.reminders[phone];
    }
    for (const key of Object.keys(this.data.reminders)) {
      if (phonesMatch(key, phone)) {
        return this.data.reminders[key];
      }
    }
    this.data.reminders[phone] = [...INITIAL_SAMPLE_REMINDERS];
    this.persist();
    return this.data.reminders[phone];
  }
  async getReminderById(phone, id) {
    const list = await this.getReminders(phone);
    return list.find((r) => r.id === id) || null;
  }
  async saveReminder(phone, reminder) {
    let targetKey = phone;
    for (const key of Object.keys(this.data.reminders)) {
      if (phonesMatch(key, phone)) {
        targetKey = key;
        break;
      }
    }
    const list = await this.getReminders(targetKey);
    const idx = list.findIndex((r) => r.id === reminder.id);
    if (idx >= 0) {
      list[idx] = reminder;
    } else {
      list.unshift(reminder);
    }
    this.data.reminders[targetKey] = list;
    this.persist();
    return reminder;
  }
  async deleteReminder(phone, id) {
    let targetKey = phone;
    for (const key of Object.keys(this.data.reminders)) {
      if (phonesMatch(key, phone)) {
        targetKey = key;
        break;
      }
    }
    const list = await this.getReminders(targetKey);
    const filtered = list.filter((r) => r.id !== id);
    if (filtered.length !== list.length) {
      this.data.reminders[targetKey] = filtered;
      this.persist();
      return true;
    }
    return false;
  }
  async getPrescriptions(phone) {
    return this.data.prescriptions[phone] || [];
  }
  async savePrescription(phone, prescription) {
    if (!this.data.prescriptions[phone]) {
      this.data.prescriptions[phone] = [];
    }
    const list = this.data.prescriptions[phone];
    const idx = list.findIndex((p) => p.id === prescription.id);
    if (idx >= 0) {
      list[idx] = prescription;
    } else {
      list.unshift(prescription);
    }
    this.persist();
    return prescription;
  }
  async deletePrescription(phone, id) {
    if (!this.data.prescriptions[phone]) return false;
    const initialLen = this.data.prescriptions[phone].length;
    this.data.prescriptions[phone] = this.data.prescriptions[phone].filter((p) => p.id !== id);
    if (this.data.prescriptions[phone].length !== initialLen) {
      this.persist();
      return true;
    }
    return false;
  }
  async getDoctors() {
    return this.data.doctors;
  }
  async saveDoctor(doctor) {
    const idx = this.data.doctors.findIndex((d) => d.id === doctor.id);
    if (idx >= 0) {
      this.data.doctors[idx] = doctor;
    } else {
      this.data.doctors.unshift(doctor);
    }
    this.persist();
    return doctor;
  }
  async deleteDoctor(id) {
    const initialLen = this.data.doctors.length;
    this.data.doctors = this.data.doctors.filter((d) => d.id !== id);
    if (this.data.doctors.length !== initialLen) {
      this.persist();
      return true;
    }
    return false;
  }
  async getAppointments(phone) {
    if (phone) {
      return this.data.appointments.filter((a) => a.patientPhone === phone);
    }
    return this.data.appointments;
  }
  async saveAppointment(appointment) {
    this.data.appointments.unshift(appointment);
    this.persist();
    return appointment;
  }
  async saveCaregiverCode(record) {
    this.data.caregiverCodes = this.data.caregiverCodes.filter((c) => !phonesMatch(c.patientPhone, record.patientPhone));
    this.data.caregiverCodes.push(record);
    this.persist();
  }
  async getActiveCaregiverCode(phone) {
    const now = Date.now();
    const found = this.data.caregiverCodes.find(
      (c) => phonesMatch(c.patientPhone, phone) && !c.used && c.status === "active" && c.expiresAt > now
    );
    return found || null;
  }
  async findCaregiverCode(code) {
    const clean = code.trim();
    for (let i = this.data.caregiverCodes.length - 1; i >= 0; i--) {
      const c = this.data.caregiverCodes[i];
      if (c.code === clean || c.connectionCode === clean) {
        return c;
      }
    }
    return null;
  }
  async consumeCaregiverCode(code) {
    const clean = code.trim();
    const found = await this.findCaregiverCode(clean);
    if (!found) return null;
    const now = Date.now();
    if (found.used || found.status === "used" || now >= found.expiresAt) {
      return null;
    }
    found.used = true;
    found.status = "used";
    this.persist();
    return found;
  }
  async getConnectionsForPatient(patientPhone) {
    return this.data.connections.filter((c) => phonesMatch(c.patientPhone, patientPhone) && c.status !== "disconnected");
  }
  async getConnectionsForCaregiver(caregiverPhone) {
    return this.data.connections.filter((c) => phonesMatch(c.caregiverPhone, caregiverPhone) && c.status !== "disconnected");
  }
  async getConnectionById(id) {
    if (!id) return null;
    const byId = this.data.connections.find((c) => c.id === id || c.connectionId === id);
    if (byId) return byId;
    const activeByPhone = this.data.connections.find((c) => phonesMatch(c.patientPhone, id) && c.status === "active");
    if (activeByPhone) return activeByPhone;
    return this.data.connections.find((c) => phonesMatch(c.patientPhone, id)) || null;
  }
  async saveConnection(connection) {
    const idx = this.data.connections.findIndex((c) => c.id === connection.id);
    if (idx >= 0) {
      this.data.connections[idx] = connection;
    } else {
      this.data.connections.push(connection);
    }
    this.persist();
    return connection;
  }
  async deleteConnection(id) {
    const conn = await this.getConnectionById(id);
    if (conn) {
      conn.status = "disconnected";
      conn.updatedAt = Date.now();
      this.data.alerts = this.data.alerts.filter(
        (a) => a.connectionId !== conn.id && !phonesMatch(a.patientPhone, conn.patientPhone)
      );
      this.persist();
      return true;
    }
    return false;
  }
  async getAlertsForCaregiver(caregiverPhone) {
    return this.data.alerts.filter((a) => a.caregiverPhone === caregiverPhone);
  }
  async saveAlert(alert) {
    const idx = this.data.alerts.findIndex(
      (a) => a.connectionId === alert.connectionId && a.reminderId === alert.reminderId && a.date === alert.date && a.scheduledTime === alert.scheduledTime
    );
    if (idx >= 0) {
      this.data.alerts[idx] = alert;
    } else {
      this.data.alerts.unshift(alert);
    }
    this.persist();
    return alert;
  }
  async resolveAlertsForDose(patientPhone, reminderId, date, time) {
    let changed = false;
    this.data.alerts.forEach((a) => {
      if (a.patientPhone === patientPhone && a.reminderId === reminderId && a.date === date && a.scheduledTime === time) {
        a.status = "taken";
        a.confirmedLater = true;
        a.confirmedAt = Date.now();
        changed = true;
      }
    });
    if (changed) {
      this.persist();
    }
  }
  async getAllActiveConnections() {
    return this.data.connections.filter((c) => c.status === "active");
  }
  // Cross-Connected Device Registry
  async registerDevice(device) {
    const now = Date.now();
    const updated = {
      ...device,
      isOnline: true,
      lastSeen: now
    };
    this.data.devices[device.deviceId] = updated;
    this.persist();
    return updated;
  }
  async updateDeviceHeartbeat(deviceId, userPhone) {
    const dev = this.data.devices[deviceId];
    if (dev) {
      dev.lastSeen = Date.now();
      dev.isOnline = true;
      if (userPhone && !dev.userPhone) {
        dev.userPhone = userPhone;
      }
      this.persist();
      return true;
    }
    return false;
  }
  async getDevicesForUser(phone) {
    const list = [];
    const now = Date.now();
    const ONLINE_THRESHOLD = 75e3;
    for (const d of Object.values(this.data.devices)) {
      if (phonesMatch(d.userPhone, phone)) {
        const isOnline = now - d.lastSeen < ONLINE_THRESHOLD;
        list.push({
          ...d,
          isOnline
        });
      }
    }
    return list;
  }
  async getCrossConnectedDevices(userPhone) {
    const myDevices = await this.getDevicesForUser(userPhone);
    const asPatient = await this.getConnectionsForPatient(userPhone);
    const asCaregiver = await this.getConnectionsForCaregiver(userPhone);
    const allConns = [...asPatient, ...asCaregiver];
    const connectedMembers = [];
    const seenConns = /* @__PURE__ */ new Set();
    for (const c of allConns) {
      if (seenConns.has(c.id)) continue;
      seenConns.add(c.id);
      const isMeThePatient = phonesMatch(c.patientPhone, userPhone);
      const partnerPhone = isMeThePatient ? c.caregiverPhone : c.patientPhone;
      const partnerDevices = await this.getDevicesForUser(partnerPhone);
      connectedMembers.push({
        connectionId: c.id,
        patientName: c.patientName,
        patientPhone: c.patientPhone,
        caregiverName: c.caregiverName,
        caregiverPhone: c.caregiverPhone,
        status: c.status,
        devices: partnerDevices
      });
    }
    return {
      myDevices,
      connectedMembers
    };
  }
  async saveNudge(nudge) {
    this.data.nudges.unshift(nudge);
    if (this.data.nudges.length > 200) {
      this.data.nudges = this.data.nudges.slice(0, 200);
    }
    this.persist();
    return nudge;
  }
  async getNudgesForUser(phone) {
    return this.data.nudges.filter((n) => phonesMatch(n.toPhone, phone) || phonesMatch(n.fromPhone, phone));
  }
  // Subscription Management
  async getSubscription(phone) {
    if (!phone) {
      return {
        userId: "guest",
        phone: "",
        plan: "free",
        status: "none",
        startDate: null,
        expiryDate: null,
        billingCycle: null,
        paymentStatus: "none",
        autoRenew: false,
        updatedAt: Date.now()
      };
    }
    let foundSub = null;
    let foundKey = null;
    if (!this.data.subscriptions) {
      this.data.subscriptions = {};
    }
    for (const [key, sub] of Object.entries(this.data.subscriptions)) {
      if (phonesMatch(key, phone) || sub?.phone && phonesMatch(sub.phone, phone)) {
        foundSub = sub;
        foundKey = key;
        break;
      }
    }
    if (foundSub) {
      if (foundSub.plan === "premium" && foundSub.expiryDate && foundSub.expiryDate < Date.now()) {
        foundSub.status = "expired";
        foundSub.plan = "free";
        foundSub.autoRenew = false;
        foundSub.updatedAt = Date.now();
        this.persist();
      }
      return foundSub;
    }
    const defaultSub = {
      userId: phone,
      phone,
      plan: "free",
      status: "none",
      startDate: null,
      expiryDate: null,
      billingCycle: null,
      paymentStatus: "none",
      autoRenew: false,
      updatedAt: Date.now()
    };
    this.data.subscriptions[phone] = defaultSub;
    this.persist();
    return defaultSub;
  }
  async saveSubscription(subscription) {
    if (!this.data.subscriptions) {
      this.data.subscriptions = {};
    }
    let targetKey = subscription.phone;
    for (const key of Object.keys(this.data.subscriptions)) {
      if (phonesMatch(key, subscription.phone)) {
        targetKey = key;
        break;
      }
    }
    const updatedSub = {
      ...subscription,
      updatedAt: Date.now()
    };
    this.data.subscriptions[targetKey] = updatedSub;
    const user = await this.getUserByPhone(subscription.phone);
    if (user) {
      user.plan = updatedSub.plan;
      user.subscriptionStatus = updatedSub.status;
      user.subscriptionExpiry = updatedSub.expiryDate;
      await this.saveUser(user);
    }
    this.persist();
    return updatedSub;
  }
  async cancelSubscription(phone) {
    const sub = await this.getSubscription(phone);
    sub.status = "cancelled";
    sub.plan = "free";
    sub.autoRenew = false;
    sub.updatedAt = Date.now();
    await this.saveSubscription(sub);
    return sub;
  }
  async checkPlanLimits(phone) {
    const sub = await this.getSubscription(phone);
    const isPremium = sub.plan === "premium" && sub.status === "active" && (!sub.expiryDate || sub.expiryDate > Date.now());
    const remindersList = await this.getReminders(phone);
    const activeRemindersCount = remindersList.filter((r) => r.active).length;
    const prescriptionsList = await this.getPrescriptions(phone);
    const activePrescriptionsCount = prescriptionsList.length;
    const connectionsList = await this.getConnectionsForPatient(phone);
    const activeCaregiversCount = connectionsList.filter((c) => c.status === "active").length;
    if (isPremium) {
      return {
        reminders: {
          max: null,
          current: activeRemindersCount,
          canAdd: true
        },
        prescriptions: {
          max: null,
          current: activePrescriptionsCount,
          canAdd: true
        },
        caregivers: {
          max: null,
          current: activeCaregiversCount,
          canAdd: true
        }
      };
    }
    return {
      reminders: {
        max: 3,
        current: activeRemindersCount,
        canAdd: activeRemindersCount < 3
      },
      prescriptions: {
        max: 3,
        current: activePrescriptionsCount,
        canAdd: activePrescriptionsCount < 3
      },
      caregivers: {
        max: 1,
        current: activeCaregiversCount,
        canAdd: activeCaregiversCount < 1
      }
    };
  }
};
var repository = new JsonFileRepository();

// server/crossDeviceHub.ts
var import_events = require("events");
var CrossDeviceHub = class extends import_events.EventEmitter {
  constructor() {
    super();
    this.clients = /* @__PURE__ */ new Map();
    this.heartbeatTimer = null;
    this.startHeartbeat();
  }
  startHeartbeat() {
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
    this.heartbeatTimer = setInterval(() => {
      const now = Date.now();
      for (const client of this.clients.values()) {
        try {
          client.res.write(`event: heartbeat
data: ${JSON.stringify({ timestamp: now })}

`);
        } catch {
          this.removeClient(client.id);
        }
      }
    }, 25e3);
  }
  addClient(id, userPhone, deviceId, res) {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");
    res.flushHeaders?.();
    const client = {
      id,
      userPhone,
      deviceId,
      res,
      connectedAt: Date.now()
    };
    this.clients.set(id, client);
    res.write(`event: init
data: ${JSON.stringify({ status: "connected", clientId: id, timestamp: Date.now() })}

`);
    res.on("close", () => {
      this.removeClient(id);
    });
  }
  removeClient(id) {
    this.clients.delete(id);
  }
  getClientsForPhone(phone) {
    const list = [];
    for (const client of this.clients.values()) {
      if (phonesMatch(client.userPhone, phone)) {
        list.push(client);
      }
    }
    return list;
  }
  /**
   * Broadcast an event to all connected devices for a specific phone number
   */
  sendToPhone(targetPhone, type, payload) {
    const targets = this.getClientsForPhone(targetPhone);
    const data = JSON.stringify({ type, payload, timestamp: Date.now() });
    for (const client of targets) {
      try {
        client.res.write(`event: ${type}
data: ${data}

`);
      } catch {
        this.removeClient(client.id);
      }
    }
  }
  /**
   * Broadcast to both parties of a cross-device connection (e.g. Patient & Caregiver)
   */
  broadcastToPartners(phones, type, payload) {
    phones.forEach((phone) => this.sendToPhone(phone, type, payload));
  }
  /**
   * Notify caregiver devices that a dose was taken / skipped by the patient
   */
  notifyDoseLogged(patientPhone, caregiverPhones, reminder, doseTime, status) {
    const payload = {
      patientPhone,
      reminderId: reminder.id,
      medicineName: reminder.medicineName,
      time: doseTime,
      status,
      timestamp: Date.now(),
      reminder
    };
    caregiverPhones.forEach((cgPhone) => this.sendToPhone(cgPhone, "dose_logged", payload));
  }
  /**
   * Notify caregiver devices that patient updated their reminder schedules
   */
  notifyRemindersUpdated(patientPhone, caregiverPhones, reminders) {
    const payload = {
      patientPhone,
      reminders,
      timestamp: Date.now()
    };
    caregiverPhones.forEach((cgPhone) => this.sendToPhone(cgPhone, "reminders_updated", payload));
  }
  /**
   * Notify caregiver devices of a missed dose alert
   */
  notifyMissedDoseAlert(caregiverPhone, alert) {
    this.sendToPhone(caregiverPhone, "missed_dose_alert", alert);
  }
  /**
   * Notify patient device of a gentle reminder nudge sent by a caregiver
   */
  notifyCaregiverNudge(patientPhone, nudge) {
    this.sendToPhone(patientPhone, "device_nudge", nudge);
  }
  /**
   * Notify both devices that pairing succeeded
   */
  notifyConnectionEstablished(conn) {
    this.sendToPhone(conn.patientPhone, "device_linked", conn);
    this.sendToPhone(conn.caregiverPhone, "device_linked", conn);
  }
  /**
   * Notify both devices that pairing was revoked
   */
  notifyConnectionRevoked(patientPhone, caregiverPhone, connectionId) {
    const payload = { connectionId, timestamp: Date.now() };
    this.sendToPhone(patientPhone, "device_unlinked", payload);
    this.sendToPhone(caregiverPhone, "device_unlinked", payload);
  }
  /**
   * Emergency SOS from patient to all caregivers
   */
  notifyEmergencySos(patientPhone, patientName, caregiverPhones, location) {
    const payload = {
      patientPhone,
      patientName,
      location,
      timestamp: Date.now()
    };
    caregiverPhones.forEach((cgPhone) => this.sendToPhone(cgPhone, "emergency_sos", payload));
  }
};
var crossDeviceHub = new CrossDeviceHub();

// server/watchdog.ts
var MissedDoseWatchdog = class {
  constructor() {
    this.timer = null;
    this.intervalMs = 3e4;
  }
  // 30 seconds
  start() {
    if (this.timer) return;
    console.log("[Watchdog] Missed-dose monitoring watchdog started (interval: 30s)");
    this.timer = setInterval(() => this.checkMissedDoses(), this.intervalMs);
  }
  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
      console.log("[Watchdog] Missed-dose monitoring watchdog stopped");
    }
  }
  async checkMissedDoses() {
    try {
      const activeConnections = await repository.getAllActiveConnections();
      if (activeConnections.length === 0) return;
      for (const conn of activeConnections) {
        if (!conn.permissions.unconfirmedAlerts) continue;
        const patient = await repository.getUserByPhone(conn.patientPhone);
        const patientTz = patient?.timezone || "Asia/Kolkata";
        const gracePeriod = patient?.reminderGracePeriodMinutes || 30;
        const nowInPatientTz = new Date((/* @__PURE__ */ new Date()).toLocaleString("en-US", { timeZone: patientTz }));
        const currentYear = nowInPatientTz.getFullYear();
        const currentMonth = String(nowInPatientTz.getMonth() + 1).padStart(2, "0");
        const currentDay = String(nowInPatientTz.getDate()).padStart(2, "0");
        const todayDateStr = `${currentYear}-${currentMonth}-${currentDay}`;
        const currentTotalMinutes = nowInPatientTz.getHours() * 60 + nowInPatientTz.getMinutes();
        const reminders = await repository.getReminders(conn.patientPhone);
        for (const rem of reminders) {
          if (!rem.active) continue;
          if (rem.startDate && todayDateStr < rem.startDate) continue;
          if (rem.endDate && todayDateStr > rem.endDate) continue;
          for (const doseTime of rem.times) {
            const [h, m] = doseTime.split(":").map(Number);
            const scheduledTotalMinutes = h * 60 + m;
            const overdueThresholdMinutes = scheduledTotalMinutes + gracePeriod;
            if (currentTotalMinutes >= overdueThresholdMinutes && currentTotalMinutes - scheduledTotalMinutes <= 360) {
              const isLogged = rem.doseLogs.some(
                (log) => log.date === todayDateStr && log.time === doseTime && (log.status === "taken" || log.status === "skipped")
              );
              if (!isLogged) {
                const existingAlerts = await repository.getAlertsForCaregiver(conn.caregiverPhone);
                const alreadyAlerted = existingAlerts.some(
                  (a) => a.connectionId === conn.id && a.reminderId === rem.id && a.date === todayDateStr && a.scheduledTime === doseTime
                );
                if (!alreadyAlerted) {
                  const newAlert = {
                    id: `alert-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                    connectionId: conn.id,
                    patientPhone: conn.patientPhone,
                    patientName: conn.patientName,
                    caregiverPhone: conn.caregiverPhone,
                    reminderId: rem.id,
                    medicineName: conn.permissions.medicineName ? rem.medicineName : "Scheduled Medication",
                    dosage: conn.permissions.medicineName ? rem.dosage : "Prescribed Dose",
                    scheduledTime: conn.permissions.scheduledTime ? doseTime : "Scheduled Time",
                    date: todayDateStr,
                    status: "dose_not_confirmed",
                    alertGeneratedAt: Date.now(),
                    confirmedLater: false,
                    notificationDelivered: false
                  };
                  await repository.saveAlert(newAlert);
                  crossDeviceHub.notifyMissedDoseAlert(conn.caregiverPhone, newAlert);
                  console.log(`[Watchdog] Generated missed dose alert for caregiver ${conn.caregiverPhone} (Patient: ${conn.patientName}, Med: ${rem.medicineName})`);
                }
              }
            }
          }
        }
      }
    } catch (err) {
      console.error("[Watchdog] Error running checkMissedDoses:", err);
    }
  }
};
var watchdog = new MissedDoseWatchdog();

// server/gemini.ts
var import_genai = require("@google/genai");
var aiClient = null;
function getAiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  if (!aiClient) {
    aiClient = new import_genai.GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build"
        }
      }
    });
  }
  return aiClient;
}
var SYSTEM_INSTRUCTION = `You are PharmaCare AI Health Assistant, a professional, empathetic digital pharmacy and clinical pharmacology reference companion.

CLINICAL GUARDRAILS & SAFETY RULES:
1. Purely Educational: Provide verified educational pharmacology information only. Never diagnose medical conditions, never formulate clinical treatment plans, and never tell patients to alter or halt prescribed dosages without consulting their registered doctor or pharmacist.
2. Structure Answers: For medication queries, clearly explain:
   - What the medicine is and its primary clinical uses
   - How to take it safely (food interactions, timing)
   - Common side effects and essential precautions
   - Proper storage guidelines (temperature, moisture avoidance)
3. Red Flags & Emergencies: If the user mentions acute red flag symptoms (severe chest pain, breathing distress, sudden weakness or facial drooping, severe anaphylaxis, allergic swelling, or severe overdose), urgently instruct them to call India National Emergency 112 / 108 immediately or head to the nearest hospital casualty emergency room.
4. Format: Mobile-friendly formatting using concise paragraphs, clean bullet points, and **bold** highlights.
5. End every response with a concise 1-sentence reminder to consult their healthcare provider.`;
async function askGemini(message, previousMessages = []) {
  const ai = getAiClient();
  if (!ai) {
    throw new Error("GEMINI_API_KEY is not configured on the server. Please configure it in your environment settings.");
  }
  const configuredModel = process.env.GEMINI_MODEL;
  const modelsToTry = configuredModel ? [configuredModel, "gemini-3.1-flash-lite", "gemini-flash-latest", "gemini-3.8-flash"] : ["gemini-3.1-flash-lite", "gemini-flash-latest", "gemini-3.8-flash"];
  const contents = [];
  const recent = previousMessages.slice(-4);
  for (const m of recent) {
    contents.push({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.text }]
    });
  }
  contents.push({
    role: "user",
    parts: [{ text: message }]
  });
  let lastError = null;
  for (const model of modelsToTry) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents,
          config: {
            systemInstruction: SYSTEM_INSTRUCTION,
            temperature: 0.7
          }
        });
        const reply = response.text || "I apologize, but I could not generate a response at this moment.";
        return {
          reply,
          disclaimer: "PharmaCare Clinical AI Reference Notice: Information provided is for educational guidance only and does not substitute professional medical advice, diagnosis, or treatment.",
          modelUsed: model
        };
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        const errMsg = lastError.message || "";
        const isTransient = errMsg.includes("503") || errMsg.includes("high demand") || errMsg.includes("429");
        if (isTransient && attempt === 0) {
          await new Promise((r) => setTimeout(r, 600));
          continue;
        }
        break;
      }
    }
  }
  return {
    reply: `### Medication & Health Guidance

I apologize, our cloud AI pharmacology service is currently experiencing high network demand. Here is essential health safety guidance for your query:

- **Consult Your Pharmacist or Doctor**: For specific medication questions, dosages, and interactions, please consult your registered healthcare provider or nearby pharmacist.
- **Read Package Inserts**: Always refer to the dosage instructions printed on your medicine strip or packaging.
- **Emergency Situations**: If you or your family member are experiencing acute symptoms, breathing difficulty, or adverse drug reactions, call **112** or **108** immediately.`,
    disclaimer: "PharmaCare Clinical AI Notice: Temporary service load. Information provided is for educational guidance only.",
    modelUsed: "offline-safety-fallback"
  };
}

// server.ts
var PORT = 3e3;
var SESSION_SECRET = process.env.SESSION_SECRET || "pharmacare_super_secure_jwt_secret_key_2026";
var ALLOW_TEST_OTP = process.env.ALLOW_TEST_OTP !== "false";
var otpStore = /* @__PURE__ */ new Map();
var otpRateLimit = /* @__PURE__ */ new Map();
function generateRandom6Digits() {
  return Math.floor(1e5 + Math.random() * 9e5).toString();
}
function parseTimeToMinutes(t) {
  if (!t) return 0;
  const match = t.trim().match(/^(\d{1,2}):(\d{2})(?:\s*(AM|PM))?$/i);
  if (!match) return 0;
  let h = parseInt(match[1], 10);
  const m = parseInt(match[2], 10);
  const meridiem = match[3]?.toUpperCase();
  if (meridiem === "PM" && h < 12) h += 12;
  if (meridiem === "AM" && h === 12) h = 0;
  return h * 60 + m;
}
function formatTimeDisplay(t) {
  if (!t) return "";
  const match = t.trim().match(/^(\d{1,2}):(\d{2})(?:\s*(AM|PM))?$/i);
  if (!match) return t;
  let h = parseInt(match[1], 10);
  const m = match[2];
  let meridiem = match[3]?.toUpperCase();
  if (!meridiem) {
    meridiem = h >= 12 ? "PM" : "AM";
    h = h % 12 || 12;
  }
  return `${h}:${m} ${meridiem}`;
}
async function startServer() {
  const app = (0, import_express.default)();
  app.use((0, import_cors.default)({
    origin: (_origin, callback) => {
      callback(null, true);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization", "Accept", "X-Requested-With", "X-User-Phone", "X-User-Name"],
    exposedHeaders: ["Content-Type", "Authorization"]
  }));
  app.options("*", (0, import_cors.default)());
  app.use(import_express.default.json({ limit: "20mb" }));
  app.use(import_express.default.urlencoded({ extended: true, limit: "20mb" }));
  const requireAuth = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    let token = authHeader && authHeader.startsWith("Bearer ") ? authHeader.substring(7) : "";
    if (token) {
      try {
        const decoded = import_jsonwebtoken.default.verify(token, SESSION_SECRET);
        if (decoded?.phone) {
          req.userPhone = decoded.phone;
          req.userName = decoded.name || "User";
          return next();
        }
      } catch {
      }
    }
    const phoneHeader = req.headers["x-user-phone"] || req.headers["x-phone"] || req.body?.patientPhone || req.body?.phone;
    const nameHeader = req.headers["x-user-name"] || req.headers["x-name"] || req.body?.patientName || req.body?.name;
    if (phoneHeader && typeof phoneHeader === "string" && phoneHeader.trim()) {
      const cleanPhone = phoneHeader.trim();
      req.userPhone = cleanPhone;
      req.userName = nameHeader && typeof nameHeader === "string" ? nameHeader.trim() : "User";
      return next();
    }
    res.status(401).json({
      success: false,
      error: "UNAUTHORIZED",
      message: "Authentication required. Please sign in again."
    });
  };
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: Date.now() });
  });
  app.get("/api/backend/status", async (req, res) => {
    try {
      const doctors = await repository.getDoctors();
      const conns = await repository.getAllActiveConnections();
      res.json({
        status: "healthy",
        version: "1.0.0",
        database: "Persistent Repository Layer (File-Backed JSON)",
        remindersCount: 0,
        prescriptionsCount: 0,
        appointmentsCount: (await repository.getAppointments()).length,
        doctorsCount: doctors.length,
        activeCaregiverConnections: conns.length,
        testOtpAllowed: ALLOW_TEST_OTP
      });
    } catch (err) {
      res.status(500).json({ error: "Status check failed" });
    }
  });
  app.post("/api/auth/send-otp", (req, res) => {
    const phone = req.body.phone || req.body.mobile;
    if (!phone || typeof phone !== "string" || phone.replace(/\D/g, "").length < 7) {
      res.status(400).json({ error: "Please provide a valid mobile number (at least 7 digits)." });
      return;
    }
    const cleanPhone = phone.trim();
    const now = Date.now();
    const rate = otpRateLimit.get(cleanPhone) || { count: 0, resetAt: now + 6e5 };
    if (now > rate.resetAt) {
      rate.count = 0;
      rate.resetAt = now + 6e5;
    }
    if (rate.count >= 5) {
      res.status(429).json({ error: "Too many OTP requests. Please wait a few minutes before trying again." });
      return;
    }
    rate.count++;
    otpRateLimit.set(cleanPhone, rate);
    const otpCode = generateRandom6Digits();
    otpStore.set(cleanPhone, {
      code: otpCode,
      expiresAt: now + 5 * 60 * 1e3,
      // 5 minutes
      attempts: 0
    });
    res.json({
      success: true,
      message: "OTP sent successfully",
      testOtp: ALLOW_TEST_OTP ? "123456" : void 0
    });
  });
  app.post("/api/auth/verify-otp", async (req, res) => {
    const phone = req.body.phone || req.body.mobile;
    const otp = req.body.otp || req.body.code;
    const { name } = req.body;
    if (!phone || !otp) {
      res.status(400).json({ error: "Phone and OTP are required" });
      return;
    }
    const cleanPhone = phone.trim();
    const cleanOtp = String(otp).trim();
    const now = Date.now();
    const stored = otpStore.get(cleanPhone);
    const isTestOtpValid = ALLOW_TEST_OTP && cleanOtp === "123456";
    const isRealOtpValid = stored && stored.code === cleanOtp && stored.expiresAt > now;
    if (!isTestOtpValid && !isRealOtpValid) {
      if (stored) {
        stored.attempts++;
      }
      res.status(400).json({ error: "Invalid or expired OTP code. Please try again." });
      return;
    }
    otpStore.delete(cleanPhone);
    let user = await repository.getUserByPhone(cleanPhone);
    if (!user) {
      user = {
        mobile: cleanPhone,
        name: name?.trim() || "Friend",
        email: "",
        bloodGroup: "O+",
        allergies: "",
        emergencyContactName: "",
        emergencyContactPhone: "",
        isLoggedIn: true,
        preferredLanguage: "en",
        role: "myself",
        reminderGracePeriodMinutes: 30,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Kolkata"
      };
      await repository.saveUser(user);
    } else if (name && name.trim()) {
      user.name = name.trim();
      await repository.saveUser(user);
    }
    const token = import_jsonwebtoken.default.sign(
      { phone: user.mobile, name: user.name },
      SESSION_SECRET,
      { expiresIn: "30d" }
    );
    res.json({
      success: true,
      token,
      user
    });
  });
  app.get("/api/user/profile", requireAuth, async (req, res) => {
    const user = await repository.getUserByPhone(req.userPhone);
    if (!user) {
      res.status(404).json({ error: "User profile not found" });
      return;
    }
    res.json(user);
  });
  app.put("/api/user/profile", requireAuth, async (req, res) => {
    const existing = await repository.getUserByPhone(req.userPhone);
    const updated = {
      ...existing,
      ...req.body,
      mobile: req.userPhone,
      isLoggedIn: true
    };
    await repository.saveUser(updated);
    res.json(updated);
  });
  app.get("/api/reminders", requireAuth, async (req, res) => {
    const list = await repository.getReminders(req.userPhone);
    res.json(list);
  });
  app.post("/api/reminders", requireAuth, async (req, res) => {
    if (!req.body.id) {
      const limits = await repository.checkPlanLimits(req.userPhone);
      if (!limits.reminders.canAdd) {
        res.status(403).json({
          success: false,
          error: "PLAN_LIMIT_REACHED",
          message: "Free plan limit reached. Upgrade to Premium for unlimited medicine reminders.",
          limit: limits.reminders.max,
          currentCount: limits.reminders.current,
          feature: "reminders"
        });
        return;
      }
    }
    const reminder = {
      id: req.body.id || `rem-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      userId: req.userPhone,
      ownerUserId: req.userPhone,
      medicineName: req.body.medicineName,
      genericName: req.body.genericName,
      dosage: req.body.dosage,
      frequency: req.body.frequency || "Once Daily",
      times: req.body.times || ["09:00"],
      startDate: req.body.startDate || (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
      endDate: req.body.endDate,
      instructions: req.body.instructions || "After Food",
      active: req.body.active !== false,
      notes: req.body.notes || "",
      colorTag: req.body.colorTag || "#0EA5E9",
      doseLogs: req.body.doseLogs || [],
      createdAt: Date.now()
    };
    await repository.saveReminder(req.userPhone, reminder);
    const activeConns = await repository.getConnectionsForPatient(req.userPhone);
    const caregiverPhones = activeConns.filter((c) => c.status === "active").map((c) => c.caregiverPhone);
    if (caregiverPhones.length > 0) {
      const allReminders = await repository.getReminders(req.userPhone);
      crossDeviceHub.notifyRemindersUpdated(req.userPhone, caregiverPhones, allReminders);
    }
    res.json(reminder);
  });
  app.put("/api/reminders/:id", requireAuth, async (req, res) => {
    const existing = await repository.getReminderById(req.userPhone, req.params.id);
    const updated = {
      ...existing || {},
      medicineName: req.body.medicineName || existing?.medicineName || "Medicine",
      genericName: req.body.genericName !== void 0 ? req.body.genericName : existing?.genericName,
      dosage: req.body.dosage || existing?.dosage || "1 tablet",
      frequency: req.body.frequency || existing?.frequency || "Once Daily",
      times: req.body.times || existing?.times || ["09:00"],
      startDate: req.body.startDate || existing?.startDate || (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
      endDate: req.body.endDate !== void 0 ? req.body.endDate : existing?.endDate,
      instructions: req.body.instructions || existing?.instructions || "After Food",
      active: req.body.active !== void 0 ? req.body.active : existing ? existing.active : true,
      notes: req.body.notes !== void 0 ? req.body.notes : existing?.notes || "",
      colorTag: req.body.colorTag || existing?.colorTag || "#0EA5E9",
      doseLogs: req.body.doseLogs || existing?.doseLogs || [],
      ...req.body,
      id: req.params.id,
      userId: req.userPhone,
      ownerUserId: req.userPhone,
      createdAt: existing?.createdAt || req.body.createdAt || Date.now()
    };
    await repository.saveReminder(req.userPhone, updated);
    const activeConns = await repository.getConnectionsForPatient(req.userPhone);
    const caregiverPhones = activeConns.filter((c) => c.status === "active").map((c) => c.caregiverPhone);
    if (caregiverPhones.length > 0) {
      const allReminders = await repository.getReminders(req.userPhone);
      crossDeviceHub.notifyRemindersUpdated(req.userPhone, caregiverPhones, allReminders);
    }
    res.json(updated);
  });
  app.delete("/api/reminders/:id", requireAuth, async (req, res) => {
    const success = await repository.deleteReminder(req.userPhone, req.params.id);
    if (!success) {
      res.status(404).json({ error: "Reminder not found" });
      return;
    }
    const activeConns = await repository.getConnectionsForPatient(req.userPhone);
    const caregiverPhones = activeConns.filter((c) => c.status === "active").map((c) => c.caregiverPhone);
    if (caregiverPhones.length > 0) {
      const allReminders = await repository.getReminders(req.userPhone);
      crossDeviceHub.notifyRemindersUpdated(req.userPhone, caregiverPhones, allReminders);
    }
    res.json({ success: true });
  });
  app.post("/api/reminders/:id/dose", requireAuth, async (req, res) => {
    const { date, time, status } = req.body;
    const reminder = await repository.getReminderById(req.userPhone, req.params.id);
    if (!reminder) {
      res.status(404).json({ error: "Reminder not found" });
      return;
    }
    const logIdx = reminder.doseLogs.findIndex((l) => l.date === date && l.time === time);
    const newLog = { date, time, status, timestamp: Date.now() };
    if (logIdx >= 0) {
      reminder.doseLogs[logIdx] = newLog;
    } else {
      reminder.doseLogs.push(newLog);
    }
    await repository.saveReminder(req.userPhone, reminder);
    if (status === "taken") {
      await repository.resolveAlertsForDose(req.userPhone, reminder.id, date, time);
    }
    const activeConns = await repository.getConnectionsForPatient(req.userPhone);
    const caregiverPhones = activeConns.filter((c) => c.status === "active").map((c) => c.caregiverPhone);
    if (caregiverPhones.length > 0) {
      crossDeviceHub.notifyDoseLogged(req.userPhone, caregiverPhones, reminder, time, status);
    }
    res.json({ success: true, ...reminder, reminder });
  });
  app.get("/api/prescriptions", requireAuth, async (req, res) => {
    const list = await repository.getPrescriptions(req.userPhone);
    res.json(list);
  });
  app.post("/api/upload", requireAuth, async (req, res) => {
    const limits = await repository.checkPlanLimits(req.userPhone);
    if (!limits.prescriptions.canAdd) {
      res.status(403).json({
        success: false,
        error: "PLAN_LIMIT_REACHED",
        message: "Free plan limit reached. Upgrade to Premium for unlimited prescriptions.",
        limit: limits.prescriptions.max,
        currentCount: limits.prescriptions.current,
        feature: "prescriptions"
      });
      return;
    }
    const { patientName, doctorName, clinicName, fileDataUrl, fileName, fileType, fileSize, notes } = req.body;
    if (!patientName || !doctorName) {
      res.status(400).json({ error: "Patient name and Doctor name are required." });
      return;
    }
    if (!fileDataUrl) {
      res.status(400).json({ error: "Prescription document is required." });
      return;
    }
    const prescription = {
      id: `rx-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      userId: req.userPhone,
      patientName,
      doctorName,
      clinicName,
      date: (/* @__PURE__ */ new Date()).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
      fileDataUrl,
      fileName: fileName || "Prescription_Document.pdf",
      fileType: fileType || "image",
      fileSize: fileSize || "350 KB",
      status: "Uploaded",
      notes: notes || "",
      uploadedAt: Date.now()
    };
    await repository.savePrescription(req.userPhone, prescription);
    res.json(prescription);
  });
  app.delete("/api/prescriptions/:id", requireAuth, async (req, res) => {
    const success = await repository.deletePrescription(req.userPhone, req.params.id);
    if (!success) {
      res.status(404).json({ error: "Prescription not found" });
      return;
    }
    res.json({ success: true });
  });
  app.get("/api/doctors", async (req, res) => {
    const docs = await repository.getDoctors();
    res.json(docs);
  });
  app.post("/api/doctors", requireAuth, async (req, res) => {
    const doctor = {
      id: `doc-custom-${Date.now()}`,
      name: req.body.name,
      specialty: req.body.specialty || "General Physician",
      qualification: req.body.qualification || "MBBS",
      experienceYears: Number(req.body.experienceYears) || 5,
      location: req.body.location || "Ahmedabad",
      city: req.body.city || "Ahmedabad",
      hospitalClinic: req.body.hospitalClinic || "Private Clinic",
      consultationFee: Number(req.body.consultationFee) || 500,
      availableDays: req.body.availableDays || ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
      timings: req.body.timings || "10:00 AM \u2013 2:00 PM, 5:00 PM \u2013 8:00 PM",
      contactPhone: req.body.contactPhone || "",
      languages: req.body.languages || ["English", "Hindi", "Gujarati"],
      rating: 5,
      reviewsCount: 1,
      about: req.body.about || "Consultant Specialist",
      registrationNumber: req.body.registrationNumber || "GMC-Registered",
      isAvailableToday: true,
      isCustom: true,
      email: req.body.email,
      address: req.body.address,
      notes: req.body.notes,
      photoUrl: req.body.photoUrl
    };
    await repository.saveDoctor(doctor);
    res.json(doctor);
  });
  app.delete("/api/doctors/:id", requireAuth, async (req, res) => {
    const success = await repository.deleteDoctor(req.params.id);
    if (!success) {
      res.status(404).json({ error: "Doctor not found" });
      return;
    }
    res.json({ success: true });
  });
  app.get("/api/appointments", requireAuth, async (req, res) => {
    const list = await repository.getAppointments(req.userPhone);
    res.json(list);
  });
  app.post("/api/appointments", requireAuth, async (req, res) => {
    const user = await repository.getUserByPhone(req.userPhone);
    const appointment = {
      id: `apt-${Date.now()}`,
      bookingRef: `PC-${Math.floor(1e5 + Math.random() * 9e5)}`,
      doctorId: req.body.doctorId,
      doctorName: req.body.doctorName,
      doctorSpecialty: req.body.doctorSpecialty,
      hospitalClinic: req.body.hospitalClinic,
      patientName: user?.name || req.body.patientName || "Patient",
      patientPhone: req.userPhone,
      day: req.body.day || "Today",
      timeSlot: req.body.timeSlot || "11:00 AM",
      consultationFee: Number(req.body.consultationFee) || 500,
      status: "Confirmed",
      createdAt: Date.now()
    };
    await repository.saveAppointment(appointment);
    res.json(appointment);
  });
  app.post("/api/caregiver/code/generate", requireAuth, async (req, res) => {
    try {
      const phone = req.userPhone;
      if (!phone) {
        res.status(400).json({ success: false, error: "User phone is required to generate connection code." });
        return;
      }
      let user = await repository.getUserByPhone(phone);
      if (!user) {
        user = {
          id: `user_${phone.replace(/\D/g, "") || Date.now()}`,
          mobile: phone,
          name: req.userName || "Patient",
          email: "",
          bloodGroup: "O+",
          allergies: "",
          emergencyContactName: "",
          emergencyContactPhone: "",
          isLoggedIn: true,
          preferredLanguage: "en",
          role: "myself",
          mode: "myself",
          reminderGracePeriodMinutes: 30,
          timezone: "Asia/Kolkata"
        };
        await repository.saveUser(user);
      }
      const patientName = user?.name || req.userName || "Patient";
      let code = generateRandom6Digits();
      let attempts = 0;
      while (attempts < 10) {
        const existing = await repository.findCaregiverCode(code);
        if (!existing || existing.used || existing.status !== "active" || existing.expiresAt <= Date.now()) {
          break;
        }
        code = generateRandom6Digits();
        attempts++;
      }
      const now = Date.now();
      const expiresAt = now + 4 * 60 * 1e3;
      const record = {
        code,
        connectionCode: code,
        patientPhone: phone,
        patientName,
        patientUserId: user?.id || phone,
        createdAt: now,
        expiresAt,
        used: false,
        status: "active"
      };
      await repository.saveCaregiverCode(record);
      res.json({
        success: true,
        code,
        expiresAt,
        patientName,
        patientPhone: phone
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to generate code";
      res.status(500).json({ success: false, error: msg });
    }
  });
  app.get("/api/caregiver/code/active", requireAuth, async (req, res) => {
    try {
      const phone = req.userPhone;
      if (!phone) {
        res.status(400).json({ success: false, error: "User phone required" });
        return;
      }
      const active = await repository.getActiveCaregiverCode(phone);
      if (!active) {
        res.status(404).json({ success: false, error: "No active caregiver code found" });
        return;
      }
      res.json({
        success: true,
        code: active.code,
        expiresAt: active.expiresAt,
        patientName: active.patientName,
        patientPhone: active.patientPhone
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to retrieve code";
      res.status(500).json({ success: false, error: msg });
    }
  });
  app.post("/api/caregiver/connect", requireAuth, async (req, res) => {
    try {
      const { code } = req.body;
      const cleanCode = String(code || "").trim();
      if (!cleanCode || cleanCode.length !== 6 || !/^\d{6}$/.test(cleanCode)) {
        res.status(400).json({
          success: false,
          error: "INVALID_CODE",
          message: "Please enter a complete 6-digit family connection code."
        });
        return;
      }
      const record = await repository.findCaregiverCode(cleanCode);
      if (!record) {
        res.status(400).json({
          success: false,
          error: "INVALID_CODE",
          message: "Invalid connection code. Please check with your family member."
        });
        return;
      }
      const now = Date.now();
      if (now >= record.expiresAt || record.status === "expired") {
        record.status = "expired";
        await repository.saveCaregiverCode(record);
        res.status(400).json({
          success: false,
          error: "CODE_EXPIRED",
          message: "Connection code expired. Please generate a new code."
        });
        return;
      }
      if (record.used || record.status === "used") {
        res.status(400).json({
          success: false,
          error: "CODE_ALREADY_USED",
          message: "This connection code has already been used. Please generate a new code."
        });
        return;
      }
      let caregiverUser = await repository.getUserByPhone(req.userPhone);
      if (!caregiverUser) {
        caregiverUser = {
          id: `user_${req.userPhone.replace(/\D/g, "") || Date.now()}`,
          mobile: req.userPhone,
          name: req.userName || "Caregiver",
          email: "",
          bloodGroup: "O+",
          allergies: "",
          emergencyContactName: "",
          emergencyContactPhone: "",
          isLoggedIn: true,
          preferredLanguage: "en",
          role: "caregiver",
          mode: "family_caregiver",
          reminderGracePeriodMinutes: 30,
          timezone: "Asia/Kolkata"
        };
        await repository.saveUser(caregiverUser);
      }
      if (phonesMatch(record.patientPhone, req.userPhone) || record.patientUserId && caregiverUser?.id && record.patientUserId === caregiverUser.id) {
        res.status(400).json({
          success: false,
          error: "CANNOT_CONNECT_SELF",
          message: "You cannot connect to yourself as a caregiver. Connect from another phone or account."
        });
        return;
      }
      record.used = true;
      record.status = "used";
      await repository.saveCaregiverCode(record);
      const patientUser = await repository.getUserByPhone(record.patientPhone);
      const patientName = patientUser?.name || record.patientName || "Patient";
      const caregiverName = caregiverUser?.name || "Caregiver";
      const existingConns = await repository.getConnectionsForCaregiver(req.userPhone);
      let connection = existingConns.find((c) => phonesMatch(c.patientPhone, record.patientPhone));
      if (connection) {
        connection.status = "active";
        connection.patientName = patientName;
        connection.caregiverName = caregiverName;
        connection.patientUserId = record.patientUserId || patientUser?.id;
        connection.caregiverUserId = caregiverUser?.id;
        connection.connectionCode = record.code;
        connection.updatedAt = now;
        await repository.saveConnection(connection);
      } else {
        connection = {
          id: `conn-${now}-${Math.random().toString(36).slice(2, 6)}`,
          patientUserId: record.patientUserId || patientUser?.id,
          caregiverUserId: caregiverUser?.id,
          connectionCode: record.code,
          patientPhone: record.patientPhone,
          patientName,
          caregiverPhone: req.userPhone,
          caregiverName,
          status: "active",
          permissions: {
            reminderStatus: true,
            unconfirmedAlerts: true,
            medicineName: true,
            scheduledTime: true,
            reminderHistory: true
          },
          createdAt: now,
          updatedAt: now
        };
        await repository.saveConnection(connection);
      }
      crossDeviceHub.notifyConnectionEstablished(connection);
      const patientReminders = await repository.getReminders(record.patientPhone);
      res.json({
        success: true,
        connection,
        patient: {
          name: patientName,
          phone: record.patientPhone,
          status: "connected"
        },
        patientName,
        patientPhone: record.patientPhone,
        reminders: patientReminders.filter((r) => r.active)
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to connect caregiver";
      res.status(500).json({ success: false, error: msg });
    }
  });
  app.post("/api/caregiver/connections/:id/confirm", requireAuth, async (req, res) => {
    const conn = await repository.getConnectionById(req.params.id);
    if (!conn) {
      res.status(404).json({ error: "Connection not found" });
      return;
    }
    conn.status = "active";
    conn.updatedAt = Date.now();
    await repository.saveConnection(conn);
    crossDeviceHub.notifyConnectionEstablished(conn);
    res.json(conn);
  });
  app.get("/api/caregiver/connections", requireAuth, async (req, res) => {
    const asPatient = await repository.getConnectionsForPatient(req.userPhone);
    const asCaregiver = await repository.getConnectionsForCaregiver(req.userPhone);
    const map = /* @__PURE__ */ new Map();
    [...asPatient, ...asCaregiver].forEach((c) => map.set(c.id, c));
    res.json(Array.from(map.values()));
  });
  app.put("/api/caregiver/connections/:id/permissions", requireAuth, async (req, res) => {
    const conn = await repository.getConnectionById(req.params.id);
    if (!conn) {
      res.status(404).json({ error: "Connection not found" });
      return;
    }
    if (conn.patientPhone !== req.userPhone) {
      res.status(403).json({ error: "Only the patient can update caregiver permissions" });
      return;
    }
    conn.permissions = { ...conn.permissions, ...req.body.permissions };
    conn.updatedAt = Date.now();
    await repository.saveConnection(conn);
    res.json(conn);
  });
  app.delete("/api/caregiver/connections/:id", requireAuth, async (req, res) => {
    const connId = req.params.id;
    const conn = await repository.getConnectionById(connId);
    const success = await repository.deleteConnection(connId);
    if (!success) {
      res.status(404).json({ success: false, error: "Connection not found" });
      return;
    }
    if (conn) {
      crossDeviceHub.notifyConnectionRevoked(conn.patientPhone, conn.caregiverPhone, conn.id);
    }
    res.json({ success: true, message: "Connection deleted successfully" });
  });
  app.get("/api/caregiver/dashboard", requireAuth, async (req, res) => {
    try {
      const caregiverPhone = req.userPhone;
      const conns = await repository.getConnectionsForCaregiver(caregiverPhone);
      const activeConns = conns.filter((c) => c.status === "active");
      const members = [];
      const todayDateStr = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
      for (const c of activeConns) {
        const patientReminders = await repository.getReminders(c.patientPhone);
        const perms = c.permissions || {
          reminderStatus: true,
          unconfirmedAlerts: true,
          medicineName: true,
          scheduledTime: true,
          reminderHistory: true
        };
        let takenCount = 0;
        let upcomingCount = 0;
        let unconfirmedCount = 0;
        const patient = await repository.getUserByPhone(c.patientPhone);
        const gracePeriod = patient?.reminderGracePeriodMinutes || 30;
        const schedule = patientReminders.filter((r) => r.active).map((r) => {
          const doses = r.times.map((t) => {
            const formattedTime = formatTimeDisplay(t);
            const log = r.doseLogs.find((l) => l.date === todayDateStr && (l.time === t || formatTimeDisplay(l.time) === formattedTime));
            let doseStatus = "Scheduled";
            if (log) {
              if (log.status === "taken") doseStatus = "Taken";
              else if (log.status === "skipped") doseStatus = "Skipped";
            } else {
              const scheduledMinutes = parseTimeToMinutes(t);
              const nowTotal = (/* @__PURE__ */ new Date()).getHours() * 60 + (/* @__PURE__ */ new Date()).getMinutes();
              if (nowTotal < scheduledMinutes) {
                doseStatus = "Scheduled";
              } else if (nowTotal <= scheduledMinutes + gracePeriod) {
                doseStatus = "Pending";
              } else {
                doseStatus = "Missed";
              }
            }
            if (doseStatus === "Taken") takenCount++;
            else if (doseStatus === "Missed") unconfirmedCount++;
            else upcomingCount++;
            return {
              time: perms.scheduledTime !== false ? formattedTime : "Scheduled Time",
              status: doseStatus
            };
          });
          return {
            medicineName: perms.medicineName !== false ? r.medicineName : "Scheduled Medication",
            dosage: perms.medicineName !== false ? r.dosage : "Standard Dose",
            instructions: r.instructions,
            doses: perms.reminderStatus !== false ? doses : []
          };
        });
        members.push({
          connectionId: c.id,
          patientName: c.patientName,
          patientPhone: c.patientPhone,
          status: "active",
          permissions: perms,
          stats: {
            taken: takenCount,
            upcoming: upcomingCount,
            unconfirmed: unconfirmedCount
          },
          schedule: perms.reminderStatus !== false ? schedule : []
        });
      }
      const allAlerts = await repository.getAlertsForCaregiver(caregiverPhone);
      const activeAlerts = allAlerts.filter((a) => !a.confirmedLater && a.status === "dose_not_confirmed");
      const dashboardData = {
        members,
        alerts: activeAlerts,
        alertLog: allAlerts
      };
      res.json(dashboardData);
    } catch (err) {
      res.status(500).json({ error: "Failed to build caregiver dashboard data" });
    }
  });
  app.get("/api/caregiver/alerts", requireAuth, async (req, res) => {
    const alerts = await repository.getAlertsForCaregiver(req.userPhone);
    res.json(alerts);
  });
  app.get("/api/caregiver/member/:patientPhone/reminders", requireAuth, async (req, res) => {
    const caregiverPhone = req.userPhone;
    const targetPatientPhone = req.params.patientPhone;
    const conns = await repository.getConnectionsForCaregiver(caregiverPhone);
    const activeConn = conns.find((c) => phonesMatch(c.patientPhone, targetPatientPhone) && c.status === "active");
    if (!activeConn) {
      res.status(403).json({
        success: false,
        error: "FORBIDDEN",
        message: "No active caregiver connection found for this member."
      });
      return;
    }
    const patientReminders = await repository.getReminders(targetPatientPhone);
    const patientUser = await repository.getUserByPhone(targetPatientPhone);
    res.json({
      success: true,
      patientName: activeConn.patientName || patientUser?.name || "Patient",
      patientPhone: targetPatientPhone,
      reminders: patientReminders.filter((r) => r.active)
    });
  });
  app.post("/api/ai/health-assistant", async (req, res) => {
    const { message, previousMessages } = req.body;
    if (!message || typeof message !== "string") {
      res.status(400).json({ error: "Please provide a health question or medicine name." });
      return;
    }
    try {
      const result = await askGemini(message, previousMessages || []);
      res.json(result);
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : "AI Health Assistant service error";
      console.error("AI assistant error:", errMsg);
      res.status(503).json({
        error: errMsg,
        disclaimer: "PharmaCare AI Reference Notice: Information provided is for educational purposes only."
      });
    }
  });
  app.post("/api/sync/backup", requireAuth, (req, res) => {
    res.json({ success: true, syncedAt: Date.now() });
  });
  app.get("/api/sync/restore", requireAuth, async (req, res) => {
    const reminders = await repository.getReminders(req.userPhone);
    const prescriptions = await repository.getPrescriptions(req.userPhone);
    const user = await repository.getUserByPhone(req.userPhone);
    res.json({ reminders, prescriptions, profile: user });
  });
  app.get("/api/devices/stream", async (req, res) => {
    const token = req.query.token || (req.headers.authorization?.startsWith("Bearer ") ? req.headers.authorization.substring(7) : "");
    const headerPhone = req.headers["x-user-phone"] || req.query.phone;
    const deviceId = req.query.deviceId || req.headers["x-device-id"];
    let phone = "";
    if (token) {
      try {
        const decoded = import_jsonwebtoken.default.verify(token, SESSION_SECRET);
        if (decoded?.phone) phone = decoded.phone;
      } catch {
      }
    }
    if (!phone && headerPhone) {
      phone = headerPhone.trim();
    }
    if (!phone) {
      res.status(401).json({ error: "Authentication required for real-time device stream" });
      return;
    }
    const clientId = `client_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    crossDeviceHub.addClient(clientId, phone, deviceId, res);
    if (deviceId) {
      await repository.updateDeviceHeartbeat(deviceId, phone);
    }
  });
  app.post("/api/devices/register", requireAuth, async (req, res) => {
    try {
      const { deviceId, deviceName, platform, appVersion, role } = req.body;
      if (!deviceId) {
        res.status(400).json({ success: false, error: "Device ID is required" });
        return;
      }
      const device = {
        deviceId: String(deviceId).trim(),
        userPhone: req.userPhone,
        userName: req.userName || "User",
        role: role || "myself",
        deviceName: deviceName || (platform === "android" ? "Android Phone" : "Web Device"),
        platform: platform === "android" ? "android" : platform === "ios" ? "ios" : "web",
        appVersion: appVersion || "1.0.0",
        isOnline: true,
        lastSeen: Date.now()
      };
      const saved = await repository.registerDevice(device);
      res.json({ success: true, device: saved });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to register device";
      res.status(500).json({ success: false, error: msg });
    }
  });
  app.post("/api/devices/heartbeat", requireAuth, async (req, res) => {
    const { deviceId } = req.body;
    if (deviceId) {
      await repository.updateDeviceHeartbeat(String(deviceId), req.userPhone);
    }
    res.json({ success: true, timestamp: Date.now() });
  });
  app.get("/api/devices/cross-connected", requireAuth, async (req, res) => {
    try {
      const result = await repository.getCrossConnectedDevices(req.userPhone);
      res.json({ success: true, ...result });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to fetch cross-connected devices";
      res.status(500).json({ success: false, error: msg });
    }
  });
  app.post("/api/devices/nudge", requireAuth, async (req, res) => {
    try {
      const { toPhone, message, medicineName, toName } = req.body;
      if (!toPhone) {
        res.status(400).json({ success: false, error: "Recipient phone number is required" });
        return;
      }
      const nudge = {
        id: `nudge_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        fromPhone: req.userPhone,
        fromName: req.userName || "Family Caregiver",
        toPhone: String(toPhone).trim(),
        toName: toName || "Family Member",
        message: message || "Gentle reminder from your family: Please take your scheduled medicine!",
        medicineName,
        timestamp: Date.now(),
        read: false
      };
      await repository.saveNudge(nudge);
      crossDeviceHub.notifyCaregiverNudge(nudge.toPhone, nudge);
      res.json({ success: true, nudge });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to send nudge";
      res.status(500).json({ success: false, error: msg });
    }
  });
  app.get("/api/devices/nudges", requireAuth, async (req, res) => {
    const nudges = await repository.getNudgesForUser(req.userPhone);
    res.json(nudges);
  });
  app.post("/api/devices/sos", requireAuth, async (req, res) => {
    try {
      const { location } = req.body;
      const user = await repository.getUserByPhone(req.userPhone);
      const patientName = user?.name || req.userName || "Patient";
      const conns = await repository.getConnectionsForPatient(req.userPhone);
      const caregiverPhones = conns.filter((c) => c.status === "active").map((c) => c.caregiverPhone);
      crossDeviceHub.notifyEmergencySos(req.userPhone, patientName, caregiverPhones, location);
      res.json({ success: true, alertedCaregiversCount: caregiverPhones.length });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to trigger SOS";
      res.status(500).json({ success: false, error: msg });
    }
  });
  app.get("/api/subscription/status", requireAuth, async (req, res) => {
    try {
      const phone = req.userPhone;
      const subscription = await repository.getSubscription(phone);
      const isPremium = subscription.plan === "premium" && subscription.status === "active" && (!subscription.expiryDate || subscription.expiryDate > Date.now());
      const limits = await repository.checkPlanLimits(phone);
      res.json({
        success: true,
        plan: isPremium ? "premium" : "free",
        isPremium,
        subscription,
        limits
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to retrieve subscription status";
      res.status(500).json({ success: false, error: msg });
    }
  });
  app.get("/api/subscription/limits", requireAuth, async (req, res) => {
    try {
      const phone = req.userPhone;
      const subscription = await repository.getSubscription(phone);
      const isPremium = subscription.plan === "premium" && subscription.status === "active" && (!subscription.expiryDate || subscription.expiryDate > Date.now());
      const limits = await repository.checkPlanLimits(phone);
      res.json({
        success: true,
        plan: isPremium ? "premium" : "free",
        isPremium,
        limits
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to retrieve subscription limits";
      res.status(500).json({ success: false, error: msg });
    }
  });
  app.post("/api/subscription/upgrade", requireAuth, async (req, res) => {
    try {
      const phone = req.userPhone;
      const { billingCycle = "monthly", paymentMethod = "gateway_ready", transactionId } = req.body;
      const cycle = billingCycle === "yearly" ? "yearly" : "monthly";
      const now = Date.now();
      const durationMs = cycle === "yearly" ? 365 * 24 * 60 * 60 * 1e3 : 30 * 24 * 60 * 60 * 1e3;
      const expiryDate = now + durationMs;
      const sub = {
        userId: phone,
        phone,
        plan: "premium",
        status: "active",
        startDate: now,
        expiryDate,
        billingCycle: cycle,
        paymentStatus: "active",
        autoRenew: true,
        updatedAt: now
      };
      await repository.saveSubscription(sub);
      const limits = await repository.checkPlanLimits(phone);
      res.json({
        success: true,
        message: "Successfully upgraded to PharmaCare Premium!",
        plan: "premium",
        isPremium: true,
        subscription: sub,
        limits
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Upgrade failed";
      res.status(500).json({ success: false, error: msg });
    }
  });
  app.post("/api/subscription/cancel", requireAuth, async (req, res) => {
    try {
      const phone = req.userPhone;
      const sub = await repository.cancelSubscription(phone);
      const limits = await repository.checkPlanLimits(phone);
      res.json({
        success: true,
        message: "Subscription cancelled. Your plan has reverted to Free.",
        plan: "free",
        isPremium: false,
        subscription: sub,
        limits
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Cancellation failed";
      res.status(500).json({ success: false, error: msg });
    }
  });
  watchdog.start();
  app.all("/api/*", (req, res) => {
    res.status(404).json({
      success: false,
      error: "ENDPOINT_NOT_FOUND",
      message: `API endpoint ${req.method} ${req.path} not found on this server.`
    });
  });
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path2.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path2.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`PharmaCare server running on http://0.0.0.0:${PORT}`);
  });
}
startServer().catch((err) => {
  console.error("Failed to start PharmaCare server:", err);
  process.exit(1);
});
//# sourceMappingURL=server.cjs.map
