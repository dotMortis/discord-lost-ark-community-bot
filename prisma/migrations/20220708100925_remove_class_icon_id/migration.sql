/*
  Warnings:

  - You are about to drop the column `icon_id` on the `class` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX `class_icon_id_key` ON `class`;

-- AlterTable
ALTER TABLE `class` DROP COLUMN `icon_id`;
