import React, { useContext } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { DataContext } from "../store/DataContext";
import { Link, Typography } from "@mui/material";

const breadcrumbConfig = {
  "/": { label: "Login", path: "/" },
  "/Dashboard": {
    default: { label: "Dashboard", path: "/Dashboard", selectComponent: "dashboard" },
    assessment: {
      label: "Assessment",
      path: "/Dashboard",
      selectComponent: "assessment",
      subComponents: {
        "Q&A": { label: "Q&A", path: "/Dashboard", selectComponent: "Q&A" },
      },
    },
    seePlan: { label: "See Plan", path: "/Dashboard", selectComponent: "seePlan" },
    responses: { label: "Responses", path: "/Dashboard", selectComponent: "responses" },
    planCreation: { label: "Personalized Plan", path: "/Dashboard", selectComponent: "planCreation" },
  },
  "/plans": {
    default: { label: "Plans", path: "/plans", selectComponent: "dashboard" },
    AllPlans: { label: "All Plans", path: "/plans", selectComponent: "AllPlans" },
  },
  "/sessions": {
    default: { label: "Sessions", path: "/sessions", selectComponent: "dashboard" },
    AllSessions: { label: "All Sessions", path: "/sessions", selectComponent: "AllSessions" },
  },
  "/nutrition_sessions": {
    default: { label: "Nutrition Sessions", path: "/nutrition_sessions", selectComponent: "dashboard" },
    All_nutrition_Sessions: { label: "All Nutrition Sessions", path: "/nutrition_sessions", selectComponent: "All_nutrition_Sessions" },
  },
  "/bookingCalendar": { label: "Booking Calendar", path: "/bookingCalendar" },
  "/UserPlanDetails": { label: "User Plan Details", path: "/UserPlanDetails" },
  "/nutrition": { label: "Nutrition", path: "/nutrition" },
  "/pricingCalendarDaily": { label: "Pricing Calendar Daily", path: "/pricingCalendarDaily" },
  "/pricingCalendar": { label: "Pricing Calendar", path: "/pricingCalendar" },
  "/gameChat": { label: "Game Chat", path: "/gameChat" },
  "/logout": { label: "Logout", path: "/logout" },
  "/profile": { label: "Profile", path: "/profile" },
  "/notifications": { label: "Notifications", path: "/notifications" },
  "/response": { label: "Response View", path: "/response" },
  "/question-bank": {
    default: { label: "Question Bank", path: "/question-bank", selectComponent: "questions" },
    AssessmentCreationPage2: { label: "Assessment Creation", path: "/question-bank", selectComponent: "AssessmentCreationPage2" },
    "/assignment": { label: "All Assessments", path: "/question-bank", selectComponent: "/agreement" },
  },
  "/userNutrition/:userId": { label: "User Nutrition", path: "/userNutrition/:userId" },
};

const Breadcrumb: React.FC = () => {
  const { selectComponent, setSelectComponent } = useContext(DataContext);
  const location = useLocation();
  const navigate = useNavigate();
  let pathname = location.pathname;

  const getBreadcrumbs = () => {
    console.log("Breadcrumb: pathname =", pathname, "selectComponent =", selectComponent);
    const crumbs: { label: string; path: string; onClick?: () => void }[] = [];

    // Handle dynamic routes like /userNutrition/:userId
    if (pathname.startsWith("/userNutrition/")) {
      pathname = "/userNutrition/:userId";
    }

    const routeConfig = breadcrumbConfig[pathname] || breadcrumbConfig["/Dashboard"];

    if (routeConfig) {
      if ("default" in routeConfig) {
        // Add default breadcrumb (e.g., Dashboard, Question Bank)
        crumbs.push({
          label: routeConfig.default.label,
          path: routeConfig.default.path,
          onClick: () => {
            console.log("Navigating to", routeConfig.default.label, "resetting selectComponent to", routeConfig.default.selectComponent);
            setSelectComponent(routeConfig.default.selectComponent);
            navigate(routeConfig.default.path, { replace: true }); // Use replace to avoid history issues
          },
        });

        // Special case for Q&A to show under Assessment
        if (selectComponent === "Q&A" && routeConfig.assessment?.subComponents?.["Q&A"]) {
          // Add Assessment
          crumbs.push({
            label: routeConfig.assessment.label,
            path: routeConfig.assessment.path,
            onClick: () => {
              console.log("Navigating to Assessment, setting selectComponent to", routeConfig.assessment.selectComponent);
              navigate(routeConfig.assessment.path);
              setSelectComponent(routeConfig.assessment.selectComponent);
            },
          });
          // Add Q&A
          const qnaCrumb = routeConfig.assessment.subComponents["Q&A"];
          crumbs.push({
            label: qnaCrumb.label,
            path: qnaCrumb.path,
            onClick: () => {
              console.log("Navigating to", qnaCrumb.label, "with selectComponent", qnaCrumb.selectComponent);
              navigate(qnaCrumb.path);
              setSelectComponent(qnaCrumb.selectComponent);
            },
          });
        }
        // Handle other sub-components (e.g., Assessment, AssessmentCreationPage2, /agreement)
        else if (selectComponent && routeConfig[selectComponent]) {
          const subCrumb = routeConfig[selectComponent];
          crumbs.push({
            label: subCrumb.label,
            path: subCrumb.path,
            onClick: () => {
              console.log("Navigating to", subCrumb.label, "with selectComponent", subCrumb.selectComponent);
              navigate(subCrumb.path);
              setSelectComponent(subCrumb.selectComponent);
            },
          });
        }
      } else {
        // Handle simple routes without sub-components
        crumbs.push({
          label: routeConfig.label,
          path: routeConfig.path,
          onClick: () => {
            console.log("Navigating to", routeConfig.label);
            navigate(routeConfig.path);
          },
        });
      }
    }

    console.log("Generated breadcrumbs:", crumbs);
    return crumbs;
  };

  const breadcrumbs = getBreadcrumbs();

  return (
    <div
      style={{
        backgroundColor: "white",
        padding: 0,
        display: "flex",
        alignItems: "center",
        fontFamily: "'Roboto', sans-serif",
        fontSize: "14px",
      }}
    >
      {breadcrumbs.map((crumb, index) => (
        <div
          key={crumb.path + index} // Unique key including index to handle duplicate paths
          style={{
            display: "inline-flex",
            alignItems: "center",
            marginRight: "8px",
            border: index === breadcrumbs.length - 1 ? "2px solid #0079ff" : "1px solid #d1d5db",
            borderRadius: "4px",
            padding: "4px 12px",
            backgroundColor: index === breadcrumbs.length - 1 ? "#f3f4f6" : "transparent",
            cursor: index === breadcrumbs.length - 1 ? "default" : "pointer",
          }}
        >
          {index === breadcrumbs.length - 1 ? (
            <Typography
              style={{
                color: "#081021",
                fontWeight: 500,
                fontSize: "14px",
              }}
            >
              {crumb.label}
            </Typography>
          ) : (
            <Link
              underline="none"
              style={{
                color: "#0079ff",
                fontWeight: 500,
                fontSize: "14px",
                transition: "color 0.2s ease, background-color 0.2s ease",
              }}
              onClick={crumb.onClick}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "#4338ca";
                e.currentTarget.style.backgroundColor = "#f3f4f6";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "#4f46e5";
                e.currentTarget.style.backgroundColor = "transparent";
              }}
            >
              {crumb.label}
            </Link>
          )}
        </div>
      ))}
    </div>
  );
};

export default Breadcrumb;
