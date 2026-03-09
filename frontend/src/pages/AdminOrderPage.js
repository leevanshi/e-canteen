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

/* ================= RECEIPT ================= */
const formatReceipt = (order) => {
  const items = Array.isArray(order.items) ? order.items : [];

  return `
COLLEGE CANTEEN
--------------------------------
Order ID: ${order.order_id || order._id}
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

/* ================= PRINT ================= */
const autoPrint = (content) => {
  const win = window.open("", "PRINT", "height=600,width=400");

  if (!win) return;

  win.document.write(`
    <html>
      <head>
        <title>Receipt</title>
      </head>
      <body>
        <pre style="font-family:monospace;font-size:12px;">
${content}
        </pre>
      </body>
    </html>
  `);

  win.document.close();

  setTimeout(() => {
    win.focus();
    win.print();
    win.close();
  }, 300);
};

const AdminOrdersPage = () => {

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  const printedOrders = useRef(new Set());
  const audioRef = useRef(null);
  const wsRef = useRef(null);

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

  /* ================= INITIAL FETCH ================= */

  const fetchOrders = async () => {
    try {

      const res = await API.get("/api/orders/admin/all");

      const data = Array.isArray(res.data)
        ? res.data
        : res.data?.orders || [];

      printedOrders.current = new Set(data.map((o) => o._id));

      setOrders(data);

    } catch (err) {

      console.error("Fetch error:", err);
      toast.error("Failed to fetch orders");

    } finally {

      setLoading(false);

    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  /* ================= WEBSOCKET ================= */

  useEffect(() => {

    const wsUrl =
      (window.location.protocol === "https:" ? "wss://" : "ws://") +
      window.location.host.replace("5173", "8000") +
      "/ws/orders";

    const ws = new WebSocket(wsUrl);

    wsRef.current = ws;

    ws.onopen = () => {
      console.log("Orders WebSocket connected");
    };

    ws.onmessage = (event) => {

      const data = JSON.parse(event.data);

      if (data.type === "new_order") {

        const order = data.order;

        if (!printedOrders.current.has(order._id)) {

          printedOrders.current.add(order._id);

          setOrders((prev) => [order, ...prev]);

          playSound();

          autoPrint(formatReceipt(order));

          toast.success("🔔 New order received");

        }
      }
    };

    ws.onclose = () => {
      console.log("Orders WebSocket disconnected");
    };

    return () => ws.close();

  }, []);

  /* ================= SORT ================= */

  const sortedOrders = useMemo(() => {

    return [...orders]
      .filter((o) => o?.order_type !== "walk-in")
      .sort((a, b) => {

        const statusA = a?.status?.toLowerCase();
        const statusB = b?.status?.toLowerCase();

        const diff =
          (STATUS_PRIORITY[statusA] || 99) -
          (STATUS_PRIORITY[statusB] || 99);

        if (diff !== 0) return diff;

        return new Date(b.created_at) - new Date(a.created_at);

      });

  }, [orders]);

  /* ================= UPDATE STATUS ================= */

  const updateStatus = async (id, status) => {

    if (!id) return;

    try {

      setUpdatingId(id);

      await API.put(`/api/admin/orders/${id}/status`, { status });

      setOrders((prev) =>
        prev.map((o) =>
          o._id === id ? { ...o, status } : o
        )
      );

      toast.success(`Order → ${status}`);

    } catch (err) {

      console.error(err);

      toast.error(
        err.response?.data?.detail || "Update failed"
      );

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

        const mongoId = order._id;

        const displayId =
          order.order_id || order.order_number || "—";

        const status =
          order.status?.toLowerCase() || "pending";

        const urgent = status === "pending";

        return (

          <div
            key={mongoId}
            className={`bg-white rounded-xl shadow p-5 mb-6 border ${
              urgent ? "border-blue-500 shadow-md" : ""
            }`}
          >

            <div className="flex justify-between items-center">

              <h2 className="font-semibold text-lg">
                Order #{displayId}
              </h2>

              <span
                className={`px-3 py-1 rounded-full text-sm capitalize ${statusBadge(
                  status
                )}`}
              >
                {status}
              </span>

            </div>

            <p className="mt-2">
              Ordered by <strong>{order.user_name || "User"}</strong>
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
              {order.items?.map((item, i) => (
                <li key={i}>
                  {item.name} × {item.quantity}
                </li>
              ))}
            </ul>

            <div className="flex gap-2 mt-4 flex-wrap">

              {["pending", "preparing", "completed"].map((s) => (

                <button
                  key={s}
                  disabled={updatingId === mongoId || s === status}
                  onClick={() => updateStatus(mongoId, s)}
                  className={`px-4 py-1 rounded border text-sm capitalize ${
                    s === status
                      ? "bg-black text-white"
                      : "hover:bg-gray-100"
                  }`}
                >
                  {updatingId === mongoId
                    ? "Updating..."
                    : s}
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