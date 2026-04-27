import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Users, Calendar, Clock, CheckCircle } from 'lucide-react';
import { collection, query, orderBy, onSnapshot, getDocs, where, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';

function StatCard({ title, value, icon: Icon, colorClass }: any) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center">
      <div className={`p-4 rounded-full mr-4 ${colorClass}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div>
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ totalShifts: 0, upcomingShifts: 0, hoursLogged: 0, activeVolunteers: 0 });
  const [announcements, setAnnouncements] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;

    // Fetch stats
    const fetchStats = async () => {
      try {
        const shiftsSnapshot = await getDocs(collection(db, 'shifts'));
        const totalShifts = shiftsSnapshot.size;
        
        let upcomingShifts = 0;
        const now = new Date();
        shiftsSnapshot.forEach(doc => {
          if (new Date(doc.data().date) >= now) {
            upcomingShifts++;
          }
        });

        // Simplified hours logged (rough estimate)
        let hoursLogged = 0;
        if (user.role === 'admin') {
           const assignmentsSnapshot = await getDocs(collection(db, 'assignments'));
           hoursLogged = assignmentsSnapshot.size * 2; 
        } else {
           const q = query(collection(db, 'assignments'), where('userId', '==', user.uid));
           const assignmentsSnapshot = await getDocs(q);
           hoursLogged = assignmentsSnapshot.size * 2; 
        }

        // Active volunteers
        const usersSnapshot = await getDocs(collection(db, 'users'));
        const activeVolunteers = usersSnapshot.size || 0;

        setStats({
          totalShifts,
          upcomingShifts,
          hoursLogged,
          activeVolunteers
        });
      } catch (error) {
        console.error("Error fetching stats:", error);
      }
    };

    fetchStats();

    // Fetch latest announcements
    const q = query(collection(db, 'announcements'), orderBy('postedAt', 'desc'), limit(3));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setAnnouncements(data);
    });

    return () => unsubscribe();
  }, [user]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
        {user?.role === 'admin' && (
          <button 
            onClick={() => navigate('/shifts/create')}
            className="bg-indigo-600 text-white px-4 py-2 rounded-md shadow hover:bg-indigo-700 transition"
          >
            + Create New Shift
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Shifts" value={stats.totalShifts} icon={Calendar} colorClass="bg-blue-500" />
        <StatCard title="Upcoming Shifts" value={stats.upcomingShifts} icon={Clock} colorClass="bg-orange-500" />
        <StatCard title="Hours Logged" value={stats.hoursLogged} icon={CheckCircle} colorClass="bg-green-500" />
        {user?.role === 'admin' && (
          <StatCard title="Active Volunteers" value={stats.activeVolunteers} icon={Users} colorClass="bg-indigo-500" />
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
        <div className="col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Your Upcoming Shifts</h3>
          <div className="text-gray-500 text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
            No upcoming shifts scheduled.
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Announcements</h3>
          <div className="space-y-4">
            {announcements.length === 0 ? (
              <p className="text-sm text-gray-500">No recent announcements.</p>
            ) : (
              announcements.map((ann) => (
                <div key={ann.id} className="p-4 bg-indigo-50 rounded-lg border border-indigo-100 mb-3">
                  <h4 className="font-medium text-indigo-900">{ann.title}</h4>
                  <p className="text-sm text-indigo-700 mt-1">{ann.message}</p>
                  <p className="text-xs text-indigo-400 mt-2">
                    {ann.postedAt?.toDate ? ann.postedAt.toDate().toLocaleDateString() : 'Recent'}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}