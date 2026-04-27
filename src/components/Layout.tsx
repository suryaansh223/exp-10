import type { ReactNode } from 'react';
import Sidebar from './Sidebar';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';

export default function Layout({ children }: { children: ReactNode }) {
  const { user, signOut } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white shadow-sm h-16 flex items-center justify-between px-6 shrink-0 z-10">
          <h2 className="text-xl font-semibold text-gray-800">
            Welcome back, {user.firstName || user.email?.split('@')[0]}
          </h2>
          <button 
            onClick={signOut}
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-red-600 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </header>
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}