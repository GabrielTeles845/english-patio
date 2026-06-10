CREATE TYPE "public"."class_format" AS ENUM('sede', 'domicilio');--> statement-breakpoint
CREATE TYPE "public"."enrollment_source" AS ENUM('form', 'import', 'manual');--> statement-breakpoint
CREATE TYPE "public"."enrollment_status" AS ENUM('active', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."financial_resp_type" AS ENUM('legal', 'second', 'other');--> statement-breakpoint
CREATE TYPE "public"."responsible_type" AS ENUM('legal', 'second', 'financial');--> statement-breakpoint
CREATE TYPE "public"."contract_event_type" AS ENUM('signature.viewed', 'signature.accepted', 'signature.rejected', 'signature.delivery_failed', 'document.finished');--> statement-breakpoint
CREATE TYPE "public"."contract_status" AS ENUM('pending', 'sent', 'viewed', 'signed', 'rejected', 'failed');--> statement-breakpoint
CREATE TYPE "public"."sent_via" AS ENUM('email', 'whatsapp');--> statement-breakpoint
CREATE TYPE "public"."announcement_kind" AS ENUM('manual', 'automatic');--> statement-breakpoint
CREATE TYPE "public"."announcement_status" AS ENUM('sending', 'sent', 'failed');--> statement-breakpoint
CREATE TYPE "public"."channel" AS ENUM('email', 'whatsapp');--> statement-breakpoint
CREATE TYPE "public"."recipient_status" AS ENUM('queued', 'sent', 'failed', 'prepared');--> statement-breakpoint
CREATE TYPE "public"."notification_type" AS ENUM('enroll', 'signed', 'viewed', 'stale', 'email', 'rejected', 'failed');--> statement-breakpoint
CREATE TABLE "addresses" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "addresses_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"enrollment_id" bigint NOT NULL,
	"cep" text NOT NULL,
	"street" text NOT NULL,
	"number" text NOT NULL,
	"complement" text,
	"neighborhood" text NOT NULL,
	"city" text NOT NULL,
	"state" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "addresses_state_go" CHECK ("addresses"."state" = 'GO')
);
--> statement-breakpoint
CREATE TABLE "enrollments" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "enrollments_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"status" "enrollment_status" DEFAULT 'active' NOT NULL,
	"source" "enrollment_source" NOT NULL,
	"submission_id" text NOT NULL,
	"class_format" "class_format" NOT NULL,
	"payment_method" text DEFAULT 'boleto-6x' NOT NULL,
	"financial_responsible_type" "financial_resp_type" NOT NULL,
	"requested_day_pair" "day_pair",
	"requested_times" jsonb,
	"authorization_media" boolean DEFAULT false NOT NULL,
	"authorization_contract" boolean NOT NULL,
	"schedule_confirmed" boolean NOT NULL,
	"period" text NOT NULL,
	"notes" text,
	"submitted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "enrollments_submission_id_unique" UNIQUE("submission_id"),
	CONSTRAINT "enrollments_payment_method" CHECK ("enrollments"."payment_method" = 'boleto-6x')
);
--> statement-breakpoint
CREATE TABLE "responsibles" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "responsibles_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"enrollment_id" bigint NOT NULL,
	"type" "responsible_type" NOT NULL,
	"name" text NOT NULL,
	"cpf" text,
	"phone" text,
	"email" text,
	"relationship" text,
	"birth_date" date,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "students" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "students_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"enrollment_id" bigint NOT NULL,
	"name" text NOT NULL,
	"birth_date" date NOT NULL,
	"class_id" bigint,
	"at_school_since" date,
	"is_active" boolean DEFAULT true NOT NULL,
	"exit_reason" text,
	"exit_note" text,
	"exit_date" date,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contract_events" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "contract_events_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"contract_id" bigint NOT NULL,
	"event_id" text NOT NULL,
	"type" "contract_event_type" NOT NULL,
	"payload" jsonb,
	"received_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "contract_events_event_id_unique" UNIQUE("event_id")
);
--> statement-breakpoint
CREATE TABLE "contract_templates" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "contract_templates_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"name" text NOT NULL,
	"pdf_url" text NOT NULL,
	"field_map" jsonb NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"is_active" boolean DEFAULT false NOT NULL,
	"archived_at" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contracts" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "contracts_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"enrollment_id" bigint NOT NULL,
	"template_id" bigint,
	"pdf_url" text,
	"status" "contract_status" DEFAULT 'pending' NOT NULL,
	"autentique_doc_id" text,
	"sent_via" "sent_via",
	"sent_at" timestamp with time zone,
	"viewed_at" timestamp with time zone,
	"signed_at" timestamp with time zone,
	"rejected_at" timestamp with time zone,
	"failed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "announcement_recipients" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "announcement_recipients_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"announcement_id" bigint NOT NULL,
	"enrollment_id" bigint,
	"channel" "channel" NOT NULL,
	"status" "recipient_status" DEFAULT 'queued' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "announcements" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "announcements_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"subject" text NOT NULL,
	"body" text NOT NULL,
	"channels" "channel"[] NOT NULL,
	"audience_filter" jsonb,
	"status" "announcement_status" DEFAULT 'sending' NOT NULL,
	"kind" "announcement_kind" DEFAULT 'manual' NOT NULL,
	"sent_at" timestamp with time zone,
	"created_by" bigint
);
--> statement-breakpoint
CREATE TABLE "site_content" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "site_content_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"page_key" text NOT NULL,
	"field_key" text NOT NULL,
	"value" text NOT NULL,
	"draft_value" text,
	"published_at" timestamp with time zone,
	"updated_by" bigint,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "notifications_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"user_id" bigint NOT NULL,
	"type" "notification_type" NOT NULL,
	"student_id" bigint,
	"title" text NOT NULL,
	"body" text,
	"read_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "addresses" ADD CONSTRAINT "addresses_enrollment_id_enrollments_id_fk" FOREIGN KEY ("enrollment_id") REFERENCES "public"."enrollments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "responsibles" ADD CONSTRAINT "responsibles_enrollment_id_enrollments_id_fk" FOREIGN KEY ("enrollment_id") REFERENCES "public"."enrollments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "students" ADD CONSTRAINT "students_enrollment_id_enrollments_id_fk" FOREIGN KEY ("enrollment_id") REFERENCES "public"."enrollments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "students" ADD CONSTRAINT "students_class_id_classes_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contract_events" ADD CONSTRAINT "contract_events_contract_id_contracts_id_fk" FOREIGN KEY ("contract_id") REFERENCES "public"."contracts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_enrollment_id_enrollments_id_fk" FOREIGN KEY ("enrollment_id") REFERENCES "public"."enrollments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_template_id_contract_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."contract_templates"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "announcement_recipients" ADD CONSTRAINT "announcement_recipients_announcement_id_announcements_id_fk" FOREIGN KEY ("announcement_id") REFERENCES "public"."announcements"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "announcement_recipients" ADD CONSTRAINT "announcement_recipients_enrollment_id_enrollments_id_fk" FOREIGN KEY ("enrollment_id") REFERENCES "public"."enrollments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "announcements" ADD CONSTRAINT "announcements_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "site_content" ADD CONSTRAINT "site_content_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_addr_enroll" ON "addresses" USING btree ("enrollment_id");--> statement-breakpoint
