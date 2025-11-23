import { useState, useEffect } from "react";
import { Layout } from "../Layout/Layout";
import { useSnackbar } from "@/context/SnackbarContext";
import "./StaffPage.css";

export const StaffPage = () => {
  const [staffMembers, setStaffMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { addNotification } = useSnackbar();

  useEffect(() => {
    loadStaffMembers();
  }, []);

  const loadStaffMembers = async () => {
    try {
      const response = await fetch("/api/staff");
      if (!response.ok) {
        throw new Error("Failed to load staff members");
      }
      const data = await response.json();
      setStaffMembers(data || []);
    } catch (error) {
      addNotification(`Error loading staff: ${error.message}`, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await fetch("/api/staff", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phone_number: phoneNumber,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to add staff member");
      }

      addNotification("Staff member added successfully!", "success");
      setPhoneNumber("");
      await loadStaffMembers();
    } catch (error) {
      addNotification(error.message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  const removeStaff = async phoneNumber => {
    if (!window.confirm(`Are you sure you want to remove ${phoneNumber}?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/staff/${encodeURIComponent(phoneNumber)}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to remove staff member");
      }

      addNotification(`${phoneNumber} successfully removed!`, "success");
      await loadStaffMembers();
    } catch (error) {
      addNotification(error.message, "error");
    }
  };

  return (
    <Layout>
      <h3>Staff Management</h3>

      <div className="staff-page__form">
        <form onSubmit={handleSubmit}>
          <div className="staff-page__form-group">
            <label htmlFor="phoneNumber" className="staff-page__label">
              Phone Number
            </label>
            <input
              type="tel"
              id="phoneNumber"
              className="staff-page__input"
              value={phoneNumber}
              onChange={e => setPhoneNumber(e.target.value)}
              placeholder="+1234567890"
              required
            />
            <small className="staff-page__help-text">Format: +1234567890 (include country code)</small>
          </div>
          <button type="submit" className="staff-page__button" disabled={submitting}>
            {submitting ? "Adding..." : "Add"}
          </button>
        </form>
      </div>

      <div className="staff-page__list">
        {loading ? (
          <div className="staff-page__loading">Loading staff members...</div>
        ) : staffMembers.length === 0 ? (
          <div className="staff-page__empty">No staff members found</div>
        ) : (
          <table className="staff-table">
            <thead>
              <tr>
                <th className="staff-table__header">Phone Number</th>
                <th className="staff-table__header">Actions</th>
              </tr>
            </thead>
            <tbody>
              {staffMembers.map(member => (
                <tr key={member._id} className="staff-table__row">
                  <td className="staff-table__cell">
                    <strong>{member.phone_number}</strong>
                  </td>
                  <td className="staff-table__cell">
                    <button className="staff-table__button" onClick={() => removeStaff(member.phone_number)}>
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </Layout>
  );
};
