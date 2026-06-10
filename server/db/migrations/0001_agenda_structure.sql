CREATE TYPE "public"."day_pair" AS ENUM('seg-qua', 'ter-qui');--> statement-breakpoint
CREATE TYPE "public"."level_family" AS ENUM('fun', 'conv', 'power', 'sprint');--> statement-breakpoint
CREATE TABLE "classes" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "classes_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"room_id" bigint NOT NULL,
	"day_pair" "day_pair" NOT NULL,
	"start_time" text NOT NULL,
	"level_id" bigint NOT NULL,
	"capacity" integer DEFAULT 7 NOT NULL,
	"period" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "classes_capacity_range" CHECK ("classes"."capacity" BETWEEN 1 AND 9),
	CONSTRAINT "classes_start_time_valid" CHECK ("classes"."start_time" IN ('8:30','9:30','10:30','13:30','14:30','15:30','16:45','17:45'))
);
--> statement-breakpoint
CREATE TABLE "levels" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "levels_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"key" text NOT NULL,
	"name" text NOT NULL,
	"family" "level_family" NOT NULL,
	"sort_order" integer NOT NULL,
	CONSTRAINT "levels_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "rooms" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "rooms_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"name" text NOT NULL,
	"color" text NOT NULL,
	"teacher_name" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "classes" ADD CONSTRAINT "classes_room_id_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "classes" ADD CONSTRAINT "classes_level_id_levels_id_fk" FOREIGN KEY ("level_id") REFERENCES "public"."levels"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "uq_class_slot" ON "classes" USING btree ("room_id","day_pair","start_time","period");--> statement-breakpoint
CREATE INDEX "idx_classes_level" ON "classes" USING btree ("level_id");--> statement-breakpoint
CREATE INDEX "idx_classes_period" ON "classes" USING btree ("period");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_rooms_name" ON "rooms" USING btree (lower("name"));