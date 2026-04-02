import { useEffect, useMemo, useState, useRef } from "react";
import API from "../api";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

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

const STATUS_PRIORITY = {
  pending: 1,
  preparing: 2,
  completed: 3,
};

/* ================= RECEIPT ================= */

const formatReceipt = (order) => {

  const items = Array.isArray(order.items) ? order.items : [];

  return `
NMIMS E-CANTEEN
SVKMS NMIMS UNIVERSITY
Chandigarh Campus
--------------------------------

Order No : ${order.order_id || order._id}
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
NMIMS ECanteen
--------------------------------
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

    const ws = new WebSocket(
      "wss://e-canteen-7.onrender.com/ws/orders"
    );

    ws.onmessage = (event) => {

      const data = JSON.parse(event.data);

      if (data.type === "new_order") {

        const order = data.order;

        if (!printedOrders.current.has(order._id)) {

          printedOrders.current.add(order._id);

          setOrders((prev) => [order, ...prev]);

          playSound();

          if (order.order_type === "walk-in") {
            autoPrint(formatReceipt(order));
          }

        }
      }
    };

    return () => ws.close();

  }, []);

  /* ================= SORT ================= */

  const sortedOrders = useMemo(() => {

    return [...orders].sort((a, b) => {

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

    try {

      setUpdatingId(id);

      await API.put(`/api/orders/admin/${id}/status`, { status });

      setOrders((prev) =>
        prev.map((o) =>
          o._id === id ? { ...o, status } : o
        )
      );

    } catch {

      toast.error("Failed to update order");

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
                Order #{order.order_id}
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

            <div className="flex gap-2 mt-3">

              {["pending","preparing","completed"].map((s) => (

                <button
                  key={s}
                  disabled={updatingId === mongoId}
                  onClick={() => updateStatus(mongoId, s)}
                  className="border px-3 py-1 rounded"
                >
                  {s}
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