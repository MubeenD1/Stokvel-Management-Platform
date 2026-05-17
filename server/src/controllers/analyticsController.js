
const { getContributionData } = require('../utils/analyticsService')

const getContributionAnalytics = async (req, res) => {
  try {
    const {
      startDate,
      endDate,
      memberId,   // "all" or a specific memberId
      statuses,   // "all" or comma-separated e.g. "PENDING,CONFIRMED"
      groupId
    } = req.query

    // Validate required fields
    if (!startDate || !endDate || !groupId) {
      return res.status(400).json({ error: 'startDate, endDate and groupId are required' })
    }

    // Validate date range max 6 months
    const start = new Date(startDate)
    const end = new Date(endDate)
    const diffMonths = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth())

    if (diffMonths > 6) {
      return res.status(400).json({ error: 'Date range cannot exceed 6 months' })
    }

    if (start > end) {
      return res.status(400).json({ error: 'startDate cannot be after endDate' })
    }

    const filters = {
      startDate: start,
      endDate: end,
      memberId: memberId === 'all' ? null : memberId,
      statuses: statuses === 'all' ? null : statuses.split(','),
      groupId
    }

    const data = await getContributionData(filters)
    return res.status(200).json(data)

  } catch (error) {
    console.error('Error fetching contribution analytics:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

module.exports = { getContributionAnalytics }