import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { useAuth } from "../context/AuthContext";
import { getAdminOrders } from "../api";
import { formatApiError } from "../utils/formatApiError";

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
  const [allOrders, setAllOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");

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

      const sorted = fetchedOrders.sort((a, b) => {
        const dateA = new Date(a.created_at || 0).getTime();
        const dateB = new Date(b.created_at || 0).getTime();
        return dateB - dateA;
      });

      setAllOrders(sorted);

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

  /* ================= FILTER ORDERS ================= */

  const filteredOrders = useMemo(() => {
    if (statusFilter === "all") {
      return allOrders;
    }
    return allOrders.filter(
      (o) => String(o.status).toLowerCase() === statusFilter.toLowerCase()
    );
  }, [allOrders, statusFilter]);

  useEffect(() => {
    setOrders(filteredOrders);
  }, [filteredOrders]);

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

      {/* FILTER TABS */}

      <div className="flex flex-wrap gap-2 border-b pb-4">

        {["all", "confirmed", "preparing", "ready_for_pickup", "picked_up"].map((filter) => (
          <button
            key={filter}
            onClick={() => setStatusFilter(filter)}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition ${
              statusFilter === filter
                ? "bg-blue-500 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {filter === "all" ? "All" : filter.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
          </button>
        ))}

      </div>

      {fetchError && (
        <Card className="p-4 text-red-700 bg-red-50 border-red-200 flex justify-between items-center">
          <span className="text-sm">{fetchError}</span>
          <Button variant="outline" size="sm" onClick={fetchOrders}>Retry</Button>
        </Card>
      )}

      {orders.length === 0 ? (

        <Card className="p-8 text-center text-gray-500">
          No orders found for this filter
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
                    Order Code:
                    <span className="font-normal">
                      {" "}
                      {order.order_code || `E-${order.order_id}`}
                    </span>
                  </p>

                  <p>
                    Customer:
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
                    Created at:{" "}
                    {formatIST(order.created_at)}
                  </p>

                </div>

                <div className="flex items-center">

                  <span className={`px-3 py-1 text-sm font-semibold rounded-full capitalize ${
                    order.status === "confirmed" ? "bg-blue-100 text-blue-700" :
                    order.status === "preparing" ? "bg-purple-100 text-purple-700" :
                    order.status === "ready_for_pickup" ? "bg-emerald-100 text-emerald-700" :
                    order.status === "picked_up" ? "bg-green-100 text-green-700" :
                    "bg-gray-100 text-gray-700"
                  }`}>
                    {order.status?.replace("_", " ")}
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