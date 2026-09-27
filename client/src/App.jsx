import { Routes, Route } from "react-router-dom";
import ProtectedRoute from "./components/common/ProtectedRoute";

import ProfileSelect from "./pages/ProfileSelect";
import Home from "./pages/Home";
import Settings from "./pages/Settings";
import MealMenu from "./pages/MealMenu";

import MissionManage from "./pages/parent/MissionManage";
import ChildManage from "./pages/parent/ChildManage";
import NotificationInbox from "./pages/parent/NotificationInbox";

import MissionList from "./pages/child/MissionList";
import Game from "./pages/child/Game";
import SavingsGoalPage from "./pages/child/SavingsGoalPage";
import EducationHome from "./pages/child/education/EducationHome";
import LearnCards from "./pages/child/education/LearnCards";
import TodayQuiz from "./pages/child/education/TodayQuiz";
import AttendanceCalendar from "./pages/child/education/AttendanceCalendar";

export default function App() {
  return (
    <div className="app-shell">
      <Routes>
        <Route path="/" element={<ProfileSelect />} />

        <Route path="/home" element={<ProtectedRoute><Home /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
        <Route path="/meal" element={<ProtectedRoute><MealMenu /></ProtectedRoute>} />

        {/* 부모 전용 */}
        <Route path="/parent/missions" element={<ProtectedRoute role="PARENT"><MissionManage /></ProtectedRoute>} />
        <Route path="/parent/children" element={<ProtectedRoute role="PARENT"><ChildManage /></ProtectedRoute>} />
        <Route path="/parent/notifications" element={<ProtectedRoute role="PARENT"><NotificationInbox /></ProtectedRoute>} />

        {/* 자녀 전용 */}
        <Route path="/child/missions" element={<ProtectedRoute role="CHILD"><MissionList /></ProtectedRoute>} />
        <Route path="/child/game" element={<ProtectedRoute role="CHILD"><Game /></ProtectedRoute>} />
        <Route path="/child/savings" element={<ProtectedRoute role="CHILD"><SavingsGoalPage /></ProtectedRoute>} />
        <Route path="/child/education" element={<ProtectedRoute role="CHILD"><EducationHome /></ProtectedRoute>} />
        <Route path="/child/education/learn" element={<ProtectedRoute role="CHILD"><LearnCards /></ProtectedRoute>} />
        <Route path="/child/education/quiz" element={<ProtectedRoute role="CHILD"><TodayQuiz /></ProtectedRoute>} />
        <Route path="/child/education/attendance" element={<ProtectedRoute role="CHILD"><AttendanceCalendar /></ProtectedRoute>} />

        <Route path="*" element={<ProfileSelect />} />
      </Routes>
    </div>
  );
}
