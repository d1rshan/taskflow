import { pgTable, text, timestamp, boolean } from "drizzle-orm/pg-core";
import { randomBytes } from "crypto";

// ---------- SCHEMA HELPERS ----------

function generateId(length = 32): string {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const bytes = randomBytes(length);
  let result = "";

  for (let i = 0; i < length; i++) {
    result += chars[bytes[i] % chars.length];
  }

  return result;
}

const id = text("id")
  .$defaultFn(() => generateId())
  .primaryKey().notNull();

const createdAt = timestamp("created_at").defaultNow().notNull();

const updatedAt = timestamp("updated_at")
  .defaultNow()
  .$onUpdate(() => /* @__PURE__ */ new Date())
  .notNull();

//----------- BETTER AUTH GENERATED SCHEMA ---------

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"),
  createdAt,
  updatedAt,
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt,
  updatedAt,
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt,
  updatedAt,
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt,
  updatedAt,
});

// ----------- CUSTOM SCHEMA ---------

export const workflow = pgTable("workflow", {
  id,
  name: text("name").notNull(),
  userId: text("user_id")
    .references(() => user.id, { onDelete: "cascade" })
    .notNull(),
  createdAt,
  updatedAt,
});

export type Workflow = typeof workflow.$inferSelect
