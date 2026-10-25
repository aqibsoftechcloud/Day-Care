-- AlterTable
ALTER TABLE `consultation_form_settings` ADD COLUMN `submit_label` VARCHAR(100) NULL,
    ADD COLUMN `privacy_message` VARCHAR(500) NULL,
    ADD COLUMN `fields_config` JSON NULL;

-- AlterTable
ALTER TABLE `appointment_leads` ADD COLUMN `city_id` INTEGER UNSIGNED NULL,
    ADD COLUMN `treatment_id` INTEGER UNSIGNED NULL,
    ADD COLUMN `global_treatment_id` INTEGER UNSIGNED NULL,
    ADD COLUMN `extra_data` JSON NULL;

-- CreateIndex
CREATE INDEX `idx_appointment_leads_city_id` ON `appointment_leads`(`city_id`);
