import { useNavigate, Link } from "react-router-dom";
import { Button } from "../components/ui/button";
import {
  Clock,
  CreditCard,
  Smartphone,
  ChefHat,
} from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";

/* ================= ANIMATIONS ================= */

const fadeDown = {
  hidden: { opacity: 0, y: -30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: "easeOut" },
  },
};

const revealUp = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: "easeOut" },
  },
};

/* ================= LOADER ================= */

const PageLoader = () => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-white">
    <motion.div
      className="w-12 h-12 rounded-full border-4 border-orange-500 border-t-transparent"
      animate={{ rotate: 360 }}
      transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
    />
  </div>
);

/* ================= PAGE ================= */

const LandingPage = () => {
  const navigate = useNavigate();
  const { user, logout, loading: authLoading } = useAuth();
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setPageLoading(false), 600);
    return () => clearTimeout(t);
  }, []);

  // 🔥 ALWAYS LOGIN REDIRECT
  const handleOrderClick = () => {
    navigate("/login");
  };

  const handleLogout = () => {
    logout();
    navigate("/", { replace: true });
  };

  if (authLoading || pageLoading) return <PageLoader />;

return (
  <div className="relative overflow-x-hidden bg-gradient-to-br from-amber-50 via-orange-50 to-white">

    {/* BACKGROUND BLOBS */}
    <div className="absolute -top-32 -left-32 w-96 h-96 bg-orange-300/30 rounded-full blur-3xl"></div>
    <div className="absolute top-1/2 -right-32 w-96 h-96 bg-amber-300/30 rounded-full blur-3xl"></div>

    {/* ================= NAVBAR ================= */}
    <header className="fixed top-0 left-0 w-full z-40 backdrop-blur-xl bg-white/60 border-b border-white/40 shadow-sm">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">

        <Link
          to="/"
          className="text-2xl font-extrabold bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent"
        >
          ☕ E-Canteen
        </Link>

        <div className="flex gap-3">
          {!user ? (
            <>
              <Button
                variant="ghost"
                className="text-orange-600 hover:bg-orange-100 rounded-xl"
                onClick={() => navigate("/login")}
              >
                Login
              </Button>

              <Button
                className="bg-gradient-to-r from-orange-500 to-amber-500 hover:opacity-90 text-white rounded-xl shadow-lg"
                onClick={() => navigate("/join")}
              >
                Register
              </Button>
            </>
          ) : (
            <Button
              variant="outline"
              className="border-orange-500 text-orange-600 hover:bg-orange-100 rounded-xl"
              onClick={handleLogout}
            >
              Logout
            </Button>
          )}
        </div>
      </div>
    </header>

    {/* ================= HERO ================= */}
    <section className="min-h-screen flex items-center justify-center text-center pt-28 relative">
      <motion.div
        className="max-w-4xl px-6"
        variants={fadeDown}
        initial="hidden"
        animate="visible"
      >
        <h1 className="text-5xl md:text-6xl font-extrabold mb-6 leading-tight">
          Smart Pre-Ordering for{" "}
          <span className="bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent drop-shadow-sm">
            Your Campus Canteen
          </span>
        </h1>

        <p className="text-gray-600 mb-10 text-lg md:text-xl">
          Skip queues, save time, and enjoy fresh meals with our smart
          canteen system for NMIMS Chandigarh.
        </p>

        <Button
          size="lg"
          className="bg-gradient-to-r from-orange-500 to-amber-500 hover:scale-105 transition text-white rounded-xl shadow-xl px-10 py-6 text-lg"
          onClick={handleOrderClick}
        >
          🚀 Order Now
        </Button>
      </motion.div>
    </section>

    {/* ================= IMAGE ================= */}
    <section className="max-w-7xl mx-auto px-6 pb-28">
      <motion.div
        className="rounded-3xl shadow-2xl overflow-hidden border border-white/40 backdrop-blur bg-white/40"
        variants={revealUp}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
      >
        <img
          src="/canteen.jpg"
          alt="canteen"
          className="w-full h-[420px] object-cover hover:scale-110 transition duration-700"
          onError={(e) => (e.currentTarget.style.display = "none")}
        />
      </motion.div>
    </section>

    {/* ================= WHY ================= */}
    <motion.section
      className="max-w-7xl mx-auto px-6 py-20 text-center"
      variants={revealUp}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
    >
      <h2 className="text-4xl font-extrabold mb-3 bg-gradient-to-r from-orange-600 to-amber-500 bg-clip-text text-transparent">
        Why Choose E-Canteen?
      </h2>

      <p className="text-gray-500 mb-12 text-lg">
        Modern features for a seamless dining experience
      </p>

      <div className="grid md:grid-cols-4 gap-8">
        <Feature icon={Clock} title="Save Time" />
        <Feature icon={CreditCard} title="Online Payments" />
        <Feature icon={Smartphone} title="Mobile Friendly" />
        <Feature icon={ChefHat} title="Fresh Food" />
      </div>
    </motion.section>

    {/* ================= FOOTER ================= */}
    <footer className="bg-gradient-to-r from-slate-900 to-slate-800 text-white py-14 text-center">
      <p className="text-sm opacity-80">
        © 2026 E-Canteen • Designed for NMIMS Chandigarh
      </p>
    </footer>
  </div>
);

};

/* ================= SMALL COMPONENTS ================= */
const Feature = ({ icon: Icon, title }) => (
  <motion.div
    whileHover={{ scale: 1.08 }}
    className="bg-white/70 backdrop-blur-lg p-8 rounded-2xl shadow-lg border border-white/40 hover:shadow-2xl transition"
  >
    <div className="w-14 h-14 mx-auto mb-4 flex items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-amber-400 text-white shadow">
      <Icon size={26} />
    </div>

    <h3 className="font-semibold text-gray-700 text-lg">{title}</h3>
  </motion.div>
);


export default LandingPage;
