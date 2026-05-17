import { useState } from "react";
import { toast } from "sonner";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Eye, EyeOff, Loader2, Coffee, ArrowRight } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import API from "../api";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";

/* ================= ANIMATION VARIANTS ================= */
const container = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.09, delayChildren: 0.15 },
  },
};
const item = {
  hidden: { opacity: 0, y: 22 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut" } },
};

/* ================= COMPONENT ================= */
const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail]           = useState("");
  const [password, setPassword]     = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showPwd, setShowPwd]       = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;

    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !password.trim()) {
      toast.error("Please fill all fields");
      return;
    }

    setSubmitting(true);
    const slowTimer = setTimeout(() => toast.info("⏳ Server is waking up…"), 4000);

    try {
      const { data } = await API.post("/auth/login", { email: normalizedEmail, password });
      clearTimeout(slowTimer);

      const { access_token, user } = data || {};
      if (!access_token || !user) { toast.error("Invalid server response"); return; }

      const role = (user.role || "").toLowerCase();
      login({ id: user.id || user._id, name: user.name, email: user.email, role }, access_token);
      toast.success(`Welcome back, ${user.name || "User"}! 👋`);

      navigate(role === "admin" ? "/admin/dashboard" : "/menu", { replace: true });
    } catch (err) {
      clearTimeout(slowTimer);
      toast.error(
        !err.response
          ? "🚀 Server is starting… please wait and try again"
          : err.response?.data?.detail || "Invalid email or password"
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-amber-50 via-orange-50 to-white">

      {/* Decorative blobs */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-orange-300/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-amber-300/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 left-1/4 w-64 h-64 bg-orange-200/10 rounded-full blur-2xl pointer-events-none" />

      <motion.div className="w-full max-w-md mx-4 z-10" variants={container} initial="hidden" animate="visible">

        {/* Glass card */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/60 overflow-hidden">
          <div className="h-1.5 w-full bg-gradient-to-r from-orange-400 via-amber-400 to-orange-500" />

          <div className="p-8 sm:p-10">

            {/* Logo */}
            <motion.div variants={item} className="text-center mb-8">
              <motion.div
                className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center shadow-lg shadow-orange-200"
                whileHover={{ rotate: 8, scale: 1.07 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <Coffee className="text-white" size={30} />
              </motion.div>
              <h1 className="text-2xl font-extrabold text-gray-800">Welcome back</h1>
              <p className="text-sm text-gray-500 mt-1">Sign in to NMIMS eCanteen</p>
            </motion.div>

            <form onSubmit={handleSubmit} className="space-y-5">

              {/* Email */}
              <motion.div variants={item}>
                <Label className="text-gray-700 font-semibold text-sm">NMIMS Email</Label>
                <Input
                  type="email"
                  required
                  placeholder="yourname@nmims.edu.in"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={submitting}
                  className="mt-1.5 rounded-xl border-gray-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20 transition-all"
                />
              </motion.div>

              {/* Password */}
              <motion.div variants={item}>
                <div className="flex justify-between items-center mb-1.5">
                  <Label className="text-gray-700 font-semibold text-sm">Password</Label>
                  <Link to="/forgot-password" className="text-xs text-orange-500 hover:text-orange-600 font-medium transition-colors">
                    Forgot Password?
                  </Link>
                </div>
                <div className="relative">
                  <Input
                    type={showPwd ? "text" : "password"}
                    required
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={submitting}
                    className="rounded-xl border-gray-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20 pr-10 transition-all"
                  />
                  <button type="button" onClick={() => setShowPwd(!showPwd)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-orange-500 transition-colors">
                    {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </motion.div>

              {/* Submit */}
              <motion.div variants={item} className="pt-1">
                <motion.button
                  type="submit"
                  disabled={submitting}
                  whileHover={{ scale: submitting ? 1 : 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-xl font-bold text-white bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 shadow-lg shadow-orange-200/60 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200"
                >
                  {submitting
                    ? <><Loader2 className="animate-spin" size={18} /> Signing in…</>
                    : <><span>Sign In</span><ArrowRight size={18} /></>
                  }
                </motion.button>
              </motion.div>

            </form>

            {/* Register */}
            <motion.p variants={item} className="text-center text-sm text-gray-500 mt-6">
              Don't have an account?{" "}
              <Link to="/join" className="text-orange-500 font-bold hover:text-orange-600 transition-colors">
                Register now
              </Link>
            </motion.p>

            {/* Back */}
            <motion.div variants={item} className="mt-3">
              <button onClick={() => navigate("/")}
                className="w-full py-2.5 rounded-xl border border-gray-200 text-sm text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-all font-medium">
                ← Back to Home
              </button>
            </motion.div>

          </div>
        </div>

        <motion.p variants={item} className="text-center text-xs text-gray-400 mt-4">
          NMIMS Chandigarh · eCanteen Platform
        </motion.p>

      </motion.div>
    </div>
  );
};

export default LoginPage;