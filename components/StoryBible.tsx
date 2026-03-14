
import React, { useState, useRef, useEffect } from 'react';
import { CharacterNode, CharacterLink, TimelineEvent, BibleNode } from '../types';
import { generateCharacterAvatar } from '../geminiService';

interface StoryBibleProps {
  characters: CharacterNode[];
  setCharacters: (chars: CharacterNode[]) => void;
  links: CharacterLink[];
  setLinks: (links: CharacterLink[]) => void;
  events: TimelineEvent[];
  setEvents: (events: TimelineEvent[]) => void;
  bibleNodes: BibleNode[];
  setBibleNodes: (nodes: BibleNode[]) => void;
}

const StoryBible: React.FC<StoryBibleProps> = ({ 
  characters, setCharacters, links, setLinks, events, setEvents, bibleNodes, setBibleNodes
}) => {
  const [activeTab, setActiveTab] = useState<'map' | 'timeline' | 'outline'>('map');
  const [timelineMode, setTimelineMode] = useState<'list' | 'gantt'>('list');
  const [activeNodeId, setActiveNodeId] = useState<string | 'all'>('all');
  
  // Modals
  const [isEditingEvent, setIsEditingEvent] = useState(false);
  const [isEditingCharacter, setIsEditingCharacter] = useState(false);
  const [isEditingLink, setIsEditingLink] = useState(false);
  
  // Current States
  const [currentEvent, setCurrentEvent] = useState<Partial<TimelineEvent> | null>(null);
  const [currentCharacter, setCurrentCharacter] = useState<Partial<CharacterNode> | null>(null);
  const [currentLink, setCurrentLink] = useState<Partial<CharacterLink> | null>(null);
  
  const [isGeneratingAvatar, setIsGeneratingAvatar] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string, type: 'bible' | 'event' | 'character' | 'link' } | null>(null);

  const [editingBibleId, setEditingBibleId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const editInputRef = useRef<HTMLInputElement>(null);

  const mutedColors = [
    { name: '石板灰', value: 'border-[#7D8491]', bg: 'bg-[#7D8491]' },
    { name: '灰豆绿', value: 'border-[#9CAEA9]', bg: 'bg-[#9CAEA9]' },
    { name: '尘埃粉', value: 'border-[#BB999C]', bg: 'bg-[#BB999C]' },
    { name: '冷杉蓝', value: 'border-[#5B7083]', bg: 'bg-[#5B7083]' },
    { name: '枯叶黄', value: 'border-[#D1B490]', bg: 'bg-[#D1B490]' },
    { name: '鼠尾草', value: 'border-[#A3AD91]', bg: 'bg-[#A3AD91]' },
    { name: '陶土棕', value: 'border-[#9A7B6F]', bg: 'bg-[#9A7B6F]' },
    { name: '暮光紫', value: 'border-[#7F7C9C]', bg: 'bg-[#7F7C9C]' },
  ];

  const filteredEvents = activeNodeId === 'all' ? events : events.filter(e => e.contextId === activeNodeId);

  // --- Common Handlers ---
  const handleAddBibleNode = () => {
    const newNode: BibleNode = { id: `bible_${Date.now()}`, type: 'book', title: '新建分册', isOpen: true };
    setBibleNodes([...bibleNodes, newNode]);
    setActiveNodeId(newNode.id);
    setEditingBibleId(newNode.id);
  };

  const handleRenameBibleNode = (id: string, newTitle: string) => {
    const renameRecursive = (nodes: BibleNode[]): BibleNode[] => {
      return nodes.map(node => {
        if (node.id === id) return { ...node, title: newTitle };
        if (node.children) return { ...node, children: renameRecursive(node.children) };
        return node;
      });
    };
    setBibleNodes(renameRecursive(bibleNodes));
    setEditingBibleId(null);
  };

  const handleAddBibleChildNode = (parentId: string) => {
    const addRecursive = (nodes: BibleNode[]): BibleNode[] => {
      return nodes.map(node => {
        if (node.id === parentId) {
          const newNode: BibleNode = {
            id: `bible_${Date.now()}`,
            type: 'book',
            title: '新建分册',
            isOpen: true,
            children: []
          };
          return { ...node, children: [...(node.children || []), newNode] };
        }
        if (node.children) return { ...node, children: addRecursive(node.children) };
        return node;
      });
    };
    setBibleNodes(addRecursive(bibleNodes));
  };

  const handleUpdateBibleContent = (id: string, content: string) => {
    const updateRecursive = (nodes: BibleNode[]): BibleNode[] => {
      return nodes.map(node => {
        if (node.id === id) return { ...node, content };
        if (node.children) return { ...node, children: updateRecursive(node.children) };
        return node;
      });
    };
    setBibleNodes(updateRecursive(bibleNodes));
  };

  const findBibleNode = (nodes: BibleNode[], id: string): BibleNode | undefined => {
    for (const node of nodes) {
      if (node.id === id) return node;
      if (node.children) {
        const found = findBibleNode(node.children, id);
        if (found) return found;
      }
    }
    return undefined;
  };

  const activeBibleNode = findBibleNode(bibleNodes, activeNodeId);

  const confirmDelete = () => {
    if (!deleteConfirm) return;
    const { id, type } = deleteConfirm;
    if (type === 'bible') {
      const deleteRecursive = (nodes: BibleNode[]): BibleNode[] => {
        return nodes.filter(node => {
          if (node.id === id) return false;
          if (node.children) {
            node.children = deleteRecursive(node.children);
          }
          return true;
        });
      };
      setBibleNodes(deleteRecursive(bibleNodes));
      if (activeNodeId === id) setActiveNodeId('all');
    } else if (type === 'event') {
      setEvents(events.filter(e => e.id !== id));
      setIsEditingEvent(false);
    } else if (type === 'character') {
      setCharacters(characters.filter(c => c.id !== id));
      setLinks(links.filter(l => l.source !== id && l.target !== id));
      setIsEditingCharacter(false);
    } else if (type === 'link') {
      setLinks(links.filter(l => l.id !== id));
      setIsEditingLink(false);
    }
    setDeleteConfirm(null);
  };

  // --- Character Logic ---
  const handleAddCharacter = () => {
    setCurrentCharacter({
      id: `char_${Date.now()}`,
      name: '', role: '', faction: '', bio: '',
      avatar: 'https://i.pravatar.cc/150?u=' + Date.now(),
      x: 30 + Math.random() * 40, y: 30 + Math.random() * 40,
      color: mutedColors[0].value
    });
    setIsEditingCharacter(true);
  };

  const handleEditCharacter = (char: CharacterNode) => {
    setCurrentCharacter(char);
    setIsEditingCharacter(true);
  };

  const saveCharacter = () => {
    if (!currentCharacter?.name) return;
    const char = currentCharacter as CharacterNode;
    setCharacters(characters.find(c => c.id === char.id) ? characters.map(c => c.id === char.id ? char : c) : [...characters, char]);
    setIsEditingCharacter(false);
  };

  const handleGenerateAIAvatar = async () => {
    if (!currentCharacter?.bio || !currentCharacter?.name) {
      alert("请先填写人物姓名和生平简述。");
      return;
    }
    setIsGeneratingAvatar(true);
    try {
      const avatarUrl = await generateCharacterAvatar(currentCharacter.name, currentCharacter.bio);
      if (avatarUrl) setCurrentCharacter({ ...currentCharacter, avatar: avatarUrl });
    } finally {
      setIsGeneratingAvatar(false);
    }
  };

  // --- Link Logic ---
  const handleAddLink = () => {
    setCurrentLink({
      id: `link_${Date.now()}`,
      source: '',
      target: '',
      label: '',
      contextId: activeNodeId === 'all' ? undefined : activeNodeId
    });
    setIsEditingLink(true);
  };

  const saveLink = () => {
    if (!currentLink?.source || !currentLink?.target || !currentLink?.label) {
      alert("请完整选择关联的人物并填写关系说明。");
      return;
    }
    if (currentLink.source === currentLink.target) {
      alert("不能与自己建立关联。");
      return;
    }
    const link = currentLink as CharacterLink;
    setLinks(links.find(l => l.id === link.id) ? links.map(l => l.id === link.id ? link : l) : [...links, link]);
    setIsEditingLink(false);
  };

  // --- Event Logic ---
  const handleAddEvent = () => {
    setCurrentEvent({ id: `ev_${Date.now()}`, time: '', location: '', summary: '', type: 'minor', duration: 1, associatedCharacterIds: [], contextId: activeNodeId === 'all' ? undefined : activeNodeId });
    setIsEditingEvent(true);
  };

  const handleEditEvent = (event: TimelineEvent) => {
    setCurrentEvent(event);
    setIsEditingEvent(true);
  };

  const saveEvent = () => {
    if (!currentEvent?.summary) return;
    const event = currentEvent as TimelineEvent;
    setEvents(events.find(e => e.id === event.id) ? events.map(e => e.id === event.id ? event : e) : [...events, event]);
    setIsEditingEvent(false);
  };

  useEffect(() => {
    if (editingBibleId && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingBibleId]);

  const TreeItem: React.FC<{ node: BibleNode, activeId: string, onSelect: (id: string) => void, onRename: (id: string, title: string) => void, onDelete: (id: string) => void, onAddChild: (id: string) => void, editingId: string | null, setEditingId: (id: string | null) => void, editInputRef: React.RefObject<HTMLInputElement>, depth?: number, searchQuery?: string }> = ({ node, activeId, onSelect, onRename, onDelete, onAddChild, editingId, setEditingId, editInputRef, depth = 0, searchQuery = '' }) => {
    const [isOpen, setIsOpen] = useState(node.isOpen ?? true);
    const isActive = node.id === activeId;
    const isEditing = editingId === node.id;

    // 检查节点是否匹配搜索查询
    const isMatch = searchQuery === '' || node.title.toLowerCase().includes(searchQuery.toLowerCase());
    
    // 检查子节点是否有匹配
    const hasMatchingChild = searchQuery !== '' && node.children?.some((child: any) => {
      const childMatch = child.title.toLowerCase().includes(searchQuery.toLowerCase());
      const hasGrandchildMatch = child.children?.some((grandchild: any) => 
        grandchild.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
      return childMatch || hasGrandchildMatch;
    });

    // 如果搜索查询不为空且当前节点和子节点都不匹配，则不显示
    if (searchQuery !== '' && !isMatch && !hasMatchingChild) {
      return null;
    }

    return (
      <div className="mb-1">
        <div 
          className={`group flex items-center gap-2 py-2.5 px-3 rounded-xl cursor-pointer transition-all ${isActive ? 'bg-gray-900 text-white font-bold' : 'text-gray-500 hover:bg-gray-50'}`}
          onClick={() => onSelect(node.id)}
          onDoubleClick={() => setEditingId(node.id)}
        >
          <span className={`w-3 h-3 flex items-center justify-center text-[9px] text-gray-300 transition-transform ${isOpen ? 'rotate-0' : '-rotate-90'} ${!node.children?.length && 'invisible'}`} onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}>
            ▼
          </span>
          <span className="text-lg flex-shrink-0">{node.type === 'book' ? '📖' : '📁'}</span>
          {isEditing ? (
            <input 
              ref={editInputRef} 
              className="bg-transparent border-none outline-none w-full font-bold text-white" 
              defaultValue={node.title} 
              onBlur={(e) => onRename(node.id, e.target.value)} 
              onKeyDown={(e) => e.key === 'Enter' && onRename(node.id, (e.target as HTMLInputElement).value)} 
            />
          ) : (
            <span className="truncate flex-1">{node.title}</span>
          )}
          <div className="flex items-center gap-1">
            <button 
              className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-gray-900 p-1 rounded"
              onClick={(e) => { e.stopPropagation(); onAddChild(node.id); }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            </button>
            <button 
              className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-red-400 p-1 rounded"
              onClick={(e) => { e.stopPropagation(); onDelete(node.id); }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            </button>
          </div>
        </div>
        {node.children && isOpen && (
          <div className="ml-5 mt-1 border-l border-gray-100 pl-2">
            {node.children.map((child) => (
              <TreeItem 
                key={child.id} 
                node={child} 
                activeId={activeId} 
                onSelect={onSelect} 
                onRename={onRename} 
                onDelete={onDelete} 
                onAddChild={onAddChild}
                editingId={editingId}
                setEditingId={setEditingId}
                editInputRef={editInputRef}
                depth={depth + 1}
                searchQuery={searchQuery}
              />
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex-1 bg-gray-50 flex flex-col h-full overflow-hidden relative">
      
      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl max-w-sm w-full text-center space-y-8 animate-in zoom-in-95 duration-300">
            <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto shadow-inner">
               <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-gray-900">确认删除</h3>
              <p className="text-sm text-gray-400 font-light leading-relaxed px-4">此操作不可逆，删除后关联内容将永久消失。</p>
            </div>
            <div className="flex gap-4">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-4 bg-gray-100 text-gray-500 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-200 transition-all">取消</button>
              <button onClick={confirmDelete} className="flex-1 py-4 bg-red-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-red-600 transition-all shadow-xl shadow-red-200">立即删除</button>
            </div>
          </div>
        </div>
      )}

      {/* Relationship Link Modal */}
      {isEditingLink && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white w-[90%] max-w-[500px] rounded-[3rem] shadow-[0_30px_90px_-20px_rgba(0,0,0,0.3)] p-12 flex flex-col gap-10 animate-in slide-in-from-bottom-12 duration-700">
            <div className="flex justify-between items-center">
               <h3 className="text-2xl font-bold tracking-tight text-gray-900">建立关联</h3>
               <button onClick={() => setIsEditingLink(false)} className="text-gray-300 hover:text-gray-900 transition-all hover:rotate-90">
                 <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
               </button>
            </div>
            
            <div className="space-y-8">
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="text-[11px] font-black uppercase text-gray-400 tracking-[0.2em] px-1">角色 A</label>
                  <div className="relative group">
                    <select 
                      value={currentLink?.source || ''} 
                      onChange={e => setCurrentLink({...currentLink, source: e.target.value})}
                      className="w-full bg-gray-50 border border-gray-100 rounded-[1.5rem] px-6 py-4 text-sm focus:bg-white focus:ring-4 focus:ring-gray-100/50 transition-all outline-none appearance-none font-medium text-gray-700 cursor-pointer shadow-sm hover:border-gray-200"
                    >
                      <option value="">选择人物</option>
                      {characters.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-gray-300 group-hover:text-gray-900 transition-colors">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M6 9l6 6 6-6"/></svg>
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <label className="text-[11px] font-black uppercase text-gray-400 tracking-[0.2em] px-1">角色 B</label>
                  <div className="relative group">
                    <select 
                      value={currentLink?.target || ''} 
                      onChange={e => setCurrentLink({...currentLink, target: e.target.value})}
                      className="w-full bg-gray-50 border border-gray-100 rounded-[1.5rem] px-6 py-4 text-sm focus:bg-white focus:ring-4 focus:ring-gray-100/50 transition-all outline-none appearance-none font-medium text-gray-700 cursor-pointer shadow-sm hover:border-gray-200"
                    >
                      <option value="">选择人物</option>
                      {characters.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-gray-300 group-hover:text-gray-900 transition-colors">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M6 9l6 6 6-6"/></svg>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="space-y-3">
                <label className="text-[11px] font-black uppercase text-gray-400 tracking-[0.2em] px-1">关系描述</label>
                <input 
                  value={currentLink?.label || ''} 
                  onChange={e => setCurrentLink({...currentLink, label: e.target.value})}
                  placeholder="例如: 挚友 / 宿敌 / 父子" 
                  className="w-full bg-gray-50 border border-gray-100 rounded-[1.5rem] px-6 py-5 text-sm focus:bg-white focus:ring-4 focus:ring-gray-100/50 transition-all outline-none font-medium text-gray-700 shadow-sm hover:border-gray-200" 
                />
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <button 
                onClick={saveLink} 
                className="w-full bg-gray-900 text-white py-5 rounded-[1.5rem] text-xs font-black tracking-[0.3em] uppercase hover:bg-black transition-all shadow-xl shadow-gray-200 transform active:scale-95"
              >
                保存关联
              </button>
              {currentLink?.id && links.some(l => l.id === currentLink.id) && (
                <button 
                  onClick={() => setDeleteConfirm({ id: currentLink.id!, type: 'link' })} 
                  className="w-full bg-red-50 text-red-500 py-4 rounded-[1.2rem] text-[10px] font-black uppercase tracking-widest hover:bg-red-100 transition-all flex items-center justify-center gap-3"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                  删除此关联
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Character Modal */}
      {isEditingCharacter && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md animate-in fade-in duration-300">
           <div className="bg-white w-[90%] max-w-[650px] rounded-[3rem] shadow-2xl p-12 flex flex-col gap-8 animate-in slide-in-from-bottom-8 overflow-y-auto max-h-[90vh] no-scrollbar">
              <div className="flex justify-between items-center">
                 <h3 className="text-2xl font-bold tracking-tight text-gray-900">刻画人物</h3>
                 <button onClick={() => setIsEditingCharacter(false)} className="text-gray-300 hover:text-gray-900 transition-colors">
                   <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
                 </button>
              </div>
              <div className="flex flex-col sm:flex-row gap-10 items-start">
                 <div className="flex flex-col items-center gap-5 flex-shrink-0">
                    <div className={`w-40 h-40 rounded-[2.5rem] overflow-hidden border-4 ${currentCharacter?.color || 'border-gray-100'} shadow-xl relative group`}>
                       {isGeneratingAvatar && <div className="absolute inset-0 bg-gray-900/40 flex items-center justify-center z-10 backdrop-blur-sm"><div className="w-10 h-10 border-2 border-white border-t-transparent rounded-full animate-spin" /></div>}
                       <img src={currentCharacter?.avatar} className="w-full h-full object-cover" alt="Avatar" />
                    </div>
                    <button onClick={handleGenerateAIAvatar} disabled={isGeneratingAvatar} className="text-[11px] font-black uppercase tracking-widest text-indigo-500 hover:text-indigo-600 transition-colors flex items-center gap-2 bg-indigo-50 px-4 py-2 rounded-full">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                      AI 生成头像
                    </button>
                 </div>
                 <div className="flex-1 space-y-6 w-full">
                    <div className="grid grid-cols-2 gap-6">
                       <div className="space-y-2">
                          <label className="text-[11px] font-black uppercase text-gray-400 tracking-widest px-1">姓名</label>
                          <input value={currentCharacter?.name || ''} onChange={e => setCurrentCharacter({...currentCharacter, name: e.target.value})} placeholder="人物名称" className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-3.5 text-sm focus:bg-white focus:ring-4 focus:ring-gray-100/50 transition-all outline-none font-medium" />
                       </div>
                       <div className="space-y-2">
                          <label className="text-[11px] font-black uppercase text-gray-400 tracking-widest px-1">身份 / 职位</label>
                          <input value={currentCharacter?.role || ''} onChange={e => setCurrentCharacter({...currentCharacter, role: e.target.value})} placeholder="角色身份" className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-3.5 text-sm focus:bg-white focus:ring-4 focus:ring-gray-100/50 transition-all outline-none font-medium" />
                       </div>
                    </div>
                    <div className="space-y-2">
                       <label className="text-[11px] font-black uppercase text-gray-400 tracking-widest px-1">所属阵营</label>
                       <input value={currentCharacter?.faction || ''} onChange={e => setCurrentCharacter({...currentCharacter, faction: e.target.value})} placeholder="阵营" className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-3.5 text-sm focus:bg-white focus:ring-4 focus:ring-gray-100/50 transition-all outline-none font-medium" />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[11px] font-black uppercase text-gray-400 tracking-widest px-1">生平简述</label>
                       <textarea value={currentCharacter?.bio || ''} onChange={e => setCurrentCharacter({...currentCharacter, bio: e.target.value})} rows={4} placeholder="背景故事..." className="w-full bg-gray-50 border border-gray-100 rounded-[1.5rem] px-5 py-4 text-sm focus:bg-white focus:ring-4 focus:ring-gray-100/50 transition-all outline-none resize-none leading-relaxed font-medium" />
                    </div>
                    <div className="space-y-3">
                       <label className="text-[11px] font-black uppercase text-gray-400 tracking-widest px-1">代表色</label>
                       <div className="flex flex-wrap gap-4 py-1">
                          {mutedColors.map(c => <button key={c.value} onClick={() => setCurrentCharacter({...currentCharacter, color: c.value})} className={`w-8 h-8 rounded-full ${c.bg} transition-all transform hover:scale-125 ${currentCharacter?.color === c.value ? 'ring-4 ring-offset-4 ring-gray-100 scale-125' : ''}`} />)}
                       </div>
                    </div>
                 </div>
              </div>
              <div className="flex flex-col gap-4 mt-4 border-t border-gray-50 pt-8">
                 <button onClick={saveCharacter} className="w-full bg-gray-900 text-white py-5 rounded-[1.5rem] text-xs font-black tracking-[0.3em] uppercase hover:bg-black transition-all shadow-xl shadow-gray-200">确定并记录人物</button>
                 {currentCharacter?.id && characters.some(c => c.id === currentCharacter.id) && (
                    <button 
                      onClick={() => setDeleteConfirm({ id: currentCharacter.id!, type: 'character' })} 
                      className="w-full py-4 bg-red-50 text-red-500 rounded-[1.2rem] text-[10px] font-black uppercase tracking-widest hover:bg-red-100 transition-all flex items-center justify-center gap-3"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                      彻底删除此人物
                    </button>
                 )}
              </div>
           </div>
        </div>
      )}

      {/* Scene Editing Modal */}
      {isEditingEvent && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white w-[90%] max-w-[500px] rounded-[2.5rem] shadow-2xl p-10 flex flex-col gap-8 animate-in slide-in-from-bottom-8">
            <div className="flex justify-between items-center border-b border-gray-50 pb-6"><h3 className="text-lg font-bold text-gray-900">编排场景</h3><button onClick={() => setIsEditingEvent(false)} className="text-gray-300 hover:text-gray-900">✕</button></div>
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 space-y-2"><label className="text-[10px] font-black text-gray-400">时间</label><input value={currentEvent?.time || ''} onChange={e => setCurrentEvent({...currentEvent, time: e.target.value})} className="w-full bg-gray-50 rounded-2xl px-5 py-3.5 text-sm outline-none" /></div>
                <div className="flex-1 space-y-2"><label className="text-[10px] font-black text-gray-400">时长</label><input type="number" value={currentEvent?.duration || 1} onChange={e => setCurrentEvent({...currentEvent, duration: parseInt(e.target.value) || 1})} className="w-full bg-gray-50 rounded-2xl px-5 py-3.5 text-sm outline-none" /></div>
              </div>
              <div className="space-y-2"><label className="text-[10px] font-black text-gray-400">梗略</label><textarea value={currentEvent?.summary || ''} onChange={e => setCurrentEvent({...currentEvent, summary: e.target.value})} rows={4} className="w-full bg-gray-50 rounded-[1.5rem] px-5 py-4 text-sm outline-none resize-none" /></div>
            </div>
            <div className="flex flex-col gap-3 pt-4">
              <button onClick={saveEvent} className="w-full bg-gray-900 text-white py-4.5 rounded-[1.2rem] text-xs font-black uppercase tracking-[0.2em] hover:bg-black transition-all shadow-xl shadow-gray-300">保存场景</button>
              {currentEvent?.id && events.some(e => e.id === currentEvent.id) && (
                <button onClick={() => setDeleteConfirm({ id: currentEvent.id!, type: 'event' })} className="w-full py-4 bg-red-50 text-red-500 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-red-100 flex items-center justify-center gap-2"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>删除场景</button>
              )}
            </div>
          </div>
        </div>
      )}

      <header className="px-12 py-10 bg-white border-b border-gray-100 flex flex-col md:flex-row items-start md:items-end justify-between z-10 gap-6">
        <div><h1 className="text-4xl font-light text-gray-900 mb-1.5 tracking-tight">故事蓝图</h1><p className="text-sm text-gray-400 font-light tracking-wide">构建宏大世界观，梳理命运纠葛的脉络。</p></div>
        <div className="bg-gray-100/80 p-1.5 rounded-2xl flex gap-1 shadow-inner w-full md:w-auto">
          <button onClick={() => setActiveTab('map')} className={`flex-1 md:flex-none px-10 py-3 rounded-xl text-[10px] font-black tracking-[0.2em] uppercase transition-all duration-500 ${activeTab === 'map' ? 'bg-white shadow-xl shadow-gray-200/50 text-gray-900' : 'text-gray-400 hover:text-gray-600'}`}>人物关系</button>
          <button onClick={() => setActiveTab('timeline')} className={`flex-1 md:flex-none px-10 py-3 rounded-xl text-[10px] font-black tracking-[0.2em] uppercase transition-all duration-500 ${activeTab === 'timeline' ? 'bg-white shadow-xl shadow-gray-200/50 text-gray-900' : 'text-gray-400 hover:text-gray-600'}`}>剧情轴</button>
          <button onClick={() => setActiveTab('outline')} className={`flex-1 md:flex-none px-10 py-3 rounded-xl text-[10px] font-black tracking-[0.2em] uppercase transition-all duration-500 ${activeTab === 'outline' ? 'bg-white shadow-xl shadow-gray-200/50 text-gray-900' : 'text-gray-400 hover:text-gray-600'}`}>文章大纲</button>
        </div>
      </header>

      <div className="flex-1 overflow-hidden flex">
        {/* Directory Sidebar */}
        <div className="hidden lg:flex w-[280px] bg-white border-r border-gray-100 flex-col h-full">
          <div className="p-8 border-b border-gray-50 flex flex-col gap-4 bg-gray-50/20">
            <div className="flex justify-between items-center">
              <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">蓝图分册</h3>
              <button onClick={handleAddBibleNode} className="text-gray-300 hover:text-gray-900 transition-all bg-gray-100/50 p-1.5 rounded-lg">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>
              </button>
            </div>
            <div className="relative">
              <input
                type="text"
                placeholder="搜索蓝图..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs bg-white border border-gray-200 rounded-lg px-3 py-2 pr-8 focus:outline-none focus:ring-1 focus:ring-gray-300"
              />
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                <circle cx="11" cy="11" r="8"/>
                <path d="m21 21-4.35-4.35"/>
              </svg>
            </div>
          </div>
          <div className="p-6 space-y-2 overflow-y-auto no-scrollbar">
            <div onClick={() => setActiveNodeId('all')} className={`px-5 py-3.5 rounded-2xl text-xs cursor-pointer transition-all duration-300 flex items-center gap-3 ${activeNodeId === 'all' ? 'bg-gray-900 text-white font-bold shadow-lg shadow-gray-200' : 'text-gray-500 hover:bg-gray-50'}`}><span className="text-lg">🌐</span> 全局视角</div>
            {bibleNodes.map(node => (
              <TreeItem 
                key={node.id} 
                node={node} 
                activeId={activeNodeId} 
                onSelect={setActiveNodeId} 
                onRename={handleRenameBibleNode} 
                onDelete={(id) => setDeleteConfirm({ id, type: 'bible' })} 
                onAddChild={handleAddBibleChildNode}
                editingId={editingBibleId}
                setEditingId={setEditingBibleId}
                editInputRef={editInputRef}
                searchQuery={searchQuery}
              />
            ))}
          </div>
        </div>

        {/* Content View */}
        <div className="flex-1 bg-white relative">
          {activeTab === 'map' ? (
            <div className="w-full h-full p-12 overflow-hidden relative group bg-[#fcfcfc]">
              <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
              
              <svg className="absolute inset-0 w-full h-full pointer-events-none z-0" viewBox="0 0 100 100" preserveAspectRatio="none">
                {links.filter(l => activeNodeId === 'all' || l.contextId === activeNodeId).map(link => {
                  const s = characters.find(c => c.id === link.source);
                  const t = characters.find(c => c.id === link.target);
                  if (!s || !t) return null;
                  return (
                    <g key={link.id} className="cursor-pointer pointer-events-auto group/link" onClick={() => { setCurrentLink(link); setIsEditingLink(true); }}>
                      <line x1={s.x} y1={s.y} x2={t.x} y2={t.y} stroke="#E5E7EB" strokeWidth="0.5" strokeDasharray="1,1" className="group-hover/link:stroke-gray-900 transition-colors" />
                      <circle cx={(s.x + t.x) / 2} cy={(s.y + t.y) / 2} r="1.5" fill="white" stroke="#E5E7EB" strokeWidth="0.2" className="group-hover/link:stroke-gray-900" />
                      <text x={(s.x + t.x) / 2} y={(s.y + t.y) / 2 - 2} textAnchor="middle" className="text-[1.5px] font-bold fill-gray-400 group-hover/link:fill-gray-900 transition-colors uppercase tracking-widest">{link.label}</text>
                    </g>
                  );
                })}
              </svg>

              <div className="absolute bottom-12 right-12 flex flex-col sm:flex-row gap-4 z-20">
                 <button onClick={handleAddLink} className="bg-white border border-gray-100 text-gray-900 px-10 py-4 rounded-2xl text-[10px] font-black tracking-[0.2em] uppercase shadow-xl hover:shadow-2xl hover:bg-gray-50 transition-all hover:scale-105 flex items-center gap-3">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
                    建立关联
                 </button>
                 <button onClick={handleAddCharacter} className="bg-gray-900 text-white px-10 py-4 rounded-2xl text-[10px] font-black tracking-[0.2em] uppercase shadow-2xl hover:bg-black transition-all hover:scale-105 flex items-center gap-3">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M12 5v14M5 12h14"/></svg>
                    新增人物
                 </button>
              </div>

              <div className="w-full h-full relative z-10">
                 {characters.map(char => (
                   <div key={char.id} onClick={() => handleEditCharacter(char)} className="absolute flex flex-col items-center group cursor-pointer transition-all duration-1000 hover:z-30" style={{ left: `${char.x}%`, top: `${char.y}%`, transform: 'translate(-50%, -50%)' }}>
                     <div className={`relative w-20 h-20 sm:w-24 sm:h-24 rounded-full border-[6px] ${char.color || 'border-gray-100'} overflow-hidden shadow-[0_20px_50px_-10px_rgba(0,0,0,0.15)] bg-white transition-all duration-700 group-hover:scale-110 group-hover:border-white p-1`}>
                        <img src={char.avatar} alt={char.name} className="w-full h-full object-cover rounded-full grayscale group-hover:grayscale-0 transition-all duration-1000" />
                     </div>
                     <div className="mt-5 text-center transform translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500 bg-white/80 backdrop-blur px-4 py-2 rounded-2xl shadow-lg border border-gray-50">
                        <span className="block text-sm font-bold text-gray-900 tracking-tight">{char.name}</span>
                        <span className="text-[9px] text-gray-400 uppercase tracking-widest font-black mt-0.5">{char.role}</span>
                     </div>
                   </div>
                 ))}
              </div>
            </div>
          ) : activeTab === 'outline' ? (
            <div className="w-full h-full flex flex-col relative bg-[#f9fafb]/50 overflow-hidden">
               <div className="flex-shrink-0 px-12 py-8 flex justify-between items-center bg-white/50 backdrop-blur border-b border-gray-100">
                  <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">文章大纲</h3>
                  <button onClick={handleAddBibleNode} className="bg-gray-900 text-white px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-black shadow-xl">新增大纲</button>
               </div>
               <div className="flex-1 overflow-y-auto p-12 sm:p-20 no-scrollbar">
                 <div className="max-w-4xl mx-auto space-y-8 relative pb-40">
                   {activeBibleNode ? (
                     <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-[0_15px_40px_-15px_rgba(0,0,0,0.03)] hover:shadow-[0_25px_60px_-20px_rgba(0,0,0,0.08)] transition-all">
                       <div className="flex items-center justify-between mb-6">
                         <h3 className="text-lg font-bold text-gray-900 tracking-tight">{activeBibleNode.title}</h3>
                         <div className="flex gap-2">
                           <button onClick={() => setEditingBibleId(activeBibleNode.id)} className="text-gray-400 hover:text-gray-900 transition-colors p-2 rounded-lg hover:bg-gray-50">
                             <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 20h9M7.5 20H6a2 2 0 0 1-2-2v-1M15 4h6a2 2 0 0 1 2 2v1M7 16h6"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L18.5 2.5z"/></svg>
                           </button>
                           <button onClick={() => setDeleteConfirm({ id: activeBibleNode.id, type: 'bible' })} className="text-gray-400 hover:text-red-500 transition-colors p-2 rounded-lg hover:bg-red-50">
                             <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                           </button>
                         </div>
                       </div>
                       <div className="space-y-4">
                         <textarea 
                           value={activeBibleNode.content || ''} 
                           onChange={(e) => handleUpdateBibleContent(activeBibleNode.id, e.target.value)} 
                           placeholder="在此输入大纲内容..." 
                           className="w-full bg-gray-50 border border-gray-100 rounded-xl p-6 text-sm text-gray-600 leading-relaxed resize-none min-h-[300px] focus:outline-none focus:ring-2 focus:ring-gray-200"
                         />
                         <p className="text-xs text-gray-400 mt-4">
                           编辑大纲内容后，可在正式写作中导入此大纲作为章节结构。
                         </p>
                       </div>
                     </div>
                   ) : (
                     <div className="text-center py-20">
                       <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                         <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-300"><path d="M12 20h9M7.5 20H6a2 2 0 0 1-2-2v-1M15 4h6a2 2 0 0 1 2 2v1M7 16h6"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L18.5 2.5z"/></svg>
                       </div>
                       <h3 className="text-xl font-bold text-gray-900 mb-2">选择大纲</h3>
                       <p className="text-sm text-gray-400 max-w-md mx-auto">
                         从左侧选择一个大纲分册来编辑其内容，或点击上方「新增大纲」按钮创建新的大纲。
                       </p>
                     </div>
                   )}
                 </div>
               </div>
            </div>
          ) : (
            <div className="w-full h-full flex flex-col relative bg-[#f9fafb]/50 overflow-hidden">
               <div className="flex-shrink-0 px-12 py-8 flex justify-between items-center bg-white/50 backdrop-blur border-b border-gray-100">
                  <div className="flex bg-gray-100 p-1 rounded-xl shadow-inner">
                    <button onClick={() => setTimelineMode('list')} className={`px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${timelineMode === 'list' ? 'bg-white shadow-md text-gray-900' : 'text-gray-400'}`}>清单视图</button>
                    <button onClick={() => setTimelineMode('gantt')} className={`px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${timelineMode === 'gantt' ? 'bg-white shadow-md text-gray-900' : 'text-gray-400'}`}>甘特图</button>
                  </div>
                  <button onClick={handleAddEvent} className="bg-gray-900 text-white px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-black shadow-xl">编排场景</button>
               </div>
               <div className="flex-1 overflow-y-auto p-12 sm:p-20 no-scrollbar">
                 {timelineMode === 'list' ? (
                   <div className="max-w-4xl mx-auto space-y-12 relative pb-40 px-4">
                     <div className="absolute left-[2.45rem] sm:left-[5.45rem] top-4 bottom-10 w-px bg-gradient-to-b from-gray-200 via-gray-100 to-transparent" />
                     {filteredEvents.map(event => (
                       <div key={event.id} className="relative flex gap-8 sm:gap-16 items-start group">
                          <div className="relative z-10 flex-shrink-0 mt-8">
                             <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-[1.2rem] border-4 border-white shadow-xl transition-all duration-700 flex items-center justify-center ${event.type === 'major' ? 'bg-gray-900 scale-110' : 'bg-white group-hover:bg-gray-50'}`}>{event.type === 'major' ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z"/></svg> : <div className="w-2.5 h-2.5 rounded-full bg-gray-200 group-hover:bg-gray-400 transition-colors" />}</div>
                          </div>
                          <div className="flex-1 space-y-4">
                             <div className="flex items-center gap-4 px-1"><span className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em]">{event.time || '未定时间线'}</span></div>
                             <div onClick={() => handleEditEvent(event)} className="bg-white p-8 sm:p-10 rounded-[2.5rem] border border-gray-100 shadow-[0_15px_40px_-15px_rgba(0,0,0,0.03)] hover:shadow-[0_25px_60px_-20px_rgba(0,0,0,0.08)] transition-all cursor-pointer relative overflow-hidden">
                                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-8 relative z-10">
                                   <div className="flex items-center gap-2 px-4 py-1.5 bg-gray-50 rounded-full border border-gray-100/50"><span className="text-[10px]">📍</span><span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{event.location || '未知领域'}</span></div>
                                   <div className="flex -space-x-3">{event.associatedCharacterIds?.map((cid, idx) => { const char = characters.find(c => c.id === cid); return char ? <img key={cid} src={char.avatar} className="w-10 h-10 rounded-2xl border-[3px] border-white object-cover shadow-lg grayscale group-hover:grayscale-0 transition-all duration-500" alt={char.name} style={{ zIndex: 10 - idx }} /> : null; })}</div>
                                </div>
                                <h3 className="text-lg sm:text-xl font-medium text-gray-900 leading-[1.8] serif-font">{event.summary}</h3>
                             </div>
                          </div>
                       </div>
                     ))}
                   </div>
                 ) : (
                   <div className="max-w-6xl mx-auto space-y-2 relative pb-40 px-4 animate-in fade-in">
                      <div className="mb-10 flex border-b border-gray-100 pb-4"><div className="w-64 flex-shrink-0 text-[10px] font-black text-gray-400 uppercase tracking-widest px-4">场景序列</div><div className="flex-1 flex gap-1 items-end">{Array.from({length: 12}).map((_, i) => <div key={i} className="flex-1 text-[8px] font-mono text-gray-300 text-center border-l border-gray-50">{i + 1}</div>)}</div></div>
                      {filteredEvents.map((event, index) => { const startPos = (index % 6) * 10; const duration = (event.duration || 1) * 8; return (
                        <div key={event.id} className="flex items-center group cursor-pointer" onClick={() => handleEditEvent(event)}>
                          <div className="w-64 flex-shrink-0 pr-6 overflow-hidden"><span className="text-xs font-medium text-gray-900 truncate block transition-all group-hover:translate-x-1">{event.summary.substring(0, 30)}...</span></div>
                          <div className="flex-1 h-14 relative bg-gray-50/30 border-y border-transparent group-hover:bg-gray-100/30 transition-all"><div className={`absolute top-3 bottom-3 rounded-full shadow-lg transition-all duration-700 group-hover:scale-y-110 ${event.type === 'major' ? 'bg-gray-900 shadow-gray-200' : 'bg-gray-300/60'}`} style={{ left: `${startPos}%`, width: `${duration}%` }}><div className="absolute inset-0 flex items-center justify-center px-4 overflow-hidden pointer-events-none"><span className={`text-[8px] font-black uppercase tracking-widest truncate ${event.type === 'major' ? 'text-white' : 'text-gray-500'}`}>{event.time || 'T'+index}</span></div></div></div>
                        </div>
                      );})}
                   </div>
                 )}
               </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StoryBible;
