import React, { useEffect, useMemo, useState } from "react";
import "./master.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faRotateRight, faXmark, faPen } from "@fortawesome/free-solid-svg-icons";
import AdminBreadcrumb from "../components/AdminBreadcrumb";

const formatDate = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const tabs = [
  { key: "users", label: "Users" },
  { key: "customers", label: "Customers" },
  { key: "vendors", label: "Vendors" },
];

function AdminDirectory() {
  const [activeTab, setActiveTab] = useState("users");
  const [users, setUsers] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  const [userForm, setUserForm] = useState({ email: "", password: "", name: "", role: "Staff" });
  const [customerForm, setCustomerForm] = useState({ name: "", email: "", phone: "" });

  useEffect(() => {
    document.body.classList.add("admin-theme");
    return () => document.body.classList.remove("admin-theme");
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    setError("");
    try {
      const [usersRes, customersRes] = await Promise.all([
        fetch("/.netlify/functions/users"),
        fetch("/.netlify/functions/customers"),
      ]);
      if (!usersRes.ok || !customersRes.ok) {
        throw new Error("Failed to fetch directory data.");
      }
      const [usersData, customersData] = await Promise.all([usersRes.json(), customersRes.json()]);
      setUsers(Array.isArray(usersData) ? usersData : []);
      setCustomers(Array.isArray(customersData) ? customersData : []);
    } catch (err) {
      console.error("Directory fetch failed", err);
      setError("We couldn't load directory data right now.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const currentList = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const list = activeTab === "customers" ? customers : users;
    if (!needle) return list;

    if (activeTab === "customers") {
      return list.filter((customer) => {
        return (
          customer.name?.toLowerCase().includes(needle) ||
          customer.email?.toLowerCase().includes(needle) ||
          customer.phone?.toLowerCase().includes(needle)
        );
      });
    }

    return list.filter((user) => {
      return (
        user.email?.toLowerCase().includes(needle) ||
        user.name?.toLowerCase().includes(needle) ||
        user.role?.toLowerCase().includes(needle)
      );
    });
  }, [activeTab, customers, users, query]);

  const openCreateModal = () => {
    setEditing(null);
    setSaveError("");
    if (activeTab === "customers") {
      setCustomerForm({ name: "", email: "", phone: "" });
    } else {
      setUserForm({ email: "", password: "", name: "", role: "Staff" });
    }
    setModalOpen(true);
  };

  const openEditModal = (row) => {
    setEditing(row);
    setSaveError("");
    if (activeTab === "customers") {
      setCustomerForm({
        name: row.name || "",
        email: row.email || "",
        phone: row.phone || "",
      });
    } else {
      setUserForm({
        email: row.email || "",
        password: "",
        name: row.name || "",
        role: row.role || "Staff",
      });
    }
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditing(null);
    setSaveError("");
  };

  const save = async (event) => {
    event.preventDefault();
    setSaveError("");

    if (activeTab === "vendors") return;

    setSaving(true);
    try {
      if (activeTab === "customers") {
        if (!customerForm.name.trim()) {
          throw new Error("Name is required.");
        }

        const isEdit = Boolean(editing?.id);
        const response = await fetch("/.netlify/functions/customers", {
          method: isEdit ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: isEdit ? editing.id : undefined,
            name: customerForm.name,
            email: customerForm.email,
            phone: customerForm.phone,
          }),
        });

        const payload = await response.json();
        if (!response.ok) throw new Error(payload?.error || "Save failed.");

        setCustomers((prev) => {
          const next = isEdit ? prev.map((item) => (item.id === payload.id ? payload : item)) : [payload, ...prev];
          return [...next].sort((a, b) => (a.name || "").localeCompare(b.name || ""));
        });
      } else {
        if (!userForm.email.trim()) {
          throw new Error("Email is required.");
        }

        const isEdit = Boolean(editing?.id);
        if (!isEdit && !userForm.password) {
          throw new Error("Password is required when creating a user.");
        }

        const response = await fetch("/.netlify/functions/users", {
          method: isEdit ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: isEdit ? editing.id : undefined,
            email: userForm.email,
            password: userForm.password || undefined,
            name: userForm.name || undefined,
            role: userForm.role,
          }),
        });

        const payload = await response.json();
        if (!response.ok) throw new Error(payload?.error || "Save failed.");

        setUsers((prev) => {
          const next = isEdit ? prev.map((item) => (item.id === payload.id ? payload : item)) : [payload, ...prev];
          return next;
        });
      }

      setModalOpen(false);
      setEditing(null);
    } catch (err) {
      console.error("Save failed", err);
      setSaveError(err.message || "Save failed.");
    } finally {
      setSaving(false);
    }
  };

  const title = activeTab === "customers" ? "Customer Directory" : activeTab === "vendors" ? "Vendor Directory" : "User Directory";
  const subtitle =
    activeTab === "customers"
      ? "Manage client contact details and history."
      : activeTab === "vendors"
        ? "Vendor support coming soon."
        : "Manage staff, admin accounts, and roles.";

  const canMutate = activeTab !== "vendors";

  return (
    <div className="customers-page">
      <div className="customers-shell">
        <AdminBreadcrumb items={[{ label: "Directory" }]} />
        <header className="customers-header">
          <div>
            <p className="customers-eyebrow">Directory</p>
            <h1>{title}</h1>
            <p className="customers-subtitle">{subtitle}</p>
          </div>
          <div className="customers-actions">
            <button type="button" className="customers-secondary" onClick={fetchAll}>
              <FontAwesomeIcon icon={faRotateRight} />
              Refresh
            </button>
            <button type="button" className="customers-primary" onClick={openCreateModal} disabled={!canMutate}>
              <FontAwesomeIcon icon={faPlus} />
              Add
            </button>
          </div>
        </header>

        <section className="customers-panel">
          <div className="customers-panel-header">
            <div>
              <h3>Directory</h3>
              <span>
                {activeTab === "customers" ? customers.length : activeTab === "users" ? users.length : "-"} total
              </span>
            </div>
            <div className="directory-tabs">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  className={tab.key === activeTab ? "directory-tab is-active" : "directory-tab"}
                  onClick={() => setActiveTab(tab.key)}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <label className="customers-search">
              Search
              <input
                type="text"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search name, email, role"
              />
            </label>
          </div>

          {loading && <p className="customers-status">Loading directory...</p>}
          {!loading && error && <p className="customers-error">{error}</p>}

          {!loading && !error && activeTab === "vendors" && (
            <p className="customers-status">Vendor management is not enabled yet.</p>
          )}

          {!loading && !error && activeTab !== "vendors" && (
            <div className="customers-table-wrapper">
              <table className="customers-table">
                <thead>
                  {activeTab === "customers" ? (
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Phone</th>
                      <th>Created</th>
                      <th aria-label="Actions" />
                    </tr>
                  ) : (
                    <tr>
                      <th>Email</th>
                      <th>Name</th>
                      <th>Role</th>
                      <th>Created</th>
                      <th aria-label="Actions" />
                    </tr>
                  )}
                </thead>
                <tbody>
                  {currentList.map((row) => (
                    <tr key={`${activeTab}-${row.id}`}>
                      {activeTab === "customers" ? (
                        <>
                          <td>{row.name || "-"}</td>
                          <td>{row.email || "-"}</td>
                          <td>{row.phone || "-"}</td>
                          <td>{formatDate(row.createdAt)}</td>
                        </>
                      ) : (
                        <>
                          <td>{row.email || "-"}</td>
                          <td>{row.name || "-"}</td>
                          <td>{row.role || "Staff"}</td>
                          <td>{formatDate(row.createdAt)}</td>
                        </>
                      )}
                      <td className="directory-actions">
                        <button
                          type="button"
                          className="directory-edit"
                          onClick={() => openEditModal(row)}
                        >
                          <FontAwesomeIcon icon={faPen} />
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                  {!currentList.length && (
                    <tr>
                      <td colSpan={5} className="customers-empty">
                        No records found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      {modalOpen && (
        <div className="customers-modal" role="dialog" aria-modal="true">
          <div className="customers-modal-panel">
            <header>
              <div>
                <p className="customers-eyebrow">{editing ? "Edit" : "New"}</p>
                <h2>{editing ? "Update" : "Add"} {activeTab === "customers" ? "customer" : "user"}</h2>
              </div>
              <button type="button" className="customers-modal-close" onClick={closeModal} aria-label="Close">
                <FontAwesomeIcon icon={faXmark} />
              </button>
            </header>

            <form className="customers-form" onSubmit={save}>
              {activeTab === "customers" ? (
                <>
                  <label>
                    Name
                    <input
                      type="text"
                      value={customerForm.name}
                      onChange={(event) =>
                        setCustomerForm((prev) => ({ ...prev, name: event.target.value }))
                      }
                      placeholder="Customer name"
                      required
                    />
                  </label>

                  <label>
                    Email (optional)
                    <input
                      type="email"
                      value={customerForm.email}
                      onChange={(event) =>
                        setCustomerForm((prev) => ({ ...prev, email: event.target.value }))
                      }
                      placeholder="email@example.com"
                    />
                  </label>

                  <label>
                    Phone (optional)
                    <input
                      type="tel"
                      value={customerForm.phone}
                      onChange={(event) =>
                        setCustomerForm((prev) => ({ ...prev, phone: event.target.value }))
                      }
                      placeholder="+233 ..."
                    />
                  </label>
                </>
              ) : (
                <>
                  <label>
                    Email
                    <input
                      type="email"
                      value={userForm.email}
                      onChange={(event) =>
                        setUserForm((prev) => ({ ...prev, email: event.target.value }))
                      }
                      placeholder="user@example.com"
                      required
                    />
                  </label>

                  <label>
                    Name (optional)
                    <input
                      type="text"
                      value={userForm.name}
                      onChange={(event) =>
                        setUserForm((prev) => ({ ...prev, name: event.target.value }))
                      }
                      placeholder="Full name"
                    />
                  </label>

                  <label>
                    Role
                    <select
                      value={userForm.role}
                      onChange={(event) =>
                        setUserForm((prev) => ({ ...prev, role: event.target.value }))
                      }
                    >
                      <option value="Admin">Admin</option>
                      <option value="Staff">Staff</option>
                      <option value="Viewer">Viewer</option>
                    </select>
                  </label>

                  <label>
                    Password {editing ? "(leave blank to keep)" : ""}
                    <input
                      type="password"
                      value={userForm.password}
                      onChange={(event) =>
                        setUserForm((prev) => ({ ...prev, password: event.target.value }))
                      }
                      placeholder={editing ? "" : "Set password"}
                    />
                  </label>
                </>
              )}

              {saveError && <p className="customers-error">{saveError}</p>}

              <div className="customers-form-actions">
                <button type="button" className="customers-secondary" onClick={closeModal} disabled={saving}>
                  Cancel
                </button>
                <button type="submit" className="customers-primary" disabled={saving}>
                  {saving ? "Saving..." : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDirectory;
