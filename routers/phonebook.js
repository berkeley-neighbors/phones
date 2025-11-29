import express from "express";
import { ObjectId } from "mongodb";
import { collection, auth } from "../middleware.js";

export function Router() {
  const router = express.Router();

  router.use(auth);
  router.use(collection("phonebook"));

  router.get("/", async (req, res) => {
    const phoneBookCollection = collection.read(req);
    try {
      const phoneBookList = await phoneBookCollection.find({}).toArray();
      res.status(200).json(phoneBookList);
    } catch (error) {
      console.error("Error retrieving phone book:", error);
      res.status(500).json({ error: "Failed to retrieve phone book" });
    }
  });

  router.post("/", async (req, res) => {
    const phoneBookCollection = collection.read(req);

    try {
      const { name, description, phone_number } = req.body;

      if (!name || !phone_number) {
        return res.status(400).json({ error: "Invalid request: name and phone_number are required" });
      }

      const newEntry = {
        _id: new ObjectId(),
        name,
        description: description || "",
        phone_number,
        created_at: new Date(),
      };

      await phoneBookCollection.insertOne(newEntry);
      res.status(201).json(newEntry);
    } catch (error) {
      console.error("Error adding phone book entry:", error);
      res.status(500).json({ error: "Failed to add phone book entry" });
    }
  });

  router.put("/:id", async (req, res) => {
    const phoneBookCollection = collection.read(req);

    try {
      const { id } = req.params;
      const { name, description, phone_number } = req.body;

      if (!name || !phone_number) {
        return res.status(400).json({ error: "Invalid request: name and phone_number are required" });
      }

      if (!ObjectId.isValid(id)) {
        return res.status(400).json({ error: "Invalid entry ID" });
      }

      const result = await phoneBookCollection.updateOne(
        { _id: new ObjectId(id) },
        {
          $set: {
            name,
            description: description || "",
            phone_number,
            updated_at: new Date(),
          },
        },
      );

      if (result.matchedCount === 0) {
        return res.status(404).json({ error: "Entry not found" });
      }

      const updatedEntry = await phoneBookCollection.findOne({ _id: new ObjectId(id) });
      res.status(200).json(updatedEntry);
    } catch (error) {
      console.error("Error updating phone book entry:", error);
      res.status(500).json({ error: "Failed to update phone book entry" });
    }
  });

  router.delete("/:id", async (req, res) => {
    const phoneBookCollection = collection.read(req);

    try {
      const { id } = req.params;

      if (!ObjectId.isValid(id)) {
        return res.status(400).json({ error: "Invalid entry ID" });
      }

      const result = await phoneBookCollection.deleteOne({ _id: new ObjectId(id) });

      if (result.deletedCount === 0) {
        return res.status(404).json({ error: "Entry not found" });
      }

      res.status(200).json({
        message: "Phone book entry removed successfully",
        id,
      });
    } catch (error) {
      console.error("Error removing phone book entry:", error);
      res.status(500).json({ error: "Failed to remove phone book entry" });
    }
  });

  return router;
}
