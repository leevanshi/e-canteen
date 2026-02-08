import { useState } from "react";
import { toast } from "sonner";

import API from "../api"; // ✅ correct import
import { Button } from "../components/ui/button";

const AdminMonthlyMenu = () => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const uploadMenu = async () => {
    if (!file) {
      toast.error("Please select a PDF file");
      return;
    }

    const formData = new FormData();
    formData.append("menu", file);

    try {
      setUploading(true);

      await API.post(
        "/admin/monthly-menu/upload",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      toast.success("Monthly menu uploaded successfully");
      setFile(null);
    } catch (err) {
      console.error(err);
      toast.error("Upload failed");
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
        onChange={(e) => setFile(e.target.files[0])}
        className="mb-4"
      />

      <Button onClick={uploadMenu} disabled={uploading}>
        {uploading ? "Uploading..." : "Upload PDF"}
      </Button>
    </div>
  );
};

export default AdminMonthlyMenu;
