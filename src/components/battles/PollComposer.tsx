import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  X, ChevronRight, Trophy, Zap, 
  Smile, Coffee, MapPin, Sparkles, Plus
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface PollComposerProps {
  onClose: () => void;
  onPost: (data: any) => Promise<any>;
}

export const PollComposer: React.FC<PollComposerProps> = ({ onClose, onPost }) => {
  const [title, setTitle] = useState('');
  const [leftName, setLeftName] = useState('');
  const [leftIcon, setLeftIcon] = useState('☕');
  const [rightName, setRightName] = useState('');
  const [rightIcon, setRightIcon] = useState('🥤');
  const [category, setCategory] = useState('Lifestyle');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!title || !leftName || !rightName) return;
    setIsSubmitting(true);
    try {
      await onPost({
        title,
        leftName,
        leftIcon,
        rightName,
        rightIcon,
        category
      });
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 p-1">
      <div>
         <h3 className="text-xl font-black italic uppercase tracking-tighter mb-1">Ignite a Debate</h3>
         <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest leading-relaxed">
           Settle the biggest campus mysteries (Costs 100 UniCoins)
         </p>
      </div>

      <div className="space-y-4">
         <div className="space-y-2">
            <label className="text-[10px] font-black text-zinc-500 uppercase px-1">Debate Title</label>
            <input 
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g., The Ultimate DIU Wakeup"
              className="w-full bg-zinc-900 border border-white/5 rounded-2xl px-5 py-4 text-xs font-medium focus:ring-1 focus:ring-primary outline-none italic"
            />
         </div>

         <div className="grid grid-cols-2 gap-4">
            {/* Option A */}
            <div className="space-y-2">
               <label className="text-[10px] font-black text-amber-500 uppercase px-1">Option A</label>
               <div className="space-y-2">
                  <input 
                    type="text"
                    value={leftName}
                    onChange={e => setLeftName(e.target.value)}
                    placeholder="Chai"
                    className="w-full bg-zinc-900 border border-white/5 rounded-2xl px-4 py-3 text-[10px] font-black uppercase outline-none"
                  />
                  <div className="flex gap-1 overflow-x-auto no-scrollbar py-1">
                    {['☕', '🍔', '🦉', '🏔️', '🎮', '💻'].map(icon => (
                      <button 
                        key={icon} 
                        onClick={() => setLeftIcon(icon)}
                        className={`text-xl p-2 rounded-xl border transition-all ${leftIcon === icon ? 'bg-amber-500/20 border-amber-500' : 'bg-black/40 border-white/5 opacity-50'}`}
                      >
                        {icon}
                      </button>
                    ))}
                  </div>
               </div>
            </div>

            {/* Option B */}
            <div className="space-y-2">
               <label className="text-[10px] font-black text-blue-500 uppercase px-1">Option B</label>
               <div className="space-y-2">
                  <input 
                    type="text"
                    value={rightName}
                    onChange={e => setRightName(e.target.value)}
                    placeholder="Coffee"
                    className="w-full bg-zinc-900 border border-white/5 rounded-2xl px-4 py-3 text-[10px] font-black uppercase outline-none"
                  />
                  <div className="flex gap-1 overflow-x-auto no-scrollbar py-1">
                    {['🥤', '🍕', '🌅', '🌊', '⚽', '📚'].map(icon => (
                      <button 
                        key={icon} 
                        onClick={() => setRightIcon(icon)}
                        className={`text-xl p-2 rounded-xl border transition-all ${rightIcon === icon ? 'bg-blue-500/20 border-blue-500' : 'bg-black/40 border-white/5 opacity-50'}`}
                      >
                        {icon}
                      </button>
                    ))}
                  </div>
               </div>
            </div>
         </div>

         <div className="space-y-2 pt-2">
            <label className="text-[10px] font-black text-zinc-500 uppercase px-1">Category</label>
            <div className="flex gap-2 flex-wrap">
               {['Lifestyle', 'Food', 'Nature', 'Study', 'Tech'].map(cat => (
                 <button 
                   key={cat} 
                   onClick={() => setCategory(cat)}
                   className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${category === cat ? 'bg-primary text-white shadow-lg' : 'bg-white/5 text-zinc-500 border border-white/5'}`}
                 >
                   {cat}
                 </button>
               ))}
            </div>
         </div>
      </div>

      <div className="pt-4">
         <Button 
           onClick={handleSubmit} 
           disabled={!title || !leftName || !rightName || isSubmitting}
           className="w-full h-16 bg-primary text-white font-black uppercase tracking-[0.2em] text-[10px] rounded-[2rem] shadow-xl shadow-primary/20 flex items-center justify-center gap-2"
         >
           <Zap size={16} className="fill-white" /> {isSubmitting ? 'Igniting Debate...' : 'Launch Poll Arena'}
         </Button>
      </div>
    </div>
  );
};
