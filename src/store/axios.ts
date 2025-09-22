import axios from "axios";
import { useContext ,useState} from "react";
import {
  Activity_Api_call,
  Customers_Api_call,
  DataContext,
  Plan_Api_call,
  Plan_Instance_Api_call,
  Session_Api_call,
} from "./DataContext";
// import { Dispatch, SetStateAction } from 'react';
import { createAssessmentTemplate } from "./DataContext";
import { enqueueSnackbar } from "notistack";
// const API_BASE_URL="http://127.0.0.1:8000"
// const API_BASE_URL="https://forge-play-backendv2.forgehub.in"
// const API_BASE_URL2=" http://127.0.0.1:8000"
// const API_BASE_URL2='https://play-os-backendv2.forgehub.in'


//export const API_BASE_URL = "https://forge-play-backend.forgehub.in";
//export const API_BASE_URL2="https://play-os-backend.forgehub.in";
// export const API_BASE_URL = "https://testforgebackend.forgehub.in";
// export const API_BASE_URL2 = "https://testplaybackend.forgehub.in";


const mode = "production";  // or "development", or other
let API_BASE_URL: string;
let API_BASE_URL2: string;

if (mode === "production") {
  API_BASE_URL = "https://forge-play-backend.forgehub.in";
  API_BASE_URL2 = "https://play-os-backend.forgehub.in";
} else if (mode === "development") {
  API_BASE_URL = "https://testforgebackend.forgehub.in";
  API_BASE_URL2 = "https://testplaybackend.forgehub.in";
} else {
  API_BASE_URL = "http://127.0.0.1:8001";   
  API_BASE_URL2 = "http://127.0.0.1:8000";
}

export { API_BASE_URL, API_BASE_URL2 };


// kkkkkwwwwwww
export const useApiCalls = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error("useApiCalls must be used within a DataProvider");
  }
  const {
    setSelectComponent,
    setCustomers_Api_call,
    setAssessments_Api_call,
    setQuestionsForAPICall,
    setAssessmentInstance_expanded_Api_call,
    setActivities_api_call,
    setSessions_api_call,
    setnutrition_api_call,
    setPlans_full_api_call,
    setAssessmentInstance_call,
  } = context;

const customer_creation = async (customer: any) => {
  const data = {
    ...customer, // Spread full payload including nutritionKYC
    password: customer.password || undefined, // Include password only if provided
  };
  try {
    const res = await axios.post(`${API_BASE_URL2}/human/register`, data);
    enqueueSnackbar("Customer created successfully!", {
      variant: "success",
      autoHideDuration: 3000,
    });
    const userId = res.data.userId.userId;
    const data2 = {
      ...customer, // Spread full payload for PATCH
      password: undefined, // Exclude password from update
    };
    const res_2 = await axios.patch(`${API_BASE_URL2}/human/${res.data.userId.userId}`, data2);
    customers_fetching(); // Refresh the customer list after creation
    return { ...res_2, userId };
  } catch (error) {
    enqueueSnackbar("Please fill all details!", {
      variant: "warning",
      autoHideDuration: 3000,
    });
    console.error("❌ Error creating customer:", error);
  }
};


  const patch_user = async (userId: string) => {
    try {
      // Send PATCH requests for each userId in parallel
      await axios.patch(`${API_BASE_URL}/humans/${userId}`, {
        membershipType: "inactive",
      });
      // alert("user deactivated successfully!");
      // customers_fetching(); // Refresh the customer list
    } catch (error) {
      console.error("❌ Error deactivating users:", error);
      // alert("Failed to deactivate one or more users. Please try again.");
      enqueueSnackbar("Failed to deactivate one or more users. Please try again.", {
        variant: "error",
        autoHideDuration: 3000,
      });
    }
  };

  //NEW EDIT CUSTOMER FUCNTION 
