import BackButton from "./BackButton";
// import DateSelector from "./DateSelector";
import LegendBoxes from "./LegendBoxes";
import TabSwitch from "./TabSwitch";


export default function TopBar() {
  return (
    <div className="bg-white shadow py-3">
      {/* Top Row: Back, Date, Legend */}
      
      <div className="w-full flex justify-between font-bold items-start px-4 py-2">
        
        {/* Left: Back Button */}
        <div className="flex items-center">
          <BackButton />
        </div>

        {/* Center: Date Selector */}
        {/* <div className="flex-1 flex justify-center">
          <DateSelector />
        </div> */}
        Admin Dashboard!
        {/* Right: LegendBoxes + TabSwitch (stacked vertically) */}
        <div className="flex flex-col items-end gap-2">
          <LegendBoxes />
          <TabSwitch />
        </div>
      </div>

      
    </div>
  );
}
