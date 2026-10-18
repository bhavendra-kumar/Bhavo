#!/usr/bin/env node

import { ensureAllIndexes } from "../src/lib/ensureIndexes";
import mongoose from "mongoose";

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
