import { useEffect, useMemo, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Clock, CheckCircle } from "lucide-react";
import { getUserOrders } from "../api";
import { Button } from "../components/ui/button";

/* ================= STATUS GROUPS ================= */

const ACTIVE_STATUSES = new Set([
  "pending",
  "confirmed",
  "preparing",
  "ready_for_pickup"
]);

const COMPLETED_STATUSES = new Set([
  "completed",
  "picked_up",
  "cancelled"
]);

const STATUS_CONFIG = {
  confirmed: { label: "Confirmed", color: "text-blue-600 bg-blue-100", icon: "🟢" },
  preparing: { label: "Preparing", color: "text-purple-600 bg-purple-100", icon: "🟡" },
  ready_for_pickup: { label: "Ready For Pickup", color: "text-emerald-600 bg-emerald-100", icon: "🔵" },
  picked_up: { label: "Picked Up", color: "text-green-600 bg-green-100", icon: "✅" },
  pending: { label: "Pending", color: "text-gray-600 bg-gray-100", icon: "⏳" },
  cancelled: { label: "Cancelled", color: "text-red-600 bg-red-100", icon: "❌" },
  completed: { label: "Completed", color: "text-green-600 bg-green-100", icon: "✅" },
};

/* ================= TIME FORMAT (IST) ================= */

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

const OrdersPage = () => {

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("active");
  const [error, setError] = useState("");

  const navigate = useNavigate();

  const pollingRef = useRef(null);
  const fetchingRef = useRef(false);
  const mountedRef = useRef(true);

  /* ================= FETCH ================= */

  const fetchOrders = async () => {

    if (fetchingRef.current) return;

    try {

      fetchingRef.current = true;

      console.log("Fetching user orders...");
      const res = await getUserOrders();
      console.log("Orders response:", res);
      console.log("Orders response.data:", res?.data);

      const data = Array.isArray(res?.data) ? res.data : [];
      console.log("Normalized orders data:", data);
      console.log("Orders count:", data.length);

      if (!mountedRef.current) return;

      setOrders(data);
      setError("");

    } catch (err) {

      console.error("Failed to fetch orders ❌", err);

      if (mountedRef.current) {
        setError("Failed to load orders");
      }

    } finally {

      fetchingRef.current = false;

      if (mountedRef.current) {
        setLoading(false);
      }

    }

  };

  /* ================= POLLING ================= */

  useEffect(() => {

    fetchOrders();

    const interval = tab === "active" ? 7000 : 20000;

    pollingRef.current = setInterval(fetchOrders, interval);

    return () => {
      clearInterval(pollingRef.current);
    };

  }, [tab]);

  /* ================= TAB VISIBILITY OPTIMIZATION ================= */

  useEffect(() => {

    const handleVisibility = () => {

      if (document.hidden) {
        clearInterval(pollingRef.current);
      } else {
        fetchOrders();
      }

    };

    document.addEventListener("visibilitychange", handleVisibility);

    return () =>
      document.removeEventListener(
        "visibilitychange",
        handleVisibility
      );

  }, []);

  /* ================= MOUNT TRACK ================= */

  useEffect(() => {

    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
    };

  }, []);

  /* ================= FILTER ================= */

  const filteredOrders = useMemo(() => {

    const active = orders.filter((o) =>
      ACTIVE_STATUSES.has(
        String(o?.status || "").toLowerCase()
      )
    );

    const completed = orders.filter((o) =>
      COMPLETED_STATUSES.has(
        String(o?.status || "").toLowerCase()
      )
    );

    console.log("Active orders:", active);
    console.log("Completed orders:", completed);
    console.log("Current tab:", tab);

    return tab === "active" ? active : completed;

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

        <Button onClick={fetchOrders}>
          Retry
        </Button>

      </div>
    );

  }

  /* ================= UI ================= */

  return (

    <div className="max-w-5xl mx-auto px-4 py-8">

      <h1 className="text-2xl font-bold mb-4">
        My Orders
      </h1>

      {/* BACK BUTTON */}

      <Button
        variant="outline"
        onClick={() => navigate("/menu")}
        className="mb-4"
      >
        ← Back
      </Button>

      {/* ================= TABS ================= */}

      <div className="flex gap-4 mb-6">

        <button
          onClick={() => setTab("active")}
          className={`px-4 py-2 rounded ${
            tab === "active"
              ? "bg-orange-500 text-white"
              : "bg-gray-200"
          }`}
        >
          Active Orders
        </button>

        <button
          onClick={() => setTab("history")}
          className={`px-4 py-2 rounded ${
            tab === "history"
              ? "bg-orange-500 text-white"
              : "bg-gray-200"
          }`}
        >
          Order History
        </button>

      </div>

      {/* ================= EMPTY ================= */}

      {filteredOrders.length === 0 ? (

        <div className="text-center text-gray-500">

          <p>
            No {tab === "active" ? "active orders" : "past orders"}.
          </p>

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
              order?.order_id ||
              (mongoId
                ? mongoId.toString().slice(-4)
                : "—");

            const status = String(order?.status || "")
              .toLowerCase();

            const isCompleted =
              COMPLETED_STATUSES.has(status);

            return (

              <div
                key={mongoId}
                className={`border rounded-xl p-4 shadow-sm ${
                  isCompleted
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

                  <div className="flex items-center gap-2">
                    {STATUS_CONFIG[status] && (
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${STATUS_CONFIG[status].color}`}>
                        {STATUS_CONFIG[status].icon} {STATUS_CONFIG[status].label}
                      </span>
                    )}
                  </div>

                </div>

                <div className="mt-3 text-sm text-gray-700">

                  <p>
                    <strong>Total:</strong> ₹{order?.total_amount ?? 0}
                  </p>

                  <p>
                    <strong>Pickup Time:</strong>{" "}
                    {order?.pickup_time || "—"}
                  </p>

                  <p>
                    <strong>Payment:</strong>{" "}
                    {order?.payment_method || "—"}
                  </p>

                </div>

                <div className="mt-4 flex justify-end">

                  <button
                    onClick={() =>
                      navigate(`/order-confirmation/${order?.order_code || mongoId}`)
                    }
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