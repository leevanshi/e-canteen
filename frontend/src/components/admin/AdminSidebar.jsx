import { NavLink } from "react-router-dom";
import { 
  LayoutDashboard, 
  ShoppingBag, 
  Utensils, 
  Wallet, 
  Users, 
  BarChart3, 
  Bell, 
  Settings,
  Store,
  History,
  FileText,
  Package,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { useState } from "react";
import { theme } from "../../theme";

const AdminSidebar = ({ collapsed, onToggle }) => {
  const [expandedSection, setExpandedSection] = useState(null);

  const menuItems = [
    {
      section: "Main",
      items: [
        { to: "/admin/dashboard", icon: LayoutDashboard, label: "Dashboard" },
      ]
    },
    {
      section: "Orders",
      items: [
        { to: "/admin/orders", icon: ShoppingBag, label: "Live Orders" },
        { to: "/admin/counter", icon: Store, label: "Walk-In Orders" },
        { to: "/admin/history", icon: History, label: "Order History" },
      ]
    },
    {
      section: "Menu",
      items: [
        { to: "/admin/menu", icon: Utensils, label: "Menu Catalog" },
        { to: "/admin/monthly-menu", icon: FileText, label: "Monthly Menu" },
      ]
    },
    {
      section: "Finance",
      items: [
        { to: "/admin/wallet", icon: Wallet, label: "Wallet Management" },
        { to: "/admin/wallet-history", icon: History, label: "Wallet History" },
      ]
    },
    {
      section: "Management",
      items: [
        { to: "/admin/analytics", icon: BarChart3, label: "Analytics" },
        { to: "/admin/inventory", icon: Package, label: "Inventory" },
        { to: "/admin/reports", icon: FileText, label: "Reports" },
        { to: "/admin/feedbacks", icon: Bell, label: "Feedback" },
      ]
    },
  ];

  const toggleSection = (section) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  return (
    <aside 
      className={`fixed left-0 top-0 h-screen bg-white border-r border-gray-200 transition-all duration-300 z-50 ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Logo */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
              <Utensils size={18} className="text-white" />
            </div>
            <span className="font-bold text-lg text-gray-900">E-Canteen</span>
          </div>
        )}
        <button 
          onClick={onToggle}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="p-4 space-y-6 overflow-y-auto h-[calc(100vh-4rem)]">
        {menuItems.map((section) => (
          <div key={section.section}>
            <button
              onClick={() => toggleSection(section.section)}
              className={`w-full flex items-center gap-2 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100 rounded-lg transition-colors ${
                collapsed ? 'justify-center' : ''
              }`}
            >
              {!collapsed && <span>{section.section}</span>}
            </button>
            
            <div className={`mt-2 space-y-1 ${collapsed ? 'hidden' : ''}`}>
              {section.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-orange-50 text-orange-600 border border-orange-200'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`
                  }
                >
                  <item.icon size={18} />
                  {!collapsed && <span>{item.label}</span>}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* User Section */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
        <NavLink
          to="/login"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
        >
          <Settings size={18} />
          {!collapsed && <span>Logout</span>}
        </NavLink>
      </div>
    </aside>
  );
};

export default AdminSidebar;
