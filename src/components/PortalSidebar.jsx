import React, { useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBars,
  faBullhorn,
  faCalendarDays,
  faChartLine,
  faClock,
  faClipboardList,
  faFileInvoiceDollar,
  faFileLines,
  faGlobe,
  faHome,
  faMoneyCheckDollar,
  faMoon,
  faPenToSquare,
  faShieldAlt,
  faSliders,
  faStore,
  faSun,
  faTools,
  faTruck,
  faUserGroup,
  faUserTie,
  faUsers,
  faChevronLeft,
  faBoxesStacked,
  faCalendarCheck,
} from "@fortawesome/free-solid-svg-icons";

import "./PortalSidebar.css";
import useThemeMode from "../hooks/useThemeMode";
import { WEBSITE_URL } from "../utils/website";

const DEFAULT_APPS = [
  {
    label: "Dashboard",
    path: "/admin",
    matchPaths: ["/admin"],
    icon: faHome,
  },
  {
    label: "Website",
    path: WEBSITE_URL,
    icon: faGlobe,
    external: true,
    description: "Open the public website",
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
    icon: faCalendarCheck,
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
  {
    label: "Template mode",
    path: "/admin/website-template",
    icon: faPenToSquare,
    matchPaths: ["/admin/website-template"],
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
  const { darkMode, toggleTheme } = useThemeMode();

  const normalizedPath = useMemo(() => normalizePath(location.pathname), [location.pathname]);

  const isActive = (app) => {
    if (app.external) return false;
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
      <nav className="portal-sidebar__nav" aria-label="Portal apps">
        <ul>
          {apps.map((app) => {
            const active = isActive(app);
            const commonClass = ["portal-sidebar__link", active ? "is-active" : "", app.external ? "portal-sidebar__link--external" : ""]
              .filter(Boolean)
              .join(" ");
            return (
              <li key={app.label} className={active ? "is-active" : undefined}>
                {app.external ? (
                  <a
                    href={app.path}
                    target="_blank"
                    rel="noreferrer"
                    className={commonClass}
                    aria-label={`${app.label}: ${app.description || "Opens in new tab"}`}
                  >
                    <FontAwesomeIcon icon={app.icon} />
                    <span>{app.label}</span>
                  </a>
                ) : (
                  <Link to={app.path} className={commonClass}>
                    <FontAwesomeIcon icon={app.icon} />
                    <span>{app.label}</span>
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="portal-sidebar__theme-toggle">
        <button
          type="button"
          className="portal-sidebar__theme-toggle-btn"
          onClick={toggleTheme}
          aria-label={`Switch to ${darkMode ? "light" : "dark"} mode`}
        >
          <FontAwesomeIcon icon={darkMode ? faSun : faMoon} />
          <span>{darkMode ? "Light mode" : "Dark mode"}</span>
        </button>
      </div>
    </aside>
  );
}

export default PortalSidebar;
