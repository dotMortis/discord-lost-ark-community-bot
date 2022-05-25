-- CreateTable
CREATE TABLE `event_role` (
    `uid` CHAR(36) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `id` VARCHAR(255) NOT NULL,
    `event_id` INTEGER UNSIGNED NOT NULL,

    INDEX `event_role_id_name_idx`(`id`, `name`),
    PRIMARY KEY (`uid`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `event_role` ADD CONSTRAINT `event_role_event_id_fkey` FOREIGN KEY (`event_id`) REFERENCES `event`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
