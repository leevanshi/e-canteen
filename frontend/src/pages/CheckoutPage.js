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
  const [loadingWallet, setLoadingWallet] = useState(true);
  const [highlightWallet, setHighlightWallet] = useState(false);

  const timeSlots = useMemo(generateTimeSlots, []);

  /* SAFE TOTAL (UI ONLY) */
  const totalAmount = useMemo(() => {
    return cart.reduce(
      (sum, item) =>
        sum + (item?.price || 0) * (item?.quantity || 1),
      0
    );
  }, [cart]);

  /* EMPTY CART GUARD */
  useEffect(() => {
    if (!orderPlaced && cart.length === 0) {
      navigate("/menu");
    }
  }, [cart, orderPlaced, navigate]);

  /* FETCH WALLET */
  const fetchWallet = async () => {
    if (!token) {
      setLoadingWallet(false);
      return;
    }

    try {
      setLoadingWallet(true);
      const res = await getMyWallet();
      setWalletBalance(res?.data?.balance ?? 0);
    } catch (err) {
      console.error("Wallet fetch failed", err);
      setWalletBalance(0);
    } finally {
      setLoadingWallet(false);
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

    if (loadingWallet) {
      toast.error("Loading wallet balance. Please wait...");
      return;
    }

    if (!pickupTimeSlot || !isValidSlot(pickupTimeSlot)) {
      toast.error("Please select a valid future time slot");
      return;
    }

    if (cart.length === 0) {
      toast.error("Cart is empty");
      return;
    }

    // Insufficient balance validation with destructive toast
    if (walletBalance < totalAmount) {
      toast.error("Insufficient Wallet Balance", {
        description: "Your wallet balance is lower than the order amount. Please add funds to continue.",
      });

      // Highlight wallet balance chip briefly
      setHighlightWallet(true);
      setTimeout(() => setHighlightWallet(false), 2000);

      return;
    }

    /* SEND ONLY SAFE DATA */
    const cleanItems = cart
      .filter((item) => item?._id && item?.quantity > 0)
      .map((item) => ({
        item_id: item._id,
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

      console.log("Order response:", res);

      const id =
        res?.order_id ||
        res?.order_code ||
        res?.data?.order_id ||
        res?.data?.order_code ||
        "—";

      console.log("Extracted order ID:", id);

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
    // Redirect to order confirmation page with order code
    navigate(`/order-confirmation/${orderId}`);
    return null;
  }

  /* CHECKOUT UI */
  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6">

      <Button
        variant="outline"
        onClick={() => navigate("/menu")}
        className="mb-4"
      >
        ← Back
      </Button>

      <h1 className="text-2xl sm:text-3xl font-bold mb-6">Checkout</h1>

      {cart.map((item, index) => (

        <Card key={item?._id || index} className="mb-3">

          <CardContent className="flex items-center gap-3 sm:gap-4 p-4">

            <img
              src={item?.image || "/placeholder.png"}
              alt={item?.name || "item"}
              className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded"
            />

            <div className="flex-1">

              <h3 className="font-semibold text-sm sm:text-base">
                {item?.name || "Item"}
              </h3>

              <p className="text-sm text-gray-500">
                Qty: {item?.quantity ?? 1}
              </p>

            </div>

            <div className="font-medium text-sm sm:text-base">
              ₹{(item?.price || 0) * (item?.quantity || 1)}
            </div>

          </CardContent>

        </Card>

      ))}

      <select
        className="border p-2 sm:p-3 w-full mt-4 rounded text-sm sm:text-base"
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

      <div className="mt-6 p-4 border rounded bg-gray-50 dark:bg-gray-800 space-y-2">

        <h3 className="font-semibold text-sm sm:text-base text-gray-900 dark:text-white">
          Payment Method
        </h3>

        <p
          className={`font-medium text-sm sm:text-base transition-all duration-200 ${
            highlightWallet
              ? "text-orange-600 dark:text-orange-400 animate-pulse"
              : "text-green-700 dark:text-green-400"
          }`}
        >
          ✅ Wallet (Balance: ₹{walletBalance})
        </p>

      </div>

      <div className="mt-4 font-semibold text-lg sm:text-xl text-gray-900 dark:text-white">
        Total: ₹{totalAmount}
      </div>

      <Button
        onClick={handlePlaceOrder}
        disabled={loading || loadingWallet}
        className="mt-6 w-full bg-orange-500 hover:bg-orange-600 py-3 sm:py-4 text-sm sm:text-base"
      >
        {loading ? "Placing Order..." : loadingWallet ? "Loading Wallet..." : "Place Order"}
      </Button>

    </div>
  );
};

export default CheckoutPage;