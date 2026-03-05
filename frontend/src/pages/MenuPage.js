import { useEffect, useMemo, useState } from "react";
import API from "../api";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

/* ================= FORMAT TIME ================= */
const formatIST = (date) => {
  if (!date) return "—";
  return new Date(date).toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    dateStyle: "medium",
    timeStyle: "short",
  });
};

/* ================= STATUS BADGE ================= */
const statusBadge = (status = "") => {
  switch (status.toLowerCase()) {
    case "completed":
      return "bg-green-100 text-green-700";
    case "preparing":
      return "bg-orange-100 text-orange-700";
    case "pending":
      return "bg-blue-100 text-blue-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
};

/* ================= STATUS ORDER (IMPORTANT) ================= */
const STATUS_PRIORITY = {
  pending: 1,
  preparing: 2,
  completed: 3,
};

const AdminOrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  const navigate = useNavigate();

  /* ================= FETCH ================= */
  const fetchOrders = async () => {
    try {
      const res = await API.get("/orders");
      const data = Array.isArray(res.data) ? res.data : [];
      setOrders(data);
    } catch {
      toast.error("Failed to fetch orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();

    const interval = setInterval(fetchOrders, 8000); // faster refresh
    return () => clearInterval(interval);
  }, []);

  /* ================= SORTED ORDERS ================= */
  const sortedOrders = useMemo(() => {
    return [...orders]
      .filter((o) => o.order_type !== "walk-in")
      .sort((a, b) => {
        const statusDiff =
          (STATUS_PRIORITY[a.status] || 99) -
          (STATUS_PRIORITY[b.status] || 99);

        if (statusDiff !== 0) return statusDiff;

        // newest first
        return new Date(b.created_at) - new Date(a.created_at);
      });
  }, [orders]);

  /* ================= UPDATE STATUS ================= */
  const updateStatus = async (mongoId, status) => {
    try {
      setUpdatingId(mongoId);

      await API.put(`/admin/orders/${mongoId}/status`, { status });

      toast.success(`Order → ${status}`);
      fetchOrders();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to update");
    } finally {
      setUpdatingId(null);
    }
  };

  /* ================= LOADING ================= */
  if (loading) {
    return (
      <p className="text-center mt-10 text-gray-500 animate-pulse">
        Loading orders...
      </p>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">

      {/* HEADER */}
      <div className="flex justify-between items-center mb-6 flex-wrap gap-3">

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="px-3 py-2 border rounded hover:bg-gray-100"
          >
            ← Back
          </button>

          <h1 className="text-2xl font-bold">
            Admin Dashboard – Orders
          </h1>
        </div>

        <button
          onClick={fetchOrders}
          className="px-4 py-2 rounded bg-black text-white hover:opacity-80"
        >
          🔄 Refresh
        </button>
      </div>

      {/* EMPTY */}
      {sortedOrders.length === 0 && (
        <p className="text-center text-gray-500 mt-10">
          No active orders
        </p>
      )}

      {/* ORDERS */}
      {sortedOrders.map((order) => {
        const mongoId = order._id;
        const displayId = order.order_number || order.order_id || "—";
        const currentStatus = order.status?.toLowerCase();

        const isUrgent = currentStatus === "pending";

        return (
          <div
            key={mongoId}
            className={`bg-white rounded-xl shadow p-5 mb-6 border transition ${
              isUrgent ? "border-blue-500 shadow-md" : ""
            }`}
          >
            {/* HEADER */}
            <div className="flex justify-between items-center">
              <h2 className="font-semibold text-lg">
                Order #{displayId}
              </h2>

              <span
                className={`px-3 py-1 rounded-full text-sm capitalize ${statusBadge(
                  currentStatus
                )}`}
              >
                {currentStatus}
              </span>
            </div>

            {/* DETAILS */}
            <p className="mt-2">
              Ordered by: <strong>{order.user_name || "User"}</strong>
            </p>

            <p className="font-medium">
              Total: ₹{order.total_amount}
            </p>

            <p className="text-sm text-gray-500">
              Payment: {order.payment_method} ({order.payment_status})
            </p>

            <p className="text-sm text-gray-500">
              Placed at: {formatIST(order.created_at)}
            </p>

            {/* ITEMS */}
            <ul className="mt-3 list-disc ml-5 text-sm">
              {(order.items || []).map((item, idx) => (
                <li key={idx}>
                  {item.name} × {item.quantity}
                </li>
              ))}
            </ul>

            {/* ACTIONS */}
            <div className="flex gap-2 mt-4 flex-wrap">
              {["pending", "preparing", "completed"].map((status) => (
                <button
                  key={status}
                  disabled={
                    updatingId === mongoId ||
                    currentStatus === status
                  }
                  onClick={() => updateStatus(mongoId, status)}
                  className={`px-4 py-1 rounded border text-sm capitalize transition ${
                    currentStatus === status
                      ? "bg-black text-white"
                      : "hover:bg-gray-100"
                  }`}
                >
                  {updatingId === mongoId
                    ? "Updating..."
                    : status}
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default AdminOrdersPage;