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

const generateEmailFromNames = (firstName, lastName) => {
  const clean = (value) => (value || "").trim().replace(/\s+/g, "").toLowerCase();
  const first = clean(firstName);
  const last = clean(lastName);
  if (!first || !last) return "";
  return `${first}_${last}@reebs.com`;
};

function AdminDirectory() {
  const [activeTab, setActiveTab] = useState("users");
  const [users, setUsers] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [page, setPage] = useState(0);
  const pageSize = 10;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  const [userForm, setUserForm] = useState({ firstName: "", lastName: "", password: "", role: "Staff" });
  const [customerForm, setCustomerForm] = useState({ name: "", email: "", phone: "" });

  useEffect(() => {
    document.body.classList.add("admin-theme");
    return () => document.body.classList.remove("admin-theme");
  }, []);

  const totalRecords = useMemo(() => {
    if (activeTab === "customers") return customers.length;
    if (activeTab === "users") return users.length;
    return 0;
  }, [activeTab, customers.length, users.length]);

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
      const safeUsers = Array.isArray(usersData) ? usersData : [];
      const safeCustomers = Array.isArray(customersData) ? customersData : [];
      setUsers([...safeUsers].sort((a, b) => (a.fullName || "").localeCompare(b.fullName || "")));
      setCustomers([...safeCustomers].sort((a, b) => (a.name || "").localeCompare(b.name || "")));
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

    const filtered = list.filter((user) => {
      const fullName = `${user.fullName || ""} ${user.name || ""} ${user.firstName || ""} ${user.lastName || ""}`.toLowerCase();
      return (
        user.email?.toLowerCase().includes(needle) ||
        fullName.includes(needle) ||
        user.role?.toLowerCase().includes(needle)
      );
    });
    return filtered;
  }, [activeTab, customers, users, query]);

  useEffect(() => {
    setPage(0);
  }, [activeTab, query, customers.length, users.length]);

  const pageCount = Math.max(1, Math.ceil(currentList.length / pageSize));
  const clampedPage = Math.min(page, pageCount - 1);
  const paginatedList = useMemo(() => {
    const start = clampedPage * pageSize;
    return currentList.slice(start, start + pageSize);
  }, [currentList, clampedPage, pageSize]);

  const openCreateModal = () => {
    setEditing(null);
    setSaveError("");
    if (activeTab === "customers") {
      setCustomerForm({ name: "", email: "", phone: "" });
    } else {
      setUserForm({ firstName: "", lastName: "", password: "", role: "Staff" });
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
        firstName: row.firstName || "",
        lastName: row.lastName || "",
        password: "",
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

    const trimmedFirst = userForm.firstName.trim();
    const trimmedLast = userForm.lastName.trim();
    const trimmedPassword = userForm.password.trim();
    const trimmedCustomerName = customerForm.name.trim();
    const trimmedCustomerEmail = customerForm.email.trim();
    const trimmedCustomerPhone = customerForm.phone.trim();

    setSaving(true);
    try {
      if (activeTab === "customers") {
        if (!trimmedCustomerName) {
          throw new Error("Name is required.");
        }

        const isEdit = Boolean(editing?.id);
        const response = await fetch("/.netlify/functions/customers", {
          method: isEdit ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: isEdit ? editing.id : undefined,
            name: trimmedCustomerName,
            email: trimmedCustomerEmail,
            phone: trimmedCustomerPhone,
          }),
        });

        const payload = await response.json();
        if (!response.ok) throw new Error(payload?.error || "Save failed.");

        setCustomers((prev) => {
          const next = isEdit ? prev.map((item) => (item.id === payload.id ? payload : item)) : [payload, ...prev];
          return [...next].sort((a, b) => (a.name || "").localeCompare(b.name || ""));
        });
      } else {
        if (!trimmedFirst || !trimmedLast) {
          throw new Error("First and last name are required.");
        }

        const isEdit = Boolean(editing?.id);
        if (!isEdit && !trimmedPassword) {
          throw new Error("Password is required when creating a user.");
        }

        const requestBody = {
          id: isEdit ? editing.id : undefined,
          firstName: trimmedFirst,
          lastName: trimmedLast,
          role: userForm.role,
        };

        if (!isEdit || trimmedPassword) {
          requestBody.password = trimmedPassword;
        }

        const response = await fetch("/.netlify/functions/users", {
          method: isEdit ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestBody),
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
              <span>{query ? `${currentList.length} match${currentList.length === 1 ? "" : "es"} / ${totalRecords} total` : `${totalRecords} total`}</span>
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
              <div className="customers-search-input">
                <input
                  type="text"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search name, email, role"
                />
                {query && (
                  <button
                    type="button"
                    className="customers-search-clear"
                    onClick={() => setQuery("")}
                    aria-label="Clear search"
                  >
                    <FontAwesomeIcon icon={faXmark} />
                  </button>
                )}
              </div>
            </label>
          </div>

          {loading && <p className="customers-status">Loading directory...</p>}
          {!loading && error && <p className="customers-error">{error}</p>}

          {!loading && !error && activeTab === "vendors" && (
            <p className="customers-status">Vendor management is not enabled yet.</p>
          )}

          {!loading && !error && activeTab !== "vendors" && (
            <div className="customers-table-wrapper">
              <div className="table-pagination">
                <span>
                  Showing {currentList.length === 0 ? 0 : clampedPage * pageSize + 1}-
                  {Math.min(currentList.length, (clampedPage + 1) * pageSize)} of {currentList.length}
                </span>
                <div className="table-pagination-controls">
                  <button type="button" onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={clampedPage === 0}>
                    Prev
                  </button>
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
                    disabled={clampedPage >= pageCount - 1}
                  >
                    Next
                  </button>
                </div>
              </div>
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
                  {paginatedList.map((row) => (
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
                          <td>{row.fullName || row.name || [row.firstName, row.lastName].filter(Boolean).join(" ") || "-"}</td>
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
                        {query ? "No matching records." : "No records found."}
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
                    First name
                    <input
                      type="text"
                      value={userForm.firstName}
                      onChange={(event) =>
                        setUserForm((prev) => ({ ...prev, firstName: event.target.value }))
                      }
                      placeholder="First name"
                      required
                    />
                  </label>

                  <label>
                    Last name
                    <input
                      type="text"
                      value={userForm.lastName}
                      onChange={(event) =>
                        setUserForm((prev) => ({ ...prev, lastName: event.target.value }))
                      }
                      placeholder="Last name"
                      required
                    />
                  </label>

                  <label>
                    Login email (auto)
                    <input
                      type="text"
                      value={generateEmailFromNames(userForm.firstName, userForm.lastName) || editing?.email || ""}
                      readOnly
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
