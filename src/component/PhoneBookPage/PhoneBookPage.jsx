import { useState, useEffect } from "react";
import { Layout } from "../Layout/Layout";
import { useSnackbar } from "@/context/SnackbarContext";
import { PhoneBookModal } from "./PhoneBookModal";
import "./PhoneBookPage.css";
import { useContext } from "react";
import { APIContext } from "@/context/APIContext";

export const PhoneBookPage = () => {
  const api = useContext(APIContext);

  const [phoneBookEntries, setPhoneBookEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const { addNotification } = useSnackbar();

  useEffect(() => {
    loadPhoneBookEntries();
  }, []);

  const loadPhoneBookEntries = async () => {
    try {
      const { data } = await api.get("/api/phonebook");

      setPhoneBookEntries(data || []);
    } catch (error) {
      addNotification(`Error loading phone book: ${error.message}`, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async data => {
    setSubmitting(true);

    try {
      const url = editingEntry ? `/api/phonebook/${editingEntry._id}` : "/api/phonebook";
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
      await loadPhoneBookEntries();
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
      await api.delete(`/api/phonebook/${editingEntry._id}`);

      addNotification("Entry successfully removed!", "success");
      setIsModalOpen(false);
      setEditingEntry(null);
      await loadPhoneBookEntries();
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
    <Layout>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="m-0">Phone Directory</h3>
          <sub>Public and safe to reference numbers</sub>
        </div>

        <button className="staff-page__button" onClick={openAddModal}>
          Add
        </button>
      </div>

      <PhoneBookModal
        isOpen={isModalOpen}
        onClose={closeModal}
        entry={editingEntry}
        onSave={handleSave}
        onDelete={handleDelete}
        isSubmitting={submitting}
      />

      <div className="staff-page__list">
        {loading ? (
          <div className="staff-page__loading">Loading phone book...</div>
        ) : phoneBookEntries.length === 0 ? (
          <div className="staff-page__empty">No entries found</div>
        ) : (
          <table className="staff-table" style={{ width: "100%" }}>
            <tbody>
              {phoneBookEntries.map(entry => (
                <tr
                  key={entry._id}
                  className="staff-table__row phonebook-table__row"
                  onClick={() => openEditModal(entry)}
                  style={{ cursor: "pointer" }}
                >
                  <td className="staff-table__cell" style={{ width: "25%" }}>
                    <strong>{entry.name}</strong>
                  </td>
                  <td className="staff-table__cell" style={{ width: "40%" }}>
                    {entry.description || "-"}
                  </td>
                  <td className="staff-table__cell" style={{ width: "35%" }}>
                    {entry.phone_number}
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
