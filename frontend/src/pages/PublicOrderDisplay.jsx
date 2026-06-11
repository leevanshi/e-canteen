import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react";

import { getAdminOrders } from "../api";

const PublicOrderDisplay = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    try {
      const res = await getAdminOrders();
      const activeOrders = (res?.data || [])
        .filter(o => o.status !== "completed" && o.status !== "cancelled")
        .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
      setOrders(activeOrders);
    } catch (err) {
      console.error("Failed to fetch orders:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 10000); // Auto-refresh every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case "pending": return "bg-orange-500";
      case "preparing": return "bg-blue-500";
      case "ready": return "bg-green-500";
      case "completed": return "bg-gray-500";
      case "cancelled": return "bg-red-500";
      default: return "bg-gray-500";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "pending": return <AlertCircle size={24} />;
      case "preparing": return <Clock size={24} />;
      case "ready": return <CheckCircle size={24} />;
      case "completed": return <CheckCircle size={24} />;
      case "cancelled": return <XCircle size={24} />;
      default: return <Clock size={24} />;
    }
  };

  const groupByStatus = (orders) => {
    return {
      preparing: orders.filter(o => o.status === "preparing" || o.status === "pending"),
      ready: orders.filter(o => o.status === "ready"),
    };
  };

  const grouped = groupByStatus(orders);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800">
      {/* Header */}
      <div className="bg-black/30 backdrop-blur-sm border-b border-white/10 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-extrabold text-white tracking-tight">NMIMS E-CANTEEN</h1>
              <p className="text-white/70 mt-1">Live Order Status Display</p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-white" id="live-clock">
                {new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
              </div>
              <div className="text-white/70 text-sm">{new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-8 py-12 space-y-12">
        {/* Preparing Section */}
        {grouped.preparing.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 border border-white/20">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white">
                  <Clock size={28} />
                </div>
                <h2 className="text-3xl font-bold text-white">PREPARING</h2>
                <span className="bg-blue-500 text-white px-4 py-1 rounded-full text-lg font-bold">{grouped.preparing.length}</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                <AnimatePresence>
                  {grouped.preparing.map((order) => (
                    <motion.div
                      key={order._id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="bg-white rounded-2xl p-6 shadow-xl"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-3xl font-bold text-gray-900">{order.order_code || order.order_id}</span>
                        <div className={`w-10 h-10 ${getStatusColor(order.status)} rounded-full flex items-center justify-center text-white`}>
                          {getStatusIcon(order.status)}
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 capitalize">{order.order_type || "Online"}</p>
                      <p className="text-xs text-gray-500 mt-1">{new Date(order.created_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</p>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        )}

        {/* Ready Section */}
        {grouped.ready.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 border border-white/20">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-white">
                  <CheckCircle size={28} />
                </div>
                <h2 className="text-3xl font-bold text-white">READY FOR PICKUP</h2>
                <span className="bg-green-500 text-white px-4 py-1 rounded-full text-lg font-bold">{grouped.ready.length}</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                <AnimatePresence>
                  {grouped.ready.map((order) => (
                    <motion.div
                      key={order._id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="bg-white rounded-2xl p-6 shadow-xl border-4 border-green-500"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-3xl font-bold text-gray-900">{order.order_code || order.order_id}</span>
                        <div className={`w-10 h-10 ${getStatusColor(order.status)} rounded-full flex items-center justify-center text-white`}>
                          {getStatusIcon(order.status)}
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 capitalize">{order.order_type || "Online"}</p>
                      <p className="text-xs text-gray-500 mt-1">{new Date(order.created_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</p>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        )}

        {/* No Active Orders */}
        {orders.length === 0 && !loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
            <div className="w-24 h-24 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle size={48} className="text-white/50" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-2">No Active Orders</h2>
            <p className="text-white/70">All orders have been completed</p>
          </motion.div>
        )}

        {/* Full Screen Button */}
        <div className="fixed bottom-6 right-6">
          <button
            onClick={() => document.documentElement.requestFullscreen()}
            className="bg-white/20 backdrop-blur-md hover:bg-white/30 text-white px-6 py-3 rounded-full font-semibold transition border border-white/30"
          >
            Full Screen
          </button>
        </div>
      </div>
    </div>
  );
};

export default PublicOrderDisplay;
