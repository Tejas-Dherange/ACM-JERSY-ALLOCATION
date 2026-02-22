/*
  Warnings:

  - Added the required column `contactNumber` to the `JerseyBooking` table without a default value. This is not possible if the table is not empty.
  - Added the required column `fullName` to the `JerseyBooking` table without a default value. This is not possible if the table is not empty.
  - Added the required column `hoodieSize` to the `JerseyBooking` table without a default value. This is not possible if the table is not empty.
  - Added the required column `nameToPrint` to the `JerseyBooking` table without a default value. This is not possible if the table is not empty.
  - Added the required column `paymentMode` to the `JerseyBooking` table without a default value. This is not possible if the table is not empty.
  - Added the required column `paymentScreenshot` to the `JerseyBooking` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "JerseyBooking" ADD COLUMN     "contactNumber" TEXT NOT NULL,
ADD COLUMN     "fullName" TEXT NOT NULL,
ADD COLUMN     "hoodieSize" TEXT NOT NULL,
ADD COLUMN     "nameToPrint" TEXT NOT NULL,
ADD COLUMN     "paymentMode" TEXT NOT NULL,
ADD COLUMN     "paymentScreenshot" TEXT NOT NULL;
