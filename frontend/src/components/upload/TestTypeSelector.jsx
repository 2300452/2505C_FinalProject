export default function TestTypeSelector({ value, onChange }) {
  const options = [
    {
      id: 'TUG',
      label: 'Timed Up and Go',
      emoji: '🚶',
      description: 'Stand, walk 3 m, turn 180°, return to chair.',
    },
    {
      id: '5xSTS',
      label: 'Five-times Sit to Stand',
      emoji: '🪑',
      description: 'Rise from seated position, repeated five times.',
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {options.map((opt) => (
        <button
          key={opt.id}
          type="button"
          onClick={() => onChange(opt.id)}
          className={`text-left rounded-2xl border-2 p-5 transition-all cursor-pointer
            ${value === opt.id
              ? 'border-blue-500 bg-blue-50 shadow-md'
              : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-sm'
            }`}
        >
          <div className="text-3xl mb-2">{opt.emoji}</div>
          <div className="font-semibold text-gray-800 mb-1">{opt.label}</div>
          <div className="text-sm text-gray-500">{opt.description}</div>
        </button>
      ))}
    </div>
  )
}
