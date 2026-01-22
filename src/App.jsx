import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import ClickSpark from './components/ClickSpark';

import { CartProvider } from "./components/CartContext";
import Navbar from "./components/Navbar";
import CartOverlay from "./components/CartOverlay";
import BackToTop from "./components/BackToTop";
import PortalSidebar from "./components/PortalSidebar";

import Footer from './components/Footer';

import Home from './pages/Home';
import About from './pages/About';
import Shop from './pages/Shop';
import Rentals from './pages/Rentals';
import RentalItem from './pages/RentalItem';
import Gallery from './pages/Gallery';
import FAQ from './pages/faq';
import Contact from './pages/Contact';
import PrivacyPolicy from './pages/privacy-policy';
import RefundPolicy from './pages/refund-policy';
import DeliveryPolicy from './pages/delivery-policy';
import TermsOfService from './pages/terms-of-service';
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Book from './pages/Book';
import Admin from './pages/Admin';
import AdminDashboard from './pages/AdminDashboard';
import OrdersList from './pages/OrdersList';
import OrderBuilder from './pages/OrderBuilder';
import AdminDirectory from './pages/AdminDirectory';
import AdminBookings from './pages/AdminBookings';
import AdminScheduler from './pages/AdminScheduler';
import AdminAccounting from './pages/AdminAccounting';
import AdminRoles from './pages/AdminRoles';
import AdminSettings from './pages/AdminSettings';
import AdminCustomers from './pages/AdminCustomers';
import AdminInvoicing from './pages/AdminInvoicing';
import AdminExpenses from './pages/AdminExpenses';
import AdminHR from './pages/AdminHR';
import AdminDocuments from './pages/AdminDocuments';
import AdminTimesheets from './pages/AdminTimesheets';
import AdminVendors from './pages/AdminVendors';
import AdminMaintenance from './pages/AdminMaintenance';
import AdminDelivery from './pages/AdminDelivery';
import AdminMarketing from './pages/AdminMarketing';
import WebsiteTemplateEditor from './pages/WebsiteTemplateEditor';
import Login from './pages/Login';
import AuthProvider, { useAuth } from './components/AuthContext';
import { TemplateConfigProvider } from './context/TemplateConfigContext';

function RequireAuth({ children }) {
  const { user, authReady } = useAuth();
  const location = useLocation();

  if (!authReady) return null;
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return children;
}

const normalizeRole = (role) => String(role || "").trim().toLowerCase();

function RequireRole({ allowedRoles = [], children }) {
  const { user, authReady } = useAuth();
  const location = useLocation();

  if (!authReady) return null;
  if (!allowedRoles.length) return children;
  const role = normalizeRole(user?.role);
  const canAccess = allowedRoles.some((allowed) => normalizeRole(allowed) === role);
  if (!canAccess) {
    return <Navigate to="/admin" replace state={{ from: location.pathname }} />;
  }
  return children;
}

const MOBILE_VIEW_QUERY = "(max-width: 720px)";
const PORTAL_HOST = "portal.reebspartythemes.com";
const DEFAULT_TITLE = "REEBS Party Themes";

const getAdminTitle = (pathname) => {
  if (pathname === "/admin") return "Dashboard";
  if (pathname.startsWith("/admin/orders/new")) return "Order Builder";
  if (pathname.startsWith("/admin/orders")) return "Orders";
  if (pathname.startsWith("/admin/inventory")) return "Inventory";
  if (pathname.startsWith("/admin/crm")) return "CRM";
  if (pathname.startsWith("/admin/directory")) return "Directory";
  if (pathname.startsWith("/admin/users")) return "Directory";
  if (pathname.startsWith("/admin/employees")) return "Directory";
  if (pathname.startsWith("/admin/bookings")) return "Bookings";
  if (pathname.startsWith("/admin/schedule")) return "Scheduling";
  if (pathname.startsWith("/admin/accounting")) return "Accounting";
  if (pathname.startsWith("/admin/expenses")) return "Expenses";
  if (pathname.startsWith("/admin/hr")) return "Human Resources";
  if (pathname.startsWith("/admin/documents")) return "Documents";
  if (pathname.startsWith("/admin/timesheets")) return "Timesheets";
  if (pathname.startsWith("/admin/vendors")) return "Vendors";
  if (pathname.startsWith("/admin/maintenance")) return "Maintenance";
  if (pathname.startsWith("/admin/delivery")) return "Delivery";
  if (pathname.startsWith("/admin/roles")) return "Roles";
  if (pathname.startsWith("/admin/settings")) return "Settings";
  if (pathname.startsWith("/admin/invoicing")) return "Invoicing";
  if (pathname.startsWith("/admin/marketing")) return "Marketing";
  if (pathname.startsWith("/admin/website-template")) return "Website Template";
  return "Portal";
};

