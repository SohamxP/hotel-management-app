-- CreateEnum
CREATE TYPE "RoomType" AS ENUM ('King', 'Queen', 'Deluxe', 'Accessible');

-- CreateEnum
CREATE TYPE "RoomAvailability" AS ENUM ('Available', 'Reserved', 'Occupied', 'Blocked');

-- CreateEnum
CREATE TYPE "MembershipLevel" AS ENUM ('Bronze', 'Silver', 'Gold', 'Platinum');

-- CreateEnum
CREATE TYPE "PurposeOfVisit" AS ENUM ('Business', 'Leisure', 'Travel', 'Nearby Attractions', 'Social Gathering');

-- CreateEnum
CREATE TYPE "CardType" AS ENUM ('Visa', 'MasterCard', 'Amex', 'Discover', 'Cash', 'Bank Transfer');

-- CreateEnum
CREATE TYPE "ReservationStatus" AS ENUM ('Confirmed', 'Pending', 'Cancelled', 'Completed', 'No-Show');

-- CreateEnum
CREATE TYPE "PaymentMode" AS ENUM ('Credit Card', 'Debit Card', 'Cash', 'Bank Transfer', 'Amex');

-- CreateTable
CREATE TABLE "Employee" (
    "EmployeeID" INTEGER NOT NULL,
    "FirstName" TEXT NOT NULL,
    "LastName" TEXT NOT NULL,
    "DateOfBirth" TEXT NOT NULL,
    "SSN" TEXT NOT NULL,
    "Salary" DOUBLE PRECISION NOT NULL,
    "Position" TEXT NOT NULL,
    "HoursWorked" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "Employee_pkey" PRIMARY KEY ("EmployeeID")
);

-- CreateTable
CREATE TABLE "UserAccount" (
    "UserID" SERIAL NOT NULL,
    "EmployeeID" INTEGER NOT NULL,
    "Username" TEXT NOT NULL,
    "PasswordHash" TEXT NOT NULL,
    "IsActive" BOOLEAN NOT NULL DEFAULT true,
    "CreatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserAccount_pkey" PRIMARY KEY ("UserID")
);

-- CreateTable
CREATE TABLE "Guest" (
    "GuestID" INTEGER NOT NULL,
    "FirstName" TEXT NOT NULL,
    "LastName" TEXT NOT NULL,
    "DateOfBirth" TEXT NOT NULL,
    "PhoneNumber" TEXT NOT NULL,
    "Email" TEXT NOT NULL,

    CONSTRAINT "Guest_pkey" PRIMARY KEY ("GuestID")
);

-- CreateTable
CREATE TABLE "Membership" (
    "MembershipID" INTEGER NOT NULL,
    "GuestID" INTEGER NOT NULL,
    "MembershipLevel" "MembershipLevel" NOT NULL,
    "PreferredRoomType" "RoomType",
    "PurposeOfVisit" "PurposeOfVisit",

    CONSTRAINT "Membership_pkey" PRIMARY KEY ("MembershipID")
);

-- CreateTable
CREATE TABLE "PaymentInfo" (
    "PaymentID" INTEGER NOT NULL,
    "GuestID" INTEGER NOT NULL,
    "CardType" "CardType" NOT NULL,
    "CardLastFour" TEXT,
    "BillingAddress" TEXT,

    CONSTRAINT "PaymentInfo_pkey" PRIMARY KEY ("PaymentID")
);

-- CreateTable
CREATE TABLE "Room" (
    "RoomNumber" INTEGER NOT NULL,
    "RoomType" "RoomType" NOT NULL,
    "RatePerNight" DOUBLE PRECISION NOT NULL,
    "AvailStatus" "RoomAvailability" NOT NULL,
    "MaxOccupancy" INTEGER NOT NULL,
    "HasBalcony" TEXT NOT NULL DEFAULT 'N',
    "IsSmoking" TEXT NOT NULL DEFAULT 'N',
    "BedCount" INTEGER NOT NULL,
    "BuildingNumber" INTEGER NOT NULL,
    "HasWifi" TEXT NOT NULL DEFAULT 'Y',
    "HasTv" TEXT NOT NULL DEFAULT 'Y',

    CONSTRAINT "Room_pkey" PRIMARY KEY ("RoomNumber")
);

-- CreateTable
CREATE TABLE "Reservation" (
    "ReservationID" BIGINT NOT NULL,
    "GuestID" INTEGER NOT NULL,
    "RoomNumber" INTEGER NOT NULL,
    "CheckInDate" TEXT NOT NULL,
    "CheckInTime" TEXT NOT NULL DEFAULT '15:00',
    "CheckOutDate" TEXT NOT NULL,
    "TotalPrice" DOUBLE PRECISION NOT NULL,
    "ReservStatus" "ReservationStatus" NOT NULL,
    "SpecialRequest" TEXT,
    "PaymentMode" "PaymentMode" NOT NULL,

    CONSTRAINT "Reservation_pkey" PRIMARY KEY ("ReservationID")
);

-- CreateTable
CREATE TABLE "ReservationGuest" (
    "ReservationID" BIGINT NOT NULL,
    "GuestID" INTEGER NOT NULL,

    CONSTRAINT "ReservationGuest_pkey" PRIMARY KEY ("ReservationID","GuestID")
);

-- CreateIndex
CREATE UNIQUE INDEX "Employee_SSN_key" ON "Employee"("SSN");

-- CreateIndex
CREATE UNIQUE INDEX "UserAccount_EmployeeID_key" ON "UserAccount"("EmployeeID");

-- CreateIndex
CREATE UNIQUE INDEX "UserAccount_Username_key" ON "UserAccount"("Username");

-- CreateIndex
CREATE UNIQUE INDEX "Guest_PhoneNumber_key" ON "Guest"("PhoneNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Guest_Email_key" ON "Guest"("Email");

-- CreateIndex
CREATE UNIQUE INDEX "Membership_GuestID_key" ON "Membership"("GuestID");

-- CreateIndex
CREATE INDEX "Reservation_RoomNumber_CheckInDate_CheckOutDate_idx" ON "Reservation"("RoomNumber", "CheckInDate", "CheckOutDate");

-- CreateIndex
CREATE INDEX "Reservation_GuestID_idx" ON "Reservation"("GuestID");

-- AddForeignKey
ALTER TABLE "UserAccount" ADD CONSTRAINT "UserAccount_EmployeeID_fkey" FOREIGN KEY ("EmployeeID") REFERENCES "Employee"("EmployeeID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Membership" ADD CONSTRAINT "Membership_GuestID_fkey" FOREIGN KEY ("GuestID") REFERENCES "Guest"("GuestID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentInfo" ADD CONSTRAINT "PaymentInfo_GuestID_fkey" FOREIGN KEY ("GuestID") REFERENCES "Guest"("GuestID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_GuestID_fkey" FOREIGN KEY ("GuestID") REFERENCES "Guest"("GuestID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_RoomNumber_fkey" FOREIGN KEY ("RoomNumber") REFERENCES "Room"("RoomNumber") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReservationGuest" ADD CONSTRAINT "ReservationGuest_ReservationID_fkey" FOREIGN KEY ("ReservationID") REFERENCES "Reservation"("ReservationID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReservationGuest" ADD CONSTRAINT "ReservationGuest_GuestID_fkey" FOREIGN KEY ("GuestID") REFERENCES "Guest"("GuestID") ON DELETE RESTRICT ON UPDATE CASCADE;
