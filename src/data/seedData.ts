import type { Medicine, Pharmacy, HealthTip, Doctor, MedicineReminder } from '../types.ts';

export const EMERGENCY_NUMBER = '112';

export const SEED_MEDICINES: Medicine[] = [
  {
    id: 'med-1',
    name: 'Paracetamol',
    genericName: 'Acetaminophen (Crocin / Dolo / Calpol)',
    category: 'Pain & Fever',
    dosageForm: 'Tablet',
    strength: '500mg / 650mg',
    uses: ['High fever reduction', 'Mild to moderate headaches', 'Body aches & toothache'],
    dosageGuidelines: 'Adults: 500mg to 650mg every 4 to 6 hours as needed. Do not exceed 4,000mg within 24 hours.',
    sideEffects: ['Nausea or stomach upset (rare)', 'Allergic skin rash', 'Liver toxicity if taken in extreme excess'],
    precautions: [
      'Avoid consuming alcoholic beverages while taking this medication.',
      'Do not combine with other cold or fever medications containing acetaminophen.',
      'Patients with liver or kidney impairment must consult a physician.',
      'Seek prompt medical care if fever persists beyond 3 consecutive days.'
    ],
    storage: 'Store below 25°C in a dry place protected from direct heat and moisture.',
    prescriptionRequired: false,
    manufacturer: 'Cipla Ltd / GlaxoSmithKline'
  },
  {
    id: 'med-2',
    name: 'Ibuprofen',
    genericName: 'Ibuprofen (Brufen / Advil)',
    category: 'Pain & Fever',
    dosageForm: 'Tablet',
    strength: '400mg',
    uses: ['Inflammatory pain', 'Joint & arthritis flare-ups', 'Dental pain and muscular sprains'],
    dosageGuidelines: 'Take 200mg–400mg every 6 to 8 hours strictly after food or milk to prevent stomach irritation.',
    sideEffects: ['Gastric acidity or heartburn', 'Abdominal cramps', 'Mild dizziness'],
    precautions: [
      'Always ingest with or directly after food or milk.',
      'Contraindicated in active stomach ulcers or gastrointestinal bleeding.',
      'Caution in patients with cardiac disease or hypertension.',
      'Avoid during the third trimester of pregnancy.'
    ],
    storage: 'Store at room temperature (15°C–30°C) away from damp environments.',
    prescriptionRequired: false,
    manufacturer: 'Abbott Healthcare'
  },
  {
    id: 'med-3',
    name: 'Cetirizine',
    genericName: 'Cetirizine Hydrochloride (Zyrtec / Alerid / Cetzine)',
    category: 'Allergies',
    dosageForm: 'Tablet',
    strength: '10mg',
    uses: ['Allergic rhinitis & seasonal sneezing', 'Hives and itchy skin rash (urticaria)', 'Watery itchy eyes from pollen or dust'],
    dosageGuidelines: '10mg once daily, ideally in the evening before bed due to potential sedative effects.',
    sideEffects: ['Mild drowsiness', 'Dry mouth', 'Headache or fatigue'],
    precautions: [
      'May impair alertness; avoid driving or operating heavy machinery immediately after intake.',
      'Avoid alcohol consumption as it potentiates drowsiness.',
      'Adjust dose under medical supervision in chronic kidney disease.',
      'Drink sufficient water throughout the day to counter dry mouth.'
    ],
    storage: 'Store in airtight containers below 30°C.',
    prescriptionRequired: false,
    manufacturer: 'Dr. Reddy’s Laboratories'
  },
  {
    id: 'med-4',
    name: 'Amoxicillin',
    genericName: 'Amoxicillin Trihydrate (Augmentin / Amoxil / Mox)',
    category: 'Antibiotics',
    dosageForm: 'Capsule',
    strength: '500mg',
    uses: ['Bacterial respiratory tract infections', 'Ear, nose and throat bacterial ailments', 'Urinary tract bacterial infections'],
    dosageGuidelines: 'Take 500mg every 8 hours (or 875mg twice daily) precisely as prescribed for the complete duration.',
    sideEffects: ['Loose bowel movements / diarrhea', 'Mild nausea', 'Skin rashes'],
    precautions: [
      'Complete the entire prescribed clinical course even if symptoms resolve early.',
      'Do not take if you have a known penicillin allergy.',
      'Take with food to minimize gastrointestinal discomfort.',
      'Report any severe watery diarrhea or breathing difficulty immediately.'
    ],
    storage: 'Keep in original blister packaging at controlled room temperature below 25°C.',
    prescriptionRequired: true,
    manufacturer: 'Alkem Laboratories'
  },
  {
    id: 'med-5',
    name: 'Metformin',
    genericName: 'Metformin Hydrochloride (Glycomet / Glucophage)',
    category: 'Diabetes',
    dosageForm: 'Tablet',
    strength: '500mg / 1000mg (SR)',
    uses: ['Type 2 Diabetes Mellitus glycemic control', 'Insulin sensitization', 'PCOS metabolic management'],
    dosageGuidelines: 'Initial dosage 500mg with breakfast or dinner; swallow whole without chewing or crushing.',
    sideEffects: ['Bloating or digestive gas', 'Metallic taste in mouth', 'Temporary loose stools'],
    precautions: [
      'Take with meals to minimize stomach upset.',
      'Regularly monitor blood glucose and kidney function (serum creatinine).',
      'Temporarily suspend before radiological procedures requiring iodinated contrast media.',
      'Report symptoms of lactic acidosis: severe fatigue, muscle aches, or shallow breathing.'
    ],
    storage: 'Store away from excessive heat and direct sunlight below 25°C.',
    prescriptionRequired: true,
    manufacturer: 'USV Private Limited'
  },
  {
    id: 'med-6',
    name: 'Omeprazole',
    genericName: 'Omeprazole (Omez / Prilosec)',
    category: 'Digestion',
    dosageForm: 'Capsule',
    strength: '20mg',
    uses: ['Gastroesophageal reflux disease (GERD)', 'Acid peptic disease and heartburn', 'Gastric ulcer healing & prophylaxis'],
    dosageGuidelines: '20mg once daily taken in the morning at least 30 to 60 minutes before breakfast.',
    sideEffects: ['Headache', 'Mild abdominal distension', 'Occasional constipation or loose stool'],
    precautions: [
      'Best ingested on an empty stomach with a full glass of plain water.',
      'Do not crush or chew enteric-coated micro-granules.',
      'Long-term usage requires monitoring of Vitamin B12 and Magnesium levels.',
      'Consult physician if symptoms fail to alleviate after 14 days of use.'
    ],
    storage: 'Keep container tightly sealed in a cool, dry area below 25°C.',
    prescriptionRequired: false,
    manufacturer: 'Sun Pharma'
  },
  {
    id: 'med-7',
    name: 'Salbutamol Inhaler',
    genericName: 'Albuterol / Salbutamol (Ventolin / Asthalin)',
    category: 'Respiratory',
    dosageForm: 'Inhaler / Metered Dose',
    strength: '100mcg per actuation',
    uses: ['Acute bronchospasm in bronchial asthma', 'Exercise-induced bronchoconstriction', 'Chronic Obstructive Pulmonary Disease (COPD)'],
    dosageGuidelines: '1 to 2 puffs for acute breathlessness or 15 minutes before physical exertion. Maximum 8 puffs/day.',
    sideEffects: ['Fine hand tremors', 'Mild tachycardia / palpitations', 'Nervousness or throat irritation'],
    precautions: [
      'Always rinse mouth with warm water and spit out after each inhalation session.',
      'Keep inhaler readily accessible for acute emergencies.',
      'Check dose counter regularly to avoid running empty.',
      'If relief requires increasing frequency of puffs, seek prompt clinical evaluation.'
    ],
    storage: 'Store inhaler upright below 30°C. Protect canister from puncturing or freezing.',
    prescriptionRequired: true,
    manufacturer: 'Cipla Respiratory'
  },
  {
    id: 'med-8',
    name: 'Losartan Potassium',
    genericName: 'Losartan Potassium (Cozaar / Repace / Losar)',
    category: 'Blood Pressure',
    dosageForm: 'Tablet',
    strength: '50mg',
    uses: ['Essential hypertension control', 'Diabetic nephropathy renal protection', 'Stroke risk reduction in hypertension'],
    dosageGuidelines: 'Typically 50mg once daily at approximately the same hour, with or without food.',
    sideEffects: ['Mild lightheadedness upon standing', 'Nasal congestion', 'Elevated potassium levels (hyperkalemia)'],
    precautions: [
      'Do not stop medication abruptly without physician guidance.',
      'Avoid high-potassium dietary supplements or potassium-based salt substitutes.',
      'Strictly contraindicated during pregnancy due to fetal renal harm.',
      'Periodically evaluate blood pressure and serum electrolytes.'
    ],
    storage: 'Store in moisture-proof packaging at room temperature.',
    prescriptionRequired: true,
    manufacturer: 'Torrent Pharmaceuticals'
  },
  {
    id: 'med-9',
    name: 'Vitamin D3 & Calcium',
    genericName: 'Cholecalciferol + Calcium Carbonate (Calcirol / Shelcal)',
    category: 'Vitamins',
    dosageForm: 'Tablet',
    strength: '500mg Calcium + 400 IU D3',
    uses: ['Bone density enhancement & osteoporosis prevention', 'Correction of Vitamin D deficiency', 'Post-menopausal musculoskeletal support'],
    dosageGuidelines: '1 tablet daily with or immediately after the main meal for optimal absorption.',
    sideEffects: ['Mild constipation', 'Abdominal bloating', 'Hypercalcemia if severely overdosed'],
    precautions: [
      'Take with plenty of water throughout the day.',
      'Separate intake from thyroid medications (Levothyroxine) by at least 4 hours.',
      'Caution in patients with a clinical history of kidney stones.',
      'Avoid concurrent high-dose multivitamin supplements without lab verification.'
    ],
    storage: 'Store in a dry location below 25°C protected from light.',
    prescriptionRequired: false,
    manufacturer: 'Cadila Healthcare (Zydus)'
  }
];

