import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import API from "../api"; // ✅ central axios instance
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";

const MonthlyMenu = () => {
  const navigate = useNavigate();

  const [menu, setMenu] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // 🔗 backend base URL (for PDF / uploads)
  const BASE_URL = API.defaults.baseURL;

  useEffect(() => {
    const fetchMonthlyMenu = async () => {
      try {
        const res = await API.get("/monthly-menu");

        const pdfUrl = res.data?.pdf_url
          ? res.data.pdf_url.startsWith("http")
            ? res.data.pdf_url
            : `${BASE_URL}${res.data.pdf_url}`
          : null;

        setMenu({
          ...res.data,
          pdf_url: pdfUrl,
        });
      } catch (err) {
        console.error(err);
        setError("Monthly menu not available");
      } finally {
        setLoading(false);
      }
    };

    fetchMonthlyMenu();
  }, [BASE_URL]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        Loading monthly menu...
      </div>
    );
  }

  if (error || !menu?.pdf_url) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-gray-500">
        <p>Monthly menu not uploaded yet</p>
        <Button variant="outline" onClick={() => navigate(-1)}>
          ← Back
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* BACK BUTTON */}
      <Button
        variant="outline"
        onClick={() => navigate(-1)}
        className="mb-4"
      >
        ← Back
      </Button>

      <h1 className="text-2xl font-semibold mb-6 text-center">
        Monthly Menu {menu.month ? `– ${menu.month}` : ""}
      </h1>

      <Card className="shadow-sm">
        <CardContent className="p-4 space-y-4">
          {/* PDF PREVIEW */}
          <iframe
            src={`${menu.pdf_url}#toolbar=0`}
            title="Monthly Menu PDF"
            className="w-full h-[600px] border rounded"
          />

          {/* DOWNLOAD */}
          <div className="text-center">
            <a
              href={menu.pdf_url}
              target="_blank"
              rel="noopener noreferrer"
              download
              className="inline-block bg-orange-500 text-white px-6 py-2 rounded hover:bg-orange-600 transition"
            >
              Download Monthly Menu (PDF)
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MonthlyMenu;
