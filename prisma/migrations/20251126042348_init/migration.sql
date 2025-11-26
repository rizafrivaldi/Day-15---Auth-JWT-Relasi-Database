/*
  Warnings:

  - You are about to drop the column `updatedAt` on the `refreshtoken` table. All the data in the column will be lost.
  - Added the required column `updatedAt` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `refreshtoken` DROP COLUMN `updatedAt`;

-- AlterTable
ALTER TABLE `user` ADD COLUMN `updatedAt` DATETIME(3) NOT NULL;
