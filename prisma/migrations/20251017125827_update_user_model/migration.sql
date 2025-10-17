/*
  Warnings:

  - You are about to drop the column `username` on the `users` table. All the data in the column will be lost.
  - Made the column `email` on table `users` required. This step will fail if there are existing NULL values in that column.

*/
-- DropIndex
DROP INDEX "public"."users_username_key";

-- AlterTable
ALTER TABLE "users" DROP COLUMN "username",
ALTER COLUMN "email" SET NOT NULL;
