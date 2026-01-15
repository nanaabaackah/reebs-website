import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import ClickSpark from './components/ClickSpark';

import { CartProvider } from "./components/CartContext";
import Navbar from "./components/Navbar";
import CartOverlay from "./components/CartOverlay";
import BackToTop from "./components/BackToTop";

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
import Login from './pages/Login';
import AuthProvider, { useAuth } from './components/AuthContext';

function RequireAuth({ children }) {
  const { user, authReady } = useAuth();
  const location = useLocation();

  if (!authReady) return null;
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return children;
}

const MOBILE_VIEW_QUERY = "(max-width: 720px)";
const PORTAL_HOST = "portal.reebspartythemes.com";

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
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [location.pathname]);

  return (
    <>
     <AuthProvider>
     <CartProvider>
        <Navbar onCartToggle={() => setCartOpen(true)} />
       
          <PortalGate>
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
              <Route path="/admin/crm" element={<RequireAuth><AdminDirectory /></RequireAuth>} />
              <Route path="/admin/users" element={<RequireAuth><AdminDirectory /></RequireAuth>} />
              <Route path="/admin/employees" element={<RequireAuth><AdminDirectory /></RequireAuth>} />
              <Route path="/admin/bookings" element={<RequireAuth><AdminBookings /></RequireAuth>} />
              <Route path="/admin/schedule" element={<RequireAuth><AdminScheduler /></RequireAuth>} />
              <Route path="/admin/accounting" element={<RequireAuth><AdminAccounting /></RequireAuth>} />
              <Route path="/admin/expenses" element={<RequireAuth><AdminExpenses /></RequireAuth>} />
              <Route
                path="/admin/hr"
                element={<RequireAuth><MobileRestricted><AdminHR /></MobileRestricted></RequireAuth>}
              />
              <Route
                path="/admin/documents"
                element={<RequireAuth><MobileRestricted><AdminDocuments /></MobileRestricted></RequireAuth>}
              />
              <Route path="/admin/timesheets" element={<RequireAuth><AdminTimesheets /></RequireAuth>} />
              <Route path="/admin/vendors" element={<RequireAuth><AdminVendors /></RequireAuth>} />
              <Route path="/admin/maintenance" element={<RequireAuth><AdminMaintenance /></RequireAuth>} />
              <Route path="/admin/delivery" element={<RequireAuth><AdminDelivery /></RequireAuth>} />
              <Route
                path="/admin/roles"
                element={<RequireAuth><MobileRestricted><AdminRoles /></MobileRestricted></RequireAuth>}
              />
              <Route
                path="/admin/settings"
                element={<RequireAuth><MobileRestricted><AdminSettings /></MobileRestricted></RequireAuth>}
              />
              <Route path="/admin/customers" element={<RequireAuth><AdminCustomers /></RequireAuth>} />
              <Route path="/admin/invoicing" element={<RequireAuth><AdminInvoicing /></RequireAuth>} />
              <Route
                path="/admin/marketing"
                element={<RequireAuth><MobileRestricted><AdminMarketing /></MobileRestricted></RequireAuth>}
              />
          </Routes>
          </PortalGate>
          <CartOverlay 
            open={cartOpen} 
            onClose={() => setCartOpen(false)} 
            convertPrice={(p) => p} // pass your conversion fn
            formatCurrency={(p) => p} // pass your format fn
          />
          <BackToTop />
        <Footer />
      </CartProvider>
      </AuthProvider>
      
    </>
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
