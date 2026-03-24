import express from "express";
import { ObjectId } from "mongodb";
import { collection, auth } from "../middleware.js";

export function Router() {
  const router = express.Router();

  router.use(auth);
  router.use(collection("blocked"));

  router.get("/", async (req, res) => {
    const blockedCollection = collection.read(req);
    try {
      const blockedList = await blockedCollection.find({}).toArray();
      res.status(200).json(blockedList);
    } catch (error) {
      console.error("Error retrieving blocked numbers:", error);
      res.status(500).json({ error: "Failed to retrieve blocked numbers" });
    }
  });

  router.post("/", async (req, res) => {
    const blockedCollection = collection.read(req);

    try {
      const { phone_number, reason, blocked_by } = req.body;

      if (!phone_number || !reason || !blocked_by) {
        return res.status(400).json({ error: "Invalid request: phone number, reason, and \"blocked by\" are required" });
      }

      const newEntry = {
        _id: new ObjectId(),
        phone_number,
        reason,
        blocked_by,
        created_at: new Date(),
      };

      await blockedCollection.insertOne(newEntry);
      res.status(201).json(newEntry);
    } catch (error) {
      console.error("Error adding blocked entry:", error);
      res.status(500).json({ error: "Failed to add blocked entry" });
    }
  });

  router.put("/:id", async (req, res) => {
    const blockedCollection = collection.read(req);

    try {
      const { id } = req.params;
      const { phone_number, reason, blocked_by } = req.body;

      if (!phone_number || !reason || !blocked_by) {
        return res.status(400).json({ error: "Invalid request: phone number, reason, and \"blocked by\" are required" });
      }

      if (!ObjectId.isValid(id)) {
        return res.status(400).json({ error: "Invalid entry ID" });
      }

      const result = await blockedCollection.updateOne(
        { _id: new ObjectId(id) },
        {
          $set: {
            phone_number,
            reason,
            blocked_by,
            updated_at: new Date(),
          },
        },
      );

      if (result.matchedCount === 0) {
        return res.status(404).json({ error: "Entry not found" });
      }

      const updatedEntry = await blockedCollection.findOne({ _id: new ObjectId(id) });
      res.status(200).json(updatedEntry);
    } catch (error) {
      console.error("Error updating blocked entry:", error);
      res.status(500).json({ error: "Failed to update blocked entry" });
    }
  });

  router.delete("/:id", async (req, res) => {
    const blockedCollection = collection.read(req);

    try {
      const { id } = req.params;

      if (!ObjectId.isValid(id)) {
        return res.status(400).json({ error: "Invalid entry ID" });
      }

      const result = await blockedCollection.deleteOne({ _id: new ObjectId(id) });

      if (result.deletedCount === 0) {
        return res.status(404).json({ error: "Entry not found" });
      }

      res.status(200).json({
        message: "Blocked entry removed successfully",
        id,
      });
    } catch (error) {
      console.error("Error removing blocked entry:", error);
      res.status(500).json({ error: "Failed to remove blocked entry" });
    }
  });

  return router;
}
