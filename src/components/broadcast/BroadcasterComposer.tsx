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
  const [category, setCategory] = useState<SignalCategory>('event');
  const [zone, setZone] = useState(CAMPUS_ZONES[0]);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isPortal, setIsPortal] = useState(true);
  const [visibility, setVisibility] = useState<'global' | 'circle'>('global');
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
        isAnonymous,
        visibility
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
               <h3 className="text-xl font-black italic uppercase tracking-tighter mb-1">Select Intent</h3>
               <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">What are you looking for?</p>
            </div>

            <div className="max-h-[400px] overflow-y-auto pr-2 no-scrollbar">
              <div className="grid grid-cols-3 gap-2 pb-4">
                {(Object.entries(SIGNAL_THEMES) as [SignalCategory, any][]).map(([id, theme]) => (
                  <button
                    key={id}
                    onClick={() => { setCategory(id); handleNext(); }}
                    className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all active:scale-95 text-center gap-1.5 min-h-[90px] ${
                      category === id ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20' : 'bg-black/40 border-white/5 text-zinc-400 hover:border-white/10'
                    }`}
                  >
                    <span className="text-xl">{theme.icon}</span>
                    <p className="text-[8px] font-black uppercase tracking-tighter leading-tight">{theme.label}</p>
                  </button>
                ))}
              </div>
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
                  <h3 className="text-xl font-black italic uppercase tracking-tighter mb-1">Compose Pulse</h3>
                  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Target your audience</p>
               </div>
               <button onClick={handleBack} className="text-[10px] font-black text-primary uppercase">Back</button>
            </div>

            <div className="space-y-4">
              {/* Visibility Toggle */}
              <div className="flex p-1 bg-zinc-900/80 rounded-2xl border border-white/5">
                <button 
                  onClick={() => setVisibility('global')}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${visibility === 'global' ? 'bg-white text-black shadow-xl' : 'text-zinc-500'}`}
                >
                  <Globe size={14} /> Global Feed
                </button>
                <button 
                  onClick={() => setVisibility('circle')}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${visibility === 'circle' ? 'bg-primary text-white shadow-xl' : 'text-zinc-500'}`}
                >
                  <Lock size={14} /> Circle Only
                </button>
              </div>

              <textarea 
                value={content}
                onChange={e => setContent(e.target.value)}
                placeholder="What's the situation?"
                className="w-full h-40 bg-zinc-900/80 border border-white/10 rounded-[2rem] p-6 text-sm font-medium focus:ring-2 focus:ring-primary outline-none resize-none italic"
              />
            </div>

            <Button onClick={handleNext} disabled={!content.trim()} className="w-full h-14 bg-white text-black font-black uppercase tracking-widest text-xs rounded-2xl shadow-2xl">
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
                  <h3 className="text-xl font-black italic uppercase tracking-tighter mb-1">Signal Protocol</h3>
                  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Final configurations</p>
               </div>
               <button onClick={handleBack} className="text-[10px] font-black text-primary uppercase">Back</button>
            </div>

            <div className="space-y-4">
               {/* Zone Picker */}
               <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-500 uppercase flex items-center gap-2 px-1">
                    <MapPin size={10} /> Pinpoint Location
                  </label>
                  <div className="max-h-[160px] overflow-y-auto pr-1 no-scrollbar border border-white/5 rounded-2xl bg-black/20 p-2">
                    <div className="grid grid-cols-2 gap-2">
                       {CAMPUS_ZONES.map(z => (
                         <button 
                           key={z} 
                           onClick={() => setZone(z)}
                           className={`px-3 py-2.5 rounded-xl border text-[9px] font-black uppercase transition-all text-left truncate ${
                             zone === z ? 'bg-primary border-primary text-white shadow-lg' : 'bg-white/5 border-white/5 text-zinc-500'
                           }`}
                         >
                           {z}
                         </button>
                       ))}
                    </div>
                  </div>
               </div>

               <div className="space-y-3">
                  {/* Anonymous Toggle */}
                  <div className="flex items-center justify-between p-4 bg-zinc-900/50 rounded-2xl border border-white/5">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${isAnonymous ? 'bg-primary/20 text-primary' : 'bg-zinc-800 text-zinc-400'}`}>
                        <Ghost size={16} />
                      </div>
                      <div>
                        <p className="text-xs font-black text-zinc-200 uppercase tracking-tighter">Ghost Mode</p>
                        <p className="text-[9px] text-zinc-500 font-bold">Post anonymously to campus</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setIsAnonymous(!isAnonymous)}
                      className={`w-10 h-5 rounded-full p-1 transition-colors ${isAnonymous ? 'bg-primary' : 'bg-zinc-800'}`}
                    >
                      <div className={`w-3 h-3 rounded-full bg-white transition-transform ${isAnonymous ? 'translate-x-5' : 'translate-x-0'}`} />
                    </button>
                  </div>

                  {/* Portal Toggle */}
                  <div className="flex items-center justify-between p-4 bg-zinc-900/50 rounded-2xl border border-white/5">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${isPortal ? 'bg-primary/20 text-primary' : 'bg-zinc-800 text-zinc-400'}`}>
                        <MessageSquare size={16} />
                      </div>
                      <div>
                        <p className="text-xs font-black text-zinc-200 uppercase tracking-tighter">Mini-Portal</p>
                        <p className="text-[9px] text-zinc-500 font-bold">Open a temporary chat lobby</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setIsPortal(!isPortal)}
                      className={`w-10 h-5 rounded-full p-1 transition-colors ${isPortal ? 'bg-primary' : 'bg-zinc-800'}`}
                    >
                      <div className={`w-3 h-3 rounded-full bg-white transition-transform ${isPortal ? 'translate-x-5' : 'translate-x-0'}`} />
                    </button>
                  </div>
               </div>

               <div className="flex items-center justify-between px-2 pt-2">
                  <span className="text-[10px] font-black text-zinc-500 uppercase flex items-center gap-2">
                     <Clock size={12} /> Lifespan
                  </span>
                  <div className="flex flex-wrap gap-2 justify-end flex-1">
                     {[1, 2, 4, 6, 12, 24, 48].map(h => (
                       <button 
                         key={h} 
                         onClick={() => setDuration(h)}
                         className={`h-7 px-3 rounded-lg text-[9px] font-black transition-all ${
                           duration === h ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-white/5 text-zinc-500 border border-white/5'
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
              disabled={isSubmitting}
              className="w-full h-14 bg-primary text-white font-black uppercase tracking-[0.2em] text-xs rounded-[2rem] shadow-2xl shadow-primary/40"
            >
              {isSubmitting ? 'Transmitting...' : 'Ignite Broadcast'}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
