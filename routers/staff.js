import express from "express";
import { ObjectId } from "mongodb";
import { collection, auth } from "../middleware.js";

export function Router() {
  const router = express.Router();

  router.use(auth);
  router.use(collection("staff"));

  router.get("/", async (req, res) => {
    try {
      const staffList = await collection.read(req).find({}).toArray();
      res.status(200).json(staffList);
    } catch (error) {
      console.error("Error retrieving staff:", error);
      res.status(500).json({ error: "Failed to retrieve staff" });
    }
  });

  router.post("/", async (req, res) => {
    try {
      const { phone_number } = req.body;

      if (!phone_number) {
        return res.status(400).json({ error: "Invalid request: phone_number is required" });
      }

      // Check if phone number already exists
      const existingStaff = await collection.read(req).findOne({ phone_number });

      if (existingStaff) {
        return res.status(409).json({ error: "Phone number already exists" });
      }

      const newStaff = {
        _id: new ObjectId(),
        phone_number,
        active: true,
      };

      await req.collection.insertOne(newStaff);
      res.status(201).json(newStaff);
    } catch (error) {
      console.error("Error adding staff:", error);
      res.status(500).json({ error: "Failed to add staff" });
    }
  });

  router.put("/:phone_number", async (req, res) => {
    try {
      const { phone_number } = req.params;
      const { active } = req.body;

      if (!phone_number) {
        return res.status(400).json({ error: "Phone number is required" });
      }

      if (typeof active !== "boolean") {
        return res.status(400).json({ error: "Active must be a boolean value" });
      }

      const result = await collection.read(req).updateOne({ phone_number }, { $set: { active } });

      if (result.matchedCount === 0) {
        return res.status(404).json({ error: "Phone number not found" });
      }

      res.status(200).json({
        message: "Staff member updated successfully",
        phone_number,
        active,
      });
    } catch (error) {
      console.error("Error updating staff:", error);
      res.status(500).json({ error: "Failed to update staff" });
    }
  });

  router.delete("/:phone_number", async (req, res) => {
    try {
      const { phone_number } = req.params;

      if (!phone_number) {
        return res.status(400).json({ error: "Phone number is required" });
      }

      const result = await collection.read(req).deleteOne({ phone_number });

      if (result.deletedCount === 0) {
        return res.status(404).json({ error: "Phone number not found" });
      }

      res.status(200).json({
        message: "Staff member removed successfully",
        phone_number,
      });
    } catch (error) {
      console.error("Error removing staff:", error);
      res.status(500).json({ error: "Failed to remove staff" });
    }
  });
  return router;
}
