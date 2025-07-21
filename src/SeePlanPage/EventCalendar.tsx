import React, { useEffect, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import dayjs from "dayjs";
import { useApiCalls } from "../store/axios";
import EventModal from "./EventModal"; 
import AddPlanInstance from "./AddPlanInstance"; // Adjust the path if needed
import './styles/EventCalendar.css'
import NutrtitionEventModal from "./NutritionEventModal";
export default function EventCalendar({ data ,  onEventClick,getData }) {
  const [events, setEvents] = useState([]);
  const { getSessionById , updateSessionInPlanInstance } = useApiCalls();

  const [activities_length,setactivities_length]=useState(0);
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

  // console.log(validSessions_2,"this is valid session 2");
  // console.log(events,"this is event below valisession2")

      
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
  const totalActivities = data.reduce((planAcc, plan) => {
    const planTotal = (plan.sessionInstances || [])
      .filter(session => session.status != "REMOVED")
      .reduce((sessionAcc, session) => {
        const scheduledCount = (session.activities || []).filter(
          activity => activity.status != "REMOVED"
        ).length;
        return sessionAcc + scheduledCount;
      }, 0);

    return planAcc + planTotal;
  }, 0);

  setactivities_length(totalActivities);
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
  // console.log("Dropped event:");
  // console.log("Plan ID:", planInstanceId);
  // console.log("Session ID:", sessionInstanceId);
  // console.log("New Date:", newDate);
  // console.log("Plan Title:", event.extendedProps.planTitle);
  
  await updateSessionInPlanInstance(planInstanceId, sessionInstanceId, newDate);
  // Optionally revert the drop on failure
  // info.revert();
};

   const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [planInstanceId,setplanInstanceId]=useState('');
  const [sessionId,setsessionId]=useState('')

  const [SenuModalOpen,setSenuModalOpen]=useState(false);

  

  const[sessionTemplateId,setsessionTemplateId]=useState('');
  const handleEventClick = (info) => {
    console.log("handleclick",info.event,info.event.id)
    setSelectedEvent(info.event);
    setsessionId(info.event.extendedProps.sessionInstanceId)
    setsessionTemplateId(info.event.id)
    
    setplanInstanceId(info.event.extendedProps.planInstanceId)
      if (info.event.id.startsWith("SENT")) {
      // Call different component logic, e.g., open a different modal
      // console.log(sessionId,";owjiohfeiugy this is SENT")
      setSenuModalOpen(true);
    } else {
      setIsModalOpen(true); // Default modal for other events
    }
    // setIsModalOpen(true);
  };
  
  useEffect(()=>{
    console.log(events,events.length,activities_length,"lkdnwbeu")
  },[events])

  return (
    <div className="p-4">
    <FullCalendar
      // key={events.length}
      key={activities_length}
      plugins={[dayGridPlugin, interactionPlugin]}
      initialView="dayGridMonth"
      events={events}
      editable={true}
      selectable={true}
      height="auto"
      eventClassNames={(arg) => {
    if (arg.event.title === "DUMMY") {
      return ['event-alacarte'];
    }
    return [];
  }}
      eventContent={(arg) => {
    return (
      <div>
        <strong>{arg.event.title==="DUMMY"?"ACTIVITIES":arg.event.title}</strong>
        {/* <div>{arg.event.extendedProps.planTitle}</div> */}
      </div>
    );
  }}
      dateClick={(info) => {
        onEventClick(info.dateStr);
        console.log("New event on:", info.dateStr);
      }}
      eventClick={handleEventClick}
      eventDrop={handleEventDrop}
    />
      {isModalOpen && <EventModal
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
        />}
      {
        SenuModalOpen && <NutrtitionEventModal
        isOpen={SenuModalOpen}
          onClose={() => setSenuModalOpen(false)}
          eventData={selectedEvent}
          sessionId={sessionId}
          planInstanceId={planInstanceId}
          getData={getData}
          regenerate={async () => {
            // await fetchPlanData();
            await generateEvents();
          }}
        />
      }

    </div>
  );
}
