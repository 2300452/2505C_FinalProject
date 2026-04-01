/**
 * Horizontal benchmark gauge showing clinical norm zones (normal / concern / high_risk)
 * and a marker at the patient's score.
 */

const NORMS = {
  TUG: {
    zones: [
      { category: 'normal',    label: '<=12 s', max: 12 },
      { category: 'concern',   label: '12-20 s', max: 20 },
      { category: 'high_risk', label: '>20 s',  max: null },
    ],
    displayMax: 30,
  },
  '5xSTS': {
    zones: [
      { category: 'normal',    label: '<=12 s', max: 12 },
      { category: 'concern',   label: '12-16 s', max: 16 },
      { category: 'high_risk', label: '>16 s',  max: null },
    ],
    displayMax: 25,
  },
}

const ZONE_COLOR = {
  normal:    'bg-green-400',
  concern:   'bg-yellow-400',
  high_risk: 'bg-red-400',
}

const DOT_COLOR = {
  normal:    'bg-green-500',
  concern:   'bg-yellow-500',
  high_risk: 'bg-red-500',
}

export default function BenchmarkGauge({ testType, totalTimeS }) {
  const config    = NORMS[testType] ?? NORMS.TUG
  const { zones, displayMax } = config
  const clamped   = Math.min(totalTimeS, displayMax)
  const markerPct = (clamped / displayMax) * 100

  // Build per-zone pixel widths as percentages
  const zoneWidths = zones.map((z, i) => {
    const start = i === 0 ? 0 : zones[i - 1].max
    const end   = z.max ?? displayMax
    return ((Math.min(end, displayMax) - start) / displayMax) * 100
  })

  // Tick positions for zone boundaries (excluding 0 and displayMax)
  const ticks = zones.slice(0, -1).map(z => (z.max / displayMax) * 100)

  return (
    <div className="mt-4">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
        Where your score falls
      </p>

      {/* Bar */}
      <div className="relative h-5 flex rounded-full overflow-visible">
        {/* Coloured zone segments */}
        <div className="flex w-full h-full rounded-full overflow-hidden">
          {zones.map((z, i) => (
            <div
              key={z.category}
              className={`h-full ${ZONE_COLOR[z.category]}`}
              style={{ width: `${zoneWidths[i]}%` }}
            />
          ))}
        </div>

        {/* Tick lines at zone boundaries */}
        {ticks.map(pct => (
          <div
            key={pct}
            className="absolute top-0 bottom-0 w-px bg-white/60"
            style={{ left: `${pct}%` }}
          />
        ))}

        {/* Score marker — circle + vertical line */}
        <div
          className="absolute top-1/2 -translate-y-1/2 flex flex-col items-center"
          style={{ left: `${markerPct}%`, transform: 'translate(-50%, -50%)' }}
        >
          <div className="w-4 h-4 rounded-full bg-gray-900 border-2 border-white shadow-md z-10" />
        </div>
      </div>

      {/* Axis labels */}
      <div className="relative mt-1 text-xs text-gray-400 h-4">
        <span className="absolute left-0">0 s</span>
        {ticks.map((pct, i) => (
          <span
            key={pct}
            className="absolute -translate-x-1/2"
            style={{ left: `${pct}%` }}
          >
            {zones[i].max} s
          </span>
        ))}
        <span className="absolute right-0">{displayMax}+ s</span>
      </div>

      {/* Legend */}
      <div className="flex gap-4 mt-2 flex-wrap">
        {zones.map(z => (
          <span key={z.category} className="flex items-center gap-1.5 text-xs text-gray-500">
            <span className={`w-2.5 h-2.5 rounded-full ${DOT_COLOR[z.category]}`} />
            {z.label}
          </span>
        ))}
      </div>
    </div>
  )
}
