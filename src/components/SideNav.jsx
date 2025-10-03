import React from "react";
import PropTypes from "prop-types";

function SideNav({ items, activeId, label = "Page sections" }) {
  return (
    <nav className="side-menu" aria-label={label}>
      <ul>
        {items.map((item) => (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              aria-current={activeId === item.id ? "true" : undefined}
            >
              {item.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

SideNav.propTypes = {
  items: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
    })
  ).isRequired,
  activeId: PropTypes.string,
  label: PropTypes.string,
};

export default SideNav;