export const SEED_PHARMACIES: Pharmacy[] = [
  {
    id: 'pharm-1',
    name: 'CarePlus 24/7 Super Pharmacy',
    address: 'Ground Floor, Swastik Cross Road, C.G. Road, Navrangpura, Ahmedabad, Gujarat 380009',
    distanceKm: 0.4,
    rating: 4.9,
    reviewCount: 384,
    phone: '+91 79 2644 1200',
    isOpen24Hours: true,
    openingHours: 'Open 24 Hours • 7 Days a Week',
    services: ['24/7 Dispensing', 'Cold Chain Vaccines', 'Free Home Delivery', 'Digital Rx Verification', 'Blood Pressure Check'],
    lat: 23.0372,
    lng: 72.5621,
    hasDelivery: true,
    hasDriveThru: true
  },
  {
    id: 'pharm-2',
    name: 'GreenCross Community Chemist',
    address: 'Shop 4, Gala Magnus, Bodakdev, SG Highway, Ahmedabad, Gujarat 380054',
    distanceKm: 0.9,
    rating: 4.7,
    reviewCount: 215,
    phone: '+91 79 2685 4321',
    isOpen24Hours: false,
    openingHours: '8:00 AM – 10:30 PM Everyday',
    services: ['Fast Counter Service', 'Surgical Supplies', 'Elderly Dose Packing', 'Home Delivery'],
    lat: 23.0455,
    lng: 72.5183,
    hasDelivery: true,
    hasDriveThru: false
  },
  {
    id: 'pharm-3',
    name: 'Apex Health & Wellness Pharmacy',
    address: 'Near Apollo Hospital Arcade, Paldi Cross Roads, Ahmedabad, Gujarat 380007',
    distanceKm: 1.5,
    rating: 4.8,
    reviewCount: 192,
    phone: '+91 79 2657 8890',
    isOpen24Hours: true,
    openingHours: 'Open 24 Hours • 7 Days a Week',
    services: ['Critical Care Medicines', 'Emergency Oxygen Cans', '24/7 Home Delivery', 'Wheelchair Rental'],
    lat: 23.0125,
    lng: 72.5654,
    hasDelivery: true,
    hasDriveThru: true
  },
  {
    id: 'pharm-4',
    name: 'Metro City Express Meds',
    address: 'Opposite Vastrapur Lake, Sunrise Park Road, Vastrapur, Ahmedabad, Gujarat 380015',
    distanceKm: 2.1,
    rating: 4.6,
    reviewCount: 148,
    phone: '+91 79 2676 5432',
    isOpen24Hours: false,
    openingHours: '7:30 AM – 11:00 PM Everyday',
    services: ['OTC & Nutrition', 'Personal Care', 'Baby Care & Diapers', 'Store Pickup'],
    lat: 23.0359,
    lng: 72.5298,
    hasDelivery: false,
    hasDriveThru: false
  },
  {
    id: 'pharm-5',
    name: 'Lifeline Clinical Pharmacy',
    address: 'Civil Hospital Gate 3 Complex, Asarwa, Ahmedabad, Gujarat 380016',
    distanceKm: 3.2,
    rating: 4.9,
    reviewCount: 420,
    phone: '+91 79 2268 9911',
    isOpen24Hours: true,
    openingHours: 'Open 24 Hours • 7 Days a Week',
    services: ['Oncology & Rare Formulations', 'Government Subsidized Counter', '24/7 Emergency Dispatch', 'ICU Injectables'],
    lat: 23.0526,
    lng: 72.6033,
    hasDelivery: true,
    hasDriveThru: true
  }
];

