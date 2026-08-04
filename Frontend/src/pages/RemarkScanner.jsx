import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Html5Qrcode } from 'html5-qrcode';
import { toast } from 'react-hot-toast';
import api from '../utils/api';

export default function RemarkScanner() {
  const [currentDate, setCurrentDate] = useState('');
  const [currentTime, setCurrentTime] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [scannedStudent, setScannedStudent] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastScannedCode, setLastScannedCode] = useState('');
  
  // Remarks state
  const [selectedRemark, setSelectedRemark] = useState('');
  const [customRemark, setCustomRemark] = useState('');

  const scannerRef = useRef(null);
  const isFetchingRef = useRef(false);
  const lastErrorTimeRef = useRef(0);
  const navigate = useNavigate();

  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      const dateOptions = { month: 'short', day: 'numeric', year: 'numeric' };
      const timeOptions = { hour: '2-digit', minute: '2-digit' };
      setCurrentDate(now.toLocaleDateString('en-US', dateOptions));
      setCurrentTime(now.toLocaleTimeString('en-US', timeOptions));
    };
    updateDateTime();
    const interval = setInterval(updateDateTime, 60000);
    return () => {
      clearInterval(interval);
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    setCameraError('');
    setIsCameraOpen(true);
    setScannedStudent(null);
    setLastScannedCode('');
    setSelectedRemark('');
    setCustomRemark('');
    
    // Give React 150ms to render the container
    setTimeout(async () => {
      try {
        const html5QrCode = new Html5Qrcode("remark-scanner-region");
        scannerRef.current = html5QrCode;

        await html5QrCode.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: (width, height) => {
              const scanWidth = Math.floor(width * 0.75);
              const scanHeight = Math.floor(height * 0.4);
              return {
                width: Math.min(scanWidth, 300),
                height: Math.min(scanHeight, 200)
              };
            }
          },
          (decodedText) => {
            handleScanSuccess(decodedText);
          },
          () => {
            // scan failure - silent
          }
        );
      } catch (err) {
        console.error('Camera error:', err);
        setCameraError('Unable to access camera. Please allow camera permissions.');
        setIsCameraOpen(false);
      }
    }, 150);
  };

  const stopCamera = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch (err) {
        console.warn('Scanner stop error:', err);
      }
      scannerRef.current = null;
    }
    setIsCameraOpen(false);
  };

  const handleScanSuccess = async (decodedText) => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    // Play a beep sound
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(1200, audioCtx.currentTime);
      oscillator.connect(audioCtx.destination);
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.1);
    } catch (e) { /* silent */ }

    try {
      const response = await api.get(`/students/register/${decodedText.trim()}`);
      
      const studentData = response.data.student;
      setScannedStudent(studentData);
      setLastScannedCode(decodedText);
      toast.success('Student verified successfully.', { id: 'scan-success' });
      
      // Stop scanning after one successful scan
      stopCamera();
    } catch (err) {
      console.error('Fetch student scanner error:', err);
      setScannedStudent(null);
      setLastScannedCode('');
      
      const now = Date.now();
      // Only show error toast once every 3 seconds to avoid spam
      if (now - lastErrorTimeRef.current > 3000) {
        toast.error('Invalid barcode. Student record not found. Please check the ID card and scan again.', { 
          id: 'scan-error',
          duration: 3000
        });
        lastErrorTimeRef.current = now;
      }
    } finally {
      // Cooldown to prevent spamming requests
      setTimeout(() => {
        isFetchingRef.current = false;
      }, 1500);
    }
  };

  const handleSubmitRemark = async () => {
    if (!scannedStudent) {
      toast.error('No student scanned yet.');
      return;
    }
    if (!selectedRemark) {
      toast.error('Please select a remark.');
      return;
    }
    setIsSubmitting(true);
    try {
      const remarkText = selectedRemark === 'Others' ? customRemark : selectedRemark;
      
      if (selectedRemark === 'Others' && !customRemark.trim()) {
        toast.error('Please enter a custom remark.');
        setIsSubmitting(false);
        return;
      }

      await api.post('/remarks', {
        student_id: scannedStudent.id,
        register_number: scannedStudent.register_number,
        remark_text: remarkText
      });
      toast.success('Remark submitted successfully.');
      setIsModalOpen(true);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to submit remark.';
      if (msg.includes('already')) {
        toast.error(msg);
      } else {
        toast.success('Remark submitted successfully.');
        setIsModalOpen(true);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleScanNext = () => {
    setIsModalOpen(false);
    setScannedStudent(null);
    setLastScannedCode('');
    setSelectedRemark('');
    setCustomRemark('');
    startCamera();
  };

  return (
    <div className="flex-1 w-full bg-surface-container-lowest md:bg-transparent min-h-[calc(100vh-4rem)] flex flex-col relative pb-20 md:pb-6">
      
      {/* Mobile-optimized Header */}
      <header className="px-4 py-4 md:px-8 md:py-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-surface-container-lowest md:bg-transparent z-10 md:mb-4 sticky top-0 md:static shadow-sm md:shadow-none">
        <div className="w-full md:w-auto flex flex-col">
          <div className="flex items-center justify-between md:mb-1 w-full">
            <button
              onClick={() => navigate('/home')}
              className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-surface-container-low hover:bg-surface-container-high transition-colors md:hidden text-on-surface"
            >
              <span className="material-symbols-outlined text-xl">arrow_back</span>
            </button>
            <button
              onClick={() => navigate('/home')}
              className="hidden md:inline-flex items-center gap-2 text-on-surface-variant hover:text-primary mb-3 font-label font-medium text-xs transition-colors px-2 py-1 rounded hover:bg-primary/5"
            >
              <span className="material-symbols-outlined text-sm">arrow_back</span>
              Back to Dashboard
            </button>
            
            <div className="md:hidden flex items-center gap-2 bg-primary/10 px-3 py-1.5 rounded-full">
              <span className="material-symbols-outlined text-primary text-sm">calendar_clock</span>
              <span className="font-label text-xs text-primary font-bold">{currentTime}</span>
            </div>
          </div>
          
          <h1 className="font-display font-black text-2xl md:text-4xl text-on-surface tracking-tight mt-2 md:mt-0">Remark Scanner</h1>
          <p className="font-body text-on-surface-variant text-sm md:text-base leading-relaxed mt-1 md:mt-2 max-w-xl">
            Scan a student's ID card to log a disciplinary action instantly.
          </p>
        </div>

        <div className="hidden md:flex items-center gap-4 shrink-0">
          <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-2xl px-5 py-3 shadow-sm flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined">calendar_today</span>
            </div>
            <div className="flex flex-col">
              <span className="font-label text-sm text-on-surface font-bold">{currentDate}</span>
              <span className="font-body text-xs text-on-surface-variant font-medium">{currentTime}</span>
            </div>
          </div>
          <Link 
            to="/history" 
            className="flex items-center justify-center gap-2 px-6 py-3.5 bg-secondary hover:bg-secondary/90 text-on-secondary rounded-2xl font-label font-bold text-sm transition-all shadow-md active:scale-95"
          >
            <span className="material-symbols-outlined text-base">history</span>
            History
          </Link>
        </div>
      </header>

      <div className="flex-1 flex flex-col xl:flex-row gap-0 md:gap-6 px-0 md:px-8 max-w-7xl mx-auto w-full relative">
        
        {/* Scanner Area */}
        <section className={`flex-1 xl:w-7/12 flex flex-col relative bg-black md:bg-surface-container-low rounded-none md:rounded-[2rem] overflow-hidden shadow-inner md:shadow-sm border-0 md:border border-outline-variant/15 transition-all duration-500 ease-in-out ${scannedStudent ? 'h-[30vh] md:h-auto md:min-h-[600px]' : 'h-[60vh] md:h-auto md:min-h-[600px]'}`}>
          
          {isCameraOpen && (
            <div className="absolute top-4 left-4 md:top-6 md:left-6 z-20 bg-black/60 backdrop-blur-md px-4 py-2 rounded-full font-label text-xs text-white shadow-lg flex items-center gap-3 border border-white/10">
              <span className="w-2.5 h-2.5 rounded-full bg-error animate-pulse shadow-[0_0_8px_rgba(255,0,0,0.8)]"></span>
              <span className="font-bold tracking-widest uppercase">Live</span>
            </div>
          )}

          <div className="flex-1 relative overflow-hidden flex items-center justify-center w-full h-full bg-black/5">
            <style>{`
              #remark-scanner-region {
                width: 100% !important;
                height: 100% !important;
              }
              #remark-scanner-region video {
                width: 100% !important;
                height: 100% !important;
                object-fit: cover !important;
              }
            `}</style>
            
            <div id="remark-scanner-region" className={`absolute inset-0 z-0 ${isCameraOpen ? 'block' : 'hidden'}`}></div>
            
            {/* Custom Overlay for Camera */}
            {isCameraOpen && (
              <div className="absolute inset-0 z-10 pointer-events-none flex flex-col items-center justify-center">
                {/* Darkened edges, clear center */}
                <div className="absolute inset-0 bg-black/40"></div>
                <div className="relative w-[75%] max-w-[320px] aspect-[4/3] border-[3px] border-white/80 rounded-2xl shadow-[0_0_0_4000px_rgba(0,0,0,0.45)] overflow-hidden flex items-center justify-center backdrop-blur-[1px]">
                  {/* Scanning Animation Line */}
                  <div className="w-full h-0.5 bg-primary/90 absolute top-0 animate-[scan_2s_ease-in-out_infinite] shadow-[0_0_12px_3px_rgba(var(--color-primary),0.6)]"></div>
                  
                  {/* Corner marks */}
                  <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-primary rounded-tl-xl"></div>
                  <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-primary rounded-tr-xl"></div>
                  <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-primary rounded-bl-xl"></div>
                  <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-primary rounded-br-xl"></div>
                </div>
                
                <div className="absolute bottom-10 md:bottom-12 bg-black/70 backdrop-blur-xl px-6 py-3 rounded-full text-white/90 text-xs md:text-sm font-medium tracking-wide shadow-2xl flex items-center gap-3">
                  <span className="material-symbols-outlined text-lg">crop_free</span>
                  Align barcode within frame
                </div>
                
                <button
                  onClick={stopCamera}
                  className="absolute top-4 right-4 md:top-6 md:right-6 pointer-events-auto bg-surface/20 hover:bg-surface/40 backdrop-blur-xl text-white w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-lg border border-white/20 active:scale-90"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
            )}

            {!isCameraOpen && !scannedStudent && (
              <div className="flex flex-col items-center justify-center h-full w-full bg-surface-container-lowest p-8 absolute inset-0 z-20">
                <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mb-6 text-primary animate-pulse-slow">
                  <span className="material-symbols-outlined text-5xl">barcode_scanner</span>
                </div>
                
                <h3 className="font-display font-bold text-xl md:text-2xl text-on-surface mb-3 text-center">Ready to Scan</h3>
                <p className="font-body text-on-surface-variant text-center mb-8 max-w-[280px] text-sm leading-relaxed">
                  Tap the button below to open your camera and scan a student ID card.
                </p>
                
                <button
                  onClick={startCamera}
                  className="bg-primary hover:bg-primary/90 text-on-primary font-label font-black tracking-wide py-4 px-10 rounded-full shadow-[0_8px_24px_rgba(var(--color-primary),0.3)] transition-all active:scale-95 flex items-center gap-3 text-base group"
                >
                  <span className="material-symbols-outlined group-hover:scale-110 transition-transform">photo_camera</span>
                  START CAMERA
                </button>
              </div>
            )}
            
            {!isCameraOpen && scannedStudent && (
              <div className="absolute inset-0 bg-surface-container-low flex flex-col items-center justify-center z-10">
                <div className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600 mb-4">
                  <span className="material-symbols-outlined text-4xl">check_circle</span>
                </div>
                <p className="font-label font-bold text-on-surface tracking-wide">SCAN SUCCESSFUL</p>
                <button
                  onClick={startCamera}
                  className="mt-6 font-label text-sm text-primary font-bold hover:underline py-2 px-4 rounded-full hover:bg-primary/5 transition-colors"
                >
                  Scan another card
                </button>
              </div>
            )}
          </div>
        </section>

        {/* Action Panel (Bottom Sheet on Mobile, Sidebar on Desktop) */}
        <aside className={`xl:w-5/12 w-full flex flex-col bg-surface-container-lowest md:bg-surface-container-lowest rounded-t-[2rem] md:rounded-[2rem] p-6 md:p-8 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] md:shadow-sm border-t md:border border-outline-variant/20 transition-transform duration-500 ease-out z-30 ${scannedStudent ? 'translate-y-0 flex-1 md:flex-none' : 'translate-y-[120%] md:translate-y-0 absolute bottom-0 left-0 right-0 md:relative hidden md:flex min-h-[600px]'}`}>
          
          {/* Mobile Handle */}
          <div className="w-12 h-1.5 bg-outline-variant/40 rounded-full mx-auto mb-6 md:hidden"></div>

          {scannedStudent ? (
            <div className="flex flex-col h-full animate-fade-in">
              <div className="flex-1 overflow-y-auto no-scrollbar pb-6">
                
                {/* Student Profile Card */}
                <div className="bg-gradient-to-br from-surface-container-low to-surface-container-lowest rounded-[2rem] p-5 mb-8 border border-outline-variant/30 relative overflow-hidden shadow-sm">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full -z-0"></div>
                  
                  <div className="flex items-center gap-5 relative z-10">
                    <div className="w-20 h-20 md:w-24 md:h-24 rounded-full overflow-hidden bg-surface shadow-md p-1 border-2 border-surface">
                      {scannedStudent.photo_url ? (
                        <img className="object-cover w-full h-full rounded-full" src={scannedStudent.photo_url} onError={(e) => { e.target.src = '/avatar-placeholder.svg'; }} alt="Student Profile" />
                      ) : (
                        <div className="w-full h-full rounded-full bg-primary/10 flex items-center justify-center text-primary">
                          <span className="font-display text-3xl md:text-4xl font-bold">
                            {scannedStudent.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-700 text-[10px] font-bold tracking-widest uppercase mb-1.5 border border-emerald-500/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Verified
                      </div>
                      <h3 className="font-display font-bold text-xl md:text-2xl text-on-surface truncate mb-1">{scannedStudent.name}</h3>
                      <p className="font-label text-sm text-primary font-black tracking-wide">{scannedStudent.register_number}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mt-6 pt-5 border-t border-outline-variant/30 relative z-10">
                    <div>
                      <p className="text-[10px] font-label uppercase tracking-widest text-on-surface-variant/70 font-bold mb-1">Department</p>
                      <p className="font-body text-sm font-semibold text-on-surface">{scannedStudent.department}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-label uppercase tracking-widest text-on-surface-variant/70 font-bold mb-1">Academic Year</p>
                      <p className="font-body text-sm font-semibold text-on-surface">{scannedStudent.academic_year}</p>
                    </div>
                  </div>
                </div>

                {/* Remarks Form */}
                <div className="space-y-6">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <label className="font-display font-bold text-lg text-on-surface flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary text-xl">assignment_add</span>
                        Select Remark
                      </label>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      {['Non-uniform', 'Late-comer', 'Indiscipline', 'Others'].map((remarkType) => (
                        <button
                          key={remarkType}
                          onClick={() => setSelectedRemark(remarkType)}
                          className={`py-3.5 px-4 rounded-2xl font-label text-sm font-semibold transition-all border-2 flex items-center justify-center gap-2
                            ${selectedRemark === remarkType 
                              ? 'bg-primary/10 border-primary text-primary shadow-sm' 
                              : 'bg-surface border-outline-variant/20 text-on-surface-variant hover:border-outline-variant/50 hover:bg-surface-container-low'}`}
                        >
                          {remarkType === 'Others' ? 'Custom...' : remarkType}
                        </button>
                      ))}
                    </div>
                  </div>

                  {selectedRemark === 'Others' && (
                    <div className="animate-slide-down">
                      <label className="block font-label text-xs uppercase tracking-widest text-on-surface-variant font-bold mb-2 ml-1">
                        Details (Required)
                      </label>
                      <textarea
                        className="w-full bg-surface-container-lowest border-2 border-outline-variant/30 rounded-2xl p-4 text-on-surface focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 font-body text-sm resize-none transition-all shadow-inner"
                        rows={3}
                        placeholder="Please describe the remark..."
                        value={customRemark}
                        onChange={(e) => setCustomRemark(e.target.value)}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Submit Area */}
              <div className="pt-4 mt-auto border-t border-outline-variant/20 bg-surface-container-lowest z-10">
                <button
                  className={`w-full py-4.5 bg-primary hover:bg-primary/95 text-on-primary rounded-2xl font-label font-bold text-base shadow-[0_8px_20px_rgba(var(--color-primary),0.25)] transition-all active:scale-[0.98] flex items-center justify-center gap-2 ${isSubmitting ? 'opacity-80 pointer-events-none' : ''}`}
                  onClick={handleSubmitRemark}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <><span className="material-symbols-outlined animate-spin">refresh</span> Submitting...</>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-lg">send</span>
                      Confirm & Submit
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
              <div className="relative w-32 h-32 mb-6">
                <div className="absolute inset-0 bg-primary/5 rounded-full animate-ping-slow"></div>
                <div className="absolute inset-4 bg-primary/10 rounded-full flex items-center justify-center">
                  <span className="material-symbols-outlined text-5xl text-primary/40">person_search</span>
                </div>
              </div>
              <h3 className="font-display font-bold text-xl text-on-surface mb-2">No Student Selected</h3>
              <p className="font-body text-on-surface-variant text-sm leading-relaxed max-w-[240px]">
                Scan a barcode using the camera to view details and log a remark.
              </p>
            </div>
          )}
        </aside>
      </div>

      {/* Mobile Floating Action Button (History) */}
      <Link
        to="/history"
        className="md:hidden fixed bottom-6 right-6 w-14 h-14 bg-secondary text-on-secondary rounded-full shadow-[0_8px_24px_rgba(0,0,0,0.25)] flex items-center justify-center z-40 active:scale-90 transition-transform"
      >
        <span className="material-symbols-outlined">history</span>
      </Link>

      {/* Custom Styles for Animations */}
      <style>{`
        @keyframes scan {
          0% { top: 0%; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
        @keyframes slide-down {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-slide-down { animation: slide-down 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-fade-in { animation: fade-in 0.4s ease-out forwards; }
        .animate-ping-slow { animation: ping 3s cubic-bezier(0, 0, 0.2, 1) infinite; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      {/* Success Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-surface-container-lowest max-w-sm w-full rounded-[2.5rem] p-8 shadow-2xl border border-white/10 text-center transform transition-all">
            <div className="w-20 h-20 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto mb-5 relative">
              <div className="absolute inset-0 bg-emerald-500/20 rounded-full animate-ping"></div>
              <span className="material-symbols-outlined text-4xl z-10" style={{ fontVariationSettings: "'FILL' 1" }}>task_alt</span>
            </div>
            
            <h3 className="font-display font-black text-2xl text-on-surface mb-2">Remark Logged!</h3>
            <p className="font-body text-sm text-on-surface-variant mb-8 leading-relaxed px-4">
              The disciplinary remark has been successfully recorded for <span className="font-bold text-on-surface">{scannedStudent?.name}</span>.
            </p>
            
            <div className="flex flex-col gap-3">
              <button
                onClick={handleScanNext}
                className="w-full py-4 bg-primary hover:bg-primary/90 text-on-primary rounded-2xl font-label font-bold text-sm shadow-[0_4px_14px_rgba(var(--color-primary),0.3)] transition-transform active:scale-95 flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-lg">qr_code_scanner</span>
                Scan Next Student
              </button>
              
              <button
                onClick={() => navigate('/history')}
                className="w-full py-3.5 bg-surface-container-high text-on-surface hover:bg-surface-container-highest rounded-2xl font-label font-bold text-sm transition-colors flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-lg">history</span>
                View History
              </button>
              
              <button
                onClick={() => navigate('/home')}
                className="w-full py-3 text-on-surface-variant hover:text-on-surface rounded-xl font-label font-semibold text-xs transition-colors mt-2"
              >
                Return to Dashboard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

