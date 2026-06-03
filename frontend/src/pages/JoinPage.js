import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { GraduationCap, BookOpen, ArrowRight, Coffee } from "lucide-react";

/* ================= CONFIG ================= */
const roles = [
  {
    name: "Student",
    path: "/register/student",
    icon: GraduationCap,
    description: "Pre-order meals, manage wallet & track orders",
    accent: "from-orange-400 to-amber-500",
    bg: "from-orange-50 to-amber-50",
    border: "border-orange-200",
    hover: "hover:border-orange-400",
  },
  {
    name: "Faculty",
    path: "/register/faculty",
    icon: BookOpen,
    description: "Enjoy priority ordering with faculty benefits",
    accent: "from-amber-500 to-orange-400",
    bg: "from-amber-50 to-orange-50",
    border: "border-amber-200",
    hover: "hover:border-amber-400",
  },
];

/* ================= ANIMATION VARIANTS ================= */
const container = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.12, delayChildren: 0.2 },
  },
};
const item = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};
const card = {
  hidden: { opacity: 0, y: 40, scale: 0.95 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.5, ease: "easeOut" } },
};

/* ================= COMPONENT ================= */
const JoinPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden bg-gradient-to-br from-amber-50 via-orange-50 to-white px-4">

      {/* Blobs */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-orange-300/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-amber-300/20 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        className="w-full max-w-2xl z-10"
        variants={container}
        initial="hidden"
        animate="visible"
      >
        {/* Logo */}
        <motion.div variants={item} className="text-center mb-10">
          <motion.div
            className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center shadow-lg shadow-orange-200"
            whileHover={{ rotate: 8, scale: 1.07 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <Coffee className="text-white" size={30} />
          </motion.div>
          <h1 className="text-3xl font-extrabold text-gray-800">Join eCanteen</h1>
          <p className="text-gray-500 mt-2 text-base">Choose your role to get started</p>
        </motion.div>

        {/* Role Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-8">
          {roles.map((role, i) => {
            const Icon = role.icon;
            return (
              <motion.div
                key={role.name}
                variants={card}
                whileHover={{ y: -6, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                onClick={() => navigate(role.path)}
                className={`cursor-pointer rounded-2xl border-2 ${role.border} ${role.hover} bg-gradient-to-br ${role.bg} p-7 shadow-md hover:shadow-xl transition-all duration-200 group`}
              >
                {/* Icon */}
                <div className={`w-14 h-14 mb-5 rounded-xl bg-gradient-to-br ${role.accent} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-200`}>
                  <Icon className="text-white" size={26} />
                </div>

                {/* Text */}
                <h2 className="text-xl font-extrabold text-gray-800 mb-1.5">{role.name}</h2>
                <p className="text-sm text-gray-500 leading-relaxed">{role.description}</p>

                {/* CTA */}
                <div className="flex items-center gap-1.5 mt-5 text-orange-500 font-semibold text-sm group-hover:gap-3 transition-all duration-200">
                  <span>Register as {role.name}</span>
                  <ArrowRight size={16} />
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Login link */}
        <motion.p variants={item} className="text-center text-sm text-gray-500">
          Already have an account?{" "}
          <Link to="/login" className="text-orange-500 font-bold hover:text-orange-600 transition-colors">
            Sign in
          </Link>
        </motion.p>

        {/* Back */}
        <motion.div variants={item} className="mt-3">
          <Link
            to="/"
            className="flex items-center justify-center w-full py-2.5 rounded-xl border border-gray-200 text-sm text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-all font-medium"
          >
            ← Back to Home
          </Link>
        </motion.div>

        <motion.p variants={item} className="text-center text-xs text-gray-400 mt-4">
          eCanteen · Student Food Ordering Platform
        </motion.p>
      </motion.div>
    </div>
  );
};

export default JoinPage;