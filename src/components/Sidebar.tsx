import { NavLink } from 'react-router-dom';
import { CalendarDays, LayoutDashboard, Users, User, Bell } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { cn } from '../lib/utils';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', to: '/' },
  { icon: CalendarDays, label: 'Shifts', to: '/shifts' },
  { icon: Bell, label: 'Announcements', to: '/announcements' },
];

export default function Sidebar() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  return (
    <aside className="w-64 bg-indigo-900 text-white flex flex-col">
      <div className="h-16 flex items-center justify-center border-b border-indigo-800 shrink-0">
        <h1 className="text-2xl font-bold tracking-tight">VolunTrack</h1>
      </div>
      
      <nav className="flex-1 py-4 overflow-y-auto">
        <ul className="space-y-1 px-3">
          {navItems.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 px-3 py-2 rounded-md transition-colors',
                    isActive ? 'bg-indigo-800 text-white' : 'text-indigo-200 hover:bg-indigo-800/50 hover:text-white'
                  )
                }
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </NavLink>
            </li>
          ))}
          {isAdmin && (
            <li>
              <NavLink
                to="/volunteers"
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 px-3 py-2 rounded-md transition-colors',
                    isActive ? 'bg-indigo-800 text-white' : 'text-indigo-200 hover:bg-indigo-800/50 hover:text-white'
                  )
                }
              >
                <Users className="w-5 h-5" />
                Volunteers (Admin)
              </NavLink>
            </li>
          )}
        </ul>
      </nav>

      <div className="p-4 border-t border-indigo-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-indigo-700 flex items-center justify-center text-indigo-200">
            <User className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user?.email}</p>
            <p className="text-xs text-indigo-300 capitalize">{user?.role || 'Volunteer'}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}