import { createRoot } from 'react-dom/client';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import "./assets/css/index.css";

// Layouts & Context
import { AuthProvider } from './context/AuthContext.jsx';
import Root from './layout/Root.jsx';

// Pages
import { Provider } from 'react-redux';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Employers from './pages/Employers.jsx';
import ForgotPassword from './pages/ForgotPassword.jsx';
import Home from './pages/Home.jsx';
import Login from './pages/Login.jsx';
import Profile from './pages/Profile.jsx';
import Register from './pages/Register.jsx';
import Shifts from './pages/Shifts.jsx';
import Sites from './pages/Sites.jsx';
import WriteEmployer from './pages/WriteEmployer.jsx';
import WriteShift from './pages/WriteShift.jsx';
import WriteSite from './pages/WriteSite.jsx';
import { store } from './store/store.js';


createRoot(document.getElementById('root')).render(
  <Provider store={store}>
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
            {/* Shifts */}
            <Route path='/shifts/add' element={<WriteShift />} />
            <Route path='/shifts/edit/:id' element={<WriteShift />} />
            <Route path='/shifts' element={<Shifts />} />

            {/* Employers */}
            <Route path='/employers/add' element={<WriteEmployer />} />
            <Route path='/employers/edit/:id' element={<WriteEmployer />} />
            <Route path='/employers' element={<Employers />} />

            {/* Employers */}
            <Route path='/sites/add' element={<WriteSite />} />
            <Route path='/sites/edit/:id' element={<WriteSite />} />
            <Route path='/sites' element={<Sites />} />

            <Route path='/profile' element={<Profile />} />
          </Route>

          {/* Catch-all: Redirect to Home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  </Provider>
)