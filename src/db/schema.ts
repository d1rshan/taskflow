import { pgTable, text, timestamp, boolean, pgEnum, jsonb, unique } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2"

// ---------- SCHEMA HELPERS ----------

const id = text("id")
  .primaryKey()
  .$defaultFn(() => createId());

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



export const CredentialType = {
  OPENAI: "OPENAI",
  ANTHROPIC: "ANTHROPIC",
  GEMINI: "GEMINI",
} as const;

export type CredentialType = (typeof CredentialType)[keyof typeof CredentialType];

export const credentialTypeEnum = pgEnum("credential_type", [
  CredentialType.OPENAI,
  CredentialType.ANTHROPIC,
  CredentialType.GEMINI,
]);


export const credential = pgTable("credential", {
  id,
  name: text("name").notNull(),
  value: text("value").notNull(),
  type: credentialTypeEnum("type").notNull(),
  userId: text("user_id").notNull(), // Assuming you handle User relation externally
  createdAt,
  updatedAt
});


export const NodeType = {
  INITIAL: "INITIAL",
  MANUAL_TRIGGER: "MANUAL_TRIGGER",
  HTTP_REQUEST: "HTTP_REQUEST",
  GOOGLE_FORM_TRIGGER: "GOOGLE_FORM_TRIGGER",
  ANTHROPIC: "ANTHROPIC",
  GEMINI: "GEMINI",
  OPENAI: "OPENAI"
} as const;

export type NodeType = (typeof NodeType)[keyof typeof NodeType];

export const nodeTypeEnum = pgEnum(
  "node_type",
  [NodeType.INITIAL, NodeType.MANUAL_TRIGGER, NodeType.HTTP_REQUEST, NodeType.GOOGLE_FORM_TRIGGER, NodeType.ANTHROPIC, NodeType.GEMINI, NodeType.OPENAI]
);

export const node = pgTable("node", {
  id,
  workflowId: text("workflow_id")
    .references(() => workflow.id, { onDelete: "cascade" })
    .notNull(),
  credentialId: text("credential_id")
    .references(() => credential.id, { onDelete: "set null" }),
  name: text("name").notNull(),
  type: nodeTypeEnum("type").notNull(),
  position: jsonb("position").notNull(),
  data: jsonb("data").default({}).notNull(),
  createdAt,
  updatedAt,
});

export const connection = pgTable(
  "connection",
  {
    id,
    workflowId: text("workflow_id")
      .references(() => workflow.id, { onDelete: "cascade" })
      .notNull(),
    fromNodeId: text("from_node_id")
      .references(() => node.id, { onDelete: "cascade" })
      .notNull(),
    toNodeId: text("to_node_id")
      .references(() => node.id, { onDelete: "cascade" })
      .notNull(),
    fromOutput: text("from_output").default("main").notNull(),
    toInput: text("to_input").default("main").notNull(),
    createdAt,
    updatedAt,
  },
  (t) => [
    unique().on(
      t.fromNodeId,
      t.toNodeId,
      t.fromOutput,
      t.toInput
    ),
  ]
);

// --- Types ---
export type Workflow = typeof workflow.$inferSelect;
export type NewWorkflow = typeof workflow.$inferInsert;

export type Credential = typeof credential.$inferSelect;
export type NewCredential = typeof credential.$inferInsert;

export type Node = typeof node.$inferSelect;
export type NewNode = typeof node.$inferInsert;

export type Connection = typeof connection.$inferSelect;
export type NewConnection = typeof connection.$inferInsert;

export const workflowRelations = relations(workflow, ({ many, one }) => ({
  nodes: many(node),
  connections: many(connection),
  // Assuming you have a user relation defined elsewhere:
  // user: one(users, { fields: [workflow.userId], references: [users.id] }),
}));

export const credentialRelations = relations(credential, ({ many }) => ({
  nodes: many(node), // One credential can satisfy multiple nodes
}));

export const nodeRelations = relations(node, ({ one, many }) => ({
  workflow: one(workflow, {
    fields: [node.workflowId],
    references: [workflow.id],
  }),
  // Distinct relations for Source vs Target connections
  credential: one(credential, {
    fields: [node.credentialId],
    references: [credential.id],
  }),
  outputConnections: many(connection, { relationName: "fromNode" }),
  inputConnections: many(connection, { relationName: "toNode" }),
}));

export const connectionRelations = relations(connection, ({ one }) => ({
  workflow: one(workflow, {
    fields: [connection.workflowId],
    references: [workflow.id],
  }),
  fromNode: one(node, {
    fields: [connection.fromNodeId],
    references: [node.id],
    relationName: "fromNode", // Links to outputConnections in Node
  }),
  toNode: one(node, {
    fields: [connection.toNodeId],
    references: [node.id],
    relationName: "toNode", // Links to inputConnections in Node
  }),
}));

