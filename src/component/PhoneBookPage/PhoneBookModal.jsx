import { useEffect } from "react";
import "./PhoneBookModal.css";

export const PhoneBookModal = ({ isOpen, onClose, entry, onSave, onDelete, isSubmitting }) => {
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

  const handleSubmit = e => {
    e.preventDefault();
    const formData = new FormData(e.target);
    onSave({
      name: formData.get("name"),
      description: formData.get("description"),
      phone_number: formData.get("phone_number"),
    });
  };

  const handleDelete = () => {
    if (window.confirm("Are you sure you want to remove this entry?")) {
      onDelete();
    }
  };

  return (
    <div className="phonebook-modal-backdrop" onClick={handleBackdropClick}>
      <div className="phonebook-modal">
        <div className="phonebook-modal-header">
          <h3>{entry ? "Edit Entry" : "Add Entry"}</h3>
          <button className="phonebook-modal-close" onClick={onClose} disabled={isSubmitting}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="phonebook-modal-body">
            <div className="phonebook-modal-form-group">
              <label htmlFor="modal-name" className="phonebook-modal-label">
                Name
              </label>
              <input
                type="text"
                id="modal-name"
                name="name"
                className="phonebook-modal-input"
                defaultValue={entry?.name || ""}
                placeholder="John Doe"
                required
                autoFocus={!entry}
              />
            </div>

            <div className="phonebook-modal-form-group">
              <label htmlFor="modal-description" className="phonebook-modal-label">
                Description
              </label>
              <input
                type="text"
                id="modal-description"
                name="description"
                className="phonebook-modal-input"
                defaultValue={entry?.description || ""}
                placeholder="Property Manager"
              />
            </div>

            <div className="phonebook-modal-form-group">
              <label htmlFor="modal-phone" className="phonebook-modal-label">
                Phone Number
              </label>
              <input
                type="tel"
                id="modal-phone"
                name="phone_number"
                className="phonebook-modal-input"
                defaultValue={entry?.phone_number || ""}
                placeholder="+1234567890"
                required
              />
              <small className="phonebook-modal-help-text">Format: +1234567890 (include country code)</small>
            </div>
          </div>

          <div className="phonebook-modal-footer">
            <div className="phonebook-modal-footer-left">
              {entry && (
                <button
                  type="button"
                  className="phonebook-modal-button phonebook-modal-button-danger"
                  onClick={handleDelete}
                  disabled={isSubmitting}
                >
                  Delete
                </button>
              )}
            </div>
            <div className="phonebook-modal-footer-right">
              <button
                type="button"
                className="phonebook-modal-button phonebook-modal-button-secondary"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="phonebook-modal-button phonebook-modal-button-primary"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
