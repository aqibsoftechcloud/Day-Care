-- AlterTable
ALTER TABLE `testimonials` ADD COLUMN `speciality_id` INTEGER UNSIGNED NULL;

-- CreateIndex
CREATE INDEX `idx_testimonials_speciality_id` ON `testimonials`(`speciality_id`);

-- AddForeignKey
ALTER TABLE `testimonials` ADD CONSTRAINT `fk_testimonials_speciality` FOREIGN KEY (`speciality_id`) REFERENCES `specialities`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
