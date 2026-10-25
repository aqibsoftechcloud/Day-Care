-- DropForeignKey
ALTER TABLE `menus` DROP FOREIGN KEY `fk_menus_city`;

-- AlterTable
ALTER TABLE `menus` MODIFY `city_id` INTEGER UNSIGNED NULL;

-- AddForeignKey
ALTER TABLE `menus` ADD CONSTRAINT `fk_menus_city` FOREIGN KEY (`city_id`) REFERENCES `cities`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
