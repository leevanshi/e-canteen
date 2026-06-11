import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Package, AlertTriangle, ArrowLeft, Plus, Trash2, Edit } from "lucide-react";

import { useAuth } from "../context/AuthContext";
import { getInventory, getInventoryAlerts, getMenu, createInventoryItem, updateInventoryItem, deleteInventoryItem } from "../api";
import { formatApiError } from "../utils/formatApiError";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";

const AdminInventory = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const role = (user?.role || "").toLowerCase();

  const [inventory, setInventory] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [menu, setMenu] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({ menu_item_id: "", stock: 0, low_stock_threshold: 10 });

  useEffect(() => {
    if (authLoading) return;
    if (!user) navigate("/login", { replace: true });
    else if (role !== "admin") navigate("/menu", { replace: true });
  }, [authLoading, user, role, navigate]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [invRes, alertRes, menuRes] = await Promise.all([
        getInventory(),
        getInventoryAlerts(),
        getMenu(),
      ]);
      setInventory(invRes?.data || []);
      setAlerts(alertRes?.data || []);
      setMenu(menuRes?.data || []);
    } catch (err) {
      console.error(err);
      toast.error(formatApiError(err?.response?.data?.detail, "Failed to load inventory"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && role === "admin") {
      fetchData();
    }
  }, [authLoading, role]);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await createInventoryItem(formData);
      toast.success("Inventory item created");
      setShowAddModal(false);
      setFormData({ menu_item_id: "", stock: 0, low_stock_threshold: 10 });
      fetchData();
    } catch (err) {
      toast.error(formatApiError(err?.response?.data?.detail, "Failed to create inventory item"));
    }
  };

  const handleUpdate = async (itemId, data) => {
    try {
      await updateInventoryItem(itemId, data);
      toast.success("Inventory item updated");
      setEditingItem(null);
      fetchData();
    } catch (err) {
      toast.error(formatApiError(err?.response?.data?.detail, "Failed to update inventory item"));
    }
  };

  const handleDelete = async (itemId) => {
    if (!confirm("Are you sure you want to delete this inventory item?")) return;
    try {
      await deleteInventoryItem(itemId);
      toast.success("Inventory item deleted");
      fetchData();
    } catch (err) {
      toast.error(formatApiError(err?.response?.data?.detail, "Failed to delete inventory item"));
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  const getStatusColor = (status) => {
    switch (status) {
      case "in_stock": return "bg-green-100 text-green-700";
      case "low_stock": return "bg-yellow-100 text-yellow-700";
      case "out_of_stock": return "bg-red-100 text-red-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50 pb-20">
      <div className="bg-white border-b sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-6 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => navigate(-1)}>
              <ArrowLeft size={18} className="mr-2" /> Back
            </Button>
            <div>
              <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Inventory Management</h1>
              <p className="text-sm text-gray-500 mt-1">Track stock levels and alerts</p>
            </div>
          </div>
          <Button onClick={() => setShowAddModal(true)} className="bg-indigo-600 hover:bg-indigo-700">
            <Plus size={18} className="mr-2" /> Add Item
          </Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Alerts */}
        {alerts.length > 0 && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="bg-red-50 border border-red-200 rounded-2xl p-6">
            <h2 className="text-lg font-bold text-red-900 mb-4 flex items-center gap-2">
              <AlertTriangle size={20} className="text-red-600" />
              Inventory Alerts ({alerts.length})
            </h2>
            <div className="space-y-2">
              {alerts.map((alert, idx) => (
                <div key={idx} className="flex items-center justify-between bg-white p-3 rounded-lg">
                  <div>
                    <p className="font-semibold text-gray-900">{alert.menu_item_name}</p>
                    <p className="text-sm text-gray-600">
                      {alert.type === "out_of_stock" ? "Out of stock" : `Low stock: ${alert.stock} remaining`}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${alert.type === "out_of_stock" ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"}`}>
                    {alert.type === "out_of_stock" ? "OUT OF STOCK" : "LOW STOCK"}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Inventory List */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Package size={20} className="text-indigo-600" />
            Inventory Items
          </h2>
          {inventory.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No inventory items found. Add items to track stock.</p>
          ) : (
            <div className="space-y-4">
              {inventory.map((item) => (
                <div key={item._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">{item.menu_item_name}</p>
                    <p className="text-sm text-gray-600">Stock: {item.stock} | Threshold: {item.low_stock_threshold}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(item.status)}`}>
                      {item.status.replace("_", " ").toUpperCase()}
                    </span>
                    <Button variant="outline" size="sm" onClick={() => setEditingItem(item)}>
                      <Edit size={16} />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDelete(item._id)}>
                      <Trash2 size={16} className="text-red-600" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <h2 className="text-xl font-bold mb-4">Add Inventory Item</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Menu Item</label>
                <select
                  value={formData.menu_item_id}
                  onChange={(e) => setFormData({ ...formData, menu_item_id: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-400 outline-none"
                  required
                >
                  <option value="">Select item</option>
                  {menu.map((item) => (
                    <option key={item._id} value={item._id}>{item.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Stock</label>
                <input
                  type="number"
                  value={formData.stock}
                  onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-400 outline-none"
                  min="0"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Low Stock Threshold</label>
                <input
                  type="number"
                  value={formData.low_stock_threshold}
                  onChange={(e) => setFormData({ ...formData, low_stock_threshold: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-400 outline-none"
                  min="0"
                  required
                />
              </div>
              <div className="flex gap-3">
                <Button type="submit" className="flex-1 bg-indigo-600 hover:bg-indigo-700">Add</Button>
                <Button type="button" variant="outline" onClick={() => setShowAddModal(false)} className="flex-1">Cancel</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <h2 className="text-xl font-bold mb-4">Edit Inventory Item</h2>
            <form onSubmit={(e) => { e.preventDefault(); handleUpdate(editingItem._id, { stock: editingItem.stock, low_stock_threshold: editingItem.low_stock_threshold }); }} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Stock</label>
                <input
                  type="number"
                  value={editingItem.stock}
                  onChange={(e) => setEditingItem({ ...editingItem, stock: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-400 outline-none"
                  min="0"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Low Stock Threshold</label>
                <input
                  type="number"
                  value={editingItem.low_stock_threshold}
                  onChange={(e) => setEditingItem({ ...editingItem, low_stock_threshold: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-400 outline-none"
                  min="0"
                  required
                />
              </div>
              <div className="flex gap-3">
                <Button type="submit" className="flex-1 bg-indigo-600 hover:bg-indigo-700">Update</Button>
                <Button type="button" variant="outline" onClick={() => setEditingItem(null)} className="flex-1">Cancel</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminInventory;