export const SEED_HEALTH_TIPS: HealthTip[] = [
  {
    id: 'tip-1',
    title: 'Never Skip the Full Course of Antibiotics',
    category: 'Medicine Safety',
    readTime: '3 min read',
    isBookmarked: true,
    summary: 'Prematurely halting antibiotics when feeling improved allows surviving bacteria to mutate into resistant superbugs.',
    content: [
      'When you start an antibiotic regimen, the medicine rapidly destroys the most susceptible bacteria during the initial 48 to 72 hours. This brings prompt symptomatic relief from fever and fatigue.',
      'However, the hardier and partially resistant bacterial colonies survive deeper in your tissues. If you stop taking the antibiotic prematurely, these resilient bacteria reproduce rapidly, sparking a relapse that standard antibiotics can no longer cure.',
      'Always finish the exact count of capsules prescribed by your registered doctor, maintain equal spacing between doses (e.g., every 8 hours), and never save leftover antibiotics for future self-treatment.'
    ],
    keyTakeaways: [
      'Take every dose until the blister strip is completely empty.',
      'Spacing doses evenly sustains therapeutic blood concentration.',
      'Never share leftover antibiotics with family or friends.'
    ]
  },
  {
    id: 'tip-2',
    title: 'Safe Medicine Storage: Avoid Bathrooms & Heat',
    category: 'Medicine Safety',
    readTime: '2 min read',
    isBookmarked: false,
    summary: 'High humidity and temperature fluctuations in bathroom medicine cabinets can degrade active pharmaceutical molecules.',
    content: [
      'Despite the popularity of bathroom medicine cabinets, bathrooms are the absolute worst location to store prescription tablets, capsules, and diagnostic test strips due to steam, humidity, and heat.',
      'Moisture can penetrate sealed containers, hydrolyzing active chemicals and causing tablets to crumble, lose potency, or form irritating degradation products before their labeled expiration date.',
      'Opt for a dry, cool cabinet in your bedroom or pantry placed at least 1.5 meters above floor level, safely out of reach of inquisitive toddlers and household pets.'
    ],
    keyTakeaways: [
      'Keep medicines out of bathrooms and kitchens.',
      'Maintain temperatures below 25°C in a dry, ventilated cupboard.',
      'Insulin, vaccines, and reconstituted syrups require refrigeration at 2°C–8°C.'
    ]
  },
  {
    id: 'tip-3',
    title: 'What to Do If You Miss a Daily Medicine Dose',
    category: 'Medicine Safety',
    readTime: '3 min read',
    isBookmarked: false,
    summary: 'Rules for handling forgotten doses safely without doubling up or risking toxic drug spikes in your bloodstream.',
    content: [
      'Forgetting a dose happens to everyone. The golden pharmacological rule is: take the forgotten tablet as soon as you remember, unless it is already almost time for your next scheduled dose.',
      'Never double your dose to compensate for a missed one. Taking two doses close together creates a sharp peak in serum drug concentration, which can trigger severe hypotension with blood pressure pills or profound hypoglycemia with diabetes drugs.',
      'If you are more than halfway through your dosing interval (for instance, 8 hours into a 12-hour twice-daily cycle), skip the forgotten dose completely and resume your normal calendar schedule.'
    ],
    keyTakeaways: [
      'Never take two doses simultaneously or within a brief window.',
      'If close to the next scheduled dose, skip the missed one.',
      'Enable PharmaCare automated reminders and caregiver alerts for safety.'
    ]
  },
  {
    id: 'tip-4',
    title: 'Hydration and Kidney Health During Medication',
    category: 'General Health',
    readTime: '4 min read',
    isBookmarked: false,
    summary: 'Adequate daily water intake assists renal clearance of medication metabolites and prevents nephrotoxicity.',
    content: [
      'Your kidneys filter bloodstream toxins and excrete drug metabolites around the clock. Many common therapeutics, including NSAID painkillers (ibuprofen), antibiotics, and ACE inhibitors, exert physiological stress on renal filtration units.',
      'When you are mildly dehydrated, urine concentration spikes, elevating the contact time of active metabolites with delicate kidney tubules. This elevates the risk of interstitial inflammation and kidney stones.',
      'Aim for 2 to 2.5 liters of clean water daily unless you are on fluid-restriction therapy for congestive heart failure or end-stage renal disease.'
    ],
    keyTakeaways: [
      'Drink a full glass of water with every oral medication.',
      'Stay hydrated when taking NSAIDs, antibiotics, or contrast dyes.',
      'Monitor urine color: pale straw yellow indicates healthy hydration.'
    ]
  },
  {
    id: 'tip-5',
    title: 'Recognizing Severe Drug Allergy Symptoms',
    category: 'Emergency',
    readTime: '3 min read',
    isBookmarked: false,
    summary: 'Distinguishing benign side effects from life-threatening anaphylaxis that warrants immediate emergency hospitalization.',
    content: [
      'A mild drug side effect (like nausea or minor stomach burning) is uncomfortable, but true drug hypersensitivity or anaphylaxis is an acute medical emergency requiring immediate 112 / 108 ambulance dispatch.',
      'Red-flag anaphylactic signs include: sudden widespread hives, intense facial or lip swelling, difficulty swallowing, a sensation of throat constriction, wheezing, and a sudden drop in blood pressure leading to fainting.',
      'If you observe these symptoms within 60 minutes of swallowing or injecting a new medication, call Emergency Services immediately and alert nearby family members.'
    ],
    keyTakeaways: [
      'Facial swelling and breathing distress mean immediate emergency care.',
      'Dial 112 / 108 or go straight to the closest emergency room.',
      'Record the suspected medication name for attending ER physicians.'
    ]
  }
];

