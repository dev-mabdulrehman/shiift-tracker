import { createRoot } from 'react-dom/client'
import { BrowserRouter, Route, Routes, Navigate } from 'react-router-dom'
import "./assets/css/index.css";

// Layouts & Context
import Root from './layout/Root.jsx'
import { AuthProvider, useAuth } from './context/AuthContext.jsx'

// Pages
import Home from './pages/Home.jsx'
import WriteShift from './pages/WriteShift.jsx'
import History from './pages/History.jsx'
import Login from './pages/Login.jsx'
import Register from './pages/Register.jsx'
import ForgotPassword from './pages/ForgotPassword.jsx'

// Helper component to protect private routes
const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

createRoot(document.getElementById('root')).render(
  <AuthProvider>
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        {/* Private App Routes */}
        <Route element={<ProtectedRoute><Root /></ProtectedRoute>}>
          <Route path='/' element={<Home />} />
          <Route path='/shift/add' element={<WriteShift />} />
          <Route path='/shift/edit/:id' element={<WriteShift />} />
          <Route path='/history' element={<History />} />
        </Route>

        {/* Catch-all: Redirect to Home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  </AuthProvider>
)