import React, { useEffect, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import dayjs from "dayjs";
import { useApiCalls } from "../store/axios";
import EventModal from "./EventModal"; 
import AddPlanInstance from "./AddPlanInstance"; // Adjust the path if needed

export default function EventCalendar({ data ,  onEventClick,getData }) {
  const [events, setEvents] = useState([]);
  const { getSessionById , updateSessionInPlanInstance } = useApiCalls();

  
    const generateEvents = async () => {
      if (!data || !Array.isArray(data)) return;

      // const validSessions = data.flatMap(plan =>
      //   (plan.sessionInstances || []).filter(
      //     session => session.sessionTemplateId && session.scheduledDate
      //   )
      // );
      console.log(data,"this is data");
      const validSessions_2 = data.flatMap(plan =>
    (plan.sessionInstances || [])
      .filter(session => /*session.sessionTemplateId && session.scheduledDate &&*/ session.status!="REMOVED")
      .map(session => ({
        id: session.sessionTemplateId,
        title: session.sessionTemplateTitle || "Untitled Session",
        start: dayjs(session.scheduledDate).format("YYYY-MM-DD"),
        sessionInstanceId: session.sessionInstanceId,
        planInstanceId: plan.planInstanceId,
        planTitle: plan.planTitle,
        // category: session.category,
        // activities: session.activities,
        // rating: session.rating,
        // status: session.status,
      }))
  );

  console.log(validSessions_2,"this is valid session 2");
  console.log(events,"this is event below valisession2")

      
      // const validSessions = data.flatMap(plan =>
      //     (plan.sessionInstances || [])
      //       .filter(session => session.sessionTemplateId && session.scheduledDate)
      //       .map(session => ({
      //         ...session,
      //         planInstanceId: plan.planInstanceId,
      //         planTitle: plan.planTitle,
      //       }))
      //   );

      //   console.log(validSessions,"calid session");
        
      // const fetchedEvents = await Promise.all(
      //   validSessions.map(async (session) => {
      //     try {
      //       const res = await getSessionById(session.sessionTemplateId);
      //       return {
      //         id: session.sessionTemplateId,
      //         title: res?.title || "Untitled Session",
      //         start: dayjs(session.scheduledDate).format("YYYY-MM-DD"),
      //         sessionInstanceId: session.sessionInstanceId,
      //         planInstanceId: session.planInstanceId,
      //         planTitle: session.planTitle,
      //       };
      //     } catch (err) {
      //       console.error("Error fetching session:", session.sessionTemplateId, err);
      //       return null;
      //     }
      //   })
      // );
      // console.log(fetchedEvents,"these are ")
      setEvents(validSessions_2); // Filter out nulls
    };
useEffect(() => {
  // console.log("Received new data in EventCalendar:", data);
  generateEvents();
}, [data]);
useEffect(() => {
  // console.log("Events updated:", events);
}, [events]);
  const handleEventDrop = async (info) => {
  const { event } = info;

  const sessionInstanceId = event.extendedProps.sessionInstanceId;
  const planInstanceId = event.extendedProps.planInstanceId;
  const newDate = event.start;

  // Example: Log or call an API to update the session
  console.log("Dropped event:");
  console.log("Plan ID:", planInstanceId);
  console.log("Session ID:", sessionInstanceId);
  console.log("New Date:", newDate);
  console.log("Plan Title:", event.extendedProps.planTitle);
  
  await updateSessionInPlanInstance(planInstanceId, sessionInstanceId, newDate);
  // Optionally revert the drop on failure
  // info.revert();
};

   const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [planInstanceId,setplanInstanceId]=useState('');
  const [sessionId,setsessionId]=useState('')

  const handleEventClick = (info) => {
    console.log("handleclick",info.event)
    setSelectedEvent(info.event);
    setsessionId(info.event.extendedProps.sessionInstanceId)
    setplanInstanceId(info.event.extendedProps.planInstanceId)
    setIsModalOpen(true);
  };
  
  useEffect(()=>{
    console.log(planInstanceId,"lkdnwbeu")
  },[planInstanceId])

  return (
    <div className="p-4">
    <FullCalendar
      key={events.length}
      plugins={[dayGridPlugin, interactionPlugin]}
      initialView="dayGridMonth"
      events={events}
      editable={true}
      selectable={true}
      height="auto"
      dateClick={(info) => {
        onEventClick(info.dateStr);
        console.log("New event on:", info.dateStr);
      }}
      eventClick={handleEventClick}
      eventDrop={handleEventDrop}
    />
     <EventModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        eventData={selectedEvent}
        sessionId={sessionId}
        planInstanceId={planInstanceId}
        getData={getData}
        regenerate={async () => {
          // await fetchPlanData();
          await generateEvents();
        }}
      />

    </div>
  );
}
