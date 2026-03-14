
import React, { useState, useEffect } from 'react';
import { getDailyMotivation } from '../geminiService';
import { AppSection } from '../types';

interface DashboardProps {
  onNavigate: (section: AppSection, params?: any) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const [motivation, setMotivation] = useState<{ quote: string; author: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await getDailyMotivation();
        setMotivation(data);
      } catch (e) {
        setMotivation({ quote: "写作即是在发现你所相信的东西。", author: "大卫·黑尔" });
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const stats = [
    { label: '总字数', value: '42,850', sub: '本周 +1,200' },
    { label: '连续创作', value: '12 天', sub: '最高纪录: 24 天' },
    { label: '灵感片段', value: '158', sub: '今日新增 3' },
  ];

  return (
    <div className="flex-1 bg-gray-50 overflow-y-auto">
      <div className="max-w-5xl mx-auto px-12 py-16">
        
        <div className="mb-20">
          <div className="flex justify-between items-end mb-10">
            <div>
              <h1 className="text-3xl font-light text-gray-900 mb-2">上午好。</h1>
              <p className="text-gray-500 font-light">准备好开启今天的灵感了吗？</p>
            </div>
            <button 
              onClick={() => onNavigate(AppSection.PROJECT_STUDIO)}
              className="px-10 py-3 bg-gray-900 text-white text-xs font-bold rounded-lg hover:bg-black transition-all tracking-widest uppercase"
            >
              继续写作
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <div className="md:col-span-2 bg-white p-10 rounded-2xl border border-gray-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] flex flex-col justify-center">
               {loading ? (
                 <div className="space-y-4 animate-pulse">
                   <div className="h-4 bg-gray-50 rounded w-3/4"></div>
                   <div className="h-4 bg-gray-50 rounded w-1/2"></div>
                 </div>
               ) : (
                 <>
                    <p className="text-xl serif-font text-gray-800 leading-relaxed italic">
                      “{motivation?.quote}”
                    </p>
                    <p className="text-[10px] font-bold text-gray-400 mt-6 uppercase tracking-[0.2em]">—— {motivation?.author}</p>
                 </>
               )}
            </div>

            <div className="grid grid-rows-3 gap-4">
              {stats.map((stat, i) => (
                <div key={i} className="flex items-center justify-between bg-white px-8 py-5 rounded-2xl border border-gray-100 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.02)]">
                   <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{stat.label}</span>
                   <div className="text-right">
                     <span className="block text-sm font-bold text-gray-900">{stat.value}</span>
                     <span className="block text-[10px] text-gray-400 font-light mt-0.5">{stat.sub}</span>
                   </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
          <div className="lg:col-span-2 space-y-10">
            <div className="flex items-center justify-between pb-6 border-b border-gray-200">
              <h2 className="text-[10px] font-bold text-gray-900 uppercase tracking-[0.3em]">最近项目</h2>
            </div>
            
            <div 
              onClick={() => onNavigate(AppSection.PROJECT_STUDIO)}
              className="group cursor-pointer bg-white rounded-2xl border border-gray-100 p-10 hover:border-gray-300 transition-all duration-500 shadow-[0_2px_15px_-5px_rgba(0,0,0,0.02)]"
            >
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h3 className="text-xl font-serif text-gray-900 mb-2 group-hover:text-black">《永恒的星尘》</h3>
                  <p className="text-xs text-gray-400">第一卷：起源 · 第三章</p>
                </div>
                <span className="text-[10px] text-gray-400 font-mono">2小时前编辑</span>
              </div>
              
              <div className="space-y-3">
                 <div className="flex justify-between text-[10px] text-gray-400 font-mono">
                   <span>完成进度</span>
                   <span>85%</span>
                 </div>
                 <div className="w-full bg-gray-50 h-1 rounded-full overflow-hidden">
                    <div className="bg-gray-800 h-full w-[85%] transition-all duration-1000" />
                 </div>
              </div>
            </div>
          </div>

          <div className="space-y-10">
             <div className="bg-gray-900 text-white p-10 rounded-2xl shadow-2xl relative overflow-hidden group">
                <div className="relative z-10">
                  <h3 className="text-lg font-light mb-2">创作实验室</h3>
                  <p className="text-gray-400 text-xs mb-8 leading-relaxed font-light">通过视觉暗示和创作约束打破思维定势。</p>
                  <button 
                    onClick={() => onNavigate(AppSection.CREATIVE_LAB, { exercise: 'daily' })}
                    className="w-full bg-white text-gray-900 text-[10px] font-bold py-3 rounded-lg hover:bg-gray-100 transition-colors tracking-widest uppercase"
                  >
                    开始练习
                  </button>
                </div>
                <div className="absolute -right-6 -bottom-10 w-32 h-32 rounded-full border border-gray-800/50 group-hover:scale-110 transition-transform duration-700" />
             </div>

             <div className="p-8 border border-gray-100 rounded-2xl bg-white shadow-[0_2px_15px_-5px_rgba(0,0,0,0.02)]">
               <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-6">今日闪念</h3>
               <p className="serif-font text-gray-800 italic leading-relaxed text-sm mb-6">
                 “深秋最后一片叶子落下的声音，大得惊人。”
               </p>
               <button 
                 onClick={() => onNavigate(AppSection.INSPIRATION_VAULT)}
                 className="text-[10px] text-gray-400 hover:text-gray-900 font-bold tracking-widest uppercase flex items-center gap-2 transition-colors"
               >
                 存入灵感库 <span className="text-xs">→</span>
               </button>
             </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Dashboard;
