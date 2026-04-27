import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Calendar as CalendarIcon, Clock, MapPin, Users, CheckCircle, AlertCircle } from 'lucide-react';
import { collection, query, orderBy, onSnapshot, doc, runTransaction } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';

interface Shift {
  id: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  capacity: number;
  registeredCount: number;
  description: string;
  status: string;
}

export default function Shifts() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRegistrations, setUserRegistrations] = useState<Record<string, boolean>>({});
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    // Listen to all shifts
    const q = query(collection(db, 'shifts'), orderBy('date', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const shiftData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Shift[];
      setShifts(shiftData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    // Get user's current registrations
    const fetchRegistrations = async () => {
      const q = query(collection(db, 'assignments'));
      // In a real app, you'd filter by userId, but for demo we can fetch and filter or use composite indexes
      onSnapshot(q, (snapshot) => {
        const regs: Record<string, boolean> = {};
        snapshot.docs.forEach(doc => {
          const data = doc.data();
          if (data.userId === user.uid && data.status === 'registered') {
            regs[data.shiftId] = true;
          }
        });
        setUserRegistrations(regs);
      });
    };
    fetchRegistrations();
  }, [user]);

  const handleSignUp = async (shift: Shift) => {
    if (!user) return;
    setActionLoading(shift.id);

    try {
      const shiftRef = doc(db, 'shifts', shift.id);
      const assignmentRef = doc(db, 'assignments', `${shift.id}_${user.uid}`);

      await runTransaction(db, async (transaction) => {
        const shiftDoc = await transaction.get(shiftRef);
        if (!shiftDoc.exists()) throw new Error("Shift does not exist!");

        const currentRegistered = shiftDoc.data().registeredCount || 0;
        const capacity = shiftDoc.data().capacity;

        if (currentRegistered >= capacity) {
          throw new Error("Shift is already full!");
        }

        // Check if already registered
        const assignmentDoc = await transaction.get(assignmentRef);
        if (assignmentDoc.exists() && assignmentDoc.data().status === 'registered') {
           throw new Error("Already registered!");
        }

        // Register
        transaction.update(shiftRef, { registeredCount: currentRegistered + 1 });
        transaction.set(assignmentRef, {
          shiftId: shift.id,
          userId: user.uid,
          status: 'registered',
          registeredAt: new Date(),
        });
      });

    } catch (error: any) {
      alert(error.message);
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Available Shifts</h1>
          <p className="text-gray-500 text-sm mt-1">Browse and sign up for upcoming volunteer opportunities.</p>
        </div>
        {user?.role === 'admin' && (
          <button 
            onClick={() => navigate('/shifts/create')}
            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition shadow-sm font-medium flex items-center gap-2"
          >
            + Create Shift
          </button>
        )}
      </div>

      {shifts.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <AlertCircle className="mx-auto h-12 w-12 text-gray-400 mb-3" />
          <h3 className="text-lg font-medium text-gray-900">No shifts available</h3>
          <p className="text-gray-500 mt-1">Check back later for new opportunities.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {shifts.map((shift) => {
            const isFull = shift.registeredCount >= shift.capacity;
            const isRegistered = userRegistrations[shift.id];
            const isPast = new Date(shift.date) < new Date(new Date().setHours(0,0,0,0));

            return (
              <div key={shift.id} className={cn("bg-white rounded-xl shadow-sm border p-6 flex flex-col transition-all hover:shadow-md", 
                isPast ? "border-gray-200 opacity-60" : "border-indigo-100"
              )}>
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-lg font-bold text-gray-900 leading-tight">{shift.title}</h3>
                  {isRegistered && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Joined
                    </span>
                  )}
                  {isFull && !isRegistered && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      Full
                    </span>
                  )}
                </div>
                
                <div className="space-y-2.5 mb-4 text-sm text-gray-600 flex-1 bg-gray-50 p-3 rounded-lg">
                  <div className="flex items-center gap-3">
                    <CalendarIcon className="w-4 h-4 text-indigo-500 shrink-0" />
                    <span className="font-medium">{new Date(shift.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Clock className="w-4 h-4 text-indigo-500 shrink-0" />
                    <span>{shift.startTime} - {shift.endTime}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <MapPin className="w-4 h-4 text-indigo-500 shrink-0" />
                    <span className="truncate">{shift.location}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Users className="w-4 h-4 text-indigo-500 shrink-0" />
                    <div className="flex-1">
                      <div className="flex justify-between mb-1">
                        <span>{shift.registeredCount} / {shift.capacity} Filled</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <div 
                          className={cn("h-1.5 rounded-full", isFull ? "bg-red-500" : "bg-indigo-500")} 
                          style={{ width: `${Math.min((shift.registeredCount / shift.capacity) * 100, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>

                <p className="text-sm text-gray-600 mb-5 line-clamp-2" title={shift.description}>{shift.description}</p>
                
                {user?.role === 'admin' ? (
                  <button className="w-full bg-indigo-50 text-indigo-700 font-medium py-2.5 rounded-md hover:bg-indigo-100 transition border border-indigo-200">
                    Manage Attendees
                  </button>
                ) : (
                  <button 
                    onClick={() => handleSignUp(shift)}
                    disabled={isRegistered || isFull || isPast || actionLoading === shift.id}
                    className={cn(
                      "w-full font-medium py-2.5 rounded-md transition duration-200 shadow-sm",
                      isRegistered 
                        ? "bg-green-50 text-green-700 border border-green-200 cursor-not-allowed" 
                        : isFull || isPast
                          ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                          : "bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    )}
                  >
                    {actionLoading === shift.id ? 'Processing...' : 
                     isRegistered ? 'You are registered' : 
                     isPast ? 'Shift Ended' :
                     isFull ? 'Shift Full' : 
                     'Sign Up for Shift'}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}