import React from 'react';
import { Tag, Search, Video, Sparkles } from 'lucide-react';

export const HowItWorks: React.FC = () => {
  const steps = [
    {
      num: '01',
      title: 'Choose Interests',
      desc: 'Pick up to 5 topics you enjoy—coding, gaming, travel, music, and more. Our smart engine matches related topics.',
      icon: Tag,
      color: 'from-sky-500 to-cyan-500',
    },
    {
      num: '02',
      title: 'Find a Real Person',
      desc: 'Join the real-time queue. You are connected strictly with another live person currently online.',
      icon: Search,
      color: 'from-indigo-500 to-purple-500',
    },
    {
      num: '03',
      title: 'Start Talking',
      desc: 'Enjoy authentic real-time text chat or crystal clear P2P video & audio. Skip anytime to meet someone new.',
      icon: Video,
      color: 'from-blue-500 to-indigo-600',
    },
  ];

  return (
    <section className="py-20 px-4 max-w-7xl mx-auto">
      <div className="text-center max-w-2xl mx-auto mb-16">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 text-sky-400 light:text-sky-600 text-xs font-semibold uppercase tracking-wider mb-3">
          <Sparkles className="w-3.5 h-3.5" />
          Simple & Instant
        </div>
        <h2 className="text-3xl sm:text-4xl font-bold text-white light:text-slate-900 tracking-tight">
          How It Works
        </h2>
        <p className="text-sm sm:text-base text-slate-400 light:text-slate-600 mt-3">
          No friction, no accounts, no complicated setups. Start conversing in three intuitive steps.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {steps.map((step) => {
          const Icon = step.icon;
          return (
            <div
              key={step.num}
              className="glass-panel p-8 rounded-2xl relative overflow-hidden group hover:border-sky-400/40 transition-all duration-300"
            >
              <div className="text-4xl font-extrabold text-slate-700/40 light:text-sky-200/80 mb-6 font-mono">
                {step.num}
              </div>
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-tr ${step.color} flex items-center justify-center text-white mb-5 shadow-lg shadow-sky-500/20 group-hover:scale-110 transition-transform`}>
                <Icon className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white light:text-slate-900 mb-2">
                {step.title}
              </h3>
              <p className="text-sm text-slate-300 light:text-slate-600 leading-relaxed">
                {step.desc}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
};
