import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Search, RefreshCw, ArrowUpRight, Filter, Calendar, User, ShoppingBag, DollarSign, Clock, CheckCircle2, AlertCircle } from "lucide-react";

import { useAuth } from "../context/AuthContext";
import { getAdminOrders, updateOrderStatus } from "../api";
import { formatApiError } from "../utils/formatApiError";

import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { theme } from "../theme";

/* ================= HELPERS ================= */

const formatIST = (date) => {
  if (!date) return "—";

  try {
    return new Date(date).toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      dateStyle: "medium",
      timeStyle: "short"
    });
  } catch {
    return "—";
  }
};

const getCompletedTime = (order) => {

  if (!order) return null;

  if (Array.isArray(order.status_history)) {
    const completed = [...order.status_history]
      .reverse()
      .find((s) =>
        String(s.status).toLowerCase() === "completed"
      );

    if (completed?.time) return completed.time;
  }

  if (order.completed_at) return order.completed_at;

  if (order.updated_at) return order.updated_at;

  return order.created_at || null;
};

/* ================= COMPONENT ================= */

const AdminOrderHistory = () => {

  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const role = (user?.role || "").toLowerCase();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState(null);

  const ORDER_STATUSES = [
    { key: "confirmed", label: "Confirmed", color: "bg-blue-100 text-blue-700 border-blue-300" },
    { key: "preparing", label: "Preparing", color: "bg-purple-100 text-purple-700 border-purple-300" },
    { key: "ready_for_pickup", label: "Ready For Pickup", color: "bg-emerald-100 text-emerald-700 border-emerald-300" },
    { key: "picked_up", label: "Picked Up", color: "bg-green-100 text-green-700 border-green-300" },
  ];

  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      setUpdatingStatus(orderId);
      console.log(`Updating order ${orderId} to status: ${newStatus}`);
      
      await updateOrderStatus(orderId, { status: newStatus });
      
      toast.success(`Order status updated to ${newStatus.replace('_', ' ')}`);
      
      // Refresh orders to get updated data
      await fetchOrders();
    } catch (error) {
      console.error("Failed to update status:", error);
      toast.error("Failed to update order status");
    } finally {
      setUpdatingStatus(null);
    }
  };

  /* ================= AUTH GUARD ================= */

  useEffect(() => {

    if (authLoading) return;

    if (!user) {
      navigate("/login", { replace: true });
      return;
    }

    if (!["admin", "staff"].includes(role)) {
      navigate("/menu", { replace: true });
    }

  }, [authLoading, user, role, navigate]);

  /* ================= FETCH ORDERS ================= */

  const fetchOrders = async () => {

    try {

      setLoading(true);
      setFetchError(null);

      const res = await getAdminOrders();

      const fetchedOrders = Array.isArray(res?.data)
        ? res.data
        : [];

      // STRICT FIFO: Sort by createdAt ascending only
      // Oldest order always appears first, regardless of status
      const sorted = fetchedOrders.sort((a, b) => {
        const dateA = new Date(a.created_at || 0).getTime();
        const dateB = new Date(b.created_at || 0).getTime();
        return dateA - dateB; // Ascending (oldest first)
      });

      setOrders(sorted);
      console.log("Fetched orders:", sorted.length);

    } catch (err) {

      console.error(err);
      const msg = formatApiError(err?.response?.data?.detail,
        err?.response ? "Failed to load order history" : "Backend unreachable — check API URL and CORS");
      setFetchError(msg);
      toast.error(msg);

    } finally {

      setLoading(false);

    }

  };

  useEffect(() => {

    if (role === "admin" || role === "staff") {

      fetchOrders();

      const interval = setInterval(
        fetchOrders,
        15000
      );

      return () => clearInterval(interval);

    }

  }, [role]);

  if (authLoading || !user) return null;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
            className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full mx-auto mb-4"
          />
          <p className="text-gray-500 font-medium">Loading order history...</p>
        </div>
      </div>
    );
  }

  /* ================= UI ================= */

  return (
    <div className="min-h-screen bg-gray-50/50 pb-20">
      {/* HEADER */}
      <div className="bg-white border-b sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Order History</h1>
            <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
              <ShoppingBag size={14} className="text-orange-500" /> View and manage all orders
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={fetchOrders}
              className="flex items-center gap-2"
            >
              <RefreshCw size={16} />
              Refresh
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate("/admin/dashboard")}
              className="flex items-center gap-2"
            >
              Dashboard
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* ERROR STATE */}
        {fetchError && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-6 mb-6 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <AlertCircle size={20} />
              <div>
                <p className="font-semibold">Failed to load order history</p>
                <p className="text-sm">{fetchError}</p>
              </div>
            </div>
            <Button variant="outline" onClick={fetchOrders}>Retry</Button>
          </div>
        )}

        {/* STATS CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">Total Orders</p>
                <p className="text-3xl font-black text-gray-900 mt-1">{orders.length}</p>
              </div>
              <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-xl flex items-center justify-center">
                <ShoppingBag size={24} />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">Confirmed</p>
                <p className="text-3xl font-black text-gray-900 mt-1">
                  {orders.filter(o => o.status === 'confirmed').length}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-xl flex items-center justify-center">
                <CheckCircle2 size={24} />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">Preparing</p>
                <p className="text-3xl font-black text-gray-900 mt-1">
                  {orders.filter(o => o.status === 'preparing').length}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-50 text-purple-500 rounded-xl flex items-center justify-center">
                <Clock size={24} />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">Ready for Pickup</p>
                <p className="text-3xl font-black text-gray-900 mt-1">
                  {orders.filter(o => o.status === 'ready_for_pickup').length}
                </p>
              </div>
              <div className="w-12 h-12 bg-emerald-50 text-emerald-500 rounded-xl flex items-center justify-center">
                <CheckCircle2 size={24} />
              </div>
            </div>
          </motion.div>
        </div>

        {/* EMPTY STATE */}
        {orders.length === 0 && (
          <div className="bg-white rounded-2xl p-12 shadow-sm border border-gray-100 text-center">
            <ShoppingBag size={64} className="mx-auto mb-4 text-gray-300" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">No orders found</h3>
            <p className="text-gray-500">Orders will appear here once customers place them</p>
          </div>
        )}

        {/* ORDERS TABLE */}
        {orders.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50">
              <h2 className="text-lg font-bold text-gray-900">All Orders ({orders.length})</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Order</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Customer</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Items</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Time</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {orders.map((order, index) => (
                    <motion.tr
                      key={order._id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-semibold text-gray-900">{order.order_code || `E-${order.order_id}`}</p>
                          <p className="text-xs text-gray-500">ID: {order.order_id || order._id?.toString().slice(-8)}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-gray-600">
                          <User size={16} />
                          <span className="text-sm">{order.user_name || "Walk-in"}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-600">
                          {order.items?.length || 0} items
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-lg font-bold text-gray-900">₹{order.total_amount}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 text-sm font-semibold rounded-full capitalize ${
                          order.status === "confirmed" ? "bg-blue-100 text-blue-700" :
                          order.status === "preparing" ? "bg-purple-100 text-purple-700" :
                          order.status === "ready_for_pickup" ? "bg-emerald-100 text-emerald-700" :
                          order.status === "picked_up" ? "bg-green-100 text-green-700" :
                          "bg-gray-100 text-gray-700"
                        }`}>
                          {order.status?.replace("_", " ")}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-gray-600">
                          <Calendar size={14} />
                          <span className="text-sm">{formatIST(order.created_at)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-2">
                          {ORDER_STATUSES.map((status) => (
                            <button
                              key={status.key}
                              onClick={() => handleStatusUpdate(order.order_id || order._id, status.key)}
                              disabled={updatingStatus === (order.order_id || order._id)}
                              className={`px-3 py-1.5 text-xs font-medium rounded-lg border-2 transition-all ${
                                order.status === status.key
                                  ? status.color + " ring-2 ring-offset-2 ring-orange-500"
                                  : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                              } ${updatingStatus === (order.order_id || order._id) ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                            >
                              {status.label}
                            </button>
                          ))}
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );

};

export default AdminOrderHistory;