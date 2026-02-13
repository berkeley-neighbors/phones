import { useState, useEffect } from "react";
import { Layout } from "../Layout/Layout";
import { useSnackbar } from "@/context/SnackbarContext";
import "./StaffPage.css";
import { useContext } from "react";
import { APIContext } from "@/context/APIContext";

export const StaffPage = () => {
  const api = useContext(APIContext);

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
      const { data } = await api.get("/api/staff");

      setStaffMembers(data || []);
    } catch (error) {
      addNotification(`Error loading staff: ${error.message}`, "error", "staff");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await api.post("/api/staff", {
        phone_number: phoneNumber,
      });

      addNotification("Staff member added successfully!", "success", "staff");
      setPhoneNumber("");
      await loadStaffMembers();
    } catch (error) {
      addNotification(error.message, "error", "staff");
    } finally {
      setSubmitting(false);
    }
  };

  const removeStaff = async member => {
    if (!window.confirm(`Are you sure you want to remove ${member.phone_number}?`)) {
      return;
    }

    try {
      await api.delete(`/api/staff/${encodeURIComponent(member.id)}`);

      addNotification(`${member.phone_number} successfully removed!`, "success", "staff");
      await loadStaffMembers();
    } catch (error) {
      addNotification(error.message, "error", "staff");
    }
  };

  const toggleActive = async member => {
    try {
      await api.put(`/api/staff/${encodeURIComponent(member.id)}`, {
        active: !member.active,
      });

      addNotification(`${member.phone_number} ${!member.active ? "activated" : "deactivated"}`, "success", "staff");
      await loadStaffMembers();
    } catch (error) {
      addNotification(error.message, "error", "staff");
    }
  };

  return (
    <Layout title="Alert Staff">
      <p className="text-gray-600 mb-6">Manage numbers that receive phone alerts</p>
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
                <th className="staff-table__header">Status</th>
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
                    <span
                      className={`staff-badge ${member.active ? "staff-badge--active" : "staff-badge--inactive"}`}
                      onClick={() => toggleActive(member)}
                      style={{ cursor: "pointer" }}
                      title={`Click to ${member.active ? "deactivate" : "activate"}`}
                    >
                      {member.active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="staff-table__cell">
                    <button className="staff-table__button" onClick={() => removeStaff(member)}>
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
