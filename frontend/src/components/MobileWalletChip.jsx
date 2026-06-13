import { memo } from "react";
import { Wallet } from "lucide-react";

const MobileWalletChip = memo(({ balance, loading = false, onHighlight }) => {
  return (
    <div
      className="flex items-center gap-2 px-3 py-1.5 rounded-full border-2 border-orange-500 bg-white dark:bg-zinc-900 shadow-sm transition-all duration-200"
      aria-label="Wallet Balance"
      onClick={onHighlight}
    >
      <Wallet className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400 flex-shrink-0" />
      <span className="font-semibold text-sm text-orange-600 dark:text-orange-400 whitespace-nowrap">
        {loading ? '...' : `₹${balance}`}
      </span>
    </div>
  );
});

MobileWalletChip.displayName = 'MobileWalletChip';

export default MobileWalletChip;
