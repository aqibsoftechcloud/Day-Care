-- AlterTable
ALTER TABLE `menus` MODIFY `target_type` ENUM('none', 'speciality', 'treatment', 'hospital', 'doctor', 'doctor_speciality', 'blog', 'blog_category', 'page', 'listing', 'global_speciality') NOT NULL DEFAULT 'none';
