-- CreateTable
CREATE TABLE `event` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `description` VARCHAR(255) NULL,
    `channelId` VARCHAR(255) NOT NULL,
    `messageId` VARCHAR(255) NULL,
    `supps` INTEGER NOT NULL,
    `dds` INTEGER NOT NULL,
    `free` INTEGER NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `creator_id` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `party` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `description` VARCHAR(255) NULL,
    `isDone` BOOLEAN NOT NULL DEFAULT false,
    `event_id` INTEGER UNSIGNED NOT NULL,
    `crated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `party_member` (
    `uid` CHAR(36) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `char_no` TINYINT NOT NULL,
    `member_no` TINYINT NOT NULL,
    `class_uid` CHAR(36) NOT NULL,
    `party_id` INTEGER UNSIGNED NOT NULL,

    UNIQUE INDEX `party_member_member_no_party_id_key`(`member_no`, `party_id`),
    UNIQUE INDEX `party_member_user_id_party_id_key`(`user_id`, `party_id`),
    PRIMARY KEY (`uid`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `class` (
    `uid` CHAR(36) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `icon` VARCHAR(191) NOT NULL,
    `icon_id` VARCHAR(191) NULL,
    `role` ENUM('DD', 'SUPP') NOT NULL,

    UNIQUE INDEX `class_name_key`(`name`),
    UNIQUE INDEX `class_icon_key`(`icon`),
    UNIQUE INDEX `class_icon_id_key`(`icon_id`),
    PRIMARY KEY (`uid`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `party` ADD CONSTRAINT `party_event_id_fkey` FOREIGN KEY (`event_id`) REFERENCES `event`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `party_member` ADD CONSTRAINT `party_member_party_id_fkey` FOREIGN KEY (`party_id`) REFERENCES `party`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `party_member` ADD CONSTRAINT `party_member_class_uid_fkey` FOREIGN KEY (`class_uid`) REFERENCES `class`(`uid`) ON DELETE RESTRICT ON UPDATE CASCADE;
