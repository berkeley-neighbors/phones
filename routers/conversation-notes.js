import express from "express";
import { auth } from "../middleware.js";
import { ConversationNoteClient } from "../clients/conversation-note.js";

export function Router(db) {
  const router = express.Router();
  const client = new ConversationNoteClient(db);

  // Get notes for multiple conversations (batch)
  router.get("/", auth, async (req, res) => {
    const { phoneNumbers } = req.query;

    if (!phoneNumbers) {
      return res.status(400).send("Bad Request: Missing phoneNumbers parameter");
    }

    try {
      const numbers = Array.isArray(phoneNumbers) ? phoneNumbers : phoneNumbers.split(",");
      const notes = await client.getNotesByPhoneNumbers(req.uid, numbers);
      res.status(200).json(notes);
    } catch (error) {
      console.error("Error fetching conversation notes:", error);
      res.status(500).send("Internal Server Error");
    }
  });

  // Get note for a single conversation
  router.get("/:phoneNumber", auth, async (req, res) => {
    const { phoneNumber } = req.params;

    try {
      const note = await client.getNote(req.uid, phoneNumber);
      res.status(200).json(note || { phoneNumber, notes: "", done: false });
    } catch (error) {
      console.error("Error fetching conversation note:", error);
      res.status(500).send("Internal Server Error");
    }
  });

  // Upsert note/done for a conversation
  router.put("/:phoneNumber", auth, async (req, res) => {
    const { phoneNumber } = req.params;
    const { notes, done } = req.body;

    if (notes === undefined && done === undefined) {
      return res.status(400).send("Bad Request: Must provide notes or done");
    }

    try {
      await client.upsertNote(req.uid, phoneNumber, { notes, done });
      const updated = await client.getNote(req.uid, phoneNumber);
      res.status(200).json(updated);
    } catch (error) {
      console.error("Error updating conversation note:", error);
      res.status(500).send("Internal Server Error");
    }
  });

  return router;
}
