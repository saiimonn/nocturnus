interface SearchSuggestionsCardProps {
  label: string
  address: string
  onSelect: () => void
}

export default function SearchSuggestionsCard({
  label,
  address,
  onSelect,
}: SearchSuggestionsCardProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className="w-full text-left px-4 py-3 hover:bg-white/10 transition-colors"
    >
      <div className="text-sm font-medium text-white">{label}</div>
      <div className="text-xs text-gray-400">{address}</div>
    </button>
  )
}
