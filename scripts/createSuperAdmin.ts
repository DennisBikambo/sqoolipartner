/**
 * Create or Update a Super Admin User
 *
 * This script updates an existing user to have super_admin role
 *
 * Usage:
 *   npx tsx scripts/createSuperAdmin.ts <user_email>
 *
 * Example:
 *   npx tsx scripts/createSuperAdmin.ts admin@example.com
 */

import { ConvexHttpClient } from "convex/browser";

const CONVEX_URL = "https://industrious-bear-173.convex.cloud";
const SUPER_ADMIN_PERMISSION_ID = "jn794wvh6dn5fvd8ztt7baz1x97vh1nj"; // all_access.full

async function main() {
  const userEmail = process.argv[2];

  if (!userEmail) {
    console.error("❌ Please provide a user email");
    console.error("Usage: npx tsx scripts/createSuperAdmin.ts <user_email>");
    process.exit(1);
  }

  const client = new ConvexHttpClient(CONVEX_URL);

  console.log("🔍 Looking for user:", userEmail);
  console.log("📍 Deployment:", CONVEX_URL);
  console.log();

  try {
    // Find the user by email
    const users = await client.query("user:getUserByEmail" as any, { email: userEmail });

    if (!users || (Array.isArray(users) && users.length === 0)) {
      console.error(`❌ User not found: ${userEmail}`);
      console.error("\nMake sure the user exists in the database first.");
      process.exit(1);
    }

    const user = Array.isArray(users) ? users[0] : users;

    console.log("✅ Found user:");
    console.log(`   Name: ${user.name}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Current Role: ${user.role}`);
    console.log();

    console.log("🔄 Updating user to super_admin...");

    // Update the user
    await client.mutation("user:updateUser" as any, {
      user_id: user._id,
      role: "super_admin",
      permission_ids: [SUPER_ADMIN_PERMISSION_ID],
      is_active: true,
      is_account_activated: true,
    });

    console.log("✅ User updated successfully!");
    console.log();
    console.log("📋 New user details:");
    console.log(`   Role: super_admin`);
    console.log(`   Permission: all_access.full`);
    console.log(`   Active: true`);
    console.log(`   Activated: true`);
    console.log();
    console.log("🎉 User is now a Super Administrator!");
    console.log("   Login with this user to test full access.");

  } catch (error) {
    console.error("❌ Error:", (error as Error).message);
    process.exit(1);
  } finally {
    client.close();
  }
}

main();
