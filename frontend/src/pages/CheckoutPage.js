import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";

import { getMyWallet, createOrder } from "../api";

/* ⏰ TIME SLOTS (FIXED) */
const generateTimeSlots = () => {
  const slots = [];
  const now = new Date();

  const start = new Date();
  start.setHours(9, 0, 0, 0);

  const end = new Date();
  end.setHours(18, 0, 0, 0);

  while (start < end) {
    const next = new Date(start.getTime() + 15 * 60000);

    // ✅ only future slots
    if (start > now) {
      slots.push(
        `${start.toTimeString().slice(0, 5)}-${next
          .toTimeString()
          .slice(0, 5)}`
      );
    }

    start.setTime(next.getTime());
  }

  return slots;
};

const CheckoutPage = () => {
  const navigate = useNavigate();
  const { cart = [], clearCart } = useCart();
  const { token, logout } = useAuth();

  const [pickupTimeSlot, setPickupTimeSlot] = useState("");
  const [loading, setLoading] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderId, setOrderId] = useState("");

  const timeSlots = useMemo(generateTimeSlots, []);

  const totalAmount = useMemo(() => {
    return cart.reduce(
      (sum, item) =>
        sum + (item?.price || 0) * (item?.quantity || 1),
      0
    );
  }, [cart]);

  /* EMPTY CART GUARD */
  useEffect(() => {
    if (cart.length === 0 && !orderPlaced) {
      navigate("/menu");
    }
  }, [cart, orderPlaced, navigate]);

  /* FETCH WALLET */
  const fetchWallet = async () => {
    if (!token) return;

    try {
      const res = await getMyWallet();
      setWalletBalance(res?.data?.balance ?? 0);
    } catch (err) {
      console.error("Wallet fetch failed", err);
      setWalletBalance(0);
    }
  };

  useEffect(() => {
    fetchWallet();
  }, [token]);

  /* VALIDATE TIME SLOT */
  const isValidSlot = (slot) => {
    if (!slot) return false;

    const [startTime] = slot.split("-");
    const now = new Date();

    const [h, m] = startTime.split(":");
    const slotDate = new Date();
    slotDate.setHours(h, m, 0, 0);

    return slotDate > now;
  };

  /* PLACE ORDER */
  const handlePlaceOrder = async () => {
    if (loading) return;

    if (!token) {
      toast.error("Session expired. Please login again.");
      logout();
      return;
    }

    if (!pickupTimeSlot || !isValidSlot(pickupTimeSlot)) {
      toast.error("Please select a valid future time slot");
      return;
    }

    if (walletBalance < totalAmount) {
      toast.error("Insufficient wallet balance");
      return;
    }

    // ✅ clean items (IMPORTANT)
    const cleanItems = cart
      .filter((item) => item?._id && item?.quantity > 0)
      .map((item) => ({
        item_id: item._id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
      }));

    if (cleanItems.length === 0) {
      toast.error("Invalid cart items");
      return;
    }

    try {
      setLoading(true);

      const res = await createOrder({
        items: cleanItems,
        pickup_time: pickupTimeSlot,
        payment_method: "wallet",
      });

      const id =
        res?.data?.order_number ||
        res?.data?.order_id ||
        res?.data?._id ||
        "—";

      setOrderId(id);
      setOrderPlaced(true);
      clearCart();

      await fetchWallet();

      toast.success("Order placed successfully 🎉");
    } catch (err) {
      console.error("Order error", err);

      const msg =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        "Order failed";

      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  /* SUCCESS UI */
  if (orderPlaced) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-6">
        <Card className="max-w-md w-full text-center shadow-lg rounded-2xl">
          <CardContent className="p-6 space-y-4">
            <h1 className="text-3xl font-bold text-green-600">
              ✅ Order Placed!
            </h1>

            <p className="text-gray-600">
              Your order has been sent to the canteen.
            </p>

            <p className="text-sm">
              <b>Order ID:</b> {orderId}
            </p>

            <p className="text-sm">
              <b>Payment:</b> Wallet (Paid)
            </p>

            <Button
              className="w-full bg-orange-500 hover:bg-orange-600"
              onClick={() => navigate("/orders")}
            >
              View My Orders
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  /* CHECKOUT UI */
  return (
    <div className="max-w-4xl mx-auto p-6">

      <Button
        variant="outline"
        onClick={() => navigate("/menu")}
        className="mb-4"
      >
        ← Back
      </Button>

      <h1 className="text-3xl font-bold mb-6">Checkout</h1>

      {cart.map((item, index) => (
        <Card key={item?._id || index} className="mb-3">
          <CardContent className="flex items-center gap-4 p-4">
            <img
              src={item?.image || "/placeholder.png"}
              alt={item?.name || "item"}
              className="w-20 h-20 object-cover rounded"
            />

            <div className="flex-1">
              <h3 className="font-semibold">{item?.name || "Item"}</h3>
              <p className="text-sm text-gray-500">
                Qty: {item?.quantity ?? 1}
              </p>
            </div>

            <div className="font-medium">
              ₹{(item?.price || 0) * (item?.quantity || 1)}
            </div>
          </CardContent>
        </Card>
      ))}

      <select
        className="border p-2 w-full mt-4 rounded"
        value={pickupTimeSlot}
        onChange={(e) => setPickupTimeSlot(e.target.value)}
      >
        <option value="">Select pickup time</option>
        {timeSlots.map((slot) => (
          <option key={slot} value={slot}>
            {slot}
          </option>
        ))}
      </select>

      <div className="mt-6 p-4 border rounded bg-gray-50 space-y-2">
        <h3 className="font-semibold">Payment Method</h3>
        <p className="text-green-700 font-medium">
          ✅ Wallet (Balance: ₹{walletBalance})
        </p>
      </div>

      <div className="mt-4 font-semibold text-lg">
        Total: ₹{totalAmount}
      </div>

      <Button
        onClick={handlePlaceOrder}
        disabled={loading}
        className="mt-6 w-full bg-orange-500"
      >
        {loading ? "Placing Order..." : "Place Order"}
      </Button>
    </div>
  );
};

export default CheckoutPage;