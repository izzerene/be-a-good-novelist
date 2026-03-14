
import React, { useState } from 'react';
import { CharacterNode, TimelineEvent, AppSection } from '../types';

interface InspirationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  characters?: CharacterNode[];
  events?: TimelineEvent[];
  onNavigate: (section: AppSection) => void;
}

const InspirationDrawer: React.FC<InspirationDrawerProps> = ({ isOpen, onClose, characters = [], events = [], onNavigate }) => {
  const [tab, setTab] = useState<'ref' | 'chars' | 'scenes'>('ref');

  const handleNavigate = () => {
    onClose();
    if (tab === 'ref') onNavigate(AppSection.INSPIRATION_VAULT);
    else onNavigate(AppSection.STORY_BIBLE);
  };

  const getButtonText = () => {
    if (tab === 'ref') return '打开完整资料库';
    return '打开故事蓝图';
  };

  return (
    <div className={`fixed inset-y-0 right-0 w-[360px] bg-white border-l border-gray-100 shadow-2xl z-40 transform transition-transform duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
      <div className="h-full flex flex-col">
        <div className="p-8 border-b border-gray-50 flex items-center justify-between">
          <div className="flex gap-6 overflow-x-auto no-scrollbar">
            {['资料', '人物', '场景'].map((t, i) => {
              const id = ['ref', 'chars', 'scenes'][i] as any;
              const active = tab === id;
              return (
                <button 
                  key={id} 
                  onClick={() => setTab(id)} 
                  className={`text-[10px] font-bold tracking-widest uppercase transition-all ${active ? 'text-gray-900 border-b-2 border-gray-900 pb-1' : 'text-gray-300 hover:text-gray-500'}`}
                >
                  {t}
                </button>
              );
            })}
          </div>
          <button onClick={onClose} className="text-gray-300 hover:text-gray-900 transition-colors ml-4 text-xs">✕</button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-8 no-scrollbar">
          {tab === 'ref' && (
             <div className="space-y-6">
               <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
                 <h5 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">视觉参考</h5>
                 <img src="https://picsum.photos/300/200?random=1" className="w-full rounded-xl mb-4 grayscale hover:grayscale-0 transition-all duration-700" alt="Ref" />
                 <p className="text-xs text-gray-900 font-medium">赛博朋克城市雨夜</p>
               </div>
               <div className="p-6 border border-gray-100 rounded-2xl">
                 <h5 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">金句暂存</h5>
                 <p className="text-sm text-gray-600 serif-font italic leading-relaxed">“那是深秋最后一片叶子落下的声音，大得惊人。”</p>
               </div>
             </div>
          )}

          {tab === 'chars' && (
            <div className="space-y-4">
              <h5 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-6">出场人物 ({characters.length})</h5>
              {characters.map(char => (
                <div key={char.id} className="flex items-center gap-4 p-4 hover:bg-gray-50 rounded-2xl transition-all cursor-pointer">
                  <img src={char.avatar} alt={char.name} className="w-10 h-10 rounded-full object-cover grayscale" />
                  <div>
                    <span className="block text-xs font-semibold text-gray-900">{char.name}</span>
                    <span className="text-[10px] text-gray-400 uppercase tracking-widest">{char.role}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === 'scenes' && (
            <div className="space-y-6">
              <h5 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-6">情节脉络 ({events.length})</h5>
              {events.map((event) => (
                <div key={event.id} className="relative pl-6 border-l border-gray-100">
                  <div className={`absolute -left-1 top-1.5 w-2 h-2 rounded-full ${event.type === 'major' ? 'bg-gray-900' : 'bg-gray-200'}`} />
                  <span className="text-[8px] font-bold text-gray-300 uppercase tracking-tighter block mb-1">{event.time}</span>
                  <h4 className="text-xs font-medium text-gray-700 leading-relaxed">{event.summary}</h4>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="p-8 border-t border-gray-50">
          <button 
            onClick={handleNavigate}
            className="w-full py-3 bg-gray-50 text-gray-500 text-[10px] font-bold tracking-widest uppercase rounded-xl hover:bg-gray-100 transition-all"
          >
            {getButtonText()}
          </button>
        </div>
      </div>
    </div>
  );
};

export default InspirationDrawer;
