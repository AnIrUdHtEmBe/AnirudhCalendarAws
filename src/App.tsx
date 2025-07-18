import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useContext } from "react";
import Layout from "./components/Layout";
import Dashboard from "./Pages/Dashboard";
import { DataContext } from "./store/DataContext";
import Assessment from "./Pages/Assessment";
import QuestionPaper from "./Pages/QuestionPaper";
import Responses from "./Pages/Responses";
// import PlanCreation from "./Pages/PlanCreation";
import AssessmentPage from "./Pages/AssessmentPage";
// import QuestionBankPage from "./Pages/QuestionBankPage";
import PlansPage from "./Pages/PlansPage";
import AssignmetnCreationPageTwo from "./Pages/AssignmetnCreationPageTwo";
import SessionsPage from "./Pages/SessionsPage";
import AllSessionsPage from "./Pages/AllSessionsPage";
import AllPlans from "./planPageComponent/AllPlans";
import QuestionBank from "./QuestionBank/QuestionBank";
import UserPersonalisedPlan from "./Pages/UserPersonalisedPlan";
import SeePlan from "./SeePlanPage/SeePlan";
import { SnackbarProvider } from "notistack";
import BookingCalendarPage from "./Pages/BookingCalendar";



import UserProfile from "./UserPages/ProfilePage";
import PricingCalendaPage from "./Pages/PricingCalendarPage";
import PricingCalendarPage from "./Pages/PricingCalendarPage";
import PricingCalendarDaily from "./Pages/PricingCalendarDaily";
import ResponseViewPage from "./Pages/ResponseViewPage";
import NutritionSessionsPage from "./Pages/NutritionSessionPage";
import AllNutritionSessionsPage from "./Pages/AllNutritionSessionPage";

// changes
function App() {
  //@ts-ignore
  const { selectComponent } = useContext(DataContext);

  // console.log(selectComponent);
  return (
    <SnackbarProvider>
      <Router>
        <Layout>
          <Routes>
            <Route
              path="/"
              element={
                selectComponent === "assessment" ? (
                  <Assessment />
                ) : selectComponent === "seePlan" ? (
                  <SeePlan />
                ) : selectComponent === "Q&A" ? (
                  <QuestionPaper />
                ) : selectComponent === "responses" ? (
                  <Responses />
                ) : selectComponent === "planCreation" ? (
                  // <PlansPage />
                  <UserPersonalisedPlan></UserPersonalisedPlan>
                ) : (
                  <Dashboard />
                )
              }
            />
            <Route
              path="/question-bank"
              element={
                selectComponent === "AssessmentCreationPage2" ? (
                  <AssignmetnCreationPageTwo></AssignmetnCreationPageTwo>
                ) : selectComponent === "/assignment"?(
                  <AssessmentPage />):
                // selectComponent === "/question-bank"?(
                  <QuestionBank/>
                // ):(
                //   <Dashboard/>
                // )
              }
            />
            <Route
              path="/sessions"
              element={
                selectComponent === "AllSessions" ? (
                  <AllSessionsPage />
                ) : (
                  <SessionsPage />
                )
              }
            />
            <Route
              path="/nutrition_sessions"
              element={
                selectComponent === "All_nutrition_Sessions" ? (
                  <AllNutritionSessionsPage />
                ) : 
                (
                  <NutritionSessionsPage />
                )
              }
            />
            <Route
              path="/bookingCalendar"
              element={<BookingCalendarPage/>}
            />

            <Route
              path="/pricingCalendar"
              element={<PricingCalendarPage/>}
            />

            <Route
              path="/pricingCalendarDaily"
              element={<PricingCalendarDaily/>}
            />

            <Route
              path="/question-bank"
              element={<QuestionBank></QuestionBank>}
            /> 
            <Route
              path="/plans"
              element={
                selectComponent === "AllPlans" ? <AllPlans /> : <PlansPage />
              }
            />
              <Route
              path="/profile"
              element={<UserProfile></UserProfile>}
              />
            <Route
            path="/response"
            element={<ResponseViewPage/>}
            />
          </Routes>
        </Layout>
      </Router>
    </SnackbarProvider>
  );
}

export default App;
// changes in the code by aditi