import React, { Suspense, lazy, useEffect, useRef, useState } from "react";
import { BrowserRouter as Router, Link, Navigate, Route, Routes, useLocation } from "react-router-dom";
import AuthProvider, { useAuth } from "./components/AuthContext";
import { CartProvider } from "./components/CartContext";
import { TemplateConfigProvider } from "./context/TemplateConfigContext";
import BackToTop from "./components/BackToTop";
import { AppIcon } from "./components/Icon";
import SiteLoader from "./components/SiteLoader";
import Navbar from "./components/Navbar";
import CartOverlay from "./components/CartOverlay";
import PartyConfetti from "./components/PartyConfetti";
import { faArrowRight } from "./icons/iconSet";
import useScrollReveal from "./hooks/useScrollReveal";
import { applySeo } from "./utils/seo";

const Home = lazy(() => import("./pages/Home"));
const Footer = lazy(() => import("./components/Footer"));
const PortalSidebar = lazy(() => import("./components/PortalSidebar"));
const AdminBottomNav = lazy(() => import("./components/AdminBottomNav"));

const Login = lazy(() => import("./pages/Login"));
const Admin = lazy(() => import("./pages/Admin"));
const AdminWorkspace = lazy(() => import("./pages/AdminWorkspace"));
const OrdersList = lazy(() => import("./pages/OrdersList"));
const OrderBuilder = lazy(() => import("./pages/OrderBuilder"));
const AdminCustomers = lazy(() => import("./pages/AdminCustomers"));
const About = lazy(() => import("./pages/About"));
const Book = lazy(() => import("./pages/Book"));
const Cart = lazy(() => import("./pages/Cart"));
const Checkout = lazy(() => import("./pages/Checkout"));
const Contact = lazy(() => import("./pages/Contact"));
const DeliveryPolicy = lazy(() => import("./pages/delivery-policy"));
const FAQ = lazy(() => import("./pages/faq"));
const PrivacyPolicy = lazy(() => import("./pages/privacy-policy"));
const RefundPolicy = lazy(() => import("./pages/refund-policy"));
const Rentals = lazy(() => import("./pages/Rentals"));
const RentalItem = lazy(() => import("./pages/RentalItem"));
const TermsOfService = lazy(() => import("./pages/terms-of-service"));
const Shop = lazy(() => import("./pages/Shop"));
const WebsiteTemplateEditor = lazy(() => import("./pages/WebsiteTemplateEditor"));

const AdminDirectory = lazy(() => import("./pages/AdminDirectory"));
const AdminAccounting = lazy(() => import("./pages/AdminAccounting"));
const AdminExpenses = lazy(() => import("./pages/AdminExpenses"));
const AdminWater = lazy(() => import("./pages/AdminWater"));
const AdminVendors = lazy(() => import("./pages/AdminVendors"));
const AdminDelivery = lazy(() => import("./pages/AdminDelivery"));
const AdminDocuments = lazy(() => import("./pages/AdminDocuments"));
const AdminTimesheets = lazy(() => import("./pages/AdminTimesheets"));
const AdminSettings = lazy(() => import("./pages/AdminSettings"));
const AdminHR = lazy(() => import("./pages/AdminHR"));
const AdminRoles = lazy(() => import("./pages/AdminRoles"));
const AdminMaintenance = lazy(() => import("./pages/AdminMaintenance"));
const AdminInvoicing = lazy(() => import("./pages/AdminInvoicing"));
const AdminMarketing = lazy(() => import("./pages/AdminMarketing"));
const AdminScheduler = lazy(() => import("./pages/AdminScheduler"));
const AdminBookings = lazy(() => import("./pages/AdminBookings"));

const normalizeRole = (role) => String(role || "").trim().toLowerCase();

function RouteFallback() {
  return (
    <SiteLoader
      compact
      label="Loading page"
      sublabel="Setting up your next view."
    />
  );
}

function RequireAuth({ children }) {
  const { user, authReady } = useAuth();
  const location = useLocation();
  if (!authReady) return <RouteFallback />;
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  const normalizedPath = location.pathname.toLowerCase();
  const role = normalizeRole(user?.role);
  if (role === "water" && normalizedPath.startsWith("/admin") && normalizedPath !== "/admin/water") {
    return <Navigate to="/admin/water" replace />;
  }
  return children;
}

