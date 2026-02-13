import { useEffect, useState } from "react";
import "./NotesModal.css";

export const NotesModal = ({ isOpen, onClose, phoneNumber, initialNotes = "", onSave, isSaving }) => {
  const [notes, setNotes] = useState(initialNotes);

  useEffect(() => {
    if (isOpen) {
      setNotes(initialNotes);
    }
  }, [isOpen, initialNotes]);

  useEffect(() => {
    const handleEscape = e => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleBackdropClick = e => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleSave = () => {
    onSave(phoneNumber, notes);
  };

  return (
    <div className="notes-modal-backdrop" onClick={handleBackdropClick}>
      <div className="notes-modal">
        <div className="notes-modal-header">
          <h3>Notes for {phoneNumber}</h3>
          <button className="notes-modal-close" onClick={onClose}>
            &times;
          </button>
        </div>

        <div className="notes-modal-body">
          <textarea
            className="notes-modal-textarea"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Add notes about this conversation..."
            autoFocus
          />
        </div>

        <div className="notes-modal-footer">
          <button className="notes-modal-button notes-modal-button-secondary" onClick={onClose} disabled={isSaving}>
            Cancel
          </button>
          <button className="notes-modal-button notes-modal-button-primary" onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
};
