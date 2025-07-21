
import React, {
  createContext,
  useState,
  ReactNode,
  Dispatch,
  SetStateAction,
} from "react";


// ----------------- TYPES ----------------- //

export type createAssessmentTemplate = {
  name: string;
  questions: {
    questionId: string;
    isRequired: boolean;
  }[];
}

export type Activity_Api_call = {
  activityId?: string;
  name: string,
  description: string,
  target: number | null,
  unit: string,
  icon?: string,
  type?:string,
}

export type Session_Api_call = {
  sessionId?: string;
  title: string;
  description: string;
  category: string;
  activityIds?: string[];
  activities?: Activity_Api_call[];
}
export type Customers_Api_call ={
  userId: string;
  name: string;
  age: number;
  gender: string;
  mobile?: string;
  email?: string;
  height?: string;
  weight?: string;
  healthCondition?: string;
  createdOn :string;
  updated_on?: string;
  membershipType: string;
  membershipValidity: {
    startDate: string;
    endDate: string;
  };
  membershipStatus: string;
  plansAllocated: string[];
  assessments: string[];
  type: string;
  photo: string | null;
  address: string | null;
  sessionsBooked: string[];
  gamesBooked: string[];
  gamesPlayed: string[];
  gameLevel: string | null;
  userRating: number | null;
  faveSports: string[];
  faveUsers: string[];
  blockedUsers: string[];
  playedWithUsers: string[];
}
export type UserDetailsType={
  userId: string;
  name: string;
  age: number;
  gender: string;
  mobile: string;
  email: string;
  height: number;
  weight: number;
  healthCondition: string;
  membershipType: string;
  membershipValidity: {
    startDate: string;
    endDate: string;
  };
  membershipStatus: string;
  plansAllocated: string[];
  assessments: string[];
  type: string;
  photo: string | null;
  address: string | null;
  sessionsBooked: string[];
  gamesBooked: string[];
  gamesPlayed: string[];
  gameLevel: string | null;
  userRating: number | null;
  faveSports: string[];
  faveUsers: string[];
  blockedUsers: string[];
  playedWithUsers: string[];

}
export type Plan_Instance_Api_call = {
  sessionTemplateIds: string[];
  scheduledDates: string[];
}

// Assessments (dashboard page)
export type Assessment_Api_call = {
  tempelateId: string;
  name: string;
  created_on: string;
  questions: object[];
}


//  assessmentInstance for each user 
export type Assessment_instance_expanded_Api_call = {
  assessmentInstanceId: string;
  tempelateId: string;
  userId: string;
  answers: Object[];
  startedOn: string;
  submittedOn: string;
  nextAssessmentOn: string;
  totalScore: number;
  template: object[];
}
export interface Answer {
  questionId: string;
  mainText: string;
  answerType: "text" | "number" | "choose_one" | "date";
  value: string | null;
  scoreLevel: string | null;
  scoreValue: number | null;
  scoreZone: string | null;
  notes: string | null;
  isRequired: boolean;
}

export interface TemplateQuestion {
  created_on: string;
  questionId: string;
  mainText: string;
  answerType: "text" | "number" | "choose_one" | "date";
  options: string[] | null;
  scoreZones: any; // or a specific type if known
  isRequired: boolean;
}

export interface Template {
  name: string;
  created_on: string;
  templateId: string;
  questions: TemplateQuestion[];
}

export interface AssessmentInstance_with_answer {
  assessmentInstanceId: string;
  templateId: string;
  userId: string;
  answers: Answer[];
  startedOn: string;
  submittedOn: string;
  nextAssessmentOn: string | null;
  totalScore: number;
  template: Template;
}



type MCQQuestion = {
  questionId: number;
  questionText: string;
  options: MCQOption[];
};

export type Question_Api_call = {
  created_on: string;
  questionId: string;
  mainText: string;
  answerType: string;
  options?: string[];
}
export type Plan_Api_call = {
  templateId ?: string;
  title : string;
  description : string;
  category : string;
  sessions : object[];
}


export type plans_full_api_call = {
  templateId : string;
  title : string;
  description : string;
  category : string;
  sessionIds : string[];
  sessions : object[];
  status : string;
}


type MCQOption = {
  text: string;
  selected: boolean;
};

