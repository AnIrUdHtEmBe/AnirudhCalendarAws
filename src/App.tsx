import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  Outlet,
} from "react-router-dom";
import { useContext } from "react";
import Layout from "./components/Layout";
import Dashboard from "./Pages/Dashboard";
import { DataContext } from "./store/DataContext";
import Assessment from "./Pages/Assessment";
import QuestionPaper from "./Pages/QuestionPaper";
import Responses from "./Pages/Responses";
// import PlanCreation from "./Pages/PlanCreation";
import AssessmentPage from "./Pages/ViewAllAssessment";
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
// import PrivateRoute from "./Utils/PrivaetRouteWrapper";
import UserProfile from "./UserPages/ProfilePage";
import PricingCalendaPage from "./Pages/PricingCalendarPage";
import PricingCalendarPage from "./Pages/PricingCalendarPage";
import PricingCalendarDaily from "./Pages/PricingCalendarDaily";
import LoginPage from "./Pages/LoginPage";
import Login from "./components/Login";
import LogoutPage from "./Pages/LogoutPage";
import RegisterPage from "./Pages/RegisterPage";
import GameChatPage from "./Pages/GameChatPage";

const PrivateRoute: React.FC = () => {
  const isAuthenticated = Boolean(sessionStorage.getItem("token")); // your auth check
  const token = sessionStorage.getItem("token");

if (token) {
  const payload = JSON.parse(atob(token.split('.')[1]));
  const username = payload.name; // depends on your token structure
  sessionStorage.setItem("hostName", username)
  console.log(username, "Hostname!");
}

  
  if (!isAuthenticated) {
    // User not logged in, redirect to login page
    return <Navigate to="/" replace />;
  }

  // User logged in: render child routes
  return <Outlet />;
};
import ResponseViewPage from "./Pages/ResponseViewPage";
import NutritionSessionsPage from "./Pages/NutritionSessionPage";
import AllNutritionSessionsPage from "./Pages/AllNutritionSessionPage";
import ViewAllAssessment from "./Pages/ViewAllAssessment";
import CommunicationPage from "./Pages/CommunicationCenterPage";
import CellGridLatest from "./BookingCalendarComponent/CellGridLatest";
import CellGridArena from "./BookingCalendarComponent/CellGridWithArena";
import NutritionTabPage from "./Pages/NutritionTabPage";
import UserNutitionPage from "./Pages/UserBasedNutritionPage";
import UserPlanDetailsPage from "./Pages/UserPlanDetailsPage";
// import CellGrid from "./BookingCalendarComponent/CellGridWithArena";
// import CellGridArena from "./BookingCalendarComponent/CellGridWithArena";

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
            <Route path="/" element={<LoginPage />} />
            {/* <Route
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
            /> */}
            
            <Route element={<PrivateRoute />}>
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
            </Route>


            <Route element={<PrivateRoute />}>
              <Route
                path="/nutrition_sessions"
                element={
                  selectComponent === "All_nutrition_Sessions" ? (
                    <AllNutritionSessionsPage />
                  ) : (
                    <NutritionSessionsPage />
                  )
                }
              />
            </Route>

            <Route element={<PrivateRoute />}>
              <Route
                path="/bookingCalendar"
                element={<CellGridArena />}
              />
            </Route>

            <Route element={<PrivateRoute />}>
              <Route
                path="/UserPlanDetails"
                element={<UserPlanDetailsPage />}
              />
            </Route>

            <Route element={<PrivateRoute />}>
              <Route
                path="/nutrition"
                element={<NutritionTabPage />}
              />
            </Route>

            <Route element={<PrivateRoute />}>
              <Route
                path="/pricingCalendarDaily"
                element={<PricingCalendarDaily />}
              />

              


              <Route
                path="/plans"
                element={
                  selectComponent === "AllPlans" ? <AllPlans /> : <PlansPage />
                }
              />
              <Route
                path="/Dashboard"
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
            </Route>

            <Route element={<PrivateRoute />}>
              {/* <Route
                path="/assignment"
                element={
                  selectComponent === "AssessmentCreationPage2" ? (
                    <AssignmetnCreationPageTwo></AssignmetnCreationPageTwo>
                  ) : (
                    <AssessmentPage />
                  )
                }
              /> */}
              <Route element={<PrivateRoute />}>
               
            <Route
              path="/question-bank"
              element={
                selectComponent === "AssessmentCreationPage2" ? (
                  <AssignmetnCreationPageTwo></AssignmetnCreationPageTwo>
                ) : selectComponent === "/assignment"?(
                  <ViewAllAssessment />):
                // selectComponent === "/question-bank"?(
                  <QuestionBank/>
                // ):(
                //   <Dashboard/>
                // )
              }
            />

            </Route>
            </Route>

            <Route element={<PrivateRoute />}>
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
            </Route>

            {/* <Route element={<PrivateRoute />}>
              <Route
                path="/bookingCalendar"
                element={<BookingCalendarPage />}
              />
            </Route> */}

            <Route element={<PrivateRoute />}>
              <Route path="/gameChat" element={<GameChatPage />} />
            </Route>

            <Route element={<PrivateRoute />}>
              <Route path="/logout" element={<LogoutPage />} />
            </Route>

            <Route element={<PrivateRoute />}>
              <Route
                path="/pricingCalendar"
                element={<PricingCalendarPage />}
              />
            </Route>

            <Route element={<PrivateRoute />}>
              <Route
                path="/userNutrition/:userId"
                element={<UserNutitionPage />}
              />
            </Route>

            <Route element={<PrivateRoute />}>
              <Route
                path="/plans"
                element={
                  selectComponent === "AllPlans" ? <AllPlans /> : <PlansPage />
                }
              />
            </Route>

            <Route element={<PrivateRoute />}>
              <Route path="/profile" element={<UserProfile></UserProfile>} />
            </Route>

            <Route element={<PrivateRoute />}>
              <Route path="/notifications" element={<CommunicationPage />} />
            </Route>

            <Route element={<PrivateRoute />}>
            <Route path="/response" element={<ResponseViewPage />} />
            </Route>
          </Routes>
        </Layout>
      </Router>
    </SnackbarProvider>
  );
}

export default App;
// changes in the code by aditi
// changes in the code by aditi wqwww