CREATE INDEX "idx_enroll_period" ON "enrollments" USING btree ("period");--> statement-breakpoint
CREATE INDEX "idx_enroll_status" ON "enrollments" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_resp_enroll" ON "responsibles" USING btree ("enrollment_id");--> statement-breakpoint
CREATE INDEX "idx_resp_cpf" ON "responsibles" USING btree ("cpf");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_resp_enroll_type" ON "responsibles" USING btree ("enrollment_id","type");--> statement-breakpoint
CREATE INDEX "idx_students_enroll" ON "students" USING btree ("enrollment_id");--> statement-breakpoint
CREATE INDEX "idx_students_class" ON "students" USING btree ("class_id");--> statement-breakpoint
CREATE INDEX "idx_students_active" ON "students" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "idx_cevents_contract" ON "contract_events" USING btree ("contract_id");--> statement-breakpoint
CREATE INDEX "idx_contracts_enroll" ON "contracts" USING btree ("enrollment_id");--> statement-breakpoint
CREATE INDEX "idx_contracts_status" ON "contracts" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_recipients_ann" ON "announcement_recipients" USING btree ("announcement_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_site_content_page_field" ON "site_content" USING btree ("page_key","field_key");--> statement-breakpoint
CREATE INDEX "idx_notif_user_unread" ON "notifications" USING btree ("user_id") WHERE "notifications"."read_at" is null;