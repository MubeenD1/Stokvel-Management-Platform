// server/src/services/analyticsService.js
const prisma = require('../../lib/prisma');

const getContributionData = async (filters) => {
  const { startDate, endDate, memberId, statuses, groupId } = filters

  // Build where clause dynamically
  const where = {
    groupId,
    date: {
      gte: startDate,
      lte: endDate
    },
    // Only add memberId filter if a specific member was selected
    ...(memberId && { memberId: {in: Array.isArray(memberId) ? memberId : [memberId]}}),
    // Only add status filter if specific statuses were selected
    ...(statuses && { status: { in: statuses } })
  }

  // Fetch all matching contributions
  const contributions = await prisma.contribution.findMany({
    where,
    include: {
      member: {
        include: {
          user: {
            select: { email: true }
          }
        }
      },
      treasurer: {
        include: {
          user: {
            select: { email: true }
          }
        }
      }
    },
    orderBy: { date: 'asc' }
  })

  // ── Table Data ──────────────────────────────────────────
  const tableData = contributions.map(c => ({
    id: c.id,
    email: c.member.user.email,
    amount: c.amount,
    contributionDate: c.date,
    confirmedBy: c.treasurer?.user?.email ?? null,
    status: c.status
  }))

  // ── Pie Chart Data ──────────────────────────────────────
  // Count how many of each status exist
  const statusCounts = contributions.reduce((acc, c) => {
    acc[c.status] = (acc[c.status] || 0) + 1
    return acc
  }, {})

  const pieData = Object.entries(statusCounts).map(([status, count]) => ({
    status,
    count
  }))

  // ── Bar Chart Data ──────────────────────────────────────
  // Group by month, then by status, sum amounts
  const barMap = {}

  contributions.forEach(c => {
    const date = new Date(c.date)
    // Format as "Jan 2025", "Feb 2025" etc
    const monthKey = date.toLocaleString('default', { month: 'short', year: 'numeric' })

    if (!barMap[monthKey]) {
      barMap[monthKey] = { month: monthKey }
    }

    // Add amount to the relevant status bucket for that month
    barMap[monthKey][c.status] = (barMap[monthKey][c.status] || 0) + c.amount
  })

  const barData = Object.values(barMap)

  return {
    tableData,
    pieData,
    barData
  }
}

const getPayoutData = async (filters) => {
  const { startDate, endDate, memberId, statuses, groupId } = filters

  // Build where clause dynamically mapping to Prisma Payout fields
  const where = {
    groupId,
    createdAt: {
      gte: startDate,
      lte: endDate
    },
    // Only add memberId filter if a specific member was selected
    ...(memberId && { memberId: { in: Array.isArray(memberId) ? memberId : [memberId] } }),
    // Only add status filter if specific statuses were selected
    ...(statuses && { status: { in: statuses } })
  }

  // Fetch all matching payouts based on your Prisma Model relations
  const payouts = await prisma.payout.findMany({
    where,
    include: {
      member: {
        include: {
          user: {
            select: { email: true }
          }
        }
      }
    },
    orderBy: { createdAt: 'asc' }
  })

  // ── Table Data ──────────────────────────────────────────
  const tableData = payouts.map(p => ({
    id: p.id,
    email: p.member?.user?.email ?? 'N/A',
    amount: p.amount,
    createdAt: p.createdAt, // Frontend components look for createdAt on payouts
    reference: p.reference,
    status: p.status
  }))

  // ── Pie Chart Data ──────────────────────────────────────
  const statusCounts = payouts.reduce((acc, p) => {
    acc[p.status] = (acc[p.status] || 0) + 1
    return acc
  }, {})

  const pieData = Object.entries(statusCounts).map(([status, count]) => ({
    status,
    count
  }))

  // ── Bar Chart Data ──────────────────────────────────────
  const barMap = {}

  payouts.forEach(p => {
    const date = new Date(p.createdAt)
    const monthKey = date.toLocaleString('default', { month: 'short', year: 'numeric' })

    if (!barMap[monthKey]) {
      barMap[monthKey] = { month: monthKey }
    }

    barMap[monthKey][p.status] = (barMap[monthKey][p.status] || 0) + p.amount
  })

  const barData = Object.values(barMap)

  return {
    tableData,
    pieData,
    barData
  }
}

module.exports = { 
  getContributionData, 
  getPayoutData 
}