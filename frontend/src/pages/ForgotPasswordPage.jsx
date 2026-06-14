import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, Loader2, KeyRound, ShieldCheck, Lock, ArrowRight, ArrowLeft, AlertCircle } from "lucide-react";
import API from "../api";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { formatApiError, sanitizeOtp } from "../utils/formatApiError";
import { useAuth } from "../context/AuthContext";

/* ================= ANIMATION VARIANTS ================= */
const slideIn = {
  hidden: { opacity: 0, x: 30 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.4, ease: "easeOut" } },
  exit:   { opacity: 0, x: -30, transition: { duration: 0.25 } },
};
const container = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.09, delayChildren: 0.1 } },
};
const item = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut" } },
};

/* ================= STEP CONFIG ================= */
const stepIcons  = [KeyRound, ShieldCheck, Lock];
const stepLabels = ["Enter Email", "Verify OTP", "New Password"];
const stepDescs  = ["We'll verify your registered account", "Check your inbox", "Choose a strong password"];

/* ================= STEP INDICATOR ================= */
const StepIndicator = ({ step }) => (
  <div className="flex items-center justify-center gap-2 mb-6">
    {stepLabels.map((label, i) => (
      <div key={i} className="flex items-center gap-2">
        <div className={`flex items-center gap-1.5 ${i + 1 <= step ? "opacity-100" : "opacity-40"}`}>
          <motion.div
            animate={{ scale: i + 1 === step ? 1.1 : 1 }}
            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
              ${i + 1 < step ? "bg-green-500 text-white" : i + 1 === step ? "bg-orange-500 text-white" : "bg-gray-200 text-gray-500"}`}
          >
            {i + 1 < step ? "✓" : i + 1}
          </motion.div>
          <span className={`text-xs font-medium hidden sm:block ${i + 1 === step ? "text-orange-600" : "text-gray-400"}`}>{label}</span>
        </div>
        {i < stepLabels.length - 1 && (
          <div className={`w-6 h-0.5 rounded ${i + 1 < step ? "bg-green-400" : "bg-gray-200"}`} />
        )}
      </div>
    ))}
  </div>
);

/* ================= COMPONENT ================= */
const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const [step, setStep]               = useState(1);
  const [email, setEmail]             = useState("");
  const [otp, setOtp]                 = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPwd, setConfirmPwd]   = useState("");
  const [loading, setLoading]         = useState(false);
  const [showPwd, setShowPwd]         = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // SECURITY: Prevent admin users from accessing password reset
  useEffect(() => {
    if (!authLoading && user?.role === "admin") {
      toast.error("Admin password cannot be reset through this page. Contact system administrator.");
      navigate("/admin/dashboard");
    }
  }, [authLoading, user, navigate]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (user?.role === "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-4">
          <AlertCircle size={64} className="mx-auto mb-4 text-red-500" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600 mb-6">Admin password cannot be reset through this page. Contact system administrator.</p>
          <button
            onClick={() => navigate("/admin/dashboard")}
            className="px-6 py-3 bg-orange-500 text-white rounded-xl font-semibold hover:bg-orange-600 transition-colors"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  /* --- Send OTP (checks email is registered) --- */
  const sendOtp = async () => {
    if (!email) { toast.error("Enter your email first"); return; }
    setLoading(true);
    try {
      const res = await API.post("/auth/send-reset-otp", { email: email.trim().toLowerCase() });
      const otpCode = res?.data?.otp;
      if (process.env.NODE_ENV === "development" && otpCode) {
        toast.success(`OTP sent! Use code: ${otpCode}`);
      } else {
        toast.success("OTP sent to your registered email 📬");
      }
      setStep(2);
    } catch (err) {
      const detail = err?.response?.data?.detail;
      // #region agent log
      fetch('http://127.0.0.1:7559/ingest/ac98a93e-e671-495f-a3ce-59b4abacbf8f',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'3e7df7'},body:JSON.stringify({sessionId:'3e7df7',location:'ForgotPasswordPage.jsx:sendOtp',message:'send_otp_error',data:{status:err?.response?.status,detailType:Array.isArray(detail)?'array':typeof detail},timestamp:Date.now(),hypothesisId:'H2'})}).catch(()=>{});
      // #endregion
      toast.error(formatApiError(detail, "Failed to send OTP"));
    } finally { setLoading(false); }
  };

  /* --- Verify OTP --- */
  const verifyOtp = async () => {
    const cleanedOtp = sanitizeOtp(otp);
    if (!cleanedOtp) { toast.error("Enter the 6-digit OTP"); return; }
    setLoading(true);
    try {
      await API.post("/auth/verify-otp", { email: email.trim().toLowerCase(), otp: cleanedOtp });
      toast.success("OTP verified ✅");
      setStep(3);
    } catch (err) {
      const detail = err?.response?.data?.detail;
      // #region agent log
      fetch('http://127.0.0.1:7559/ingest/ac98a93e-e671-495f-a3ce-59b4abacbf8f',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'3e7df7'},body:JSON.stringify({sessionId:'3e7df7',location:'ForgotPasswordPage.jsx:verifyOtp',message:'verify_otp_error',data:{status:err?.response?.status,detailType:Array.isArray(detail)?'array':typeof detail,otpLen:cleanedOtp.length},timestamp:Date.now(),hypothesisId:'H2'})}).catch(()=>{});
      // #endregion
      toast.error(formatApiError(detail, "Invalid OTP"));
    } finally { setLoading(false); }
  };

  /* --- Reset Password --- */
  const resetPassword = async (e) => {
    e.preventDefault();
    if (!newPassword || !confirmPwd) { toast.error("Please fill all fields"); return; }
    if (newPassword !== confirmPwd)  { toast.error("Passwords do not match"); return; }
    setLoading(true);
    try {
      await API.post("/auth/reset-password", { email: email.trim().toLowerCase(), password: newPassword });
      toast.success("Password reset successfully 🔐");
      navigate("/login");
    } catch (err) {
      toast.error(formatApiError(err?.response?.data?.detail, "Failed to reset password"));
    } finally { setLoading(false); }
  };

  const StepIcon = stepIcons[step - 1];

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-amber-50 via-orange-50 to-white">

      {/* Blobs */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-orange-300/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-amber-200/20 rounded-full blur-3xl pointer-events-none" />

      <motion.div className="w-full max-w-md mx-4 z-10" variants={container} initial="hidden" animate="visible">

        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/60 overflow-hidden">
          {/* Animated progress bar */}
          <div className="h-1.5 w-full bg-gray-100 relative">
            <motion.div
              className="h-full bg-gradient-to-r from-orange-400 to-amber-500"
              animate={{ width: `${(step / 3) * 100}%` }}
              transition={{ duration: 0.45, ease: "easeInOut" }}
            />
          </div>

          <div className="p-8 sm:p-10">

            {/* Header */}
            <motion.div variants={item} className="text-center mb-5">
              <motion.div
                key={step}
                initial={{ scale: 0.6, opacity: 0, rotate: -10 }}
                animate={{ scale: 1, opacity: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 18 }}
                className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center shadow-lg shadow-orange-200"
              >
                <StepIcon className="text-white" size={28} />
              </motion.div>
              <h1 className="text-2xl font-extrabold text-gray-800">Reset Password</h1>
              <p className="text-sm text-gray-500 mt-1">{stepDescs[step - 1]}</p>
            </motion.div>

            <StepIndicator step={step} />

            <AnimatePresence mode="wait">

              {/* STEP 1 — EMAIL */}
              {step === 1 && (
                <motion.div key="s1" variants={slideIn} initial="hidden" animate="visible" exit="exit" className="space-y-4">
                  <div>
                    <Label className="text-gray-700 font-semibold text-sm">Registered Email</Label>
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="yourname@gmail.com"
                      className="mt-1.5 rounded-xl border-gray-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20 transition-all"
                    />
                    <p className="text-xs text-gray-400 mt-1">OTP will only be sent to a registered account</p>
                  </div>
                  <motion.button
                    onClick={sendOtp}
                    disabled={loading}
                    whileHover={{ scale: loading ? 1 : 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-orange-500 to-amber-500 shadow-lg shadow-orange-200/60 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
                  >
                    {loading ? <><Loader2 className="animate-spin" size={18} /> Sending…</> : <><span>Send OTP</span><ArrowRight size={18} /></>}
                  </motion.button>
                </motion.div>
              )}

              {/* STEP 2 — OTP */}
              {step === 2 && (
                <motion.div key="s2" variants={slideIn} initial="hidden" animate="visible" exit="exit" className="space-y-4">
                  <div>
                    <Label className="text-gray-700 font-semibold text-sm">6-Digit OTP</Label>
                    <Input
                      value={otp}
                      onChange={(e) => setOtp(sanitizeOtp(e.target.value))}
                      placeholder="• • • • • •"
                      maxLength={6}
                      className="mt-1.5 rounded-xl border-gray-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20 text-center text-2xl tracking-[0.5em] font-mono transition-all"
                    />
                    <p className="text-xs text-gray-400 mt-1 text-center">Sent to <strong>{email}</strong></p>
                  </div>
                  <motion.button
                    onClick={verifyOtp}
                    disabled={loading}
                    whileHover={{ scale: loading ? 1 : 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-orange-500 to-amber-500 shadow-lg shadow-orange-200/60 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
                  >
                    {loading ? <><Loader2 className="animate-spin" size={18} /> Verifying…</> : <><ShieldCheck size={18} /><span>Verify OTP</span></>}
                  </motion.button>
                  <button onClick={() => { setStep(1); setOtp(""); }}
                    className="w-full py-2 text-sm text-gray-500 hover:text-orange-500 flex items-center justify-center gap-1 transition-colors">
                    <ArrowLeft size={14} /> Try different email
                  </button>
                </motion.div>
              )}

              {/* STEP 3 — NEW PASSWORD */}
              {step === 3 && (
                <motion.form key="s3" variants={slideIn} initial="hidden" animate="visible" exit="exit" onSubmit={resetPassword} className="space-y-4">
                  <div>
                    <Label className="text-gray-700 font-semibold text-sm">New Password</Label>
                    <div className="relative mt-1.5">
                      <Input
                        type={showPwd ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Min 8 chars, A-Z, a-z, 0-9"
                        className="rounded-xl border-gray-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20 pr-10 transition-all"
                      />
                      <button type="button" onClick={() => setShowPwd(!showPwd)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-orange-500 transition-colors">
                        {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <Label className="text-gray-700 font-semibold text-sm">Confirm Password</Label>
                    <div className="relative mt-1.5">
                      <Input
                        type={showConfirm ? "text" : "password"}
                        value={confirmPwd}
                        onChange={(e) => setConfirmPwd(e.target.value)}
                        placeholder="Re-enter new password"
                        className={`rounded-xl border-gray-200 focus:ring-2 pr-10 transition-all ${
                          confirmPwd && confirmPwd !== newPassword
                            ? "border-red-400 focus:border-red-400 focus:ring-red-400/20"
                            : "focus:border-orange-400 focus:ring-orange-400/20"
                        }`}
                      />
                      <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-orange-500 transition-colors">
                        {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    {confirmPwd && confirmPwd !== newPassword && (
                      <p className="text-xs text-red-500 mt-1">Passwords don't match</p>
                    )}
                  </div>
                  <motion.button
                    type="submit"
                    disabled={loading}
                    whileHover={{ scale: loading ? 1 : 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-orange-500 to-amber-500 shadow-lg shadow-orange-200/60 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
                  >
                    {loading ? <><Loader2 className="animate-spin" size={18} /> Saving…</> : <><Lock size={18} /><span>Save New Password</span></>}
                  </motion.button>
                </motion.form>
              )}

            </AnimatePresence>

            {/* Back to login */}
            <motion.div variants={item} className="mt-5">
              <Link to="/login"
                className="w-full flex items-center justify-center py-2.5 rounded-xl border border-gray-200 text-sm text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-all font-medium">
                ← Back to Sign In
              </Link>
            </motion.div>

          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-4">eCanteen · Student Food Ordering Platform</p>
      </motion.div>
    </div>
  );
};

export default ForgotPasswordPage;