type DataContextType = {
  // customers 

  customers_Api_call: Customers_Api_call[];
  setCustomers_Api_call: Dispatch<SetStateAction<Customers_Api_call[]>>;



  // Assessments -> Dashboard page
  assessments_Api_call: Assessment_Api_call[];
  setAssessments_Api_call: Dispatch<SetStateAction<Assessment_Api_call[]>>;

  // Assessment instance for each user
  assessmentInstance_expanded_Api_call: Assessment_instance_expanded_Api_call[];
  setAssessmentInstance_expanded_Api_call: Dispatch<SetStateAction<Assessment_instance_expanded_Api_call[]>>;

  // Assessment instance for user by assessment id
  assessmentInstance_call:AssessmentInstance_with_answer[];
  setAssessmentInstance_call:Dispatch<SetStateAction<AssessmentInstance_with_answer[]>>;
  // plans api call
  plans_full_api_call: plans_full_api_call[];
  setPlans_full_api_call: Dispatch<SetStateAction<plans_full_api_call[]>>;
  

  // plan api call
  plan_api_call: Plan_Api_call[];
  setPlan_api_call: Dispatch<SetStateAction<Plan_Api_call[]>>;

  header: string;
  setHeader: Dispatch<SetStateAction<string>>;
  selectComponent: string;
  setSelectComponent: Dispatch<SetStateAction<string>>;


  questionsForQuestionBank: MCQQuestion[];
  setQuestionsForQuestionBank: Dispatch<SetStateAction<MCQQuestion[]>>;

  // activity type for plan creation
  activities_api_call : Activity_Api_call[];
  setActivities_api_call: Dispatch<SetStateAction<Activity_Api_call[]>>;

  //questions for api call
  questionsForAPICall: Question_Api_call[];
  setQuestionsForAPICall: Dispatch<SetStateAction<Question_Api_call[]>>

  // sessions for api call
  sessions_api_call: Session_Api_call[];
  setSessions_api_call: Dispatch<SetStateAction<Session_Api_call[]>>;

  nutrition_api_call:Session_Api_call[];
  setnutrition_api_call:Dispatch<SetStateAction<Session_Api_call[]>>;

  // loading details
  loading:boolean;
  setLoading:Dispatch<SetStateAction<boolean>>;

};

export const DataContext = createContext<DataContextType | undefined>(
  undefined
);

type DataProviderProps = {
  children: ReactNode;
};


// ----------------- PROVIDER -----------------

export const DataProvider = ({ children }: DataProviderProps) => {
  // customers
  const [customers_Api_call , setCustomers_Api_call] = useState<Customers_Api_call[]>([]);

  // Assessments -> dashboard page
  const [assessments_Api_call , setAssessments_Api_call] = useState<Assessment_Api_call[]>([]);

  //questions
  const [questionsForAPICall, setQuestionsForAPICall] = useState<Question_Api_call[]>([]);
  // Assessment instance for each user
  const [assessmentInstance_expanded_Api_call , setAssessmentInstance_expanded_Api_call] = useState<Assessment_instance_expanded_Api_call[]>([]);

  // Assessment instance for each user by userid
  const [assessmentInstance_call,setAssessmentInstance_call]=useState<AssessmentInstance_with_answer[]>([]);
  // activities api call
  const [activities_api_call, setActivities_api_call] = useState<Activity_Api_call[]>([]);

  // plans api call
  const [plans_full_api_call, setPlans_full_api_call] = useState<plans_full_api_call[]>([]);
 

  const [header, setHeader] = useState<string>("Customer Dashboard");
  const [selectComponent, setSelectComponent] = useState<string>("dashboard");

  const [sessions_api_call , setSessions_api_call] = useState<Session_Api_call[]>([]);
  const[nutrition_api_call,setnutrition_api_call]= useState<Session_Api_call[]>([]);

  const [plan_api_call , setPlan_api_call] = useState<Plan_Api_call[]>([]);
  
  const [loading, setLoading] = useState(false);

  return (
    <DataContext.Provider
      value={{
        // customers ---
        // customers,
        // setCustomers,
        customers_Api_call,
        setCustomers_Api_call,
        // customers ---

        // questions for api call
        questionsForAPICall,
        setQuestionsForAPICall,


        // Assessments (dashboard page)
        assessments_Api_call,
        setAssessments_Api_call,
        // Assessments (dashboard page)

        // Assessment instance for each user
        assessmentInstance_expanded_Api_call,
        setAssessmentInstance_expanded_Api_call,

        // Assessment instance for each user by user id
        assessmentInstance_call,
        setAssessmentInstance_call,

        //activities 
        activities_api_call,
        setActivities_api_call,

        
        // plans api call
        plans_full_api_call,
        setPlans_full_api_call,
        // plans api call


        header,
        setHeader,
        selectComponent,
        setSelectComponent,

        // sessions for api call
        sessions_api_call,
        setSessions_api_call,

        nutrition_api_call,
        setnutrition_api_call,

        // plan api call
        plan_api_call,
        setPlan_api_call,

        loading,
        setLoading,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};
