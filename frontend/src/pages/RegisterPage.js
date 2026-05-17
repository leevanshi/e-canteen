import { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Coffee, Loader2, Eye, EyeOff, Mail, ShieldCheck, UserPlus, ArrowRight, ArrowLeft } from "lucide-react";
import API from "../api";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";

/* ================= ANIMATION VARIANTS ================= */
const container = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.09, delayChildren: 0.1 } },
};
const item = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut" } },
};
const slideIn = {
  hidden: { opacity: 0, x: 30 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.4, ease: "easeOut" } },
  exit: { opacity: 0, x: -30, transition: { duration: 0.25 } },
};

/* ================= STEP INDICATOR ================= */
const StepIndicator = ({ current, total }) => (
  <div className="flex items-center justify-center gap-2 mb-6">
    {Array.from({ length: total }).map((_, i) => (
      <motion.div
        key={i}
        className={`h-2 rounded-full transition-all duration-300 ${i < current ? "bg-orange-500" : i === current - 1 ? "bg-orange-400 w-6" : "bg-gray-200"}`}
        animate={{ width: i === current - 1 ? 24 : 8 }}
      />
    ))}
  </div>
);

/* ================= STEP ICONS ================= */
const stepIcons = [Mail, ShieldCheck, UserPlus];
const stepTitles = ["Verify Email", "Enter OTP", "Create Account"];
const stepDescs = ["We'll send a 6-digit code", "Check your NMIMS inbox", "Almost there!"];

