import { randomUUID } from "node:crypto";
import express from "express";
import { ObjectId } from "mongodb";
import { collection, auth } from "../middleware.js";
import { ScheduleClient } from "../clients/schedule.js";
import { NotificationClient } from "../clients/notification.js";

export function Router(db) {
  const scheduleClient = new ScheduleClient(db);
  const notificationClient = new NotificationClient(db);
  const router = express.Router();

  router.use(auth);
  router.use(collection("staff"));

  router.get("/", async (req, res) => {
    try {
      const staffList = await collection.read(req).find({}).toArray();
      const strippedNumberStaffList = staffList.map(staff => {
        const repeatCount = staff.phone_number.length - 4;
        const maskLength = repeatCount > 0 ? repeatCount : 0;

        return {
          ...staff,
          phone_number: `${"*".repeat(maskLength)}${staff.phone_number.slice(-4)}`,
        };
      });
      res.status(200).json(strippedNumberStaffList);
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
        id: randomUUID(),
        phone_number,
        active: true,
      };

      await req.collection.insertOne(newStaff);
      res.status(201).json(newStaff);

      notificationClient
        .sendSMS(phone_number, "You have been added to the on-call staff list and are currently active.")
        .catch(err => console.error("Failed to send add notification:", err));
    } catch (error) {
      console.error("Error adding staff:", error);
      res.status(500).json({ error: "Failed to add staff" });
    }
  });

  // Just used for toggling active state today
  router.put("/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { active } = req.body;

      if (!id) {
        return res.status(400).json({ error: "Staff ID is required" });
      }

      if (typeof active !== "boolean") {
        return res.status(400).json({ error: "Active must be a boolean value" });
      }

      const staff = await collection.read(req).findOne({ id });

      if (!staff) {
        return res.status(404).json({ error: "Staff member not found" });
      }

      await collection.read(req).updateOne({ id }, { $set: { active } });

      res.status(200).json({
        message: "Staff member updated successfully",
        id,
        active,
      });

      const statusLabel = active ? "activated" : "deactivated";
      notificationClient
        .sendSMS(staff.phone_number, `You have been ${statusLabel} on the on-call staff list.`)
        .catch(err => console.error("Failed to send status notification:", err));
    } catch (error) {
      console.error("Error updating staff:", error);
      res.status(500).json({ error: "Failed to update staff" });
    }
  });

  router.delete("/:id", async (req, res) => {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({ error: "Staff ID is required" });
      }

      const staff = await collection.read(req).findOne({ id });

      if (!staff) {
        return res.status(404).json({ error: "Staff member not found" });
      }

      await collection.read(req).deleteOne({ id });
      await scheduleClient.deleteByPhoneNumber(staff.phone_number);

      res.status(200).json({
        message: "Staff member removed successfully",
        id,
      });
    } catch (error) {
      console.error("Error removing staff:", error);
      res.status(500).json({ error: "Failed to remove staff" });
    }
  });
  return router;
}
