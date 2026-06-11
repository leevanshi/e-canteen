import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { motion } from "framer-motion";
import {
  Activity, Wallet, Utensils, History, ShoppingBag, ArrowUpRight,
  TrendingUp, CheckCircle2, Store, Globe,
} from "lucide-react";
import { AreaChart, Area, XAxis, Tooltip as RechartsTooltip, ResponsiveContainer } from "recharts";

import { useAuth } from "../context/AuthContext";
import { getAdminDashboard } from "../api";
import { formatApiError } from "../utils/formatApiError";

const staggerContainer = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const cardVariant = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } },
};

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

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const [orders, setOrders] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [stats, setStats] = useState({
    total: 0, active: 0, completed: 0, revenue: 0,
    onlineToday: 0, walkinToday: 0, revenueToday: 0, revenueMonth: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboard = async () => {
    try {
      setError(null);
      const res = await getAdminDashboard();
      const data = res?.data || {};

      setStats({
        total: data.total_orders || 0,
        active: data.active_orders || 0,
        completed: data.completed_orders || 0,
        revenue: data.revenue || 0,
        onlineToday: data.online_orders_today || 0,
        walkinToday: data.walkin_orders_today || 0,
        revenueToday: data.revenue_today || 0,
        revenueMonth: data.revenue_month || 0,
      });
      setOrders(data.recent_orders || []);
      setChartData(data.chart_data || []);
    } catch (err) {
      const msg = formatApiError(err?.response?.data?.detail, "Failed to load dashboard");
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && user?.role === "admin") {
      fetchDashboard();
      const interval = setInterval(fetchDashboard, 30000);
      return () => clearInterval(interval);
    }
  }, [authLoading, user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50 pb-20">
      <div className="bg-white border-b sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Admin Overview</h1>
            <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
              <Activity size={14} className="text-emerald-500" /> Live Restaurant Metrics
            </p>
          </div>
          <button onClick={fetchDashboard}
            className="bg-white border border-gray-200 text-gray-700 px-5 py-2.5 rounded-xl font-semibold shadow-sm hover:bg-gray-50 transition-all">
            Refresh Data
          </button>
        </div>
      </div>

      {error && (
        <div className="max-w-7xl mx-auto px-6 pt-6">
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-sm">
            {error}
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-6 py-8">
        <motion.div variants={staggerContainer} initial="hidden" animate="show" className="space-y-8">

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <motion.div variants={cardVariant} className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
              <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center mb-4">
                <ShoppingBag size={24} />
              </div>
              <p className="text-gray-500 text-sm font-medium">Total Orders</p>
              <h3 className="text-3xl font-black text-gray-900 mt-1">{stats.total}</h3>
            </motion.div>

            <motion.div variants={cardVariant} className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
              <div className="w-12 h-12 bg-orange-50 text-orange-500 rounded-2xl flex items-center justify-center mb-4">
                <Activity size={24} />
              </div>
              <p className="text-gray-500 text-sm font-medium">Active Queue</p>
              <h3 className="text-3xl font-black text-gray-900 mt-1">{stats.active}</h3>
            </motion.div>

            <motion.div variants={cardVariant} className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
              <div className="w-12 h-12 bg-emerald-50 text-emerald-500 rounded-2xl flex items-center justify-center mb-4">
                <CheckCircle2 size={24} />
              </div>
              <p className="text-gray-500 text-sm font-medium">Completed</p>
              <h3 className="text-3xl font-black text-gray-900 mt-1">{stats.completed}</h3>
            </motion.div>

            <motion.div variants={cardVariant} className="bg-gray-900 rounded-3xl p-6 shadow-lg text-white">
              <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mb-4">
                <Wallet size={24} />
              </div>
              <p className="text-gray-400 text-sm font-medium">Total Revenue</p>
              <h3 className="text-3xl font-black mt-1">₹{stats.revenue}</h3>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <motion.div variants={cardVariant} className="bg-white rounded-2xl p-5 border border-gray-100">
              <div className="flex items-center gap-2 text-blue-600 mb-2"><Globe size={18} /><span className="text-sm font-semibold">Online Today</span></div>
              <p className="text-2xl font-black">{stats.onlineToday}</p>
            </motion.div>
            <motion.div variants={cardVariant} className="bg-white rounded-2xl p-5 border border-gray-100">
              <div className="flex items-center gap-2 text-purple-600 mb-2"><Store size={18} /><span className="text-sm font-semibold">Walk-In Today</span></div>
              <p className="text-2xl font-black">{stats.walkinToday}</p>
            </motion.div>
            <motion.div variants={cardVariant} className="bg-white rounded-2xl p-5 border border-gray-100">
              <div className="flex items-center gap-2 text-emerald-600 mb-2"><TrendingUp size={18} /><span className="text-sm font-semibold">Revenue Today</span></div>
              <p className="text-2xl font-black">₹{stats.revenueToday}</p>
            </motion.div>
            <motion.div variants={cardVariant} className="bg-white rounded-2xl p-5 border border-gray-100">
              <div className="flex items-center gap-2 text-orange-600 mb-2"><Wallet size={18} /><span className="text-sm font-semibold">Revenue This Month</span></div>
              <p className="text-2xl font-black">₹{stats.revenueMonth}</p>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <motion.div variants={cardVariant} className="lg:col-span-2 bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
              <h2 className="text-lg font-bold text-gray-900 mb-6">Management Modules</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button onClick={() => navigate("/admin/orders")}
                  className="group relative overflow-hidden bg-gray-50 hover:bg-white border border-gray-100 hover:border-blue-200 rounded-2xl p-5 text-left transition-all hover:shadow-lg">
                  <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-4"><Activity size={20}/></div>
                  <h3 className="font-bold text-gray-900">Live Orders Queue</h3>
                  <p className="text-sm text-gray-500 mt-1">Manage active FIFO food orders.</p>
                  <ArrowUpRight className="absolute top-5 right-5 text-gray-300 group-hover:text-blue-500" size={20}/>
                </button>

                <button onClick={() => navigate("/admin/counter")}
                  className="group relative overflow-hidden bg-gray-50 hover:bg-white border border-gray-100 hover:border-indigo-200 rounded-2xl p-5 text-left transition-all hover:shadow-lg">
                  <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center mb-4"><Store size={20}/></div>
                  <h3 className="font-bold text-gray-900">Walk-In Orders</h3>
                  <p className="text-sm text-gray-500 mt-1">Cash counter orders with printable slips.</p>
                  <ArrowUpRight className="absolute top-5 right-5 text-gray-300 group-hover:text-indigo-500" size={20}/>
                </button>

                <button onClick={() => navigate("/admin/wallet")}
                  className="group relative overflow-hidden bg-gray-50 hover:bg-white border border-gray-100 hover:border-emerald-200 rounded-2xl p-5 text-left transition-all hover:shadow-lg">
                  <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center mb-4"><Wallet size={20}/></div>
                  <h3 className="font-bold text-gray-900">Student Wallets</h3>
                  <p className="text-sm text-gray-500 mt-1">Recharge student accounts.</p>
                  <ArrowUpRight className="absolute top-5 right-5 text-gray-300 group-hover:text-emerald-500" size={20}/>
                </button>

                <button onClick={() => navigate("/admin/history")}
                  className="group relative overflow-hidden bg-gray-50 hover:bg-white border border-gray-100 hover:border-purple-200 rounded-2xl p-5 text-left transition-all hover:shadow-lg">
                  <div className="w-10 h-10 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center mb-4"><History size={20}/></div>
                  <h3 className="font-bold text-gray-900">Completed Orders</h3>
                  <p className="text-sm text-gray-500 mt-1">View historical fulfilled orders.</p>
                  <ArrowUpRight className="absolute top-5 right-5 text-gray-300 group-hover:text-purple-500" size={20}/>
                </button>

                <button onClick={() => navigate("/admin/analytics")}
                  className="group relative overflow-hidden bg-gray-50 hover:bg-white border border-gray-100 hover:border-teal-200 rounded-2xl p-5 text-left transition-all hover:shadow-lg">
                  <div className="w-10 h-10 bg-teal-100 text-teal-600 rounded-xl flex items-center justify-center mb-4"><TrendingUp size={20}/></div>
                  <h3 className="font-bold text-gray-900">Analytics</h3>
                  <p className="text-sm text-gray-500 mt-1">View revenue trends and insights.</p>
                  <ArrowUpRight className="absolute top-5 right-5 text-gray-300 group-hover:text-teal-500" size={20}/>
                </button>

                <button onClick={() => navigate("/admin/inventory")}
                  className="group relative overflow-hidden bg-gray-50 hover:bg-white border border-gray-100 hover:border-amber-200 rounded-2xl p-5 text-left transition-all hover:shadow-lg">
                  <div className="w-10 h-10 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center mb-4"><Package size={20}/></div>
                  <h3 className="font-bold text-gray-900">Inventory</h3>
                  <p className="text-sm text-gray-500 mt-1">Track stock levels and alerts.</p>
                  <ArrowUpRight className="absolute top-5 right-5 text-gray-300 group-hover:text-amber-500" size={20}/>
                </button>

                <button onClick={() => navigate("/admin/menu")}
                  className="group relative overflow-hidden bg-gray-50 hover:bg-white border border-gray-100 hover:border-orange-200 rounded-2xl p-5 text-left transition-all hover:shadow-lg sm:col-span-2">
                  <div className="w-10 h-10 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center mb-4"><Utensils size={20}/></div>
                  <h3 className="font-bold text-gray-900">Menu Catalog</h3>
                  <p className="text-sm text-gray-500 mt-1">Add, update, or toggle menu item availability.</p>
                  <ArrowUpRight className="absolute top-5 right-5 text-gray-300 group-hover:text-orange-500" size={20}/>
                </button>
              </div>
            </motion.div>

            <motion.div variants={cardVariant} className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
              <h2 className="text-lg font-bold text-gray-900 mb-6">Revenue (7 Days)</h2>
              <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#9ca3af" }} />
                    <RechartsTooltip contentStyle={{ borderRadius: "12px", border: "none" }} />
                    <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={3} fill="url(#colorRev)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          </div>

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
                  <div key={o._id} className="p-5 hover:bg-gray-50 flex justify-between items-center">
                    <div>
                      <h3 className="font-bold text-gray-900 text-sm">{o.order_code || `E-${o.order_id}`}</h3>
                      <p className="text-xs text-gray-500 mt-1">{formatIST(o.created_at)} · {o.user_name || "Walk-in"}</p>
                    </div>
                    <div className="text-right">
                      <div className="font-black text-gray-900">₹{o.total_amount}</div>
                      <div className="text-[10px] uppercase font-bold tracking-wider mt-1 text-blue-500">{o.status}</div>
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
