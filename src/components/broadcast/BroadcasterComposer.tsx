import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, ChevronRight, Globe, Lock, 
  MapPin, Clock, Zap, Ghost, MessageSquare
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { SIGNAL_THEMES, CAMPUS_ZONES, SignalCategory } from '@/hooks/useBroadcasts';

interface BroadcasterComposerProps {
  onClose: () => void;
  onPost: (data: any) => Promise<void>;
}

export const BroadcasterComposer: React.FC<BroadcasterComposerProps> = ({ onClose, onPost }) => {
  const [step, setStep] = useState(1);
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<SignalCategory>('broadcast');
  const [zone, setZone] = useState(CAMPUS_ZONES[0]);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isPortal, setIsPortal] = useState(true);
  const [duration, setDuration] = useState(2); // hours
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleNext = () => setStep(s => s + 1);
  const handleBack = () => setStep(s => s - 1);

  const handleSubmit = async () => {
    if (!content.trim()) return;
    setIsSubmitting(true);
    try {
      await onPost({
        content,
        category,
        zone,
        durationHours: duration,
        isPortal,
        isAnonymous
      });
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-1">
      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div 
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div>
               <h3 className="text-xl font-black italic uppercase tracking-tighter mb-1">Select Signal Theme</h3>
               <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">How does your energy feel?</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {(Object.entries(SIGNAL_THEMES) as [SignalCategory, any][]).map(([id, theme]) => (
                <button
                  key={id}
                  onClick={() => { setCategory(id); handleNext(); }}
                  className={`flex flex-col items-center justify-center p-6 rounded-3xl border transition-all active:scale-95 ${
                    category === id ? 'bg-primary border-primary text-white' : 'bg-black/40 border-white/5 text-zinc-400 hover:border-white/10'
                  }`}
                >
                  <span className="text-3xl mb-2">{theme.icon}</span>
                  <span className="text-[10px] font-black uppercase tracking-widest">{theme.label}</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div 
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between">
               <div>
                  <h3 className="text-xl font-black italic uppercase tracking-tighter mb-1">Refine Signal</h3>
                  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Where & Who?</p>
               </div>
               <button onClick={handleBack} className="text-[10px] font-black text-primary uppercase">Back</button>
            </div>

            <div className="space-y-4">
               {/* Zone Picker */}
               <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-500 uppercase flex items-center gap-2 px-1">
                    <MapPin size={10} /> Campus Zone
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                     {CAMPUS_ZONES.map(z => (
                       <button 
                         key={z} 
                         onClick={() => setZone(z)}
                         className={`px-3 py-2.5 rounded-xl border text-[10px] font-black uppercase transition-all ${
                           zone === z ? 'bg-primary border-primary text-white' : 'bg-white/5 border-white/5 text-zinc-400'
                         }`}
                       >
                         {z}
                       </button>
                     ))}
                  </div>
               </div>

               {/* Anonymous Toggle */}
               <div className="flex items-center justify-between p-4 bg-zinc-900/50 rounded-2xl border border-white/5">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${isAnonymous ? 'bg-zinc-800 text-zinc-200' : 'bg-zinc-100 text-zinc-900'}`}>
                       <Ghost size={16} />
                    </div>
                    <div>
                       <p className="text-xs font-black text-zinc-200">Ghost Mode</p>
                       <p className="text-[10px] text-zinc-500">Post anonymously</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setIsAnonymous(!isAnonymous)}
                    className={`w-12 h-6 rounded-full p-1 transition-colors ${isAnonymous ? 'bg-primary' : 'bg-zinc-800'}`}
                  >
                     <div className={`w-4 h-4 rounded-full bg-white transition-transform ${isAnonymous ? 'translate-x-6' : 'translate-x-0'}`} />
                  </button>
               </div>

               {/* Portal Toggle */}
               <div className="flex items-center justify-between p-4 bg-zinc-900/50 rounded-2xl border border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-zinc-800 text-primary">
                       <MessageSquare size={16} />
                    </div>
                    <div>
                       <p className="text-xs font-black text-zinc-200">Mini-Portal</p>
                       <p className="text-[10px] text-zinc-500">Create a temporary chat lobby</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setIsPortal(!isPortal)}
                    className={`w-12 h-6 rounded-full p-1 transition-colors ${isPortal ? 'bg-primary' : 'bg-zinc-800'}`}
                  >
                     <div className={`w-4 h-4 rounded-full bg-white transition-transform ${isPortal ? 'translate-x-6' : 'translate-x-0'}`} />
                  </button>
               </div>
            </div>

            <Button onClick={handleNext} className="w-full h-14 bg-white text-black font-black uppercase tracking-widest text-xs rounded-2xl">
              Next Step <ChevronRight size={16} className="ml-2" />
            </Button>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div 
            key="step3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between">
               <div>
                  <h3 className="text-xl font-black italic uppercase tracking-tighter mb-1">Broadcast Hub</h3>
                  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Write your campus signal</p>
               </div>
               <button onClick={handleBack} className="text-[10px] font-black text-primary uppercase">Back</button>
            </div>

            <div className="space-y-4">
              <textarea 
                value={content}
                onChange={e => setContent(e.target.value)}
                placeholder="What's the vibe? (e.g., Playing FIFA at AB4 Lobby, join us!)"
                className="w-full h-40 bg-zinc-900/80 border border-white/10 rounded-[2.5rem] p-6 text-sm font-medium focus:ring-2 focus:ring-primary outline-none resize-none italic"
              />

              <div className="flex items-center justify-between px-4">
                 <span className="text-[10px] font-black text-zinc-500 uppercase flex items-center gap-2">
                    <Clock size={12} /> Duration
                 </span>
                 <div className="flex gap-2">
                    {[1, 2, 4].map(h => (
                      <button 
                        key={h} 
                        onClick={() => setDuration(h)}
                        className={`h-8 px-4 rounded-lg text-[10px] font-black transition-all ${
                          duration === h ? 'bg-primary text-white' : 'bg-white/5 text-zinc-500'
                        }`}
                      >
                        {h}h
                      </button>
                    ))}
                 </div>
              </div>
            </div>

            <Button 
              onClick={handleSubmit} 
              disabled={!content.trim() || isSubmitting}
              className="w-full h-14 bg-primary text-white font-black uppercase tracking-[0.2em] text-xs rounded-[2rem] shadow-2xl shadow-primary/30"
            >
              {isSubmitting ? 'Igniting Signal...' : 'Transmit Broadcast'}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
