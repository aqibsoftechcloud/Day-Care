-- AlterTable
ALTER TABLE `speciality_sections` MODIFY `section_type` ENUM('hero', 'overview', 'treatments', 'symptoms', 'hospital', 'faqs', 'cta', 'doctors', 'custom', 'why_choose_us') NOT NULL;
