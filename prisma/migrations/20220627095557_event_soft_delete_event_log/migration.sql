-- AlterTable
ALTER TABLE `event` ADD COLUMN `is_deleted` BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE `EventLog` (
    `id` CHAR(36) NOT NULL,
    `message` VARCHAR(255) NOT NULL,
    `crated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `event_id` INTEGER UNSIGNED NOT NULL,

    INDEX `EventLog_crated_at_idx`(`crated_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `EventLog` ADD CONSTRAINT `EventLog_event_id_fkey` FOREIGN KEY (`event_id`) REFERENCES `event`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
