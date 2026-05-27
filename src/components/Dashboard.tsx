import { useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import './Dashboard.css'

interface HourlyCount {
  hour: number
  siIncrements: number
  ticketCancellations: number
  total: number
}

export default function Dashboard() {
  const siIncrements = useQuery(api.siIncrements.listSIIncrements)
  const ticketCancellations = useQuery(api.ticketCancellation.listTicketCancellations)

  // Group requests by hour
  const getHourlyCounts = (): HourlyCount[] => {
    const hourlyData: Record<number, HourlyCount> = {}

    // Initialize hours 0-23
    for (let i = 0; i < 24; i++) {
      hourlyData[i] = { hour: i, siIncrements: 0, ticketCancellations: 0, total: 0 }
    }

    // Count SI Increments by hour
    if (siIncrements) {
      siIncrements.forEach((item: any) => {
        const date = new Date(item.requestedDate)
        const hour = date.getHours()
        hourlyData[hour].siIncrements += 1
        hourlyData[hour].total += 1
      })
    }

    // Count Ticket Cancellations by hour
    if (ticketCancellations) {
      ticketCancellations.forEach((item: any) => {
        const date = new Date(item.requestedDate)
        const hour = date.getHours()
        hourlyData[hour].ticketCancellations += 1
        hourlyData[hour].total += 1
      })
    }

    return Object.values(hourlyData).sort((a, b) => a.hour - b.hour)
  }

  const hourlyData = getHourlyCounts()
  const totalSIIncrements = (siIncrements || []).length
  const totalTicketCancellations = (ticketCancellations || []).length
  const grandTotal = totalSIIncrements + totalTicketCancellations

  const getHourLabel = (hour: number): string => {
    return `${hour.toString().padStart(2, '0')}:00`
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h2>Dashboard</h2>
        <p className="muted">Hourly request statistics</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">SI Increments</div>
          <div className="stat-value">{totalSIIncrements}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Ticket Cancellations</div>
          <div className="stat-value">{totalTicketCancellations}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Requests</div>
          <div className="stat-value">{grandTotal}</div>
        </div>
      </div>

      <div className="chart-section">
        <h3>Hourly Breakdown</h3>
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Hour</th>
                <th>SI Increments</th>
                <th>Ticket Cancellations</th>
                <th>Total</th>
                <th>Chart</th>
              </tr>
            </thead>
            <tbody>
              {hourlyData.map((row) => (
                <tr key={row.hour}>
                  <td className="mono">{getHourLabel(row.hour)}</td>
                  <td className="text-center">{row.siIncrements}</td>
                  <td className="text-center">{row.ticketCancellations}</td>
                  <td className="text-center font-bold">{row.total}</td>
                  <td>
                    <div className="bar-chart">
                      <div
                        className="bar-si"
                        style={{
                          width: `${row.siIncrements > 0 ? (row.siIncrements / Math.max(...hourlyData.map(d => d.total), 1)) * 100 : 0}%`,
                        }}
                        title={`SI Increments: ${row.siIncrements}`}
                      />
                      <div
                        className="bar-ticket"
                        style={{
                          width: `${row.ticketCancellations > 0 ? (row.ticketCancellations / Math.max(...hourlyData.map(d => d.total), 1)) * 100 : 0}%`,
                        }}
                        title={`Ticket Cancellations: ${row.ticketCancellations}`}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="legend">
        <div className="legend-item">
          <span className="legend-color si"></span>
          <span>SI Increments</span>
        </div>
        <div className="legend-item">
          <span className="legend-color ticket"></span>
          <span>Ticket Cancellations</span>
        </div>
      </div>
    </div>
  )
}
