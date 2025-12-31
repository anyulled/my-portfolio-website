import { Redis } from "@upstash/redis";
import chalk from "chalk";
import dotenv from "dotenv";

dotenv.config();

async function flushRedis() {
  console.log(chalk.cyan("Flushing Redis cache..."));
  try {
    const redis = Redis.fromEnv();
    await redis.flushdb();
    console.log(chalk.green("Redis cache flushed successfully."));
  } catch (error) {
    console.error(chalk.red("Failed to flush Redis:"), error);
  }
}

await flushRedis();
