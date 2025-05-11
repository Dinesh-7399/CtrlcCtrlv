import React, { Suspense, lazy } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
  // Outlet, // Outlet might not be directly used in App.jsx but in Layout components
} from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import "katex/dist/katex.min.css";
import Spinner from "./components/common/Spinner"; // Ensure this path is correct
import { AuthProvider } from "./context/AuthContext";

// Fallback while lazy components load
const LoadingIndicator = () => (
  <div
    style={{
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      height: "100vh",
      backgroundColor: "var(--background-color-main, #f4f7f6)", // Optional: Match your theme
    }}
  >
    <Spinner label="Loading Page..." /> {/* Added label for better UX */}
  </div>
);

// Lazy-loaded Layouts
const Layout = lazy(() => import("./components/Layout/Layout"));
const AdminLayout = lazy(() => import("./components/Layout/AdminLayout"));

// Route Guards
const PrivateRoute = lazy(() => import("./components/Routes/PrivateRoute"));
const AdminRoute = lazy(() => import("./components/Routes/AdminRoute"));

// Page Components
const HomePage = lazy(() => import("./pages/HomePage/HomePage"));
const LoginPage = lazy(() => import("./pages/LoginPage/LoginPage"));
const RegisterPage = lazy(() => import("./pages/RegisterPage/RegisterPage"));
const DashboardPage = lazy(() => import("./pages/DashboardPage/DashboardPage"));
const CourseListPage = lazy(() =>
  import("./pages/CourseListPage/CourseListPage")
);
const CourseDetailPage = lazy(() =>
  import("./pages/CourseDetailPage/CourseDetailPage")
);
const LearningPage = lazy(() => import("./pages/LearningPage/LearningPage"));
const SettingsPage = lazy(() => import("./pages/SettingsPage/SettingsPage"));
const ContactPage = lazy(() => import("./pages/ContactPage/ContactPage"));
const ArticleListPage = lazy(() =>
  import("./pages/ArticleListPage/ArticleListPage")
);
const ArticleDetailPage = lazy(() =>
  import("./pages/ArticleDetailPage/ArticleDetailPage")
);
// --- ADDED: Lazy load for ArticleListByTagPage ---
const ArticleListByTagPage = lazy(() =>
  import("./pages/ArticleListByTagPage/ArticleListByTagPage")
);
// --- END ADDED ---
const QuizPage = lazy(() => import("./pages/QuizPage/QuizPage"));
const DppPage = lazy(() => import("./pages/DppPage/DppPage"));
const NotFoundPage = lazy(() => import("./pages/NotFoundPage/NotFoundPage"));
const PrivacyPolicyPage = lazy(() =>
  import("./pages/PrivacyPolicy/PrivacyPolicyPage")
);
const TermsOfServicePage = lazy(() =>
  import("./pages/TermsOfService/TermOfServicePage") // Corrected path from TermOfServicePage to TermsOfServicePage
);
const CheckoutPage = lazy(() => import("./pages/CheckoutPage/CheckoutPage"));
const InstructorProfilePage = lazy(() =>
  import("./pages/InstructorProfilePage/InstructorProfilePage")
);

// Doubt Pages
const DoubtPage = lazy(() => import("./pages/DoubtPage/DoubtPage"));
const DoubtChatPage = lazy(() => import("./pages/DoubtChatPage/DoubtChatPage"));
const DoubtLiveClassPage = lazy(() =>
  import("./pages/DoubtLiveClassPage/DoubtLiveClassPage")
);

// qna page
const QnAPage = lazy(() => import("./pages/QnAPage/QnAPage")); // Corrected casing from QnAPage to QnAPage for consistency

