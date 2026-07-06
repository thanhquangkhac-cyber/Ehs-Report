import "dotenv/config";
import { db, schema } from "./client";
import { hashPassword } from "../auth/password";
import { eq } from "drizzle-orm";

const { users } = schema;

async function upsertUser(
  username: string,
  password: string,
  role: "admin" | "quanly" | "nhanvien",
  displayName: string
) {
  const [existing] = await db
    .select()
    .from(users)
    .where(eq(users.username, username))
    .limit(1);

  const passwordHash = await hashPassword(password);

  if (existing) {
    await db
      .update(users)
      .set({ passwordHash, role, displayName, isActive: 1 })
      .where(eq(users.id, existing.id));
    console.log(`Updated user: ${username} (${role})`);
  } else {
    await db.insert(users).values({ username, passwordHash, role, displayName });
    console.log(`Created user: ${username} (${role})`);
  }
}

async function main() {
  await upsertUser("admin", "admin123", "admin", "Quan tri vien");
  await upsertUser("manager", "manager123", "quanly", "Quan ly");
  await upsertUser("nhanvien", "nhanvien123", "nhanvien", "Nhan vien");
  console.log("Seed complete.");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
