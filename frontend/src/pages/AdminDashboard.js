import { useEffect, useRef, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { useAuth } from "../context/AuthContext";
import { getAdminDashboard } from "../api";

import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";

/* ================= HELPERS ================= */

const formatIST = (date) => {
  if (!date) return "—";

  const d = new Date(date);
  if (isNaN(d.getTime())) return "—";

  return d.toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    dateStyle: "medium",
    timeStyle: "short",
    hour12: true,
  });
};

/* ================= COMPONENT ================= */

const AdminDashboard = () => {

  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    completed: 0,
    revenue: 0
  });

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const role = useMemo(
    () => (user?.role || "").toLowerCase(),
    [user]
  );

  /* ================= FETCH DASHBOARD ================= */

  const fetchDashboard = async (manual = false) => {

    try {

      if (manual) setRefreshing(true);

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

      console.error(err);
      toast.error("Failed to load dashboard");

    } finally {

      setLoading(false);
      setRefreshing(false);

    }

  };

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

  /* ================= LOAD DASHBOARD ================= */

  useEffect(() => {

    if (!user || authLoading || role !== "admin") return;

    fetchDashboard();

  }, [user, authLoading, role]);

  /* ================= SORT ORDERS ================= */

  const sortedOrders = useMemo(() => {

    return [...orders].sort((a, b) => {
      const timeA = new Date(a?.created_at || 0).getTime();
      const timeB = new Date(b?.created_at || 0).getTime();
      return timeB - timeA;
    });

  }, [orders]);

  /* ================= LOADING ================= */

  if (authLoading || loading) {

    return (
      <div className="p-10 text-center text-gray-500 animate-pulse">
        Loading dashboard...
      </div>
    );

  }

  if (!user) return null;

  /* ================= UI ================= */

  return (

    <div className="p-6 max-w-7xl mx-auto space-y-8 bg-orange-50 min-h-screen rounded-2xl">

      <div className="flex justify-between items-center flex-wrap gap-3">

        <h1 className="text-3xl font-extrabold text-orange-600 tracking-wide">
          Admin Dashboard
        </h1>

        <Button
          variant="outline"
          disabled={refreshing}
          onClick={() => fetchDashboard(true)}
        >
          {refreshing ? "Refreshing..." : "Refresh"}
        </Button>

      </div>

      {/* QUICK ACTIONS */}

      <div className="flex gap-3 flex-wrap">

        <Button onClick={() => navigate("/admin/orders")}>
          Manage Orders
        </Button>

        <Button onClick={() => navigate("/admin/counter")}>
          Counter Order
        </Button>

        <Button onClick={() => navigate("/admin/history")}>
          Order History
        </Button>

        <Button onClick={() => navigate("/admin/menu")}>
          Menu Management
        </Button>

        <Button onClick={() => navigate("/admin/wallet")}>
          Wallet Management
        </Button>

      </div>

      {/* STATS */}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

        <Card className="p-5">
          <p className="text-gray-500 text-sm">
            Total Orders
          </p>
          <p className="text-3xl font-bold text-orange-600">
            {stats.total}
          </p>
        </Card>

        <Card className="p-5">
          <p className="text-gray-500 text-sm">
            Active Orders
          </p>
          <p className="text-3xl font-bold text-orange-600">
            {stats.active}
          </p>
        </Card>

        <Card className="p-5">
          <p className="text-gray-500 text-sm">
            Completed
          </p>
          <p className="text-3xl font-bold text-green-600">
            {stats.completed}
          </p>
        </Card>

        <Card className="p-5">
          <p className="text-gray-500 text-sm">
            Revenue
          </p>
          <p className="text-3xl font-bold text-emerald-600">
            ₹{stats.revenue}
          </p>
        </Card>

      </div>

      {/* RECENT ORDERS */}

      <div className="space-y-3">

        <h2 className="text-xl font-semibold">
          Recent Orders
        </h2>

        {sortedOrders.length === 0 ? (

          <p className="text-gray-500">
            No recent orders
          </p>

        ) : (

          sortedOrders.map((o) => (

            <Card key={o._id} className="p-4 flex justify-between items-center">

              <div>
                <p className="font-semibold">
                  Order #{o.order_id}
                </p>

                <p className="text-sm text-gray-500">
                  {formatIST(o.created_at)}
                </p>
              </div>

              <div className="text-right">

                <p className="font-medium">
                  ₹{o.total_amount}
                </p>

                <p className="text-sm capitalize text-gray-600">
                  {o.status}
                </p>

              </div>

            </Card>

          ))

        )}

      </div>

    </div>

  );

};

export default AdminDashboard;