/**
 * Script to seed permissions and roles in Convex database
 *
 * Usage:
 *   npx tsx scripts/seedDatabase.ts
 *
 * Or using Convex CLI:
 *   npx convex run seedPermissions:seedPermissions
 *   npx convex run seedRoles:seedDefaultRoles
 */

import { ConvexHttpClient } from "convex/browser";

const CONVEX_URL = process.env.VITE_CONVEX_URL || "https://patient-hornet-303.convex.cloud";

async function main() {
  const client = new ConvexHttpClient(CONVEX_URL);

  console.log("🌱 Starting database seeding...\n");
  console.log(`📍 Connected to: ${CONVEX_URL}\n`);

  try {
    // Step 1: Seed Permissions
    console.log("📋 Step 1: Seeding permissions...");
    const permissionResult = await client.mutation("seedPermissions:seedPermissions" as any, {});
    console.log("✅ Permissions:", permissionResult);
    console.log();

    // Step 2: Seed Roles
    console.log("👥 Step 2: Seeding roles...");
    const rolesResult = await client.mutation("seedRoles:seedDefaultRoles" as any, {});
    console.log("✅ Roles:", rolesResult);
    console.log();

    console.log("🎉 Database seeding completed successfully!\n");
    console.log("Next steps:");
    console.log("1. Create a super_admin user in your application");
    console.log("2. Assign the user the super_admin role");
    console.log("3. Ensure the user has the 'all_access.full' permission\n");

  } catch (error) {
    console.error("❌ Error seeding database:", error);
    process.exit(1);
  } finally {
    client.close();
  }
}

main();
