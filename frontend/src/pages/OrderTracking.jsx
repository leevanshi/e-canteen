import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, Clock, ChefHat, Package, Truck, ArrowLeft, RefreshCw, Flame, Box } from "lucide-react";
import { toast } from "sonner";

import { useAuth } from "../context/AuthContext";
import { getUserOrders } from "../api";

const ORDER_STATUSES = [
  { key: "pending", label: "Order Received", icon: Clock, color: "text-orange-500", bg: "bg-orange-100" },
  { key: "confirmed", label: "Confirmed", icon: CheckCircle, color: "text-blue-500", bg: "bg-blue-100" },
  { key: "preparing", label: "Preparing Food", icon: ChefHat, color: "text-purple-500", bg: "bg-purple-100" },
  { key: "cooking", label: "Cooking", icon: Flame, color: "text-pink-500", bg: "bg-pink-100" },
  { key: "packaging", label: "Packaging", icon: Box, color: "text-indigo-500", bg: "bg-indigo-100" },
  { key: "ready", label: "Ready for Pickup", icon: CheckCircle, color: "text-green-500", bg: "bg-green-100" },
  { key: "completed", label: "Completed", icon: CheckCircle, color: "text-gray-500", bg: "bg-gray-100" },
];

const OrderTracking = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [previousStatus, setPreviousStatus] = useState(null);

  const fetchOrder = async () => {
    try {
      const res = await getUserOrders();
      const userOrders = res?.data || [];
      const foundOrder = userOrders.find(o => o.order_id === orderId || o._id === orderId);
      if (foundOrder) {
        // Check if status changed and show notification
        if (previousStatus && foundOrder.status !== previousStatus) {
          const statusMessages = {
            confirmed: "Order Confirmed! 🎉",
            preparing: "Food Being Prepared 👨‍🍳",
            cooking: "Cooking in Progress 🔥",
            packaging: "Packaging Your Order 📦",
            ready: "Food Ready for Pickup! 🍽️",
            completed: "Order Completed ✅",
          };
          const message = statusMessages[foundOrder.status] || `Order status updated to ${foundOrder.status}`;
          toast.success(message);
        }
        setOrder(foundOrder);
        setPreviousStatus(foundOrder.status);
        setLastUpdated(new Date());
      } else {
        toast.error("Order not found");
        navigate("/orders", { replace: true });
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load order details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
    const interval = setInterval(fetchOrder, 10000); // Auto-refresh every 10 seconds
    return () => clearInterval(interval);
  }, [orderId]);

  const getCurrentStatusIndex = () => {
    if (!order) return -1;
    return ORDER_STATUSES.findIndex(s => s.key === order.status);
  };

  const getStatusIcon = (status, isActive, isCompleted) => {
    const Icon = ORDER_STATUSES.find(s => s.key === status)?.icon || Clock;
    return (
      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
        isCompleted ? "bg-green-500 text-white" : isActive ? status.bg + " " + status.color : "bg-gray-200 text-gray-400"
      }`}>
        <Icon size={24} />
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!order) return null;

  const currentStatusIndex = getCurrentStatusIndex();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-30 shadow-sm">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
            <ArrowLeft size={20} />
            Back
          </button>
          <h1 className="text-xl font-bold text-gray-900">Order Tracking</h1>
          <button onClick={fetchOrder} className="p-2 hover:bg-gray-100 rounded-full">
            <RefreshCw size={20} className="text-gray-600" />
          </button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Order Info Card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-gray-500">Order ID</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">{order.order_code || order.order_id}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Total Amount</p>
              <p className="text-xl sm:text-2xl font-bold text-green-600">₹{order.total_amount}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Clock size={16} />
            Last updated: {lastUpdated?.toLocaleTimeString()}
          </div>
        </motion.div>

        {/* Timeline */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900 mb-6">Order Status</h2>
          <div className="space-y-3 sm:space-y-4">
            {ORDER_STATUSES.map((status, idx) => {
              const isActive = idx === currentStatusIndex;
              const isCompleted = idx < currentStatusIndex;
              const Icon = status.icon;

              return (
                <motion.div
                  key={status.key}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className={`flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl transition ${
                    isActive ? "bg-indigo-50 border-2 border-indigo-500" : isCompleted ? "bg-green-50" : "bg-gray-50"
                  }`}
                >
                  <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center ${
                    isCompleted ? "bg-green-500 text-white" : isActive ? "bg-indigo-500 text-white" : "bg-gray-200 text-gray-400"
                  }`}>
                    <Icon size={20} className="sm:size-24" />
                  </div>
                  <div className="flex-1">
                    <p className={`font-semibold text-sm sm:text-base ${isActive ? "text-indigo-700" : isCompleted ? "text-green-700" : "text-gray-600"}`}>
                      {status.label}
                    </p>
                    {isActive && (
                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-xs sm:text-sm text-indigo-600"
                      >
                        In Progress...
                      </motion.p>
                    )}
                  </div>
                  {isCompleted && (
                    <CheckCircle size={20} className="sm:size-24 text-green-500" />
                  )}
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Progress Bar */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">Progress</h2>
            <span className="text-sm font-semibold text-indigo-600">
              {Math.round((currentStatusIndex + 1) / ORDER_STATUSES.length * 100)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(currentStatusIndex + 1) / ORDER_STATUSES.length * 100}%` }}
              transition={{ duration: 0.5 }}
              className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
            />
          </div>
        </motion.div>

        {/* Order Items */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Order Items</h2>
          <div className="space-y-3">
            {order.items?.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center text-orange-600 font-bold">
                    {item.quantity}
                  </div>
                  <p className="font-medium text-gray-900 text-sm sm:text-base">{item.name}</p>
                </div>
                <p className="font-semibold text-gray-900 text-sm sm:text-base">₹{item.price * item.quantity}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Estimated Time */}
        {order.status !== "completed" && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl p-4 sm:p-6 text-white">
            <div className="flex items-center gap-3">
              <Clock size={20} className="sm:size-24" />
              <div>
                <p className="font-semibold text-sm sm:text-base">Estimated Preparation Time</p>
                <p className="text-xs sm:text-sm opacity-90">15-20 minutes</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Cooking Animation */}
        {order.status === "cooking" && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl p-6 sm:p-8 text-white text-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
              className="w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-4"
            >
              <Flame size={80} className="sm:size-96" />
            </motion.div>
            <h3 className="text-xl sm:text-2xl font-bold mb-2">Cooking in Progress</h3>
            <p className="opacity-90 text-sm sm:text-base">Your food is being prepared with care</p>
            <motion.div
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="mt-4 text-sm"
            >
              🔥 Hot & Fresh 🔥
            </motion.div>
          </motion.div>
        )}

        {/* Packaging Animation */}
        {order.status === "packaging" && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl p-6 sm:p-8 text-white text-center">
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-4"
            >
              <Box size={80} className="sm:size-96" />
            </motion.div>
            <h3 className="text-xl sm:text-2xl font-bold mb-2">Packaging Your Order</h3>
            <p className="opacity-90 text-sm sm:text-base">Almost ready for pickup</p>
          </motion.div>
        )}

        {/* Ready Animation */}
        {order.status === "ready" && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl p-6 sm:p-8 text-white text-center">
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 1 }}
              className="w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-4"
            >
              <CheckCircle size={80} className="sm:size-96" />
            </motion.div>
            <h3 className="text-xl sm:text-2xl font-bold mb-2">Ready for Pickup!</h3>
            <p className="opacity-90 text-sm sm:text-base">Please collect your order from the counter</p>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default OrderTracking;
