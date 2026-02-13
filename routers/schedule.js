import express from "express";
import { auth } from "../middleware.js";
import { ScheduleClient } from "../clients/schedule.js";

export function Router(db) {
  const router = express.Router();
  const scheduleClient = new ScheduleClient(db);

  router.use(auth);

  // Get current user's profile (phone number association)
  router.get("/profile", async (req, res) => {
    try {
      const profile = await scheduleClient.getProfile(req.uid);
      res.status(200).json(profile || { uid: req.uid, phone_number: null });
    } catch (error) {
      console.error("Error getting profile:", error);
      res.status(500).json({ error: "Failed to get profile" });
    }
  });

  // Link current user's phone number
  router.post("/profile", async (req, res) => {
    try {
      const { phone_number } = req.body;

      if (!phone_number) {
        return res.status(400).json({ error: "phone_number is required" });
      }

      await scheduleClient.setProfile(req.uid, phone_number);
      res.status(200).json({ uid: req.uid, phone_number });
    } catch (error) {
      console.error("Error setting profile:", error);
      res.status(400).json({ error: error.message });
    }
  });

  // Unlink phone number and remove all schedules
  router.delete("/profile", async (req, res) => {
    try {
      await scheduleClient.deleteProfile(req.uid);
      res.status(200).json({ message: "Profile and schedules removed" });
    } catch (error) {
      console.error("Error deleting profile:", error);
      res.status(500).json({ error: "Failed to delete profile" });
    }
  });

  // Get all schedules (visible to everyone)
  router.get("/", async (req, res) => {
    try {
      const schedules = await scheduleClient.getAllSchedules();
      res.status(200).json(schedules);
    } catch (error) {
      console.error("Error getting schedules:", error);
      res.status(500).json({ error: "Failed to get schedules" });
    }
  });

  // Create a schedule entry (own only)
  router.post("/", async (req, res) => {
    try {
      const schedule = await scheduleClient.createSchedule(req.uid, req.body);
      res.status(201).json(schedule);
    } catch (error) {
      console.error("Error creating schedule:", error);
      res.status(400).json({ error: error.message });
    }
  });

  // Update a schedule entry (own only)
  router.put("/:id", async (req, res) => {
    try {
      await scheduleClient.updateSchedule(req.uid, req.params.id, req.body);
      res.status(200).json({ message: "Schedule updated" });
    } catch (error) {
      console.error("Error updating schedule:", error);
      const status = error.message.includes("Unauthorized") ? 403 : 400;
      res.status(status).json({ error: error.message });
    }
  });

  // Delete a schedule entry (own only)
  router.delete("/:id", async (req, res) => {
    try {
      await scheduleClient.deleteSchedule(req.uid, req.params.id);
      res.status(200).json({ message: "Schedule deleted" });
    } catch (error) {
      console.error("Error deleting schedule:", error);
      const status = error.message.includes("Unauthorized") ? 403 : 400;
      res.status(status).json({ error: error.message });
    }
  });

  return router;
}
