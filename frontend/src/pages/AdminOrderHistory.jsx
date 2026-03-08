import { useEffect, useState, useMemo } from "react";
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

      const res = await getAdminOrders();

      const allOrders = Array.isArray(res?.data)
        ? res.data
        : [];

      const completedOrders = allOrders.filter(
        (o) =>
          String(o.status).toLowerCase() === "completed"
      );

      const sorted = completedOrders.sort((a, b) => {

        const dateA = new Date(
          getCompletedTime(a) || 0
        ).getTime();

        const dateB = new Date(
          getCompletedTime(b) || 0
        ).getTime();

        return dateB - dateA;

      });

      setOrders(sorted);

    } catch (err) {

      console.error(err);
      toast.error("Failed to load order history");

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

        <h1 className="text-2xl font-bold">
          📜 Order History
        </h1>

        <div className="flex gap-3">

          <Button
            variant="outline"
            onClick={fetchOrders}
          >
            Refresh
          </Button>

          <Button
            variant="outline"
            onClick={() => navigate(-1)}
          >
            ← Back
          </Button>

          <Button
            variant="outline"
            onClick={() =>
              navigate("/admin/dashboard")
            }
          >
            Dashboard
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

            <Card
              key={order._id}
              className="p-5 rounded-xl"
            >

              <div className="flex flex-col md:flex-row md:justify-between gap-6">

                <div className="space-y-2">

                  <p className="font-semibold">
                    Order ID:
                    <span className="font-normal">
                      {" "}
                      #{order.order_id}
                    </span>
                  </p>

                  <p>
                    User:
                    <span className="font-medium">
                      {" "}
                      {order.user_name ||
                        "Walk-in Customer"}
                    </span>
                  </p>

                  <p className="font-semibold">
                    Total: ₹{order.total_amount}
                  </p>

                  <p className="text-sm text-gray-500">
                    Completed at:{" "}
                    {formatIST(
                      getCompletedTime(order)
                    )}
                  </p>

                </div>

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