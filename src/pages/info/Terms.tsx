import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, Shield, Lock, AlertTriangle, 
  CheckCircle, Zap, Info, FileText, Scale
} from 'lucide-react';
import { motion } from 'framer-motion';

const Terms = () => {
  const navigate = useNavigate();

  const sections = [
    {
      icon: CheckCircle,
      title: '01. Verified Entry & Domain Control',
      content: 'UniVibe is a closed-circuit network strictly reserved for students of Daffodil International University. Access requires a verified @diu.edu.bd email address. This protocol ensures community integrity and prevents outsider intrusion, automated spam, and external harassment.'
    },
    {
      icon: Shield,
      title: '02. Data Governance & Privacy',
      content: 'Your data is yours. All private communications are end-to-end encrypted. We do not sell user data to third-party advertisers. Personal contact information remains hidden unless a serious violation of campus safety is reported and verified by the governance board.'
    },
    {
      icon: AlertTriangle,
      title: '03. Zero Tolerance Code (Safety First)',
      list: [
        'No targeted harassment, bullying, or digital aggression.',
        'No NSFW, explicit, or 18+ content allowed on public signals.',
        'No hate speech or discrimination based on department, gender, or belief.',
        'No solicitation, commercial fraud, or impersonation of faculty.',
        'Violations result in immediate Signal Termination (Permanent Ban).'
      ]
    },
    {
      icon: Zap,
      title: '04. The Signal Protocol',
      content: 'By posting "Signals" or "Polls," you grant UniVibe a non-exclusive license to host and display this content within the university nexus. You retain ownership but are responsible for the social impact of your broadcasts.'
    },
    {
      icon: Lock,
      title: '05. Account Responsibility',
      content: 'You are solely responsible for maintaining the security of your authentication tokens and account access. Any activity performed under your verified identity is legally deemed your responsibility.'
    }
  ];

  return (
    <div className="min-h-screen bg-[#020202] text-white pb-32">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-[#020202]/80 backdrop-blur-xl border-b border-white/[0.03] px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <button 
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-zinc-500 hover:text-white transition-colors"
          >
            <ChevronLeft size={20} />
            <span className="text-[10px] font-black uppercase tracking-widest">Return</span>
          </button>
          <div className="text-[10px] font-black uppercase tracking-[0.4em] text-primary flex items-center gap-2">
            <Scale size={14} /> Community Protocol v2.4
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 pt-24">
        {/* Title */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-20"
        >
          <h1 className="text-5xl md:text-7xl font-black italic uppercase tracking-tighter leading-tight mb-8">
            Terms of <br /><span className="text-primary">Synergy.</span>
          </h1>
          <div className="p-6 rounded-3xl bg-primary/5 border border-primary/20 max-w-2xl">
            <p className="text-xs text-zinc-300 leading-relaxed font-medium italic">
              "By accessing the UniVibe frequency, you agree to the following campus safety standards and legal frameworks. These aren't just rules; they are the foundation of our collective vibe."
            </p>
          </div>
        </motion.div>

        {/* Content */}
        <div className="space-y-16">
          {sections.map((section, idx) => (
            <motion.section 
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="group"
            >
              <div className="flex items-start gap-6">
                <div className="h-12 w-12 rounded-2xl bg-zinc-900 border border-white/5 flex items-center justify-center text-zinc-500 group-hover:text-primary transition-colors">
                  <section.icon size={22} />
                </div>
                <div className="flex-1 pt-2">
                  <h2 className="text-lg font-black uppercase tracking-widest text-white mb-4 italic">
                    {section.title}
                  </h2>
                  {section.content && (
                    <p className="text-sm text-zinc-500 leading-relaxed font-medium max-w-2xl">
                      {section.content}
                    </p>
                  )}
                  {section.list && (
                    <div className="grid grid-cols-1 gap-3 max-w-2xl mt-6">
                      {section.list.map((item, i) => (
                        <div key={i} className="flex gap-4 p-4 rounded-2xl bg-zinc-900/50 border border-white/[0.03]">
                          <div className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                          <p className="text-[11px] font-black uppercase tracking-tight text-zinc-400">{item}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </motion.section>
          ))}
        </div>

        {/* Disclaimer */}
        <div className="mt-32 p-10 rounded-[3rem] bg-zinc-900/30 border border-white/5 text-center relative overflow-hidden">
           <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
           <Info size={32} className="text-zinc-800 mx-auto mb-6" />
           <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-600 mb-4">Legal Disclaimer</h3>
           <p className="text-[11px] text-zinc-500 leading-relaxed max-w-xl mx-auto font-medium">
             UniVibe is a living platform. We reserve the right to modify features, eligibility criteria, or these protocols at any time to ensure the continued safety and harmony of the campus ecosystem. Continued use of the platform after updates implies acceptance of new protocols.
           </p>
           <p className="mt-8 text-[9px] font-bold text-zinc-700 uppercase tracking-widest">
             © 2026 UniVibe Studio · High Frequency Nexus
           </p>
        </div>
      </div>
    </div>
  );
};

export default Terms;
