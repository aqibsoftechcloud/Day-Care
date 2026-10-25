-- DropIndex
DROP INDEX `uq_speciality_sections_speciality_type` ON `speciality_sections`;

-- AlterTable
ALTER TABLE `speciality_sections` MODIFY `section_type` ENUM('hero', 'overview', 'treatments', 'symptoms', 'hospital', 'faqs', 'cta', 'doctors', 'custom') NOT NULL;
