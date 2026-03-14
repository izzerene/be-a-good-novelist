
import React, { useState, useEffect, useRef } from 'react';
import { generateWritingPrompt, generateImagePrompt } from '../geminiService';

const EXERCISE_TYPES = [
  { id: 'daily', title: '灵感日签', icon: '📅', desc: '建立习惯，微型挑战' },
  { id: 'image', title: '视觉启发', icon: '🖼️', desc: '看图写话，视觉转译' },
  { id: 'video', title: '光影切片', icon: '🎬', desc: '电影瞬间，镜头捕捉' },
  { id: 'three_word', title: '三词连珠', icon: '🔤', desc: '逻辑串联，词汇游戏' },
  { id: 'random', title: '剧情盲盒', icon: '🎲', desc: '666个脑洞大开的练习', isSpecial: true },
];

interface CreativeLabProps {
  initialExercise?: string | null;
  onSaveToProject: (type: string, title: string, content: string) => void;
}

const CreativeLab: React.FC<CreativeLabProps> = ({ initialExercise, onSaveToProject }) => {
  const [activeExercise, setActiveExercise] = useState<string | null>(null);
  const [promptData, setPromptData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [userText, setUserText] = useState('');
  const [imagePromptUrl, setImagePromptUrl] = useState<string | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [showShareCard, setShowShareCard] = useState(false);

  const startExercise = async (type: string) => {
    setLoading(true);
    setActiveExercise(type);
    setUserText('');
    setImagePromptUrl(null);
    setShowShareCard(false);
    
    if (type === 'random') {
      setIsDrawing(true);
      await new Promise(r => setTimeout(r, 800));
    }

    try {
      const data = await generateWritingPrompt(type);
      setPromptData(data);
      setIsDrawing(false);
      if (type === 'image') {
        const url = await generateImagePrompt(data.prompt);
        setImagePromptUrl(url);
      }
    } finally {
      setLoading(false);
      setIsDrawing(false);
    }
  };

  const handlePublish = () => {
    if (!userText.trim()) return;
    // 1. 保存到正式写作
    onSaveToProject(activeExercise!, promptData?.title || '未命名练习', userText);
    // 2. 弹出分享卡片
    setShowShareCard(true);
  };

  useEffect(() => {
    if (initialExercise) startExercise(initialExercise);
  }, []);

  if (activeExercise) {
    const isBlindBox = activeExercise === 'random';
    
    return (
      <div className="flex-1 bg-white flex flex-col h-full relative">
        {/* 卡片分享模态框 */}
        {showShareCard && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-500">
             <div className="relative flex flex-col items-center">
                {/* 极简精致卡片 */}
                <div className="w-[380px] bg-white rounded-3xl shadow-[0_30px_60px_-15px_rgba(0,0,0,0.3)] overflow-hidden flex flex-col animate-in slide-in-from-bottom-8 duration-700">
                   <div className="h-2 bg-yellow-400 w-full" />
                   <div className="p-10">
                      <div className="flex justify-between items-start mb-8">
                         <div className="flex flex-col">
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">MuseWriter / Lab</span>
                            <span className="text-lg font-bold text-gray-900 mt-1">{promptData?.title || '创作练习'}</span>
                         </div>
                         {isBlindBox && <span className="px-3 py-1 bg-gray-900 text-yellow-400 text-[10px] font-black rounded">No.{promptData?.number}</span>}
                      </div>

                      <div className="bg-gray-50 rounded-2xl p-6 mb-8 border border-gray-100 italic serif-font text-sm text-gray-500 leading-relaxed relative">
                         <span className="absolute -top-3 -left-2 text-3xl text-gray-200">“</span>
                         {promptData?.prompt}
                      </div>

                      <div className="min-h-[200px] max-h-[300px] overflow-y-auto no-scrollbar serif-font text-lg text-gray-800 leading-[1.8] whitespace-pre-wrap">
                         {userText}
                      </div>

                      <div className="mt-12 pt-8 border-t border-gray-50 flex justify-between items-end">
                         <div className="space-y-1">
                            <p className="text-[9px] font-mono text-gray-300 uppercase tracking-widest">{new Date().toLocaleDateString()}</p>
                            <p className="text-[10px] font-bold text-gray-400">已自动存入「正式写作」目录</p>
                         </div>
                         <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                            <div className="w-6 h-6 border-2 border-gray-200 rounded-sm relative">
                               <div className="absolute top-1 left-1 w-1 h-1 bg-gray-300" />
                               <div className="absolute bottom-1 right-1 w-1 h-1 bg-gray-300" />
                            </div>
                         </div>
                      </div>
                   </div>
                </div>

                <div className="mt-10 flex gap-4">
                   <button className="px-8 py-3 bg-white text-gray-900 rounded-full text-[10px] font-bold tracking-widest uppercase hover:bg-gray-100 transition-all flex items-center gap-2">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
                      保存图片
                   </button>
                   <button 
                     onClick={() => { setActiveExercise(null); setShowShareCard(false); }}
                     className="px-8 py-3 bg-gray-900 text-white rounded-full text-[10px] font-bold tracking-widest uppercase hover:bg-black transition-all"
                   >
                      完成并返回
                   </button>
                </div>
             </div>
          </div>
        )}

        <header className="px-8 py-6 border-b border-gray-100 flex items-center justify-between bg-white/80 backdrop-blur-md sticky top-0 z-20">
          <button onClick={() => setActiveExercise(null)} className="text-gray-400 hover:text-gray-900 flex items-center gap-2 text-xs font-bold tracking-widest uppercase transition-all">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
            返回列表
          </button>
          <div className="flex items-center gap-3">
             {isBlindBox && <span className="px-3 py-1 bg-yellow-400 text-black text-[10px] font-black rounded-sm shadow-sm">666件可写的事</span>}
             <h2 className="text-xs font-bold text-gray-900 uppercase tracking-[0.2em]">
               {isBlindBox ? '剧情盲盒' : (promptData?.title || '加载中...')}
             </h2>
          </div>
          <button 
            onClick={handlePublish}
            disabled={!userText.trim() || loading}
            className="bg-gray-900 text-white px-10 py-2.5 rounded-xl text-[10px] font-bold tracking-widest uppercase hover:bg-black disabled:opacity-30 transition-all shadow-lg"
          >
            发布
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-12 lg:p-20 grid grid-cols-1 lg:grid-cols-2 gap-20 max-w-7xl mx-auto w-full">
          <div className="space-y-10">
            <div className={`relative bg-gray-50 p-12 rounded-[2.5rem] border border-gray-100 shadow-sm transition-all duration-700 ${isDrawing ? 'scale-95 opacity-50' : 'scale-100 opacity-100'}`}>
              {isBlindBox && promptData?.number && (
                <div className="absolute -top-4 -left-4 w-16 h-16 bg-yellow-400 flex items-center justify-center rotate-[-5deg] shadow-xl border-4 border-white">
                  <span className="text-black font-black text-xl">#{promptData.number}</span>
                </div>
              )}
              <h3 className="text-gray-300 font-bold mb-10 text-[10px] uppercase tracking-[0.3em]">写作启发题目</h3>
              {loading || isDrawing ? (
                <div className="space-y-6 animate-pulse">
                  <div className="h-6 bg-gray-200 rounded-full w-3/4"></div>
                  <div className="h-20 bg-gray-100 rounded-2xl w-full"></div>
                </div>
              ) : (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                  <p className="text-3xl font-serif text-gray-900 leading-snug mb-10 selection:bg-yellow-200">{promptData?.prompt}</p>
                  {promptData?.words && (
                    <div className="flex gap-3 flex-wrap">
                      {promptData.words.map((w: string) => <span key={w} className="px-6 py-2 bg-white border border-gray-200 text-gray-600 rounded-xl text-[10px] font-bold uppercase tracking-widest shadow-sm">{w}</span>)}
                    </div>
                  )}
                  {imagePromptUrl && (
                    <div className="mt-12 rounded-2xl overflow-hidden border border-gray-100 shadow-2xl group">
                      <img src={imagePromptUrl} alt="Visual" className="w-full h-auto grayscale group-hover:grayscale-0 transition-all duration-1000 transform group-hover:scale-105" />
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col h-full py-4">
            <textarea
              value={userText}
              onChange={(e) => setUserText(e.target.value)}
              placeholder="在此记录你的脑洞，内容将自动存入「正式写作 -> 创意练习集」中..."
              className="flex-1 w-full bg-transparent p-0 border-none focus:ring-0 text-xl serif-font resize-none text-gray-800 placeholder-gray-200 leading-[2.2] no-scrollbar"
            />
            <div className="mt-10 pt-10 border-t border-gray-50 flex justify-between items-center text-gray-300 uppercase font-bold text-[10px] tracking-widest">
              <span>Word count: {userText.length}</span>
              <button onClick={() => setUserText('')} className="hover:text-red-500 transition-colors">清空草稿</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-gray-50 overflow-y-auto no-scrollbar">
      <div className="max-w-6xl mx-auto px-12 py-24">
        <div className="mb-24">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-8 h-1 bg-yellow-400 rounded-full" />
            <span className="text-xs font-bold text-gray-400 uppercase tracking-[0.4em]">Creative Sanctuary</span>
          </div>
          <h1 className="text-5xl font-light text-gray-900 mb-6 tracking-tight">创作实验室</h1>
          <p className="text-gray-400 font-light text-xl max-w-2xl leading-relaxed">捕捉瞬间灵感，并将每一个练习自动整理入库。</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {EXERCISE_TYPES.map((type) => (
            <button
              key={type.id}
              onClick={() => startExercise(type.id)}
              className={`group relative bg-white p-12 rounded-[2.5rem] border border-gray-100 hover:border-gray-300 transition-all duration-500 flex flex-col items-start text-left h-80 justify-between shadow-[0_4px_30px_-10px_rgba(0,0,0,0.02)] hover:shadow-2xl hover:-translate-y-2 ${type.isSpecial ? 'ring-2 ring-yellow-400/20' : ''}`}
            >
              {type.isSpecial && <div className="absolute -top-3 -right-3 px-4 py-1.5 bg-yellow-400 text-black text-[9px] font-black uppercase rounded-full shadow-lg z-10">Popular</div>}
              <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400 group-hover:bg-gray-900 group-hover:text-white transition-all duration-500 shadow-sm overflow-hidden">
                 <span className="text-2xl group-hover:scale-110 transition-transform">{type.icon}</span>
              </div>
              <div className="space-y-3">
                <h3 className="text-2xl font-semibold text-gray-900 group-hover:translate-x-1 transition-transform duration-500">{type.title}</h3>
                <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest leading-relaxed">{type.desc}</p>
              </div>
              <div className="absolute bottom-10 right-10 opacity-0 group-hover:opacity-100 transition-opacity translate-x-4 group-hover:translate-x-0 duration-500 text-gray-300">
                 <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CreativeLab;
