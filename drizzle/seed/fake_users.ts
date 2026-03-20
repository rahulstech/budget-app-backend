import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { users } from "../../src/data/schema/Tables.js";
import { DBConfig } from "../db.config.js";

const { user, password, host, port, database, ssl } = DBConfig;

const pool = new Pool({
  user, password, host, port, database, ssl
});

const db = drizzle(pool);

async function main() {
  console.log("Seeding database...");

  await db.insert(users).values(
    [
        {
            id: "6f1a9b3c-2e4d-4f8a-9c1a-1a2b3c4d5e01",
            firstName: "Amit",
            lastName: "Sharma",
            email: "amit.sharma@email.com",
            photo: "https://dnjlzdll1pbqd.cloudfront.net/user-photos/photo1.jpg",
            photoKey: "public/user-photos/photo1.jpg",
            lastModified: Date.now()
        },
        {
            id: "7c2b8d4e-5f6a-4c1d-8e2f-2b3c4d5e6f02",
            firstName: "Neha",
            lastName: "Verma",
            email: "neha.verma@email.com",
            photo: "https://dnjlzdll1pbqd.cloudfront.net/user-photos/photo2.jpg",
            photoKey: "public/user-photos/photo2.jpg",
            lastModified: Date.now()
        },
        {
            id: "8d3c9e5f-6a7b-4d2e-9f3a-3c4d5e6f7a03",
            firstName: "Priya",
            lastName: "Sen",
            email: "priya.sen@email.com",
            photo: "https://dnjlzdll1pbqd.cloudfront.net/user-photos/photo3.jpg",
            photoKey: "public/user-photos/photo3.jpg",
            lastModified: Date.now()
        },
        {
            id: "9e4d1f6a-7b8c-4e3f-a14b-4d5e6f7a8b04",
            firstName: "Arjun",
            lastName: "Mehta",
            email: "arjun.mehta.verma@email.com",
            photo: "https://dnjlzdll1pbqd.cloudfront.net/user-photos/photo4.jpg",
               photoKey: "public/user-photos/photo4.jpg",
            lastModified: Date.now()
        },
        {
            id: "af5e2a7b-8c9d-4f4a-b25c-5e6f7a8b9c05",
            firstName: "Pranab",
            lastName: "Rathor",
            email: "pranab.rathor@email.com",
            photo: "https://dnjlzdll1pbqd.cloudfront.net/user-photos/photo5.jpg",
            photoKey: "public/user-photos/photo5.jpg",
            lastModified: Date.now()
        }
    ]
  );

  console.log("fake_users seeding complete");
  process.exit(0);
}

main().catch((err) => {
  console.error("fake_users seed failed:", err);
  process.exit(1);
});
