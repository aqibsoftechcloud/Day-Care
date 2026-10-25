-- AlterTable
ALTER TABLE `specialities` ADD COLUMN `doctor_speciality_id` INTEGER UNSIGNED NULL;

-- AlterTable
ALTER TABLE `speciality_sections` MODIFY `section_type` ENUM('hero', 'overview', 'treatments', 'symptoms', 'hospital', 'faqs', 'cta', 'doctors') NOT NULL;

-- CreateIndex
CREATE INDEX `idx_specialities_doctor_speciality_id` ON `specialities`(`doctor_speciality_id`);

-- AddForeignKey
ALTER TABLE `specialities` ADD CONSTRAINT `fk_specialities_doctor_speciality` FOREIGN KEY (`doctor_speciality_id`) REFERENCES `doctor_specialities`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
