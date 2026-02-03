import { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "sonner";

import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { useAuth } from "../context/AuthContext";

const API = "http://127.0.0.1:8000/api/";

const Wallet = () => {
  const { token } = useAuth();

  const [balance, setBalance] = useState(0);
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);

  /* 🔁 FETCH WALLET BALANCE */
  useEffect(() => {
    const fetchWallet = async () => {
      try {
        const res = await axios.get(`${API}wallet`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setBalance(res.data.balance || 0);
      } catch (err) {
        console.error("Wallet fetch error:", err);
      }
    };

    fetchWallet();
  }, [token]);

  /* ➕ ADD MONEY */
  const handleAddMoney = async () => {
    if (!amount || amount <= 0) {
      toast.error("Enter valid amount");
      return;
    }

    try {
      setLoading(true);

      const res = await axios.post(
        `${API}wallet/add`,
        { amount: Number(amount) },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setBalance(res.data.balance);
      setAmount("");
      toast.success("Money added successfully 💸");
    } catch (err) {
      console.error("Add money error:", err);
      toast.error("Failed to add money");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">My Wallet</h1>

      {/* 💰 BALANCE */}
      <Card className="mb-6 rounded-2xl shadow">
        <CardContent className="p-6 text-center">
          <p className="text-gray-500">Current Balance</p>
          <h2 className="text-4xl font-bold text-green-600 mt-2">
            ₹{balance}
          </h2>
        </CardContent>
      </Card>

      {/* ➕ ADD MONEY */}
      <Card className="rounded-2xl shadow">
        <CardContent className="p-6 space-y-4">
          <h3 className="text-lg font-semibold">Add Money</h3>

          <input
            type="number"
            placeholder="Enter amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="border p-2 rounded w-full"
          />

          <Button
            onClick={handleAddMoney}
            disabled={loading}
            className="w-full bg-orange-500"
          >
            {loading ? "Adding..." : "Add Money"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Wallet;
