import * as React from 'react';
import { TextField, Stack } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import AddPlanInstance from './AddPlanInstance';
import AddSession from './AddSession';
import AddActivity from './AddActivity';
import AddNutrition from './AddNutrition';
export default function DateRangePicker({ startDate, userDate ,setStartDate, endDate, setEndDate ,userId ,planForAlacatre , getData} ) {
  React.useEffect(()=> {
    console.log(userDate);
     
  }, [userDate]);
  return (
    <div className='p-4 flex flex-col gap-5 justify-end items-end'>
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Stack spacing={5} direction="row">
        
        <DatePicker
          label="Start Date"
          value={startDate}
          onChange={(newValue) => setStartDate(newValue)}
          maxDate={endDate}
          
        />
        
        <DatePicker
          label="End Date"
          value={endDate}
          onChange={(newValue) => setEndDate(newValue)}
          minDate={startDate}
          
        />
      
      </Stack>
    </LocalizationProvider>
    <div className='flex items-center gap-2'>
    <AddPlanInstance userId={userId} />
    <AddSession userId={userId} userDate={userDate} planForAlacarte={planForAlacatre} getData={getData}/>
    <AddActivity userId={userId} userDate={userDate} planForAlacarte={planForAlacatre} getData={getData} />
    <AddNutrition userId={userId} userDate={userDate} planForAlacarte={planForAlacatre} getData={getData}/>
    </div>
    </div>
  );
}
