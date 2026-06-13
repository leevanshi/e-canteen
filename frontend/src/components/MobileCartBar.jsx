import { useNavigate, useLocation } from "react-router-dom";
import { ShoppingCart } from "lucide-react";
import { useCart } from "../context/CartContext";

const MobileCartBar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { cartCount, totalPrice } = useCart();

  // Only show on mobile when cart has items AND user is on cart page
  if (cartCount === 0) return null;

  // Hide on all pages except /cart
  if (location.pathname !== "/cart") return null;

  return (
    <div 
      className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 px-4 py-3 z-50 md:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 16px)' }}
    >
      <div className="flex items-center justify-between max-w-lg mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-orange-500/20 text-orange-500 rounded-full flex items-center justify-center">
            <ShoppingCart className="w-5 h-5" />
          </div>
          <div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {cartCount} {cartCount === 1 ? 'item' : 'items'}
            </div>
            <div className="font-bold text-gray-900 dark:text-white">
              ₹{totalPrice.toFixed(2)}
            </div>
          </div>
        </div>
        <button
          onClick={() => navigate("/cart")}
          className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2.5 rounded-full font-semibold transition-colors"
        >
          Checkout
        </button>
      </div>
    </div>
  );
};

export default MobileCartBar;
