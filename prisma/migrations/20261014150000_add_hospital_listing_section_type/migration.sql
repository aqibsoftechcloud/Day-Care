-- AlterTable (additive: existing section rows keep their type)
ALTER TABLE `page_sections` MODIFY `section_type` ENUM('hero', 'about', 'features', 'content', 'cta', 'hospital_listing') NOT NULL;
