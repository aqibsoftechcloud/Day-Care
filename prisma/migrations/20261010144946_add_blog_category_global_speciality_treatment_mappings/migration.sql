-- CreateTable
CREATE TABLE `blog_category_global_speciality_mappings` (
    `blog_category_id` INTEGER UNSIGNED NOT NULL,
    `global_speciality_id` INTEGER UNSIGNED NOT NULL,

    INDEX `idx_blog_cat_gs_mappings_speciality_id`(`global_speciality_id`),
    PRIMARY KEY (`blog_category_id`, `global_speciality_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `blog_category_global_treatment_mappings` (
    `blog_category_id` INTEGER UNSIGNED NOT NULL,
    `global_treatment_id` INTEGER UNSIGNED NOT NULL,

    INDEX `idx_blog_cat_gt_mappings_treatment_id`(`global_treatment_id`),
    PRIMARY KEY (`blog_category_id`, `global_treatment_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `blog_category_global_speciality_mappings` ADD CONSTRAINT `fk_blog_cat_gs_mappings_category` FOREIGN KEY (`blog_category_id`) REFERENCES `blog_categories`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `blog_category_global_speciality_mappings` ADD CONSTRAINT `fk_blog_cat_gs_mappings_speciality` FOREIGN KEY (`global_speciality_id`) REFERENCES `global_specialities`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `blog_category_global_treatment_mappings` ADD CONSTRAINT `fk_blog_cat_gt_mappings_category` FOREIGN KEY (`blog_category_id`) REFERENCES `blog_categories`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `blog_category_global_treatment_mappings` ADD CONSTRAINT `fk_blog_cat_gt_mappings_treatment` FOREIGN KEY (`global_treatment_id`) REFERENCES `global_treatments`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