const patch_customer = async (userId: string, customerData: any) => {
  try {
    const res = await axios.patch(`${API_BASE_URL2}/human/${userId}`, customerData);
    
    enqueueSnackbar("Customer updated successfully!", {
      variant: "success",
      autoHideDuration: 3000,
    });
    
    customers_fetching(); // Refresh the customer list after update
    return res;
    
  } catch (error) {
    console.error("❌ Error updating customer:", error);
    enqueueSnackbar("Failed to update customer. Please try again.", {
      variant: "error",
      autoHideDuration: 3000,
    });
  }
};

  const customers_fetching = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL2}/human/all?type=forge`);
      const data = res.data;
      const filteredData = [...data].filter((user) => user.type == "forge");
      // console.log("Filtered Data:", filteredData);
      setCustomers_Api_call(data);
      // console.log("✅ Customers fetched successfully:", data);

      // console.log("Status:", res.status);
    } catch (error) {
      console.error("❌ Error fetching customers:", error);
    }
  };
  const patchSession = async (sessionId: string, session: Session_Api_call) => {
    try {
      const res = await axios.patch(
        `${API_BASE_URL}/session-templates/${sessionId}`,
        session
      );
      console.log(session,"payloaddddd")
      // console.log("Session updated successfully:", res.data);
      // alert("Session updated successfully!");
      enqueueSnackbar("Session updated successfully!", {
        variant: "success",
        autoHideDuration: 3000,
      });

    } catch (error) {
      console.error("❌ Error updating session:", error);
      // alert("Error updating session");
      enqueueSnackbar("Error updating session", {
        variant: "error",
        autoHideDuration: 3000,
      });
    }
  };

  // getting human by userId
  const getHumanById=async(userId:string)=>{
    try{
      const res=await axios.get(`${API_BASE_URL}/human/${userId}`)
      const data=res.data
      return data
    }catch (error) {
      console.error("❌ Error fetching plan:", error);
    }
  }
  const getPlanByPlanId = async (planId: string) => {
    try {
      const res = await axios.get(`${API_BASE_URL}/plan-templates/${planId}`);
      const data = res.data;
      // console.log("✅ Plan fetched successfully:", data);
      return data;
    } catch (error) {
      console.error("❌ Error fetching plan:", error);
    }
  };
  const getSessions = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/session-templates/full`);
      const data = res.data;
      setSessions_api_call(data);
      console.log("✅ Sessions fetched successfully:", data);
    } catch (error) {
      console.error("❌ Error fetching sessions:", error);
    }
  };

  const getNutrition=async()=>{
    try{
      // setLoading(true);
      const res=await axios.get(`${API_BASE_URL}/nutition_session-template/full`);
      const data=res.data
    setnutrition_api_call(data);
      console.log("✅ Sessions fetched successfully:", data);
    }catch(error){
      console.log(error)
    }
  }
  const createSession = async (session: Session_Api_call) => {
    try {
      const res = await axios.post(
        `${API_BASE_URL}/session-templates`,
        session
      );
      console.log("Session created successfully:", res.data);
      // alert(
      //   "Session created successfully! You can now view it in the Sessions section."
      // );
      enqueueSnackbar("Session created successfully! You can now view it in the Sessions section.", {
        variant: "success",
        autoHideDuration: 3000,
      });
    } catch (error) {
      console.error("❌ Error creating session:", error);
      // alert("Error creating session. Please fill all details.");
      enqueueSnackbar("Error creating session. Please fill all details.", {
        variant: "error",
        autoHideDuration: 3000,
      });
    }
  };

  const assessments_fetching = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/asssessmenttemplates/full`);
      const data = res.data;
      setAssessments_Api_call(data);
      console.log("✅ Assessments fetched successfully:", data);
      console.log("Status:", res.status);
    } catch (error) {
      console.error("❌ Error fetching assessments:", error);
    }
  };
  const updateSessionInPlanInstance = async (
    planInstanceId: string,
    sessionInstanceId: string,
    newDate: Date
  ) => {
    try {
      const res = await axios.patch(
        `${API_BASE_URL}/plan-instances/${planInstanceId}/reschedule-session`,
        {
          sessionInstanceId: sessionInstanceId,
          newDate: newDate.toISOString(),
        }
      );
      // console.log("Session instance updated successfully:", res.data);
    } catch (error) {
      console.error("❌ Error updating session instance:", error);
    }
  };

  // used to update session instance to removed in plan
  const RemoveSessionInPlanInstance=async(
    sessionId:string,
    planInstanceId:string,
    removalNote:string
  )=>{
    try{
      console.log(sessionId,planInstanceId,removalNote,"hellooo")
      const data={
          
          sessionId: sessionId,
          planInstanceId: planInstanceId,
          note:removalNote        
        }
      const res = await axios.patch(
        `${API_BASE_URL}/plan-instances/${sessionId}/remove_session`,data,{
          params:{
            sessionId:sessionId
          }
        }
      );
      console.log(res,"sesion updated")
      return res
    }catch(error){
      console.error("❌ Error updating session instance:", error);

    }
  }
  const questions = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/questions`);
      const data = res.data;
      setQuestionsForAPICall(data);
      // console.log("✅ Questions fetched successfully:", data);
    } catch (error) {
      console.error("❌ Error fetching questions:", error);
    }
  };

