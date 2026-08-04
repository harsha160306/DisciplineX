import { useState, useRef, useEffect } from 'react';
import api from '../utils/api';
import { toast } from 'react-hot-toast';
import JsBarcode from 'jsbarcode';
import Tesseract from 'tesseract.js';

export default function Registration() {
  // Form fields state
  const [name, setName] = useState('');
  const [registerNumber, setRegisterNumber] = useState('');
  const [course, setCourse] = useState('BTech'); // BTech, MCA, Diploma
  const [academicYear, setAcademicYear] = useState('2024 - 2025');
  const [validity, setValidity] = useState(''); // Calculated automatically
  const [branch, setBranch] = useState('');
  const [dob, setDob] = useState('');
  const [bloodGroup, setBloodGroup] = useState('O+');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState(''); // Stored in database but not displayed on ID card
  const [photoUrl, setPhotoUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // OCR State
  const [isOcrProcessing, setIsOcrProcessing] = useState(false);
  const [ocrProgressText, setOcrProgressText] = useState('');
  const [idCardImagePreview, setIdCardImagePreview] = useState('');

  // Preview state (initial mock values)
  const [previewData, setPreviewData] = useState({
    name: 'Eleanor Vance',
    registerNumber: 'MIC-24-8921',
    course: 'BTech',
    branch: 'CSE',
    academicYear: '2024 - 2025',
    validity: '4 Years (2024 - 2028)',
    dob: '2005-04-12',
    bloodGroup: 'O+',
    address: '123 Academic Block, Campus Square',
    phone: '9876543210',
    photoUrl: ''
  });

  const barcodeRef = useRef(null);

  // Calculate validity automatically based on Course + Academic Year
  const calculateValidity = (selectedCourse, selectedAcademicYear) => {
    let duration = 4; // BTech: 4 Years
    if (selectedCourse === 'MCA') duration = 2; // MCA: 2 Years
    else if (selectedCourse === 'Diploma') duration = 3; // Diploma: 3 Years
    
    const startYearMatch = selectedAcademicYear.match(/^(\d{4})/);
    if (startYearMatch) {
      const startYear = parseInt(startYearMatch[1], 10);
      const endYear = startYear + duration;
      return `${duration} Years (${startYear} - ${endYear})`;
    }
    return `${duration} Years`;
  };

  useEffect(() => {
    const computed = calculateValidity(course, academicYear);
    setValidity(computed);
  }, [course, academicYear]);

  useEffect(() => {
    if (barcodeRef.current && previewData.registerNumber) {
      try {
        JsBarcode(barcodeRef.current, previewData.registerNumber, {
          format: 'CODE128',
          width: 2,
          height: 48,
          displayValue: false, // We render the register number below manually as per spec
          margin: 0,
          background: 'transparent',
          lineColor: '#000000'
        });
      } catch (err) {
        console.error('Barcode render error:', err);
      }
    }
  }, [previewData.registerNumber]);

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size exceeds 10MB limit.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleIdCardUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.match('image.*')) {
        toast.error('Please upload a valid JPG, JPEG, or PNG image.');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size exceeds 10MB limit.');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setIdCardImagePreview(reader.result);
        startOcrProcessing(file);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCaptureIdCard = () => {
    const el = document.getElementById('id-card-capture');
    if (el) el.click();
  };

  const startOcrProcessing = (imageFile) => {
    setIsOcrProcessing(true);
    setOcrProgressText('Processing ID card...');

    Tesseract.recognize(
      imageFile,
      'eng',
      { 
        logger: m => {
          if (m.status === 'recognizing text') {
            setOcrProgressText(`Reading student information... (${Math.round(m.progress * 100)}%)`);
          }
        } 
      }
    ).then(({ data: { text } }) => {
      parseOcrText(text);
      setIsOcrProcessing(false);
      setOcrProgressText('');
      toast.success('Student information extracted successfully.');
    }).catch(err => {
      console.error('OCR Error:', err);
      setIsOcrProcessing(false);
      setOcrProgressText('');
      toast.error('Unable to read student information from this ID card. Please upload a clearer image or enter the details manually.');
    });
  };

  const parseOcrText = (text) => {
    const nameMatch = text.match(/(?:Name|Student Name)\s*[:\-]?\s*([A-Za-z\s]+)/i);
    const regNoMatch = text.match(/(?:Register Number|Reg No|Registration Number|Roll No)\s*[:\-]?\s*([A-Za-z0-9-]+)/i);
    const deptMatch = text.match(/(?:Department|Branch)\s*[:\-]?\s*([A-Za-z\s]+)/i);
    const yearMatch = text.match(/(?:Academic Year|Year)\s*[:\-]?\s*([\d]{4}\s*-\s*[\d]{4})/i);

    let missingFields = false;

    if (nameMatch && nameMatch[1].trim()) {
      setName(nameMatch[1].trim());
    } else {
      missingFields = true;
    }

    if (regNoMatch && regNoMatch[1].trim()) {
      setRegisterNumber(regNoMatch[1].trim());
    } else {
      missingFields = true;
    }

    if (deptMatch && deptMatch[1].trim()) {
      const dept = deptMatch[1].trim();
      if (dept.toLowerCase().includes('computer science')) {
        setBranch('CSE');
      } else {
        setBranch(dept);
      }
    } else {
      missingFields = true;
    }

    if (yearMatch && yearMatch[1].trim()) {
      setAcademicYear(yearMatch[1].trim());
    } else {
      missingFields = true;
    }

    if (missingFields) {
      toast.error('Some student information could not be detected. Please enter the missing information manually.');
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size exceeds 10MB limit.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerateAndSave = async (e) => {
    e.preventDefault();
    if (!name.trim() || !registerNumber.trim() || !branch.trim()) {
      toast.error('Please fill in all required fields.');
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Submit to database
      await api.post('/students', {
        register_number: registerNumber.trim(),
        name: name.trim(),
        course,
        department: branch.trim(),
        academic_year: academicYear,
        validity,
        dob,
        blood_group: bloodGroup,
        address,
        email: email.trim(),
        phone: phone.trim(),
        photo_url: photoUrl
      });

      // 2. Update card preview
      setPreviewData({
        name: name.trim(),
        registerNumber: registerNumber.trim(),
        course,
        branch: branch.trim(),
        academicYear,
        validity,
        dob,
        bloodGroup,
        address,
        phone,
        photoUrl
      });

      toast.success('Student registered and ID card generated successfully!');
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to register student.';
      if (msg.includes('exists')) {
        toast.error('This Register Number is already registered.');
      } else {
        // Fallback for mock demo mode
        setPreviewData({
          name: name.trim(),
          registerNumber: registerNumber.trim(),
          course,
          branch: branch.trim(),
          academicYear,
          validity,
          dob,
          bloodGroup,
          address,
          phone,
          photoUrl
        });
        toast.success('ID Card Generated (Demo Fallback)!');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex-1 w-full relative p-4 md:p-8 xl:p-12 overflow-y-auto">
      {/* Styles to support clean printing of both ID Card sides */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-container, #printable-container * {
            visibility: visible;
          }
          #printable-container {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            display: flex;
            flex-direction: row;
            justify-content: center;
            gap: 20px;
          }
        }
      `}</style>

      <div className="max-w-7xl mx-auto grid grid-cols-1 xl:grid-cols-12 gap-8 lg:gap-12">
        {/* Registration Form Area */}
        <div className="xl:col-span-7 space-y-6 md:space-y-8">
          <div>
            <h1 className="font-headline text-3xl md:text-4xl text-on-surface mb-2 md:mb-3 tracking-tight font-bold">Student Enrollment</h1>
            <p className="text-on-surface-variant font-body leading-relaxed max-w-xl text-sm md:text-base">
              Enter the student's details below to generate a new institutional identity card. Validity is calculated automatically by course selection.
            </p>
          </div>

          <form onSubmit={handleGenerateAndSave} className="bg-surface-container-lowest p-6 md:p-8 rounded-2xl shadow-sm border border-outline-variant/15 space-y-6">
            
            {/* OCR ID Card Import Section */}
            <div>
              <h2 className="font-label text-base font-bold text-on-surface uppercase tracking-wider mb-4 border-b border-outline-variant/15 pb-2">Import from Existing ID Card</h2>
              
              <div className="flex flex-col md:flex-row gap-4 items-start">
                <div className="flex-1 w-full">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button 
                      type="button"
                      onClick={() => document.getElementById('id-card-upload').click()}
                      className="flex-1 bg-secondary-container text-on-secondary-container hover:bg-secondary-container/80 py-3 rounded-xl font-label font-bold text-sm transition-colors flex items-center justify-center gap-2"
                    >
                      <span className="material-symbols-outlined">upload_file</span>
                      Upload ID Card Image
                    </button>
                    <input 
                      type="file" 
                      id="id-card-upload" 
                      accept=".jpg, .jpeg, .png" 
                      className="hidden" 
                      onChange={handleIdCardUpload}
                    />

                    <button 
                      type="button"
                      onClick={handleCaptureIdCard}
                      className="flex-1 bg-surface border border-outline text-on-surface hover:bg-surface-container py-3 rounded-xl font-label font-bold text-sm transition-colors flex items-center justify-center gap-2"
                    >
                      <span className="material-symbols-outlined">photo_camera</span>
                      Capture ID Card
                    </button>
                    <input 
                      type="file" 
                      id="id-card-capture" 
                      accept="image/*" 
                      capture="environment"
                      className="hidden" 
                      onChange={handleIdCardUpload}
                    />
                  </div>
                  
                  {isOcrProcessing && (
                    <div className="mt-4 p-4 bg-primary-container text-on-primary-container rounded-xl flex items-center gap-3 animate-pulse">
                      <span className="material-symbols-outlined animate-spin">sync</span>
                      <span className="font-body text-sm font-semibold">{ocrProgressText}</span>
                    </div>
                  )}
                </div>

                {idCardImagePreview && (
                  <div className="w-full md:w-32 h-24 rounded-xl border border-outline-variant overflow-hidden relative shrink-0">
                    <img src={idCardImagePreview} className="w-full h-full object-cover" alt="ID Card Preview" />
                    <button 
                      type="button"
                      onClick={() => setIdCardImagePreview('')}
                      className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1 hover:bg-black/80 transition-colors"
                    >
                      <span className="material-symbols-outlined text-[14px]">close</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="relative py-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-outline-variant/30"></div>
              </div>
              <div className="relative flex justify-center">
                <span className="bg-surface-container-lowest px-4 text-xs font-label uppercase tracking-widest text-on-surface-variant font-bold">OR Manual Enrollment</span>
              </div>
            </div>

            {/* Photo Upload */}
            <div className="col-span-full">
              <label className="block font-label text-sm font-semibold text-on-surface mb-2">Student Portrait</label>
              <div 
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={() => document.getElementById('file-upload').click()}
                className="mt-2 flex justify-center rounded-xl border border-dashed border-outline-variant/50 px-6 py-6 hover:bg-surface-container-low transition-colors group cursor-pointer bg-surface relative overflow-hidden h-36 items-center"
              >
                {photoUrl ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 group-hover:bg-black/60 transition-colors">
                    <img src={photoUrl} className="w-full h-full object-cover" alt="Uploaded Portrait" />
                    <span className="absolute text-white font-label font-bold text-xs bg-primary/80 px-4 py-2 rounded-full shadow">Change Photo</span>
                  </div>
                ) : (
                  <div className="text-center">
                    <span className="material-symbols-outlined text-3xl text-outline mb-1 group-hover:text-primary transition-colors">add_a_photo</span>
                    <div className="mt-2 flex flex-col sm:flex-row items-center text-sm leading-6 text-on-surface-variant justify-center gap-1">
                      <span className="relative cursor-pointer rounded-md font-semibold text-primary hover:text-primary-container">
                        <span>Upload a file</span>
                        <input 
                          className="sr-only" 
                          id="file-upload" 
                          name="file-upload" 
                          type="file" 
                          accept="image/*"
                          onChange={handlePhotoUpload}
                        />
                      </span>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs leading-5 text-on-surface-variant mt-0.5">PNG or JPG up to 10MB</p>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 md:gap-6">
              {/* Student Name */}
              <div className="sm:col-span-2">
                <label className="block font-label text-sm font-semibold text-on-surface mb-1" htmlFor="student-name">Full Legal Name</label>
                <input 
                  required
                  className="w-full bg-surface border border-outline-variant/50 rounded-xl px-4 py-3 text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-shadow font-body text-sm" 
                  id="student-name" 
                  placeholder="e.g. Eleanor Vance" 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              
              {/* Register Number */}
              <div>
                <label className="block font-label text-sm font-semibold text-on-surface mb-1" htmlFor="reg-number">Registration Number</label>
                <input 
                  required
                  className="w-full bg-surface border border-outline-variant/50 rounded-xl px-4 py-3 text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-shadow font-body text-sm" 
                  id="reg-number" 
                  placeholder="e.g. MIC-24-8921" 
                  type="text" 
                  value={registerNumber}
                  onChange={(e) => setRegisterNumber(e.target.value)}
                />
              </div>

              {/* Course Selection */}
              <div>
                <label className="block font-label text-sm font-semibold text-on-surface mb-1" htmlFor="course">Course</label>
                <div className="relative">
                  <select 
                    className="w-full bg-surface border border-outline-variant/50 rounded-xl px-4 py-3 text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-shadow font-body text-sm appearance-none" 
                    id="course"
                    value={course}
                    onChange={(e) => setCourse(e.target.value)}
                  >
                    <option value="BTech">BTech</option>
                    <option value="MCA">MCA</option>
                    <option value="Diploma">Diploma</option>
                  </select>
                  <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none">expand_more</span>
                </div>
              </div>

              {/* Academic Year */}
              <div>
                <label className="block font-label text-sm font-semibold text-on-surface mb-1" htmlFor="academic-year">Academic Year</label>
                <div className="relative">
                  <select 
                    className="w-full bg-surface border border-outline-variant/50 rounded-xl px-4 py-3 text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-shadow font-body text-sm appearance-none" 
                    id="academic-year"
                    value={academicYear}
                    onChange={(e) => setAcademicYear(e.target.value)}
                  >
                    <option>2023 - 2024</option>
                    <option>2024 - 2025</option>
                    <option>2025 - 2026</option>
                    <option>2026 - 2027</option>
                  </select>
                  <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none">expand_more</span>
                </div>
              </div>

              {/* Validity (Read-only/Calculated automatically) */}
              <div>
                <label className="block font-label text-sm font-semibold text-on-surface mb-1" htmlFor="validity">Validity (Calculated)</label>
                <input 
                  disabled
                  className="w-full bg-surface-container border border-outline-variant/30 rounded-xl px-4 py-3 text-on-surface-variant font-body text-sm cursor-not-allowed" 
                  id="validity" 
                  type="text" 
                  value={validity}
                />
              </div>

              {/* Branch */}
              <div>
                <label className="block font-label text-sm font-semibold text-on-surface mb-1" htmlFor="branch">Branch / Specialty</label>
                <input 
                  required
                  className="w-full bg-surface border border-outline-variant/50 rounded-xl px-4 py-3 text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-shadow font-body text-sm" 
                  id="branch" 
                  placeholder="e.g. CSE" 
                  type="text" 
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                />
              </div>

              {/* DOB */}
              <div>
                <label className="block font-label text-sm font-semibold text-on-surface mb-1" htmlFor="dob">Date of Birth</label>
                <input 
                  required
                  className="w-full bg-surface border border-outline-variant/50 rounded-xl px-4 py-3 text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-shadow font-body text-sm" 
                  id="dob" 
                  type="date" 
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                />
              </div>

              {/* Blood Group */}
              <div>
                <label className="block font-label text-sm font-semibold text-on-surface mb-1" htmlFor="bloodGroup">Blood Group</label>
                <div className="relative">
                  <select 
                    className="w-full bg-surface border border-outline-variant/50 rounded-xl px-4 py-3 text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-shadow font-body text-sm appearance-none" 
                    id="bloodGroup"
                    value={bloodGroup}
                    onChange={(e) => setBloodGroup(e.target.value)}
                  >
                    <option>A+</option>
                    <option>A-</option>
                    <option>B+</option>
                    <option>B-</option>
                    <option>O+</option>
                    <option>O-</option>
                    <option>AB+</option>
                    <option>AB-</option>
                  </select>
                  <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none">expand_more</span>
                </div>
              </div>

              {/* Phone */}
              <div>
                <label className="block font-label text-sm font-semibold text-on-surface mb-1" htmlFor="phone">Phone Number</label>
                <input 
                  required
                  className="w-full bg-surface border border-outline-variant/50 rounded-xl px-4 py-3 text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-shadow font-body text-sm" 
                  id="phone" 
                  placeholder="e.g. 9876543210" 
                  type="tel" 
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>

              {/* Gmail / Email */}
              <div className="sm:col-span-2 bg-surface-container-low p-4 rounded-xl border border-outline-variant/10">
                <label className="block font-label text-sm font-semibold text-on-surface mb-1" htmlFor="email">Gmail Address</label>
                <input 
                  required
                  className="w-full bg-surface border border-outline-variant/50 rounded-xl px-4 py-3 text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-shadow font-body text-sm" 
                  id="email" 
                  placeholder="e.g. eleanor@gmail.com" 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <span className="text-[10px] text-outline font-semibold uppercase tracking-wider block mt-1.5 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[12px]">security</span>
                  For database lookup only - Will NOT be printed on the physical ID card.
                </span>
              </div>

              {/* Address */}
              <div className="sm:col-span-2">
                <label className="block font-label text-sm font-semibold text-on-surface mb-1" htmlFor="address">Residential Address</label>
                <textarea 
                  required
                  rows={2}
                  className="w-full bg-surface border border-outline-variant/50 rounded-xl px-4 py-3 text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-shadow font-body text-sm resize-none" 
                  id="address" 
                  placeholder="Street, City, State, ZIP" 
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </div>
            </div>

            <div className="pt-4 border-t border-outline-variant/15 mt-6">
              <button 
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 bg-primary text-on-primary rounded-xl font-label text-base font-bold shadow-sm hover:bg-primary/90 hover:shadow-md transition-all flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <><span className="material-symbols-outlined animate-spin font-bold">sync</span> Saving...</>
                ) : (
                  <>
                    <span className="material-symbols-outlined">badge</span>
                    Generate Identity Card
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* ID Cards Preview Area (Fitted Side-by-Side) */}
        <div className="xl:col-span-5 flex flex-col items-center xl:items-start pt-4 xl:pt-0 w-full">
          <div className="sticky top-24 w-full flex flex-col items-center xl:items-start">
            <h3 className="font-headline text-xl text-on-surface mb-6 flex items-center gap-2 self-start xl:self-auto font-bold">
              <span className="material-symbols-outlined text-tertiary">badge</span>
              Card Preview (Front & Back)
            </h3>

            {/* Front & Back Cards printable container */}
            <div id="printable-container" className="flex flex-col lg:flex-row xl:flex-col gap-6 justify-center w-full max-w-sm lg:max-w-none xl:max-w-sm mx-auto xl:mx-0">
              
              {/* 1. FRONT SIDE CARD */}
              <div id="printable-id-card-front" className="w-[320px] sm:w-[330px] h-[500px] bg-surface-container-lowest rounded-2xl shadow-md border border-outline-variant/20 overflow-hidden relative flex flex-col shrink-0 animate-fade-in">
                {/* Header */}
                <div className="bg-primary px-5 py-4 flex items-center gap-4 relative overflow-hidden">
                  <div className="absolute inset-0 opacity-15" style={{ backgroundImage: "radial-gradient(circle at 2px 2px, white 1px, transparent 0)", backgroundSize: "12px 12px" }}></div>
                  <img alt="MIC College Logo" className="w-10 h-10 object-contain relative z-10 bg-white rounded p-1" src="/mic-logo.svg"/>
                  <div className="relative z-10 text-white">
                    <h4 className="font-display font-bold text-base leading-tight tracking-wide">M.I.C.</h4>
                    <p className="text-[9px] uppercase tracking-widest text-primary-fixed opacity-90">Modern Institute College</p>
                  </div>
                  <div className="absolute top-2 right-4 text-[9px] text-white/40 font-bold tracking-widest uppercase">Front</div>
                </div>

                {/* Card Body */}
                <div className="flex-1 px-5 py-4 flex flex-col items-center justify-between bg-gradient-to-b from-surface-container-lowest to-surface">
                  {/* Photo */}
                  <div className="w-28 h-36 bg-surface-container-high rounded-xl shadow-sm border-2 border-surface-container-lowest relative overflow-hidden flex items-center justify-center shrink-0">
                    {previewData.photoUrl ? (
                      <img className="absolute inset-0 w-full h-full object-cover" src={previewData.photoUrl} alt="Student Portrait" />
                    ) : (
                      <span className="material-symbols-outlined text-outline-variant text-4xl relative z-10">person</span>
                    )}
                  </div>

                  {/* Details */}
                  <div className="text-center w-full space-y-2 mt-2">
                    <div>
                      <h2 className="font-headline font-bold text-lg text-on-surface truncate">{previewData.name}</h2>
                      <p className="text-primary font-label text-xs font-bold uppercase tracking-wider mt-0.5 truncate">
                        {previewData.course} - {previewData.branch}
                      </p>
                    </div>
                    <div className="w-10 h-px bg-outline-variant/30 mx-auto"></div>
                    <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-left w-full px-2 text-xs">
                      <div className="font-label text-on-surface-variant uppercase tracking-wider text-[9px]">Reg No</div>
                      <div className="font-body font-bold text-on-surface text-right truncate">{previewData.registerNumber}</div>
                      
                      <div className="font-label text-on-surface-variant uppercase tracking-wider text-[9px]">Validity</div>
                      <div className="font-body font-bold text-on-surface text-right text-[11px] truncate">{previewData.validity}</div>
                    </div>
                  </div>
                </div>

                {/* Footer Barcode */}
                <div className="bg-surface-container px-6 py-3 border-t border-outline-variant/20 flex flex-col items-center justify-center shrink-0">
                  <div className="w-48 h-8 bg-white flex items-center justify-center px-2 py-1 rounded">
                    <svg ref={barcodeRef} className="w-full h-full"></svg>
                  </div>
                  <span className="font-body text-[9px] text-on-surface-variant mt-1 tracking-widest uppercase font-semibold">{previewData.registerNumber}</span>
                </div>
              </div>

              {/* 2. BACK SIDE CARD */}
              <div id="printable-id-card-back" className="w-[320px] sm:w-[330px] h-[500px] bg-surface-container-lowest rounded-2xl shadow-md border border-outline-variant/20 overflow-hidden relative flex flex-col shrink-0 animate-fade-in">
                {/* Header */}
                <div className="bg-primary px-5 py-4 flex items-center justify-between relative overflow-hidden shrink-0">
                  <div className="absolute inset-0 opacity-15" style={{ backgroundImage: "radial-gradient(circle at 2px 2px, white 1px, transparent 0)", backgroundSize: "12px 12px" }}></div>
                  <div className="relative z-10 text-white flex items-center gap-2">
                    <span className="material-symbols-outlined text-lg">security</span>
                    <span className="font-display font-bold text-sm tracking-wider uppercase">Institutional ID Card</span>
                  </div>
                  <span className="text-[9px] text-white/40 font-bold tracking-widest uppercase relative z-10">Back</span>
                </div>

                {/* Backside Details List */}
                <div className="flex-1 px-6 py-5 flex flex-col justify-between bg-gradient-to-b from-surface-container-lowest to-surface">
                  <div className="space-y-4">
                    <h3 className="font-display text-xs font-semibold text-primary uppercase tracking-widest border-b border-outline-variant/20 pb-1">Student Particulars</h3>
                    
                    <div className="space-y-2.5 text-xs">
                      <div className="flex justify-between items-start border-b border-outline-variant/10 pb-1">
                        <span className="font-label text-on-surface-variant uppercase text-[9px] tracking-wider">DOB</span>
                        <span className="font-body font-bold text-on-surface">{previewData.dob || '-'}</span>
                      </div>
                      <div className="flex justify-between items-start border-b border-outline-variant/10 pb-1">
                        <span className="font-label text-on-surface-variant uppercase text-[9px] tracking-wider">Blood Group</span>
                        <span className="font-body font-bold text-on-surface">{previewData.bloodGroup}</span>
                      </div>
                      <div className="flex justify-between items-start border-b border-outline-variant/10 pb-1">
                        <span className="font-label text-on-surface-variant uppercase text-[9px] tracking-wider">Phone</span>
                        <span className="font-body font-bold text-on-surface">{previewData.phone || '-'}</span>
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="font-label text-on-surface-variant uppercase text-[9px] tracking-wider">Residential Address</span>
                        <span className="font-body text-[11px] text-on-surface leading-relaxed max-h-[60px] overflow-hidden">{previewData.address || '-'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Institutional Notes */}
                  <div className="space-y-3 mt-2">
                    <div className="p-3 bg-surface-container border border-outline-variant/10 rounded-xl text-[10px] text-on-surface-variant leading-relaxed font-body">
                      <strong>Note:</strong> This card is property of Modern Institute College. If found, please return to the Registrar's Office.
                    </div>
                    <div className="flex justify-between items-end pt-1 text-[10px]">
                      <div className="flex flex-col items-center">
                        <div className="w-20 border-b border-on-surface/50 h-5"></div>
                        <span className="text-[8px] text-outline font-semibold uppercase tracking-wider mt-1">Holder's Sign</span>
                      </div>
                      <div className="flex flex-col items-center">
                        <div className="w-20 border-b border-on-surface/50 h-5"></div>
                        <span className="text-[8px] text-outline font-semibold uppercase tracking-wider mt-1">Registrar</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer Brand Logo strip */}
                <div className="bg-surface-container py-3 border-t border-outline-variant/20 flex items-center justify-center shrink-0">
                  <span className="text-[9px] font-label font-bold text-on-surface-variant tracking-wider uppercase">Modern Institute College</span>
                </div>
              </div>

            </div>

            <div className="mt-6 flex flex-wrap gap-4 justify-center w-full max-w-sm mx-auto xl:mx-0">
              <button 
                onClick={handlePrint}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-primary hover:bg-primary/90 text-on-primary rounded-xl font-label text-sm font-semibold transition-all shadow-md active:scale-95"
              >
                <span className="material-symbols-outlined text-sm">print</span> Print Front & Back ID Card
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
