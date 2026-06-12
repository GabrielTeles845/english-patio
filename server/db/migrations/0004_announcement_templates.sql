CREATE TABLE "announcement_templates" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "announcement_templates_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"name" text NOT NULL,
	"subject" text NOT NULL,
	"body" text NOT NULL,
	"icon" text DEFAULT 'file-text' NOT NULL,
	"color" text DEFAULT '#2F539A' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
INSERT INTO "announcement_templates" ("name", "subject", "body", "icon", "color") VALUES
	('Recesso / Vacation Classes', E'Recesso de julho — Vacation Classes 📅', E'Olá, {{nome_responsavel}}!\n\nPassando para lembrar que em julho acontecem as Vacation Classes: as mensalidades do mês são convertidas integralmente em vivências divertidas e imersivas.\n\nEm breve mandamos a programação completa. Qualquer dúvida, é só responder este e-mail!\n\nAbraços,\nEquipe English Patio', 'sun', '#F5B700'),
	('Lembrete de contrato', E'Falta pouco: contrato de {{nome_aluno}}', E'Olá, {{nome_responsavel}}!\n\nNotamos que o contrato de {{nome_aluno}} ainda está aguardando assinatura. É rapidinho — qualquer dificuldade, respondemos por aqui ou pelo WhatsApp da escola.\n\nAbraços,\nEquipe English Patio', 'file-clock', '#B5860B'),
	('Comunicado geral', E'Comunicado — English Patio', E'Olá, {{nome_responsavel}}!\n\n[Escreva aqui o seu recado]\n\nAbraços,\nEquipe English Patio', 'megaphone', '#2F539A');