/* ================= COMPONENT ================= */
const RegisterPage = () => {
  const navigate = useNavigate();
  const { role } = useParams();

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({ name: "", email: "", password: "", otp: "" });

  useEffect(() => {
    if (!["student", "faculty"].includes(role)) navigate("/join", { replace: true });
  }, [role, navigate]);

  const set = (key, val) => setFormData((p) => ({ ...p, [key]: val }));
  const roleLabel = role?.charAt(0).toUpperCase() + role?.slice(1);

  /* --- Send OTP --- */
  const handleSendOtp = async () => {
    if (!formData.email) { toast.error("Enter your NMIMS email first"); return; }
    setLoading(true);
    try {
      await API.post("/auth/send-otp", { email: formData.email.trim().toLowerCase() });
      toast.success("OTP sent! Check your inbox 📬");
      setStep(2);
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to send OTP");
    } finally { setLoading(false); }
  };

  /* --- Verify OTP --- */
  const handleVerifyOtp = async () => {
    if (!formData.otp) { toast.error("Enter the OTP"); return; }
    setLoading(true);
    try {
      await API.post("/auth/verify-otp", { email: formData.email.trim().toLowerCase(), otp: formData.otp });
      toast.success("Email verified ✅");
      setStep(3);
    } catch (err) {
      toast.error(err.response?.data?.detail || "Invalid OTP");
    } finally { setLoading(false); }
  };

  /* --- Register --- */
  const handleRegister = async (e) => {
    e.preventDefault();
    const { name, email, password } = formData;
    if (!name || !email || !password) { toast.error("Please fill all fields"); return; }
    setLoading(true);
    try {
      await API.post("/auth/register", { name: name.trim(), email: email.trim().toLowerCase(), password, role });
      toast.success("Account created! Welcome on board 🎉");
      navigate("/login", { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.detail || "Registration failed");
    } finally { setLoading(false); }
  };

  const StepIcon = stepIcons[step - 1];

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-amber-50 via-orange-50 to-white">

      {/* Blobs */}
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-orange-300/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-amber-200/20 rounded-full blur-3xl pointer-events-none" />

      <motion.div className="w-full max-w-md mx-4 z-10" variants={container} initial="hidden" animate="visible">

        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/60 overflow-hidden">
          {/* Progress bar */}
          <div className="h-1.5 w-full bg-gray-100 relative">
            <motion.div
              className="h-full bg-gradient-to-r from-orange-400 to-amber-500"
              animate={{ width: `${(step / 3) * 100}%` }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
            />
          </div>

          <div className="p-8 sm:p-10">

            {/* Header */}
            <motion.div variants={item} className="text-center mb-6">
              <motion.div
                className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center shadow-lg shadow-orange-200"
                whileHover={{ rotate: 8, scale: 1.07 }}
                transition={{ type: "spring", stiffness: 300 }}
                key={step}
                initial={{ scale: 0.7, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
              >
                <StepIcon className="text-white" size={28} />
              </motion.div>
              <h1 className="text-2xl font-extrabold text-gray-800">Register as {roleLabel}</h1>
              <p className="text-sm text-gray-500 mt-1">{stepDescs[step - 1]}</p>
            </motion.div>

            <StepIndicator current={step} total={3} />

            <AnimatePresence mode="wait">

              {/* STEP 1 — EMAIL */}
              {step === 1 && (
                <motion.div key="step1" variants={slideIn} initial="hidden" animate="visible" exit="exit" className="space-y-4">
                  <div>
                    <Label className="text-gray-700 font-semibold text-sm">NMIMS Email</Label>
                    <Input
                      type="email"
                      placeholder="yourname@nmims.edu.in"
                      value={formData.email}
                      onChange={(e) => set("email", e.target.value)}
                      className="mt-1.5 rounded-xl border-gray-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20 transition-all"
                    />
                    <p className="text-xs text-gray-400 mt-1">Only @nmims.in / @nmims.edu.in emails allowed</p>
                  </div>
                  <motion.button
                    onClick={handleSendOtp}
                    disabled={loading}
                    whileHover={{ scale: loading ? 1 : 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-xl font-bold text-white bg-gradient-to-r from-orange-500 to-amber-500 shadow-lg shadow-orange-200/60 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
                  >
                    {loading ? <><Loader2 className="animate-spin" size={18} /> Sending…</> : <><span>Send OTP</span><ArrowRight size={18} /></>}
                  </motion.button>
                </motion.div>
              )}

              {/* STEP 2 — OTP */}
              {step === 2 && (
                <motion.div key="step2" variants={slideIn} initial="hidden" animate="visible" exit="exit" className="space-y-4">
                  <div>
                    <Label className="text-gray-700 font-semibold text-sm">6-Digit OTP</Label>
                    <Input
                      value={formData.otp}
                      onChange={(e) => set("otp", e.target.value)}
                      placeholder="Enter OTP from email"
                      maxLength={6}
                      className="mt-1.5 rounded-xl border-gray-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20 text-center text-2xl tracking-[0.5em] font-mono transition-all"
                    />
                    <p className="text-xs text-gray-400 mt-1 text-center">OTP expires in 5 minutes</p>
                  </div>
                  <motion.button
                    onClick={handleVerifyOtp}
                    disabled={loading}
                    whileHover={{ scale: loading ? 1 : 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-xl font-bold text-white bg-gradient-to-r from-orange-500 to-amber-500 shadow-lg shadow-orange-200/60 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
                  >
                    {loading ? <><Loader2 className="animate-spin" size={18} /> Verifying…</> : <><ShieldCheck size={18} /><span>Verify OTP</span></>}
                  </motion.button>
                  <button onClick={() => setStep(1)} className="w-full py-2 text-sm text-gray-500 hover:text-orange-500 flex items-center justify-center gap-1 transition-colors">
                    <ArrowLeft size={14} /> Resend OTP
                  </button>
                </motion.div>
              )}

              {/* STEP 3 — ACCOUNT DETAILS */}
              {step === 3 && (
                <motion.form key="step3" variants={slideIn} initial="hidden" animate="visible" exit="exit" onSubmit={handleRegister} className="space-y-4">
                  <div>
                    <Label className="text-gray-700 font-semibold text-sm">Full Name</Label>
                    <Input
                      value={formData.name}
                      onChange={(e) => set("name", e.target.value)}
                      placeholder="Your full name"
                      className="mt-1.5 rounded-xl border-gray-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20 transition-all"
                    />
                  </div>
                  <div>
                    <Label className="text-gray-700 font-semibold text-sm">Password</Label>
                    <div className="relative mt-1.5">
                      <Input
                        type={showPassword ? "text" : "password"}
                        value={formData.password}
                        onChange={(e) => set("password", e.target.value)}
                        placeholder="Min 8 chars, A-Z, a-z, 0-9"
                        className="rounded-xl border-gray-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20 pr-10 transition-all"
                      />
                      <button type="button" onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-orange-500 transition-colors">
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">Must include uppercase, lowercase & number</p>
                  </div>
                  <motion.button
                    type="submit"
                    disabled={loading}
                    whileHover={{ scale: loading ? 1 : 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-xl font-bold text-white bg-gradient-to-r from-orange-500 to-amber-500 shadow-lg shadow-orange-200/60 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
                  >
                    {loading ? <><Loader2 className="animate-spin" size={18} /> Creating…</> : <><UserPlus size={18} /><span>Create Account</span></>}
                  </motion.button>
                </motion.form>
              )}

            </AnimatePresence>

            {/* Login link */}
            <p className="text-center text-sm text-gray-500 mt-6">
              Already have an account?{" "}
              <Link to="/login" className="text-orange-500 font-bold hover:text-orange-600 transition-colors">
                Sign in
              </Link>
            </p>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-4">NMIMS Chandigarh · eCanteen Platform</p>
      </motion.div>
    </div>
  );
};

export default RegisterPage;