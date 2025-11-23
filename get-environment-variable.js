import { config } from "dotenv";

export function getEnvironmentVariable(name, defaultValue) {
  let variable = process.env[name];
  if (!variable) {
    if (defaultValue) {
      return defaultValue;
    }

    config(); // Should be one-time operation

    variable = process.env[name];

    if (!variable) {
      throw new Error(`Environment variable ${name} is not set and no default value provided`);
    }
  }

  return variable;
}
