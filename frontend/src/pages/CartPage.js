import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { useCart } from "../context/CartContext";

const CartPage = () => {
  const navigate = useNavigate();
  const { cart, increaseQty, decreaseQty } = useCart();

  const safeCart = cart || [];

  const totalAmount = safeCart.reduce((sum, item) => {
    const price = item?.price || 0;
    const quantity = item?.quantity || 1;
    return sum + price * quantity;
  }, 0);

  if (safeCart.length === 0) {
    return (
      <div className="min-h-screen p-4 sm:p-6 md:p-10 text-center">
        <Button
          variant="outline"
          onClick={() => navigate("/menu")}
          className="mb-4 min-h-[44px]"
        >
          ← Back
        </Button>

        <h2 className="text-xl sm:text-2xl font-semibold mb-4 text-gray-900 dark:text-white">
          Your cart is empty
        </h2>

        <Button 
          onClick={() => navigate("/menu")}
          className="min-h-[44px]"
        >
          Go to Menu
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 sm:p-6 max-w-5xl mx-auto">
      <Button
        variant="outline"
        onClick={() => navigate("/menu")}
        className="mb-4 min-h-[44px]"
      >
        ← Back
      </Button>

      <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-6 text-gray-900 dark:text-white">Your Cart</h1>

      <div className="space-y-3 sm:space-y-4">
        {safeCart.map((item, index) => {
          const id = item?._id || item?.id || index;
          const price = item?.price || 0;
          const quantity = item?.quantity || 1;

          return (
            <Card key={id}>
              <CardContent className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 p-3 sm:p-4">

                <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto">
                  <img
                    src={item?.image || "/placeholder.png"}
                    alt={item?.name || "item"}
                    className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 object-cover rounded-lg border"
                  />

                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm sm:text-base md:text-lg text-gray-900 dark:text-white truncate">
                      {item?.name || "Item"}
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                      ₹{price}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between w-full sm:w-auto sm:justify-start gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => decreaseQty(id)}
                    disabled={quantity <= 1}
                    className="min-w-[36px] min-h-[36px] sm:min-w-[40px] sm:min-h-[40px]"
                  >
                    −
                  </Button>

                  <span className="font-semibold w-6 sm:w-8 text-center text-gray-900 dark:text-white text-sm sm:text-base">
                    {quantity}
                  </span>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => increaseQty(id)}
                    className="min-w-[36px] min-h-[36px] sm:min-w-[40px] sm:min-h-[40px]"
                  >
                    +
                  </Button>
                </div>

                <div className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base">
                  ₹{price * quantity}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-6 sm:mt-8 p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 sticky bottom-4 z-10">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
          Total: ₹{totalAmount}
        </h2>

        <Button
          onClick={() => navigate("/checkout")}
          className="w-full sm:w-auto px-6 bg-orange-500 hover:bg-orange-600 min-h-[44px]"
        >
          Proceed to Checkout
        </Button>
      </div>
    </div>
  );
};

export default CartPage;