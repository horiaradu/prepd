import {
  pgTable,
  uuid,
  text,
  integer,
  jsonb,
  timestamp,
  index,
  primaryKey,
} from "drizzle-orm/pg-core";
import type {
  Ingredient,
  Step,
  RecipeImage,
  ParsedRecipe,
} from "@/types/recipe";

// NextAuth tables — must match @auth/drizzle-adapter expected schema

export const users = pgTable("user", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").unique(),
  emailVerified: timestamp("emailVerified", { mode: "date" }),
  image: text("image"),
});

export const accounts = pgTable(
  "account",
  {
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => [
    primaryKey({ columns: [account.provider, account.providerAccountId] }),
  ],
);

export const sessions = pgTable("session", {
  sessionToken: text("sessionToken").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = pgTable(
  "verificationToken",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (vt) => [primaryKey({ columns: [vt.identifier, vt.token] })],
);

// Application tables

export const recipes = pgTable(
  "recipes",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    sourceUrl: text("source_url").notNull(),
    sourceType: text("source_type").notNull(), // "youtube" | "web" | "image"
    language: text("language").notNull().default("en"), // "en" | "ro"
    servings: integer("servings"),
    ingredients: jsonb("ingredients").$type<Ingredient[]>().notNull(),
    prepSteps: jsonb("prep_steps").$type<Step[]>().notNull(),
    cookingSteps: jsonb("cooking_steps").$type<Step[]>().notNull(),
    images: jsonb("images").$type<RecipeImage[]>().default([]),
    originalRecipe: jsonb("original_recipe").$type<ParsedRecipe>(),
    rawContent: text("raw_content"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("idx_recipes_user_id").on(table.userId),
    index("idx_recipes_title").on(table.title),
  ],
);

export type RecipeRow = typeof recipes.$inferSelect;
export type NewRecipe = typeof recipes.$inferInsert;

export const cookLog = pgTable(
  "cook_log",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    recipeId: uuid("recipe_id")
      .notNull()
      .references(() => recipes.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tweaks: text("tweaks"),
    cookedAt: timestamp("cooked_at").defaultNow().notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("idx_cook_log_recipe_id").on(table.recipeId),
    index("idx_cook_log_user_id").on(table.userId),
  ],
);

export type CookLogRow = typeof cookLog.$inferSelect;
export type NewCookLog = typeof cookLog.$inferInsert;

export const recipeMessages = pgTable(
  "recipe_messages",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    recipeId: uuid("recipe_id")
      .notNull()
      .references(() => recipes.id, { onDelete: "cascade" }),
    role: text("role").notNull(), // "user" | "assistant"
    content: text("content").notNull(),
    // Populated only on assistant messages that represent recipe edits
    status: text("status").notNull().default("applied"), // "pending" | "applied" | "discarded" | "reverted"
    operations: jsonb("operations").$type<import("@/lib/recipe-operations").Operation[]>(),
    previousRecipe: jsonb("previous_recipe").$type<ParsedRecipe>(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("idx_recipe_messages_recipe_id").on(table.recipeId)],
);

export type RecipeMessageRow = typeof recipeMessages.$inferSelect;
export type NewRecipeMessage = typeof recipeMessages.$inferInsert;

export const recipeShares = pgTable(
  "recipe_shares",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    senderUserId: text("sender_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    recipientEmail: text("recipient_email").notNull(),
    recipeSnapshot: jsonb("recipe_snapshot")
      .$type<{
        title: string;
        servings: number | null;
        ingredients: Ingredient[];
        prepSteps: Step[];
        cookingSteps: Step[];
        images: RecipeImage[];
        sourceUrl: string;
        sourceType: string;
      }>()
      .notNull(),
    status: text("status").notNull().default("pending"), // "pending" | "accepted" | "discarded"
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("idx_recipe_shares_recipient").on(table.recipientEmail),
    index("idx_recipe_shares_sender").on(table.senderUserId),
  ],
);

export type RecipeShareRow = typeof recipeShares.$inferSelect;

export const pushSubscriptions = pgTable(
  "push_subscriptions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    endpoint: text("endpoint").notNull().unique(),
    p256dh: text("p256dh").notNull(),
    auth: text("auth").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("idx_push_subscriptions_user_id").on(table.userId)],
);

export const invitationCodes = pgTable("invitation_codes", {
  id: uuid("id").defaultRandom().primaryKey(),
  code: text("code").notNull().unique(),
  usedByUserId: text("used_by_user_id").references(() => users.id, {
    onDelete: "set null",
  }),
  usedAt: timestamp("used_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
