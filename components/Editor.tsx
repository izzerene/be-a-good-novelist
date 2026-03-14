
import React, { useState } from 'react';
import { getAIWritingAssistant } from '../geminiService';

interface EditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
}

const Editor: React.FC<EditorProps> = ({ content, onChange, placeholder }) => {
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiPanel, setAiPanel] = useState(false);

  const handleAiAction = async (instruction: string) => {
    setIsAiLoading(true);
    try {
      const result = await getAIWritingAssistant('Context: Novel Writing', content, instruction);
      if (result) {
        onChange(content + '\n\n' + result);
      }
    } finally {
      setIsAiLoading(false);
      setAiPanel(false);
    }
  };

  const actions = [
    { label: '续写章节', instr: 'Continue writing' },
    { label: '润色文风', instr: 'Refine style' },
    { label: '头脑风暴反转', instr: 'Brainstorm twist' },
  ];

  return (
    <div className="relative group min-h-[600px] h-full flex flex-col">
      <textarea
        value={content}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full h-full flex-1 border-none focus:ring-0 text-lg leading-[2] text-gray-800 placeholder-gray-200 resize-none serif-font outline-none bg-transparent"
        spellCheck={false}
      />
      
      <div className="fixed bottom-10 right-10 z-30">
        {!aiPanel ? (
          <button 
            onClick={() => setAiPanel(true)}
            className="group flex items-center gap-3 px-6 py-3 bg-white border border-gray-100 rounded-full shadow-2xl hover:border-gray-300 transition-all"
          >
            <span className="text-gray-400 group-hover:text-gray-900 transition-colors">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
            </span>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest group-hover:text-gray-900 transition-colors">AI 灵感助手</span>
          </button>
        ) : (
          <div className="bg-white border border-gray-100 rounded-2xl shadow-2xl p-3 w-64 animate-in fade-in slide-in-from-bottom-4">
            <div className="px-4 py-3 border-b border-gray-50 flex justify-between items-center mb-2">
              <span className="text-[10px] font-bold text-gray-900 uppercase tracking-widest">灵感工厂</span>
              <button onClick={() => setAiPanel(false)} className="text-gray-300 hover:text-gray-900 transition-colors text-xs">✕</button>
            </div>
            <div className="space-y-1">
              {actions.map((action, i) => (
                <button 
                  key={i}
                  disabled={isAiLoading}
                  onClick={() => handleAiAction(action.instr)}
                  className="w-full text-left px-4 py-2.5 text-xs text-gray-500 hover:bg-gray-50 hover:text-gray-900 rounded-lg transition-all"
                >
                  {action.label}
                </button>
              ))}
            </div>
            {isAiLoading && (
              <div className="p-4 text-[10px] text-center text-gray-400 font-bold animate-pulse tracking-widest uppercase mt-2">
                正在构思中...
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Editor;
