import { useEffect } from "react";
import "./BlockedModal.css";

export const BlockedModal = ({ isOpen, onClose, entry, onSave, onDelete, isSubmitting }) => {
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
      phone_number: formData.get("phone_number"),
      reason: formData.get("reason"),
      blocked_by: formData.get("blocked_by"),
    });
  };

  const handleDelete = () => {
    if (window.confirm("Are you sure you want to remove this entry?")) {
      onDelete();
    }
  };

  return (
    <div className="blocked-modal-backdrop" onClick={handleBackdropClick}>
      <div className="blocked-modal">
        <div className="blocked-modal-header">
          <h3>{entry ? "Edit Entry" : "Add Entry"}</h3>
          <button className="blocked-modal-close" onClick={onClose} disabled={isSubmitting}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="blocked-modal-body">
            <div className="blocked-modal-form-group">
              <label htmlFor="modal-phone" className="blocked-modal-label">
                Phone Number
              </label>
              <input
                type="tel"
                id="modal-phone"
                name="phone_number"
                className="blocked-modal-input"
                defaultValue={entry?.phone_number || ""}
                placeholder="+1234567890"
                required
                autoFocus={!entry}
              />
              <small className="blocked-modal-help-text">Format: +1234567890 (include country code)</small>
            </div>

            <div className="blocked-modal-form-group">
              <label htmlFor="modal-description" className="blocked-modal-label">
                Blocked By
              </label>
              <input
                type="text"
                id="modal-blocked-by"
                name="blocked_by"
                className="blocked-modal-input"
                defaultValue={entry?.description || ""}
                placeholder="Your Name"
                required
              />
            </div>

            <div className="blocked-modal-form-group">
              <label htmlFor="modal-name" className="blocked-modal-label">
                Reason
              </label>
              <input
                type="text"
                id="modal-reason"
                name="reason"
                className="blocked-modal-input"
                defaultValue={entry?.name || ""}
                placeholder="Blocked Reason"
                required
              />
            </div>
          </div>

          <div className="blocked-modal-footer">
            <div className="blocked-modal-footer-left">
              {entry && (
                <button
                  type="button"
                  className="blocked-modal-button blocked-modal-button-danger"
                  onClick={handleDelete}
                  disabled={isSubmitting}
                >
                  Delete
                </button>
              )}
            </div>
            <div className="blocked-modal-footer-right">
              <button
                type="button"
                className="blocked-modal-button blocked-modal-button-secondary"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="blocked-modal-button blocked-modal-button-primary"
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
