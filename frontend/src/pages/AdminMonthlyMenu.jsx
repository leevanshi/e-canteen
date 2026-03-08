import { useState } from "react";
import { toast } from "sonner";
import API from "../api";
import { Button } from "../components/ui/button";

const AdminMonthlyMenu = () => {

  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const uploadMenu = async () => {

    if (!file) {
      toast.error("Please select a PDF file");
      return;
    }

    if (file.type !== "application/pdf") {
      toast.error("Only PDF files allowed");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File must be under 5MB");
      return;
    }

    const formData = new FormData();
    formData.append("menu", file);

    try {

      setUploading(true);

      const res = await API.post(
        "/admin/monthly-menu/upload",
        formData
      );

      toast.success("Monthly menu uploaded successfully");

      setFile(null);

    } catch (err) {

      console.error("UPLOAD ERROR:", err?.response?.data);

      const message =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        "Upload failed";

      toast.error(message);

    } finally {

      setUploading(false);

    }

  };

  return (

    <div className="max-w-xl mx-auto py-10 px-4">

      <h1 className="text-2xl font-bold mb-6">
        Upload Monthly Menu (PDF)
      </h1>

      <input
        type="file"
        accept="application/pdf"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
        className="mb-4"
      />

      <Button
        onClick={uploadMenu}
        disabled={uploading}
      >
        {uploading ? "Uploading..." : "Upload PDF"}
      </Button>

    </div>

  );

};

export default AdminMonthlyMenu;