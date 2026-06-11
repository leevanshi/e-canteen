import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { FileText, Download, Calendar, ArrowLeft, TrendingUp, ShoppingBag, DollarSign } from "lucide-react";

import { useAuth } from "../context/AuthContext";
import { getReport } from "../api";
import { formatApiError } from "../utils/formatApiError";
import { Button } from "../components/ui/button";

const AdminReports = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const role = (user?.role || "").toLowerCase();

  const [report, setReport] = useState(null);
  const [reportType, setReportType] = useState("daily");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) navigate("/login", { replace: true });
    else if (role !== "admin") navigate("/menu", { replace: true });
  }, [authLoading, user, role, navigate]);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const res = await getReport(reportType);
      setReport(res?.data || null);
    } catch (err) {
      console.error(err);
      toast.error(formatApiError(err?.response?.data?.detail, "Failed to load report"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && role === "admin") {
      fetchReport();
    }
  }, [authLoading, role, reportType]);

  const downloadCSV = () => {
    if (!report) return;
    
    const headers = ["Order ID", "Type", "Status", "Amount", "Date"];
    const rows = report.orders.map(o => [
      o.order_id,
      o.order_type,
      o.status,
      o.total_amount,
      new Date(o.created_at).toLocaleDateString()
    ]);
    
    const csvContent = [headers, ...rows].map(row => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${reportType}_report_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV downloaded");
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50 pb-20">
      <div className="bg-white border-b sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-6 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => navigate(-1)}>
              <ArrowLeft size={18} className="mr-2" /> Back
            </Button>
            <div>
              <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Reports</h1>
              <p className="text-sm text-gray-500 mt-1">Generate and export business reports</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Report Type Selector */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-4">
            <Calendar size={20} className="text-indigo-600" />
            <h2 className="text-lg font-bold text-gray-900">Report Period</h2>
          </div>
          <div className="flex gap-3 mt-4">
            {["daily", "weekly", "monthly"].map((type) => (
              <button
                key={type}
                onClick={() => setReportType(type)}
                className={`px-6 py-3 rounded-xl font-semibold transition capitalize ${
                  reportType === type
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </motion.div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
              className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full" />
          </div>
        ) : report ? (
          <>
            {/* Summary Cards */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center">
                    <ShoppingBag size={20} />
                  </div>
                  <h3 className="font-semibold text-gray-900">Total Orders</h3>
                </div>
                <p className="text-3xl font-bold text-gray-900">{report.summary.total_orders}</p>
                <p className="text-sm text-gray-500 mt-1">
                  {report.summary.online_orders} online + {report.summary.walkin_orders} walk-in
                </p>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center">
                    <DollarSign size={20} />
                  </div>
                  <h3 className="font-semibold text-gray-900">Total Revenue</h3>
                </div>
                <p className="text-3xl font-bold text-gray-900">₹{report.summary.total_revenue}</p>
                <p className="text-sm text-gray-500 mt-1">
                  ₹{report.summary.online_revenue} online + ₹{report.summary.walkin_revenue} walk-in
                </p>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center">
                    <TrendingUp size={20} />
                  </div>
                  <h3 className="font-semibold text-gray-900">Period</h3>
                </div>
                <p className="text-lg font-bold text-gray-900 capitalize">{report.report_type}</p>
                <p className="text-sm text-gray-500 mt-1">
                  {new Date(report.start_date).toLocaleDateString()} - {new Date(report.end_date).toLocaleDateString()}
                </p>
              </div>
            </motion.div>

            {/* Top Products */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-gray-900">Top Products</h2>
                <Button onClick={downloadCSV} variant="outline" size="sm">
                  <Download size={16} className="mr-2" /> Export CSV
                </Button>
              </div>
              {report.top_products.length > 0 ? (
                <div className="space-y-3">
                  {report.top_products.map((product, idx) => (
                    <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                      <div className="flex items-center gap-4">
                        <div className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-bold">
                          {idx + 1}
                        </div>
                        <p className="font-semibold text-gray-900">{product.name}</p>
                      </div>
                      <p className="font-bold text-gray-900">{product.quantity} sold</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No product data available</p>
              )}
            </motion.div>

            {/* Orders Table */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-gray-900">Order Details</h2>
                <Button onClick={downloadCSV} variant="outline" size="sm">
                  <Download size={16} className="mr-2" /> Export CSV
                </Button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-semibold text-gray-900">Order ID</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900">Type</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900">Status</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900">Amount</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.orders.map((order, idx) => (
                      <tr key={idx} className="border-b border-gray-100">
                        <td className="py-3 px-4 font-medium text-gray-900">{order.order_id}</td>
                        <td className="py-3 px-4 text-gray-600 capitalize">{order.order_type}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            order.status === "completed" ? "bg-green-100 text-green-700" :
                            order.status === "pending" ? "bg-orange-100 text-orange-700" :
                            order.status === "preparing" ? "bg-blue-100 text-blue-700" :
                            order.status === "ready" ? "bg-purple-100 text-purple-700" :
                            "bg-gray-100 text-gray-700"
                          }`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-medium text-gray-900">₹{order.total_amount}</td>
                        <td className="py-3 px-4 text-gray-600">{new Date(order.created_at).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          </>
        ) : (
          <div className="text-center py-20 text-gray-500">No report data available</div>
        )}
      </div>
    </div>
  );
};

export default AdminReports;
