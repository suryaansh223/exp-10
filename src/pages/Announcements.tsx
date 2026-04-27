import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { collection, query, orderBy, onSnapshot, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Megaphone, MessageSquare, Clock } from 'lucide-react';

interface Announcement {
  id: string;
  title: string;
  message: string;
  postedAt: any;
  authorName: string;
}

export default function Announcements() {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form state
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'announcements'), orderBy('postedAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Announcement[];
      setAnnouncements(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) return;
    
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'announcements'), {
        title,
        message,
        postedAt: Timestamp.now(),
        authorName: user?.firstName ? `${user.firstName} ${user.lastName || ''}` : user?.email?.split('@')[0] || 'Admin',
        authorId: user?.uid,
      });
      setTitle('');
      setMessage('');
    } catch (error) {
      console.error("Error posting announcement:", error);
      alert("Failed to post announcement.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Announcements</h1>
        <p className="text-gray-500 text-sm mt-1">Stay updated with the latest news and urgent requirements.</p>
      </div>

      {user?.role === 'admin' && (
        <div className="bg-white rounded-xl shadow-sm border border-indigo-100 p-6">
          <div className="flex items-center gap-2 mb-4 text-indigo-900">
            <Megaphone className="w-5 h-5" />
            <h2 className="text-lg font-semibold">Post New Announcement</h2>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <input
                required
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Announcement Title"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div>
              <textarea
                required
                rows={3}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="What do you want to tell the volunteers?"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700 transition shadow-sm font-medium disabled:opacity-50"
              >
                {isSubmitting ? 'Posting...' : 'Post Announcement'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-8 text-gray-500">Loading announcements...</div>
        ) : announcements.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
            <MessageSquare className="mx-auto h-12 w-12 text-gray-300 mb-3" />
            <p className="text-gray-500 font-medium">No announcements yet.</p>
          </div>
        ) : (
          announcements.map((announcement) => (
            <div key={announcement.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-xl font-bold text-gray-900">{announcement.title}</h3>
                <span className="inline-flex items-center text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-md">
                  <Clock className="w-3 h-3 mr-1" />
                  {announcement.postedAt?.toDate ? announcement.postedAt.toDate().toLocaleDateString() : 'Just now'}
                </span>
              </div>
              <p className="text-gray-700 whitespace-pre-wrap mt-3">{announcement.message}</p>
              <div className="mt-4 pt-4 border-t border-gray-50 flex items-center text-sm text-gray-500">
                <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center mr-2 font-bold text-xs">
                  {announcement.authorName.charAt(0).toUpperCase()}
                </div>
                Posted by {announcement.authorName}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}