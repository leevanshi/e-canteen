import { useNavigate } from "react-router-dom";

import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { useCart } from "../context/CartContext";

const CartPage = () => {
  const navigate = useNavigate();
  const { cart = [], increaseQty, decreaseQty } = useCart();

  /* ✅ SAFE TOTAL */
  const totalAmount = cart.reduce(
    (sum, item) =>
      sum + (item?.price || 0) * (item?.quantity || 1),
    0
  );

  /* ✅ EMPTY CART */
  if (!cart.length) {
    return (
      <div className="p-10 text-center">
        <Button
          variant="outline"
          onClick={() => navigate("/menu")}
          className="mb-4"
        >
          ← Back
        </Button>

        <h2 className="text-2xl font-semibold mb-4">
          Your cart is empty
        </h2>

        <Button onClick={() => navigate("/menu")}>
          Go to Menu
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">

      {/* BACK BUTTON */}
      <Button
        variant="outline"
        onClick={() => navigate("/menu")}
        className="mb-4"
      >
        ← Back
      </Button>

      <h1 className="text-3xl font-bold mb-6">Your Cart</h1>

      <div className="space-y-4">
        {cart.map((item, index) => {
          const itemId = item?._id || item?.id || index;

          const price = item?.price || 0;
          const quantity = item?.quantity || 1;

          return (
            <Card key={itemId}>
              <CardContent className="flex items-center justify-between gap-4 p-4">

                {/* IMAGE + NAME */}
                <div className="flex items-center gap-4">
                  <img
                    src={item?.image || "/placeholder.png"}
                    alt={item?.name || "item"}
                    className="w-20 h-20 object-cover rounded-lg border"
                  />

                  <div>
                    <h3 className="font-semibold text-lg">
                      {item?.name || "Item"}
                    </h3>
                    <p className="text-sm text-gray-500">
                      ₹{price}
                    </p>
                  </div>
                </div>

                {/* QUANTITY CONTROLS */}
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => decreaseQty(itemId)}
                    disabled={quantity <= 1} // ✅ prevent negative qty
                  >
                    −
                  </Button>

                  <span className="font-semibold">
                    {quantity}
                  </span>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => increaseQty(itemId)}
                  >
                    +
                  </Button>
                </div>

                {/* ITEM TOTAL */}
                <div className="font-semibold">
                  ₹{price * quantity}
                </div>

              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* CART TOTAL */}
      <div className="flex justify-between items-center mt-8">
        <h2 className="text-2xl font-bold">
          Total: ₹{totalAmount}
        </h2>

        <Button
          onClick={() => navigate("/checkout")}
          className="px-6 bg-orange-500 hover:bg-orange-600"
        >
          Proceed to Checkout
        </Button>
      </div>
    </div>
  );
};

export default CartPage;