import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Sparkles, Shield, EyeOff, MessageCircle, Zap, Globe, Users } from 'lucide-react';

const About = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#020202] text-white selection:bg-primary selection:text-white pb-20">
      {/* Editorial Header */}
      <div className="sticky top-0 z-50 bg-[#020202]/80 backdrop-blur-xl border-b border-white/[0.03] px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <button 
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-zinc-500 hover:text-white transition-colors group"
          >
            <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
            <span className="text-[10px] font-black uppercase tracking-widest">Back to Nexus</span>
          </button>
          <div className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-700">
            Internal Memo // Manifesto
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 pt-20">
        {/* Hero Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-32"
        >
          <div className="h-24 w-24 mx-auto bg-gradient-to-tr from-primary to-rose-400 rounded-[2.5rem] flex items-center justify-center shadow-2xl shadow-primary/30 rotate-6 mb-12 relative">
            <Sparkles size={48} className="text-white" />
            <div className="absolute -top-2 -right-2 h-8 w-8 bg-black rounded-full border border-white/10 flex items-center justify-center text-[10px] font-black text-white">v3</div>
          </div>
          <h1 className="text-7xl md:text-9xl font-black italic uppercase tracking-tighter leading-none mb-6">
            UniVibe
          </h1>
          <p className="text-xs md:text-sm font-black uppercase tracking-[0.6em] text-primary mb-12">
            The Student Synergy Network
          </p>
          <div className="max-w-2xl mx-auto">
            <p className="text-lg md:text-xl text-zinc-400 font-medium leading-relaxed italic">
              "In a digital landscape drowned in noise, we help you find the frequency that matters. UniVibe is more than an app; it's a closed-circuit ecosystem designed for the next generation of campus leaders."
            </p>
          </div>
        </motion.div>

        {/* Pillars Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-40">
          {[
            { 
              icon: EyeOff, 
              title: 'Zero Vanity', 
              desc: 'No follower counts. No public likes. We replaced vanity metrics with genuine Pulse signals and Arena status.' 
            },
            { 
              icon: Shield, 
              title: 'Privacy First', 
              desc: 'Ghost Mode and Locked Identities ensure you control your presence. Verified entry keeps outsiders out.' 
            },
            { 
              icon: Zap, 
              title: 'High Velocity', 
              desc: 'Real-time Signal Portals and Ignite requests allow for spontaneous campus interactions.' 
            }
          ].map((pillar, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * i }}
              className="p-8 rounded-[2rem] bg-zinc-900/30 border border-white/[0.03] hover:bg-zinc-900/50 transition-all group"
            >
              <div className="h-12 w-12 rounded-2xl bg-zinc-800 flex items-center justify-center text-zinc-500 group-hover:text-primary transition-colors mb-6">
                <pillar.icon size={24} />
              </div>
              <h3 className="text-xl font-black uppercase tracking-tighter mb-3 italic">{pillar.title}</h3>
              <p className="text-sm text-zinc-500 leading-relaxed font-medium">{pillar.desc}</p>
            </motion.div>
          ))}
        </div>

        {/* Story Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-20 items-center mb-40">
          <div className="space-y-8">
            <h2 className="text-4xl font-black uppercase tracking-tighter italic leading-none">
              Built for <span className="text-primary">Synergy</span>, not Scrolling.
            </h2>
            <div className="space-y-6 text-zinc-400 text-sm leading-relaxed font-medium">
              <p>
                UniVibe was conceived at the intersection of student life and modern technology. We realized that while campus connectivity was increasing, genuine interaction was declining.
              </p>
              <p>
                Traditional social media encourages passive consumption. UniVibe encourages **active participation**. Whether it's igniting a signal for a study session or joining an arena battle, every interaction is designed to move you closer to your peers.
              </p>
              <p>
                We operate on a **Closed Loop** philosophy. By restricting access to verified @diu.edu.bd domains, we've created a safe haven where students can be themselves without the pressure of the global web.
              </p>
            </div>
            <div className="flex items-center gap-4 pt-4">
              <div className="flex -space-x-3">
                 {[1,2,3,4].map(i => (
                   <div key={i} className="h-10 w-10 rounded-full border-2 border-black bg-zinc-800" />
                 ))}
              </div>
              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Joined by 1,000+ DIU Students</p>
            </div>
          </div>
          <div className="relative aspect-square">
             <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-secondary/20 rounded-[3rem] rotate-3 blur-2xl" />
             <div className="relative h-full w-full bg-zinc-900/80 border border-white/5 rounded-[3rem] overflow-hidden flex items-center justify-center p-12">
                <div className="text-center space-y-4">
                   <Users size={64} className="text-primary mx-auto mb-6" />
                   <div className="h-1 w-20 bg-primary mx-auto" />
                   <p className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-500">Operational Capacity</p>
                   <p className="text-4xl font-black italic uppercase tracking-tighter">100% DIU</p>
                </div>
             </div>
          </div>
        </div>

        {/* Tech Stack / Info */}
        <div className="border-t border-white/5 pt-20 text-center">
           <Globe size={32} className="text-zinc-800 mx-auto mb-8" />
           <h3 className="text-[10px] font-black uppercase tracking-[0.5em] text-zinc-600 mb-4">Frequency Intel</h3>
           <div className="flex flex-wrap justify-center gap-10 text-zinc-500 text-[10px] font-black uppercase tracking-widest">
              <span>Cloud Firestore Nexus</span>
              <span>•</span>
              <span>End-to-End Encryption</span>
              <span>•</span>
              <span>Zero-Bot Verified Layer</span>
           </div>
        </div>
      </div>
    </div>
  );
};

export default About;
