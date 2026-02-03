import { useEffect, useState } from "react";
import API from "../api";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";


const formatIST = (date) => {
  if (!date) return "—";
  return new Date(date).toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    dateStyle: "medium",
    timeStyle: "short",
  });
};

const statusBadge = (status = "") => {
  switch (status.toLowerCase()) {
    case "completed":
      return "bg-green-100 text-green-700";
    case "preparing":
      return "bg-orange-100 text-orange-700";
    default:
      return "bg-blue-100 text-blue-700";
  }
};

const AdminOrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  const fetchOrders = async () => {
    try {
      const res = await API.get("/admin/orders");
      setOrders(Array.isArray(res.data) ? res.data : []);
    } catch {
      toast.error("Failed to fetch orders");
    } finally {
      setLoading(false);
    }
  };
  const navigate = useNavigate();

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 10000);
    return () => clearInterval(interval);
  }, []);

  const updateStatus = async (mongoId, status) => {
    try {
      setUpdatingId(mongoId);

      await API.put(`/admin/orders/${mongoId}/status`, { status });

      toast.success(`Order marked as ${status}`);
      fetchOrders();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to update");
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) {
    return <p className="text-center mt-10 text-gray-500">Loading orders...</p>;
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
<div className="flex justify-between items-center mb-6 flex-wrap gap-3">

  {/* LEFT SIDE */}
  <div className="flex items-center gap-3">
    <button
      onClick={() => navigate(-1)}
      className="px-3 py-2 border rounded hover:bg-gray-100"
    >
      ← Back
    </button>

    <h1 className="text-2xl font-bold">Admin Dashboard – Orders</h1>
  </div>

  {/* RIGHT SIDE */}
  <button
    onClick={fetchOrders}
    className="px-4 py-2 rounded bg-black text-white"
  >
    🔄 Refresh
  </button>
</div>


      {orders
        .filter((order) => order.order_type !== "walk-in")
        .map((order) => {
          const mongoId = order._id;
          const displayId = order.order_number || order.order_id || "—";
          const currentStatus = order.status?.toLowerCase();

          return (
            <div
              key={mongoId}
              className="bg-white rounded-xl shadow p-5 mb-6 border"
            >
              <div className="flex justify-between">
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

              <p className="mt-2">
                Ordered by: <strong>{order.user_name || "User"}</strong>
              </p>

              <p>Total Amount: ₹{order.total_amount}</p>
              <p className="text-sm text-gray-500">
                Payment: {order.payment_method} ({order.payment_status})
              </p>

              <p className="text-sm text-gray-500">
                Placed at: {formatIST(order.created_at)}
              </p>

              <ul className="mt-3 list-disc ml-5">
                {(order.items || []).map((item, idx) => (
                  <li key={idx}>
                    {item.name} × {item.quantity}
                  </li>
                ))}
              </ul>

              <div className="flex gap-2 mt-4">
                {["pending", "preparing", "completed"].map((status) => (
                  <button
                    key={status}
                    disabled={
                      updatingId === mongoId ||
                      currentStatus === status
                    }
                    onClick={() => updateStatus(mongoId, status)}
                    className={`px-4 py-1 rounded border text-sm capitalize ${
                      currentStatus === status
                        ? "bg-black text-white"
                        : "hover:bg-gray-100"
                    }`}
                  >
                    {updatingId === mongoId ? "Updating..." : status}
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
