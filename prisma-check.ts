import "dotenv/config";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

async function main() {
  const connectionString = process.env.DATABASE_URL;
  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });
  try {
    console.log("Testing Prisma connection...");
    const result = await prisma.$queryRaw`SELECT 1 as result`;
    console.log("Success! Result:", result);
  } catch (e) {
    console.error("Failed to connect to database:", e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
