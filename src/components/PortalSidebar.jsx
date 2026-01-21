import React, { useMemo, useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
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
  faXmark,
  faArrowRightFromBracket,
} from "@fortawesome/free-solid-svg-icons";

import "./PortalSidebar.css";
import useThemeMode from "../hooks/useThemeMode";
import { useAuth } from "./AuthContext";
import { WEBSITE_URL } from "../utils/website";

const MOBILE_QUERY = "(max-width: 720px)";

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
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia(MOBILE_QUERY).matches;
  });
  const [overlayOpen, setOverlayOpen] = useState(false);
  const { darkMode, toggleTheme } = useThemeMode();
  const { logout } = useAuth();

  const normalizedPath = useMemo(() => normalizePath(location.pathname), [location.pathname]);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const media = window.matchMedia(MOBILE_QUERY);
    const handleChange = () => setIsMobile(media.matches);
    handleChange();
    if (media.addEventListener) {
      media.addEventListener("change", handleChange);
    } else {
      media.addListener(handleChange);
    }
    return () => {
      if (media.removeEventListener) {
        media.removeEventListener("change", handleChange);
      } else {
        media.removeListener(handleChange);
      }
    };
  }, []);

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

  const renderLinks = (context = "sidebar") => (
    <ul className={`portal-sidebar__list portal-sidebar__list--${context}`}>
      {apps.map((app) => {
        const active = isActive(app);
        const linkClasses = [
          "portal-sidebar__link",
          context === "overlay" ? "portal-sidebar__link--overlay" : "",
          active ? "is-active" : "",
          app.external ? "portal-sidebar__link--external" : "",
        ]
          .filter(Boolean)
          .join(" ");
        if (app.external) {
          return (
            <li key={app.label} className={active ? "is-active" : undefined}>
              <a
                href={app.path}
                target="_blank"
                rel="noreferrer"
                className={linkClasses}
                aria-label={`${app.label}: ${app.description || "Opens in new tab"}`}
                onClick={() => isMobile && setOverlayOpen(false)}
              >
                <FontAwesomeIcon icon={app.icon} />
                <span>{app.label}</span>
              </a>
            </li>
          );
        }
        return (
          <li key={app.label} className={active ? "is-active" : undefined}>
            <Link
              to={app.path}
              className={linkClasses}
              onClick={() => isMobile && overlayOpen && setOverlayOpen(false)}
            >
              <FontAwesomeIcon icon={app.icon} />
              <span>{app.label}</span>
            </Link>
          </li>
        );
      })}
    </ul>
  );

  const handleSignOut = () => {
    logout();
    if (isMobile) {
      setOverlayOpen(false);
    }
    navigate("/login", { replace: true, state: { signedOut: true } });
  };

  return (
    <aside className={`portal-sidebar ${expanded ? "is-expanded" : ""}`} aria-label="Portal navigation">
      <div className="portal-sidebar__toggle">
        <button
          type="button"
          onClick={() => {
            if (isMobile) {
              setOverlayOpen(true);
              return;
            }
            setExpanded((prev) => !prev);
          }}
          className="portal-sidebar__toggle-btn"
          aria-label={isMobile ? "Open menu" : "Toggle navigation"}
        >
          <FontAwesomeIcon icon={expanded ? faChevronLeft : faBars} />
          {!isMobile && <span>{expanded ? "Collapse" : "Explore"}</span>}
        </button>
      </div>
      {!isMobile && <nav className="portal-sidebar__nav" aria-label="Portal apps">{renderLinks()}</nav>}
      {!isMobile && (
        <div className="portal-sidebar__actions">
          <button
            type="button"
            className="portal-sidebar__signout-btn"
            onClick={handleSignOut}
          >
            <FontAwesomeIcon icon={faArrowRightFromBracket} />
            <span>Sign out</span>
          </button>
        </div>
      )}
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
      {isMobile && overlayOpen && (
        <div
          className="portal-sidebar__overlay"
          role="dialog"
          aria-modal="true"
          onClick={() => setOverlayOpen(false)}
        >
          <div className="portal-sidebar__overlay-content" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="portal-sidebar__overlay-close"
              onClick={() => setOverlayOpen(false)}
              aria-label="Close menu"
            >
              <FontAwesomeIcon icon={faXmark} />
            </button>
            <nav aria-label="Portal apps">{renderLinks("overlay")}</nav>
            <div className="portal-sidebar__overlay-actions">
              <button
                type="button"
                className="portal-sidebar__signout-btn"
                onClick={handleSignOut}
              >
                <FontAwesomeIcon icon={faArrowRightFromBracket} />
                <span>Sign out</span>
              </button>
            </div>
            <div className="portal-sidebar__overlay-theme">
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
          </div>
        </div>
      )}
    </aside>
  );
}

export default PortalSidebar;
