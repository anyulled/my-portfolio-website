import fs from "fs";
import path from "path";
import chalk from "chalk";

/*eslint-disable @typescript-eslint/ban-ts-comment */

const referenceFilePath = path.join("src/messages", "en.json");
const messagesFolderPath = path.join("src/messages");

const getKeysFromJsonFile = (filePath: string): string[] => {
  const data = fs.readFileSync(filePath, "utf-8");
  const jsonData = JSON.parse(data);

  const collectKeys = (
    obj: Record<string, unknown>,
    prefix: string = "",
  ): string[] => {
    return Object.keys(obj).flatMap((key) => {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      if (typeof obj[key] === "object" && obj[key] !== null) {
        return collectKeys(obj[key] as Record<string, unknown>, fullKey);
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

  files.forEach((file) => {
    if (path.extname(file) === ".json" && file !== "en.json") {
      const filePath = path.join(messagesFolderPath, file);
      const fileKeys = getKeysFromJsonFile(filePath);

      const referenceKeysSet = new Set(referenceKeys);
      const fileKeysSet = new Set(fileKeys);

      // @ts-ignore
      const missingKeys = [...referenceKeysSet].filter(
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
