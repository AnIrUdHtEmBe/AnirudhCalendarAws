// components/BackButton.tsx
import { ChevronLeft } from "lucide-react";

export default function BackButton() {
  return (
    <button className="flex items-center space-x-1 shadow-sm  rounded text-gray-700 hover:text-black font-bold">
      <ChevronLeft size={30} />
      <span>Back</span>
    </button>
  );
}
