import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Search, RefreshCw, Filter, Calendar, User, ShoppingBag, DollarSign, Clock, CheckCircle2, AlertCircle, X, Store, Globe } from "lucide-react";

import { useAuth } from "../context/AuthContext";
import { getAdminOrders } from "../api";
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

const isWalkInOrder = (order) => {
  return order.order_type === "walk-in" || 
         order.order_code?.startsWith("W-") ||
         !order.user_id;
};

const isOnlineOrder = (order) => {
  return !isWalkInOrder(order);
};

/* ================= COMPONENT ================= */

const AdminOrderHistory = () => {

  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const role = (user?.role || "").toLowerCase();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  
  // Tab state
  const [activeTab, setActiveTab] = useState("online");
  
  // Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState("all");
  const [customDateRange, setCustomDateRange] = useState({ start: "", end: "" });
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);

  const ORDER_STATUSES = [
    { key: "confirmed", label: "Confirmed", color: "bg-blue-100 text-blue-700 border-blue-300", icon: "🟢" },
    { key: "preparing", label: "Preparing", color: "bg-purple-100 text-purple-700 border-purple-300", icon: "🟣" },
    { key: "ready_for_pickup", label: "Ready For Pickup", color: "bg-emerald-100 text-emerald-700 border-emerald-300", icon: "🔵" },
    { key: "picked_up", label: "Picked Up", color: "bg-green-100 text-green-700 border-green-300", icon: "⚫" },
    { key: "cancelled", label: "Cancelled", color: "bg-red-100 text-red-700 border-red-300", icon: "🔴" },
  ];

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

  /* ================= FILTER LOGIC ================= */

  const filterOrders = (ordersToFilter) => {
    let filtered = ordersToFilter;

    // Filter by order type (tab)
    if (activeTab === "online") {
      filtered = filtered.filter(isOnlineOrder);
    } else if (activeTab === "walkin") {
      filtered = filtered.filter(isWalkInOrder);
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(order => {
        const orderId = order.order_id || order.order_code || "";
        const customerName = order.user_name || order.customer_name || "";
        const email = order.user_email || order.email || "";
        const token = order.order_code || "";
        
        return (
          orderId.toLowerCase().includes(query) ||
          customerName.toLowerCase().includes(query) ||
          email.toLowerCase().includes(query) ||
          token.toLowerCase().includes(query)
        );
      });
    }

    // Filter by date
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    if (dateFilter === "today") {
      filtered = filtered.filter(order => {
        const orderDate = new Date(order.created_at);
        return orderDate >= today;
      });
    } else if (dateFilter === "week") {
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);
      filtered = filtered.filter(order => {
        const orderDate = new Date(order.created_at);
        return orderDate >= weekAgo;
      });
    } else if (dateFilter === "month") {
      const monthAgo = new Date(today);
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      filtered = filtered.filter(order => {
        const orderDate = new Date(order.created_at);
        return orderDate >= monthAgo;
      });
    } else if (dateFilter === "custom" && customDateRange.start && customDateRange.end) {
      const startDate = new Date(customDateRange.start);
      const endDate = new Date(customDateRange.end);
      endDate.setHours(23, 59, 59);
      filtered = filtered.filter(order => {
        const orderDate = new Date(order.created_at);
        return orderDate >= startDate && orderDate <= endDate;
      });
    }

    return filtered;
  };

  const filteredOrders = useMemo(() => filterOrders(orders), [orders, activeTab, searchQuery, dateFilter, customDateRange]);

  // Pagination
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const paginatedOrders = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredOrders.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredOrders, currentPage, itemsPerPage]);

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchQuery, dateFilter, customDateRange]);

  // Calculate summary stats
  const onlineOrders = orders.filter(isOnlineOrder);
  const walkInOrders = orders.filter(isWalkInOrder);

  const onlineStats = {
    total: onlineOrders.length,
    revenue: onlineOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0),
    completed: onlineOrders.filter(o => o.status === "picked_up" || o.status === "completed").length
  };

  const walkInStats = {
    total: walkInOrders.length,
    revenue: walkInOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0),
    completed: walkInOrders.filter(o => o.status === "picked_up" || o.status === "completed").length
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
              <ShoppingBag size={14} className="text-orange-500" /> View order history (Read-only)
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

        {/* SUMMARY CARDS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* ONLINE ORDERS SUMMARY */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 shadow-sm border border-blue-100"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-blue-500 text-white rounded-xl flex items-center justify-center">
                <Globe size={20} />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Online Orders</h3>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-600">Total</p>
                <p className="text-2xl font-black text-gray-900">{onlineStats.total}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Revenue</p>
                <p className="text-2xl font-black text-gray-900">₹{onlineStats.revenue.toFixed(0)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Completed</p>
                <p className="text-2xl font-black text-gray-900">{onlineStats.completed}</p>
              </div>
            </div>
          </motion.div>

          {/* WALK-IN ORDERS SUMMARY */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl p-6 shadow-sm border border-orange-100"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-orange-500 text-white rounded-xl flex items-center justify-center">
                <Store size={20} />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Walk-in Orders</h3>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-600">Total</p>
                <p className="text-2xl font-black text-gray-900">{walkInStats.total}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Revenue</p>
                <p className="text-2xl font-black text-gray-900">₹{walkInStats.revenue.toFixed(0)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Completed</p>
                <p className="text-2xl font-black text-gray-900">{walkInStats.completed}</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* TABS */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 mb-6">
          <div className="flex border-b border-gray-100">
            <button
              onClick={() => setActiveTab("online")}
              className={`flex-1 px-6 py-4 font-semibold transition-colors ${
                activeTab === "online"
                  ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50/50"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <Globe size={18} />
                Online Orders ({onlineOrders.length})
              </div>
            </button>
            <button
              onClick={() => setActiveTab("walkin")}
              className={`flex-1 px-6 py-4 font-semibold transition-colors ${
                activeTab === "walkin"
                  ? "text-orange-600 border-b-2 border-orange-600 bg-orange-50/50"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <Store size={18} />
                Walk-in Orders ({walkInOrders.length})
              </div>
            </button>
          </div>
        </div>

        {/* FILTERS */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search by Order ID, Customer Name, Email, Token..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-400 outline-none"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {/* Date Filter */}
            <div className="flex gap-2">
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-400 outline-none"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="custom">Custom Range</option>
              </select>

              {dateFilter === "custom" && (
                <div className="flex gap-2">
                  <input
                    type="date"
                    value={customDateRange.start}
                    onChange={(e) => setCustomDateRange({ ...customDateRange, start: e.target.value })}
                    className="px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-400 outline-none"
                  />
                  <input
                    type="date"
                    value={customDateRange.end}
                    onChange={(e) => setCustomDateRange({ ...customDateRange, end: e.target.value })}
                    className="px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-400 outline-none"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* EMPTY STATE */}
        {filteredOrders.length === 0 && !loading && (
          <div className="bg-white rounded-2xl p-12 shadow-sm border border-gray-100 text-center">
            <ShoppingBag size={64} className="mx-auto mb-4 text-gray-300" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">No orders found</h3>
            <p className="text-gray-500">
              {searchQuery || dateFilter !== "all"
                ? "Try adjusting your filters"
                : `${activeTab === "online" ? "Online" : "Walk-in"} orders will appear here once customers place them`}
            </p>
          </div>
        )}

        {/* ORDERS TABLE */}
        {filteredOrders.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
              <h2 className="text-lg font-bold text-gray-900">
                {activeTab === "online" ? "Online Orders" : "Walk-in Orders"} ({filteredOrders.length})
              </h2>
              <span className="text-sm text-gray-500">
                Page {currentPage} of {totalPages}
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Order Type</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Order ID</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Customer</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Items</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {paginatedOrders.map((order, index) => (
                    <motion.tr
                      key={order._id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                          isWalkInOrder(order)
                            ? "bg-orange-100 text-orange-700"
                            : "bg-blue-100 text-blue-700"
                        }`}>
                          {isWalkInOrder(order) ? "WALK-IN" : "ONLINE"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-semibold text-gray-900">{order.order_code || `E-${order.order_id}`}</p>
                          <p className="text-xs text-gray-500">ID: {order.order_id || order._id?.toString().slice(-8)}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <div className="flex items-center gap-2 text-gray-600">
                            <User size={16} />
                            <span className="text-sm font-medium">{order.user_name || order.customer_name || "Walk-in Customer"}</span>
                          </div>
                          {order.user_email && (
                            <p className="text-xs text-gray-500 mt-1">{order.user_email}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-600">
                          {order.items?.length || 0} items
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-lg font-bold text-gray-900">₹{order.total_amount?.toFixed(0) || order.total?.toFixed(0)}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1.5 text-sm font-semibold rounded-full capitalize flex items-center gap-1.5 ${
                          order.status === "confirmed" ? "bg-blue-100 text-blue-700" :
                          order.status === "preparing" ? "bg-purple-100 text-purple-700" :
                          order.status === "ready_for_pickup" ? "bg-emerald-100 text-emerald-700" :
                          order.status === "picked_up" || order.status === "completed" ? "bg-green-100 text-green-700" :
                          order.status === "cancelled" ? "bg-red-100 text-red-700" :
                          "bg-gray-100 text-gray-700"
                        }`}>
                          {ORDER_STATUSES.find(s => s.key === order.status?.toLowerCase())?.icon || "📋"}
                          {order.status?.replace("_", " ") || "Unknown"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-gray-600">
                          <Calendar size={14} />
                          <span className="text-sm">{formatIST(order.created_at)}</span>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* PAGINATION */}
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-100 flex justify-between items-center">
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="flex items-center gap-2"
                >
                  Previous
                </Button>
                <div className="flex gap-2">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`px-3 py-1 rounded-lg ${
                          currentPage === pageNum
                            ? "bg-blue-600 text-white"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="flex items-center gap-2"
                >
                  Next
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );

};

export default AdminOrderHistory;