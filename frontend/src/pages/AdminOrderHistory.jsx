import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { useAuth } from "../context/AuthContext";
import { getAdminOrders } from "../api";

import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";

/* ================= HELPERS ================= */

const formatIST = (date) => {
  if (!date) return "—";
  return new Date(date).toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    dateStyle: "medium",
    timeStyle: "short",
  });
};

const getCompletedTime = (order) => {
  if (!order) return null;

  // 1. status_history check
  if (Array.isArray(order.status_history)) {
    const completed = [...order.status_history]
      .reverse()
      .find((s) => String(s.status).toLowerCase() === "completed");

    if (completed?.time) return completed.time;
  }

  // 2. completed_at field (agar backend bhej raha ho)
  if (order.completed_at) return order.completed_at;

  // 3. updated_at fallback
  if (order.updated_at) return order.updated_at;

  // 4. last fallback
  return order.created_at || null;
};

/* ================= COMPONENT ================= */

const AdminOrderHistory = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  /* 🔐 ADMIN / STAFF PROTECTION */
  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      navigate("/login", { replace: true });
      return;
    }

    if (!["admin", "staff"].includes(user.role)) {
      navigate("/", { replace: true });
    }
  }, [user, authLoading, navigate]);

  /* 📦 FETCH COMPLETED ORDERS */
  const fetchOrders = async () => {
    try {
      setLoading(true);

      const res = await getAdminOrders();
      const allOrders = res?.data || [];

      const completedOrders = allOrders.filter(
        (o) => o.status?.toLowerCase() === "completed"
      );

      // 🔥 Latest completed first
      const sorted = completedOrders.sort(
        (a, b) =>
          new Date(getCompletedTime(b)) -
          new Date(getCompletedTime(a))
      );

      setOrders(sorted);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load order history");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === "admin" || user?.role === "staff") {
      fetchOrders();
      const interval = setInterval(fetchOrders, 15000);
      return () => clearInterval(interval);
    }
  }, [user?.role]);

  if (authLoading || !user) return null;

  if (loading) {
    return (
      <div className="p-10 text-center text-gray-500">
        Loading order history...
      </div>
    );
  }

  /* ================= UI ================= */

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <h1 className="text-2xl font-bold">📜 Order History</h1>

        <div className="flex gap-3">
          <Button variant="outline" onClick={fetchOrders}>
            Refresh
          </Button>
<Button
  variant="outline"
  onClick={() => navigate(-1)}
  className="mb-4"
>
  ← Back
</Button>

          <Button
            variant="outline"
            onClick={() => navigate("/admin/dashboard")}
          >
            Back to Dashboard
          </Button>
        </div>
      </div>

      {orders.length === 0 ? (
        <Card className="p-8 text-center text-gray-500">
          No completed orders yet
        </Card>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <Card key={order._id} className="p-5 rounded-xl">
              <div className="flex flex-col md:flex-row md:justify-between gap-6">
                {/* LEFT INFO */}
                <div className="space-y-2">
                  <p className="font-semibold">
                    Order ID:{" "}
                    <span className="font-normal">
                      #{order.order_id}
                    </span>
                  </p>

                  <p>
                    User:{" "}
                    <span className="font-medium">
                      {order.user_name || "Walk-in Customer"}
                    </span>
                  </p>


                  <p className="font-semibold">
                    Total: ₹{order.total_amount}
                  </p>

                  <p className="text-sm text-gray-500">
                    Completed at:{" "}
                    {formatIST(getCompletedTime(order))}
                  </p>
                </div>

                {/* STATUS */}
                <div className="flex items-center">
                  <span className="px-3 py-1 text-sm font-semibold rounded-full bg-green-100 text-green-700">
                    Completed
                  </span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminOrderHistory;
