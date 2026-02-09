CREATE TABLE "feeds" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"caption" text NOT NULL,
	"image_url" text NOT NULL,
	"user_id" uuid NOT NULL,
	"user_name" text NOT NULL,
	"user_avatar" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
