import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { useAuth } from "../context/AuthContext";
import { getAdminOrders } from "../api";

import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";

const AdminFeedbackPage = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);

  /* 🔐 ADMIN PROTECTION */
  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      navigate("/login", { replace: true });
      return;
    }

    if (user.role !== "admin") {
      navigate("/", { replace: true });
    }
  }, [user, authLoading, navigate]);

  /* ⭐ FETCH FEEDBACKS */
  const fetchFeedbacks = async () => {
    try {
      setLoading(true);
      const res = await getAdminOrders();

      const feedbackData = (res?.data || [])
        .filter(
          (order) =>
            order.feedback_rating &&
            order.status?.toLowerCase() === "completed"
        )
        .map((order) => ({
          orderId: order.order_id || order._id,
          rating: order.feedback_rating,
          comment: order.feedback_comment,
          userName: order.user_name,
          createdAt: order.created_at,
        }));

      setFeedbacks(feedbackData);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load feedbacks");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === "admin") {
      fetchFeedbacks();
    }
  }, [user]);

  if (authLoading || !user || user.role !== "admin") return null;

  if (loading) {
    return (
      <div className="p-10 text-center text-gray-500">
        Loading feedbacks...
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <h1 className="text-2xl font-bold">⭐ Feedback Details</h1>

        <Button
          variant="outline"
          onClick={() => navigate("/admin/dashboard")}
        >
          Back to Dashboard
        </Button>
      </div>

      {feedbacks.length === 0 ? (
        <Card className="p-8 text-center text-gray-500">
          No feedback received yet
        </Card>
      ) : (
        <div className="space-y-4">
          {feedbacks.map((fb, idx) => (
            <Card key={idx} className="p-5 rounded-xl">
              <p className="text-sm text-gray-500">
                Order ID: #{fb.orderId}
              </p>

              <p className="mt-2 font-semibold">
                ⭐ {fb.rating}/5
              </p>

              <p className="text-gray-700 mt-2">
                {fb.comment || "No comment"}
              </p>

              <div className="flex justify-between text-xs text-gray-400 mt-3">
                <span>By: {fb.userName || "Student"}</span>

                <span>
                  {fb.createdAt
                    ? new Date(fb.createdAt).toLocaleString("en-IN", {
                        timeZone: "Asia/Kolkata",
                        dateStyle: "medium",
                        timeStyle: "short",
                      })
                    : ""}
                </span>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminFeedbackPage;
