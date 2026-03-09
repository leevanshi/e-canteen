import { useEffect, useMemo, useState, useRef } from "react";
import API from "../api";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

/* ================= FORMAT TIME ================= */
const formatIST = (date) => {
  if (!date) return "—";
  try {
    return new Date(date).toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return "—";
  }
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

/* ================= STATUS PRIORITY ================= */
const STATUS_PRIORITY = {
  pending: 1,
  preparing: 2,
  completed: 3,
};

/* ================= RECEIPT FORMAT ================= */
const formatReceipt = (order) => {
  const items = Array.isArray(order.items) ? order.items : [];

  return `
COLLEGE CANTEEN
--------------------------------
Order ID: ${order.order_number || order._id}
Time: ${formatIST(order.created_at)}

Items:
${items
  .map(
    (i) =>
      `${i.name || "Item"} x${i.quantity || 0} - ₹${
        (i.quantity || 0) * (i.price || 0)
      }`
  )
  .join("\n")}

--------------------------------
Total: ₹${order.total_amount || 0}
--------------------------------
Thank You!
`;
};

/* ================= PRINT FUNCTION ================= */
const autoPrint = (content) => {
  const printWindow = window.open("", "_blank");

  if (!printWindow) return;

  printWindow.document.write(`
    <html>
      <body>
        <pre style="font-family:monospace;font-size:12px;">
${content}
        </pre>
      </body>
    </html>
  `);

  printWindow.document.close();

  setTimeout(() => {
    printWindow.print();
    printWindow.close();
  }, 300);
};

const AdminOrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  const printedOrdersRef = useRef(new Set());
  const isFirstLoad = useRef(true);
  const fetchingRef = useRef(false);
  const audioRef = useRef(null);

  const navigate = useNavigate();

  /* ================= SOUND ================= */
  const playSound = () => {
    try {
      audioRef.current?.play();
    } catch {}
  };

  useEffect(() => {
    audioRef.current = new Audio("/notification.mp3");
  }, []);

  /* ================= FETCH ORDERS ================= */
  const fetchOrders = async () => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;

    try {

      /* FIXED ENDPOINT */
      const res = await API.get("/api/admin/orders");

      const data = Array.isArray(res.data)
        ? res.data
        : res.data?.orders || [];

      /* FIRST LOAD */
      if (isFirstLoad.current) {
        printedOrdersRef.current = new Set(data.map((o) => o._id));
        isFirstLoad.current = false;
        setOrders(data);
        return;
      }

      /* DETECT NEW ORDERS */
      const newOrders = data.filter(
        (o) =>
          !printedOrdersRef.current.has(o._id) &&
          o.status?.toLowerCase() === "pending"
      );

      if (newOrders.length > 0) {
        newOrders.forEach((order) => {
          playSound();
          autoPrint(formatReceipt(order));
          printedOrdersRef.current.add(order._id);
        });

        toast.success("New order received!");
      }

      setOrders(data);
    } catch (err) {
      console.error("Fetch error:", err);
      toast.error("Failed to fetch orders");
    } finally {
      fetchingRef.current = false;
      setLoading(false);
    }
  };

  /* ================= POLLING ================= */
  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 8000);
    return () => clearInterval(interval);
  }, []);

  /* ================= SORT ================= */
  const sortedOrders = useMemo(() => {
    return [...orders]
      .filter((o) => o?.order_type !== "walk-in")
      .sort((a, b) => {
        const statusA = a?.status?.toLowerCase();
        const statusB = b?.status?.toLowerCase();

        const statusDiff =
          (STATUS_PRIORITY[statusA] || 99) -
          (STATUS_PRIORITY[statusB] || 99);

        if (statusDiff !== 0) return statusDiff;

        return new Date(b?.created_at || 0) - new Date(a?.created_at || 0);
      });
  }, [orders]);

  /* ================= UPDATE STATUS ================= */
  const updateStatus = async (mongoId, status) => {
    if (!mongoId) return;

    try {
      setUpdatingId(mongoId);

      /* FIXED ENDPOINT */
      await API.put(`/api/admin/orders/${mongoId}/status`, { status });

      toast.success(`Order updated → ${status}`);

      setOrders((prev) =>
        prev.map((o) =>
          o._id === mongoId ? { ...o, status } : o
        )
      );
    } catch (err) {
      console.error("Update error:", err);
      toast.error(err.response?.data?.detail || "Failed to update");
    } finally {
      setUpdatingId(null);
    }
  };

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

      {sortedOrders.length === 0 && (
        <p className="text-center text-gray-500 mt-10">
          No active orders
        </p>
      )}

      {sortedOrders.map((order) => {
        const mongoId = order?._id;
        if (!mongoId) return null;

        const displayId =
          order.order_number || order.order_id || "—";

        const currentStatus =
          order?.status?.toLowerCase() || "pending";

        const isUrgent = currentStatus === "pending";

        return (
          <div
            key={mongoId}
            className={`bg-white rounded-xl shadow p-5 mb-6 border transition ${
              isUrgent ? "border-blue-500 shadow-md" : ""
            }`}
          >
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

            <p className="mt-2">
              Ordered by: <strong>{order.user_name || "User"}</strong>
            </p>

            <p className="font-medium">
              Total: ₹{order.total_amount ?? 0}
            </p>

            <p className="text-sm text-gray-500">
              Payment: {order.payment_method || "—"} (
              {order.payment_status || "—"})
            </p>

            <p className="text-sm text-gray-500">
              Placed at: {formatIST(order.created_at)}
            </p>

            <ul className="mt-3 list-disc ml-5 text-sm">
              {Array.isArray(order.items) &&
                order.items.map((item, idx) => (
                  <li key={idx}>
                    {item?.name || "Item"} × {item?.quantity || 0}
                  </li>
                ))}
            </ul>

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