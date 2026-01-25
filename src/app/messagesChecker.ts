import chalk from "chalk";
import fs from "fs";
import path from "path";


const referenceFilePath = path.join("src/messages", "en.json");
const messagesFolderPath = path.join("src/messages");

const getKeysFromJsonFile = (filePath: string): string[] => {
  const data = fs.readFileSync(filePath, "utf-8");
  const jsonDataRaw: unknown = JSON.parse(data);
  const isRecord = (val: unknown): val is Record<string, unknown> =>
    typeof val === "object" && val !== null;

  if (!isRecord(jsonDataRaw)) {
    throw new Error(`Invalid JSON format in ${filePath}`);
  }
  const jsonData = jsonDataRaw;

  const collectKeys = (
    obj: Record<string, unknown>,
    prefix = "",
  ): string[] => {
    const isRecord = (val: unknown): val is Record<string, unknown> =>
      typeof val === "object" && val !== null;

    return Object.keys(obj).flatMap((key) => {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      const value = obj[key];
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

  files.forEach((file) => {
    if (path.extname(file) === ".json" && file !== "en.json") {
      const filePath = path.join(messagesFolderPath, file);
      const fileKeys = getKeysFromJsonFile(filePath);

      const fileKeysSet = new Set(fileKeys);

      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
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
