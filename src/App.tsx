import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Shifts from './pages/Shifts';
import CreateShift from './pages/CreateShift';
import Announcements from './pages/Announcements';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route path="/" element={<Layout><Dashboard /></Layout>} />
          <Route path="/shifts" element={<Layout><Shifts /></Layout>} />
          <Route path="/shifts/create" element={<Layout><CreateShift /></Layout>} />
          <Route path="/announcements" element={<Layout><Announcements /></Layout>} />
          
          {/* Fallback route */}
          <Route path="*" element={<Layout><Dashboard /></Layout>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;