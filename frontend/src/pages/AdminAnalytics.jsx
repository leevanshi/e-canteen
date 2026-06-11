import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { TrendingUp, ShoppingBag, DollarSign, Clock, Users, ArrowLeft } from "lucide-react";

import { useAuth } from "../context/AuthContext";
import { getAnalytics } from "../api";
import { formatApiError } from "../utils/formatApiError";
import { Button } from "../components/ui/button";

const AdminAnalytics = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const role = (user?.role || "").toLowerCase();

  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) navigate("/login", { replace: true });
    else if (role !== "admin") navigate("/menu", { replace: true });
  }, [authLoading, user, role, navigate]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getAnalytics();
      setAnalytics(res?.data || {});
    } catch (err) {
      console.error(err);
      const msg = formatApiError(err?.response?.data?.detail, "Failed to load analytics");
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && role === "admin") {
      fetchAnalytics();
    }
  }, [authLoading, role]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50 pb-20">
      <div className="bg-white border-b sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-6 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => navigate(-1)}>
              <ArrowLeft size={18} className="mr-2" /> Back
            </Button>
            <div>
              <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Analytics Dashboard</h1>
              <p className="text-sm text-gray-500 mt-1">Comprehensive business insights</p>
            </div>
          </div>
          <Button onClick={fetchAnalytics} variant="outline">
            Refresh Data
          </Button>
        </div>
      </div>

      {error && (
        <div className="max-w-7xl mx-auto px-6 pt-6">
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-sm">
            {error}
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Top Selling Products */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
            <TrendingUp size={20} className="text-indigo-600" />
            Top Selling Products
          </h2>
          {analytics?.top_products?.length > 0 ? (
            <div className="space-y-3">
              {analytics.top_products.map((product, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-bold">
                      {idx + 1}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{product.name}</p>
                      <p className="text-sm text-gray-500">{product.total_sold} sold</p>
                    </div>
                  </div>
                  <p className="font-bold text-gray-900">₹{product.revenue}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No product data available</p>
          )}
        </motion.div>

        {/* Revenue Trend */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
            <DollarSign size={20} className="text-emerald-600" />
            Revenue Trend (30 Days)
          </h2>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%" minHeight={250}>
              <LineChart data={analytics?.revenue_trend || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} name="Revenue (₹)" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Orders Trend */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
            <ShoppingBag size={20} className="text-blue-600" />
            Orders Trend (30 Days)
          </h2>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%" minHeight={250}>
              <LineChart data={analytics?.orders_trend || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="orders" stroke="#3b82f6" strokeWidth={2} name="Orders" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Peak Order Hours */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Clock size={20} className="text-orange-600" />
            Peak Order Hours (Last 7 Days)
          </h2>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%" minHeight={250}>
              <BarChart data={analytics?.peak_hours || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="orders" fill="#f97316" name="Orders" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Daily Revenue */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
            <TrendingUp size={20} className="text-purple-600" />
            Daily Revenue (7 Days)
          </h2>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%" minHeight={250}>
              <BarChart data={analytics?.daily_revenue || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="revenue" fill="#8b5cf6" name="Revenue (₹)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Monthly Revenue */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
            <DollarSign size={20} className="text-teal-600" />
            Monthly Revenue (6 Months)
          </h2>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%" minHeight={250}>
              <BarChart data={analytics?.monthly_revenue || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="revenue" fill="#14b8a6" name="Revenue (₹)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Walk-in vs Online Comparison */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Users size={20} className="text-pink-600" />
            Walk-In vs Online Comparison (This Month)
          </h2>
          {analytics?.comparison && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 bg-indigo-50 rounded-2xl">
                <h3 className="font-semibold text-indigo-900 mb-4">Online Orders</h3>
                <p className="text-3xl font-bold text-indigo-600">{analytics.comparison.online?.count || 0}</p>
                <p className="text-sm text-indigo-700 mt-2">Revenue: ₹{analytics.comparison.online?.revenue || 0}</p>
              </div>
              <div className="p-6 bg-pink-50 rounded-2xl">
                <h3 className="font-semibold text-pink-900 mb-4">Walk-In Orders</h3>
                <p className="text-3xl font-bold text-pink-600">{analytics.comparison["walk-in"]?.count || 0}</p>
                <p className="text-sm text-pink-700 mt-2">Revenue: ₹{analytics.comparison["walk-in"]?.revenue || 0}</p>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default AdminAnalytics;