const getPublicTitle = (pathname) => {
  const path = (pathname || "/").toLowerCase();
  if (path === "/") return "Home";
  if (path.startsWith("/login")) return "Login";
  if (path.startsWith("/about")) return "About";
  if (path.startsWith("/shop")) return "Shop";
  if (path.startsWith("/rentals/")) return "Rental";
  if (path.startsWith("/rentals")) return "Rentals";
  if (path.startsWith("/gallery")) return "Gallery";
  if (path.startsWith("/faq")) return "FAQ";
  if (path.startsWith("/contact")) return "Contact";
  if (path.startsWith("/cart")) return "Cart";
  if (path.startsWith("/checkout")) return "Checkout";
  if (path.startsWith("/book")) return "Book";
  if (path.startsWith("/privacy-policy")) return "Privacy Policy";
  if (path.startsWith("/refund-policy")) return "Refund Policy";
  if (path.startsWith("/delivery-policy")) return "Delivery Policy";
  if (path.startsWith("/terms-of-service")) return "Terms of Service";
  return null;
};

const isPortalHost = () => {
  if (typeof window === "undefined") return false;
  return window.location.hostname === PORTAL_HOST;
};

function MobileRestricted({ children }) {
  const [isMobileView, setIsMobileView] = useState(
    typeof window !== "undefined" && window.matchMedia(MOBILE_VIEW_QUERY).matches
  );

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const mediaQuery = window.matchMedia(MOBILE_VIEW_QUERY);
    const handleChange = () => setIsMobileView(mediaQuery.matches);
    handleChange();
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    }
    mediaQuery.addListener(handleChange);
    return () => mediaQuery.removeListener(handleChange);
  }, []);

  if (isMobileView) {
    return <Navigate to="/admin" replace />;
  }

  return children;
}

function PortalGate({ children }) {
  const location = useLocation();
  if (isPortalHost()) {
    const path = location.pathname || "/";
    const isAllowed = path === "/login" || path.startsWith("/admin");
    if (!isAllowed) {
      return <Navigate to="/admin" replace />;
    }
  }
  return children;
}

