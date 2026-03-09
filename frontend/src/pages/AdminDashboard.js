import { useEffect, useRef, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { useAuth } from "../context/AuthContext";
import { getAdminOrders } from "../api";

import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";

/* ================= HELPERS ================= */

const formatIST = (date) => {
  if (!date) return "—";

  try {
    return new Date(date).toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      dateStyle: "medium",
      timeStyle: "short",
      hour12: true
    });
  } catch {
    return "—";
  }
};

const statusColor = (status = "") => {
  const s = String(status).toLowerCase();

  switch (s) {
    case "pending":
    case "placed":
      return "text-red-600 font-semibold";

    case "paid":
    case "preparing":
      return "text-orange-600 font-semibold";

    case "completed":
      return "text-green-600 font-semibold";

    default:
      return "text-gray-500";
  }
};

const ACTIVE_STATUSES = ["placed", "pending", "paid", "preparing"];

/* ================= COMPONENT ================= */

const AdminDashboard = () => {

  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const errorToastShown = useRef(false);

  const role = (user?.role || "").toLowerCase();

  /* ================= AUTH GUARD ================= */

  useEffect(() => {

    if (authLoading) return;

    if (!user) {
      navigate("/login", { replace: true });
      return;
    }

    if (role !== "admin") {
      navigate("/menu", { replace: true });
    }

  }, [user, authLoading, role, navigate]);

  /* ================= FETCH ORDERS ================= */

  const fetchOrders = async (manual = false) => {

    if (!user || role !== "admin") return;

    if (manual) {
      setRefreshing(true);
      errorToastShown.current = false;
    }

    try {

      const res = await getAdminOrders();

      console.log("Admin orders API:", res);

      const data =
        Array.isArray(res?.data) ? res.data :
        Array.isArray(res?.data?.orders) ? res.data.orders :
        [];

      const fixed = data.map((o, idx) => ({
        ...o,
        _id: o._id || `${idx}-${Date.now()}`,
        order_number: o.order_number || o.order_id || 100 + idx,
        total_amount: Number(o.total_amount || 0)
      }));

      setOrders(fixed);

    } catch (err) {

      console.error("Admin orders fetch error:", err);

      if (!errorToastShown.current) {
        toast.error("Failed to load admin orders");
        errorToastShown.current = true;
      }

      setOrders([]);

    } finally {

      setLoading(false);
      if (manual) setRefreshing(false);

    }

  };

  /* ================= AUTO REFRESH ================= */

  useEffect(() => {

    if (!user || authLoading || role !== "admin") return;

    fetchOrders();

    const interval = setInterval(fetchOrders, 10000);

    return () => clearInterval(interval);

  }, [user, authLoading, role]);

  /* ================= LOADING ================= */

  if (authLoading || loading) {
    return (
      <div className="p-10 text-center text-gray-500 animate-pulse">
        Loading dashboard...
      </div>
    );
  }

  if (!user) return null;

  /* ================= DERIVED ================= */

  const sortedOrders = useMemo(() => {
    return [...orders].sort((a, b) => {
      const timeA = new Date(a?.created_at || 0).getTime();
      const timeB = new Date(b?.created_at || 0).getTime();
      return timeA - timeB;
    });
  }, [orders]);

  const activeOrders = useMemo(() => {
    return sortedOrders.filter((o) =>
      ACTIVE_STATUSES.includes(String(o.status).toLowerCase())
    );
  }, [sortedOrders]);

  const completedOrders = useMemo(() => {
    return sortedOrders.filter(
      (o) => String(o.status).toLowerCase() === "completed"
    );
  }, [sortedOrders]);

  const totalRevenue = useMemo(() => {
    return completedOrders.reduce(
      (sum, o) => sum + Number(o.total_amount || 0),
      0
    );
  }, [completedOrders]);

  /* ================= UI ================= */

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 bg-orange-50 min-h-screen rounded-2xl">

      {/* HEADER */}

      <div className="flex justify-between items-center flex-wrap gap-3">

        <h1 className="text-3xl font-extrabold text-orange-600 tracking-wide">
          Admin Dashboard
        </h1>

        <Button
          variant="outline"
          className="border-orange-400 text-orange-600 hover:bg-orange-100 rounded-xl"
          disabled={refreshing}
          onClick={() => fetchOrders(true)}
        >
          {refreshing ? "Refreshing..." : "Refresh Orders"}
        </Button>

      </div>

      {/* QUICK ACTIONS */}

      <div className="flex gap-3 flex-wrap">

        <Button
          className="bg-orange-500 hover:bg-orange-600 text-white rounded-xl"
          onClick={() => navigate("/admin/orders")}
        >
          Manage Orders
        </Button>

        <Button
          className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl"
          onClick={() => navigate("/admin/counter")}
        >
          🧾 Counter Order
        </Button>

        <Button
          variant="outline"
          onClick={() => navigate("/admin/history")}
        >
          Order History
        </Button>

        <Button
          variant="outline"
          onClick={() => navigate("/admin/menu")}
        >
          Menu Management
        </Button>

        <Button
          variant="outline"
          onClick={() => navigate("/admin/wallet")}
        >
          Wallet Management
        </Button>

      </div>

      {/* STATS */}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

        <Card className="p-5 rounded-2xl shadow bg-white">
          <p className="text-gray-500 text-sm">Total Orders</p>
          <p className="text-3xl font-bold text-orange-600">
            {orders.length}
          </p>
        </Card>

        <Card className="p-5 rounded-2xl shadow bg-white">
          <p className="text-gray-500 text-sm">Active Orders</p>
          <p className="text-3xl font-bold text-orange-600">
            {activeOrders.length}
          </p>
        </Card>

        <Card className="p-5 rounded-2xl shadow bg-white">
          <p className="text-gray-500 text-sm">Completed</p>
          <p className="text-3xl font-bold text-green-600">
            {completedOrders.length}
          </p>
        </Card>

        <Card className="p-5 rounded-2xl shadow bg-white">
          <p className="text-gray-500 text-sm">Revenue</p>
          <p className="text-3xl font-bold text-emerald-600">
            ₹{totalRevenue}
          </p>
        </Card>

      </div>

    </div>
  );
};

export default AdminDashboard;