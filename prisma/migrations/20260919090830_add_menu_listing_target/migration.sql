-- AlterTable
ALTER TABLE `menus` ADD COLUMN `listing_key` ENUM('specialities', 'treatments', 'hospitals', 'doctors', 'find_a_doctor', 'health_packages', 'blogs', 'testimonials') NULL,
    MODIFY `target_type` ENUM('none', 'speciality', 'treatment', 'hospital', 'doctor', 'doctor_speciality', 'blog', 'blog_category', 'page', 'listing') NOT NULL DEFAULT 'none';
