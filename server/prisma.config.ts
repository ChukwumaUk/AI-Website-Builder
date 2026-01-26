import "dotenv/config";
import { defineConfig } from "@prisma/config";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    // Adding 'as string' usually clears the red highlight on 'url'
    url: process.env.DATABASE_URL as string,
  },
  client: {
    // Explicitly typing the url here helps the linter
    adapter: (url: string) => {
      const pool = new Pool({ connectionString: url });
      return new PrismaPg(pool) as any; // 'as any' is a temporary fix for the red line
    },
  },
});