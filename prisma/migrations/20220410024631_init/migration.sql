-- CreateTable
CREATE TABLE `guild_event` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(255) NOT NULL,

    UNIQUE INDEX `guild_event_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `calendar` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `guild_event_id` INTEGER UNSIGNED NOT NULL,
    `day_of_week` TINYINT NOT NULL,
    `time` CHAR(6) NOT NULL,

    UNIQUE INDEX `calendar_day_of_week_time_key`(`day_of_week`, `time`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `config` (
    `key` VARCHAR(255) NOT NULL,
    `value` VARCHAR(255) NULL,

    PRIMARY KEY (`key`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `calendar` ADD CONSTRAINT `calendar_guild_event_id_fkey` FOREIGN KEY (`guild_event_id`) REFERENCES `guild_event`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
