-- CreateTable
CREATE TABLE `actions` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(50) NOT NULL,
    `slug` VARCHAR(50) NOT NULL,

    UNIQUE INDEX `uq_actions_name`(`name`),
    UNIQUE INDEX `uq_actions_slug`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `modules` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `parent_id` INTEGER UNSIGNED NULL,
    `name` VARCHAR(100) NOT NULL,
    `slug` VARCHAR(100) NOT NULL,
    `sorting_order` INTEGER NOT NULL DEFAULT 0,
    `status` ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `uq_modules_slug`(`slug`),
    INDEX `fk_modules_parent`(`parent_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `permissions` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `module_id` INTEGER UNSIGNED NOT NULL,
    `action_id` INTEGER UNSIGNED NOT NULL,
    `name` VARCHAR(150) NOT NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `uq_permissions_name`(`name`),
    INDEX `fk_permissions_action`(`action_id`),
    UNIQUE INDEX `uq_permissions_module_action`(`module_id`, `action_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `role_permissions` (
    `role_id` INTEGER UNSIGNED NOT NULL,
    `permission_id` INTEGER UNSIGNED NOT NULL,

    INDEX `fk_role_permissions_permission`(`permission_id`),
    PRIMARY KEY (`role_id`, `permission_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `roles` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(100) NOT NULL,
    `description` VARCHAR(255) NULL,
    `status` ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `uq_roles_name`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `users` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(150) NOT NULL,
    `email` VARCHAR(255) NOT NULL,
    `password` VARCHAR(255) NOT NULL,
    `role_id` INTEGER UNSIGNED NOT NULL,
    `status` ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `uq_users_email`(`email`),
    INDEX `idx_users_role_id`(`role_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `appointment_leads` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `first_name` VARCHAR(100) NOT NULL,
    `last_name` VARCHAR(100) NOT NULL,
    `email` VARCHAR(255) NOT NULL,
    `phone_number` VARCHAR(30) NOT NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `deleted_at` TIMESTAMP(0) NULL,

    INDEX `idx_appointment_leads_created_at`(`created_at`),
    INDEX `idx_appointment_leads_email`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `banners` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `banner_name` VARCHAR(255) NOT NULL,
    `banner_url` VARCHAR(500) NULL,
    `banner_image` VARCHAR(500) NOT NULL,
    `mobile_banner_image` VARCHAR(500) NULL,
    `city_id` INTEGER UNSIGNED NOT NULL,
    `sorting_order` INTEGER NOT NULL DEFAULT 0,
    `status` ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_banners_city_id`(`city_id`),
    INDEX `idx_banners_sorting_order`(`sorting_order`),
    INDEX `idx_banners_status`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `blog_categories` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `category_name` VARCHAR(255) NOT NULL,
    `meta_title` VARCHAR(255) NULL,
    `meta_description` TEXT NULL,
    `meta_keywords` VARCHAR(500) NULL,
    `seo_url` VARCHAR(255) NOT NULL,
    `status` ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `uq_blog_categories_seo_url`(`seo_url`),
    INDEX `idx_blog_categories_status`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `blog_faqs` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `blog_id` INTEGER UNSIGNED NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `text` TEXT NOT NULL,
    `status` ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_blog_faqs_blog_id`(`blog_id`),
    INDEX `idx_blog_faqs_status`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `blogs` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `blog_category_id` INTEGER UNSIGNED NOT NULL,
    `blog_title` VARCHAR(255) NOT NULL,
    `meta_title` VARCHAR(255) NULL,
    `meta_description` TEXT NULL,
    `meta_keywords` VARCHAR(500) NULL,
    `seo_url` VARCHAR(255) NOT NULL,
    `language_id` INTEGER UNSIGNED NOT NULL,
    `city_id` INTEGER UNSIGNED NOT NULL,
    `blog_image` VARCHAR(500) NULL,
    `published_date` DATETIME(0) NULL,
    `search_keywords_for_doctors` VARCHAR(500) NULL,
    `blog_status` ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
    `ai_content_generator` BOOLEAN NOT NULL DEFAULT false,
    `blog_text` LONGTEXT NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `uq_blogs_seo_url`(`seo_url`),
    INDEX `idx_blogs_category_id`(`blog_category_id`),
    INDEX `idx_blogs_city_id`(`city_id`),
    INDEX `idx_blogs_language_id`(`language_id`),
    INDEX `idx_blogs_published_date`(`published_date`),
    INDEX `idx_blogs_status`(`blog_status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `bookaform_data` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `data_from` VARCHAR(255) NOT NULL,
    `status` ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_bookaform_data_status`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `cities` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `language_id` INTEGER UNSIGNED NOT NULL,
    `city_name` VARCHAR(150) NOT NULL,
    `meta_title` VARCHAR(255) NULL,
    `meta_description` TEXT NULL,
    `meta_keywords` VARCHAR(500) NULL,
    `seo_url` VARCHAR(255) NOT NULL,
    `status` ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `uq_cities_seo_url`(`seo_url`),
    INDEX `idx_cities_language_id`(`language_id`),
    INDEX `idx_cities_status`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `doctor_hospitals` (
    `doctor_id` INTEGER UNSIGNED NOT NULL,
    `hospital_id` INTEGER UNSIGNED NOT NULL,

    INDEX `idx_doctor_hospitals_hospital_id`(`hospital_id`),
    PRIMARY KEY (`doctor_id`, `hospital_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `doctor_pages` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `pagename` VARCHAR(255) NOT NULL,
    `keyword` VARCHAR(500) NULL,
    `meta_title` VARCHAR(255) NULL,
    `meta_description` TEXT NULL,
    `meta_keywords` VARCHAR(500) NULL,
    `seo_url` VARCHAR(255) NOT NULL,
    `city_id` INTEGER UNSIGNED NOT NULL,
    `location_id` INTEGER UNSIGNED NULL,
    `speciality_id` INTEGER UNSIGNED NOT NULL,
    `description` LONGTEXT NULL,
    `status` ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `uq_doctor_pages_seo_url`(`seo_url`),
    INDEX `idx_doctor_pages_city_id`(`city_id`),
    INDEX `idx_doctor_pages_location_id`(`location_id`),
    INDEX `idx_doctor_pages_speciality_id`(`speciality_id`),
    INDEX `idx_doctor_pages_status`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `doctor_specialities` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `language_id` INTEGER UNSIGNED NOT NULL,
    `speciality_name` VARCHAR(255) NOT NULL,
    `seo_url` VARCHAR(255) NOT NULL,
    `status` ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `uq_doctor_specialities_seo_url`(`seo_url`),
    INDEX `idx_doctor_specialities_language_id`(`language_id`),
    INDEX `idx_doctor_specialities_status`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `doctor_speciality_mappings` (
    `doctor_id` INTEGER UNSIGNED NOT NULL,
    `doctor_speciality_id` INTEGER UNSIGNED NOT NULL,

    INDEX `idx_doctor_specialities_speciality_id`(`doctor_speciality_id`),
    PRIMARY KEY (`doctor_id`, `doctor_speciality_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `doctors` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `language_id` INTEGER UNSIGNED NOT NULL,
    `doctor_name` VARCHAR(255) NOT NULL,
    `meta_title` VARCHAR(255) NULL,
    `seo_url` VARCHAR(255) NOT NULL,
    `meta_description` TEXT NULL,
    `meta_keywords` VARCHAR(500) NULL,
    `qualification` VARCHAR(500) NULL,
    `experience` VARCHAR(255) NULL,
    `availability` VARCHAR(255) NULL,
    `city_id` INTEGER UNSIGNED NOT NULL,
    `location_id` INTEGER UNSIGNED NULL,
    `patient_satisfaction_score` DECIMAL(5, 2) NULL,
    `sorting_order` INTEGER NOT NULL DEFAULT 0,
    `doctor_image` VARCHAR(500) NULL,
    `mon_sat_first_timings` VARCHAR(255) NULL,
    `mon_sat_second_timings` VARCHAR(255) NULL,
    `sunday_timings` VARCHAR(255) NULL,
    `time_interval` VARCHAR(100) NULL,
    `location_map` TEXT NULL,
    `doctor_description` TEXT NULL,
    `ai_content_generator` BOOLEAN NOT NULL DEFAULT false,
    `doc_info` LONGTEXT NULL,
    `schema_tags` JSON NULL,
    `latitude` DECIMAL(10, 8) NULL,
    `longitude` DECIMAL(11, 8) NULL,
    `status` ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `uq_doctors_seo_url`(`seo_url`),
    INDEX `idx_doctors_city_id`(`city_id`),
    INDEX `idx_doctors_language_id`(`language_id`),
    INDEX `idx_doctors_location_id`(`location_id`),
    INDEX `idx_doctors_sorting_order`(`sorting_order`),
    INDEX `idx_doctors_status`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `events_calendar` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `event_name` VARCHAR(255) NOT NULL,
    `event_location` VARCHAR(255) NULL,
    `event_date` DATE NOT NULL,
    `event_time` TIME(0) NULL,
    `status` ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_events_calendar_date`(`event_date`),
    INDEX `idx_events_calendar_status`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `feedback_leads` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(150) NOT NULL,
    `email` VARCHAR(255) NOT NULL,
    `phone_number` VARCHAR(30) NOT NULL,
    `hospital_location` VARCHAR(255) NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `deleted_at` TIMESTAMP(0) NULL,

    INDEX `idx_feedback_leads_created_at`(`created_at`),
    INDEX `idx_feedback_leads_email`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `gallery` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `gallery_name` VARCHAR(255) NOT NULL,
    `meta_title` VARCHAR(255) NULL,
    `meta_keyword` VARCHAR(500) NULL,
    `meta_description` TEXT NULL,
    `gallery_type` ENUM('image', 'video') NOT NULL,
    `gallery_status` ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
    `seo_url` VARCHAR(255) NOT NULL,
    `source` VARCHAR(1000) NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `uq_gallery_seo_url`(`seo_url`),
    INDEX `idx_gallery_status`(`gallery_status`),
    INDEX `idx_gallery_type`(`gallery_type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `general_faqs` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `question` TEXT NOT NULL,
    `answer` LONGTEXT NOT NULL,
    `status` ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_general_faqs_status`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `google_reviews` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `google_location` VARCHAR(255) NOT NULL,
    `google_rating` DECIMAL(2, 1) NULL,
    `google_review` TEXT NOT NULL,
    `status` ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_google_reviews_location`(`google_location`),
    INDEX `idx_google_reviews_rating`(`google_rating`),
    INDEX `idx_google_reviews_status`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `healthcheck_packs` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `package_title` VARCHAR(255) NOT NULL,
    `meta_title` VARCHAR(255) NULL,
    `meta_description` TEXT NULL,
    `meta_keywords` VARCHAR(500) NULL,
    `seo_url` VARCHAR(255) NOT NULL,
    `cost` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `pack_image` VARCHAR(500) NULL,
    `package_file` VARCHAR(500) NULL,
    `package_inclusions` LONGTEXT NULL,
    `status` ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `uq_healthcheck_packs_seo_url`(`seo_url`),
    INDEX `idx_healthcheck_packs_status`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `hospital_faqs` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `hospital_id` INTEGER UNSIGNED NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `text` TEXT NOT NULL,
    `status` ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_hospital_faqs_hospital_id`(`hospital_id`),
    INDEX `idx_hospital_faqs_status`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `hospitals` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `hospital_name` VARCHAR(255) NOT NULL,
    `city_id` INTEGER UNSIGNED NOT NULL,
    `location_id` INTEGER UNSIGNED NULL,
    `meta_title` VARCHAR(255) NULL,
    `meta_description` TEXT NULL,
    `meta_keywords` VARCHAR(500) NULL,
    `seo_url` VARCHAR(255) NOT NULL,
    `phone_number` VARCHAR(50) NULL,
    `timings` VARCHAR(255) NULL,
    `address` TEXT NULL,
    `hospital_image` VARCHAR(500) NULL,
    `google_reviews` DECIMAL(3, 1) NULL,
    `patient_satisfaction_score` DECIMAL(5, 2) NULL,
    `location_360_view` VARCHAR(1000) NULL,
    `location_map` TEXT NULL,
    `hospital_description` TEXT NULL,
    `long_description` LONGTEXT NULL,
    `hospital_gallery` JSON NULL,
    `status` ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `uq_hospitals_seo_url`(`seo_url`),
    INDEX `idx_hospitals_city_id`(`city_id`),
    INDEX `idx_hospitals_location_id`(`location_id`),
    INDEX `idx_hospitals_status`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `international_patient_leads` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(150) NOT NULL,
    `age` INTEGER UNSIGNED NULL,
    `gender` VARCHAR(50) NULL,
    `country` VARCHAR(100) NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `deleted_at` TIMESTAMP(0) NULL,

    INDEX `idx_international_patient_leads_country`(`country`),
    INDEX `idx_international_patient_leads_created_at`(`created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `js_configurations` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `config_for` ENUM('header', 'footer') NOT NULL,
    `config_type` VARCHAR(100) NOT NULL,
    `config_code` LONGTEXT NOT NULL,
    `status` ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_js_configurations_config_for`(`config_for`),
    INDEX `idx_js_configurations_status`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ai_configurations` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `provider` ENUM('openrouter', 'gemini') NOT NULL,
    `base_url` VARCHAR(500) NOT NULL,
    `model` VARCHAR(255) NOT NULL,
    `encrypted_api_key` TEXT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT false,
    `status` ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_ai_configurations_provider`(`provider`),
    INDEX `idx_ai_configurations_is_active`(`is_active`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `languages` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(100) NOT NULL,
    `seo_url` VARCHAR(255) NOT NULL,
    `status` ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `uq_languages_seo_url`(`seo_url`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `locations` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `city_id` INTEGER UNSIGNED NOT NULL,
    `area` VARCHAR(150) NOT NULL,
    `zipcode` VARCHAR(20) NOT NULL,
    `meta_title` VARCHAR(255) NULL,
    `meta_description` TEXT NULL,
    `meta_keywords` VARCHAR(500) NULL,
    `seo_url` VARCHAR(255) NOT NULL,
    `status` ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `uq_locations_seo_url`(`seo_url`),
    INDEX `idx_locations_city_id`(`city_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `menus` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `language_id` INTEGER UNSIGNED NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `seo_url` VARCHAR(255) NOT NULL,
    `sorting_order` INTEGER NOT NULL DEFAULT 0,
    `city_id` INTEGER UNSIGNED NOT NULL,
    `parent_id` INTEGER UNSIGNED NULL,
    `status` ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `uq_menus_seo_url`(`seo_url`),
    INDEX `idx_menus_city_id`(`city_id`),
    INDEX `idx_menus_language_id`(`language_id`),
    INDEX `idx_menus_parent_id`(`parent_id`),
    INDEX `idx_menus_sorting_order`(`sorting_order`),
    INDEX `idx_menus_status`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `news_media` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(255) NOT NULL,
    `location` VARCHAR(255) NULL,
    `date` DATETIME(0) NULL,
    `view_image` VARCHAR(500) NULL,
    `view_link` VARCHAR(500) NULL,
    `status` ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_news_media_date`(`date`),
    INDEX `idx_news_media_status`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ovulation_calculator` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(150) NOT NULL,
    `email` VARCHAR(255) NULL,
    `mobile_number` VARCHAR(30) NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_ovulation_calculator_created_at`(`created_at`),
    INDEX `idx_ovulation_calculator_email`(`email`),
    INDEX `idx_ovulation_calculator_mobile`(`mobile_number`),
    INDEX `idx_ovulation_calculator_name`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pages` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `language_id` INTEGER UNSIGNED NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `seo_url` VARCHAR(255) NOT NULL,
    `meta_title` VARCHAR(255) NULL,
    `meta_description` TEXT NULL,
    `meta_keyword` VARCHAR(500) NULL,
    `category` VARCHAR(100) NOT NULL,
    `city_id` INTEGER UNSIGNED NOT NULL,
    `location_id` INTEGER UNSIGNED NULL,
    `body` LONGTEXT NULL,
    `status` ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `uq_pages_seo_url`(`seo_url`),
    INDEX `idx_pages_category`(`category`),
    INDEX `idx_pages_city_id`(`city_id`),
    INDEX `idx_pages_language_id`(`language_id`),
    INDEX `idx_pages_location_id`(`location_id`),
    INDEX `idx_pages_status`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `patient_specialities` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `speciality_name` VARCHAR(255) NOT NULL,
    `seo_url` VARCHAR(255) NOT NULL,
    `status` ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `uq_patient_specialities_seo_url`(`seo_url`),
    INDEX `idx_patient_specialities_status`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `patient_treatments` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `treatment_name` VARCHAR(255) NOT NULL,
    `seo_url` VARCHAR(255) NOT NULL,
    `status` ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `uq_patient_treatments_seo_url`(`seo_url`),
    INDEX `idx_patient_treatments_status`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `specialities` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `speciality_name` VARCHAR(255) NOT NULL,
    `speciality_title` VARCHAR(255) NULL,
    `seo_url` VARCHAR(255) NOT NULL,
    `meta_title` VARCHAR(255) NULL,
    `meta_description` TEXT NULL,
    `meta_keyword` VARCHAR(500) NULL,
    `city_id` INTEGER UNSIGNED NOT NULL,
    `location_id` INTEGER UNSIGNED NULL,
    `hospital_id` INTEGER UNSIGNED NULL,
    `speciality_logo` VARCHAR(500) NULL,
    `short_description` TEXT NULL,
    `parent_speciality_id` INTEGER UNSIGNED NULL,
    `keywords_for_doctors` VARCHAR(500) NULL,
    `status` ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
    `ai_content_generator` BOOLEAN NOT NULL DEFAULT false,
    `description` LONGTEXT NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `uq_specialities_seo_url`(`seo_url`),
    INDEX `idx_specialities_city_id`(`city_id`),
    INDEX `idx_specialities_hospital_id`(`hospital_id`),
    INDEX `idx_specialities_location_id`(`location_id`),
    INDEX `idx_specialities_parent_id`(`parent_speciality_id`),
    INDEX `idx_specialities_status`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `speciality_faqs` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `speciality_id` INTEGER UNSIGNED NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `text` TEXT NOT NULL,
    `status` ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_speciality_faqs_speciality_id`(`speciality_id`),
    INDEX `idx_speciality_faqs_status`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `speciality_symptoms` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `speciality_id` INTEGER UNSIGNED NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `image` VARCHAR(500) NULL,
    `sorting_order` INTEGER NOT NULL DEFAULT 0,
    `status` ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_speciality_symptoms_sorting_order`(`sorting_order`),
    INDEX `idx_speciality_symptoms_speciality_id`(`speciality_id`),
    INDEX `idx_speciality_symptoms_status`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `symptom_articles` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `article_name` VARCHAR(255) NOT NULL,
    `part_id` INTEGER UNSIGNED NOT NULL,
    `symptom_id` INTEGER UNSIGNED NOT NULL,
    `meta_title` VARCHAR(255) NULL,
    `meta_description` TEXT NULL,
    `meta_keywords` VARCHAR(500) NULL,
    `seo_url` VARCHAR(255) NOT NULL,
    `description` LONGTEXT NULL,
    `status` ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `uq_symptom_articles_seo_url`(`seo_url`),
    INDEX `idx_symptom_articles_part_id`(`part_id`),
    INDEX `idx_symptom_articles_status`(`status`),
    INDEX `idx_symptom_articles_symptom_id`(`symptom_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `symptom_parts` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `part_name` VARCHAR(255) NOT NULL,
    `meta_title` VARCHAR(255) NULL,
    `meta_description` TEXT NULL,
    `meta_keywords` VARCHAR(500) NULL,
    `seo_url` VARCHAR(255) NOT NULL,
    `part_description` LONGTEXT NULL,
    `status` ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `uq_symptom_parts_seo_url`(`seo_url`),
    INDEX `idx_symptom_parts_status`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `symptoms` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `part_id` INTEGER UNSIGNED NOT NULL,
    `symptom_name` VARCHAR(255) NOT NULL,
    `status` ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_symptoms_part_id`(`part_id`),
    INDEX `idx_symptoms_status`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `testimonials` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `language_id` INTEGER UNSIGNED NOT NULL,
    `testimonial_name` VARCHAR(255) NOT NULL,
    `meta_title` VARCHAR(255) NULL,
    `meta_description` TEXT NULL,
    `meta_keywords` VARCHAR(500) NULL,
    `seo_url` VARCHAR(255) NOT NULL,
    `youtube_url` VARCHAR(500) NULL,
    `city_id` INTEGER UNSIGNED NOT NULL,
    `location_id` INTEGER UNSIGNED NULL,
    `hospital_id` INTEGER UNSIGNED NULL,
    `doctor_id` INTEGER UNSIGNED NULL,
    `patient_speciality_id` INTEGER UNSIGNED NULL,
    `patient_treatment_id` INTEGER UNSIGNED NULL,
    `publish_date` DATETIME(0) NULL,
    `testimonial_image` VARCHAR(500) NULL,
    `description` LONGTEXT NULL,
    `status` ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `uq_testimonials_seo_url`(`seo_url`),
    INDEX `idx_testimonials_city_id`(`city_id`),
    INDEX `idx_testimonials_doctor_id`(`doctor_id`),
    INDEX `idx_testimonials_hospital_id`(`hospital_id`),
    INDEX `idx_testimonials_language_id`(`language_id`),
    INDEX `idx_testimonials_location_id`(`location_id`),
    INDEX `idx_testimonials_patient_speciality_id`(`patient_speciality_id`),
    INDEX `idx_testimonials_patient_treatment_id`(`patient_treatment_id`),
    INDEX `idx_testimonials_publish_date`(`publish_date`),
    INDEX `idx_testimonials_status`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `treatment_faqs` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `treatment_id` INTEGER UNSIGNED NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `text` TEXT NOT NULL,
    `status` ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_treatment_faqs_status`(`status`),
    INDEX `idx_treatment_faqs_treatment_id`(`treatment_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `treatment_symptoms` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `treatment_id` INTEGER UNSIGNED NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `image` VARCHAR(500) NULL,
    `sorting_order` INTEGER NOT NULL DEFAULT 0,
    `status` ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_treatment_symptoms_sorting_order`(`sorting_order`),
    INDEX `idx_treatment_symptoms_status`(`status`),
    INDEX `idx_treatment_symptoms_treatment_id`(`treatment_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `treatments` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `speciality_id` INTEGER UNSIGNED NOT NULL,
    `sub_speciality_name` VARCHAR(255) NOT NULL,
    `sub_speciality_title` VARCHAR(255) NULL,
    `seo_url` VARCHAR(255) NOT NULL,
    `meta_title` VARCHAR(255) NULL,
    `meta_description` TEXT NULL,
    `meta_keyword` VARCHAR(500) NULL,
    `language_id` INTEGER UNSIGNED NOT NULL,
    `city_id` INTEGER UNSIGNED NOT NULL,
    `location_id` INTEGER UNSIGNED NULL,
    `hospital_id` INTEGER UNSIGNED NULL,
    `speciality_logo` VARCHAR(500) NULL,
    `short_description` TEXT NULL,
    `keywords_for_doctors` VARCHAR(500) NULL,
    `status` ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
    `ai_content_generator` BOOLEAN NOT NULL DEFAULT false,
    `description` LONGTEXT NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `uq_treatments_seo_url`(`seo_url`),
    INDEX `idx_treatments_city_id`(`city_id`),
    INDEX `idx_treatments_hospital_id`(`hospital_id`),
    INDEX `idx_treatments_language_id`(`language_id`),
    INDEX `idx_treatments_location_id`(`location_id`),
    INDEX `idx_treatments_speciality_id`(`speciality_id`),
    INDEX `idx_treatments_status`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `modules` ADD CONSTRAINT `fk_modules_parent` FOREIGN KEY (`parent_id`) REFERENCES `modules`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `permissions` ADD CONSTRAINT `fk_permissions_action` FOREIGN KEY (`action_id`) REFERENCES `actions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `permissions` ADD CONSTRAINT `fk_permissions_module` FOREIGN KEY (`module_id`) REFERENCES `modules`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `role_permissions` ADD CONSTRAINT `fk_role_permissions_permission` FOREIGN KEY (`permission_id`) REFERENCES `permissions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `role_permissions` ADD CONSTRAINT `fk_role_permissions_role` FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `users` ADD CONSTRAINT `fk_users_role` FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `banners` ADD CONSTRAINT `fk_banners_city` FOREIGN KEY (`city_id`) REFERENCES `cities`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `blog_faqs` ADD CONSTRAINT `fk_blog_faqs_blog` FOREIGN KEY (`blog_id`) REFERENCES `blogs`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `blogs` ADD CONSTRAINT `fk_blogs_category` FOREIGN KEY (`blog_category_id`) REFERENCES `blog_categories`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `blogs` ADD CONSTRAINT `fk_blogs_city` FOREIGN KEY (`city_id`) REFERENCES `cities`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `blogs` ADD CONSTRAINT `fk_blogs_language` FOREIGN KEY (`language_id`) REFERENCES `languages`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cities` ADD CONSTRAINT `fk_cities_language` FOREIGN KEY (`language_id`) REFERENCES `languages`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `doctor_hospitals` ADD CONSTRAINT `fk_doctor_hospitals_doctor` FOREIGN KEY (`doctor_id`) REFERENCES `doctors`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `doctor_hospitals` ADD CONSTRAINT `fk_doctor_hospitals_hospital` FOREIGN KEY (`hospital_id`) REFERENCES `hospitals`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `doctor_pages` ADD CONSTRAINT `fk_doctor_pages_city` FOREIGN KEY (`city_id`) REFERENCES `cities`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `doctor_pages` ADD CONSTRAINT `fk_doctor_pages_location` FOREIGN KEY (`location_id`) REFERENCES `locations`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `doctor_pages` ADD CONSTRAINT `fk_doctor_pages_speciality` FOREIGN KEY (`speciality_id`) REFERENCES `specialities`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `doctor_specialities` ADD CONSTRAINT `fk_doctor_specialities_language` FOREIGN KEY (`language_id`) REFERENCES `languages`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `doctor_speciality_mappings` ADD CONSTRAINT `fk_doctor_specialities_doctor` FOREIGN KEY (`doctor_id`) REFERENCES `doctors`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `doctor_speciality_mappings` ADD CONSTRAINT `fk_doctor_speciality_mappings_speciality` FOREIGN KEY (`doctor_speciality_id`) REFERENCES `doctor_specialities`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `doctors` ADD CONSTRAINT `fk_doctors_city` FOREIGN KEY (`city_id`) REFERENCES `cities`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `doctors` ADD CONSTRAINT `fk_doctors_language` FOREIGN KEY (`language_id`) REFERENCES `languages`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `doctors` ADD CONSTRAINT `fk_doctors_location` FOREIGN KEY (`location_id`) REFERENCES `locations`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `hospital_faqs` ADD CONSTRAINT `fk_hospital_faqs_hospital` FOREIGN KEY (`hospital_id`) REFERENCES `hospitals`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `hospitals` ADD CONSTRAINT `fk_hospitals_city` FOREIGN KEY (`city_id`) REFERENCES `cities`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `hospitals` ADD CONSTRAINT `fk_hospitals_location` FOREIGN KEY (`location_id`) REFERENCES `locations`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `locations` ADD CONSTRAINT `fk_locations_city` FOREIGN KEY (`city_id`) REFERENCES `cities`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `menus` ADD CONSTRAINT `fk_menus_city` FOREIGN KEY (`city_id`) REFERENCES `cities`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `menus` ADD CONSTRAINT `fk_menus_language` FOREIGN KEY (`language_id`) REFERENCES `languages`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `menus` ADD CONSTRAINT `fk_menus_parent` FOREIGN KEY (`parent_id`) REFERENCES `menus`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pages` ADD CONSTRAINT `fk_pages_city` FOREIGN KEY (`city_id`) REFERENCES `cities`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pages` ADD CONSTRAINT `fk_pages_language` FOREIGN KEY (`language_id`) REFERENCES `languages`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pages` ADD CONSTRAINT `fk_pages_location` FOREIGN KEY (`location_id`) REFERENCES `locations`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `specialities` ADD CONSTRAINT `fk_specialities_city` FOREIGN KEY (`city_id`) REFERENCES `cities`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `specialities` ADD CONSTRAINT `fk_specialities_hospital` FOREIGN KEY (`hospital_id`) REFERENCES `hospitals`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `specialities` ADD CONSTRAINT `fk_specialities_location` FOREIGN KEY (`location_id`) REFERENCES `locations`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `specialities` ADD CONSTRAINT `fk_specialities_parent` FOREIGN KEY (`parent_speciality_id`) REFERENCES `specialities`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `speciality_faqs` ADD CONSTRAINT `fk_speciality_faqs_speciality` FOREIGN KEY (`speciality_id`) REFERENCES `specialities`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `speciality_symptoms` ADD CONSTRAINT `fk_speciality_symptoms_speciality` FOREIGN KEY (`speciality_id`) REFERENCES `specialities`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `symptom_articles` ADD CONSTRAINT `fk_symptom_articles_part` FOREIGN KEY (`part_id`) REFERENCES `symptom_parts`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `symptom_articles` ADD CONSTRAINT `fk_symptom_articles_symptom` FOREIGN KEY (`symptom_id`) REFERENCES `symptoms`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `symptoms` ADD CONSTRAINT `fk_symptoms_part` FOREIGN KEY (`part_id`) REFERENCES `symptom_parts`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `testimonials` ADD CONSTRAINT `fk_testimonials_city` FOREIGN KEY (`city_id`) REFERENCES `cities`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `testimonials` ADD CONSTRAINT `fk_testimonials_doctor` FOREIGN KEY (`doctor_id`) REFERENCES `doctors`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `testimonials` ADD CONSTRAINT `fk_testimonials_hospital` FOREIGN KEY (`hospital_id`) REFERENCES `hospitals`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `testimonials` ADD CONSTRAINT `fk_testimonials_language` FOREIGN KEY (`language_id`) REFERENCES `languages`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `testimonials` ADD CONSTRAINT `fk_testimonials_location` FOREIGN KEY (`location_id`) REFERENCES `locations`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `testimonials` ADD CONSTRAINT `fk_testimonials_patient_speciality` FOREIGN KEY (`patient_speciality_id`) REFERENCES `patient_specialities`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `testimonials` ADD CONSTRAINT `fk_testimonials_patient_treatment` FOREIGN KEY (`patient_treatment_id`) REFERENCES `patient_treatments`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `treatment_faqs` ADD CONSTRAINT `fk_treatment_faqs_treatment` FOREIGN KEY (`treatment_id`) REFERENCES `treatments`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `treatment_symptoms` ADD CONSTRAINT `fk_treatment_symptoms_treatment` FOREIGN KEY (`treatment_id`) REFERENCES `treatments`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `treatments` ADD CONSTRAINT `fk_treatments_city` FOREIGN KEY (`city_id`) REFERENCES `cities`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `treatments` ADD CONSTRAINT `fk_treatments_hospital` FOREIGN KEY (`hospital_id`) REFERENCES `hospitals`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `treatments` ADD CONSTRAINT `fk_treatments_language` FOREIGN KEY (`language_id`) REFERENCES `languages`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `treatments` ADD CONSTRAINT `fk_treatments_location` FOREIGN KEY (`location_id`) REFERENCES `locations`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `treatments` ADD CONSTRAINT `fk_treatments_speciality` FOREIGN KEY (`speciality_id`) REFERENCES `specialities`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
