/*
  Warnings:

  - You are about to drop the column `patient_speciality_id` on the `testimonials` table. All the data in the column will be lost.
  - You are about to drop the column `patient_treatment_id` on the `testimonials` table. All the data in the column will be lost.
  - You are about to drop the `patient_specialities` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `patient_treatments` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `testimonials` DROP FOREIGN KEY `fk_testimonials_patient_speciality`;

-- DropForeignKey
ALTER TABLE `testimonials` DROP FOREIGN KEY `fk_testimonials_patient_treatment`;

-- DropIndex
DROP INDEX `idx_testimonials_patient_speciality_id` ON `testimonials`;

-- DropIndex
DROP INDEX `idx_testimonials_patient_treatment_id` ON `testimonials`;

-- AlterTable
ALTER TABLE `testimonials` DROP COLUMN `patient_speciality_id`,
    DROP COLUMN `patient_treatment_id`;

-- DropTable
DROP TABLE `patient_specialities`;

-- DropTable
DROP TABLE `patient_treatments`;
