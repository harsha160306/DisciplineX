import { useState, useRef, useEffect } from 'react';
import api from '../utils/api';
import { toast } from 'react-hot-toast';
import JsBarcode from 'jsbarcode';
// Tesseract is loaded dynamically on-demand to keep the initial bundle small

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

  const compressImage = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          let width = img.width;
          let height = img.height;
          
          // Downscale to max 400x400 to help reduce size drastically
          const MAX_WIDTH = 400;
          const MAX_HEIGHT = 400;
          
          if (width > height) {
            if (width > MAX_WIDTH) {
              height = Math.round(height * (MAX_WIDTH / width));
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width = Math.round(width * (MAX_HEIGHT / height));
              height = MAX_HEIGHT;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          ctx.drawImage(img, 0, 0, width, height);
          
          let quality = 0.9;
          let dataUrl = canvas.toDataURL('image/jpeg', quality);
          
          // Base64 size in bytes is roughly (length * 3 / 4)
          // Keep reducing quality until under 50KB (50 * 1024 bytes)
          while (dataUrl.length * 0.75 > 50 * 1024 && quality > 0.1) {
            quality -= 0.1;
            dataUrl = canvas.toDataURL('image/jpeg', quality);
          }
          
          resolve(dataUrl);
        };
        img.onerror = (error) => reject(error);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Please upload an image file.');
        return;
      }
      try {
        toast.loading('Compressing photo...', { id: 'compress' });
        const compressedBase64 = await compressImage(file);
        setPhotoUrl(compressedBase64);
        toast.success('Photo compressed successfully!', { id: 'compress' });
      } catch (err) {
        toast.error('Failed to process image.', { id: 'compress' });
      }
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Please drop an image file.');
        return;
      }
      try {
        toast.loading('Compressing photo...', { id: 'compress' });
        const compressedBase64 = await compressImage(file);
        setPhotoUrl(compressedBase64);
        toast.success('Photo compressed successfully!', { id: 'compress' });
      } catch (err) {
        toast.error('Failed to process image.', { id: 'compress' });
      }
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
        toast.error('Registration failed. Please try again.');
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
                    <p className="text-xs leading-5 text-on-surface-variant mt-0.5">Will be automatically compressed &lt; 50KB</p>
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

        {/* Profile Preview Area */}
        <div className="xl:col-span-5 flex flex-col items-center xl:items-start pt-4 xl:pt-0 w-full">
          <div className="sticky top-24 w-full flex flex-col items-center xl:items-start">
            <h3 className="font-headline text-xl text-on-surface mb-6 flex items-center gap-2 self-start xl:self-auto font-bold">
              <span className="material-symbols-outlined text-tertiary">person</span>
              Profile Preview
            </h3>

            <div className="w-full bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/30 overflow-hidden animate-fade-in relative">
              {/* Purple Header Banner */}
              <div className="h-28 bg-[#6c2bd9] relative overflow-hidden">
                <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(circle at 2px 2px, white 1px, transparent 0)", backgroundSize: "14px 14px" }}></div>
              </div>
              
              {/* Profile Header section (Avatar + Name) */}
              <div className="px-6 pb-5">
                <div className="flex flex-col sm:flex-row sm:items-end gap-5 -mt-12 mb-5">
                  {/* Avatar */}
                  <div className="relative">
                    <div className="w-24 h-24 bg-surface-container-high rounded-2xl shadow-sm border-[4px] border-surface-container-lowest relative overflow-hidden flex items-center justify-center shrink-0 z-10">
                      {previewData.photoUrl ? (
                        <img className="absolute inset-0 w-full h-full object-cover" src={previewData.photoUrl} alt="Student Portrait" />
                      ) : (
                        <span className="material-symbols-outlined text-outline-variant text-4xl">person</span>
                      )}
                    </div>
                    {/* Status badge */}
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-sm z-20">
                      <span className="material-symbols-outlined text-emerald-500 text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                    </div>
                  </div>
                  
                  {/* Name and Reg No */}
                  <div className="flex-1 pb-1">
                    <div className="flex items-center gap-3">
                      <h2 className="font-display font-bold text-2xl text-on-surface truncate">{previewData.name || 'Student Name'}</h2>
                      <span className="px-2 py-0.5 bg-blue-50 text-blue-600 font-mono text-[10px] font-bold rounded-md uppercase tracking-wider hidden sm:block">
                        {previewData.registerNumber || 'ID PENDING'}
                      </span>
                    </div>
                    <p className="font-label text-[11px] font-bold text-on-surface-variant uppercase tracking-widest mt-1">
                      Student Profile
                    </p>
                  </div>
                </div>

                {/* Info Cards Grid */}
                <div className="grid grid-cols-2 gap-3 mt-2">
                  <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-3 flex flex-col justify-center">
                    <div className="flex items-center gap-1.5 text-primary mb-1.5">
                      <span className="material-symbols-outlined text-[14px]">badge</span>
                      <span className="font-label text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Reg. No.</span>
                    </div>
                    <span className="font-body font-bold text-sm text-on-surface truncate">{previewData.registerNumber || '-'}</span>
                  </div>
                  
                  <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-3 flex flex-col justify-center">
                    <div className="flex items-center gap-1.5 text-primary mb-1.5">
                      <span className="material-symbols-outlined text-[14px]">school</span>
                      <span className="font-label text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Department</span>
                    </div>
                    <span className="font-body font-bold text-sm text-on-surface truncate">
                      {previewData.course ? `${previewData.course} - ${previewData.branch}` : '-'}
                    </span>
                  </div>

                  <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-3 flex flex-col justify-center">
                    <div className="flex items-center gap-1.5 text-primary mb-1.5">
                      <span className="material-symbols-outlined text-[14px]">calendar_month</span>
                      <span className="font-label text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Academic Year</span>
                    </div>
                    <span className="font-body font-bold text-sm text-on-surface truncate">{previewData.academicYear || '-'}</span>
                  </div>

                  <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-3 flex flex-col justify-center">
                    <div className="flex items-center gap-1.5 text-primary mb-1.5">
                      <span className="material-symbols-outlined text-[14px]">verified</span>
                      <span className="font-label text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Validity</span>
                    </div>
                    <span className="font-body font-bold text-sm text-on-surface truncate">{previewData.validity || '-'}</span>
                  </div>
                </div>
                
                {/* Secondary Info Row */}
                <div className="flex flex-wrap gap-2 mt-3">
                  <div className="bg-surface-container-low px-3 py-2 rounded-lg text-xs font-medium text-on-surface-variant flex items-center gap-2">
                    <span className="material-symbols-outlined text-[14px]">cake</span>
                    {previewData.dob || 'DOB'}
                  </div>
                  <div className="bg-surface-container-low px-3 py-2 rounded-lg text-xs font-medium text-on-surface-variant flex items-center gap-2">
                    <span className="material-symbols-outlined text-[14px]">bloodtype</span>
                    {previewData.bloodGroup || 'Blood Group'}
                  </div>
                  <div className="bg-surface-container-low px-3 py-2 rounded-lg text-xs font-medium text-on-surface-variant flex items-center gap-2">
                    <span className="material-symbols-outlined text-[14px]">call</span>
                    {previewData.phone || 'Phone'}
                  </div>
                </div>
                
                {previewData.address && (
                  <div className="bg-surface-container-low px-3 py-2 rounded-lg text-xs font-medium text-on-surface-variant flex items-start gap-2 mt-2 w-full">
                    <span className="material-symbols-outlined text-[14px] mt-0.5">home</span>
                    <span className="flex-1 leading-relaxed">{previewData.address}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
