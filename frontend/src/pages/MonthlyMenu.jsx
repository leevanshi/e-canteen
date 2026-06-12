import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { FileText, Download, ArrowLeft, RefreshCw } from "lucide-react";
import { getMonthlyMenu } from "../api";
import { formatApiError } from "../utils/formatApiError";
import { Button } from "../components/ui/button";

const formatIST = (date) => {
  if (!date) return "—";
  try {
    return new Date(date).toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return "—";
  }
};

const MonthlyMenu = () => {
  const navigate = useNavigate();

  const [menu, setMenu] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const BASE_URL = process.env.REACT_APP_API_URL || 'https://e-canteen-7.onrender.com';

  const fetchMenu = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getMonthlyMenu();
      setMenu(res?.data || null);
    } catch (err) {
      const msg = formatApiError(err?.response?.data?.detail, "Failed to load menu");
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMenu();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
            className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full mx-auto mb-4"
          />
          <p className="text-gray-600">Loading monthly menu...</p>
        </div>
      </div>
    );
  }

  if (error || !menu) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-gray-50 text-gray-500">
        <FileText size={64} className="text-gray-300" />
        <p className="text-lg font-medium">No monthly menu uploaded yet</p>
        <Button variant="outline" onClick={() => navigate("/menu")} className="flex items-center gap-2">
          <ArrowLeft size={16} />
          Back to Menu
        </Button>
      </div>
    );
  }

  const pdfUrl = menu.file_url?.startsWith("http")
    ? menu.file_url
    : `${BASE_URL}${menu.file_url}`;

  return (
    <div className="min-h-screen bg-gray-50/50 pb-20">
      {/* HEADER */}
      <div className="bg-white border-b sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">Monthly Menu</h1>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={fetchMenu}
                className="flex items-center gap-2"
              >
                <RefreshCw size={16} />
                Refresh
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate("/menu")}
                className="flex items-center gap-2"
              >
                <ArrowLeft size={16} />
                Back to Menu
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 sm:p-8"
        >
          {/* MENU INFO */}
          <div className="flex items-start gap-4 mb-6 p-4 bg-gray-50 rounded-xl">
            <div className="w-12 h-12 bg-cyan-100 text-cyan-600 rounded-xl flex items-center justify-center flex-shrink-0">
              <FileText size={24} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900 truncate">{menu.file_name}</p>
              <p className="text-sm text-gray-500 mt-1">Uploaded: {formatIST(menu.uploaded_at)}</p>
              <p className="text-sm text-gray-500">By: {menu.uploaded_by}</p>
            </div>
          </div>

          {/* PDF VIEWER */}
          <div className="mb-6">
            <iframe
              src={`${pdfUrl}#toolbar=0`}
              title="Monthly Menu PDF"
              className="w-full h-[600px] border rounded-xl"
            />
          </div>

          {/* DOWNLOAD BUTTON */}
          <div className="flex justify-center">
            <Button
              onClick={() => {
                const link = document.createElement('a');
                link.href = pdfUrl;
                link.download = menu.file_name;
                link.click();
              }}
              className="flex items-center gap-2"
            >
              <Download size={16} />
              Download PDF
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default MonthlyMenu;
