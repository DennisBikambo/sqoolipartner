/**
 * Backup Script for Convex Database
 *
 * This script exports all data from your Convex deployment to JSON files
 * Run BEFORE making schema changes or seeding new data
 *
 * Usage: npx tsx scripts/backupData.ts
 */

import { ConvexHttpClient } from "convex/browser";
import * as fs from "fs";
import * as path from "path";

const CONVEX_URL = process.env.VITE_CONVEX_URL || "https://industrious-bear-173.convex.cloud";
const BACKUP_DIR = path.join(process.cwd(), "backups", new Date().toISOString().split('T')[0]);

// List of tables to backup
const TABLES_TO_BACKUP = [
  "partners",
  "users",
  "permissions",
  "roles",
  "campaigns",
  "programs",
  "curricula",
  "subjects",
  "program_subjects",
  "program_enrollments",
  "assets",
  "partner_revenue_logs",
  "transactions",
  "wallets",
  "audit_logs",
  "sessions",
  "withdrawals",
  "withdrawal_limits",
  "notifications"
];

async function backupTable(client: ConvexHttpClient, tableName: string) {
  try {
    console.log(`📦 Backing up table: ${tableName}...`);

    // Try to query the table - this will fail if table doesn't exist
    const data = await client.query(`${tableName}:list` as any, {}).catch(() => null);

    if (!data) {
      // Try alternative query method
      console.log(`   ⚠️  No list function found, skipping ${tableName}`);
      return null;
    }

    const filename = path.join(BACKUP_DIR, `${tableName}.json`);
    fs.writeFileSync(filename, JSON.stringify(data, null, 2));

    console.log(`   ✅ Backed up ${Array.isArray(data) ? data.length : 0} records`);
    return data;
  } catch (error) {
    console.log(`   ⚠️  Could not backup ${tableName}:`, (error as Error).message);
    return null;
  }
}

async function main() {
  console.log("🔄 Starting Convex Database Backup...\n");
  console.log(`📍 Deployment: ${CONVEX_URL}`);
  console.log(`💾 Backup Directory: ${BACKUP_DIR}\n`);

  // Create backup directory
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }

  const client = new ConvexHttpClient(CONVEX_URL);

  const backupSummary: Record<string, number> = {};

  for (const tableName of TABLES_TO_BACKUP) {
    const data = await backupTable(client, tableName);
    if (data) {
      backupSummary[tableName] = Array.isArray(data) ? data.length : 0;
    }
  }

  // Save backup summary
  const summaryPath = path.join(BACKUP_DIR, "_backup_summary.json");
  fs.writeFileSync(summaryPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    deployment: CONVEX_URL,
    tables: backupSummary,
    total_records: Object.values(backupSummary).reduce((a, b) => a + b, 0)
  }, null, 2));

  console.log("\n✅ Backup completed!\n");
  console.log("📊 Summary:");
  console.log("─".repeat(50));
  Object.entries(backupSummary).forEach(([table, count]) => {
    console.log(`   ${table.padEnd(30)} ${count.toString().padStart(6)} records`);
  });
  console.log("─".repeat(50));
  console.log(`   Total: ${Object.values(backupSummary).reduce((a, b) => a + b, 0)} records\n`);
  console.log(`💾 Backup saved to: ${BACKUP_DIR}\n`);

  client.close();
}

main().catch((error) => {
  console.error("❌ Backup failed:", error);
  process.exit(1);
});
