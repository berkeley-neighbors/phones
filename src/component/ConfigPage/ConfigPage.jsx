import { useState, useEffect } from "react";
import { Layout } from "../Layout/Layout";
import { useSnackbar } from "@/context/SnackbarContext";
import { useContext } from "react";
import { APIContext } from "@/context/APIContext";

export const ConfigPage = () => {
  const api = useContext(APIContext);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [inboundNumber, setInboundNumber] = useState("");
  const [outboundNumber, setOutboundNumber] = useState("");
  const [config, setConfig] = useState(null);
  const { addNotification } = useSnackbar();

  useEffect(() => {
    loadConfiguration();
  }, []);

  const loadConfiguration = async () => {
    try {
      const { data } = await api.get("/api/config");

      setConfig(data);
      setInboundNumber(data.inbound_number.value || "");
      setOutboundNumber(data.outbound_number.value || "");
    } catch (error) {
      addNotification(`Error loading configuration: ${error.message}`, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await api("/api/config", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        data: JSON.stringify({
          [config.inbound_number.key]: inboundNumber,
          [config.outbound_number.key]: outboundNumber,
        }),
      });

      addNotification("Configuration updated successfully!", "success");
    } catch (error) {
      addNotification(error.message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Layout title="Configuration">
      <p className="text-gray-600 mb-6">
        Configure the inbound and outbound phone numbers used throughout the application.
      </p>

      {loading ? (
        <div className="staff-page__loading">Loading configuration...</div>
      ) : (
        <div className="staff-page__form">
          <form onSubmit={handleSubmit}>
            <div className="staff-page__form-group">
              <label htmlFor="inboundNumber" className="staff-page__label">
                Inbound Number
              </label>
              <select
                id="inboundNumber"
                className="staff-page__input"
                value={inboundNumber}
                onChange={e => setInboundNumber(e.target.value)}
                required
              >
                <option value="">Select a phone number</option>
                {config?.inbound_number?.options.map(num => (
                  <option key={num.value} value={num.value}>
                    {num.label}
                  </option>
                ))}
              </select>
              <small className="staff-page__help-text">
                The phone number that receives incoming messages and calls
              </small>
            </div>

            <div className="staff-page__form-group">
              <label htmlFor="outboundNumber" className="staff-page__label">
                Outbound Number
              </label>
              <select
                id="outboundNumber"
                className="staff-page__input"
                value={outboundNumber}
                onChange={e => setOutboundNumber(e.target.value)}
                required
              >
                <option value="">Select a phone number</option>
                {config?.outbound_number?.options.map(num => (
                  <option key={num.value} value={num.value}>
                    {num.label}
                  </option>
                ))}
              </select>
              <small className="staff-page__help-text">The phone number used for sending messages</small>
            </div>

            <button type="submit" className="staff-page__button" disabled={submitting}>
              {submitting ? "Saving..." : "Save Configuration"}
            </button>
          </form>
        </div>
      )}

      <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded">
        <h4 className="text-sm font-semibold text-blue-900 mb-2">Note</h4>
        <p className="text-sm text-blue-800">
          Changes to these phone numbers will affect all messaging and calling operations. Make sure the numbers are
          valid phone numbers that allow access to each of these operations.
        </p>
      </div>
    </Layout>
  );
};
