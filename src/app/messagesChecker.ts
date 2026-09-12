import chalk from "chalk";
import fs from "node:fs";
import { createRequire } from "node:module";
import path from "path";

const requireJson = createRequire(import.meta.url);

const referenceFilePath = path.join("src/messages", "en.json");
const messagesFolderPath = path.join("src/messages");

const getKeysFromJsonFile = (filePath: string): string[] => {
  const jsonDataRaw: unknown = requireJson(path.resolve(filePath));
  const isRecord = (val: unknown): val is Record<string, unknown> =>
    typeof val === "object" && val !== null;

  if (!isRecord(jsonDataRaw)) {
    throw new Error(`Invalid JSON format in ${filePath}`);
  }
  const jsonData = jsonDataRaw;

  const collectKeys = (obj: Record<string, unknown>, prefix = ""): string[] => {
    const isRecord = (val: unknown): val is Record<string, unknown> =>
      typeof val === "object" && val !== null;

    return Object.entries(obj).flatMap(([key, value]) => {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      if (isRecord(value)) {
        return collectKeys(value, fullKey);
      }
      return fullKey;
    });
  };

  return collectKeys(jsonData);
};

const referenceKeys = getKeysFromJsonFile(referenceFilePath);

fs.readdir(messagesFolderPath, (err, files) => {
  if (err) {
    console.error(chalk.red("Error reading messages folder:"), err);
    process.exit(1);
  }

  const referenceKeysSet = new Set(referenceKeys);
  // Hoist the array conversion outside the loop to prevent redundant O(N) allocations
  const referenceKeysArray = [...referenceKeysSet];

  files.forEach((file) => {
    if (path.extname(file) === ".json" && file !== "en.json") {
      const filePath = path.join(messagesFolderPath, file);
      const fileKeys = getKeysFromJsonFile(filePath);

      const fileKeysSet = new Set(fileKeys);

      const missingKeys = referenceKeysArray.filter(
        (key) => !fileKeysSet.has(key),
      );

      if (missingKeys.length > 0) {
        console.error(
          chalk.red(
            `Error: The following keys are missing in ${chalk.magenta(file)}:`,
          ),
        );
        console.error(
          chalk.red(`Missing keys: ${chalk.magenta(missingKeys.join(", "))}`),
        );
        process.exit(1);
      }
    }
  });

  console.log(chalk.green("All JSON files have matching keys."));
});
