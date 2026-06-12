import { useNavigate, Link } from "react-router-dom";
import { Button } from "../components/ui/button";
import {
  Clock,
  CreditCard,
  Smartphone,
  ChefHat,
  Zap,
  Wallet,
  Package,
  ArrowRight,
  Star,
  CheckCircle2,
  Menu,
  ShoppingCart,
  Receipt,
  Users,
  TrendingUp,
  Shield,
  Moon,
  Sun,
} from "lucide-react";
import { motion, useInView } from "framer-motion";
import { useEffect, useState, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

/* ================= ANIMATIONS ================= */

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: "easeOut" },
  },
};

const fadeInLeft = {
  hidden: { opacity: 0, x: -30 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.6, ease: "easeOut" },
  },
};

const fadeInRight = {
  hidden: { opacity: 0, x: 30 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.6, ease: "easeOut" },
  },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.5, ease: "easeOut" },
  },
};

const glowEffect = {
  hidden: { boxShadow: "0 0 0 rgba(255, 138, 61, 0)" },
  visible: {
    boxShadow: "0 0 20px rgba(255, 138, 61, 0.5)",
    transition: { duration: 0.3, ease: "easeOut" },
  },
};

/* ================= PAGE ================= */

const LandingPage = () => {
  const navigate = useNavigate();
  const { user, logout, loading: authLoading } = useAuth();
  const { darkMode, toggleDarkMode } = useTheme();
  const [stats, setStats] = useState({ orders: 0, students: 0, success: 0, availability: 24 });

  const handleOrderClick = () => {
    if (user) {
      navigate("/menu");
    } else {
      navigate("/login");
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/", { replace: true });
  };

  // Animate stats on scroll
  const statsRef = useRef(null);
  const statsInView = useInView(statsRef, { once: true });

  useEffect(() => {
    if (statsInView) {
      const interval = setInterval(() => {
        setStats(prev => ({
          orders: Math.min(prev.orders + 100, 10000),
          students: Math.min(prev.students + 5, 500),
          success: Math.min(prev.success + 1, 99),
          availability: 24,
        }));
      }, 20);
      return () => clearInterval(interval);
    }
  }, [statsInView]);

  if (authLoading) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-white dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      
      {/* ================= NAVBAR ================= */}
      <header className="fixed top-0 left-0 w-full z-50 backdrop-blur-xl bg-white/80 dark:bg-gray-900/80 border-b border-orange-100 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link to="/" className="text-2xl font-bold" style={{ color: '#FF8A3D' }}>
            ☕ E-Canteen
          </Link>
          <div className="flex gap-3">
            {/* Theme Toggle */}
            <button
              onClick={toggleDarkMode}
              className="relative w-11 h-11 flex items-center justify-center rounded-xl border-2 transition-all duration-300 cursor-pointer focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 hover:scale-105"
              style={{
                backgroundColor: darkMode ? '#1f2937' : '#f3f4f6',
                borderColor: darkMode ? '#FF8A3D' : '#d1d5db',
                boxShadow: darkMode ? '0 0 15px rgba(255, 138, 61, 0.3)' : '0 2px 8px rgba(0, 0, 0, 0.1)'
              }}
              title="Switch Theme"
              aria-label="Switch Theme"
            >
              {darkMode ? <Sun className="w-5 h-5 text-white" /> : <Moon className="w-5 h-5 text-gray-700" />}
            </button>

            {!user ? (
              <>
                <Button variant="ghost" onClick={() => navigate("/login")} className="text-orange-600 dark:text-orange-400">
                  Login
                </Button>
                <Button onClick={() => navigate("/join")} style={{ backgroundColor: '#FF8A3D' }} className="hover:opacity-90">
                  Register
                </Button>
              </>
            ) : (
              <Button variant="outline" onClick={handleLogout} className="border-orange-500 text-orange-600 dark:text-orange-400">
                Logout
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* ================= HERO SECTION ================= */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Side */}
            <motion.div
              variants={fadeInLeft}
              initial="hidden"
              animate="visible"
              className="space-y-8"
            >
              <motion.div
                variants={fadeInUp}
                initial="hidden"
                animate="visible"
                transition={{ delay: 0.2 }}
                className="inline-flex items-center gap-2 bg-orange-500/10 dark:bg-orange-500/20 text-orange-700 dark:text-orange-300 px-4 py-2 rounded-full text-sm font-medium border border-orange-200 dark:border-orange-500/30"
                style={{ color: '#FF8A3D', backgroundColor: 'rgba(255, 138, 61, 0.1)', borderColor: 'rgba(255, 138, 61, 0.3)' }}
              >
                <Zap className="w-4 h-4" />
                Smart Campus Food Ordering
              </motion.div>

              <motion.h1
                variants={fadeInUp}
                initial="hidden"
                animate="visible"
                transition={{ delay: 0.3 }}
                className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight text-gray-900 dark:text-white"
              >
                Skip The Queue.
                <br />
                <span style={{ color: '#FF8A3D' }}>Order Ahead.</span>
              </motion.h1>

              <motion.p
                variants={fadeInUp}
                initial="hidden"
                animate="visible"
                transition={{ delay: 0.4 }}
                className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed"
              >
                Pre-order meals, pay with wallet, and collect food instantly from your campus canteen.
              </motion.p>

              <motion.div
                variants={fadeInUp}
                initial="hidden"
                animate="visible"
                transition={{ delay: 0.5 }}
                className="flex flex-col sm:flex-row gap-4"
              >
                <Button
                  size="lg"
                  onClick={handleOrderClick}
                  style={{ backgroundColor: '#FF8A3D' }}
                  className="text-white px-8 py-4 rounded-xl shadow-lg hover:opacity-90 transition-all duration-300"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Order Now
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => navigate("/menu")}
                  style={{ borderColor: '#FF8A3D', color: '#FF8A3D' }}
                  className="hover:bg-orange-50 dark:hover:bg-orange-900/20 px-8 py-4 rounded-xl transition-all duration-300"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Explore Menu
                </Button>
              </motion.div>
            </motion.div>

            {/* Right Side - Hero Illustration */}
            <motion.div
              variants={fadeInRight}
              initial="hidden"
              animate="visible"
              className="relative"
            >
              <div className="relative bg-gradient-to-br from-orange-100 to-amber-100 dark:from-orange-900/30 dark:to-amber-900/30 rounded-3xl p-8 lg:p-12 backdrop-blur-sm">
                {/* Main Mockup */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-2xl">
                  <div className="space-y-4">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                    <div className="h-32 bg-gradient-to-br from-orange-200 to-amber-200 dark:from-orange-900/40 dark:to-amber-900/40 rounded-xl"></div>
                    <div className="flex gap-2">
                      <div className="h-8 bg-orange-500 rounded-lg flex-1"></div>
                      <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded-lg flex-1"></div>
                    </div>
                  </div>
                </div>

                {/* Feature Badges */}
                <div className="absolute -top-2 -right-2 bg-white dark:bg-gray-800 rounded-xl p-3 shadow-lg border border-orange-200 dark:border-orange-500/30">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5" style={{ color: '#FF8A3D' }} />
                    <span className="text-sm font-medium text-gray-900 dark:text-white">Live Menu</span>
                  </div>
                </div>

                <div className="absolute -bottom-2 -left-2 bg-white dark:bg-gray-800 rounded-xl p-3 shadow-lg border border-orange-200 dark:border-orange-500/30">
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5" style={{ color: '#FF8A3D' }} />
                    <span className="text-sm font-medium text-gray-900 dark:text-white">Fast Pickup</span>
                  </div>
                </div>

                <div className="absolute top-1/2 -right-4 bg-white dark:bg-gray-800 rounded-xl p-3 shadow-lg border border-orange-200 dark:border-orange-500/30">
                  <div className="flex items-center gap-2">
                    <Wallet className="w-5 h-5" style={{ color: '#FF8A3D' }} />
                    <span className="text-sm font-medium text-gray-900 dark:text-white">Digital Wallet</span>
                  </div>
                </div>

                <div className="absolute top-1/2 -left-4 bg-white dark:bg-gray-800 rounded-xl p-3 shadow-lg border border-orange-200 dark:border-orange-500/30">
                  <div className="flex items-center gap-2">
                    <Smartphone className="w-5 h-5" style={{ color: '#FF8A3D' }} />
                    <span className="text-sm font-medium text-gray-900 dark:text-white">Order Tracking</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ================= TRUST SECTION ================= */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            <TrustCard
              icon={Zap}
              title="Instant Ordering"
              description="Order in seconds"
            />
            <TrustCard
              icon={CreditCard}
              title="Wallet Payments"
              description="Fast cashless payments"
            />
            <TrustCard
              icon={Smartphone}
              title="Real-Time Tracking"
              description="Track every order"
            />
            <TrustCard
              icon={ChefHat}
              title="Fresh Campus Meals"
              description="Prepared on demand"
            />
          </div>
        </div>
      </section>

      {/* ================= STATS SECTION ================= */}
      <section ref={statsRef} className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-orange-50 to-amber-50 dark:from-gray-900 dark:to-gray-800">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            <StatCard icon={TrendingUp} value={stats.orders.toLocaleString()} label="Orders Processed" />
            <StatCard icon={Users} value={stats.students.toLocaleString()} label="Students" />
            <StatCard icon={CheckCircle2} value={`${stats.success}%`} label="Pickup Success" />
            <StatCard icon={Clock} value="24/7" label="Availability" />
          </div>
        </div>
      </section>

      {/* ================= FEATURES SECTION ================= */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            variants={fadeInUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Why Choose E-Canteen?
            </h2>
            <p className="text-gray-600 dark:text-gray-300 text-lg">
              Modern features for a seamless dining experience
            </p>
          </motion.div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard
              icon={Zap}
              title="Fast Ordering"
              description="Order in seconds with our intuitive interface"
            />
            <FeatureCard
              icon={Wallet}
              title="Wallet Payments"
              description="Quick and cashless payments with digital wallet"
            />
            <FeatureCard
              icon={Package}
              title="Smart Pickup"
              description="Collect without waiting with smart pickup system"
            />
          </div>
        </div>
      </section>

      {/* ================= HOW IT WORKS ================= */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto">
          <motion.div
            variants={fadeInUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              How It Works
            </h2>
            <p className="text-gray-600 dark:text-gray-300 text-lg">
              Three simple steps to get your food
            </p>
          </motion.div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <StepCard
              step="1"
              icon={Menu}
              title="Browse Menu"
              description="Explore our delicious menu items"
            />
            <StepCard
              step="2"
              icon={Wallet}
              title="Pay with Wallet"
              description="Quick and secure digital payments"
            />
            <StepCard
              step="3"
              icon={Package}
              title="Pick Up Food"
              description="Collect your order without waiting"
            />
          </div>
        </div>
      </section>

      {/* ================= TESTIMONIALS ================= */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            variants={fadeInUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              What Students Say
            </h2>
          </motion.div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <TestimonialCard
              name="Rahul Sharma"
              text="Saved me 20 minutes every day. No more waiting in queues!"
              rating={5}
            />
            <TestimonialCard
              name="Priya Patel"
              text="Best canteen upgrade ever. The wallet feature is amazing."
              rating={5}
            />
            <TestimonialCard
              name="Amit Kumar"
              text="Wallet payments are super convenient. Love the app!"
              rating={5}
            />
          </div>
        </div>
      </section>

      {/* ================= FOOTER ================= */}
      <footer className="bg-gray-900 dark:bg-gray-950 text-white py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            <div>
              <h3 className="text-xl font-bold mb-4">☕ E-Canteen</h3>
              <p className="text-gray-400 text-sm">
                Smart campus food ordering system
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><Link to="/menu" className="hover:text-white">Menu</Link></li>
                <li><Link to="/orders" className="hover:text-white">My Orders</Link></li>
                <li><Link to="/wallet" className="hover:text-white">Wallet</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><Link to="/login" className="hover:text-white">Login</Link></li>
                <li><Link to="/join" className="hover:text-white">Register</Link></li>
                <li><Link to="/forgot-password" className="hover:text-white">Forgot Password</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Contact</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li>support@ecanteen.com</li>
                <li>+91 1234567890</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-gray-400 text-sm">
            © 2026 E-Canteen. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

/* ================= COMPONENTS ================= */

const TrustCard = ({ icon: Icon, title, description }) => (
  <motion.div
    variants={fadeInUp}
    initial="hidden"
    whileInView="visible"
    viewport={{ once: true }}
    whileHover={{ y: -4 }}
    className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-all duration-300"
  >
    <div className="w-12 h-12 mb-4 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'rgba(255, 138, 61, 0.1)' }}>
      <Icon className="w-6 h-6" style={{ color: '#FF8A3D' }} />
    </div>
    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{title}</h3>
    <p className="text-sm text-gray-600 dark:text-gray-300">{description}</p>
  </motion.div>
);

const StatCard = ({ icon: Icon, value, label }) => (
  <motion.div
    variants={scaleIn}
    initial="hidden"
    whileInView="visible"
    viewport={{ once: true }}
    className="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-gray-700 dark:to-gray-800 rounded-2xl p-6 text-center border border-orange-100 dark:border-gray-600"
  >
    <div className="w-12 h-12 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(255, 138, 61, 0.2)' }}>
      <Icon className="w-6 h-6" style={{ color: '#FF8A3D' }} />
    </div>
    <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{value}</div>
    <div className="text-sm text-gray-600 dark:text-gray-300">{label}</div>
  </motion.div>
);

const FeatureCard = ({ icon: Icon, title, description }) => (
  <motion.div
    variants={fadeInUp}
    initial="hidden"
    whileInView="visible"
    viewport={{ once: true }}
    whileHover={{ y: -8 }}
    className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-all duration-300"
  >
    <div className="w-14 h-14 mb-6 rounded-2xl flex items-center justify-center" style={{ backgroundColor: '#FF8A3D' }}>
      <Icon className="w-7 h-7 text-white" />
    </div>
    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">{title}</h3>
    <p className="text-gray-600 dark:text-gray-300">{description}</p>
  </motion.div>
);

const StepCard = ({ step, icon: Icon, title, description }) => (
  <motion.div
    variants={fadeInUp}
    initial="hidden"
    whileInView="visible"
    viewport={{ once: true }}
    className="relative"
  >
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg border border-gray-100 dark:border-gray-700">
      <div className="w-16 h-16 mb-6 rounded-2xl flex items-center justify-center text-white text-2xl font-bold" style={{ backgroundColor: '#FF8A3D' }}>
        {step}
      </div>
      <div className="w-12 h-12 mb-4 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'rgba(255, 138, 61, 0.1)' }}>
        <Icon className="w-6 h-6" style={{ color: '#FF8A3D' }} />
      </div>
      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">{title}</h3>
      <p className="text-gray-600 dark:text-gray-300">{description}</p>
    </div>
    {step < 3 && (
      <div className="hidden md:block absolute top-1/2 -right-4 w-8 h-0.5" style={{ backgroundColor: 'rgba(255, 138, 61, 0.3)' }}></div>
    )}
  </motion.div>
);

const TestimonialCard = ({ name, text, rating }) => (
  <motion.div
    variants={fadeInUp}
    initial="hidden"
    whileInView="visible"
    viewport={{ once: true }}
    className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg border border-gray-100 dark:border-gray-700"
  >
    <div className="flex gap-1 mb-4">
      {[...Array(rating)].map((_, i) => (
        <Star key={i} className="w-5 h-5" style={{ fill: '#FF8A3D', color: '#FF8A3D' }} />
      ))}
    </div>
    <p className="text-gray-600 dark:text-gray-300 mb-6 italic">"{text}"</p>
    <div className="font-semibold text-gray-900 dark:text-white">{name}</div>
  </motion.div>
);

export default LandingPage;
