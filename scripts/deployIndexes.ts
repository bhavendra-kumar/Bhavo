#!/usr/bin/env node

import fs from "fs";
import path from "path";
import { ensureAllIndexes } from "../src/lib/ensureIndexes";
import mongoose from "mongoose";

if (!process.env.DATABASE_URL) {
  const envPath = path.resolve(__dirname, "..", ".env");
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, "utf-8");
    for (const line of content.split("\n")) {
      const match = line.match(/^\s*([A-Za-z_0-9]+)\s*=\s*(.*)?\s*$/);
      if (match && !process.env[match[1]]) {
        const val = (match[2] || "").trim().replace(/^['"]|['"]$/g, "");
        process.env[match[1]] = val;
      }
    }
  }
}

async function main() {
  console.log("=================================================");
  console.log("🚀 Bhavo Production Index Deployment Utility");
  console.log("=================================================");

  const uri = process.env.DATABASE_URL;
  if (!uri) {
    console.error("❌ ERROR: DATABASE_URL environment variable is not defined.");
    console.error("   Please provide a valid MongoDB connection string.");
    process.exit(1);
  }

  const maskedUri = uri.replace(/\/\/[^:]+:[^@]+@/, "//***:***@");
  console.log(`Connecting to: ${maskedUri}`);

  try {
    const report = await ensureAllIndexes();

    console.log("\n📊 Index Deployment Summary:");
    for (const col of report.collections) {
      if (col.indexCount >= 0) {
        console.log(`  ✔ ${col.name.padEnd(25)}: ${col.indexCount} indexes synced`);
      } else {
        console.log(`  ✖ ${col.name.padEnd(25)}: FAILED`);
      }
    }

    if (report.success) {
      console.log("\n✅ All collection indexes successfully deployed and verified.");
      process.exit(0);
    } else {
      console.error("\n❌ One or more collections failed to deploy indexes.");
      process.exit(1);
    }
  } catch (err) {
    console.error("\n❌ Fatal error during index deployment:", err);
    process.exit(1);
  } finally {
    await mongoose.disconnect().catch(() => {});
  }
}

main();
