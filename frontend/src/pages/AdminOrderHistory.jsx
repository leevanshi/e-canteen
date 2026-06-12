import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { useAuth } from "../context/AuthContext";
import { getAdminOrders, updateOrderStatus } from "../api";
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

      const sorted = fetchedOrders.sort((a, b) => {
        const dateA = new Date(a.created_at || 0).getTime();
        const dateB = new Date(b.created_at || 0).getTime();
        return dateB - dateA;
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
          📜 Order Management
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

      {fetchError && (
        <Card className="p-4 text-red-700 bg-red-50 border-red-200 flex justify-between items-center">
          <span className="text-sm">{fetchError}</span>
          <Button variant="outline" size="sm" onClick={fetchOrders}>Retry</Button>
        </Card>
      )}

      {orders.length === 0 ? (

        <Card className="p-8 text-center text-gray-500">
          No orders found
        </Card>

      ) : (

        <div className="space-y-4">

          {orders.map((order) => (

            <Card
              key={order._id}
              className="p-5 rounded-xl"
            >

              <div className="flex flex-col gap-4">

                {/* Order Info */}
                <div className="flex flex-col md:flex-row md:justify-between gap-4">

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
                        {order.user_name || "Walk-in Customer"}
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

                {/* Items */}
                {order.items && order.items.length > 0 && (
                  <div className="border-t pt-3">
                    <p className="text-sm font-semibold mb-2">Items:</p>
                    <div className="space-y-1">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="text-sm text-gray-600">
                          {item.name || item.item_name} x {item.quantity}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Status Controls */}
                <div className="border-t pt-4">
                  <p className="text-sm font-semibold mb-3">Update Status:</p>
                  <div className="flex flex-wrap gap-2">
                    {ORDER_STATUSES.map((status) => (
                      <button
                        key={status.key}
                        onClick={() => handleStatusUpdate(order.order_id || order._id, status.key)}
                        disabled={updatingStatus === (order.order_id || order._id)}
                        className={`px-3 py-2 text-sm font-medium rounded-lg border-2 transition-all ${
                          order.status === status.key
                            ? status.color + " ring-2 ring-offset-2 ring-orange-500"
                            : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                        } ${updatingStatus === (order.order_id || order._id) ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                      >
                        {status.label}
                      </button>
                    ))}
                  </div>
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