import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, Clock, MapPin, CreditCard, ArrowRight, ArrowLeft, List } from "lucide-react";
import { toast } from "sonner";

import { useAuth } from "../context/AuthContext";
import { getUserOrders } from "../api";

const ORDER_STATUSES = [
  { key: "confirmed", label: "Confirmed", icon: CheckCircle, color: "text-blue-500", bg: "bg-blue-100" },
  { key: "preparing", label: "Preparing", icon: Clock, color: "text-purple-500", bg: "bg-purple-100" },
  { key: "ready_for_pickup", label: "Ready For Pickup", icon: CheckCircle, color: "text-emerald-500", bg: "bg-emerald-100" },
  { key: "picked_up", label: "Picked Up", icon: CheckCircle, color: "text-green-500", bg: "bg-green-100" },
];

const OrderConfirmation = () => {
  const navigate = useNavigate();
  const { orderId } = useParams();
  const { user } = useAuth();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderId) {
      navigate("/menu", { replace: true });
      return;
    }

    const fetchOrder = async () => {
      try {
        const res = await getUserOrders();
        const userOrders = res?.data || [];
        const foundOrder = userOrders.find(o => o.order_id === orderId || o.order_code === orderId || o._id === orderId);
        if (foundOrder) {
          setOrder(foundOrder);
        } else {
          toast.error("Order not found");
          navigate("/menu", { replace: true });
        }
      } catch (err) {
        console.error(err);
        toast.error("Failed to load order details");
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId, navigate, user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!order) return null;

  const getCurrentStatusIndex = () => {
    if (!order) return -1;
    return ORDER_STATUSES.findIndex(s => s.key === order.status);
  };

  const currentStatusIndex = getCurrentStatusIndex();

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100">
      <div className="max-w-lg mx-auto px-4 py-12 sm:px-6">
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="bg-white rounded-3xl shadow-2xl overflow-hidden"
          >
            {/* Success Header */}
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-8 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 15 }}
                className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg"
              >
                <CheckCircle size={48} className="text-green-500" />
              </motion.div>
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-3xl font-bold text-white mb-2"
              >
                Order Placed Successfully
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-white/90"
              >
                Your order has been confirmed
              </motion.p>
            </div>

            {/* Order Details */}
            <div className="p-6 space-y-6">
              {/* Order ID */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl"
              >
                <div>
                  <p className="text-sm text-gray-500">Order Code</p>
                  <p className="text-xl font-bold text-gray-900">{order.order_code || order.order_id}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Status</p>
                  <p className="text-xl font-bold text-green-600 capitalize">{order.status?.replace('_', ' ')}</p>
                </div>
              </motion.div>

              {/* Order Items */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 }}
              >
                <h3 className="font-semibold text-gray-900 mb-3">Order Items</h3>
                <div className="space-y-2">
                  {order.items?.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center text-orange-600 font-bold">
                          {item.quantity}
                        </div>
                        <p className="font-medium text-gray-900">{item.name}</p>
                      </div>
                      <p className="font-semibold text-gray-900">₹{item.price * item.quantity}</p>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Pickup Info */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7 }}
                className="space-y-3"
              >
                <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-2xl">
                  <Clock className="text-blue-600" size={20} />
                  <div>
                    <p className="text-sm text-gray-500">Pickup Time</p>
                    <p className="font-semibold text-gray-900">{order.pickup_time || "15-20 minutes"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-purple-50 rounded-2xl">
                  <CreditCard className="text-purple-600" size={20} />
                  <div>
                    <p className="text-sm text-gray-500">Payment Method</p>
                    <p className="font-semibold text-gray-900 capitalize">{order.payment_method}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 bg-green-50 rounded-2xl">
                  <div className="flex items-center gap-3">
                    <CreditCard className="text-green-600" size={20} />
                    <div>
                      <p className="text-sm text-gray-500">Amount</p>
                      <p className="font-semibold text-gray-900">₹{order.total_amount}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Payment Status</p>
                    <p className="font-semibold text-gray-900 capitalize">{order.payment_status}</p>
                  </div>
                </div>
              </motion.div>

              {/* Progress Tracker */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.8 }}
              >
                <h3 className="font-semibold text-gray-900 mb-3">Order Progress</h3>
                <div className="space-y-2">
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
                        className={`flex items-center gap-3 p-3 rounded-xl transition ${
                          isActive ? "bg-green-50 border-2 border-green-500" : isCompleted ? "bg-green-50" : "bg-gray-50"
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          isCompleted ? "bg-green-500 text-white" : isActive ? "bg-green-500 text-white" : "bg-gray-200 text-gray-400"
                        }`}>
                          {isCompleted ? <CheckCircle size={16} /> : <Icon size={16} />}
                        </div>
                        <p className={`font-medium text-sm ${isActive ? "text-green-700" : isCompleted ? "text-green-700" : "text-gray-600"}`}>
                          {status.label}
                        </p>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>

              {/* Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9 }}
                className="space-y-3"
              >
                <button
                  onClick={() => navigate(`/orders/${order.order_id || order._id}`)}
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white py-4 rounded-2xl font-semibold text-lg flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-xl"
                >
                  Track Order
                  <ArrowRight size={20} />
                </button>
                <div className="flex gap-3">
                  <button
                    onClick={() => navigate("/menu")}
                    className="flex-1 border-2 border-gray-300 hover:border-gray-400 text-gray-700 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all"
                  >
                    <ArrowLeft size={18} />
                    Back To Menu
                  </button>
                  <button
                    onClick={() => navigate("/orders")}
                    className="flex-1 border-2 border-gray-300 hover:border-gray-400 text-gray-700 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all"
                  >
                    <List size={18} />
                    View My Orders
                  </button>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default OrderConfirmation;