function RequireRole({ allowedRoles = [], children }) {
  const { user, authReady } = useAuth();
  if (!authReady) return <RouteFallback />;
  if (!allowedRoles.length) return children;
  const role = normalizeRole(user?.role);
  const canAccess = allowedRoles.some((allowed) => normalizeRole(allowed) === role);
  if (!canAccess) return <Navigate to="/admin" replace />;
  return children;
}

function PublicOnly({ children }) {
  const { user, authReady } = useAuth();
  if (!authReady) return <RouteFallback />;
  if (user) return <Navigate to="/admin" replace />;
  return children;
}

function DefaultRedirect() {
  const { user, authReady } = useAuth();
  if (!authReady) return <RouteFallback />;
  return <Navigate to={user ? "/admin" : "/"} replace />;
}

const toTitleCase = (value = "") =>
  value
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const getAdminPageTitle = (pathname = "") => {
  const normalized = pathname.toLowerCase();
  if (normalized === "/admin") return "Admin Dashboard | REEBS Party Themes";
  if (normalized.startsWith("/admin/orders/new")) return "New Order Builder | REEBS Party Themes";

  const adminTitleMap = {
    "/admin/inventory": "Admin Inventory | REEBS Party Themes",
    "/admin/purchases": "Admin Purchases | REEBS Party Themes",
    "/admin/offline": "Admin Offline Sales | REEBS Party Themes",
    "/admin/advanced": "Admin Advanced Tools | REEBS Party Themes",
    "/admin/orders": "Admin Orders | REEBS Party Themes",
    "/admin/crm": "Admin CRM | REEBS Party Themes",
    "/admin/customers": "Admin CRM | REEBS Party Themes",
    "/admin/users": "Admin Directory | REEBS Party Themes",
    "/admin/employees": "Admin Directory | REEBS Party Themes",
    "/admin/directory": "Admin Directory | REEBS Party Themes",
    "/admin/accounting": "Admin Accounting | REEBS Party Themes",
    "/admin/expenses": "Admin Expenses | REEBS Party Themes",
    "/admin/water": "Water Module | REEBS Party Themes",
    "/admin/vendors": "Admin Vendors | REEBS Party Themes",
    "/admin/delivery": "Admin Delivery | REEBS Party Themes",
    "/admin/documents": "Admin Documents | REEBS Party Themes",
    "/admin/timesheets": "Admin Timesheets | REEBS Party Themes",
    "/admin/settings": "Admin Settings | REEBS Party Themes",
    "/admin/hr": "Admin HR | REEBS Party Themes",
    "/admin/roles": "Admin Roles | REEBS Party Themes",
    "/admin/maintenance": "Admin Maintenance | REEBS Party Themes",
    "/admin/invoicing": "Admin Invoicing | REEBS Party Themes",
    "/admin/marketing": "Admin Marketing | REEBS Party Themes",
    "/admin/schedule": "Admin Schedule | REEBS Party Themes",
    "/admin/bookings": "Admin Bookings | REEBS Party Themes",
    "/admin/website-template": "Admin Website Template | REEBS Party Themes",
  };

  if (adminTitleMap[normalized]) return adminTitleMap[normalized];

  const section = normalized
    .replace("/admin/", "")
    .split("/")
    .filter(Boolean)
    .map((part) => toTitleCase(part))
    .join(" - ");
  return section
    ? `${section} | REEBS Party Themes`
    : "Admin Portal | REEBS Party Themes";
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/about" element={<About />} />
      <Route path="/book" element={<Book />} />
      <Route path="/cart" element={<Cart />} />
      <Route path="/checkout" element={<Checkout />} />
      <Route path="/contact" element={<Contact />} />
      <Route
        path="/customer-login"
        element={
          <PublicOnly>
            <Login mode="customer" />
          </PublicOnly>
        }
      />
      <Route path="/delivery-policy" element={<DeliveryPolicy />} />
      <Route path="/faq" element={<FAQ />} />
      <Route path="/gallery" element={<Navigate to="/about" replace />} />
      <Route path="/home" element={<Home />} />
      <Route path="/privacy-policy" element={<PrivacyPolicy />} />
      <Route path="/refund-policy" element={<RefundPolicy />} />
      <Route path="/rentals" element={<Rentals />} />
      <Route path="/rentals/:slug" element={<RentalItem />} />
      <Route path="/shop" element={<Shop />} />
      <Route path="/terms-of-service" element={<TermsOfService />} />
      <Route path="/website-template" element={<WebsiteTemplateEditor />} />

      <Route
        path="/login"
        element={
          <PublicOnly>
            <Login />
          </PublicOnly>
        }
      />

      <Route path="/admin" element={<RequireAuth><AdminWorkspace section="home" /></RequireAuth>} />
      <Route
        path="/admin/inventory"
        element={<RequireAuth><Admin /></RequireAuth>}
      />
      <Route
        path="/admin/purchases"
        element={<RequireAuth><AdminWorkspace section="purchases" /></RequireAuth>}
      />
      <Route
        path="/admin/offline"
        element={<RequireAuth><AdminWorkspace section="offline" /></RequireAuth>}
      />
      <Route
        path="/admin/advanced"
        element={
          <RequireAuth>
            <RequireRole allowedRoles={["admin", "manager"]}>
              <AdminWorkspace section="advanced" />
            </RequireRole>
          </RequireAuth>
        }
      />

      <Route path="/admin/orders" element={<RequireAuth><OrdersList /></RequireAuth>} />
      <Route path="/admin/orders/new" element={<RequireAuth><OrderBuilder /></RequireAuth>} />
      <Route path="/admin/crm" element={<RequireAuth><AdminCustomers /></RequireAuth>} />
      <Route path="/admin/customers" element={<Navigate to="/admin/crm" replace />} />
      <Route path="/admin/users" element={<RequireAuth><AdminDirectory /></RequireAuth>} />
      <Route path="/admin/employees" element={<RequireAuth><AdminDirectory /></RequireAuth>} />
      <Route path="/admin/website-template" element={<Navigate to="/admin/advanced" replace />} />

      <Route
        path="/admin/directory"
        element={<RequireAuth><AdminDirectory /></RequireAuth>}
      />
      <Route
        path="/admin/accounting"
        element={
          <RequireAuth>
            <RequireRole allowedRoles={["admin", "manager"]}>
              <AdminAccounting />
            </RequireRole>
          </RequireAuth>
        }
      />
      <Route
        path="/admin/expenses"
        element={<RequireAuth><AdminExpenses /></RequireAuth>}
      />
      <Route
        path="/admin/water"
        element={<RequireAuth><AdminWater /></RequireAuth>}
      />
      <Route
        path="/admin/vendors"
        element={<RequireAuth><AdminVendors /></RequireAuth>}
      />
      <Route
        path="/admin/delivery"
        element={<RequireAuth><AdminDelivery /></RequireAuth>}
      />
      <Route
        path="/admin/documents"
        element={
          <RequireAuth>
            <RequireRole allowedRoles={["admin", "manager"]}>
              <AdminDocuments />
            </RequireRole>
          </RequireAuth>
        }
      />
      <Route
        path="/admin/timesheets"
        element={<RequireAuth><AdminTimesheets /></RequireAuth>}
      />
      <Route
        path="/admin/settings"
        element={
          <RequireAuth>
            <RequireRole allowedRoles={["admin", "manager"]}>
              <AdminSettings />
            </RequireRole>
          </RequireAuth>
        }
      />
      <Route
        path="/admin/hr"
        element={
          <RequireAuth>
            <RequireRole allowedRoles={["admin", "manager"]}>
              <AdminHR />
            </RequireRole>
          </RequireAuth>
        }
      />
      <Route
        path="/admin/roles"
        element={
          <RequireAuth>
            <RequireRole allowedRoles={["admin", "manager"]}>
              <AdminRoles />
            </RequireRole>
          </RequireAuth>
        }
      />
      <Route
        path="/admin/maintenance"
        element={<RequireAuth><AdminMaintenance /></RequireAuth>}
      />
      <Route
        path="/admin/invoicing"
        element={
          <RequireAuth>
            <RequireRole allowedRoles={["admin", "manager"]}>
              <AdminInvoicing />
            </RequireRole>
          </RequireAuth>
        }
      />
      <Route
        path="/admin/marketing"
        element={
          <RequireAuth>
            <RequireRole allowedRoles={["admin", "manager"]}>
              <AdminMarketing />
            </RequireRole>
          </RequireAuth>
        }
      />
      <Route
        path="/admin/schedule"
        element={<RequireAuth><AdminScheduler /></RequireAuth>}
      />
      <Route
        path="/admin/bookings"
        element={<RequireAuth><AdminBookings /></RequireAuth>}
      />

      <Route path="/" element={<Home />} />
      <Route path="*" element={<DefaultRedirect />} />
    </Routes>
  );
}

