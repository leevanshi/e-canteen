import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { FileText, Upload, Download, Trash2, Eye, RefreshCw, ArrowLeft } from "lucide-react";
import { getMonthlyMenu, uploadMonthlyMenu, deleteMonthlyMenu } from "../api";
import { formatApiError } from "../utils/formatApiError";
import { useAuth } from "../context/AuthContext";
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

const AdminMonthlyMenu = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const [menu, setMenu] = useState(null);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate("/login", { replace: true });
      return;
    }
    if (user.role !== "admin") {
      navigate("/menu", { replace: true });
      return;
    }
    fetchMenu();
  }, [authLoading, user, navigate]);

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

  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type !== "application/pdf") {
        toast.error("Only PDF files are allowed");
        return;
      }
      if (selectedFile.size > 10 * 1024 * 1024) {
        toast.error("File size must be under 10 MB");
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error("Please select a PDF file");
      return;
    }

    try {
      setUploading(true);
      await uploadMonthlyMenu(file);
      toast.success("Menu uploaded successfully");
      setFile(null);
      fetchMenu();
    } catch (err) {
      const msg = formatApiError(err?.response?.data?.detail, "Failed to upload menu");
      toast.error(msg);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete the current menu?")) {
      return;
    }

    try {
      setDeleting(true);
      await deleteMonthlyMenu();
      toast.success("Menu deleted successfully");
      setMenu(null);
    } catch (err) {
      const msg = formatApiError(err?.response?.data?.detail, "Failed to delete menu");
      toast.error(msg);
    } finally {
      setDeleting(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
            className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full mx-auto mb-4"
          />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

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
                onClick={() => navigate("/admin")}
                className="flex items-center gap-2"
              >
                Back to Dashboard
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 sm:p-6 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <p className="font-semibold">{error}</p>
              <Button variant="outline" onClick={fetchMenu} className="w-full sm:w-auto">
                Retry
              </Button>
            </div>
          </div>
        )}

        {/* UPLOAD SECTION */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 sm:p-8 mb-6"
        >
          <h2 className="text-lg font-bold text-gray-900 mb-4">Upload New Menu</h2>
          <div className="space-y-4">
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-cyan-400 transition-colors">
              <input
                type="file"
                accept="application/pdf"
                onChange={handleFileChange}
                className="hidden"
                id="file-input"
              />
              <label
                htmlFor="file-input"
                className="cursor-pointer flex flex-col items-center gap-3"
              >
                <Upload size={48} className="text-gray-400" />
                <div>
                  <p className="font-semibold text-gray-900">Choose PDF File</p>
                  <p className="text-sm text-gray-500 mt-1">Max file size: 10 MB</p>
                </div>
              </label>
              {file && (
                <div className="mt-4 p-3 bg-cyan-50 rounded-lg">
                  <p className="text-sm font-medium text-cyan-900">{file.name}</p>
                  <p className="text-xs text-cyan-600">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
              )}
            </div>
            <Button
              onClick={handleUpload}
              disabled={!file || uploading}
              className="w-full sm:w-auto"
            >
              {uploading ? "Uploading..." : "Upload PDF"}
            </Button>
          </div>
        </motion.div>

        {/* CURRENT MENU SECTION */}
        {menu ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 sm:p-8"
          >
            <h2 className="text-lg font-bold text-gray-900 mb-4">Current Menu</h2>
            <div className="space-y-4">
              <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl">
                <div className="w-12 h-12 bg-cyan-100 text-cyan-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <FileText size={24} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 truncate">{menu.file_name}</p>
                  <p className="text-sm text-gray-500 mt-1">Uploaded: {formatIST(menu.uploaded_at)}</p>
                  <p className="text-sm text-gray-500">By: {menu.uploaded_by}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button
                  onClick={() => window.open(`${process.env.REACT_APP_API_URL || 'https://e-canteen-7.onrender.com'}${menu.file_url}`, '_blank')}
                  className="flex items-center gap-2"
                >
                  <Eye size={16} />
                  Preview
                </Button>
                <Button
                  onClick={() => {
                    const link = document.createElement('a');
                    link.href = `${process.env.REACT_APP_API_URL || 'https://e-canteen-7.onrender.com'}${menu.file_url}`;
                    link.download = menu.file_name;
                    link.click();
                  }}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Download size={16} />
                  Download
                </Button>
                <Button
                  onClick={() => setFile(null)}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Upload size={16} />
                  Replace
                </Button>
                <Button
                  onClick={handleDelete}
                  disabled={deleting}
                  variant="outline"
                  className="flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 size={16} />
                  Delete
                </Button>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 sm:p-12 text-center"
          >
            <FileText size={64} className="mx-auto mb-4 text-gray-300" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">No Menu Uploaded</h3>
            <p className="text-gray-500">Upload a monthly menu PDF to get started.</p>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default AdminMonthlyMenu;