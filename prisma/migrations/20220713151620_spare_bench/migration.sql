/*
  Warnings:

  - You are about to drop the `event_role` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `event_role` DROP FOREIGN KEY `event_role_event_id_fkey`;

-- DropIndex
DROP INDEX `party_member_user_id_party_id_key` ON `party_member`;

-- AlterTable
ALTER TABLE `party` ADD COLUMN `is_spare_bench` BOOLEAN NOT NULL DEFAULT false;

-- DropTable
DROP TABLE `event_role`;
