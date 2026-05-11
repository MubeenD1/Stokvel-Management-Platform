-- CreateEnum
CREATE TYPE "ContributionStatus" AS ENUM ('CONFIRMED', 'MISSED', 'PENDING');

-- CreateTable
CREATE TABLE "Contribution" (
    "id" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "status" "ContributionStatus" NOT NULL DEFAULT 'PENDING',
    "memberId" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "confirmedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Contribution_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Contribution" ADD CONSTRAINT "Contribution_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "GroupMember"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contribution" ADD CONSTRAINT "Contribution_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contribution" ADD CONSTRAINT "Contribution_confirmedBy_fkey" FOREIGN KEY ("confirmedBy") REFERENCES "GroupMember"("id") ON DELETE SET NULL ON UPDATE CASCADE;
