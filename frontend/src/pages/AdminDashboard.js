import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Activity, Wallet, Utensils, History, ShoppingBag, ArrowUpRight, TrendingUp, Users, CheckCircle2 } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer } from "recharts";

import { useAuth } from "../context/AuthContext";
import { getAdminDashboard } from "../api";

/* ================= ANIMATIONS ================= */
const staggerContainer = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const cardVariant = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

/* ================= HELPERS ================= */
const formatIST = (date) => {
  if (!date) return "—";
  try {
    return new Date(date).toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return "—";
  }
};

/* ================= COMPONENT ================= */
const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState({ total: 0, active: 0, completed: 0, revenue: 0 });
  const [loading, setLoading] = useState(true);

  // Mock Chart Data for Premium UI
  const chartData = [
    { name: "Mon", revenue: 4000 },
    { name: "Tue", revenue: 3000 },
    { name: "Wed", revenue: 5000 },
    { name: "Thu", revenue: 2780 },
    { name: "Fri", revenue: 8900 },
    { name: "Sat", revenue: 6390 },
    { name: "Sun", revenue: 10490 },
  ];

  /* ================= FETCH DASHBOARD ================= */
  const fetchDashboard = async () => {
    try {
      const res = await getAdminDashboard();
      const data = res?.data || {};

      setStats({
        total: data.total_orders || 0,
        active: data.active_orders || 0,
        completed: data.completed_orders || 0,
        revenue: data.revenue || 0
      });
      setOrders(data.recent_orders || []);
    } catch (err) {
      toast.info("Database offline — Showing preview data");
      // Fallback Dummy Data for UI Preview
      setStats({ total: 124, active: 12, completed: 112, revenue: 15430 });
      setOrders([
        { _id: "1", order_id: "ORD-9281A", total_amount: 320, status: "pending", created_at: new Date(Date.now() - 600000).toISOString() },
        { _id: "2", order_id: "ORD-4412B", total_amount: 140, status: "preparing", created_at: new Date(Date.now() - 1200000).toISOString() },
        { _id: "3", order_id: "ORD-7731C", total_amount: 110, status: "completed", created_at: new Date(Date.now() - 3600000).toISOString() }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  /* ================= UI ================= */
  return (
    <div className="min-h-screen bg-gray-50/50 pb-20">
      
      {/* HEADER */}
      <div className="bg-white border-b sticky top-0 z-30 shadow-sm backdrop-blur-xl bg-white/80">
        <div className="max-w-7xl mx-auto px-6 py-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Admin Overview</h1>
            <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
              <Activity size={14} className="text-emerald-500" /> Live Restaurant Metrics
            </p>
          </div>
          <button onClick={fetchDashboard} className="bg-white border border-gray-200 text-gray-700 px-5 py-2.5 rounded-xl font-semibold shadow-sm hover:bg-gray-50 transition-all flex items-center gap-2">
            Refresh Data
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <motion.div variants={staggerContainer} initial="hidden" animate="show" className="space-y-8">
          
          {/* STATS ROW */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <motion.div variants={cardVariant} className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col justify-between">
              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center"><ShoppingBag size={24} /></div>
                <span className="text-xs font-bold text-emerald-500 bg-emerald-50 px-2.5 py-1 rounded-full flex items-center gap-1"><TrendingUp size={12}/> +12%</span>
              </div>
              <div>
                <p className="text-gray-500 text-sm font-medium">Total Orders</p>
                <h3 className="text-3xl font-black text-gray-900 mt-1">{stats.total}</h3>
              </div>
            </motion.div>

            <motion.div variants={cardVariant} className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col justify-between">
              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 bg-orange-50 text-orange-500 rounded-2xl flex items-center justify-center"><Activity size={24} /></div>
                <span className="text-xs font-bold text-orange-500 bg-orange-50 px-2.5 py-1 rounded-full flex items-center gap-1 animate-pulse">Live</span>
              </div>
              <div>
                <p className="text-gray-500 text-sm font-medium">Active Queue</p>
                <h3 className="text-3xl font-black text-gray-900 mt-1">{stats.active}</h3>
              </div>
            </motion.div>

            <motion.div variants={cardVariant} className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col justify-between">
              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 bg-emerald-50 text-emerald-500 rounded-2xl flex items-center justify-center"><CheckCircle2 size={24} /></div>
              </div>
              <div>
                <p className="text-gray-500 text-sm font-medium">Completed</p>
                <h3 className="text-3xl font-black text-gray-900 mt-1">{stats.completed}</h3>
              </div>
            </motion.div>

            <motion.div variants={cardVariant} className="relative bg-gray-900 rounded-3xl p-6 shadow-lg shadow-gray-900/20 overflow-hidden flex flex-col justify-between text-white">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
              <div className="flex justify-between items-start mb-4 relative z-10">
                <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center"><Wallet size={24} /></div>
                <span className="text-xs font-bold text-emerald-400 bg-emerald-400/10 px-2.5 py-1 rounded-full flex items-center gap-1"><TrendingUp size={12}/> High</span>
              </div>
              <div className="relative z-10">
                <p className="text-gray-400 text-sm font-medium">Total Revenue</p>
                <h3 className="text-3xl font-black mt-1">₹{stats.revenue}</h3>
              </div>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* QUICK ACTIONS GRID */}
            <motion.div variants={cardVariant} className="lg:col-span-2 bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
              <h2 className="text-lg font-bold text-gray-900 mb-6">Management Modules</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                <button onClick={() => navigate("/admin/orders")} className="group relative overflow-hidden bg-gray-50 hover:bg-white border border-gray-100 hover:border-blue-200 rounded-2xl p-5 text-left transition-all hover:shadow-lg hover:shadow-blue-500/10">
                  <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform"><Activity size={20}/></div>
                  <h3 className="font-bold text-gray-900">Live Orders Queue</h3>
                  <p className="text-sm text-gray-500 mt-1">Manage active FIFO food orders and update status instantly.</p>
                  <ArrowUpRight className="absolute top-5 right-5 text-gray-300 group-hover:text-blue-500 transition-colors" size={20}/>
                </button>

                <button onClick={() => navigate("/admin/wallet")} className="group relative overflow-hidden bg-gray-50 hover:bg-white border border-gray-100 hover:border-emerald-200 rounded-2xl p-5 text-left transition-all hover:shadow-lg hover:shadow-emerald-500/10">
                  <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform"><Wallet size={20}/></div>
                  <h3 className="font-bold text-gray-900">Student Wallets</h3>
                  <p className="text-sm text-gray-500 mt-1">Recharge student accounts and view transaction histories.</p>
                  <ArrowUpRight className="absolute top-5 right-5 text-gray-300 group-hover:text-emerald-500 transition-colors" size={20}/>
                </button>

                <button onClick={() => navigate("/admin/history")} className="group relative overflow-hidden bg-gray-50 hover:bg-white border border-gray-100 hover:border-purple-200 rounded-2xl p-5 text-left transition-all hover:shadow-lg hover:shadow-purple-500/10">
                  <div className="w-10 h-10 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform"><History size={20}/></div>
                  <h3 className="font-bold text-gray-900">Completed Orders</h3>
                  <p className="text-sm text-gray-500 mt-1">View the complete log of all fulfilled historical orders.</p>
                  <ArrowUpRight className="absolute top-5 right-5 text-gray-300 group-hover:text-purple-500 transition-colors" size={20}/>
                </button>

                <button onClick={() => navigate("/admin/menu")} className="group relative overflow-hidden bg-gray-50 hover:bg-white border border-gray-100 hover:border-orange-200 rounded-2xl p-5 text-left transition-all hover:shadow-lg hover:shadow-orange-500/10">
                  <div className="w-10 h-10 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform"><Utensils size={20}/></div>
                  <h3 className="font-bold text-gray-900">Menu Catalog</h3>
                  <p className="text-sm text-gray-500 mt-1">Add, update, or remove items from the smart food menu.</p>
                  <ArrowUpRight className="absolute top-5 right-5 text-gray-300 group-hover:text-orange-500 transition-colors" size={20}/>
                </button>

              </div>
            </motion.div>

            {/* CHART ZONE */}
            <motion.div variants={cardVariant} className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col">
              <h2 className="text-lg font-bold text-gray-900 mb-6">Revenue Trends</h2>
              <div className="flex-1 min-h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#9ca3af'}} />
                    <YAxis hide />
                    <RechartsTooltip contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.05)'}} />
                    <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

          </div>

          {/* RECENT ORDERS TABLE LIST */}
          <motion.div variants={cardVariant} className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h2 className="text-lg font-bold text-gray-900">Recent Activity</h2>
              <button onClick={() => navigate("/admin/history")} className="text-sm font-bold text-blue-600 hover:text-blue-700">View All</button>
            </div>
            <div className="divide-y divide-gray-100">
              {orders.length === 0 ? (
                <div className="p-10 text-center text-gray-500">No recent orders found.</div>
              ) : (
                orders.map((o) => (
                  <div key={o._id} className="p-5 hover:bg-gray-50 transition-colors flex justify-between items-center">
                    <div>
                      <h3 className="font-bold text-gray-900 text-sm">Order #{o.order_id}</h3>
                      <p className="text-xs text-gray-500 mt-1">{formatIST(o.created_at)}</p>
                    </div>
                    <div className="text-right">
                      <div className="font-black text-gray-900">₹{o.total_amount}</div>
                      <div className={`text-[10px] uppercase font-bold tracking-wider mt-1 ${
                        o.status === "completed" ? "text-emerald-500" :
                        o.status === "preparing" ? "text-orange-500" : "text-blue-500"
                      }`}>{o.status}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>

        </motion.div>
      </div>
    </div>
  );
};

export default AdminDashboard;