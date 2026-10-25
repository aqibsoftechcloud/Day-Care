-- AlterTable
ALTER TABLE `global_treatments` ADD COLUMN `global_speciality_id` INTEGER UNSIGNED NULL;

-- CreateIndex
CREATE INDEX `idx_global_treatments_global_speciality_id` ON `global_treatments`(`global_speciality_id`);

-- AddForeignKey
ALTER TABLE `global_treatments` ADD CONSTRAINT `fk_global_treatments_global_speciality` FOREIGN KEY (`global_speciality_id`) REFERENCES `global_specialities`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
