import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Flame, Droplet, Wheat, Dumbbell, Activity, ChevronRight, X, Info, Plus, Minus, Heart, Star, Leaf } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from "recharts";

import API from "../api";
import { useCart } from "../context/CartContext";

const fallbackImage = "https://images.unsplash.com/photo-1604908554165-3a7c22e0b9c6?q=80&w=600";

/* ================= ANIMATIONS ================= */
const staggerContainer = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const cardVariant = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  show: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

const modalVariant = {
  hidden: { opacity: 0, scale: 0.9, y: 20 },
  show: { opacity: 1, scale: 1, y: 0, transition: { type: "spring", stiffness: 400, damping: 30 } },
  exit: { opacity: 0, scale: 0.9, y: 20, transition: { duration: 0.2 } }
};

/* ================= HELPERS ================= */
const getScoreColor = (score) => {
  if (score >= 90) return "text-emerald-500 bg-emerald-500/10 border-emerald-500/20";
  if (score >= 70) return "text-blue-500 bg-blue-500/10 border-blue-500/20";
  if (score >= 50) return "text-amber-500 bg-amber-500/10 border-amber-500/20";
  return "text-red-500 bg-red-500/10 border-red-500/20";
};

const getScoreLabel = (score) => {
  if (score >= 90) return "Superfood";
  if (score >= 70) return "Healthy Choice";
  if (score >= 50) return "Moderate";
  return "Indulgence";
};

/* ================= COMPONENTS ================= */
const CircularProgress = ({ value, max, label, icon: Icon, color }) => {
  const radius = 20;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (value / max) * circumference;

  return (
    <div className="flex flex-col items-center justify-center gap-1">
      <div className="relative w-14 h-14 flex items-center justify-center">
        <svg className="transform -rotate-90 w-14 h-14">
          <circle cx="28" cy="28" r={radius} stroke="currentColor" strokeWidth="4" fill="transparent" className="text-gray-100" />
          <circle cx="28" cy="28" r={radius} stroke={color} strokeWidth="4" fill="transparent"
            strokeDasharray={circumference} strokeDashoffset={strokeDashoffset}
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-gray-700">
          {Math.round(value)}g
        </div>
      </div>
      <div className="flex items-center gap-1 text-[10px] uppercase font-bold text-gray-500 tracking-wider">
        <Icon size={10} /> {label}
      </div>
    </div>
  );
};