const AddActivityToSession = async (
  activityId: string,
  sessionId: string,
  planInstanceId: string,
  type?: string,
  vegNonVeg?: string
) => {
  try {
    const payload = vegNonVeg ? { vegNonVeg } : null;
    const res = await axios.patch(
      `${API_BASE_URL}/add-activity-to-session/${activityId}/${sessionId}/${planInstanceId}`,
      payload,
      {
        params: { type: type }
      }
    );
    return res;
  } catch (err) {
    console.log(err);
  }
};
  const RemoveActivityFromSession=async(
    activityId:string,
    sessionId:string,
    planInstanceId:string,
    removalNote:string
  )=>{
    try{
       const data={
        activityId:activityId,
        sessionId:sessionId,
        planInstanceId:planInstanceId,
        removalNote:removalNote        
        }
      console.log(data,"rmeovof data")
      const res=await axios.patch(`${API_BASE_URL}/remove-activity-instance/${activityId}/${sessionId}`,data,{
        params:{
          activitySessionId:activityId,
          sessionId:sessionId,
        }
      });
      return res;

    }catch(error){
      console.log(error)
    }
  }


  const getDummyPlanFromPlans=async(instanceid:string[])=>{
    
    try{const res=await axios.post(`${API_BASE_URL}/getDummyPlanTemplateIdFromList`,
      instanceid
    )
    return res
  }  catch(err){
      console.log(err)
    }

  }
  const submitAssesment = async (assesment: createAssessmentTemplate) => {
    try {
      const res = await axios.post(
        `${API_BASE_URL}/asssessmenttemplates`,
        assesment
      );
      // console.log("✅ Assessment submitted successfully:", res.data);
    } catch (error) {
      console.error("❌ Error submitting assessment:", error);
    }
  };

 const getActivities = async (theme?: string, goal?: string,type?:string) => {
  try {
    const params: Record<string, string> = {};

    if (theme) params.themeTitle = theme;
    if (goal) params.goalTitle = goal;
    if(type) params.typeTitle=type;

    console.log(theme,goal,type,";AWILBEVKD")
    const res = await axios.get(`${API_BASE_URL}/activity-templates`, {
      params
    });

    const data = res.data;
    console.log(data,"this is datatttaa")
    setActivities_api_call(data);
    // console.log("✅ Activities fetched successfully:", data);
    console.log(theme);
    
  } catch (error) {
    console.error("❌ Error fetching activities:", error);
  }
};


  const assessments_intsnce_fetching = async (
    assessmentInstanceIdArray: string[]
  ) => {
    try {
      if (
        !assessmentInstanceIdArray ||
        assessmentInstanceIdArray.length === 0
      ) {
        setAssessmentInstance_expanded_Api_call([]);
      }
      const requests = assessmentInstanceIdArray.map((id) =>
        axios.get(`${API_BASE_URL}/asssessmentinstances/${id}/expanded`)
      );

      // Wait for all requests to complete
      const responses = await Promise.all(requests);
      // Extract data from each response
      const allData = responses.map((res) => res.data);

      // Update the state with the array of all fetched data
      setAssessmentInstance_expanded_Api_call(allData);

      // console.log("✅ Assessment instances fetched successfully:", allData);
    } catch (error) {
      console.error("❌ Error fetching assessment instances:", error);
    }
  };

  const assessment_instance_fetching_by_id=async(assessmentId:string)=>{
    try{

      const response=await axios.get(`${API_BASE_URL}/asssessmentinstances/${assessmentId}/expanded`)
      const data=response.data
      // console.log()
      setAssessmentInstance_call([data])
    }catch(e){
      console.log(e)
    }
  }

  const  updateNextAssessmentDate=async(assessmentId:string,date:string)=>{
    try{
      const response=await axios.patch(`${API_BASE_URL}/nextAssessmentDate`,{},{
        params:{
          assessment_instance_id: assessmentId,
          date:date
        }
        
      })
      return response.data
    }catch(e){
      console.log(e)
    }
  }
  const createPlanInstance = async (
    planTemplateId: string,
    userId: string,
    plan: Plan_Instance_Api_call
  ) => {
    try {
      const res = await axios.post(
        `${API_BASE_URL}/plan-instances?planTemplateId=${planTemplateId}&userId=${userId}`,
        plan
      );
      return res
      // console.log("Plan instance created successfully:", res.data);
      // alert(
      //   "Plan instance created successfully! You can now view it in the Plans section."
      // );
      enqueueSnackbar("Plan instance created successfully! You can now view it in the Plans section.", {
        variant: "success",
        autoHideDuration: 3000,
      });
    } catch (error) {
      console.error("❌ Error creating plan instance:", error);
    }
  };

  const createPlan = async (plan: Plan_Api_call) => {
    if (plan.title.trim() === "" || plan.sessions.length === 0) {
      // alert(
      //   "Please enter a title for the plan and add session to your plan before creating it."
      // );
      enqueueSnackbar("Please enter a title for the plan and add session to your plan before creating it.", {
        variant: "warning",
        autoHideDuration: 3000,
      });
      return;
    }
    try {
      const res = await axios.post(`${API_BASE_URL}/plan-templates`, plan);
      // console.log("Plan created successfully:", res.data);
      // alert(
      //   "Plan created successfully! You can now view it in the All Plans section."
      // );
      enqueueSnackbar("Plan created successfully! You can now view it in the All Plans section.", {
        variant: "success",
        autoHideDuration: 3000,
      });
    } catch (error) {
      console.error("❌ Error creating plan:", error);
      // alert("Error creating plan");
      enqueueSnackbar("Error creating plan", {
        variant: "error",
        autoHideDuration: 3000,
      });
    }
  };

  const starting_assessment_by_user = async (
    user_id: string,
    template_id: string
  ) => {
    // console.log("Starting assessment for user:", user_id);
    // console.log("Template ID:", template_id);
    try {
      const res = axios.post(
        `${API_BASE_URL}/asssessmentinstances/start/${user_id}/${template_id}`
      );
      // console.log("Assessment started successfully:", (await res).status);
      // console.log("Assessment started successfully:", (await res).data);
      localStorage.setItem(
        "latestAssessmentTemplate",
        JSON.stringify((await res).data.assessmentInstanceId)
      );
      // console.log(
      //   "Latest Assessment Template ID stored in localStorage:",
      //   (await res).data.assessmentInstanceId
      // );
    } catch (error) {
      console.error("❌ Error starting assessment:", error);
    }
  };

  const assessmet_submission = async (
    instanceId: string,
    answers: object[]
  ) => {
    try {
      // console.log(answers);
      const res = await axios.patch(
        `${API_BASE_URL}/asssessmentinstances/${instanceId}/submit`,
        {
          answers: answers,
        }
      );
      // console.log("Assessment submitted successfully:", (await res).status);

      setSelectComponent("responses");
      // alert("Assessment submitted successfully!");
      enqueueSnackbar("Assessment submitted successfully!", {
        variant: "success",
        autoHideDuration: 3000,
      });
    } catch (error) {
      console.error("❌ Error submitting assessment:", error);
      // alert("Error submitting assessment. Please try again.");
      enqueueSnackbar("Error submitting assessment. Please try again.", {
        variant: "error",
        autoHideDuration: 3000,
      });
    }
  };
  const question_Updation = async (questionId, question) => {
    try {
      const res = await axios.patch(`${API_BASE_URL}/questions/${questionId}`, {
        answerType: question.answerType,
        mainText: question.mainText,
        options: question.options,
        scoreZones: question.scoreZones || null,
      });
      // console.log("✅ Question updated successfully:", res.data);
    } catch (error) {
      console.error("❌ Error updating question:", error);
    }
  };

  const questionCreation = async (question: object) => {
    try {
      const res = await axios.post(`${API_BASE_URL}/questions`, question);
      // console.log("✅ Question created successfully:", res.data);
    } catch (error) {
      console.error("❌ Error creating question:", error);
    }
  };
  const Question_creation_Api_call = async (questions: object[]) => {
    try {
      for (const question of questions) {
        if (question.checked) {
          if (question.questionId) {
            // If questionId exists, update the question
            const res = await axios.patch(
              `${API_BASE_URL}/questions/${question.questionId}`,
              {
                mainText: question.mainText,
                options: question.options,
                answerType: question.answerType,
              }
            );
            // console.log("✅ Question updated successfully:", res.data);
          } else {
            const res = await axios.post(`${API_BASE_URL}/questions`, question);
            console.log("✅ Question created successfully:", res.data);
          }
        }
      }
    } catch (error) {
      console.error("❌ Error creating question:", error);
    }
  };

  const createActivity = async (activity: Activity_Api_call) => {
    console.log("Creating activity with data:", activity);
    try {
      const res = await axios.post(
        `${API_BASE_URL}/activity-templates`,
        activity
      );
      // alert("Activity created successfully!");
      enqueueSnackbar("Activity created successfully!", {
        variant: "success",
        autoHideDuration: 3000,
      });
      // console.log("Activity created successfully:", res.data);
    } catch (error) {
      console.error("❌ Error creating activity:", error);
    }
  };

  const createNutritionActivity=async(activity: Activity_Api_call)=>{
    try{
      const res=await axios.post(`${API_BASE_URL}/nutrition-activity-template`,activity,{
        params:{
          type:activity.type
        }
      });
      enqueueSnackbar("Nutrition created successfully!", {
        variant: "success",
        autoHideDuration: 3000,
      });
    }catch(error){
      console.error("❌ Error creating activity:", error);
    }
  }
  const getActivityById = async (activityId: string) => {
    try {
      const res = await axios.get(
        `${API_BASE_URL}/activity-templates/${activityId}`
      );
      const data = res.data;
      // console.log("✅ Activity fetched successfully:", data);
      return data;
    } catch (error) {
      console.error("❌ Error fetching activity:", error);
    }
  };

  const getPlansFull = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/plan-templates/All`);
      const data = res.data;
      setPlans_full_api_call(data);
      // console.log("✅ Plans fetched successfully:", data);
    } catch (error) {
      console.error("❌ Error fetching plans:", error);
    }
  };

  const getExpandedPlanByPlanId = async (planIds: string[]) => {
    try {
      const res = await axios.post(
        `${API_BASE_URL}/plan-templates/full`,
        planIds
      );
      const data = res.data;
      // console.log("✅ Plan fetched successfully:", data);
      return data;
    } catch (error) {
      console.error("❌ Error fetching plan:", error);
    }
  };

  const getSessionById = async (sessionId: string) => {
    try {
      const res = await axios.get(
        `${API_BASE_URL}/session-templates/${sessionId}`
      );
      const data = res.data;
      // console.log("✅ Session fetched successfully:", data);
      return data;
    } catch (error) {
      console.error("❌ Error fetching session:", error);
    }
  };

  const getSessionInstanceById=async(sessionInstanceId:string)=>{
     try {
      const res = await axios.get(
        `${API_BASE_URL}/session-instance/${sessionInstanceId}`
      );
      const data = res.data;
      console.log("✅ Session fetched successfully:", data);
      return data;
    } catch (error) {
      console.error("❌ Error fetching session:", error);
    }
  }

  const allocate_Activity_Session=async(
    data:any
  )=>{
    // const data={
    //   activityId:activityId,
    // sessionTemplateId: sessionTemplateId,
    // userId: userId,
    // scheduledDate:scheduledDate, // format: yyyy-mm-dd
    // planInstanceId: planInstanceId
    // }
    try{
      const res=await axios.post(`${API_BASE_URL}/allocateActivityIn_AlcarteSession/${data.activityId}/${data.sessionTemplateId}/${data.sessionInstanceId}/${data.planInstanceId}`,data,{
        params:{
          activityId: data.activityId, sessionId: data.sessionTemplateId,sessionInstanceId:data.sessionInstanceId, planInstanceId: data.planInstanceId
        }
      })
      console.log("res is rescheduled",res)
      return res
    }catch(err){
      console.log(err)
    }
  }

  const addSessionFromCalendar = async (session) => {
    try {
      console.log(session,"this is session comgin in addsession")
      const res = await axios.post(`${API_BASE_URL}/session-instances/generate` ,session );
      const data = res.data;
      // console.log("✅ Sessions fetched successfully:", data);
      return data;
    } catch (error) {
      console.error("❌ Error fetching sessions:", error);
      return [];
    }
  }
   const getAllSessions = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/session-templates`);
      const data = res.data;
      // console.log("✅ All sessions fetched successfully:", data);
      return data;
    } catch (error) {
      console.error("❌ Error fetching all sessions:", error);
      return [];
    }
  };

  const getAllNutrition=async()=>{
    try{
      const res=await axios.get(`${API_BASE_URL}/nutition_session-template`);
      const data=res.data
      return data 
    }catch(error){
      console.error("❌ Error fetching all sessions:", error);
      return [];
    }
  }
  const getPlansForInterval = async (
    startDate: string,
    endDate: string,
    userId: string
  ) => {
    try {
      const res = await axios.get(
        `${API_BASE_URL}/humans/${userId}/plan-instances-within-date?start=${startDate}&end=${endDate}`
      );
      const data = res.data;
      // console.log("✅ Plans for interval fetched successfully:", data);
      return data;
    } catch (error) {
      console.error("❌ Error fetching plans for interval:", error);
    }
  };


  const getLatestPlanAssessment=async(
    userid:string
  )=>{
    try{
      const res=await axios.get(`${API_BASE_URL}/getLatestPlanAndAssessment`,{
        params: {
          userId: userid
        }
      })
      const data=res.data
      return data
    }catch(err){
      console.log(err)
    }
  }
  const patchPlans = async (templateIds: string, session: object[]) => {
    const sessionData = session.map((s) => ({
      sessionId: s.sessionId,
      scheduledDay: s.scheduledDay,
    }));

    console.log(sessionData);
    try {
      const res = await axios.patch(
        `${API_BASE_URL}/plan-templates/${templateIds}`,
        {
          sessions: sessionData,
        }
      );

      // console.log("✅ Patch successful:", res.data);
      enqueueSnackbar("Plan updated successfully!", {
        variant: "success",
        autoHideDuration: 3000,
      });
      getPlansFull(); // Refresh the plans after patching
    } catch (error) {
      console.error("❌ Error in patchPlans:", error);
    }
  };

  const OptimisedPatchPlan = async (
    templateIds: string[],
    btnValue: number
  ) => {
    const status = btnValue === 0 ? "ACTIVE" : "INACTIVE";
    const payload = {
      templateIds,
      updates: templateIds.map(() => ({
        status,
      })),
    };

    try {
      const response = await axios.patch(
        `${API_BASE_URL}/plan-templates/batch`,
        payload
      );
      // console.log("✅ Patch successful:", response.data);
      return response.data;
    } catch (error) {
      console.error("❌ Error in OptimisedPatchPlan:", error);
    }
  };

  const getScore = async (
    questionId: string,
    userId: string,
    value: number
  ) => {
    const data = { questionId, userId, value };
    try {
      const res = await axios.post(`${API_BASE_URL}/score`, data);
      return res.data;
    } catch (error) {
      console.error("❌ Error fetching score:", error);
      return null;
    }
  };

  const getPlans  = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/plan-templates`);
      const data = res.data;
      // console.log("✅ Plans fetched successfully:", data);
      return data;
    } catch (error) {
      console.error("❌ Error fetching plans:", error);
      return [];
    }
  }

  const getPlanInstanceByPlanID = async (planInstanceId: string) => {
    try {
      const res = await axios.get(
        `${API_BASE_URL}/plan-instances/${planInstanceId}/full`
      );
      const data = res.data;
      // console.log("✅ Plan instance fetched successfully:", data);
      return data;  
    } catch (error) {
      console.error("❌ Error fetching plan instance:", error);
      return null;
    }
  };

  const getTags = async () => {
    try{
      const res = await axios.get(`${API_BASE_URL}/tags`);
      const data = res.data;
      // console.log("✅ Tags fetched successfully:", data);
      return data;    
    }
    catch (error) {
      console.error("❌ Error fetching tags:", error);
      return [];
    }
  }

  return {
    customers_fetching,
    assessments_fetching,
    assessments_intsnce_fetching,
    questions,
    submitAssesment,
    starting_assessment_by_user,
    assessmet_submission,
    getActivities,
    Question_creation_Api_call,
    createActivity,
    createNutritionActivity,
    getActivityById,
    createSession,
    getSessions,
    getNutrition,
    getPlansFull,
    patchSession,
    AddActivityToSession,
    RemoveSessionInPlanInstance,
    RemoveActivityFromSession,
    getDummyPlanFromPlans,
    allocate_Activity_Session,
    createPlan,
    patchPlans,
    getPlanByPlanId,
    getSessionById,
    getSessionInstanceById,
    createPlanInstance,
    getExpandedPlanByPlanId,
    getScore,
    getPlansForInterval,
    getLatestPlanAssessment,
    assessment_instance_fetching_by_id,
    updateNextAssessmentDate,
    updateSessionInPlanInstance,
    OptimisedPatchPlan,
    customer_creation,
    patch_user,
    getHumanById,
    question_Updation,
    questionCreation,
    getPlans,
    getPlanInstanceByPlanID,
    getAllSessions,
    getAllNutrition,
    addSessionFromCalendar,
    getTags,
    patch_customer
  };
};
