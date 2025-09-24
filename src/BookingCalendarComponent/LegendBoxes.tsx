// components/LegendBoxes.tsx
const legends = [
  { label: "Occupied", color: "bg-green-500" },
  { label: "Available", color: "bg-gray-400" },
  { label: "Selected", color: "bg-blue-500" },
  { label: "Unavailable", color: "bg-red-500" },
];

export default function LegendBoxes() {
  return (
    <div className="flex gap-6">
      {legends.map((legend) => (
        <div key={legend.label} className="flex items-center space-x-1">
          <div className={`w-3 h-3 rounded-sm ${legend.color}`} />
          <span className="text-xs text-gray-600">{legend.label}</span>
        </div>
      ))}
    </div>
  );  
}
