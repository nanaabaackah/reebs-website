import React, { useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBars,
  faBullhorn,
  faCalendarAlt,
  faCalendarDays,
  faChartLine,
  faClock,
  faClipboardList,
  faFileInvoiceDollar,
  faFileLines,
  faHome,
  faMoneyCheckDollar,
  faShieldAlt,
  faSliders,
  faStore,
  faTools,
  faTruck,
  faUserGroup,
  faUserTie,
  faUsers,
  faChevronLeft,
  faBoxesStacked,
} from "@fortawesome/free-solid-svg-icons";

import "./PortalSidebar.css";

const DEFAULT_APPS = [
  {
    label: "Dashboard",
    path: "/admin",
    matchPaths: ["/admin"],
    icon: faHome,
  },
  {
    label: "Inventory",
    path: "/admin/inventory",
    icon: faBoxesStacked,
  },
  {
    label: "Orders",
    path: "/admin/orders",
    matchPaths: ["/admin/orders", "/admin/orders/new"],
    icon: faClipboardList,
  },
  {
    label: "CRM",
    path: "/admin/crm",
    matchPaths: ["/admin/crm", "/admin/users", "/admin/employees"],
    icon: faUsers,
  },
  {
    label: "Bookings",
    path: "/admin/bookings",
    icon: faCalendarDays,
  },
  {
    label: "Scheduling",
    path: "/admin/schedule",
    icon: faCalendarAlt,
  },
  {
    label: "Accounting",
    path: "/admin/accounting",
    icon: faChartLine,
  },
  {
    label: "Expenses",
    path: "/admin/expenses",
    icon: faMoneyCheckDollar,
  },
  {
    label: "Human Resources",
    path: "/admin/hr",
    icon: faUserTie,
  },
  {
    label: "Documents",
    path: "/admin/documents",
    icon: faFileLines,
  },
  {
    label: "Timesheets",
    path: "/admin/timesheets",
    icon: faClock,
  },
  {
    label: "Vendors",
    path: "/admin/vendors",
    icon: faStore,
  },
  {
    label: "Maintenance",
    path: "/admin/maintenance",
    icon: faTools,
  },
  {
    label: "Delivery",
    path: "/admin/delivery",
    icon: faTruck,
  },
  {
    label: "Roles",
    path: "/admin/roles",
    icon: faShieldAlt,
  },
  {
    label: "Settings",
    path: "/admin/settings",
    icon: faSliders,
  },
  {
    label: "Customers",
    path: "/admin/customers",
    icon: faUserGroup,
  },
  {
    label: "Invoicing",
    path: "/admin/invoicing",
    icon: faFileInvoiceDollar,
  },
  {
    label: "Marketing",
    path: "/admin/marketing",
    icon: faBullhorn,
  },
];

const normalizePath = (pathname) => {
  if (!pathname) return "/admin";
  const trimmed = pathname.replace(/\/+$/, "");
  return trimmed || "/admin";
};

function PortalSidebar({ apps = DEFAULT_APPS }) {
  const location = useLocation();
  const [expanded, setExpanded] = useState(false);

  const normalizedPath = useMemo(() => normalizePath(location.pathname), [location.pathname]);

  const isActive = (app) => {
    const matchPaths = app.matchPaths ?? [app.path];
    return matchPaths.some((path) => {
      if (!path) return false;
      const normalized = path.replace(/\/+$/, "") || "/admin";
      return (
        normalized === normalizedPath ||
        (normalized !== "/" && normalizedPath.startsWith(normalized))
      );
    });
  };

  return (
    <aside className={`portal-sidebar ${expanded ? "is-expanded" : ""}`} aria-label="Portal navigation">
      <div className="portal-sidebar__toggle">
        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          className="portal-sidebar__toggle-btn"
        >
          <FontAwesomeIcon icon={expanded ? faChevronLeft : faBars} />
          <span>{expanded ? "Collapse" : "Explore"}</span>
        </button>
      </div>
      <div className="portal-sidebar__logo">
        <img src="/imgs/reebs_logo.png" alt="REEBS Party Themes" loading="lazy" />
      </div>
      <nav className="portal-sidebar__nav" aria-label="Portal apps">
        <ul>
          {apps.map((app) => (
            <li key={app.label} className={isActive(app) ? "is-active" : undefined}>
              <Link to={app.path} className="portal-sidebar__link">
                <FontAwesomeIcon icon={app.icon} />
                <span>{app.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}

export default PortalSidebar;
