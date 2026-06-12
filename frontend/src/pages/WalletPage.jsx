import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Wallet, RefreshCw } from "lucide-react";

import API from "../api";
import { Button } from "../components/ui/button";

const WalletPage = () => {

  const navigate = useNavigate();

  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [amount, setAmount] = useState("");
  const [userId, setUserId] = useState("");

  const [adding, setAdding] = useState(false);

  /* ================= FETCH WALLET ================= */

  const fetchWallet = async () => {

    try {

      setError("");

      const res = await API.get("/wallet/me");

      setBalance(res?.data?.balance || 0);

    } catch (err) {

      console.error("Wallet fetch failed", err);
      setError("Failed to load wallet");

    }

  };

  /* ================= FETCH TRANSACTIONS ================= */

  const fetchTransactions = async () => {

    try {

      const res = await API.get("/wallet/transactions");

      setTransactions(
        Array.isArray(res?.data) ? res.data : []
      );

    } catch (err) {

      console.error("Txn fetch failed", err);

    }

  };

  /* ================= INITIAL LOAD ================= */

  const loadData = async () => {

    setLoading(true);

    await Promise.all([
      fetchWallet(),
      fetchTransactions()
    ]);

    setLoading(false);

  };

  useEffect(() => {
    loadData();
  }, []);

  /* ================= ADD MONEY ================= */

  const addMoney = async () => {

    if (!userId || !amount) return;

    const amt = Number(amount);

    if (amt <= 0) return;

    try {

      setAdding(true);

      await API.post("/wallet/admin/add-money", {
        user_id: userId,
        amount: amt
      });

      setAmount("");
      setUserId("");

      await loadData();

    } catch (err) {

      console.error("Add money failed", err);

    } finally {

      setAdding(false);

    }

  };

  /* ================= LOADING ================= */

  if (loading) {

    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500 dark:text-gray-400">
        Loading wallet...
      </div>
    );

  }

  /* ================= UI ================= */

  return (

    <div className="max-w-4xl mx-auto p-6">

      <h1 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
        Wallet
      </h1>

      {/* BACK */}

      <Button
        variant="outline"
        onClick={() => navigate(-1)}
        className="mb-4"
      >
        ← Back
      </Button>

      {/* BALANCE */}

      <div className="bg-white dark:bg-gray-800 shadow rounded-xl p-6 flex items-center justify-between mb-6 border border-gray-200 dark:border-gray-700">

        <div className="flex items-center gap-3">

          <Wallet size={28} className="text-orange-500 dark:text-orange-400" />

          <div>

            <p className="text-gray-500 dark:text-gray-400 text-sm">
              Current Balance
            </p>

            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              ₹{balance}
            </p>

          </div>

        </div>

        <Button
          variant="outline"
          onClick={loadData}
        >
          <RefreshCw size={16} />
        </Button>

      </div>

      {/* ADMIN ADD MONEY */}

      <div className="bg-white dark:bg-gray-800 shadow rounded-xl p-6 mb-6 border border-gray-200 dark:border-gray-700">

        <h2 className="font-semibold mb-4 text-gray-900 dark:text-white">
          Admin Add Money
        </h2>

        <div className="flex gap-3">

          <input
            type="text"
            placeholder="User ID"
            value={userId}
            onChange={(e) =>
              setUserId(e.target.value)
            }
            className="border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-2 rounded flex-1"
          />

          <input
            type="number"
            placeholder="Amount"
            value={amount}
            onChange={(e) =>
              setAmount(e.target.value)
            }
            className="border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-2 rounded w-32"
          />

          <Button
            disabled={adding}
            onClick={addMoney}
            className="bg-orange-500 hover:bg-orange-600"
          >
            Add
          </Button>

        </div>

      </div>

      {/* TRANSACTIONS */}

      <div className="bg-white dark:bg-gray-800 shadow rounded-xl p-6 border border-gray-200 dark:border-gray-700">

        <h2 className="font-semibold mb-4 text-gray-900 dark:text-white">
          Transaction History
        </h2>

        {transactions.length === 0 ? (

          <p className="text-gray-500 dark:text-gray-400">
            No transactions yet.
          </p>

        ) : (

          <div className="space-y-3">

            {transactions.map((t) => (

              <div
                key={t._id}
                className="flex justify-between border-b border-gray-200 dark:border-gray-700 pb-2 text-sm"
              >

                <span className="capitalize text-gray-900 dark:text-white">
                  {t.type}
                </span>

                <span
                  className={
                    t.type === "credit"
                      ? "text-green-600 dark:text-green-400"
                      : "text-red-600 dark:text-red-400"
                  }
                >
                  {t.type === "credit"
                    ? `+₹${t.amount}`
                    : `-₹${t.amount}`}
                </span>

              </div>

            ))}

          </div>

        )}

      </div>

      {error && (
        <p className="text-red-500 mt-4">
          {error}
        </p>
      )}

    </div>

  );

};

export default WalletPage;