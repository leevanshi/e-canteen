import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import Confetti from "react-confetti";
import { toast } from "sonner";

import API from "../api";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { CheckCircle } from "lucide-react";

const OrderSuccessPage = () => {

  const navigate = useNavigate();
  const { orderId } = useParams();

  const [showConfetti, setShowConfetti] = useState(true);
  const [order, setOrder] = useState(null);

  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const mountedRef = useRef(true);

  /* ================= FETCH ORDER ================= */

  useEffect(() => {

    if (!orderId) {
      navigate("/menu", { replace: true });
      return;
    }

    const fetchOrder = async () => {

      try {

        const res = await API.get("/api/orders");

        const orders = Array.isArray(res?.data)
          ? res.data
          : [];

        const found = orders.find(
          (o) =>
            String(o._id) === String(orderId) ||
            String(o.order_id) === String(orderId)
        );

        if (mountedRef.current) {
          setOrder(found || null);
        }

      } catch (err) {

        console.error("Order fetch failed", err);

        if (mountedRef.current) {
          navigate("/orders");
        }

      }

    };

    fetchOrder();

    const timer = setTimeout(
      () => setShowConfetti(false),
      3000
    );

    return () => {
      mountedRef.current = false;
      clearTimeout(timer);
    };

  }, [orderId, navigate]);

  /* ================= SUBMIT FEEDBACK ================= */

  const submitFeedback = async () => {

    if (submitting) return;

    if (!rating) {
      toast.error("Please select a rating");
      return;
    }

    try {

      setSubmitting(true);

      await API.post("/feedback", {
        order_id: orderId,
        rating,
        feedback: feedback || ""
      });

      toast.success("Thank you for your feedback ❤️");

      navigate(`/orders/${orderId}`);

    } catch (err) {

      console.error("Feedback failed", err);

      toast.error("Failed to submit feedback");

      setSubmitting(false);

    }

  };

  /* ================= LOADING ================= */

  if (!order) {

    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        Loading order...
      </div>
    );

  }

  const displayId =
    order?.order_id ||
    (order?._id
      ? String(order._id).slice(-6)
      : orderId);

  return (

    <div className="min-h-screen flex items-center justify-center bg-green-50 p-4 relative overflow-hidden">

      {showConfetti && (
        <Confetti
          recycle={false}
          numberOfPieces={200}
          width={window.innerWidth}
          height={window.innerHeight}
        />
      )}

      {/* BACK */}

      <Button
        variant="outline"
        onClick={() => navigate("/orders")}
        className="absolute top-4 left-4 z-20"
      >
        ← Orders
      </Button>

      <Card className="max-w-md w-full rounded-2xl shadow-lg z-10">

        <CardContent className="p-6 space-y-4 text-center">

          <CheckCircle
            className="mx-auto text-green-600"
            size={48}
          />

          <h1 className="text-2xl font-bold text-green-600">
            Order Confirmed!
          </h1>

          <p className="text-gray-600">
            Your order has been placed successfully.
          </p>

          {/* ORDER INFO */}

          <div className="text-sm text-gray-500 space-y-1">

            <p>
              <strong>Order ID:</strong> {displayId}
            </p>

            <p>
              <strong>Placed At:</strong>{" "}
              {order?.created_at
                ? new Date(order.created_at)
                    .toLocaleString("en-IN", {
                      timeZone: "Asia/Kolkata"
                    })
                : "—"}
            </p>

            <p className="text-green-600 font-medium capitalize">
              Status: {order?.status || "pending"} 🍳
            </p>

          </div>

          {/* RATING */}

          <div className="mt-3">

            <p className="font-medium mb-1">
              Rate your experience
            </p>

            <div className="flex justify-center gap-2 text-3xl">

              {[1,2,3,4,5].map((star) => (

                <button
                  key={star}
                  disabled={submitting}
                  onClick={() => setRating(star)}
                  className={
                    star <= rating
                      ? "text-yellow-400"
                      : "text-gray-300"
                  }
                >
                  ★
                </button>

              ))}

            </div>

          </div>

          {/* FEEDBACK */}

          <textarea
            placeholder="Any feedback? (optional)"
            className="w-full border rounded p-2 text-sm"
            value={feedback}
            disabled={submitting}
            onChange={(e) => setFeedback(e.target.value)}
          />

          {/* ACTIONS */}

          <div className="flex gap-3 justify-center mt-4">

            <Button
              onClick={submitFeedback}
              disabled={submitting}
              className="bg-orange-500 hover:bg-orange-600"
            >
              Submit Feedback
            </Button>

            <Button
              variant="outline"
              onClick={() => navigate(`/orders/${orderId}`)}
            >
              View Order
            </Button>

          </div>

        </CardContent>

      </Card>

    </div>

  );

};

export default OrderSuccessPage;