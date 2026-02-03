import { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";


import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { useAuth } from "../context/AuthContext";

const API = "http://127.0.0.1:8000/api";

const AdminWalletPage = () => {
  const { token } = useAuth();
const navigate = useNavigate();

  const [search, setSearch] = useState(""); // ✅ search state
  const [users, setUsers] = useState([]);
  const [amounts, setAmounts] = useState({});
  const [loading, setLoading] = useState(true);

  /* 🔹 FETCH USERS WITH WALLET */
  const fetchUsers = async () => {
    if (!token) return;

    try {
      setLoading(true);
      const res = await axios.get(`${API}/admin/users`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setUsers(res.data || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [token]);

  /* 💸 ADD MONEY */
  const addMoney = async (userId) => {
    const amount = parseFloat(amounts[userId]);

    if (!amount || amount <= 0) {
      toast.error("Enter valid amount");
      return;
    }

    try {
      await axios.post(
        `${API}/wallet/admin/add-money`,
        {
          user_id: userId,
          amount,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      toast.success("Money credited 💸");

      // ✅ UPDATE UI STATE
      setUsers((prev) =>
        prev.map((u) =>
          u._id === userId
            ? {
                ...u,
                wallet_balance: (u.wallet_balance || 0) + amount,
              }
            : u
        )
      );

      setAmounts((prev) => ({
        ...prev,
        [userId]: "",
      }));
    } catch (err) {
      console.error(err);
      toast.error("Failed to add money");
    }
  };

  return (

     <div className="max-w-6xl mx-auto p-6 space-y-6">

  <div className="flex items-center gap-3">
    <Button variant="outline" onClick={() => navigate(-1)}>
      ← Back
    </Button>
    <h1 className="text-3xl font-bold">Wallet Management</h1>
  </div>


      {/* 🔍 SEARCH BAR */}
      <input
        type="text"
        placeholder="Search by name..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full sm:w-1/3 px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
      />

      {loading ? (
        <p className="text-gray-500">Loading users...</p>
      ) : users.length === 0 ? (
        <p className="text-gray-500">No users found</p>
      ) : (
        users
          // ✅ FILTER BY NAME (case-insensitive)
          .filter((u) =>
            u.name?.toLowerCase().includes(search.toLowerCase())
          )
          .map((u) => (
            <Card key={u._id}>
              <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <p className="font-semibold">{u.name}</p>
                  <p className="text-sm text-gray-500">{u.email}</p>

                  <p className="text-green-600 font-bold">
                    Balance: ₹{u.wallet_balance ?? 0}
                  </p>

                  {u.wallet_first_time && (
                    <p className="text-xs text-orange-600">
                      ⚠ First-time wallet user
                    </p>
                  )}
                </div>

                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="Amount"
                    className="border p-2 rounded w-32"
                    value={amounts[u._id] || ""}
                    onChange={(e) =>
                      setAmounts((prev) => ({
                        ...prev,
                        [u._id]: e.target.value,
                      }))
                    }
                  />

                  <Button
                    className="bg-green-600 hover:bg-green-700"
                    onClick={() => addMoney(u._id)}
                  >
                    Add
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
      )}
    </div>
  );
};

export default AdminWalletPage;
