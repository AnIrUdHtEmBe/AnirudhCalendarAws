import React, { useContext, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { DataContext } from "../store/DataContext";
import { Link, Typography } from "@mui/material";

const breadcrumbConfig = {
  "/": { label: "Login", path: "/" },
  "/Dashboard": {
    default: {
      label: "Dashboard",
      path: "/Dashboard",
      selectComponent: "dashboard",
    },
    assessment: {
      label: "Assessment",
      path: "/Dashboard",
      selectComponent: "assessment",
      subComponents: {
        "Q&A": { label: "Q&A", path: "/Dashboard", selectComponent: "Q&A" },
      },
    },
    seePlan: {
      label: "See Plan",
      path: "/Dashboard",
      selectComponent: "seePlan",
      subComponents: {
        "responses": { label: "Responses", path: "/response", selectComponent: "responses" },
      },
    },
    responses: {
      label: "Responses",
      path: "/Dashboard",
      selectComponent: "responses",
    },
    planCreation: {
      label: "Personalized Plan",
      path: "/Dashboard",
      selectComponent: "planCreation",
    },
    goToChat: {
      label: "Go To Chat",
      path: "/Dashboard",
      selectComponent: "goToChat",
    },
  },
  "/response": {
    label: "Responses",
    path: "/response",
    parentRoute: "/Dashboard",
    parentComponent: "seePlan"
  },
  "/question-bank": {
    default: {
      label: "Question Bank",
      path: "/question-bank",
      selectComponent: "default",
    },
    "/assignment": {
      label: "Assessments",
      path: "/question-bank",
      selectComponent: "/assignment",
    },
    "AssessmentCreationPage2": {
      label: "Create Assessment",
      path: "/question-bank",
      selectComponent: "AssessmentCreationPage2",
    },
  },
  "/plans": { label: "Plans", path: "/plans" },
  "/sessions": { label: "Sessions", path: "/sessions" },
  "/gameChat": { label: "Game Chat", path: "/gameChat" },
  "/bookingCalendar": { label: "Booking Calendar", path: "/bookingCalendar" },
  "/nutrition": { label: "Nutrition", path: "/nutrition" },
  "/notifications": { label: "Notifications", path: "/notifications" },
  "/profile": { label: "Profile", path: "/profile" }
};

const Breadcrumb: React.FC = () => {
  const { selectComponent, setSelectComponent } = useContext(DataContext);
  const location = useLocation();
  const navigate = useNavigate();
  const [navigationHistory, setNavigationHistory] = useState([]);

  // Your original getBreadcrumbs function with minor modifications
  const getHierarchicalBreadcrumbs = () => {
    console.log("Breadcrumb: pathname =", location.pathname, "selectComponent =", selectComponent);
    const crumbs: { label: string; path: string; selectComponent?: string; onClick?: () => void }[] = [];
    let pathname = location.pathname;

    // Handle dynamic routes like /userNutrition/:userId
    if (pathname.startsWith("/userNutrition/")) {
      pathname = "/userNutrition/:userId";
    }

    // Handle /response route specifically (your original logic)
    if (pathname === "/response") {
      const responseConfig = breadcrumbConfig["/response"];
      
      crumbs.push({
        label: "Dashboard",
        path: "/Dashboard",
        selectComponent: "dashboard",
        onClick: () => {
          console.log("Navigating to Dashboard");
          setSelectComponent("dashboard");
          navigate("/Dashboard", { replace: true });
        },
      });

      crumbs.push({
        label: "See Plan",
        path: "/Dashboard", 
        selectComponent: "seePlan",
        onClick: () => {
          console.log("Navigating to See Plan");
          setSelectComponent("seePlan");
          navigate("/Dashboard");
        },
      });

      crumbs.push({
        label: responseConfig.label,
        path: responseConfig.path,
        onClick: () => {
          console.log("Already on Responses page");
        },
      });

      return crumbs;
    }

    // Handle /question-bank route - remove special case, treat like other routes
    const routeConfig = breadcrumbConfig[pathname] || breadcrumbConfig["/Dashboard"];

    if (routeConfig) {
      if ("default" in routeConfig) {
        // Add default breadcrumb (Dashboard)
        crumbs.push({
          label: routeConfig.default.label,
          path: routeConfig.default.path,
          selectComponent: routeConfig.default.selectComponent,
          onClick: () => {
            console.log("Navigating to", routeConfig.default.label);
            setSelectComponent(routeConfig.default.selectComponent);
            navigate(routeConfig.default.path, { replace: true });
          },
        });

        // Special case for AssessmentCreationPage2 to show under Assessments 
        if (selectComponent === "AssessmentCreationPage2" && pathname === "/question-bank") {
          crumbs.push({
            label: routeConfig["/assignment"].label,
            path: routeConfig["/assignment"].path,
            selectComponent: routeConfig["/assignment"].selectComponent,
            onClick: () => {
              console.log("Navigating to Assessments");
              setSelectComponent("/assignment");
              navigate(routeConfig["/assignment"].path);
            },
          });
          
          crumbs.push({
            label: routeConfig["AssessmentCreationPage2"].label,
            path: routeConfig["AssessmentCreationPage2"].path,
            selectComponent: routeConfig["AssessmentCreationPage2"].selectComponent,
            onClick: () => {
              console.log("Already on Create Assessment");
            },
          });
        }
        // Special case for Q&A to show under Assessment
        else if (selectComponent === "Q&A" && routeConfig.assessment?.subComponents?.["Q&A"]) {
          crumbs.push({
            label: routeConfig.assessment.label,
            path: routeConfig.assessment.path,
            selectComponent: routeConfig.assessment.selectComponent,
            onClick: () => {
              console.log("Navigating to Assessment");
              navigate(routeConfig.assessment.path);
              setSelectComponent(routeConfig.assessment.selectComponent);
            },
          });
          
          const qnaCrumb = routeConfig.assessment.subComponents["Q&A"];
          crumbs.push({
            label: qnaCrumb.label,
            path: qnaCrumb.path,
            selectComponent: qnaCrumb.selectComponent,
            onClick: () => {
              console.log("Navigating to", qnaCrumb.label);
              navigate(qnaCrumb.path);
              setSelectComponent(qnaCrumb.selectComponent);
            },
          });
        }
        // Special case for responses to show under See Plan
        else if (selectComponent === "responses" && pathname === "/Dashboard") {
          crumbs.push({
            label: routeConfig.seePlan.label,
            path: routeConfig.seePlan.path,
            selectComponent: routeConfig.seePlan.selectComponent,
            onClick: () => {
              console.log("Navigating to See Plan");
              setSelectComponent(routeConfig.seePlan.selectComponent);
              navigate(routeConfig.seePlan.path);
            },
          });
          
          crumbs.push({
            label: routeConfig.responses.label,
            path: routeConfig.responses.path,
            selectComponent: routeConfig.responses.selectComponent,
            onClick: () => {
              console.log("Already on Responses");
            },
          });
        }
        // Handle other sub-components
        else if (selectComponent && routeConfig[selectComponent]) {
          const subCrumb = routeConfig[selectComponent];
          crumbs.push({
            label: subCrumb.label,
            path: subCrumb.path,
            selectComponent: subCrumb.selectComponent,
            onClick: () => {
              console.log("Navigating to", subCrumb.label);
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

    console.log("Generated hierarchical breadcrumbs:", crumbs);
    return crumbs;
  };

  // Track navigation history
  useEffect(() => {
    const getCurrentPageInfo = () => {
      let pathname = location.pathname;
      if (pathname.startsWith("/userNutrition/")) {
        return { 
          key: "/userNutrition/:userId", 
          label: "User Nutrition", 
          path: pathname 
        };
      }
      if (pathname === "/Dashboard") {
        const component = selectComponent || "dashboard";
        const config = breadcrumbConfig["/Dashboard"][component] || breadcrumbConfig["/Dashboard"].default;
        return { 
          key: `${pathname}-${component}`, 
          label: config.label, 
          path: pathname, 
          selectComponent: component 
        };
      }
      if (pathname === "/question-bank") {
        const component = selectComponent || "default";
        // Only create different keys for actual different components, not for the default view
        if (component === "default" || component === "/question-bank" || !selectComponent) {
          return { 
            key: pathname, 
            label: "Question Bank", 
            path: pathname 
          };
        } else {
          const config = breadcrumbConfig["/question-bank"][component] || breadcrumbConfig["/question-bank"].default;
          return { 
            key: `${pathname}-${component}`, 
            label: config.label, 
            path: pathname, 
            selectComponent: component 
          };
        }
      }
      
      const config = breadcrumbConfig[pathname];
      if (config) {
        return { 
          key: pathname, 
          label: config.label, 
          path: pathname 
        };
      }
      return null;
    };

    const currentPageInfo = getCurrentPageInfo();
    if (!currentPageInfo) return;
    
    setNavigationHistory(prev => {
      // Don't add if it's the same as the last entry
      if (prev.length > 0 && prev[prev.length - 1].key === currentPageInfo.key) {
        return prev;
      }
      
      // Remove if exists elsewhere and add to end
      const filtered = prev.filter(item => item.key !== currentPageInfo.key);
      const newHistory = [...filtered, currentPageInfo].slice(-3); // Keep last 3
      
      console.log("Navigation history updated:", newHistory);
      return newHistory;
    });
  }, [location.pathname, selectComponent]);

  // Decide whether to use hierarchical or history breadcrumbs
  const getBreadcrumbs = () => {
    const hierarchicalCrumbs = getHierarchicalBreadcrumbs();
    
    // Use history only if we have genuinely different pages (not just reloads of the same page)
    const uniqueRoutes = [...new Set(navigationHistory.map(item => item.path))];
    
    if (navigationHistory.length >= 2 && uniqueRoutes.length >= 2) {
      const historyCrumbs = navigationHistory.map(pageInfo => {
        if (pageInfo.key.startsWith("/Dashboard-")) {
          return {
            label: pageInfo.label,
            path: "/Dashboard",
            selectComponent: pageInfo.selectComponent,
            onClick: () => {
              setSelectComponent(pageInfo.selectComponent);
              navigate("/Dashboard");
            }
          };
        } else if (pageInfo.key.startsWith("/question-bank-")) {
          return {
            label: pageInfo.label,
            path: "/question-bank",
            selectComponent: pageInfo.selectComponent,
            onClick: () => {
              setSelectComponent(pageInfo.selectComponent);
              navigate("/question-bank");
            }
          };
        } else if (pageInfo.key === "/question-bank") {
          return {
            label: pageInfo.label,
            path: "/question-bank",
            onClick: () => navigate("/question-bank")
          };
        } else {
          return {
            label: pageInfo.label,
            path: pageInfo.path,
            onClick: () => navigate(pageInfo.path)
          };
        }
      });
      
      console.log("Using history breadcrumbs:", historyCrumbs);
      return historyCrumbs;
    }
    
    // Use hierarchical breadcrumbs (your original logic) for first navigation or single page
    console.log("Using hierarchical breadcrumbs:", hierarchicalCrumbs);
    return hierarchicalCrumbs;
  };

  const breadcrumbs = getBreadcrumbs();

  return (
    <div
      style={{
        backgroundColor: "white",
        padding: "0",
        margin: "0",
        display: "flex",
        alignItems: "center",
        fontFamily: "'Roboto', sans-serif",
        fontSize: "14px",
        gap: "4px",
        width: "fit-content",
        height: "fit-content",
        border: "1px solid #d1d5db",
        borderRadius: "6px",
        overflow: "hidden",
      }}
    >
      {breadcrumbs.map((crumb, index) => (
        <React.Fragment key={crumb.path + index}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              padding: "6px 12px",
              backgroundColor:
                index === breadcrumbs.length - 1 ? "#f3f4f6" : "transparent",
              cursor: index === breadcrumbs.length - 1 ? "default" : "pointer",
              borderRight: index < breadcrumbs.length - 1 ? "1px solid #d1d5db" : "none",
              height: "100%",
            }}
          >
            {index === breadcrumbs.length - 1 ? (
              <Typography
                style={{
                  color: "#081021",
                  fontWeight: 500,
                  fontSize: "14px",
                  margin: 0,
                  padding: 0,
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
                  margin: 0,
                  padding: 0,
                }}
                onClick={crumb.onClick}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = "#4338ca";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = "#0079ff";
                }}
              >
                {crumb.label}
              </Link>
            )}
          </div>
          {index < breadcrumbs.length - 1 && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "20px",
                height: "100%",
                backgroundColor: "#f9fafb",
                color: "#6b7280",
                fontSize: "12px",
                fontWeight: "bold",
              }}
            >
              →
            </div>
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

export default Breadcrumb;