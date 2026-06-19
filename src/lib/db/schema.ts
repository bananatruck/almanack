import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  timestamp,
  integer,
  real,
  jsonb,
  pgEnum,
  primaryKey,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";

// ===== ENUMS =====

export const mediaTypeEnum = pgEnum("media_type", [
  "movie",
  "tv_show",
  "book",
  "game",
  "manga",
  "comic",
  "anime",
  "animation",
  "music",
]);

export const logStatusEnum = pgEnum("log_status", [
  "planning",
  "watching",
  "reading",
  "playing",
  "listening",
  "completed",
  "dropped",
  "paused",
  "rewatching",
]);

export const reviewVisibilityEnum = pgEnum("review_visibility", [
  "public",
  "private",
  "followers_only",
]);

// ===== USERS =====

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  username: varchar("username", { length: 30 }).notNull().unique(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 100 }).notNull(),
  bio: text("bio"),
  avatarUrl: text("avatar_url"),
  bannerUrl: text("banner_url"),
  isPublic: boolean("is_public").notNull().default(true),
  emailVerified: boolean("email_verified").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ===== BETTER AUTH TABLES =====

export const sessions = pgTable("sessions", {
  id: text("id").primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const accounts = pgTable("accounts", {
  id: text("id").primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  idToken: text("id_token"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const verifications = pgTable("verifications", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ===== MEDIA ITEMS =====

export const mediaItems = pgTable(
  "media_items",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    title: varchar("title", { length: 500 }).notNull(),
    type: mediaTypeEnum("type").notNull(),
    releaseDate: varchar("release_date", { length: 20 }),
    posterUrl: text("poster_url"),
    backdropUrl: text("backdrop_url"),
    description: text("description"),
    avgRating: real("avg_rating"),
    ratingCount: integer("rating_count").notNull().default(0),
    externalIds: jsonb("external_ids").$type<Record<string, string | number>>(),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    index("media_items_type_rating_idx").on(table.type, table.avgRating),
    index("media_items_external_ids_idx").using("gin", table.externalIds),
  ]
);

// ===== RATINGS =====

export const ratings = pgTable(
  "ratings",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    mediaItemId: uuid("media_item_id")
      .notNull()
      .references(() => mediaItems.id, { onDelete: "cascade" }),
    score: integer("score").notNull(), // 1-5
    isFavorite: boolean("is_favorite").notNull().default(false),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("ratings_user_media_idx").on(
      table.userId,
      table.mediaItemId
    ),
    index("ratings_media_score_idx").on(table.mediaItemId, table.score),
  ]
);

// ===== LOGS =====

export const logs = pgTable(
  "logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    mediaItemId: uuid("media_item_id")
      .notNull()
      .references(() => mediaItems.id, { onDelete: "cascade" }),
    status: logStatusEnum("status").notNull(),
    startedAt: timestamp("started_at"),
    finishedAt: timestamp("finished_at"),
    progress: integer("progress"), // e.g., episode number, chapter number
    categoryMetadata: jsonb("category_metadata").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("logs_user_media_idx").on(table.userId, table.mediaItemId),
    index("logs_user_status_idx").on(table.userId, table.status),
  ]
);

// ===== REVIEWS =====

export const reviews = pgTable(
  "reviews",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    mediaItemId: uuid("media_item_id")
      .notNull()
      .references(() => mediaItems.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 200 }),
    body: text("body").notNull(),
    hasSpoilers: boolean("has_spoilers").notNull().default(false),
    visibility: reviewVisibilityEnum("visibility").notNull().default("public"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    index("reviews_media_created_idx").on(
      table.mediaItemId,
      table.createdAt
    ),
    index("reviews_user_created_idx").on(table.userId, table.createdAt),
  ]
);

// ===== REVIEW LIKES =====

export const reviewLikes = pgTable(
  "review_likes",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    reviewId: uuid("review_id")
      .notNull()
      .references(() => reviews.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.userId, table.reviewId] }),
  ]
);

// ===== REVIEW COMMENTS =====

export const reviewComments = pgTable("review_comments", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  reviewId: uuid("review_id")
    .notNull()
    .references(() => reviews.id, { onDelete: "cascade" }),
  body: text("body").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ===== FOLLOWS =====

export const follows = pgTable(
  "follows",
  {
    followerId: uuid("follower_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    followedId: uuid("followed_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.followerId, table.followedId] }),
    index("follows_follower_idx").on(table.followerId),
    index("follows_followed_idx").on(table.followedId),
  ]
);

// ===== LISTS =====

export const lists = pgTable("lists", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description"),
  isRanked: boolean("is_ranked").notNull().default(false),
  isPublic: boolean("is_public").notNull().default(true),
  type: varchar("type", { length: 50 }),
  coverUrl: text("cover_url"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ===== LIST ITEMS =====

export const listItems = pgTable(
  "list_items",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    listId: uuid("list_id")
      .notNull()
      .references(() => lists.id, { onDelete: "cascade" }),
    mediaItemId: uuid("media_item_id")
      .notNull()
      .references(() => mediaItems.id, { onDelete: "cascade" }),
    position: integer("position").notNull().default(0),
    note: text("note"),
  },
  (table) => [
    index("list_items_list_position_idx").on(table.listId, table.position),
  ]
);

// ===== ACTIVITY EVENTS =====

export const activityEvents = pgTable(
  "activity_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    eventType: varchar("event_type", { length: 50 }).notNull(),
    entityId: uuid("entity_id"),
    entityType: varchar("entity_type", { length: 50 }),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    index("activity_events_user_created_idx").on(
      table.userId,
      table.createdAt
    ),
  ]
);
