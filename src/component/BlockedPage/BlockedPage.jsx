import { useState, useEffect } from "react";
import { Layout } from "../Layout/Layout";
import { useSnackbar } from "@/context/SnackbarContext";
import { BlockedModal } from "./BlockedModal";
import "./BlockedPage.css";
import { useContext } from "react";
import { APIContext } from "@/context/APIContext";

export const BlockedPage = () => {
  const api = useContext(APIContext);

  const [blockedEntries, setBlockedEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const { addNotification } = useSnackbar();

  useEffect(() => {
    loadBlockedEntries();
  }, []);

  const loadBlockedEntries = async () => {
    try {
      const { data } = await api.get("/api/blocked");

      setBlockedEntries(data || []);
    } catch (error) {
      addNotification(`Error loading blocked numbers: ${error.message}`, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async data => {
    setSubmitting(true);

    try {
      const url = editingEntry ? `/api/blocked/${editingEntry._id}` : "/api/blocked";
      const method = editingEntry ? "PUT" : "POST";

      await api(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        data: JSON.stringify(data),
      });

      addNotification(editingEntry ? "Entry updated successfully!" : "Entry added successfully!", "success");
      setIsModalOpen(false);
      setEditingEntry(null);
      await loadBlockedEntries();
    } catch (error) {
      addNotification(error.message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!editingEntry) return;

    setSubmitting(true);

    try {
      await api.delete(`/api/blocked/${editingEntry._id}`);

      addNotification("Entry successfully removed!", "success");
      setIsModalOpen(false);
      setEditingEntry(null);
      await loadBlockedEntries();
    } catch (error) {
      addNotification(error.message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  const openAddModal = () => {
    setEditingEntry(null);
    setIsModalOpen(true);
  };

  const openEditModal = entry => {
    setEditingEntry(entry);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    if (!submitting) {
      setIsModalOpen(false);
      setEditingEntry(null);
    }
  };

  return (
    <Layout title="Blocked Phone Numbers">
      <div className="flex justify-between items-center mb-6">
        <div>
          <p className="text-gray-600 mb-6">Blocked phone numbers</p>
        </div>

        <button className="staff-page__button" onClick={openAddModal}>
          Add
        </button>
      </div>

      <BlockedModal
        isOpen={isModalOpen}
        onClose={closeModal}
        entry={editingEntry}
        onSave={handleSave}
        onDelete={handleDelete}
        isSubmitting={submitting}
      />

      <div className="staff-page__list">
        {loading ? (
          <div className="staff-page__loading">Loading blocked numbers...</div>
        ) : blockedEntries.length === 0 ? (
          <div className="staff-page__empty">No entries found</div>
        ) : (
          <table className="staff-table" style={{ width: "100%" }}>
            <thead>
              <tr>
                <td className="staff-table__cell" style={{ width: "35%" }}>
                  <strong>Blocked Phone Number</strong>
                </td>
                <td className="staff-table__cell" style={{ width: "25%" }}>
                  <strong>Blocked By</strong>
                </td>
                <td className="staff-table__cell" style={{ width: "40%" }}>
                  <strong>Reason</strong>
                </td>
              </tr>
            </thead>
            <tbody>
              {blockedEntries.map(entry => (
                <tr
                  key={entry._id}
                  className="staff-table__row blocked-table__row"
                  onClick={() => openEditModal(entry)}
                  style={{ cursor: "pointer" }}
                >
                  <td className="staff-table__cell">
                    {entry.phone_number}
                  </td>
                  <td className="staff-table__cell">
                    {entry.blocked_by}
                  </td>
                  <td className="staff-table__cell">
                    {entry.reason}
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
