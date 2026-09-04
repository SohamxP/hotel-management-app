-- CreateEnum
CREATE TYPE "ServiceType" AS ENUM ('Room Service', 'Spa', 'Shuttle');

-- CreateEnum
CREATE TYPE "ServiceRequestStatus" AS ENUM ('Pending', 'In Progress', 'Completed', 'Cancelled');

-- CreateEnum
CREATE TYPE "BillingPaymentStatus" AS ENUM ('checkout_created', 'paid', 'refunded', 'cancelled');

-- CreateEnum
CREATE TYPE "BillingMode" AS ENUM ('stripe', 'simulation');

-- CreateTable
CREATE TABLE "Service" (
    "ServiceID" INTEGER NOT NULL,
    "ReservationID" BIGINT NOT NULL,
    "ServiceType" "ServiceType" NOT NULL,
    "RequestTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "RequestStatus" "ServiceRequestStatus" NOT NULL,
    "ServicePrice" DOUBLE PRECISION NOT NULL,
    "EmployeeID" INTEGER,

    CONSTRAINT "Service_pkey" PRIMARY KEY ("ServiceID")
);

-- CreateTable
CREATE TABLE "RoomService" (
    "ServiceID" INTEGER NOT NULL,
    "RoomNumber" INTEGER NOT NULL,
    "ItemDescription" TEXT,

    CONSTRAINT "RoomService_pkey" PRIMARY KEY ("ServiceID")
);

-- CreateTable
CREATE TABLE "SpaService" (
    "ServiceID" INTEGER NOT NULL,
    "SpaServiceType" TEXT NOT NULL,
    "DurationMinutes" INTEGER,

    CONSTRAINT "SpaService_pkey" PRIMARY KEY ("ServiceID")
);

-- CreateTable
CREATE TABLE "ShuttleService" (
    "ServiceID" INTEGER NOT NULL,
    "PickupTime" TEXT NOT NULL,
    "DropoffTime" TEXT,
    "ArrivalDestination" TEXT NOT NULL,
    "DepartureDestination" TEXT NOT NULL,
    "NumberOfPeople" INTEGER NOT NULL,

    CONSTRAINT "ShuttleService_pkey" PRIMARY KEY ("ServiceID")
);

-- CreateTable
CREATE TABLE "Feedback" (
    "FeedbackID" INTEGER NOT NULL,
    "ReservationID" BIGINT NOT NULL,
    "RoomRating" INTEGER,
    "BreakfastRating" INTEGER,
    "SafetyRating" INTEGER,
    "CustSvcRating" INTEGER,
    "Comments" TEXT,
    "SubmissionDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Feedback_pkey" PRIMARY KEY ("FeedbackID")
);

-- CreateTable
CREATE TABLE "BillingTransaction" (
    "BillingTransactionID" SERIAL NOT NULL,
    "ReservationID" BIGINT NOT NULL,
    "StripeSessionID" TEXT,
    "CheckoutURL" TEXT,
    "AmountCents" INTEGER NOT NULL,
    "Currency" TEXT NOT NULL DEFAULT 'usd',
    "PaymentStatus" "BillingPaymentStatus" NOT NULL DEFAULT 'checkout_created',
    "BillingMode" "BillingMode" NOT NULL DEFAULT 'simulation',
    "CreatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "PaidAt" TIMESTAMP(3),
    "RefundedAt" TIMESTAMP(3),
    "LastSyncedAt" TIMESTAMP(3),
    "StripePaymentStatus" TEXT,
    "StripeSessionStatus" TEXT,

    CONSTRAINT "BillingTransaction_pkey" PRIMARY KEY ("BillingTransactionID")
);

-- CreateIndex
CREATE INDEX "Service_ReservationID_idx" ON "Service"("ReservationID");

-- CreateIndex
CREATE INDEX "RoomService_RoomNumber_idx" ON "RoomService"("RoomNumber");

-- CreateIndex
CREATE INDEX "Feedback_ReservationID_idx" ON "Feedback"("ReservationID");

-- CreateIndex
CREATE INDEX "BillingTransaction_ReservationID_idx" ON "BillingTransaction"("ReservationID");

-- CreateIndex
CREATE INDEX "BillingTransaction_StripeSessionID_idx" ON "BillingTransaction"("StripeSessionID");

-- AddForeignKey
ALTER TABLE "Service" ADD CONSTRAINT "Service_ReservationID_fkey" FOREIGN KEY ("ReservationID") REFERENCES "Reservation"("ReservationID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Service" ADD CONSTRAINT "Service_EmployeeID_fkey" FOREIGN KEY ("EmployeeID") REFERENCES "Employee"("EmployeeID") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoomService" ADD CONSTRAINT "RoomService_ServiceID_fkey" FOREIGN KEY ("ServiceID") REFERENCES "Service"("ServiceID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoomService" ADD CONSTRAINT "RoomService_RoomNumber_fkey" FOREIGN KEY ("RoomNumber") REFERENCES "Room"("RoomNumber") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpaService" ADD CONSTRAINT "SpaService_ServiceID_fkey" FOREIGN KEY ("ServiceID") REFERENCES "Service"("ServiceID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShuttleService" ADD CONSTRAINT "ShuttleService_ServiceID_fkey" FOREIGN KEY ("ServiceID") REFERENCES "Service"("ServiceID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Feedback" ADD CONSTRAINT "Feedback_ReservationID_fkey" FOREIGN KEY ("ReservationID") REFERENCES "Reservation"("ReservationID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BillingTransaction" ADD CONSTRAINT "BillingTransaction_ReservationID_fkey" FOREIGN KEY ("ReservationID") REFERENCES "Reservation"("ReservationID") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Service"
ADD CONSTRAINT "Service_ServicePrice_check"
CHECK ("ServicePrice" >= 0);

ALTER TABLE "ShuttleService"
ADD CONSTRAINT "ShuttleService_NumberOfPeople_check"
CHECK ("NumberOfPeople" >= 1);

ALTER TABLE "Feedback"
ADD CONSTRAINT "Feedback_RoomRating_check"
CHECK ("RoomRating" IS NULL OR "RoomRating" BETWEEN 1 AND 5);

ALTER TABLE "Feedback"
ADD CONSTRAINT "Feedback_BreakfastRating_check"
CHECK ("BreakfastRating" IS NULL OR "BreakfastRating" BETWEEN 1 AND 5);

ALTER TABLE "Feedback"
ADD CONSTRAINT "Feedback_SafetyRating_check"
CHECK ("SafetyRating" IS NULL OR "SafetyRating" BETWEEN 1 AND 5);

ALTER TABLE "Feedback"
ADD CONSTRAINT "Feedback_CustSvcRating_check"
CHECK ("CustSvcRating" IS NULL OR "CustSvcRating" BETWEEN 1 AND 5);

ALTER TABLE "Reservation"
ADD CONSTRAINT "Reservation_CheckOutDate_check"
CHECK ("CheckOutDate" > "CheckInDate");