function AppLayout() {
  const [cartOpen, setCartOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    if (location.hash) return;
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [location.pathname]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    if (location.pathname.startsWith("/admin")) {
      document.title = `Portal | ${getAdminTitle(location.pathname)}`;
      return;
    }
    const pageTitle = getPublicTitle(location.pathname);
    document.title = pageTitle ? `${pageTitle} | ${DEFAULT_TITLE}` : DEFAULT_TITLE;
  }, [location.pathname]);

  const showPortalSidebar = location.pathname.startsWith("/admin");
  const hideNavbar = location.pathname === "/login";

  const routeTree = (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/privacy-policy" element={<PrivacyPolicy />} />
      <Route path="/refund-policy" element={<RefundPolicy />} />
      <Route path="/delivery-policy" element={<DeliveryPolicy />} />
      <Route path="/terms-of-service" element={<TermsOfService />} />
      <Route path="/Cart" element={<Cart />} />
      <Route path="/Checkout" element={<Checkout />} />
      <Route path="/About" element={<About />} />
      <Route path="/Shop" element={<Shop />} />
      <Route path="/Rentals/:slug" element={<RentalItem />} />
      <Route path="/Rentals" element={<Rentals />} />
      <Route path="/Gallery" element={<Gallery />} />
      <Route path="/faq" element={<FAQ />} />
      <Route path="/Contact" element={<Contact />} />
      <Route path="/Book" element={<Book />} />
      <Route path="/admin" element={<RequireAuth><AdminDashboard /></RequireAuth>} />
      <Route path="/admin/inventory" element={<RequireAuth><Admin /></RequireAuth>} />
      <Route path="/admin/orders" element={<RequireAuth><OrdersList /></RequireAuth>} />
      <Route path="/admin/orders/new" element={<RequireAuth><OrderBuilder /></RequireAuth>} />
      <Route path="/admin/directory" element={<RequireAuth><AdminDirectory /></RequireAuth>} />
      <Route path="/admin/crm" element={<RequireAuth><AdminCustomers /></RequireAuth>} />
      <Route path="/admin/customers" element={<Navigate to="/admin/crm" replace />} />
      <Route path="/admin/users" element={<RequireAuth><AdminDirectory /></RequireAuth>} />
      <Route path="/admin/employees" element={<RequireAuth><AdminDirectory /></RequireAuth>} />
      <Route path="/admin/bookings" element={<RequireAuth><AdminBookings /></RequireAuth>} />
      <Route path="/admin/schedule" element={<RequireAuth><AdminScheduler /></RequireAuth>} />
      <Route
        path="/admin/accounting"
        element={<RequireAuth><RequireRole allowedRoles={["admin", "manager"]}><AdminAccounting /></RequireRole></RequireAuth>}
      />
      <Route path="/admin/expenses" element={<RequireAuth><AdminExpenses /></RequireAuth>} />
      <Route
        path="/admin/hr"
        element={<RequireAuth><RequireRole allowedRoles={["admin", "manager"]}><MobileRestricted><AdminHR /></MobileRestricted></RequireRole></RequireAuth>}
      />
      <Route
        path="/admin/documents"
        element={<RequireAuth><RequireRole allowedRoles={["admin", "manager"]}><MobileRestricted><AdminDocuments /></MobileRestricted></RequireRole></RequireAuth>}
      />
      <Route path="/admin/timesheets" element={<RequireAuth><AdminTimesheets /></RequireAuth>} />
      <Route path="/admin/vendors" element={<RequireAuth><AdminVendors /></RequireAuth>} />
      <Route path="/admin/maintenance" element={<RequireAuth><AdminMaintenance /></RequireAuth>} />
      <Route path="/admin/delivery" element={<RequireAuth><AdminDelivery /></RequireAuth>} />
      <Route
        path="/admin/roles"
        element={<RequireAuth><RequireRole allowedRoles={["admin", "manager"]}><MobileRestricted><AdminRoles /></MobileRestricted></RequireRole></RequireAuth>}
      />
      <Route
        path="/admin/settings"
        element={<RequireAuth><RequireRole allowedRoles={["admin", "manager"]}><MobileRestricted><AdminSettings /></MobileRestricted></RequireRole></RequireAuth>}
      />
      <Route path="/admin/invoicing" element={<RequireAuth><AdminInvoicing /></RequireAuth>} />
      <Route
        path="/admin/marketing"
        element={<RequireAuth><RequireRole allowedRoles={["admin", "manager"]}><MobileRestricted><AdminMarketing /></MobileRestricted></RequireRole></RequireAuth>}
      />
      <Route
        path="/admin/website-template"
        element={<RequireAuth><RequireRole allowedRoles={["admin"]}><WebsiteTemplateEditor /></RequireRole></RequireAuth>}
      />
    </Routes>
  );

  return (
    <AuthProvider>
      <TemplateConfigProvider>
        <CartProvider>
          <PortalGate>
            {showPortalSidebar ? (
              <div className="portal-app-shell">
                <PortalSidebar />
                <div className="portal-app-content">{routeTree}</div>
              </div>
            ) : (
              <>
                {!hideNavbar && <Navbar onCartToggle={() => setCartOpen(true)} />}
                {routeTree}
              </>
            )}
          </PortalGate>
          <CartOverlay
            open={cartOpen}
            onClose={() => setCartOpen(false)}
            convertPrice={(p) => p}
            formatCurrency={(p) => p}
          />
          <BackToTop />
          <Footer />
        </CartProvider>
      </TemplateConfigProvider>
    </AuthProvider>
  );
}

function App() {
  return (
    <ClickSpark
          sparkColor='#f1620b'
          sparkSize={14}
          sparkRadius={25}
          sparkCount={8}
          duration={400}
        >
        <Router>
          <AppLayout />
        </Router>
    </ClickSpark>
  );
}
export default App;
