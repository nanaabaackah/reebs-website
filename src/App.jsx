import React, { Suspense, lazy } from "react";
import { BrowserRouter as Router, Navigate, Route, Routes, useLocation } from "react-router-dom";
import AuthProvider, { useAuth } from "./components/AuthContext";
import { CartProvider } from "./components/CartContext";
import PortalSidebar from "./components/PortalSidebar";
import Login from "./pages/Login";
import Admin from "./pages/Admin";
import AdminWorkspace from "./pages/AdminWorkspace";
import OrdersList from "./pages/OrdersList";
import OrderBuilder from "./pages/OrderBuilder";
import AdminCustomers from "./pages/AdminCustomers";

const AdminDirectory = lazy(() => import("./pages/AdminDirectory"));
const AdminAccounting = lazy(() => import("./pages/AdminAccounting"));
const AdminExpenses = lazy(() => import("./pages/AdminExpenses"));
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
    <div className="route-fallback" role="status" aria-live="polite">
      Loading page...
    </div>
  );
}

function RequireAuth({ children }) {
  const { user, authReady } = useAuth();
  const location = useLocation();
  if (!authReady) return <RouteFallback />;
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
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

function DefaultRedirect() {
  const { user, authReady } = useAuth();
  if (!authReady) return <RouteFallback />;
  return <Navigate to={user ? "/admin" : "/login"} replace />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

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

      <Route path="/" element={<DefaultRedirect />} />
      <Route path="*" element={<DefaultRedirect />} />
    </Routes>
  );
}

function App() {
  function AppLayout() {
    const location = useLocation();
    const isAdminRoute = location.pathname.startsWith("/admin");
    const routes = (
      <Suspense fallback={<RouteFallback />}>
        <AppRoutes />
      </Suspense>
    );
    if (!isAdminRoute) return routes;
    return (
      <div className="portal-app-shell">
        <PortalSidebar />
        <div className="portal-app-content">{routes}</div>
      </div>
    );
  }

  return (
    <Router>
      <CartProvider>
        <AuthProvider>
          <AppLayout />
        </AuthProvider>
      </CartProvider>
    </Router>
  );
}

export default App;
