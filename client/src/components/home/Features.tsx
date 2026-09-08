import React from 'react';
import { Target, Shuffle, MessageSquare, Video, UserX } from 'lucide-react';

export const Features: React.FC = () => {
  const features = [
    {
      title: 'Smart Interest Matching',
      desc: 'Our semantic engine understands that "coding" is related to "programming" and "gaming" matches "games". You connect over what matters to you.',
      icon: Target,
      tag: 'Semantic Engine',
    },
    {
      title: 'Random Discovery',
      desc: 'Discover serendipitous conversations. If multiple people share your interests, the system randomly selects among suitable candidates.',
      icon: Shuffle,
      tag: 'Spontaneous',
    },
    {
      title: 'Real-Time Text Chat',
      desc: 'Instant bidirectional messaging with typing states, timestamps, and smooth message bubbles powered by Socket.IO.',
      icon: MessageSquare,
      tag: 'Instant',
    },
    {
      title: 'Real WebRTC Video & Audio',
      desc: 'Direct peer-to-peer high-definition streaming with live audio activity indicator, in-call camera/mic toggling, and floating local preview.',
      icon: Video,
      tag: 'Direct P2P',
    },
    {
      title: 'No Login Required',
      desc: 'No Google sign-in, email collection, passwords, or profile setup. Your session is temporary, anonymous, and completely private.',
      icon: UserX,
      tag: '100% Private',
    },
  ];

  return (
    <section className="py-20 px-4 max-w-7xl mx-auto">
      <div className="text-center max-w-2xl mx-auto mb-16">
        <h2 className="text-3xl sm:text-4xl font-bold text-white light:text-slate-900 tracking-tight">
          Engineered for Genuine Human Connection
        </h2>
        <p className="text-sm sm:text-base text-slate-400 light:text-slate-600 mt-3">
          Built with cutting-edge real-time technology, uncompromising privacy, and zero synthetic bots.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((feat, index) => {
          const Icon = feat.icon;
          return (
            <div
              key={index}
              className="glass-panel p-6 rounded-2xl flex flex-col justify-between hover:border-sky-400/40 transition-all group"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-xl bg-sky-500/10 text-sky-400 light:text-sky-600 group-hover:bg-sky-500/20 transition-colors">
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="text-[10px] font-semibold tracking-wider uppercase px-2.5 py-1 rounded-full bg-slate-800/80 light:bg-sky-100 text-sky-400 light:text-sky-700 border border-slate-700/50 light:border-sky-200">
                    {feat.tag}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white light:text-slate-900 mb-2">
                  {feat.title}
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 light:text-slate-600 leading-relaxed">
                  {feat.desc}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
