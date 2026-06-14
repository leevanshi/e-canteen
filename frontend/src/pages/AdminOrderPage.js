import { useEffect, useMemo, useState, useRef } from "react";
import API from "../api";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { formatApiError } from "../utils/formatApiError";

/* ================= TIME ================= */

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

/* ================= STATUS COLORS ================= */

const statusBadge = (status = "") => {
  switch (status.toLowerCase()) {
    case "ready_for_pickup":
      return "bg-emerald-100 text-emerald-700";
    case "preparing":
      return "bg-purple-100 text-purple-700";
    case "confirmed":
      return "bg-blue-100 text-blue-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
};

const STATUS_PRIORITY = {
  confirmed: 1,
  preparing: 2,
  ready_for_pickup: 3,
};

/* ================= RECEIPT ================= */

const formatReceipt = (order) => {

  const items = Array.isArray(order.items) ? order.items : [];

  return `
eCanteen Receipt
Student Food Ordering Platform
--------------------------------

Order No : ${order.order_code || `E-${order.order_id}` || order._id}
Date     : ${new Date(order.created_at).toLocaleDateString("en-IN")}
Time     : ${new Date(order.created_at).toLocaleTimeString("en-IN")}
Order Type: Counter

--------------------------------
Qty  Item                Amt
--------------------------------
${items
  .map(
    (i) =>
      `${String(i.quantity).padEnd(4)} ${i.name.padEnd(18)} ₹${(
        i.quantity * i.price
      ).toFixed(0)}`
  )
  .join("\n")}
--------------------------------

Total                   ₹${order.total_amount}

--------------------------------
Thank you for using
eCanteen
`;
};

/* ================= PRINT ================= */

const autoPrint = (content) => {

  const win = window.open("", "PRINT", "height=600,width=400");
  if (!win) return;

  win.document.write(`
<html>
<body>
<pre style="font-family:monospace;font-size:12px;">
${content}
</pre>
</body>
</html>
`);

  win.document.close();

  setTimeout(() => {
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

  /* ================= FETCH ================= */

  const fetchOrders = async () => {

    try {

      const res = await API.get("/api/orders/admin/all");

      const data =
        Array.isArray(res.data)
          ? res.data
          : res.data?.orders || [];

      printedOrders.current = new Set(data.map((o) => o._id));

      setOrders(data);

    } catch (err) {

      console.error(err);
      toast.error(formatApiError(err?.response?.data?.detail,
        err?.response ? "Failed to load orders" : "Backend unreachable"));

    } finally {

      setLoading(false);

    }

  };

  useEffect(() => {
    fetchOrders();
  }, []);

  /* ================= WEBSOCKET ================= */

  useEffect(() => {

    const apiBase = API.defaults.baseURL || "";
    const wsBase = apiBase.replace(/^http/, "ws");
    const ws = new WebSocket(`${wsBase}/ws/orders`);

    ws.onmessage = (event) => {

      const data = JSON.parse(event.data);

      if (data.type === "new_order") {

        const order = data.order;

        if (!printedOrders.current.has(order._id)) {

          printedOrders.current.add(order._id);

          setOrders((prev) => [...prev, order]); // Append to end of queue

          playSound();

          if (order.order_type === "walk-in") {
            autoPrint(formatReceipt(order));
          }

        }
      }
    };

    return () => ws.close();

  }, []);

  /* ================= SORT (STRICT FIFO) ================= */

  const sortedOrders = useMemo(() => {

    // STRICT FIFO: Sort by createdAt ascending only
    // Oldest order always appears first, regardless of status
    return [...orders].sort((a, b) => {
      return new Date(a.created_at) - new Date(b.created_at);
    });

  }, [orders]);

  /* ================= UPDATE STATUS ================= */

  const updateStatus = async (id, status) => {

    try {

      setUpdatingId(id);

      await API.put(`/api/orders/admin/${id}/status`, { status });

      setOrders((prev) =>
        prev.map((o) =>
          o._id === id ? { ...o, status } : o
        )
      );

    } catch {

      toast.success(`(Preview) Order updated to ${status}`);
      setOrders((prev) =>
        prev.map((o) =>
          o._id === id ? { ...o, status } : o
        )
      );

    } finally {

      setUpdatingId(null);

    }

  };

  if (loading) {
    return (
      <p className="text-center mt-10 text-gray-500">
        Loading orders...
      </p>
    );
  }

  return (

    <div className="p-6 max-w-6xl mx-auto">

      <div className="flex justify-between mb-6">

        <h1 className="text-2xl font-bold">
          Admin Dashboard – Orders
        </h1>

        <button
          onClick={fetchOrders}
          className="px-4 py-2 bg-black text-white rounded"
        >
          Refresh
        </button>

      </div>

      {sortedOrders.map((order) => {

        const mongoId = order._id;
        const status = order.status?.toLowerCase();

        return (

          <div
            key={mongoId}
            className="bg-white shadow p-5 mb-5 rounded"
          >

            <div className="flex justify-between">

              <h2 className="font-semibold">
                {order.order_code || `E-${order.order_id}`}
              </h2>

              <span
                className={`px-3 py-1 rounded text-sm ${statusBadge(status)}`}
              >
                {status}
              </span>

            </div>

            <p className="text-sm mt-1">
              {order.order_type === "walk-in"
                ? "Counter Order"
                : `Ordered by ${order.user_name}`}
            </p>

            <p className="text-sm text-gray-500">
              {formatIST(order.created_at)}
            </p>

            <ul className="mt-2 list-disc ml-5">

              {order.items?.map((i, idx) => (
                <li key={idx}>
                  {i.name} × {i.quantity}
                </li>
              ))}

            </ul>

            <div className="flex gap-2 mt-3 flex-wrap">

              {status === "confirmed" || status === "preparing" ? (
                <button
                  disabled={updatingId === mongoId}
                  onClick={() => updateStatus(mongoId, "ready_for_pickup")}
                  className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded font-semibold"
                >
                  Mark Ready For Pickup
                </button>
              ) : status === "ready_for_pickup" ? (
                <button
                  disabled={updatingId === mongoId}
                  onClick={() => updateStatus(mongoId, "picked_up")}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded font-semibold"
                >
                  Mark Picked Up
                </button>
              ) : (
                <span className="text-gray-500 text-sm">Order completed</span>
              )}

            </div>

          </div>

        );

      })}

    </div>

  );

};

export default AdminOrdersPage;