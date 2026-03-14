
import React, { useState, useEffect } from 'react';
import { LibraryItem } from '../types';
import { generateImagePrompt } from '../geminiService';

const MOCK_LIBRARY: LibraryItem[] = [
  { id: '1', type: 'image', title: '霓虹东京雨夜', content: 'https://picsum.photos/400/300?random=1', tags: ['氛围', '科幻'], category: '视觉参考', createdAt: Date.now() },
  { id: '2', type: 'text', title: '论孤独', content: '那是深秋最后一片叶子落下的声音，在寂静中显得格外响亮。', tags: ['引言', '情绪'], category: '灵感金句', createdAt: Date.now() },
  { id: '3', type: 'link', title: '维多利亚时代服饰参考', content: 'https://example.com/costumes', tags: ['研究', '历史'], category: '背景研究', createdAt: Date.now() },
  { id: '4', type: 'image', title: '概念图：虚无', content: 'https://picsum.photos/400/300?random=2', tags: ['科幻', '概念'], category: '视觉参考', createdAt: Date.now() },
];

const InspirationVault: React.FC = () => {
  const [items, setItems] = useState<LibraryItem[]>(MOCK_LIBRARY);
  const [filter, setFilter] = useState('全部');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  
  // 新增条目表单状态
  const [newItem, setNewItem] = useState<Partial<LibraryItem>>({
    type: 'text',
    title: '',
    content: '',
    category: '灵感金句',
    tags: []
  });
  const [tagInput, setTagInput] = useState('');

  // 分类列表
  const categories = ['全部', '视觉参考', '灵感金句', '背景研究', '角色原型', '世界设定', '音频素材'];

  const filteredItems = items.filter(item => {
    const matchesCategory = filter === '全部' || item.category === filter;
    const query = searchQuery.toLowerCase();
    const matchesSearch = item.title.toLowerCase().includes(query) || 
                         item.content.toLowerCase().includes(query) ||
                         item.tags.some(t => t.toLowerCase().includes(query));
    return matchesCategory && matchesSearch;
  });

  const handleAddItem = () => {
    if (!newItem.title || !newItem.content) return;
    
    const item: LibraryItem = {
      id: `lib_${Date.now()}`,
      type: newItem.type as any,
      title: newItem.title!,
      content: newItem.content!,
      category: newItem.category!,
      tags: newItem.tags || [],
      createdAt: Date.now(),
      coverUrl: newItem.type === 'image' ? newItem.content : undefined
    };

    setItems([item, ...items]);
    setIsModalOpen(false);
    setNewItem({ type: 'text', title: '', content: '', category: '灵感金句', tags: [] });
  };

  const addTag = () => {
    if (tagInput.trim() && !newItem.tags?.includes(tagInput.trim())) {
      setNewItem({ ...newItem, tags: [...(newItem.tags || []), tagInput.trim()] });
      setTagInput('');
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-gray-50 overflow-hidden relative">
      
      {/* 新增条目模态框 */}
      {isModalOpen && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white w-[90%] max-w-[500px] rounded-[2.5rem] shadow-2xl p-10 flex flex-col gap-8 animate-in slide-in-from-bottom-8">
            <div className="flex justify-between items-center border-b border-gray-50 pb-6">
               <h3 className="text-xl font-bold tracking-tight text-gray-900">新增灵感条目</h3>
               <button onClick={() => setIsModalOpen(false)} className="text-gray-300 hover:text-gray-900 transition-colors">✕</button>
            </div>
            
            <div className="space-y-6 overflow-y-auto max-h-[60vh] px-2 no-scrollbar">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-1">类型</label>
                <div className="flex gap-2">
                  {['text', 'image', 'link'].map(t => (
                    <button 
                      key={t}
                      onClick={() => setNewItem({...newItem, type: t as any})}
                      className={`flex-1 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${newItem.type === t ? 'bg-gray-900 text-white shadow-lg shadow-gray-200' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'}`}
                    >
                      {t === 'text' ? '文字' : t === 'image' ? '图片' : '链接'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-1">标题</label>
                <input 
                  value={newItem.title}
                  onChange={e => setNewItem({...newItem, title: e.target.value})}
                  placeholder="为这条灵感起个名字"
                  className="w-full bg-gray-50 border border-transparent rounded-2xl px-5 py-4 text-sm focus:bg-white focus:ring-4 focus:ring-gray-100/50 transition-all outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-1">
                  {newItem.type === 'text' ? '内容' : newItem.type === 'image' ? '图片链接' : '网页链接'}
                </label>
                <textarea 
                  value={newItem.content}
                  onChange={e => setNewItem({...newItem, content: e.target.value})}
                  rows={newItem.type === 'text' ? 4 : 2}
                  placeholder={newItem.type === 'text' ? '记录下此刻的闪念...' : '粘贴链接地址'}
                  className="w-full bg-gray-50 border border-transparent rounded-2xl px-5 py-4 text-sm focus:bg-white focus:ring-4 focus:ring-gray-100/50 transition-all outline-none resize-none leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-1">分类</label>
                  <select 
                    value={newItem.category}
                    onChange={e => setNewItem({...newItem, category: e.target.value})}
                    className="w-full bg-gray-50 border border-transparent rounded-2xl px-5 py-4 text-sm focus:bg-white focus:ring-4 focus:ring-gray-100/50 transition-all outline-none appearance-none"
                  >
                    {categories.filter(c => c !== '全部').map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-1">标签</label>
                  <div className="flex gap-2">
                    <input 
                      value={tagInput}
                      onChange={e => setTagInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && addTag()}
                      placeholder="回车添加"
                      className="w-full bg-gray-50 border border-transparent rounded-2xl px-4 py-4 text-xs focus:bg-white focus:ring-4 focus:ring-gray-100/50 transition-all outline-none"
                    />
                  </div>
                </div>
              </div>
              
              {newItem.tags && newItem.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {newItem.tags.map(t => (
                    <span key={t} className="px-3 py-1 bg-gray-100 text-[10px] font-bold text-gray-500 rounded-full flex items-center gap-2">
                      #{t}
                      <button onClick={() => setNewItem({...newItem, tags: newItem.tags?.filter(tag => tag !== t)})} className="hover:text-red-500">✕</button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <button 
              onClick={handleAddItem}
              disabled={!newItem.title || !newItem.content}
              className="w-full bg-gray-900 text-white py-5 rounded-[1.5rem] text-xs font-black tracking-[0.3em] uppercase hover:bg-black transition-all shadow-xl shadow-gray-200 disabled:opacity-30 transform active:scale-95"
            >
              收入囊中
            </button>
          </div>
        </div>
      )}

      <header className="px-12 py-10 bg-white border-b border-gray-100 shrink-0">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div className="flex-1">
            <h1 className="text-3xl font-light text-gray-900 mb-2">灵感库</h1>
            <p className="text-sm text-gray-400 font-light mb-6">精心收藏的思想碎片，为你未来的杰作储备养分。</p>
            
            {/* 搜索功能 */}
            <div className="relative max-w-md group">
              <span className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-gray-900 transition-colors">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
              </span>
              <input 
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="搜索标题、内容或标签..."
                className="w-full bg-gray-50 border border-gray-100 rounded-2xl pl-12 pr-6 py-3.5 text-sm outline-none focus:bg-white focus:ring-4 focus:ring-gray-100/50 transition-all placeholder:text-gray-300 font-medium"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-900">
                   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M18 6L6 18M6 6l12 12"/></svg>
                </button>
              )}
            </div>
          </div>
          <div className="flex gap-4">
             <button 
                onClick={() => setShowSettings(!showSettings)}
                className="p-4 rounded-2xl border border-gray-100 text-gray-300 hover:text-gray-900 hover:border-gray-400 transition-all bg-white shadow-sm"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
              </button>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="bg-gray-900 text-white px-10 py-4 rounded-[1.2rem] text-[10px] font-black tracking-[0.2em] uppercase hover:bg-black transition-all shadow-xl shadow-gray-200 transform active:scale-95"
            >
              新增条目
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-12 py-12 no-scrollbar">
        <div className="max-w-7xl mx-auto">
          {/* 过滤器 */}
          <div className="flex gap-10 mb-14 overflow-x-auto no-scrollbar pb-1 border-b border-gray-100">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className={`pb-4 text-[11px] font-black uppercase tracking-[0.2em] transition-all relative ${
                  filter === cat ? 'text-gray-900' : 'text-gray-300 hover:text-gray-500'
                }`}
              >
                {cat}
                {filter === cat && <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-900 rounded-full animate-in fade-in slide-in-from-bottom-1" />}
              </button>
            ))}
          </div>

          {/* 瀑布流布局 */}
          <div className="columns-1 md:columns-2 lg:columns-3 gap-10 space-y-10">
            {filteredItems.map(item => {
              const displayImage = item.type === 'image' ? item.content : item.coverUrl;
              return (
                <div key={item.id} className="break-inside-avoid bg-white p-8 rounded-[2.5rem] border border-gray-100 hover:border-gray-200 hover:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] transition-all duration-700 group relative">
                  {(displayImage) && (
                    <div className="w-full mb-8 rounded-[2rem] overflow-hidden bg-gray-50 aspect-video md:aspect-auto">
                       <img src={displayImage} alt={item.title} className="w-full h-auto object-cover grayscale group-hover:grayscale-0 transition-all duration-1000 transform group-hover:scale-105" />
                    </div>
                  )}
                  <div className="space-y-5">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black text-gray-300 uppercase tracking-[0.3em]">{item.category}</span>
                      <span className="text-[8px] font-mono text-gray-200">{new Date(item.createdAt).toLocaleDateString()}</span>
                    </div>
                    <h4 className="text-xl font-medium text-gray-900 tracking-tight leading-snug">{item.title}</h4>
                    {item.type === 'text' && (
                      <p className="text-base text-gray-500 serif-font leading-relaxed italic border-l-[3px] border-gray-100 pl-6 py-2">
                        “{item.content}”
                      </p>
                    )}
                    <div className="flex flex-wrap gap-2.5 pt-4">
                      {item.tags.map((tag, idx) => (
                        <span key={idx} className="text-[9px] font-black border border-gray-100 text-gray-400 px-4 py-1.5 rounded-full uppercase tracking-widest hover:bg-gray-50 transition-colors">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          
          {filteredItems.length === 0 && (
            <div className="py-40 text-center">
               <div className="w-20 h-20 bg-gray-50 rounded-[2rem] flex items-center justify-center mx-auto mb-10 text-gray-100">
                 <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 12h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83"/></svg>
               </div>
               <p className="text-xs font-black text-gray-300 uppercase tracking-[0.5em] italic">灵感枯竭？去实验室逛逛吧</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
export default InspirationVault;
