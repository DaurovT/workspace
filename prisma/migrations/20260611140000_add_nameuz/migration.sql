-- bilingual reference names (audit: RU/UZ)
ALTER TABLE "Category"    ADD COLUMN "nameUz" TEXT;
ALTER TABLE "Account"     ADD COLUMN "nameUz" TEXT;
ALTER TABLE "LegalEntity" ADD COLUMN "nameUz" TEXT;