/* ================= MAIN PAGE ================= */
const MenuPage = () => {
  const navigate = useNavigate();
  const { cart, addToCart, decreaseQty } = useCart();
  
  const [menu, setMenu] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [sortBy, setSortBy] = useState("recommended");
  const [selectedItem, setSelectedItem] = useState(null);

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const res = await API.get("/menu");
        const normalized = (Array.isArray(res.data) ? res.data : []).map(item => ({
          ...item,
          _id: item._id || item.id,
          nutrition: item.nutrition || {},
        }));

        // #region agent log
        const sample = normalized.find((i) => (i.name || "").includes("Amritsari")) || normalized[0];
        fetch('http://127.0.0.1:7559/ingest/ac98a93e-e671-495f-a3ce-59b4abacbf8f',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'3e7df7'},body:JSON.stringify({sessionId:'3e7df7',location:'MenuPage.js:fetchMenu',message:'menu_api_nutrition',data:{count:normalized.length,sampleName:sample?.name,sampleNutrition:sample?.nutrition,calories:sample?.nutrition?.calories,protein:sample?.nutrition?.protein,sortBy},timestamp:Date.now(),hypothesisId:'H4'})}).catch(()=>{});
        // #endregion
        
        if (normalized.length === 0) throw new Error("Empty menu");
        setMenu(normalized);
      } catch {
        toast.info("Database offline — Showing preview data");
        // Fallback dummy data for UI preview
        setMenu([

  {
    "_id": "695e685e8beb6fe496ab39de",
    "name": "Tea",
    "price": 20.0,
    "category": "beverages",
    "image": "https://images.unsplash.com/photo-1571934811356-5cc061b6821f?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8dGVhfGVufDB8fDB8fHww",
    "nutrition": {
      "calories": 506,
      "protein": 10,
      "carbs": 26,
      "fats": 18,
      "fiber": 8,
      "sugar": 15,
      "sodium": 318,
      "health_score": 59
    }
  },
  {
    "_id": "695e693a8beb6fe496ab39e0",
    "name": "Coffee",
    "price": 25.0,
    "category": "beverages",
    "image": "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8Y29mZmVlfGVufDB8fDB8fHww",
    "nutrition": {
      "calories": 568,
      "protein": 4,
      "carbs": 44,
      "fats": 12,
      "fiber": 4,
      "sugar": 11,
      "sodium": 226,
      "health_score": 54
    }
  },
  {
    "_id": "695e697d8beb6fe496ab39e1",
    "name": "Black Coffee",
    "price": 30.0,
    "category": "beverages",
    "image": "https://images.unsplash.com/photo-1521302080334-4bebac2763a6?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8YmxhY2slMjBjb2ZmZWV8ZW58MHx8MHx8fDA%3D",
    "nutrition": {
      "calories": 600,
      "protein": 4,
      "carbs": 57,
      "fats": 18,
      "fiber": 2,
      "sugar": 2,
      "sodium": 442,
      "health_score": 50
    }
  },
  {
    "_id": "695e69b98beb6fe496ab39e2",
    "name": "Veg Wrap",
    "price": 50.0,
    "category": "snacks",
    "image": "https://images.unsplash.com/photo-1563282397-db1ac3a6bf86?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTV8fGZvb2QlMjB2ZWclMjB3cmFwfGVufDB8fDB8fHww",
    "nutrition": {
      "calories": 549,
      "protein": 4,
      "carbs": 32,
      "fats": 24,
      "fiber": 1,
      "sugar": 10,
      "sodium": 119,
      "health_score": 55
    }
  },
  {
    "_id": "695e69fd8beb6fe496ab39e3",
    "name": "Paneer Wrap",
    "price": 75.0,
    "category": "snacks",
    "image": "https://media.istockphoto.com/id/1223923862/photo/cheese-paneer-kathi-roll-or-wrap-vegetarians-indian-food.webp?a=1&b=1&s=612x612&w=0&k=20&c=YfVphCY5IoaliI10tPaaC-ZPDiSVNqGnFkjQvDolIbs=",
    "nutrition": {
      "calories": 223,
      "protein": 17,
      "carbs": 26,
      "fats": 24,
      "fiber": 4,
      "sugar": 15,
      "sodium": 210,
      "health_score": 79
    }
  },
  {
    "_id": "695e6a358beb6fe496ab39e4",
    "name": "Egg Wrap",
    "price": 100.0,
    "category": "snacks",
    "image": "https://media.istockphoto.com/id/174695403/photo/burrito.webp?a=1&b=1&s=612x612&w=0&k=20&c=TY45ONacj1-Wjz7heWJ4TNVmLbty-qcndrYFEi2n05Y=",
    "nutrition": {
      "calories": 275,
      "protein": 21,
      "carbs": 30,
      "fats": 27,
      "fiber": 10,
      "sugar": 5,
      "sodium": 752,
      "health_score": 55
    }
  },
  {
    "_id": "695e6a6a8beb6fe496ab39e5",
    "name": "Plain Maggi",
    "price": 35.0,
    "category": "quick adds",
    "image": "https://media.istockphoto.com/id/2249122658/photo/cooked-instant-noodles-in-a-white-plate-with-spoons.webp?a=1&b=1&s=612x612&w=0&k=20&c=uB0cw2-H9gPnwMkZHmreKShZXWKiRco8nh8ukTQTDYM=",
    "nutrition": {
      "calories": 178,
      "protein": 19,
      "carbs": 28,
      "fats": 22,
      "fiber": 2,
      "sugar": 9,
      "sodium": 512,
      "health_score": 71
    }
  },
  {
    "_id": "695e6a918beb6fe496ab39e6",
    "name": "Masala Maggi",
    "price": 45.0,
    "category": "quick adds",
    "image": "https://media.istockphoto.com/id/831817536/photo/maggie-masala-noodles.webp?a=1&b=1&s=612x612&w=0&k=20&c=C24sDwJZi2UYsj5vb1xR23o0KQDjTHLZNP94hFo6erY=",
    "nutrition": {
      "calories": 200,
      "protein": 2,
      "carbs": 24,
      "fats": 20,
      "fiber": 6,
      "sugar": 17,
      "sodium": 191,
      "health_score": 43
    }
  },
  {
    "_id": "695e6b6b8beb6fe496ab39e9",
    "name": "Cheese Maggi",
    "price": 55.0,
    "category": "quick adds",
    "image": "https://media.istockphoto.com/id/1443175406/photo/masala-maggi-noodles-instant-maggi-noodles-served-in-a-bowl-closeup-with-selective-focus-and.jpg?s=612x612&w=0&k=20&c=JorOCIQxXhQ4IdG6qAbWjkGgWVnYr9x_toxstVIZ2aQ=",
    "nutrition": {
      "calories": 249,
      "protein": 19,
      "carbs": 44,
      "fats": 20,
      "fiber": 5,
      "sugar": 5,
      "sodium": 762,
      "health_score": 44
    }
  },
  {
    "_id": "695e6bbd8beb6fe496ab39ea",
    "name": "Veg Maggi",
    "price": 55.0,
    "category": "quick adds",
    "image": "https://media.istockphoto.com/id/1292637196/photo/mixed-veg-maggie-noodles-instant-noodles-cooked-with-veggies-and-then-served-in-a-bowl-over-a.webp?a=1&b=1&s=612x612&w=0&k=20&c=JYGnHuKZfoO-w4QI3f3QpVf_CRAJVRuIioV0Lz44l4Y=",
    "nutrition": {
      "calories": 502,
      "protein": 14,
      "carbs": 60,
      "fats": 25,
      "fiber": 2,
      "sugar": 16,
      "sodium": 329,
      "health_score": 87
    }
  },
  {
    "_id": "695e6c0b8beb6fe496ab39eb",
    "name": "Chole Kulche",
    "price": 60.0,
    "category": "quick adds",
    "image": "https://media.istockphoto.com/id/1413108980/photo/amritsari-kulche-and-chole.jpg?s=612x612&w=0&k=20&c=FEdgjlTGZ2qnAt1tM5suLJHL8aC4xqZHC6v8esqMLE4=",
    "nutrition": {
      "calories": 382,
      "protein": 14,
      "carbs": 35,
      "fats": 21,
      "fiber": 7,
      "sugar": 5,
      "sodium": 758,
      "health_score": 95
    }
  },
  {
    "_id": "695e6c4c8beb6fe496ab39ec",
    "name": "Plain Omelette",
    "price": 45.0,
    "category": "quick adds",
    "image": "https://media.istockphoto.com/id/173651967/photo/plain-omelette.webp?a=1&b=1&s=612x612&w=0&k=20&c=t3nQJ7I7ZJTpb8LeVuEL2i6QH6EOcJCyvAKHYbWSsGk=",
    "nutrition": {
      "calories": 261,
      "protein": 14,
      "carbs": 21,
      "fats": 25,
      "fiber": 8,
      "sugar": 2,
      "sodium": 683,
      "health_score": 41
    }
  },
  {
    "_id": "695e6c768beb6fe496ab39ed",
    "name": "Masala Omelette",
    "price": 55.0,
    "category": "quick adds",
    "image": "https://plus.unsplash.com/premium_photo-1667807521536-bc35c8d8b64b?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MXx8Zm9vZCUyMHBsYWluJTIwb21lbGV0dGV8ZW58MHx8MHx8fDA%3D",
    "nutrition": {
      "calories": 591,
      "protein": 6,
      "carbs": 22,
      "fats": 10,
      "fiber": 10,
      "sugar": 11,
      "sodium": 745,
      "health_score": 80
    }
  },
  {
    "_id": "695e6ca58beb6fe496ab39ee",
    "name": "Vada Pav",
    "price": 40.0,
    "category": "quick adds",
    "image": "https://media.istockphoto.com/id/2168834306/photo/selective-focus-of-mumbais-famous-street-food-delicious-vada-pav-with-coriander-leave-chutney.webp?a=1&b=1&s=612x612&w=0&k=20&c=uITRUZVM-l6F1FgjENixVQ6Zgu3qM1FXCxsa36E5IeM=",
    "nutrition": {
      "calories": 502,
      "protein": 17,
      "carbs": 46,
      "fats": 19,
      "fiber": 3,
      "sugar": 3,
      "sodium": 660,
      "health_score": 89
    }
  },
  {
    "_id": "695e6cdc8beb6fe496ab39ef",
    "name": "Vegetable Sandwich",
    "price": 70.0,
    "category": "quick adds",
    "image": "https://media.istockphoto.com/id/486848138/photo/breakfast-sandwich.webp?a=1&b=1&s=612x612&w=0&k=20&c=VLZomRuBRlv1LPej_HX1IlG8KVWElYI5rLClARCBLp8=",
    "nutrition": {
      "calories": 263,
      "protein": 25,
      "carbs": 30,
      "fats": 12,
      "fiber": 7,
      "sugar": 1,
      "sodium": 486,
      "health_score": 66
    }
  },
  {
    "_id": "695e6cf68beb6fe496ab39f0",
    "name": "Cheese Sandwich",
    "price": 90.0,
    "category": "quick adds",
    "image": "https://media.istockphoto.com/id/1392625671/photo/grilled-cheese-with-bacon-sandwich.webp?a=1&b=1&s=612x612&w=0&k=20&c=ogJiIBeyOd5Uu9MWB9vUr4yoN8IozG2C3k64JvYmYLU=",
    "nutrition": {
      "calories": 311,
      "protein": 17,
      "carbs": 37,
      "fats": 14,
      "fiber": 3,
      "sugar": 6,
      "sodium": 787,
      "health_score": 45
    }
  },
  {
    "_id": "695e6d288beb6fe496ab39f1",
    "name": "Aloo Tikki Burger",
    "price": 70.0,
    "category": "quick adds",
    "image": "https://media.istockphoto.com/id/1489417428/photo/crispy-aloo-tikki-burger.jpg?s=612x612&w=0&k=20&c=IH9EAID6iqTWrxNujrmN0R6vTQDNR4Iy2YMkmkHiln8=",
    "nutrition": {
      "calories": 561,
      "protein": 18,
      "carbs": 21,
      "fats": 29,
      "fiber": 4,
      "sugar": 7,
      "sodium": 291,
      "health_score": 75
    }
  },
  {
    "_id": "695e6de88beb6fe496ab39f2",
    "name": "Cheese Burger",
    "price": 95.0,
    "category": "quick adds",
    "image": "https://plus.unsplash.com/premium_photo-1683619761492-639240d29bb5?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NXx8QUxPTyUyMFRJS0klMjBCVVJHRVJ8ZW58MHx8MHx8fDA%3D",
    "nutrition": {
      "calories": 273,
      "protein": 2,
      "carbs": 36,
      "fats": 17,
      "fiber": 8,
      "sugar": 5,
      "sodium": 570,
      "health_score": 49
    }
  },
  {
    "_id": "695e6e188beb6fe496ab39f3",
    "name": "Masala Dosa",
    "price": 50.0,
    "category": "quick adds",
    "image": "https://images.unsplash.com/photo-1694849789325-914b71ab4075?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8TUFTQUxBJTIwRE9TQXxlbnwwfHwwfHx8MA%3D%3D",
    "nutrition": {
      "calories": 465,
      "protein": 23,
      "carbs": 27,
      "fats": 13,
      "fiber": 10,
      "sugar": 11,
      "sodium": 514,
      "health_score": 86
    }
  },
  {
    "_id": "695e6e388beb6fe496ab39f4",
    "name": "Onion Dosa",
    "price": 70.0,
    "category": "quick adds",
    "image": "https://media.istockphoto.com/id/1280277658/photo/south-indian-breakfast-pancakes-uttapam.webp?a=1&b=1&s=612x612&w=0&k=20&c=DdJ30GIwVoOQEazDo8E5Nyd45e-dfFWON8xZpMhXveE=",
    "nutrition": {
      "calories": 260,
      "protein": 14,
      "carbs": 32,
      "fats": 26,
      "fiber": 8,
      "sugar": 6,
      "sodium": 229,
      "health_score": 88
    }
  },
  {
    "_id": "695e6e748beb6fe496ab39f5",
    "name": "Schezwan Masala Dosa",
    "price": 70.0,
    "category": "quick adds",
    "image": "https://media.istockphoto.com/id/1295610717/photo/open-masala-dosa-is-a-favorite-south-indian-vegetarian-food-prepared-with-rice-paste-and.webp?a=1&b=1&s=612x612&w=0&k=20&c=4yy1JihHAXrp9ChudYcl6m9FjdT0EN6m-ZxvKvfzNWs=",
    "nutrition": {
      "calories": 275,
      "protein": 3,
      "carbs": 22,
      "fats": 14,
      "fiber": 10,
      "sugar": 16,
      "sodium": 713,
      "health_score": 50
    }
  },
  {
    "_id": "695e6e978beb6fe496ab39f6",
    "name": "Paneer Masala Dosa",
    "price": 75.0,
    "category": "quick adds",
    "image": "https://media.istockphoto.com/id/1319648711/photo/crispy-pancake-made-of-fermented-whole-grain-finger-millet-batter-served-with-cottage-cheese.webp?a=1&b=1&s=612x612&w=0&k=20&c=xtbnTVyuOE7rkBROh2zds66LsthB60JfAoSKXmACRdE=",
    "nutrition": {
      "calories": 279,
      "protein": 12,
      "carbs": 50,
      "fats": 24,
      "fiber": 7,
      "sugar": 8,
      "sodium": 343,
      "health_score": 57
    }
  },
  {
    "_id": "695e6ecd8beb6fe496ab39f7",
    "name": "Cheese Masala Dosa",
    "price": 80.0,
    "category": "quick adds",
    "image": "https://media.istockphoto.com/id/1271649503/photo/cheese-masala-dosa.webp?a=1&b=1&s=612x612&w=0&k=20&c=5Oz54ryhVKDJvK72r9ejnn7K9Q1xWyEIx0-YgD2mUY8=",
    "nutrition": {
      "calories": 408,
      "protein": 19,
      "carbs": 23,
      "fats": 5,
      "fiber": 1,
      "sugar": 0,
      "sodium": 717,
      "health_score": 58
    }
  },
  {
    "_id": "695e6eff8beb6fe496ab39f8",
    "name": "Ghee Dosa",
    "price": 70.0,
    "category": "quick adds",
    "image": "https://media.istockphoto.com/id/1306083166/photo/masala-sin.webp?a=1&b=1&s=612x612&w=0&k=20&c=Qh2VmSGhreqrkQVYk-6G02oaeNmRXYPYOdnAivHLLCM=",
    "nutrition": {
      "calories": 477,
      "protein": 3,
      "carbs": 45,
      "fats": 27,
      "fiber": 7,
      "sugar": 10,
      "sodium": 244,
      "health_score": 85
    }
  },
  {
    "_id": "695e6f358beb6fe496ab39f9",
    "name": "Butter Masala Dosa",
    "price": 60.0,
    "category": "quick adds",
    "image": "https://media.istockphoto.com/id/2216057377/photo/crispy-masala-dosa-is-a-popular-south-indian-food-served-with-tomato-chutney-coconut-chutney.webp?a=1&b=1&s=612x612&w=0&k=20&c=8SaUhum5eLU1_l_mf25xm7UvNhAdHElu8DPmiQHk8oE=",
    "nutrition": {
      "calories": 594,
      "protein": 5,
      "carbs": 44,
      "fats": 6,
      "fiber": 10,
      "sugar": 17,
      "sodium": 772,
      "health_score": 60
    }
  },
  {
    "_id": "695e6f748beb6fe496ab39fa",
    "name": "Paneer Kulche & Chole",
    "price": 100.0,
    "category": "quick adds",
    "image": "https://media.istockphoto.com/id/1413280337/photo/amritsari-kulche-and-chole.jpg?s=612x612&w=0&k=20&c=eSKQWAd8_aMxdRyykmLDk8vFBbM_3MTJA1d_7TxlzRw=",
    "nutrition": {
      "calories": 363,
      "protein": 4,
      "carbs": 51,
      "fats": 6,
      "fiber": 6,
      "sugar": 20,
      "sodium": 177,
      "health_score": 46
    }
  },
  {
    "_id": "695e6f9c8beb6fe496ab39fb",
    "name": "Amritsari Kulche & Chole",
    "price": 100.0,
    "category": "quick adds",
    "image": "https://media.istockphoto.com/id/1413280312/photo/amritsari-kulche-and-chole.jpg?s=612x612&w=0&k=20&c=PJ-kTogGHBffaVXWosfhdChjpIcv4DoVpAM2XiMFOwE=",
    "nutrition": {
      "calories": 227,
      "protein": 24,
      "carbs": 59,
      "fats": 11,
      "fiber": 9,
      "sugar": 18,
      "sodium": 460,
      "health_score": 47
    }
  },
  {
    "_id": "695e6fcf8beb6fe496ab39fc",
    "name": "Mix Kulche & Chole",
    "price": 120.0,
    "category": "quick adds",
    "image": "https://media.istockphoto.com/id/1421888291/photo/chole-kulche-also-called-matar-kulcha-chhole-kulche-is-widely-popular-delhi-street-food-the.webp?a=1&b=1&s=612x612&w=0&k=20&c=O3jt41t9oRo3iEa0T071xUj3oWUMfraJqt53N7TrgQk=",
    "nutrition": {
      "calories": 349,
      "protein": 16,
      "carbs": 48,
      "fats": 19,
      "fiber": 5,
      "sugar": 11,
      "sodium": 614,
      "health_score": 77
    }
  },
  {
    "_id": "695e70e88beb6fe496ab39fe",
    "name": "Plain Naan",
    "price": 40.0,
    "category": "quick adds",
    "image": "https://media.istockphoto.com/id/1150376593/photo/bread-tandoori-indian-cuisine.webp?a=1&b=1&s=612x612&w=0&k=20&c=TxiK2Guj_EGbmbUiThYV50-uGd0z8Wr-xx_JlmtLZq4=",
    "nutrition": {
      "calories": 456,
      "protein": 21,
      "carbs": 22,
      "fats": 15,
      "fiber": 10,
      "sugar": 2,
      "sodium": 766,
      "health_score": 64
    }
  },
  {
    "_id": "695e711d8beb6fe496ab39ff",
    "name": "Lacha Parantha",
    "price": 60.0,
    "category": "quick adds",
    "image": "https://media.istockphoto.com/id/1249702919/photo/malabar-wheat-porotta-with-wooden-background.webp?a=1&b=1&s=612x612&w=0&k=20&c=8sYARFSDa6GlKiVX5QQl9fmUlluCw-2txeUCzvrDY8Q=",
    "nutrition": {
      "calories": 199,
      "protein": 9,
      "carbs": 52,
      "fats": 5,
      "fiber": 3,
      "sugar": 11,
      "sodium": 668,
      "health_score": 70
    }
  },
  {
    "_id": "695e71498beb6fe496ab3a00",
    "name": "Butter Naan",
    "price": 60.0,
    "category": "quick adds",
    "image": "https://media.istockphoto.com/id/1140752821/photo/indian-naan-bread-with-garlic-butter-on-wooden-table.webp?a=1&b=1&s=612x612&w=0&k=20&c=lOeYboRNvwONnykKUu7lN-UQg5c0cl0CKfDFiVFfhBk=",
    "nutrition": {
      "calories": 175,
      "protein": 3,
      "carbs": 57,
      "fats": 16,
      "fiber": 4,
      "sugar": 14,
      "sodium": 414,
      "health_score": 68
    }
  },
  {
    "_id": "695e717f8beb6fe496ab3a01",
    "name": "Garlic Naan",
    "price": 60.0,
    "category": "quick adds",
    "image": "https://media.istockphoto.com/id/1766613846/photo/the-traditional-indian-food-roti-naan-served-with-butter-chicken-curry.webp?a=1&b=1&s=612x612&w=0&k=20&c=9KSkRSZ36CnHcjSlrHJSAuDEMkkgEdJDBxWX--nEh-Q=",
    "nutrition": {
      "calories": 501,
      "protein": 25,
      "carbs": 27,
      "fats": 9,
      "fiber": 10,
      "sugar": 6,
      "sodium": 663,
      "health_score": 44
    }
  },
  {
    "_id": "695e71a28beb6fe496ab3a02",
    "name": "Garlic Bread",
    "price": 70.0,
    "category": "quick adds",
    "image": "https://media.istockphoto.com/id/2164771915/photo/three-slices-of-garlic-bread-with-fresh-parsley-on-a-white-ceramic-plate-isolated-on-white.webp?a=1&b=1&s=612x612&w=0&k=20&c=US_ZpGWnVGreFPvUoe3xgoRIpttGNHLuDWo_tgI9Kvk=",
    "nutrition": {
      "calories": 347,
      "protein": 2,
      "carbs": 30,
      "fats": 10,
      "fiber": 2,
      "sugar": 15,
      "sodium": 517,
      "health_score": 77
    }
  },
  {
    "_id": "695e71c78beb6fe496ab3a03",
    "name": "Cheese Garlic Bread",
    "price": 90.0,
    "category": "quick adds",
    "image": "https://images.unsplash.com/photo-1619535860434-ba1d8fa12536?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8Z2FybGljJTIwYnJlYWR8ZW58MHx8MHx8fDA%3D",
    "nutrition": {
      "calories": 267,
      "protein": 16,
      "carbs": 41,
      "fats": 7,
      "fiber": 3,
      "sugar": 0,
      "sodium": 744,
      "health_score": 75
    }
  },
  {
    "_id": "695e721e8beb6fe496ab3a04",
    "name": "White Sauce Pasta",
    "price": 110.0,
    "category": "quick adds",
    "image": "https://media.istockphoto.com/id/1225004589/photo/pasta-with-cream-sauce.webp?a=1&b=1&s=612x612&w=0&k=20&c=92VeajRUarZQN4GWh_4qmRP5bOWsgFVe_es8g9Uebfo=",
    "nutrition": {
      "calories": 566,
      "protein": 18,
      "carbs": 51,
      "fats": 14,
      "fiber": 5,
      "sugar": 9,
      "sodium": 503,
      "health_score": 48
    }
  },
  {
    "_id": "695e727b8beb6fe496ab3a05",
    "name": "Red Sauce Pasta",
    "price": 110.0,
    "category": "quick adds",
    "image": "https://media.istockphoto.com/id/1053864102/photo/pasta-with-meat-tomato-sauce-and-vegetables.webp?a=1&b=1&s=612x612&w=0&k=20&c=i5SQH4ZMDDK-xWVkFYtw0SIYFjBr39K_j6_dxF-3Dag=",
    "nutrition": {
      "calories": 528,
      "protein": 25,
      "carbs": 41,
      "fats": 28,
      "fiber": 2,
      "sugar": 8,
      "sodium": 748,
      "health_score": 67
    }
  },
  {
    "_id": "695e72ab8beb6fe496ab3a06",
    "name": "Mix Sauce Pasta",
    "price": 120.0,
    "category": "quick adds",
    "image": "https://media.istockphoto.com/id/825257996/photo/italian-style-spicy-chicken-penne-pasta-arrabbiata.webp?a=1&b=1&s=612x612&w=0&k=20&c=m15LAAPYeWPpmmkRbwjvOjNZEpvs9xlJWfhc63wNwXw=",
    "nutrition": {
      "calories": 446,
      "protein": 16,
      "carbs": 32,
      "fats": 10,
      "fiber": 5,
      "sugar": 4,
      "sodium": 387,
      "health_score": 51
    }
  },
  {
    "_id": "695e72f08beb6fe496ab3a07",
    "name": "French Fries",
    "price": 65.0,
    "category": "quick adds",
    "image": "https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8N3x8ZnJlbmNoJTIwZnJpZXN8ZW58MHx8MHx8fDA%3D",
    "nutrition": {
      "calories": 446,
      "protein": 19,
      "carbs": 59,
      "fats": 6,
      "fiber": 10,
      "sugar": 14,
      "sodium": 100,
      "health_score": 51
    }
  },
  {
    "_id": "695e73278beb6fe496ab3a08",
    "name": "Cheese French Fries",
    "price": 95.0,
    "category": "quick adds",
    "image": "https://media.istockphoto.com/id/1060410062/photo/freshly-cooked-french-fries-baked-with-cheddar-cheese-bacon-and-parsley-closeup-horizontal.webp?a=1&b=1&s=612x612&w=0&k=20&c=G_9-l3Lt0Z40kUZyFDxwCn6XVrbxRB66OPG5zedCS0A=",
    "nutrition": {
      "calories": 464,
      "protein": 6,
      "carbs": 52,
      "fats": 11,
      "fiber": 6,
      "sugar": 11,
      "sodium": 669,
      "health_score": 63
    }
  },
  {
    "_id": "695e737b8beb6fe496ab3a09",
    "name": "Peri Peri Fries",
    "price": 90.0,
    "category": "quick adds",
    "image": "https://media.istockphoto.com/id/2228574728/photo/stock-photo-of-peri-peri-french-fries.jpg?s=612x612&w=0&k=20&c=oGrbSnESVAT9OmzzL3uxG1hBMXpbHVS3n3k_L3ChJuk=",
    "nutrition": {
      "calories": 371,
      "protein": 5,
      "carbs": 38,
      "fats": 7,
      "fiber": 8,
      "sugar": 18,
      "sodium": 262,
      "health_score": 68
    }
  },
  {
    "_id": "695e74218beb6fe496ab3a0a",
    "name": "Steam Momos",
    "price": 60.0,
    "category": "quick adds",
    "image": "https://media.istockphoto.com/id/1392099030/photo/fried-gyoza-dumplings-with-wooden-chopstick.webp?a=1&b=1&s=612x612&w=0&k=20&c=ODJcA4OLYhfygWWJjcn-7x0w3LE0w41aiK62ZDWhVbw=",
    "nutrition": {
      "calories": 243,
      "protein": 21,
      "carbs": 46,
      "fats": 18,
      "fiber": 7,
      "sugar": 14,
      "sodium": 182,
      "health_score": 79
    }
  },
  {
    "_id": "695e74498beb6fe496ab3a0b",
    "name": "Fried Momos",
    "price": 80.0,
    "category": "quick adds",
    "image": "https://media.istockphoto.com/id/1341504203/photo/fried-momos-dumpling.webp?a=1&b=1&s=612x612&w=0&k=20&c=mtHAwF3TH997DT_4gJ-hgECmJ-uVhAQvFAsxIEulrSI=",
    "nutrition": {
      "calories": 581,
      "protein": 2,
      "carbs": 49,
      "fats": 12,
      "fiber": 3,
      "sugar": 0,
      "sodium": 689,
      "health_score": 82
    }
  },
  {
    "_id": "695e74748beb6fe496ab3a0c",
    "name": "Spring Roll",
    "price": 100.0,
    "category": "quick adds",
    "image": "https://media.istockphoto.com/id/2185058260/photo/assorted-of-asian-food-fried-spring-roll-dumpling-samosa-and-soysauce.webp?a=1&b=1&s=612x612&w=0&k=20&c=INMALQSfexhnfOODsm3TaUCs2Q512M8Y4qyriviMTmI=",
    "nutrition": {
      "calories": 413,
      "protein": 12,
      "carbs": 37,
      "fats": 9,
      "fiber": 5,
      "sugar": 20,
      "sodium": 522,
      "health_score": 41
    }
  },
  {
    "_id": "695e74af8beb6fe496ab3a0d",
    "name": "Chilly Potato",
    "price": 75.0,
    "category": "quick adds",
    "image": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSM0DQbVim7njvVU-t7N2PlfMQyF1Ty5gzYnw&s",
    "nutrition": {
      "calories": 423,
      "protein": 20,
      "carbs": 51,
      "fats": 19,
      "fiber": 3,
      "sugar": 6,
      "sodium": 478,
      "health_score": 84
    }
  },
  {
    "_id": "695e74df8beb6fe496ab3a0e",
    "name": "Honey Chilly Potato",
    "price": 85.0,
    "category": "quick adds",
    "image": "https://media.istockphoto.com/id/2191594610/photo/tastiest-red-sauce-pasta-italian.webp?a=1&b=1&s=612x612&w=0&k=20&c=EZxvl3Oyao8Tllwf651N6I87q5qn0AY9St81x9GlQoM=",
    "nutrition": {
      "calories": 387,
      "protein": 23,
      "carbs": 52,
      "fats": 19,
      "fiber": 10,
      "sugar": 11,
      "sodium": 377,
      "health_score": 91
    }
  },
  {
    "_id": "695e750b8beb6fe496ab3a0f",
    "name": "Paneer Chilly",
    "price": 95.0,
    "category": "quick adds",
    "image": "https://media.istockphoto.com/id/1256958573/photo/chilli-paneer-or-spicy-cottage-cheese-garnish-with-capsicum-onion-cabbage-and-spring-onion.webp?a=1&b=1&s=612x612&w=0&k=20&c=LCWpHPjm2ucIdq6F9qXqmTmWRDVxDDsKsl-iTchS3G0=",
    "nutrition": {
      "calories": 527,
      "protein": 13,
      "carbs": 47,
      "fats": 25,
      "fiber": 1,
      "sugar": 8,
      "sodium": 178,
      "health_score": 47
    }
  },
  {
    "_id": "695e75368beb6fe496ab3a10",
    "name": "Fried Rice",
    "price": 85.0,
    "category": "quick adds",
    "image": "https://images.unsplash.com/photo-1512058564366-18510be2db19?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8RnJpZWQlMjBSaWNlfGVufDB8fDB8fHww",
    "nutrition": {
      "calories": 296,
      "protein": 17,
      "carbs": 40,
      "fats": 14,
      "fiber": 2,
      "sugar": 6,
      "sodium": 153,
      "health_score": 46
    }
  },
  {
    "_id": "695e75558beb6fe496ab3a11",
    "name": "Egg Fried Rice",
    "price": 110.0,
    "category": "quick adds",
    "image": "https://media.istockphoto.com/id/1175434591/photo/fried-rice-with-ketchup-and-soy-sauce.webp?a=1&b=1&s=612x612&w=0&k=20&c=1vdfRph7NFQJGxqkY4BYOvGWX8lmRPjdpCeU6VygsTQ=",
    "nutrition": {
      "calories": 245,
      "protein": 18,
      "carbs": 30,
      "fats": 16,
      "fiber": 3,
      "sugar": 6,
      "sodium": 420,
      "health_score": 66
    }
  },
  {
    "_id": "695e757d8beb6fe496ab3a12",
    "name": "Paneer Fried Rice",
    "price": 110.0,
    "category": "quick adds",
    "image": "https://media.istockphoto.com/id/1700258788/photo/paneer-pulao-served-with-raita-and-onion-lemon.webp?a=1&b=1&s=612x612&w=0&k=20&c=76QprTpwDMY2CDqCuL-hn7KLwxUfMtZPjz-WU--QC_U=",
    "nutrition": {
      "calories": 290,
      "protein": 11,
      "carbs": 38,
      "fats": 20,
      "fiber": 2,
      "sugar": 12,
      "sodium": 544,
      "health_score": 40
    }
  },
  {
    "_id": "695e75a08beb6fe496ab3a13",
    "name": "Manchurian",
    "price": 70.0,
    "category": "quick adds",
    "image": "https://media.istockphoto.com/id/2204824949/photo/vegetable-manchurian-is-a-spicy-indo-chinese-dish-featuring-deep-fried-vegetable-balls-tossed.webp?a=1&b=1&s=612x612&w=0&k=20&c=B1m4SzitmdO6lgZ-DVHaGf72CU1gFo8mg_7s8qBKclY=",
    "nutrition": {
      "calories": 297,
      "protein": 19,
      "carbs": 26,
      "fats": 13,
      "fiber": 3,
      "sugar": 10,
      "sodium": 524,
      "health_score": 41
    }
  },
  {
    "_id": "695e75c78beb6fe496ab3a14",
    "name": "Tandoori Momos",
    "price": 100.0,
    "category": "quick adds",
    "image": "https://media.istockphoto.com/id/1474859576/photo/tandoori-momos.jpg?s=612x612&w=0&k=20&c=C0TbERZuwVMrcJGn8TGshDSQDOkOc4OfxtLdOIe-s2E=",
    "nutrition": {
      "calories": 360,
      "protein": 22,
      "carbs": 54,
      "fats": 9,
      "fiber": 4,
      "sugar": 13,
      "sodium": 503,
      "health_score": 47
    }
  },
  {
    "_id": "695e75f78beb6fe496ab3a15",
    "name": "Fried Rice And Chilli Paneer",
    "price": 150.0,
    "category": "quick adds",
    "image": "https://media.istockphoto.com/id/2231865414/photo/savory-chicken-and-fried-rice-bowl-served-in-plate-side-view-of-a-delicious-meal.webp?a=1&b=1&s=612x612&w=0&k=20&c=pnf-01YGvK98tI90qqK_75dfjFw34wvGYA9hZ3tS0gY=",
    "nutrition": {
      "calories": 367,
      "protein": 12,
      "carbs": 33,
      "fats": 11,
      "fiber": 4,
      "sugar": 17,
      "sodium": 603,
      "health_score": 80
    }
  },
  {
    "_id": "695e761c8beb6fe496ab3a16",
    "name": "Fried Rice And Manchurian",
    "price": 150.0,
    "category": "quick adds",
    "image": "https://media.istockphoto.com/id/1022775708/photo/vegetable-fried-rice-with-vegetable-manchurian-pune-india.webp?a=1&b=1&s=612x612&w=0&k=20&c=2CH7TKdopTiQ9AAna11QExMS_EoslXjf8XFRYKluomM=",
    "nutrition": {
      "calories": 290,
      "protein": 2,
      "carbs": 52,
      "fats": 29,
      "fiber": 5,
      "sugar": 2,
      "sodium": 551,
      "health_score": 40
    }
  },
  {
    "_id": "695e773a8beb6fe496ab3a18",
    "name": "Paneer Bhurji",
    "price": 120.0,
    "category": "quick adds",
    "image": "https://media.istockphoto.com/id/1437118155/photo/scrambled-cottage-cheese-paneer-bhurji.webp?a=1&b=1&s=612x612&w=0&k=20&c=eGZlMVSBHoOuceHglzxdcpVT31JeZd2P9zecVnOBRmg=",
    "nutrition": {
      "calories": 267,
      "protein": 14,
      "carbs": 34,
      "fats": 15,
      "fiber": 3,
      "sugar": 16,
      "sodium": 174,
      "health_score": 84
    }
  },
  {
    "_id": "695e775d8beb6fe496ab3a19",
    "name": "Mutter Mushroom Masala",
    "price": 120.0,
    "category": "quick adds",
    "image": "https://media.istockphoto.com/id/893021656/photo/indian-mushroom-curry-with-roti-or-naan-or-flat-bread-selective-focus.webp?a=1&b=1&s=612x612&w=0&k=20&c=NHEcAf8AT4COdzcOkZmjisBfDaZQbUrVLjaaNcxaXVQ=",
    "nutrition": {
      "calories": 326,
      "protein": 2,
      "carbs": 27,
      "fats": 6,
      "fiber": 10,
      "sugar": 20,
      "sodium": 637,
      "health_score": 41
    }
  },
  {
    "_id": "695e777e8beb6fe496ab3a1a",
    "name": "Egg Curry",
    "price": 120.0,
    "category": "quick adds",
    "image": "https://media.istockphoto.com/id/1185235293/photo/boiled-curry-eggs-in-spicy-sauce-close-up-in-a-plate-vertical-top-view.webp?a=1&b=1&s=612x612&w=0&k=20&c=Y0BxeiDd_CyKPJwc4-6GsE5XqCWSGzHNjQeZp11-tUw=",
    "nutrition": {
      "calories": 226,
      "protein": 14,
      "carbs": 58,
      "fats": 24,
      "fiber": 8,
      "sugar": 4,
      "sodium": 766,
      "health_score": 62
    }
  },
  {
    "_id": "695e7a4e8beb6fe496ab3a1b",
    "name": "Paneer Tikka Masala",
    "price": 120.0,
    "category": "quick adds",
    "image": "https://media.istockphoto.com/id/969082184/photo/indian-food-or-indian-curry-in-a-copper-brass-serving-bowl.webp?a=1&b=1&s=612x612&w=0&k=20&c=RF4ClHdAKQvWQ6lYfdto4efrygtlhnxxDEZEXos23WM=",
    "nutrition": {
      "calories": 559,
      "protein": 13,
      "carbs": 27,
      "fats": 16,
      "fiber": 7,
      "sugar": 16,
      "sodium": 588,
      "health_score": 43
    }
  },
  {
    "_id": "6971b50665f34feafff87fe6",
    "name": "Brownie",
    "price": 30.0,
    "category": "desserts",
    "image": "https://media.istockphoto.com/id/1279622899/photo/chocolate-cakes-brownies-pastries-dessert-on-black-ceramic-plate-with-nuts-topping.webp?a=1&b=1&s=612x612&w=0&k=20&c=_ho8DMovoJBgese7RzHRCZk722drl2sxxfwNugh7J60=",
    "nutrition": {
      "calories": 284,
      "protein": 21,
      "carbs": 39,
      "fats": 30,
      "fiber": 8,
      "sugar": 18,
      "sodium": 641,
      "health_score": 65
    }
  },
  {
    "_id": "6971b57065f34feafff87fe8",
    "name": "Chocolate Muffin",
    "price": 30.0,
    "category": "desserts",
    "image": "https://media.istockphoto.com/id/1436206724/photo/cupcake-with-marijuana-traditional-sponge-cake-with-cannabis-weed-cbd-medical-marijuana-drugs.jpg?s=612x612&w=0&k=20&c=AV7vW2_MeESwcZrqeYolzVrl9QNW-K-7agkvNltq0Nk=",
    "nutrition": {
      "calories": 523,
      "protein": 25,
      "carbs": 43,
      "fats": 7,
      "fiber": 3,
      "sugar": 16,
      "sodium": 229,
      "health_score": 56
    }
  },
  {
    "_id": "6971b5d265f34feafff87fea",
    "name": "Black Forest Pastry",
    "price": 74.0,
    "category": "desserts",
    "image": "https://media.istockphoto.com/id/630007690/photo/cake.webp?a=1&b=1&s=612x612&w=0&k=20&c=wW5Wykg7lXr_LsTstUDr0hTHj6YO0tsccSn2ApLOr5c=",
    "nutrition": {
      "calories": 302,
      "protein": 19,
      "carbs": 48,
      "fats": 20,
      "fiber": 5,
      "sugar": 7,
      "sodium": 488,
      "health_score": 83
    }
  },
  {
    "_id": "6971b61a65f34feafff87fec",
    "name": "Pineapple Pastry",
    "price": 74.0,
    "category": "desserts",
    "image": "https://media.istockphoto.com/id/1495302600/photo/a-piece-of-delicious-pineapple-pastry-with-a-cherry-and-wafer-on-top.jpg?s=612x612&w=0&k=20&c=lr0lo6LWdRJLUD-47SNBvGBD-qwmwkVBTskopNoBZ9I=",
    "nutrition": {
      "calories": 575,
      "protein": 23,
      "carbs": 28,
      "fats": 18,
      "fiber": 5,
      "sugar": 16,
      "sodium": 467,
      "health_score": 53
    }
  },
  {
    "_id": "6971ba7d65f34feafff87fee",
    "name": "Vanilla muffin",
    "price": 30.0,
    "category": "desserts",
    "image": "https://media.istockphoto.com/id/627796786/photo/cranberry-muffins.webp?a=1&b=1&s=612x612&w=0&k=20&c=WMFSdkY6eIo1tdSDaODKgLt3xEs8MXkQbGhi-qSvjok=",
    "nutrition": {
      "calories": 572,
      "protein": 16,
      "carbs": 25,
      "fats": 14,
      "fiber": 5,
      "sugar": 12,
      "sodium": 278,
      "health_score": 89
    }
  }
]);
      } finally {
        setLoading(false);
      }
    };
    fetchMenu();
  }, []);

  const cartMap = useMemo(() => cart.reduce((map, item) => ({ ...map, [item._id]: item }), {}), [cart]);
  const categories = useMemo(() => ["all", ...new Set(menu.map((m) => m.category).filter(Boolean))], [menu]);

  const filteredAndSortedMenu = useMemo(() => {
    let result = menu.filter((item) => {
      const matchSearch = !search.trim() || item.name?.toLowerCase().includes(search.trim().toLowerCase());
      const matchCategory = category === "all" || item.category === category;
      return matchSearch && matchCategory;
    });

    const num = (item, key) => Number(item?.nutrition?.[key] ?? 0);

    switch (sortBy) {
      case "protein":
        result.sort((a, b) => num(b, "protein") - num(a, "protein"));
        break;
      case "calories":
        result.sort((a, b) => num(a, "calories") - num(b, "calories"));
        break;
      case "health":
        result.sort((a, b) => num(b, "health_score") - num(a, "health_score"));
        break;
      default:
        break;
    }

    // #region agent log
    if (sortBy !== "recommended" && result.length >= 3) {
      fetch('http://127.0.0.1:7559/ingest/ac98a93e-e671-495f-a3ce-59b4abacbf8f',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'3e7df7'},body:JSON.stringify({sessionId:'3e7df7',location:'MenuPage.js:filteredAndSortedMenu',message:'sort_applied',data:{sortBy,top3:result.slice(0,3).map(i=>({name:i.name,protein:i.nutrition?.protein,calories:i.nutrition?.calories,health:i.nutrition?.health_score}))},timestamp:Date.now(),hypothesisId:'H5'})}).catch(()=>{});
    }
    // #endregion

    return result;
  }, [menu, search, category, sortBy]);

  const totalItems = useMemo(() => cart.reduce((sum, i) => sum + (i.quantity || 1), 0), [cart]);
  const totalPrice = useMemo(() => cart.reduce((sum, i) => sum + (i.quantity || 1) * (i.price || 0), 0), [cart]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50 pb-32">
      
      {/* HERO HEADER */}
      <div className="bg-white border-b sticky top-0 z-30 shadow-sm backdrop-blur-xl bg-white/80">
        <div className="max-w-7xl mx-auto px-4 py-4 md:py-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight">Smart Menu</h1>
              <p className="text-sm text-gray-500 mt-1 flex items-center gap-1"><Activity size={14} className="text-emerald-500"/> AI-Powered Nutrition Insights</p>
            </div>

            {/* SEARCH & SORT */}
            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="relative flex-1 md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Search smart food..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-100/50 border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all text-sm"
                />
              </div>
              
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="py-2.5 px-4 bg-white border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-orange-500/20 outline-none cursor-pointer"
              >
                <option value="recommended">Recommended</option>
                <option value="health">Highest Health Score</option>
                <option value="protein">High Protein</option>
                <option value="calories">Low Calories</option>
              </select>
            </div>
          </div>

          {/* CATEGORIES */}
          <div className="flex gap-2 mt-6 overflow-x-auto pb-2 scrollbar-hide snap-x">
            {categories.map((c) => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={`snap-start px-5 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all duration-300 ${
                  category === c
                    ? "bg-gray-900 text-white shadow-md scale-105"
                    : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50 hover:border-gray-300"
                }`}
              >
                {c.charAt(0).toUpperCase() + c.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <motion.div 
          variants={staggerContainer}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
        >
          {filteredAndSortedMenu.map((item) => {
            const id = item._id;
            const quantity = cartMap[id]?.quantity || 0;
            const nut = item.nutrition || {};
            const scoreClass = getScoreColor(nut.health_score ?? 0);

            return (
              <motion.div
                variants={cardVariant}
                key={id}
                className="group relative bg-white rounded-3xl p-3 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col"
              >
                {/* 3D Image Wrapper */}
                <div 
                  className="relative h-48 w-full rounded-2xl overflow-hidden cursor-pointer"
                  onClick={() => setSelectedItem(item)}
                >
                  <motion.img
                    src={item.image || fallbackImage}
                    alt={item.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    onError={(e) => (e.currentTarget.src = fallbackImage)}
                  />
                  {/* Glass Overlay on Hover */}
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-[2px]">
                    <div className="bg-white/90 text-gray-900 px-4 py-2 rounded-full text-xs font-bold flex items-center gap-1 shadow-lg">
                      <Info size={14}/> View Nutrition
                    </div>
                  </div>
                  
                  {/* Top Badges */}
                  <div className="absolute top-3 left-3 flex flex-col gap-2">
                    <div className={`px-2.5 py-1 rounded-lg border backdrop-blur-md text-xs font-bold flex items-center gap-1 shadow-sm ${scoreClass}`}>
                      <Activity size={12} /> {nut.health_score ?? 0}
                    </div>
                  </div>
                  <button className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/80 backdrop-blur-md text-gray-400 flex items-center justify-center hover:text-red-500 hover:bg-white shadow-sm transition-colors">
                    <Heart size={16} />
                  </button>
                </div>

                <div className="mt-4 px-2 flex-1 flex flex-col">
                  <div className="flex justify-between items-start gap-2">
                    <h2 className="font-extrabold text-lg text-gray-900 leading-tight">{item.name}</h2>
                  </div>
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2 leading-relaxed">{item.description}</p>
                  
                  <div className="mt-4 flex items-center justify-between gap-2 px-3 py-2 bg-gray-50 rounded-xl border border-gray-100">
                    <div className="text-center">
                      <div className="text-xs font-bold text-orange-500 flex items-center gap-0.5 justify-center"><Flame size={12}/>{nut.calories ?? 0}</div>
                      <div className="text-[9px] text-gray-400 uppercase tracking-wide">Kcal</div>
                    </div>
                    <div className="w-px h-6 bg-gray-200"></div>
                    <div className="text-center">
                      <div className="text-xs font-bold text-blue-500">{nut.protein ?? 0}g</div>
                      <div className="text-[9px] text-gray-400 uppercase tracking-wide">Protein</div>
                    </div>
                    <div className="w-px h-6 bg-gray-200"></div>
                    <div className="text-center">
                      <div className="text-xs font-bold text-emerald-500">{nut.carbs ?? 0}g</div>
                      <div className="text-[9px] text-gray-400 uppercase tracking-wide">Carbs</div>
                    </div>
                  </div>

                  <div className="mt-auto pt-4 flex items-center justify-between">
                    <div className="font-black text-xl text-gray-900">₹{Number(item.price).toFixed(0)}</div>
                    
                    {quantity === 0 ? (
                      <button
                        onClick={(e) => { e.stopPropagation(); addToCart(item); toast.success(`${item.name} added`); }}
                        className="bg-gray-900 text-white p-2.5 rounded-xl hover:bg-orange-500 hover:shadow-lg hover:shadow-orange-500/20 transition-all group/btn"
                      >
                        <Plus size={20} className="group-hover/btn:rotate-90 transition-transform duration-300" />
                      </button>
                    ) : (
                      <div className="flex items-center gap-3 bg-gray-100 rounded-xl p-1 border border-gray-200">
                        <button onClick={(e) => { e.stopPropagation(); decreaseQty(id); }} className="w-8 h-8 flex items-center justify-center bg-white rounded-lg shadow-sm text-gray-600 hover:text-red-500 transition-colors">
                          <Minus size={16} />
                        </button>
                        <span className="font-bold text-sm w-4 text-center">{quantity}</span>
                        <button onClick={(e) => { e.stopPropagation(); addToCart(item); }} className="w-8 h-8 flex items-center justify-center bg-white rounded-lg shadow-sm text-gray-600 hover:text-green-500 transition-colors">
                          <Plus size={16} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {filteredAndSortedMenu.length === 0 && (
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 text-gray-400 mb-4">
              <Search size={24} />
            </div>
            <h3 className="text-lg font-bold text-gray-900">No smart meals found</h3>
            <p className="text-gray-500 mt-1">Try adjusting your search or filters.</p>
          </div>
        )}
      </div>

      {/* ================= FLOATING CART ================= */}
      <AnimatePresence>
        {totalItems > 0 && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-md bg-gray-900/95 backdrop-blur-xl border border-white/10 p-3 rounded-2xl shadow-2xl flex items-center justify-between z-40"
          >
            <div className="flex items-center gap-3 ml-2">
              <div className="w-10 h-10 bg-orange-500/20 text-orange-400 rounded-full flex items-center justify-center font-bold">
                {totalItems}
              </div>
              <div>
                <div className="text-xs text-gray-400 font-medium">Total Balance</div>
                <div className="text-white font-bold">₹{totalPrice.toFixed(2)}</div>
              </div>
            </div>
            <button
              onClick={() => navigate("/cart")}
              className="bg-white text-black px-6 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-gray-100 transition-colors"
            >
              Checkout <ChevronRight size={16} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ================= NUTRITION MODAL ================= */}
      <AnimatePresence>
        {selectedItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSelectedItem(null)}
              className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm"
            />
            
            <motion.div
              variants={modalVariant}
              initial="hidden"
              animate="show"
              exit="exit"
              className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Close btn */}
              <button onClick={() => setSelectedItem(null)} className="absolute top-4 right-4 z-10 w-10 h-10 bg-black/40 backdrop-blur-md text-white rounded-full flex items-center justify-center hover:bg-black/60 transition-colors">
                <X size={20} />
              </button>

              <div className="overflow-y-auto overflow-x-hidden scrollbar-hide">
                {/* Header Image */}
                <div className="h-64 sm:h-72 w-full relative">
                  <img src={selectedItem.image || fallbackImage} alt={selectedItem.name} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/20 to-transparent"></div>
                  <div className="absolute bottom-6 left-6 pr-6">
                    <div className="flex gap-2 mb-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold border backdrop-blur-md ${getScoreColor(selectedItem.nutrition?.health_score)}`}>
                        {getScoreLabel(selectedItem.nutrition?.health_score)} ({selectedItem.nutrition?.health_score}/100)
                      </span>
                      {selectedItem.nutrition?.protein > 20 && (
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30 flex items-center gap-1"><Dumbbell size={12}/> High Protein</span>
                      )}
                    </div>
                    <h2 className="text-3xl font-black text-white">{selectedItem.name}</h2>
                    <p className="text-gray-300 text-sm mt-1">{selectedItem.description}</p>
                  </div>
                </div>

                <div className="p-6">
                  {/* Quick Macros */}
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest mb-4">Nutrition Breakdown</h3>

                  <div className="grid grid-cols-4 gap-4 mb-8">
                    <div className="bg-orange-50 rounded-2xl p-4 text-center border border-orange-100">
                      <Flame className="mx-auto text-orange-500 mb-2" size={24}/>
                      <div className="font-black text-xl text-gray-900">{selectedItem.nutrition?.calories}</div>
                      <div className="text-[10px] text-gray-500 font-bold uppercase">Calories</div>
                    </div>
                    <div className="bg-blue-50 rounded-2xl p-4 text-center border border-blue-100">
                      <Dumbbell className="mx-auto text-blue-500 mb-2" size={24}/>
                      <div className="font-black text-xl text-gray-900">{selectedItem.nutrition?.protein}g</div>
                      <div className="text-[10px] text-gray-500 font-bold uppercase">Protein</div>
                    </div>
                    <div className="bg-emerald-50 rounded-2xl p-4 text-center border border-emerald-100">
                      <Wheat className="mx-auto text-emerald-500 mb-2" size={24}/>
                      <div className="font-black text-xl text-gray-900">{selectedItem.nutrition?.carbs}g</div>
                      <div className="text-[10px] text-gray-500 font-bold uppercase">Carbs</div>
                    </div>
                    <div className="bg-purple-50 rounded-2xl p-4 text-center border border-purple-100">
                      <Droplet className="mx-auto text-purple-500 mb-2" size={24}/>
                      <div className="font-black text-xl text-gray-900">{selectedItem.nutrition?.fats}g</div>
                      <div className="text-[10px] text-gray-500 font-bold uppercase">Fats</div>
                    </div>
                  </div>

                  {/* Micro Nutrients */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
                    <div>
                      <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest mb-4">Detailed Metrics</h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-500 font-medium">Dietary Fiber</span>
                          <span className="font-bold text-gray-900">{selectedItem.nutrition?.fiber}g <span className="text-xs text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-md ml-2">{Math.round((selectedItem.nutrition?.fiber/28)*100)}% DV</span></span>
                        </div>
                        <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden"><div className="bg-emerald-400 h-full rounded-full" style={{width: `${Math.min((selectedItem.nutrition?.fiber/28)*100, 100)}%`}}></div></div>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-500 font-medium">Sugar</span>
                          <span className="font-bold text-gray-900">{selectedItem.nutrition?.sugar}g</span>
                        </div>
                        <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden"><div className="bg-red-400 h-full rounded-full" style={{width: `${Math.min((selectedItem.nutrition?.sugar/50)*100, 100)}%`}}></div></div>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-500 font-medium">Sodium</span>
                          <span className="font-bold text-gray-900">{selectedItem.nutrition?.sodium}mg</span>
                        </div>
                        <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden"><div className="bg-blue-400 h-full rounded-full" style={{width: `${Math.min((selectedItem.nutrition?.sodium/2300)*100, 100)}%`}}></div></div>
                      </div>
                    </div>

                    {/* Chart */}
                    <div className="bg-gray-50 rounded-2xl p-4 flex flex-col items-center justify-center border border-gray-100">
                       <div className="h-40 w-full relative">
                          <ResponsiveContainer width="100%" height="100%" minHeight={150}>
                            <PieChart>
                              <Pie
                                data={[
                                  { name: 'Protein', value: selectedItem.nutrition?.protein || 0, color: '#3b82f6' },
                                  { name: 'Carbs', value: selectedItem.nutrition?.carbs || 0, color: '#10b981' },
                                  { name: 'Fats', value: selectedItem.nutrition?.fats || 0, color: '#a855f7' }
                                ]}
                                cx="50%" cy="50%" innerRadius={45} outerRadius={65} paddingAngle={5} dataKey="value"
                              >
                                {[{color: '#3b82f6'}, {color: '#10b981'}, {color: '#a855f7'}].map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                              </Pie>
                              <RechartsTooltip contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)'}} />
                            </PieChart>
                          </ResponsiveContainer>
                          <div className="absolute inset-0 flex items-center justify-center flex-col pointer-events-none">
                            <span className="text-xs text-gray-400 font-bold uppercase">Macros</span>
                          </div>
                       </div>
                    </div>
                  </div>

                </div>

                {/* Footer Actions */}
                <div className="border-t p-4 sm:px-6 bg-gray-50 flex items-center justify-between sticky bottom-0 z-20">
                  <div className="font-black text-2xl text-gray-900">₹{Number(selectedItem.price).toFixed(0)}</div>
                  <button
                    onClick={() => {
                      addToCart(selectedItem);
                      toast.success(`${selectedItem.name} added to cart`);
                      setSelectedItem(null);
                    }}
                    className="bg-black text-white px-8 py-3 rounded-xl font-bold text-sm shadow-xl shadow-black/20 hover:bg-orange-500 hover:shadow-orange-500/30 transition-all flex items-center gap-2"
                  >
                    Add to Cart <Plus size={16}/>
                  </button>
                </div>

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default MenuPage;