export const SEED_DOCTORS: Doctor[] = [
  {
    id: 'doc-1',
    name: 'Dr. Rajesh Patel',
    specialty: 'Cardiologist',
    qualification: 'MBBS, MD (Medicine), DM (Cardiology), FACC',
    experienceYears: 16,
    location: 'Navrangpura',
    city: 'Ahmedabad',
    hospitalClinic: 'Apex Heart & Vascular Institute',
    consultationFee: 800,
    availableDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    timings: '10:00 AM – 2:00 PM, 5:00 PM – 8:30 PM',
    contactPhone: '+91 79 2640 1199',
    languages: ['English', 'Hindi', 'Gujarati'],
    rating: 4.9,
    reviewsCount: 230,
    about: 'Senior Interventional Cardiologist specializing in preventive cardiology, coronary angioplasty, heart failure management, and hypertension control with over 16 years of academic and clinical expertise.',
    registrationNumber: 'G-34821 (Gujarat Medical Council)',
    isAvailableToday: true,
    email: 'dr.rajesh.patel@apexheart.in',
    address: 'Suite 401, Apex Heart Tower, Near St. Xavier’s College, Navrangpura, Ahmedabad'
  },
  {
    id: 'doc-2',
    name: 'Dr. Meera Shah',
    specialty: 'Dermatologist',
    qualification: 'MBBS, MD (Dermatology, Venereology & Leprosy)',
    experienceYears: 11,
    location: 'Bodakdev, SG Highway',
    city: 'Ahmedabad',
    hospitalClinic: 'SkinCare & Laser Aesthetics Center',
    consultationFee: 600,
    availableDays: ['Mon', 'Wed', 'Fri', 'Sat'],
    timings: '11:00 AM – 3:00 PM, 6:00 PM – 9:00 PM',
    contactPhone: '+91 79 2684 2200',
    languages: ['English', 'Hindi', 'Gujarati'],
    rating: 4.8,
    reviewsCount: 185,
    about: 'Expert clinical and cosmetic dermatologist specializing in chronic eczema, psoriasis management, severe acne therapies, pediatric skin allergies, and advanced laser interventions.',
    registrationNumber: 'G-41290 (Gujarat Medical Council)',
    isAvailableToday: true,
    email: 'dr.meera@skincarecenter.in',
    address: 'Ground Floor, Gala Business Park, Near Rajpath Club, Bodakdev, SG Highway, Ahmedabad'
  },
  {
    id: 'doc-3',
    name: 'Dr. Amit Joshi',
    specialty: 'General Physician',
    qualification: 'MBBS, MD (General Medicine)',
    experienceYears: 14,
    location: 'Paldi',
    city: 'Ahmedabad',
    hospitalClinic: 'Sanjivani Multispeciality Clinic',
    consultationFee: 400,
    availableDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    timings: '09:00 AM – 1:00 PM, 4:30 PM – 8:30 PM',
    contactPhone: '+91 79 2658 3311',
    languages: ['English', 'Hindi', 'Gujarati'],
    rating: 4.9,
    reviewsCount: 312,
    about: 'Dedicated family physician with extensive experience diagnosing infectious fevers (dengue, malaria, typhoid), metabolic disorders, thyroid anomalies, and geriatric preventive wellness.',
    registrationNumber: 'G-28954 (Gujarat Medical Council)',
    isAvailableToday: true,
    email: 'dr.amitjoshi@sanjivaniclinic.in',
    address: 'Near Bhattha Cross Road, Opp. Sharda Mandir School, Paldi, Ahmedabad'
  },
  {
    id: 'doc-4',
    name: 'Dr. Neha Desai',
    specialty: 'Pediatrician',
    qualification: 'MBBS, DCH, DNB (Pediatrics)',
    experienceYears: 12,
    location: 'Satellite',
    city: 'Ahmedabad',
    hospitalClinic: 'Little Stars Children Hospital',
    consultationFee: 500,
    availableDays: ['Mon', 'Tue', 'Thu', 'Fri', 'Sat'],
    timings: '10:30 AM – 1:30 PM, 5:30 PM – 8:30 PM',
    contactPhone: '+91 79 2673 4422',
    languages: ['English', 'Hindi', 'Gujarati'],
    rating: 4.8,
    reviewsCount: 198,
    about: 'Compassionate child specialist handling newborn intensive care, vaccination schedules, pediatric asthma, childhood infections, and developmental milestone assessments.',
    registrationNumber: 'G-37812 (Gujarat Medical Council)',
    isAvailableToday: true,
    email: 'drneha@littlestarskids.org',
    address: '2nd Floor, Star Plaza, Jodhpur Cross Roads, Satellite, Ahmedabad'
  },
  {
    id: 'doc-5',
    name: 'Dr. Ananya Trivedi',
    specialty: 'Gynecologist',
    qualification: 'MBBS, MS (Obstetrics & Gynecology), FMAS',
    experienceYears: 15,
    location: 'Vastrapur',
    city: 'Ahmedabad',
    hospitalClinic: 'Matritva Women & Maternity Clinic',
    consultationFee: 700,
    availableDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    timings: '11:00 AM – 2:00 PM, 6:00 PM – 8:30 PM',
    contactPhone: '+91 79 2676 7788',
    languages: ['English', 'Hindi', 'Gujarati'],
    rating: 4.9,
    reviewsCount: 264,
    about: 'Specialist obstetrician and laparoscopic surgeon focusing on high-risk pregnancy management, PCOS/PCOD hormonal balancing, infertility evaluation, and menopause transition.',
    registrationNumber: 'G-31209 (Gujarat Medical Council)',
    isAvailableToday: true,
    email: 'ananya.trivedi@matritvaclinic.com',
    address: 'Near Vastrapur Lake, Alpha One Mall Road, Vastrapur, Ahmedabad'
  },
  {
    id: 'doc-6',
    name: 'Dr. Vikramaditya Rathore',
    specialty: 'Orthopedic',
    qualification: 'MBBS, MS (Orthopedics), M.Ch (Ortho)',
    experienceYears: 18,
    location: 'Ellisbridge',
    city: 'Ahmedabad',
    hospitalClinic: 'Shalby Orthopedic & Joint Care Institute',
    consultationFee: 900,
    availableDays: ['Mon', 'Wed', 'Thu', 'Sat'],
    timings: '09:30 AM – 1:30 PM, 4:00 PM – 7:00 PM',
    contactPhone: '+91 79 2657 5500',
    languages: ['English', 'Hindi', 'Gujarati'],
    rating: 4.8,
    reviewsCount: 340,
    about: 'Renowned orthopedic surgeon specializing in knee and hip joint replacements, sports ligament reconstructions (ACL/PCL), spinal disc problems, and osteoporosis management.',
    registrationNumber: 'G-24510 (Gujarat Medical Council)',
    isAvailableToday: true,
    email: 'dr.rathore@shalbyortho.in',
    address: 'Opposite Karnavati Hospital, Ellisbridge, Ahmedabad'
  },
  {
    id: 'doc-7',
    name: 'Dr. Pooja Mehta',
    specialty: 'Dentist',
    qualification: 'BDS, MDS (Prosthodontics & Implantology)',
    experienceYears: 9,
    location: 'Maninagar',
    city: 'Ahmedabad',
    hospitalClinic: 'Smile Craft Dental & Implant Center',
    consultationFee: 400,
    availableDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    timings: '10:00 AM – 1:30 PM, 5:00 PM – 9:00 PM',
    contactPhone: '+91 79 2546 8833',
    languages: ['English', 'Hindi', 'Gujarati'],
    rating: 4.7,
    reviewsCount: 160,
    about: 'Expert dental surgeon focusing on pain-free root canals, dental implants, orthodontic aligners, smile designing, and comprehensive oral disease prevention.',
    registrationNumber: 'D-12845 (Gujarat Dental Council)',
    isAvailableToday: true,
    email: 'pooja.mehta@smilecraftdental.in',
    address: '1st Floor, Krishna Complex, Near Rambaug Police Station, Maninagar, Ahmedabad'
  },
  {
    id: 'doc-8',
    name: 'Dr. Sandeep Kothari',
    specialty: 'Neurologist',
    qualification: 'MBBS, MD (Medicine), DM (Neurology)',
    experienceYears: 17,
    location: 'Drive-In Road',
    city: 'Ahmedabad',
    hospitalClinic: 'NeuroCare Brain & Spine Hospital',
    consultationFee: 1000,
    availableDays: ['Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    timings: '11:00 AM – 3:30 PM',
    contactPhone: '+91 79 2749 9900',
    languages: ['English', 'Hindi', 'Gujarati'],
    rating: 4.9,
    reviewsCount: 280,
    about: 'Leading neurologist managing migraine and intractable headaches, epilepsy/seizures, acute stroke rehabilitation, neuropathy, Parkinson’s disease, and neuro-muscular disorders.',
    registrationNumber: 'G-26780 (Gujarat Medical Council)',
    isAvailableToday: true,
    email: 'dr.kothari@neurocarehospital.in',
    address: 'Drive-In Road, Near Himalaya Mall, Memnagar, Ahmedabad'
  },
  {
    id: 'doc-9',
    name: 'Dr. Ketan Barot',
    specialty: 'ENT Specialist',
    qualification: 'MBBS, MS (ENT), DLO',
    experienceYears: 13,
    location: 'Ashram Road',
    city: 'Ahmedabad',
    hospitalClinic: 'Barot Ear, Nose & Throat Hospital',
    consultationFee: 500,
    availableDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    timings: '10:00 AM – 2:00 PM, 5:30 PM – 8:30 PM',
    contactPhone: '+91 79 2658 1234',
    languages: ['English', 'Hindi', 'Gujarati'],
    rating: 4.8,
    reviewsCount: 175,
    about: 'Senior ENT and Head-Neck specialist treating chronic sinusitis, allergic nasal polyps, tinnitus, hearing loss, vertigo/dizziness, and microscopic ear surgeries.',
    registrationNumber: 'G-33981 (Gujarat Medical Council)',
    isAvailableToday: true,
    email: 'drketan@barotenthospital.com',
    address: 'Opp. Gujarat Chamber of Commerce, Ashram Road, Ahmedabad'
  },
  {
    id: 'doc-10',
    name: 'Dr. Sunita Sharma',
    specialty: 'Cardiologist',
    qualification: 'MBBS, MD, DM (Cardiology), FESC',
    experienceYears: 20,
    location: 'Bandra West',
    city: 'Mumbai',
    hospitalClinic: 'Lilavati Heart & Health Research Center',
    consultationFee: 1200,
    availableDays: ['Mon', 'Tue', 'Wed', 'Fri'],
    timings: '11:00 AM – 3:00 PM',
    contactPhone: '+91 22 2675 1100',
    languages: ['English', 'Hindi', 'Marathi'],
    rating: 4.9,
    reviewsCount: 410,
    about: 'Distinguished adult cardiologist with two decades of experience in non-invasive cardiac imaging, complex valve disorders, and preventive coronary regimens.',
    registrationNumber: 'M-19842 (Maharashtra Medical Council)',
    isAvailableToday: false,
    email: 'dr.sunita.sharma@lilavatihospital.com',
    address: 'A-791, Bandra Reclamation, Bandra West, Mumbai, Maharashtra'
  },
  {
    id: 'doc-11',
    name: 'Dr. Harshil Vora',
    specialty: 'General Physician',
    qualification: 'MBBS, MD (Medicine)',
    experienceYears: 10,
    location: 'Athwa Lines',
    city: 'Surat',
    hospitalClinic: 'Surat Care Medical Center',
    consultationFee: 450,
    availableDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    timings: '09:00 AM – 1:00 PM, 5:00 PM – 9:00 PM',
    contactPhone: '+91 261 245 8899',
    languages: ['English', 'Hindi', 'Gujarati'],
    rating: 4.8,
    reviewsCount: 145,
    about: 'Expert internal medicine clinician focused on diabetic care, acute seasonal viral syndromes, hypertension, and preventive health screenings for families.',
    registrationNumber: 'G-43901 (Gujarat Medical Council)',
    isAvailableToday: true,
    email: 'drharshil@suratcare.in',
    address: 'Athwa Lines, Opp. Circuit House, Surat, Gujarat'
  },
  {
    id: 'doc-12',
    name: 'Dr. Bhavna Swaminathan',
    specialty: 'Dermatologist',
    qualification: 'MBBS, DVD, MD (Dermatology)',
    experienceYears: 14,
    location: 'Indiranagar',
    city: 'Bangalore',
    hospitalClinic: 'Aura Skin & Hair Clinic',
    consultationFee: 750,
    availableDays: ['Mon', 'Wed', 'Thu', 'Sat'],
    timings: '10:30 AM – 2:30 PM, 6:00 PM – 8:30 PM',
    contactPhone: '+91 80 2521 4400',
    languages: ['English', 'Hindi', 'Kannada', 'Tamil'],
    rating: 4.8,
    reviewsCount: 220,
    about: 'Consultant dermatologist and trichologist specializing in alopecia, autoimmune dermatoses, pigmentary disorders, and holistic skin health protocols.',
    registrationNumber: 'K-27190 (Karnataka Medical Council)',
    isAvailableToday: true,
    email: 'bhavna@auraskinclinic.in',
    address: '100 Feet Road, HAL 2nd Stage, Indiranagar, Bangalore, Karnataka'
  }
];

export const INITIAL_SAMPLE_REMINDERS: MedicineReminder[] = [
  {
    id: 'rem-sample-1',
    medicineName: 'Paracetamol (500mg)',
    genericName: 'Acetaminophen',
    dosage: '1 Tablet (500mg)',
    frequency: 'Twice Daily',
    times: ['08:30', '20:30'],
    startDate: new Date().toISOString().split('T')[0],
    instructions: 'After Food',
    active: true,
    notes: 'Take after breakfast and dinner for fever reduction',
    colorTag: '#0EA5E9',
    doseLogs: [],
    createdAt: Date.now() - 86400000
  },
  {
    id: 'rem-sample-2',
    medicineName: 'Vitamin D3 (Calcirol)',
    genericName: 'Cholecalciferol',
    dosage: '1 Tablet (60,000 IU)',
    frequency: 'Once Daily',
    times: ['13:00'],
    startDate: new Date().toISOString().split('T')[0],
    instructions: 'With Food',
    active: true,
    notes: 'Take with lunch for bone strength',
    colorTag: '#10B981',
    doseLogs: [],
    createdAt: Date.now() - 86400000
  }
];

export const SAMPLE_PRESCRIPTION_BASE64 = 'data:image/svg+xml;utf8,' + encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="600" height="800" viewBox="0 0 600 800" fill="none">
  <rect width="600" height="800" fill="#FFFFFF" rx="8"/>
  <rect x="20" y="20" width="560" height="760" stroke="#CBD5E1" stroke-width="2" rx="6" fill="#F8FAFC"/>
  <!-- Header -->
  <rect x="40" y="40" width="520" height="90" rx="8" fill="#0F4C81"/>
  <text x="60" y="75" fill="#FFFFFF" font-family="sans-serif" font-size="22" font-weight="bold">APOLLO HEALTH CLINIC</text>
  <text x="60" y="100" fill="#93C5FD" font-family="sans-serif" font-size="12">Dr. Amit Patel, MBBS, MD (Medicine) • Reg: G-14820</text>
  <text x="60" y="118" fill="#E2E8F0" font-family="sans-serif" font-size="11">Paldi Cross Roads, Ahmedabad • Tel: +91 79 2658 9000</text>
  
  <!-- Patient Info -->
  <rect x="40" y="145" width="520" height="60" rx="6" fill="#FFFFFF" stroke="#E2E8F0"/>
  <text x="55" y="170" fill="#64748B" font-family="sans-serif" font-size="11">Patient Name:</text>
  <text x="135" y="170" fill="#0F172A" font-family="sans-serif" font-size="13" font-weight="bold">Rahul Sharma</text>
  <text x="360" y="170" fill="#64748B" font-family="sans-serif" font-size="11">Date:</text>
  <text x="395" y="170" fill="#0F172A" font-family="sans-serif" font-size="12" font-weight="bold">21 Sep 2026</text>
  <text x="55" y="192" fill="#64748B" font-family="sans-serif" font-size="11">Age / Sex: 42 Y / Male</text>
  <text x="360" y="192" fill="#64748B" font-family="sans-serif" font-size="11">Diagnosis: Acute Upper Resp. Infection</text>
  
  <!-- Rx Symbol -->
  <text x="45" y="260" fill="#0F4C81" font-family="serif" font-size="44" font-weight="bold">℞</text>
  
  <!-- Med 1 -->
  <text x="100" y="250" fill="#0F172A" font-family="sans-serif" font-size="15" font-weight="bold">1. Tab. Amoxicillin + Clavulanic Acid 625mg</text>
  <text x="100" y="272" fill="#475569" font-family="sans-serif" font-size="12">Dosage: 1 tablet every 12 hours after meals (1 - 0 - 1) x 5 days</text>
  
  <!-- Med 2 -->
  <text x="100" y="320" fill="#0F172A" font-family="sans-serif" font-size="15" font-weight="bold">2. Tab. Paracetamol 650mg</text>
  <text x="100" y="342" fill="#475569" font-family="sans-serif" font-size="12">Dosage: 1 tablet SOS if fever > 100°F (Max 3/day after food)</text>
  
  <!-- Med 3 -->
  <text x="100" y="390" fill="#0F172A" font-family="sans-serif" font-size="15" font-weight="bold">3. Cap. Pantoprazole 40mg</text>
  <text x="100" y="412" fill="#475569" font-family="sans-serif" font-size="12">Dosage: 1 capsule in morning on empty stomach (1 - 0 - 0) x 5 days</text>
  
  <!-- General Advice -->
  <rect x="40" y="460" width="520" height="120" rx="6" fill="#EFF6FF" stroke="#BFDBFE"/>
  <text x="55" y="485" fill="#1E40AF" font-family="sans-serif" font-size="12" font-weight="bold">Clinical Instructions & Follow-up:</text>
  <text x="55" y="510" fill="#1E3A8A" font-family="sans-serif" font-size="11">• Drink warm fluids and steam inhalation twice daily.</text>
  <text x="55" y="530" fill="#1E3A8A" font-family="sans-serif" font-size="11">• Complete entire antibiotic course without skipping doses.</text>
  <text x="55" y="550" fill="#1E3A8A" font-family="sans-serif" font-size="11">• Follow-up in clinic after 5 days if symptoms persist.</text>
  
  <!-- Signature -->
  <line x1="380" y1="710" x2="520" y2="710" stroke="#64748B" stroke-width="1.5"/>
  <text x="400" y="730" fill="#0F172A" font-family="sans-serif" font-size="12" font-weight="bold">Dr. Amit Patel</text>
  <text x="410" y="745" fill="#64748B" font-family="sans-serif" font-size="10">Consulting Physician</text>
</svg>`);

