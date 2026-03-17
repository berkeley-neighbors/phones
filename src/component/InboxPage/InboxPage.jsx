import { useEffect, useState } from "react";
import { Layout } from "../Layout/Layout";
import { MessageRows } from "../MessageRows/MessageRows";
import { MessageFilterEnum, Selector } from "./Selector";
import { getTwilioPhoneNumbers } from "../../js/getTwilioPhoneNumbers";
import { getMessages } from "./getMessages";
import { ErrorLabel } from "../ErrorLabel/ErrorLabel";
import { NotesModal } from "../NotesModal/NotesModal";
import { getConversationNotes, updateConversationNote } from "../../js/conversationNotes";
import { MessageDirection } from "../../js/types";
import { APIContext } from "@/context/APIContext";
import { useContext } from "react";

export const InboxPage = () => {
  const api = useContext(APIContext);
  const [messages, setMessages] = useState([]);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [loadingPhones, setLoadingPhones] = useState(true);
  const [messageFilter, setMessageFilter] = useState(MessageFilterEnum.received);
  const [error, setError] = useState(null);

  // Notes/Done state
  const [conversationNotes, setConversationNotes] = useState({});
  const [notesModalOpen, setNotesModalOpen] = useState(false);
  const [notesModalPhone, setNotesModalPhone] = useState("");
  const [isSavingNotes, setIsSavingNotes] = useState(false);

  useEffect(() => {
    const run = async () => {
      setLoadingMessages(true);
      try {
        const ms = await getMessages(api, phoneNumber, messageFilter);
        setMessages(ms);

        // Derive phone numbers from message groupings
        const phoneNumbers = [...new Set(ms.map(m => (m.direction === MessageDirection.received ? m.from : m.to)))];

        if (phoneNumbers.length > 0) {
          try {
            const notes = await getConversationNotes(api, phoneNumbers);
            const notesMap = {};
            notes.forEach(n => {
              notesMap[n.phoneNumber] = n;
            });
            setConversationNotes(notesMap);
          } catch {
            // Non-critical — continue without notes
          }
        }
      } finally {
        setLoadingMessages(false);
      }
    };
    run();
  }, [phoneNumber, messageFilter]);

  useEffect(() => {
    getTwilioPhoneNumbers(api)
      .then(phoneNumbers => {
        setPhoneNumber(phoneNumbers.inbound_number || "");
      })
      .catch(setError)
      .finally(() => setLoadingPhones(false));
  }, []);

  const handleNotesClick = phone => {
    setNotesModalPhone(phone);
    setNotesModalOpen(true);
  };

  const handleNotesSave = async (phone, notes) => {
    setIsSavingNotes(true);
    try {
      const updated = await updateConversationNote(api, phone, { notes });
      setConversationNotes(prev => ({
        ...prev,
        [phone]: { ...prev[phone], ...updated },
      }));
      setNotesModalOpen(false);
    } catch {
      setError("Failed to save notes");
    } finally {
      setIsSavingNotes(false);
    }
  };

  const handleDoneToggle = async phone => {
    const current = conversationNotes[phone];
    const newDone = !(current?.done ?? false);

    // Optimistic update
    setConversationNotes(prev => ({
      ...prev,
      [phone]: { ...prev[phone], phoneNumber: phone, done: newDone },
    }));

    try {
      await updateConversationNote(api, phone, { done: newDone });
    } catch {
      // Revert on failure
      setConversationNotes(prev => ({
        ...prev,
        [phone]: { ...prev[phone], done: !newDone },
      }));
    }
  };

  return (
    <Layout title="Inbox">
      <div className="mb-4">
        <p className="text-gray-600 mb-6">View and reply to text messages</p>
      </div>
      <ErrorLabel error={error} className="mb-4" />

      <Selector
        phoneNumber={phoneNumber}
        loading={loadingPhones}
        onMessageFilterChange={setMessageFilter}
        onPhoneNumberChange={setPhoneNumber}
      />
      <MessageRows
        loading={loadingMessages}
        messages={messages}
        conversationNotes={conversationNotes}
        onNotesClick={handleNotesClick}
        onDoneToggle={handleDoneToggle}
      />
      <NotesModal
        isOpen={notesModalOpen}
        onClose={() => setNotesModalOpen(false)}
        phoneNumber={notesModalPhone}
        initialNotes={conversationNotes[notesModalPhone]?.notes || ""}
        onSave={handleNotesSave}
        isSaving={isSavingNotes}
      />
    </Layout>
  );
};