function App() {
  function AppLayout() {
    const location = useLocation();
    const publicScrollRef = useRef(null);
    const [showShellCta, setShowShellCta] = useState(false);
    const pathname = location.pathname.toLowerCase();
    const isAdminRoute = pathname.startsWith("/admin");
    const isAuthRoute = pathname === "/login" || pathname === "/customer-login";
    const isHomeRoute = pathname === "/" || pathname === "/home";
    const routes = (
      <Suspense fallback={<RouteFallback />}>
        <AppRoutes />
      </Suspense>
    );

    useScrollReveal(pathname, publicScrollRef);

    useEffect(() => {
      if (isAdminRoute) {
        applySeo({
          pathname: location.pathname,
          title: getAdminPageTitle(location.pathname),
          description: "Secure internal workspace for REEBS team operations.",
          noIndex: true,
          schema: null,
        });
        return;
      }

      if (isAuthRoute) {
        const isCustomerLogin = pathname === "/customer-login";
        applySeo({
          pathname: location.pathname,
          title: isCustomerLogin
            ? "Customer Login | REEBS Party Themes"
            : "Staff Login | REEBS Party Themes",
          description: isCustomerLogin
            ? "Customer access page for returning booking and checkout visitors."
            : "Secure sign-in for REEBS administrators and staff.",
          noIndex: true,
          schema: null,
        });
        return;
      }

      const noIndexPaths = new Set(["/cart", "/checkout", "/customer-login", "/home"]);
      applySeo({
        pathname: location.pathname,
        noIndex: noIndexPaths.has(pathname),
      });
    }, [isAdminRoute, isAuthRoute, location.pathname, pathname]);

    useEffect(() => {
      if (typeof window === "undefined" || typeof document === "undefined") return undefined;

      const root = document.documentElement;
      if (!isAdminRoute) {
        root.removeAttribute("data-admin-theme");
        return undefined;
      }

      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      const syncAdminTheme = () => {
        root.setAttribute("data-admin-theme", mediaQuery.matches ? "dark" : "light");
      };

      syncAdminTheme();

      if (mediaQuery.addEventListener) {
        mediaQuery.addEventListener("change", syncAdminTheme);
      } else {
        mediaQuery.addListener(syncAdminTheme);
      }

      return () => {
        if (mediaQuery.removeEventListener) {
          mediaQuery.removeEventListener("change", syncAdminTheme);
        } else {
          mediaQuery.removeListener(syncAdminTheme);
        }
        root.removeAttribute("data-admin-theme");
      };
    }, [isAdminRoute]);

    useEffect(() => {
      if (typeof window === "undefined" || !window.history) return undefined;
      if (!("scrollRestoration" in window.history)) return undefined;

      const previous = window.history.scrollRestoration;
      window.history.scrollRestoration = "manual";
      return () => {
        window.history.scrollRestoration = previous;
      };
    }, []);

    useEffect(() => {
      if (typeof window === "undefined" || typeof document === "undefined") return;

      window.scrollTo({ top: 0, left: 0, behavior: "auto" });

      if (isAdminRoute) {
        const adminContent = document.querySelector(".portal-app-content");
        if (adminContent instanceof HTMLElement) {
          adminContent.scrollTo({ top: 0, left: 0, behavior: "auto" });
        }
        return;
      }

      const scrollHost = publicScrollRef.current;
      if (scrollHost) {
        scrollHost.scrollTo({ top: 0, left: 0, behavior: "auto" });
      }
    }, [location.pathname, location.search, isAdminRoute]);

    useEffect(() => {
      if (typeof document === "undefined") return undefined;
      if (isAdminRoute) {
        document.documentElement.style.setProperty("--scroll-progress", "0");
        setShowShellCta(false);
        return undefined;
      }

      const scrollHost = publicScrollRef.current;
      if (!scrollHost) return undefined;
      const heroSection = isHomeRoute ? scrollHost.querySelector("#hero-section") : null;
      const footerSection = isHomeRoute ? scrollHost.querySelector(".site-footer") : null;

      const updateScrollProgress = () => {
        const maxScroll = scrollHost.scrollHeight - scrollHost.clientHeight;
        const progress = maxScroll > 0 ? scrollHost.scrollTop / maxScroll : 0;
        const bounded = Math.max(0, Math.min(1, progress));
        document.documentElement.style.setProperty("--scroll-progress", bounded.toFixed(4));

        if (!heroSection) {
          setShowShellCta(false);
          return;
        }

        const revealAfter = Math.max(220, heroSection.offsetHeight - 120);
        const viewportBottom = scrollHost.scrollTop + scrollHost.clientHeight;
        const footerTop = footerSection?.offsetTop ?? Number.POSITIVE_INFINITY;
        const footerVisible = viewportBottom >= footerTop;
        const shouldShow = scrollHost.scrollTop > revealAfter && !footerVisible;
        setShowShellCta((prev) => (prev === shouldShow ? prev : shouldShow));
      };

      updateScrollProgress();
      scrollHost.addEventListener("scroll", updateScrollProgress, { passive: true });
      return () => scrollHost.removeEventListener("scroll", updateScrollProgress);
    }, [isAdminRoute, isHomeRoute, location.pathname]);

    if (isAdminRoute) {
      return (
        <div className="portal-app-shell">
          <Suspense fallback={<RouteFallback />}>
            <PortalSidebar />
          </Suspense>
          <div className="portal-app-content">{routes}</div>
          <Suspense fallback={null}>
            <AdminBottomNav />
          </Suspense>
        </div>
      );
    }

    return (
      <div className="site-shell">
        <div className={`main ${showShellCta ? "has-shell-cta" : ""}`} ref={publicScrollRef}>
          <PartyConfetti className="site-shell-confetti party-confetti-rentals" />
          <Navbar scrollContainerRef={publicScrollRef} />
          {routes}
          <Suspense fallback={null}>
            <Footer />
          </Suspense>
          <BackToTop scrollContainerRef={publicScrollRef} />
          <CartOverlay />
        </div>
        {isHomeRoute && (
          <div className={`shell-bottom-cta ${showShellCta ? "is-visible" : ""}`} aria-hidden={!showShellCta}>
            <div className="shell-bottom-cta-corner shell-bottom-cta-corner-left" aria-hidden="true">
              <svg viewBox="0 0 44 44" focusable="false" role="presentation">
                <path d="M0 0H44V44C34.7 -16 0 24.3 0 0Z" />
              </svg>
            </div>
            <div className="shell-bottom-cta-corner shell-bottom-cta-corner-right" aria-hidden="true">
              <svg viewBox="0 0 44 44" focusable="false" role="presentation">
                <path d="M0 0H44V44C34.7 -16 0 24.3 0 0Z" />
              </svg>
            </div>
            <Link to="/rentals" className="shell-bottom-cta-btn shell-bottom-cta-btn-book">
              <span>Book your party</span>
              <AppIcon icon={faArrowRight} />
            </Link>
            <Link to="/shop"
              className="shell-bottom-cta-btn shell-bottom-cta-btn-dark"
            >
              <span>Explore our shop</span>
              <AppIcon icon={faArrowRight} />
            </Link>
          </div>
        )}
      </div>
    );
  }

  return (
    <Router>
      <CartProvider>
        <TemplateConfigProvider>
          <AuthProvider>
            <AppLayout />
          </AuthProvider>
        </TemplateConfigProvider>
      </CartProvider>
    </Router>
  );
}

export default App;
