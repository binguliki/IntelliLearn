import { useEffect, useState } from "react";
import { useUser } from "../contexts/UserContext";
import { fetchUserNotes } from "../libs/db";
import { Card, CardContent } from "../components/ui/card";
import { Dialog, DialogContent, DialogTitle } from "../components/ui/dialog";
import Navbar from "../components/Navbar";

export default function NotesDashboard() {
  const { user } = useUser();
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedNote, setSelectedNote] = useState(null);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    fetchUserNotes(user.id).then(({ notes, error }) => {
      setNotes(notes || []);
      setError(error);
      setLoading(false);
    });
  }, [user]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-3xl mx-auto w-full pt-24 px-4">
        <h1 className="text-3xl font-bold text-indigo-300 mb-2">Your Notes</h1>
        <hr className="border-gray-700 mb-6" />
        {loading ? (
          <div className="text-gray-300">Loading notes...</div>
        ) : error ? (
          <div className="text-red-400">Failed to load notes.</div>
        ) : notes.length === 0 ? (
          <div className="text-gray-400">No notes found.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {notes.map((note, idx) => (
              <Card
                key={idx}
                className="cursor-pointer hover:border-indigo-400 hover:shadow-lg transition-all duration-150 border border-gray-700 bg-gray-900/80"
                onClick={() => setSelectedNote(note)}
              >
                <CardContent className="p-4">
                  <div className="font-semibold text-indigo-200 mb-1 truncate">{note.title}</div>
                  <div className="text-gray-400 text-xs line-clamp-3 whitespace-pre-line">{note.content}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
        <Dialog open={!!selectedNote} onOpenChange={() => setSelectedNote(null)}>
          <DialogContent className="max-w-2xl w-full">
            <div className="prose prose-invert text-gray-100 text-base whitespace-pre-line mt-2">
              {selectedNote?.content}
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
} 