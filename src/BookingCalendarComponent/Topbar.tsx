import BackButton from "./BackButton";
// import DateSelector from "./DateSelector";
import LegendBoxes from "./LegendBoxes";
import TabSwitch from "./TabSwitch";

export default function TopBar() {
  return (
    <div className="bg-white shadow py-3">
      {/* Top Row: Back, Date, Legend */}
      <div className="w-full flex justify-between font-bold items-center px-4 py-2">
        {/* Left: Back Button (commented out) */}
        {/* <div className="flex items-center">
          <BackButton />
        </div> */}

        {/* Center: Admin Dashboard - responsive and centered */}
        <div className="flex-1 flex justify-center px-4">
          <div className="text-center text-base md:text-lg font-semibold truncate">
            Admin Dashboard!
          </div>
        </div>

        {/* Right: LegendBoxes + TabSwitch (stacked vertically) */}
        <div className="flex flex-col items-end gap-2">
          <LegendBoxes />
          <TabSwitch />
        </div>
      </div>
    </div>
  );
}

