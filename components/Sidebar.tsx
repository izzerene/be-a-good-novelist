
import React from 'react';
import { AppSection } from '../types';

interface SidebarProps {
  activeSection: AppSection;
  onNavigate: (section: AppSection) => void;
}

const Icons = {
  Dashboard: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></svg>,
  Project: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>,
  Bible: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>,
  Lab: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12h20"/><path d="M20 12v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-8"/><path d="M15 12V7a3 3 0 0 0-6 0v5"/><path d="M9 7h6"/></svg>,
  Vault: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 12h.01"/><path d="M16 6V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/><path d="M22 13a18.15 18.15 0 0 1-20 0"/><rect width="20" height="14" x="2" y="6" rx="2"/></svg>,
};

const Sidebar: React.FC<SidebarProps> = ({ activeSection, onNavigate }) => {
  const navItems = [
    { id: AppSection.DASHBOARD, label: '概览', icon: <Icons.Dashboard /> },
    { id: AppSection.PROJECT_STUDIO, label: '正式写作', icon: <Icons.Project /> },
    { id: AppSection.STORY_BIBLE, label: '故事蓝图', icon: <Icons.Bible /> },
    { id: AppSection.CREATIVE_LAB, label: '实验室', icon: <Icons.Lab /> },
    { id: AppSection.INSPIRATION_VAULT, label: '灵感库', icon: <Icons.Vault /> },
  ];

  return (
    <aside className="w-[260px] bg-white border-r border-gray-100 flex flex-col h-full z-20">
      <div className="h-20 flex items-center px-8">
        <div className="w-5 h-5 bg-indigo-600 rounded-sm mr-3"></div>
        <h1 className="text-base font-semibold text-gray-900 tracking-tight">重生之大文豪的一天</h1>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-1">
        {navItems.map((item) => {
          const isActive = activeSection === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-all duration-200 group ${
                isActive 
                  ? 'bg-gray-100 text-gray-900 font-medium' 
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <span className={`transition-colors ${isActive ? 'text-gray-900' : 'text-gray-400 group-hover:text-gray-600'}`}>
                {item.icon}
              </span>
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-8 border-t border-gray-50">
        <div className="flex flex-col gap-3">
          <div className="flex justify-between items-end">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">今日进度</span>
            <span className="text-[10px] font-mono font-semibold text-gray-900">67%</span>
          </div>
          <div className="w-full bg-gray-100 h-1 rounded-full overflow-hidden">
            <div className="bg-gray-800 h-full w-[67%] rounded-full transition-all duration-1000" />
          </div>
          <p className="text-[10px] text-gray-400 font-mono">1,340 / 2,000 字</p>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