// Admin Pages
const AdminDashboard = lazy(() =>
  import("./pages/admin/AdminDashboard/AdminDashboard")
);
const AdminCourseList = lazy(() =>
  import("./pages/admin/AdminCourseList/AdminCourseList")
);
const AdminCourseEdit = lazy(() =>
  import("./pages/admin/AdminCourseEdit/AdminCourseEdit")
);
const AdminUserList = lazy(() =>
  import("./pages/admin/AdminUserList/AdminUserList") // Corrected from AdminuserList
);
const AdminArticleList = lazy(() =>
  import("./pages/admin/AdminArticleList/AdminArticleList")
);
const AdminArticleEdit = lazy(() =>
  import("./pages/admin/AdminArticleEdit/AdminArticleEdit")
);
const AdminAnalytics = lazy(() =>
  import("./pages/admin/AdminAnalytics/AdminAnalytics")
);
const AdminSettings = lazy(() =>
  import("./pages/admin/AdminSettings/AdminSettings")
);

// AnimatedRoutes wraps Routes with AnimatePresence
const AnimatedRoutes = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* Public Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Main Layout Routes */}
        <Route element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="courses" element={<CourseListPage />} />
          <Route path="courses/:courseId" element={<CourseDetailPage />} />
          <Route path="articles" element={<ArticleListPage />} />
          <Route path="articles/:articleSlug" element={<ArticleDetailPage />} />
          {/* --- ADDED: Route for articles filtered by tag --- */}
          <Route path="articles/tag/:tagSlug" element={<ArticleListByTagPage />} />
          {/* --- END ADDED --- */}
          <Route path="contact" element={<ContactPage />} />
          <Route path="privacy-policy" element={<PrivacyPolicyPage />} />
          <Route path="terms-of-service" element={<TermsOfServicePage />} />
          <Route path="qna" element={<QnAPage />} /> {/* Corrected casing */}
          <Route
            path="instructors/:instructorId"
            element={<InstructorProfilePage />}
          />

          {/* Protected User Routes */}
          <Route element={<PrivateRoute />}>
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="checkout/:courseId" element={<CheckoutPage />} />

            {/* Learning & Doubts */}
            {/* Consider if :courseId should be part of the path for learning related doubts */}
            <Route path="learn/:courseId"> {/* Nested under course for context */}
              <Route index element={<LearningPage />} /> {/* Default learning page for course */}
              <Route path=":lessonId" element={<LearningPage />} />
              <Route path=":lessonId/quiz" element={<QuizPage />} />
              <Route path=":lessonId/dpp" element={<DppPage />} />
              {/* Doubts specific to a course - adjust path if doubts are more general */}
              <Route path="doubts" element={<DoubtPage />}> {/* Path becomes /learn/:courseId/doubts */}
                <Route path="chat" element={<DoubtChatPage />} /> {/* /learn/:courseId/doubts/chat */}
                <Route path="live" element={<DoubtLiveClassPage />} /> {/* /learn/:courseId/doubts/live */}
              </Route>
            </Route>
          </Route>
        </Route>

        {/* Admin Routes */}
        <Route element={<AdminRoute />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="courses" element={<AdminCourseList />} />
            <Route
              path="courses/edit/:courseId" // Also common: courses/new for create form
              element={<AdminCourseEdit />}
            />
             <Route
              path="courses/create" // Example for a create route
              element={<AdminCourseEdit isCreating />} // Assuming AdminCourseEdit can handle create
            />
            <Route path="users" element={<AdminUserList />} />
            <Route path="articles" element={<AdminArticleList />} />
            <Route
              path="articles/edit/:articleId"
              element={<AdminArticleEdit />}
            />
             <Route
              path="articles/create" // Example for a create route
              element={<AdminArticleEdit isCreating />} // Assuming AdminArticleEdit can handle create
            />
            <Route path="analytics" element={<AdminAnalytics />} />
            <Route path="settings" element={<AdminSettings />} />
            {/* Add other admin sub-routes here */}
          </Route>
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </AnimatePresence>
  );
};

// App Component
const App = () => (
  <AuthProvider> {/* Ensure AuthProvider correctly passes its value if not default */}
    <Router>
      <Suspense fallback={<LoadingIndicator />}>
        <AnimatedRoutes />
      </Suspense>
    </Router>
  </AuthProvider>
);

export default App;