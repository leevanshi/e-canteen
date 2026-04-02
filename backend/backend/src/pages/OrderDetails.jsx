import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { CheckCircle, Clock } from "lucide-react";

import API from "../api";
import { Button } from "../components/ui/button";

const OrderDetails = () => {

  const { orderId } = useParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  const pollingRef = useRef(null);
  const fetchingRef = useRef(false);

  /* ================= FETCH ORDER ================= */

  const fetchOrder = async () => {

    if (!orderId || fetchingRef.current) return;

    try {

      fetchingRef.current = true;

      const res = await API.get(`/orders/${orderId}`);

      const data = res?.data || null;

      setOrder(data);

      /* stop polling when order finished */
      const status = String(data?.status || "").toLowerCase();

      if (status === "completed" && pollingRef.current) {
        clearInterval(pollingRef.current);
      }

    } catch (err) {

      console.error("Failed to fetch order", err);

    } finally {

      fetchingRef.current = false;
      setLoading(false);

    }

  };

  /* ================= REMAINING TIME ================= */

  const getRemainingTime = () => {

    if (!order?.created_at) return "";

    const created = new Date(order.created_at).getTime();
    const now = Date.now();

    const diff = 15 * 60 * 1000 - (now - created);

    if (diff <= 0) return "Almost Ready";

    return `${Math.ceil(diff / 60000)} min remaining`;

  };

  /* ================= EFFECT ================= */

  useEffect(() => {

    fetchOrder();

    pollingRef.current = setInterval(fetchOrder, 5000);

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };

  }, [orderId]);

  /* ================= LOADING ================= */

  if (loading) {
    return (
      <p className="text-center mt-10 text-gray-500">
        Loading...
      </p>
    );
  }

  /* ================= NOT FOUND ================= */

  if (!order) {
    return (
      <p className="text-center text-red-500 mt-10">
        Order not found
      </p>
    );
  }

  const status = String(order.status || "pending").toLowerCase();

  const steps = ["confirmed", "preparing", "ready", "completed"];

  const currentStep =
    steps.indexOf(status) === -1 ? 0 : steps.indexOf(status);

  const displayId =
    order.order_number ||
    order.order_id ||
    (order?._id ? String(order._id).slice(-4) : "—");

  return (

    <div className="relative max-w-3xl mx-auto mt-10">

      {/* BACK BUTTON */}

      <Button
        variant="outline"
        onClick={() => navigate(-1)}
        className="absolute -top-2 left-0"
      >
        ← Back
      </Button>

      <div className="bg-white p-6 rounded-xl shadow mt-8">

        <h2 className="text-2xl font-bold mb-4">
          Order #{displayId}
        </h2>

        {/* STATUS */}

        <div className="flex items-center gap-2 bg-green-50 p-3 rounded mb-4">

          <CheckCircle className="text-green-600" />

          <span className="font-semibold capitalize">
            {status}
          </span>

        </div>

        {/* DATES */}

        <p>
          <b>Placed:</b>{" "}
          {order.created_at
            ? new Date(order.created_at).toLocaleString(
                "en-IN",
                { timeZone: "Asia/Kolkata" }
              )
            : "-"}
        </p>

        <p>
          <b>Pickup:</b> {order.pickup_time || "-"}
        </p>

        {/* TIMER */}

        {status === "preparing" && (
          <div className="mt-4 bg-orange-50 p-3 rounded text-center">
            ⏳ {getRemainingTime()}
          </div>
        )}

        {/* TIMELINE */}

        <div className="flex mt-6">

          {steps.map((s, i) => (

            <div key={s} className="flex-1 text-center">

              <div
                className={`w-10 h-10 mx-auto rounded-full flex items-center justify-center
                ${
                  i <= currentStep
                    ? "bg-green-500 text-white"
                    : "bg-gray-300 text-gray-600"
                }`}
              >

                {i <= currentStep
                  ? "✔"
                  : <Clock size={16} />}

              </div>

              <p className="text-sm mt-1 capitalize">
                {s}
              </p>

            </div>

          ))}

        </div>

        {/* ITEMS */}

        <div className="mt-6 space-y-1">

          {order.items?.map((i, idx) => (

            <div
              key={idx}
              className="flex justify-between text-sm"
            >

              <span>
                {i.name} × {i.quantity}
              </span>

              <span>
                ₹{(i.price || 0) * (i.quantity || 1)}
              </span>

            </div>

          ))}

          <div className="border-t mt-2 pt-2 flex justify-between font-semibold">

            <span>Total</span>

            <span>
              ₹{order.total_amount || 0}
            </span>

          </div>

        </div>

        {/* READY MESSAGE */}

        {status === "ready" && (

          <div className="mt-6 bg-green-100 p-4 text-center rounded font-bold animate-pulse">
            🎉 Ready for pickup!
          </div>

        )}

      </div>

    </div>
  );

};

export default OrderDetails;