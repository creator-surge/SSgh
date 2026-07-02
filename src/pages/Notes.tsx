import React, { useEffect, useState } from 'react';
import { getNotes, createNote, deleteNote, resetNotes } from '../lib/api';
import { SupabaseNote } from '../types';
import { toast } from 'sonner';
import { motion } from 'motion/react';
import { Database, Plus, Trash2, RefreshCw, Terminal, CheckCircle2, ShieldCheck, Code, Eye, FileText, Send, Sparkles } from 'lucide-react';

export default function Notes() {
  const [notes, setNotes] = useState<SupabaseNote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newTitle, setNewTitle] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<'client' | 'sql' | 'nextjs'>('client');
  const [sqlExecuted, setSqlExecuted] = useState(true);

  const fetchNotesList = async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const data = await getNotes();
      setNotes(data);
    } catch (err: any) {
      toast.error(err.message || "Failed to load Supabase notes.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotesList();
  }, []);

  const handleCreateNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      return toast.error("Note description cannot be blank.");
    }

    setIsSubmitting(true);
    try {
      const added = await createNote(newTitle);
      setNotes(prev => [...prev, added]);
      setNewTitle('');
      toast.success("Successfully inserted new row into Supabase public.notes table!");
    } catch (err: any) {
      toast.error(err.message || "Failed to submit note.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteNote = async (id: number) => {
    try {
      await deleteNote(id);
      setNotes(prev => prev.filter(n => n.id !== id));
      toast.success(`Removed row ID #${id} from notes table.`);
    } catch (err: any) {
      toast.error(err.message || "Failed to delete note.");
    }
  };

  const handleResetNotes = async () => {
    try {
      toast.loading("Re-running migration & seeding database schema...", { id: "reset-notes" });
      const res = await resetNotes();
      setNotes(res.notes);
      setSqlExecuted(true);
      toast.success("Supabase SQL seeding ran successfully! Restored 3 initial rows.", { id: "reset-notes" });
    } catch (err: any) {
      toast.error(err.message || "Failed to reset notes database.", { id: "reset-notes" });
    }
  };

  const handleSimulateSql = () => {
    toast.success("SQL statements compiled and executed with exit code 0.");
    handleResetNotes();
  };

  const sqlCode = `-- Create the table
create table notes (
  id bigint primary key generated always as identity,
  title text not null
);

-- Insert some sample data into the table
insert into notes (title)
values
  ('Today I created a Supabase project.'),
  ('I added some data and queried it from Next.js.'),
  ('It was awesome!');

alter table notes enable row level security;

create policy "public can read notes"
on public.notes
for select to anon
using (true);`;

  const nextJsCode = `// app/notes/page.tsx
import { createClient } from '@/utils/supabase/server';

export default async function Notes() {
  const supabase = await createClient();
  const { data: notes } = await supabase.from("notes").select();

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-4">
      <h1 className="text-2xl font-bold font-mono">Supabase Notes</h1>
      <pre className="p-4 rounded-xl bg-black/40 border border-white/5 text-xs text-orange-400 font-mono">
        {JSON.stringify(notes, null, 2)}
      </pre>
    </div>
  );
}`;

  return (
    <div className="space-y-8 font-sans">
      
      {/* Header Info Block */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-white/5 pb-6 gap-4">
        <div>
          <div className="flex items-center space-x-2 text-[10px] font-mono font-black uppercase text-orange-400 tracking-widest">
            <Database className="h-4 w-4 shrink-0 animate-pulse text-orange-500" />
            <span>SUPABASE PERSISTENCE CONSOLE</span>
          </div>
          <h1 className="text-2xl font-bold font-mono tracking-tight mt-1 text-white">
            Supabase Database & <span className="text-orange-400">Notes Table</span>
          </h1>
          <p className="text-xs text-white/40 font-mono mt-1">
            Interact with the secure, atomic Supabase cloud-simulated ledger. View, insert and query database rows.
          </p>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <button
            onClick={() => fetchNotesList(false)}
            className="flex items-center space-x-2 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 px-4 py-2.5 font-mono text-xs font-bold transition-all text-white/80"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin text-orange-400' : ''}`} />
            <span>FETCH CLIENT</span>
          </button>
          
          <button
            onClick={handleResetNotes}
            className="flex items-center space-x-2 rounded-xl bg-orange-500 hover:bg-orange-600 px-4 py-2.5 font-mono text-xs font-black transition-all text-black shadow-[0_0_20px_rgba(249,115,22,0.25)]"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>RESET DATABASE</span>
          </button>
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="flex border-b border-white/5 p-1 bg-black/40 rounded-xl space-x-1">
        <button
          onClick={() => setActiveTab('client')}
          className={`flex-1 flex items-center justify-center space-x-2 py-3 rounded-lg text-xs font-mono font-bold transition-all ${
            activeTab === 'client' 
              ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' 
              : 'text-white/40 hover:text-white hover:bg-white/5'
          }`}
        >
          <Eye className="h-4 w-4" />
          <span>Interactive Client View</span>
        </button>

        <button
          onClick={() => setActiveTab('sql')}
          className={`flex-1 flex items-center justify-center space-x-2 py-3 rounded-lg text-xs font-mono font-bold transition-all ${
            activeTab === 'sql' 
              ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' 
              : 'text-white/40 hover:text-white hover:bg-white/5'
          }`}
        >
          <Terminal className="h-4 w-4" />
          <span>SQL Schema & migrations</span>
        </button>

        <button
          onClick={() => setActiveTab('nextjs')}
          className={`flex-1 flex items-center justify-center space-x-2 py-3 rounded-lg text-xs font-mono font-bold transition-all ${
            activeTab === 'nextjs' 
              ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' 
              : 'text-white/40 hover:text-white hover:bg-white/5'
          }`}
        >
          <Code className="h-4 w-4" />
          <span>Next.js App Integration</span>
        </button>
      </div>

      {/* Main Tabs Workspace Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Interactive State Display */}
        <div className="lg:col-span-2 space-y-6">
          
          {activeTab === 'client' && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Insert Form */}
              <div className="rounded-2xl border border-white/5 bg-black/20 p-6 space-y-4 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <Database className="h-24 w-24 text-orange-400" />
                </div>
                
                <div>
                  <h3 className="font-mono text-sm font-black text-white flex items-center space-x-2">
                    <Plus className="h-4 w-4 text-orange-400" />
                    <span>INSERT NEW NOTES ROW</span>
                  </h3>
                  <p className="text-xs text-white/40 font-mono mt-1">
                    Adds a row in the Supabase <strong className="text-white/70">public.notes</strong> table atomically.
                  </p>
                </div>

                <form onSubmit={handleCreateNote} className="flex space-x-2">
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="Enter a new note title (e.g., Connected Supabase client to React!)..."
                    className="flex-1 bg-black/40 border border-white/5 rounded-xl px-4 py-3 font-mono text-xs text-white placeholder-white/20 focus:outline-none focus:border-orange-500/50"
                    disabled={isSubmitting}
                  />
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex items-center space-x-2 rounded-xl bg-orange-500 hover:bg-orange-600 px-6 py-3 font-mono text-xs font-black transition-all text-black disabled:opacity-50"
                  >
                    {isSubmitting ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                    <span>INSERT</span>
                  </button>
                </form>
              </div>

              {/* Notes List view */}
              <div className="rounded-2xl border border-white/5 bg-black/20 p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-white/5 pb-3">
                  <h3 className="font-mono text-sm font-black text-white flex items-center space-x-2">
                    <FileText className="h-4 w-4 text-orange-400" />
                    <span>QUERY: SELECT * FROM NOTES;</span>
                  </h3>
                  <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-mono text-emerald-400">
                    <CheckCircle2 className="h-3 w-3" />
                    <span>PUBLICLY READABLE (RLS ACTIVE)</span>
                  </div>
                </div>

                {isLoading ? (
                  <div className="py-12 flex flex-col items-center justify-center space-y-3">
                    <RefreshCw className="h-8 w-8 animate-spin text-orange-500" />
                    <span className="font-mono text-xs text-white/40">Executing query, fetching data from ledger...</span>
                  </div>
                ) : notes.length === 0 ? (
                  <div className="py-12 text-center space-y-3">
                    <p className="font-mono text-xs text-white/40">The notes table is empty. Insert a row or reset the database!</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {notes.map((note) => (
                      <div 
                        key={note.id}
                        className="flex items-start justify-between p-4 rounded-xl border border-white/5 bg-white/5 hover:border-white/10 transition-all"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <span className="font-mono text-[10px] font-black text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded-md">
                              ID: #{note.id}
                            </span>
                            <span className="font-mono text-[9px] text-white/30">
                              {new Date(note.created_at).toLocaleString()}
                            </span>
                          </div>
                          <p className="font-mono text-xs text-white/80 leading-relaxed pt-1">
                            {note.title}
                          </p>
                        </div>

                        <button
                          onClick={() => handleDeleteNote(note.id)}
                          className="text-white/20 hover:text-red-400 p-1.5 rounded-lg hover:bg-white/5 transition-all"
                          title="Delete note row"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'sql' && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="rounded-2xl border border-white/5 bg-black/20 p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-white/5 pb-3">
                  <h3 className="font-mono text-sm font-black text-white flex items-center space-x-2">
                    <Terminal className="h-4 w-4 text-orange-400" />
                    <span>SQL EDITOR & SEEDING SCRIPT</span>
                  </h3>
                  <button
                    onClick={handleSimulateSql}
                    className="flex items-center space-x-2 rounded-lg bg-orange-500 hover:bg-orange-600 px-3 py-1.5 font-mono text-[10px] font-black transition-all text-black"
                  >
                    <span>RUN SQL QUERY</span>
                  </button>
                </div>

                <p className="text-xs text-white/40 font-mono leading-relaxed">
                  The script below configures the relational table, inserts sample rows, and enables Row Level Security (RLS) to permit safe public selection queries.
                </p>

                <div className="relative rounded-xl border border-white/5 bg-black/40 p-4 overflow-x-auto font-mono text-[11px] text-white/80 leading-relaxed">
                  <pre>{sqlCode}</pre>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'nextjs' && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="rounded-2xl border border-white/5 bg-black/20 p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-white/5 pb-3">
                  <h3 className="font-mono text-sm font-black text-white flex items-center space-x-2">
                    <Code className="h-4 w-4 text-orange-400" />
                    <span>Next.js App Integration</span>
                  </h3>
                  <div className="px-2 py-0.5 rounded bg-orange-500/10 text-orange-400 font-mono text-[9px]">
                    TEMPLATE EXAMPLE
                  </div>
                </div>

                <p className="text-xs text-white/40 font-mono leading-relaxed">
                  Implement server-side components in Next.js to pull live rows directly from your configured Supabase table structure.
                </p>

                <div className="relative rounded-xl border border-white/5 bg-black/40 p-4 overflow-x-auto font-mono text-[11px] text-white/80 leading-relaxed">
                  <pre>{nextJsCode}</pre>
                </div>
              </div>
            </motion.div>
          )}

        </div>

        {/* Right Column: Information panel / RLS & Sandbox settings */}
        <div className="space-y-6">
          
          <div className="rounded-2xl border border-white/5 bg-black/20 p-6 space-y-4">
            <h3 className="font-mono text-xs font-black text-white uppercase tracking-wider flex items-center space-x-2">
              <ShieldCheck className="h-4 w-4 text-orange-400 animate-pulse" />
              <span>SECURITY & RLS POLICIES</span>
            </h3>
            
            <div className="space-y-4 font-mono text-xs">
              <div className="space-y-1">
                <span className="block text-white/80 font-bold">Row Level Security (RLS)</span>
                <p className="text-white/40 leading-relaxed text-[11px]">
                  Configuring <strong className="text-white/60">alter table notes enable row level security;</strong> guarantees that any client queries are rejected by default unless specific read/write access policies are granted.
                </p>
              </div>

              <div className="space-y-1 border-t border-white/5 pt-3">
                <span className="block text-white/80 font-bold">Selective Anon Selects</span>
                <p className="text-white/40 leading-relaxed text-[11px]">
                  The policy <strong className="text-white/60">"public can read notes"</strong> explicitly allows unauthenticated users (anon key clients) to execute selection searches safely.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/5 bg-black/20 p-6 space-y-4">
            <h3 className="font-mono text-xs font-black text-white uppercase tracking-wider flex items-center space-x-2">
              <Sparkles className="h-4 w-4 text-orange-400" />
              <span>SIMULATOR METRICS</span>
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl border border-white/5 bg-white/5 text-center">
                <span className="block text-[10px] font-mono text-white/40 uppercase">Total Rows</span>
                <span className="block text-xl font-mono font-black text-white mt-1">{notes.length}</span>
              </div>

              <div className="p-3 rounded-xl border border-white/5 bg-white/5 text-center">
                <span className="block text-[10px] font-mono text-white/40 uppercase">RLS Status</span>
                <span className="block text-xs font-mono font-black text-emerald-400 mt-2">ACTIVE</span>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
