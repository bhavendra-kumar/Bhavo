#!/usr/bin/env node

import fs from "fs";
import path from "path";
import mongoose from "mongoose";
import { hash } from "bcryptjs";

// Load .env if not loaded
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
  const args = process.argv.slice(2);
  const email = (args[0] || "admin@bhavo.com").trim().toLowerCase();
  const password = args[1] || "Admin@Bhavo2026!";
  const name = args[2] || "Bhavo Super Admin";

  const uri = process.env.DATABASE_URL;
  if (!uri) {
    console.error("ERROR: DATABASE_URL is not defined in environment or .env.");
    process.exit(1);
  }

  console.log("=================================================");
  console.log("Bhavo Admin Account Provisioning Utility");
  console.log("=================================================");
  console.log(`Target Email : ${email}`);
  console.log(`Target Name  : ${name}`);

  await mongoose.connect(uri);
  const db = mongoose.connection.db;
  if (!db) {
    console.error("ERROR: Failed to establish database connection.");
    process.exit(1);
    throw new Error("Database connection is undefined");
  }
  const usersCollection = db.collection("users");

  const existing = await usersCollection.findOne({ email });
  const hashedPassword = await hash(password, 12);

  if (existing) {
    console.log(`\nFound existing account for ${email}. Promoting to ADMIN...`);
    await usersCollection.updateOne(
      { _id: existing._id },
      {
        $set: {
          role: "ADMIN",
          status: "ACTIVE",
          password: hashedPassword,
          tokenVersion: 0,
          updatedAt: new Date(),
        },
      }
    );
    console.log(`Successfully promoted existing user to ADMIN role.`);
  } else {
    console.log(`\nCreating new ADMIN account...`);
    const insertRes = await usersCollection.insertOne({
      name,
      email,
      password: hashedPassword,
      role: "ADMIN",
      status: "ACTIVE",
      tokenVersion: 0,
      walletBalance: 0,
      rating: 5.0,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    console.log(`Successfully created new ADMIN account (ID: ${insertRes.insertedId}).`);
  }

  console.log("\n=================================================");
  console.log("Admin Login Credentials:");
  console.log(`   Email   : ${email}`);
  console.log(`   Password: ${password}`);
  console.log("=================================================");
  console.log(" Go to /login or /admin in your browser to sign in.");

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error("Failed to provision admin:", err);
  process.exit(1);
});

