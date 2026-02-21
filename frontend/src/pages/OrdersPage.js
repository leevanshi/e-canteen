import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Clock, CheckCircle } from "lucide-react";
import { getUserOrders } from "../api";

import { Button } from "../components/ui/button";

/* ================= STATUS GROUPS ================= */
const ACTIVE_STATUSES = new Set([
  "pending",
  "placed",
  "confirmed",
  "preparing",
  "prepared",
  "ready",
]);

const COMPLETED_STATUSES = new Set([
  "completed",
  "delivered",
]);

/* ================= TIME FORMAT (IST) ================= */
const formatIST = (date) => {
  if (!date) return "—";
  return new Date(date).toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    dateStyle: "medium",
    timeStyle: "short",
  });
};

const OrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("active");
  const [error, setError] = useState("");

  const navigate = useNavigate();

  /* ================= FETCH ================= */
  const fetchOrders = async () => {
    try {
      const res = await getUserOrders();
      setOrders(Array.isArray(res.data) ? res.data : []);
      setError("");
    } catch (err) {
      console.error("Failed to fetch orders ❌", err);
      setError("Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();

    const interval = setInterval(fetchOrders, 10000);

    return () => clearInterval(interval);
  }, []);

  /* ================= FILTER ================= */
  const filteredOrders = useMemo(() => {
    return tab === "active"
      ? orders.filter((o) =>
          ACTIVE_STATUSES.has(String(o?.status || "").toLowerCase())
        )
      : orders.filter((o) =>
          COMPLETED_STATUSES.has(String(o?.status || "").toLowerCase())
        );
  }, [orders, tab]);

  /* ================= LOADING ================= */
  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center text-gray-500">
        Loading your orders...
      </div>
    );
  }

  /* ================= ERROR ================= */
  if (error) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center gap-4">
        <p className="text-red-500">{error}</p>
        <Button onClick={fetchOrders}>Retry</Button>
      </div>
    );
  }

  /* ================= UI ================= */
  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">My Orders</h1>

      {/* BACK BUTTON */}
      <Button
        variant="outline"
        onClick={() => navigate(-1)}
        className="mb-4"
      >
        ← Back
      </Button>

      {/* ================= TABS ================= */}
      <div className="flex gap-4 mb-6">
        <button
          onClick={() => setTab("active")}
          className={`px-4 py-2 rounded ${
            tab === "active" ? "bg-orange-500 text-white" : "bg-gray-200"
          }`}
        >
          Active Orders
        </button>

        <button
          onClick={() => setTab("history")}
          className={`px-4 py-2 rounded ${
            tab === "history" ? "bg-orange-500 text-white" : "bg-gray-200"
          }`}
        >
          Order History
        </button>
      </div>

      {/* ================= EMPTY ================= */}
      {filteredOrders.length === 0 ? (
        <div className="text-center text-gray-500">
          <p>No {tab === "active" ? "active orders" : "past orders"}.</p>
          <Button
            className="mt-4"
            onClick={() => navigate("/menu")}
          >
            Order Now
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => {
            const mongoId = order?._id;

            const displayId =
              order?.order_number ||
              order?.order_id ||
              (mongoId ? mongoId.toString().slice(-4) : "—");

            const status = String(order?.status || "").toLowerCase();

            const isPrepared =
              status === "prepared" || status === "ready";

            const isCompleted =
              COMPLETED_STATUSES.has(status);

            return (
              <div
                key={mongoId}
                className={`border rounded-xl p-4 shadow-sm ${
                  isCompleted || isPrepared
                    ? "border-green-500 bg-green-50"
                    : "bg-white"
                }`}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-semibold">
                      Order #{displayId}
                    </p>
                    <p className="text-sm text-gray-500">
                      {formatIST(order?.created_at)}
                    </p>
                  </div>

                  {isCompleted ? (
                    <span className="flex items-center gap-1 text-green-700 font-semibold">
                      <CheckCircle size={18} />
                      Completed
                    </span>
                  ) : isPrepared ? (
                    <span className="flex items-center gap-1 text-green-700 font-semibold">
                      <CheckCircle size={18} />
                      Ready to Pickup
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-orange-600 capitalize">
                      <Clock size={16} />
                      {status || "pending"}
                    </span>
                  )}
                </div>

                <div className="mt-3 text-sm text-gray-700">
                  <p><strong>Total:</strong> ₹{order?.total_amount ?? 0}</p>
                  <p><strong>Pickup Time:</strong> {order?.pickup_time || "—"}</p>
                  <p><strong>Payment:</strong> {order?.payment_method || "—"}</p>
                </div>

                <div className="mt-4 flex justify-end">
                  <button
                    onClick={() => navigate(`/orders/${mongoId}`)}
                    className="px-4 py-2 rounded-lg bg-orange-500 text-white hover:bg-orange-600"
                  >
                    View Details
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default OrdersPage;