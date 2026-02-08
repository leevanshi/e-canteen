import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import Confetti from "react-confetti";
import { toast } from "sonner";

import API from "../api"; // ✅ correct axios instance
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { CheckCircle } from "lucide-react";

const OrderSuccessPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const [showConfetti, setShowConfetti] = useState(true);
  const [order, setOrder] = useState(null);
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [submitted, setSubmitted] = useState(false);

  /* ================= FETCH ORDER ================= */
  useEffect(() => {
    if (!id) {
      navigate("/menu", { replace: true });
      return;
    }

    const fetchOrder = async () => {
      try {
        const res = await API.get(`/orders/${id}`);
        setOrder(res?.data ?? null);
      } catch {
        navigate("/orders");
      }
    };

    fetchOrder();

    const timer = setTimeout(() => setShowConfetti(false), 3000);
    return () => clearTimeout(timer);
  }, [id, navigate]);

  /* ================= SUBMIT FEEDBACK ================= */
  const submitFeedback = async () => {
    if (!rating) {
      toast.error("Please select a rating");
      return;
    }

    try {
      setSubmitted(true);

      await API.post("/feedback", {
        order_id: id,
        rating,
        feedback: feedback || "",
      });

      toast.success("Thank you for your feedback ❤️");
      navigate(`/orders/${id}`);
    } catch {
      toast.error("Failed to submit feedback");
      setSubmitted(false);
    }
  };

  if (!order) return null;

  const displayId =
    order?.order_number ||
    order?.order_id ||
    (order?._id ? String(order._id).slice(-6) : null) ||
    id ||
    "—";

  return (
    <div className="min-h-screen flex items-center justify-center bg-green-50 p-4 relative overflow-hidden">
      {showConfetti && <Confetti recycle={false} />}

      {/* BACK */}
      <Button
        variant="outline"
        onClick={() => navigate(-1)}
        className="absolute top-4 left-4 z-20"
      >
        ← Back
      </Button>

      <Card className="max-w-md w-full rounded-2xl shadow-lg z-10">
        <CardContent className="p-6 space-y-4 text-center">
          <CheckCircle className="mx-auto text-green-600" size={48} />

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
                ? new Date(order.created_at).toLocaleString("en-IN", {
                    timeZone: "Asia/Kolkata",
                  })
                : "—"}
            </p>

            <p className="text-green-600 font-medium capitalize">
              Status: {order?.status || "preparing"} 🍳
            </p>
          </div>

          {/* RATING */}
          <div className="mt-3">
            <p className="font-medium mb-1">
              Rate your experience
            </p>
            <div className="flex justify-center gap-2 text-3xl">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  disabled={submitted}
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
            disabled={submitted}
            onChange={(e) => setFeedback(e.target.value)}
          />

          {/* ACTIONS */}
          <div className="flex gap-3 justify-center mt-4">
            <Button
              onClick={submitFeedback}
              disabled={submitted}
              className="bg-orange-500 hover:bg-orange-600"
            >
              Submit Feedback
            </Button>

            <Button
              variant="outline"
              onClick={() => navigate(`/orders/${id}`)}
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
