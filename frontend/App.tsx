import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { AppProvider, useApp } from "./src/context/AppContext";
import Home from "./src/pages/Home";
import Editor from "./src/pages/Editor";
import Viewer from "./src/pages/Viewer";
import Presentation from "./src/pages/Presentation";
import { Login } from "./src/pages/Login";
import { Register } from "./src/pages/Register";
import { ForgotPassword } from "./src/pages/ForgotPassword";
import { ResetPassword } from "./src/pages/ResetPassword";
import Trash from "./src/pages/Trash";


function RequireAuth({ children }: { children: React.ReactElement }) {
  const { currentUser, loading } = useApp();
  const location = useLocation();

  if (loading) {
    return null;
  }

  // Allow access if share query param is present
  const query = new URLSearchParams(location.search);
  if (query.get('share')) {
    return children;
  }

  if (!currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}

function App() {
  return (
    <AppProvider>
      <Router>
        <Routes>
          <Route
            path="/"
            element={
              <RequireAuth>
                <Home />
              </RequireAuth>
            }
          />
          <Route
            path="/home"
            element={
              <RequireAuth>
                <Home />
              </RequireAuth>
            }
          />
          {/* Editor route - public access, Editor handles permissions internally */}
          <Route
            path="/editor/:projectId"
            element={<Editor />}
          />
          {/* Viewer route - public access for view-only shared projects */}
          <Route
            path="/viewer/:projectId"
            element={<Viewer />}
          />
          <Route
            path="/present/:projectId"
            element={
              <RequireAuth>
                <Presentation />
              </RequireAuth>
            }
          />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route
            path="/trash"
            element={
              <RequireAuth>
                <Trash />
              </RequireAuth>
            }
          />
        </Routes>
      </Router>
    </AppProvider>
  );
}

export default App;
