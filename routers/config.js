import express from "express";
import { auth } from "../middleware.js";
import { ConfigClient } from "../clients/config.js";

export function Router(db) {
  const router = express.Router();
  const configClient = new ConfigClient(db);

  router.use(auth);

  // Get current configuration with available options for the settings page
  router.get("/", async (req, res) => {
    try {
      const config = await configClient.getValueOptions();
      res.status(200).json(config);
    } catch (error) {
      console.error("Error retrieving config:", error);
      res.status(500).json({ error: "Failed to retrieve configuration" });
    }
  });

  // Get configuration values by keys
  router.get("/values", async (req, res) => {
    try {
      const { keys } = req.query;

      if (!keys) {
        return res.status(400).json({ error: "Missing keys query parameter" });
      }

      // Break up I think correctly?
      const keyList = Array.isArray(keys) ? keys : keys.split(",").map(k => k.trim());

      const config = await configClient.getValuesByKeys(keyList);

      res.status(200).json(Object.fromEntries(config));
    } catch (error) {
      console.error("Error retrieving config by keys:", error);
      res.status(500).json({ error: error.message || "Failed to retrieve configuration" });
    }
  });

  // Update configuration off raw payload
  router.put("/", async (req, res) => {
    try {
      const result = await configClient.setValues(req.body);
      res.status(200).json(result);
    } catch (error) {
      console.error("Error updating config:", error);
      res.status(500).json({ error: "Failed to update configuration" });
    }
  });

  return router;
}
