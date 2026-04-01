/**
 * Progress chart for a single test type (TUG or 5xSTS).
 * Shows score over time with coloured risk-zone backgrounds.
 */
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ReferenceArea, ResponsiveContainer,
} from 'recharts'

const NORMS = {
  TUG:     { normal: 12, concern: 20 },
  '5xSTS': { normal: 12, concern: 16 },
}

function fmtDate(iso) {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: '2-digit' })
}

// ── Sub-components ─────────────────────────────────────────────────────────

function TrendBadge({ first, last }) {
  const diff = last - first
  if (Math.abs(diff) < 0.5) {
    return (
      <span className="text-xs px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-500 font-medium">
        Stable
      </span>
    )
  }
  return diff < 0 ? (
    <span className="text-xs px-2.5 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">
      ↓ {Math.abs(diff).toFixed(2)}s faster
    </span>
  ) : (
    <span className="text-xs px-2.5 py-0.5 rounded-full bg-red-100 text-red-700 font-medium">
      ↑ {diff.toFixed(2)}s slower
    </span>
  )
}

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-lg px-3 py-2 text-sm">
      <p className="text-gray-500 text-xs mb-1">{d.dateStr}</p>
      <p className="text-blue-600 font-bold text-lg">{d.score}s</p>
      <p className="text-gray-400 text-xs">{d.riskLabel}</p>
    </div>
  )
}

// ── Summary stats ─────────────────────────────────────────────────────────

function StatPill({ label, value, sub }) {
  return (
    <div className="flex-1 bg-gray-50 rounded-xl px-3 py-2 text-center min-w-0">
      <p className="text-xs text-gray-400 mb-0.5">{label}</p>
      <p className="font-bold text-gray-800 text-sm">{value}s</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────

export default function PatientProgressChart({ assessments, testType }) {
  const data = assessments
    .filter(a =>
      a.test_type === testType &&
      a.status === 'completed' &&
      a.results?.analysis?.total_time_s != null,
    )
    .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
    .map(a => ({
      dateStr:   fmtDate(a.created_at),
      score:     a.results.analysis.total_time_s,
      riskLabel: a.results.analysis.risk_label ?? '',
      uuid:      a.uuid,
    }))

  if (data.length === 0) return null

  const norms    = NORMS[testType] ?? NORMS.TUG
  const maxScore = Math.max(...data.map(d => d.score))
  const minScore = Math.min(...data.map(d => d.score))
  const maxY     = Math.max(maxScore, norms.concern) + 3

  const latest = data[data.length - 1].score
  const best   = minScore  // lower = better for both tests

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
          {testType} Progress
        </h2>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">{data.length} session{data.length !== 1 ? 's' : ''}</span>
          {data.length >= 2 && (
            <TrendBadge first={data[0].score} last={latest} />
          )}
        </div>
      </div>

      {/* Single session — no chart, just show the score */}
      {data.length === 1 ? (
        <div className="flex flex-col items-center py-6 gap-1">
          <p className="text-4xl font-bold text-blue-600">{data[0].score}s</p>
          <p className="text-xs text-gray-400 mt-1">Only one session — upload more to see trends</p>
        </div>
      ) : (
        <>
          {/* Summary stats */}
          <div className="flex gap-2 mb-4">
            <StatPill label="Latest"  value={latest}  />
            <StatPill label="Best"    value={best}    />
            <StatPill
              label="Change"
              value={(latest - data[0].score > 0 ? '+' : '') + (latest - data[0].score).toFixed(2)}
              sub="vs first session"
            />
          </div>

          {/* Chart */}
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={data} margin={{ top: 5, right: 12, bottom: 0, left: 0 }}>

              {/* Risk zone backgrounds */}
              <ReferenceArea y1={0}              y2={norms.normal}   fill="#dcfce7" fillOpacity={0.55} />
              <ReferenceArea y1={norms.normal}   y2={norms.concern}  fill="#fef9c3" fillOpacity={0.55} />
              <ReferenceArea y1={norms.concern}  y2={maxY + 10}      fill="#fee2e2" fillOpacity={0.55} />

              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis
                dataKey="dateStr"
                tick={{ fontSize: 10, fill: '#9ca3af' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                domain={[0, maxY]}
                tickFormatter={v => `${v}s`}
                tick={{ fontSize: 10, fill: '#9ca3af' }}
                axisLine={false}
                tickLine={false}
                width={38}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="score"
                stroke="#3b82f6"
                strokeWidth={2.5}
                dot={{ r: 5, fill: '#3b82f6', stroke: 'white', strokeWidth: 2 }}
                activeDot={{ r: 7, fill: '#1d4ed8' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </>
      )}

      {/* Zone legend */}
      <div className="flex gap-4 mt-3 flex-wrap">
        {[
          { color: 'bg-green-400',  label: `Normal (<=${norms.normal}s)` },
          { color: 'bg-yellow-400', label: `Borderline (${norms.normal}–${norms.concern}s)` },
          { color: 'bg-red-400',    label: `High risk (>${norms.concern}s)` },
        ].map(z => (
          <span key={z.label} className="flex items-center gap-1.5 text-xs text-gray-400">
            <span className={`w-2.5 h-2.5 rounded-full ${z.color}`} />
            {z.label}
          </span>
        ))}
      </div>
    </div>
  )
}
