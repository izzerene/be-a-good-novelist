
import React, { useState } from 'react';
import { ProjectNode, ProjectNodeType, CharacterNode, TimelineEvent, AppSection } from '../types';
import Editor from './Editor';
import InspirationDrawer from './InspirationDrawer';

interface ProjectStudioProps {
  isFocusMode: boolean;
  toggleFocus: () => void;
  characters: CharacterNode[];
  events: TimelineEvent[];
  bibleNodes: any[];
  onNavigate: (section: AppSection) => void;
  externalNodes: ProjectNode[];
  onNodesChange: (nodes: ProjectNode[]) => void;
}

const ProjectStudio: React.FC<ProjectStudioProps> = ({ 
  isFocusMode, toggleFocus, characters, events, bibleNodes, onNavigate, externalNodes, onNodesChange 
}) => {
  const [activeNodeId, setActiveNodeId] = useState<string>('c1');
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const [showLibrary, setShowLibrary] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [showOutlineImport, setShowOutlineImport] = useState(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const editInputRef = React.useRef<HTMLInputElement>(null);

  const findNode = (ns: ProjectNode[], id: string): ProjectNode | undefined => {
    for (const node of ns) {
      if (node.id === id) return node;
      if (node.children) {
        const found = findNode(node.children, id);
        if (found) return found;
      }
    }
    return undefined;
  };

  const activeNode = findNode(externalNodes, activeNodeId);

  const updateContent = (content: string) => {
    const updateRecursive = (ns: ProjectNode[]): ProjectNode[] => {
      return ns.map(node => {
        if (node.id === activeNodeId) return { ...node, content };
        if (node.children) return { ...node, children: updateRecursive(node.children) };
        return node;
      });
    };
    onNodesChange(updateRecursive(externalNodes));
  };

  const updateArticleIntro = (articleIntro: string) => {
    const updateRecursive = (ns: ProjectNode[]): ProjectNode[] => {
      return ns.map(node => {
        if (node.id === activeNodeId) return { ...node, articleIntro };
        if (node.children) return { ...node, children: updateRecursive(node.children) };
        return node;
      });
    };
    onNodesChange(updateRecursive(externalNodes));
  };

  const handleAddNode = (parentId: string) => {
    const addNodeRecursive = (ns: ProjectNode[]): ProjectNode[] => {
      return ns.map(node => {
        if (node.id === parentId) {
          const newNode: ProjectNode = {
            id: `node_${Date.now()}`,
            type: node.type === 'book' ? 'volume' : node.type === 'volume' ? 'chapter' : 'scene',
            title: node.type === 'book' ? '新卷' : node.type === 'volume' ? '新章节' : '新场景',
            children: [],
            isOpen: true
          };
          return { ...node, children: [...(node.children || []), newNode] };
        }
        if (node.children) return { ...node, children: addNodeRecursive(node.children) };
        return node;
      });
    };
    onNodesChange(addNodeRecursive(externalNodes));
  };

  const handleAddRootNode = () => {
    const newNode: ProjectNode = {
      id: `book_${Date.now()}`,
      type: 'book',
      title: '新作品',
      children: [],
      isOpen: true
    };
    onNodesChange([...externalNodes, newNode]);
    setEditingNodeId(newNode.id);
  };

  const handleRenameNode = (id: string, newTitle: string) => {
    const renameRecursive = (ns: ProjectNode[]): ProjectNode[] => {
      return ns.map(node => {
        if (node.id === id) return { ...node, title: newTitle };
        if (node.children) return { ...node, children: renameRecursive(node.children) };
        return node;
      });
    };
    onNodesChange(renameRecursive(externalNodes));
    setEditingNodeId(null);
  };

  const handleDeleteNode = (id: string) => {
    setDeleteConfirm(id);
  };

  const confirmDelete = () => {
    if (!deleteConfirm) return;
    const deleteRecursive = (ns: ProjectNode[]): ProjectNode[] => {
      return ns.filter(node => {
        if (node.id === deleteConfirm) return false;
        if (node.children) {
          node.children = deleteRecursive(node.children);
        }
        return true;
      });
    };
    onNodesChange(deleteRecursive(externalNodes));
    if (activeNodeId === deleteConfirm) {
      setActiveNodeId(externalNodes[0]?.id || '');
    }
    setDeleteConfirm(null);
  };

  const handleImportOutline = (outlineId: string) => {
    // 查找要导入的大纲节点
    const findBibleNode = (nodes: any[], id: string): any => {
      for (const node of nodes) {
        if (node.id === id) return node;
        if (node.children) {
          const found = findBibleNode(node.children, id);
          if (found) return found;
        }
      }
      return null;
    };

    const outlineNode = findBibleNode(bibleNodes, outlineId);
    if (!outlineNode) return;

    // 创建导入的节点结构
    const createNodesFromOutline = (node: any, parentType: string): ProjectNode => {
      const nodeType = parentType === 'book' ? 'volume' : parentType === 'volume' ? 'chapter' : 'scene';
      const newNode: ProjectNode = {
        id: `imported_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: nodeType,
        title: node.title,
        content: node.content,
        articleIntro: '',
        children: [],
        isOpen: true
      };

      if (node.children && node.children.length > 0) {
        newNode.children = node.children.map((child: any) => createNodesFromOutline(child, nodeType));
      }

      return newNode;
    };

    // 找到当前选中的节点或根节点
    const targetNodeId = activeNodeId || externalNodes[0]?.id;
    if (!targetNodeId) {
      // 如果没有选中节点，创建新作品
      const newBook: ProjectNode = {
        id: `book_${Date.now()}`,
        type: 'book',
        title: outlineNode.title,
        children: [createNodesFromOutline(outlineNode, 'book')],
        isOpen: true
      };
      onNodesChange([...externalNodes, newBook]);
    } else {
      // 向选中的节点添加大纲
      const addOutlineRecursive = (ns: ProjectNode[]): ProjectNode[] => {
        return ns.map(node => {
          if (node.id === targetNodeId) {
            const newNodes = createNodesFromOutline(outlineNode, node.type);
            return { ...node, children: [...(node.children || []), newNodes] };
          }
          if (node.children) return { ...node, children: addOutlineRecursive(node.children) };
          return node;
        });
      };
      onNodesChange(addOutlineRecursive(externalNodes));
    }

    setShowOutlineImport(false);
  };

  React.useEffect(() => {
    if (editingNodeId && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingNodeId]);

  return (
    <div className="flex h-full relative overflow-hidden bg-white">
      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl max-w-sm w-full text-center space-y-8 animate-in zoom-in-95 duration-300">
            <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto shadow-inner">
               <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-gray-900">确认删除</h3>
              <p className="text-sm text-gray-400 font-light leading-relaxed px-4">此操作不可逆，删除后内容将永久消失。</p>
            </div>
            <div className="flex gap-4">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-4 bg-gray-100 text-gray-500 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-200 transition-all">取消</button>
              <button onClick={confirmDelete} className="flex-1 py-4 bg-red-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-red-600 transition-all shadow-xl shadow-red-200">立即删除</button>
            </div>
          </div>
        </div>
      )}

      {/* Import Outline Modal */}
      {showOutlineImport && (
        <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl max-w-md w-full space-y-8 animate-in zoom-in-95 duration-300">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-900">导入章节大纲</h3>
              <button onClick={() => setShowOutlineImport(false)} className="text-gray-300 hover:text-gray-900 transition-colors">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            </div>
            <div className="space-y-4 max-h-80 overflow-y-auto no-scrollbar">
              {bibleNodes.length > 0 ? (
                bibleNodes.map(node => (
                  <div key={node.id} className="flex items-center justify-between p-4 border border-gray-100 rounded-xl hover:bg-gray-50 transition-all cursor-pointer group">
                    <span className="text-sm font-medium text-gray-900">{node.title}</span>
                    <button onClick={() => handleImportOutline(node.id)} className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-gray-900 p-2 rounded-lg hover:bg-gray-100">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                    </button>
                  </div>
                ))
              ) : (
                <div className="text-center py-12">
                  <p className="text-sm text-gray-400">暂无可用大纲，请先在故事蓝图中创建大纲。</p>
                </div>
              )}
            </div>
            <div className="flex justify-end">
              <button onClick={() => setShowOutlineImport(false)} className="px-8 py-3 bg-gray-100 text-gray-500 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-200 transition-all">关闭</button>
            </div>
          </div>
        </div>
      )}

      {!isFocusMode && (
        <div className="w-[280px] border-r border-gray-100 flex flex-col h-full bg-gray-50/30">
          <div className="h-14 px-6 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-10">
            <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">作品结构</h3>
            <div className="flex items-center gap-2">
              <div className="relative">
                <input
                  type="text"
                  placeholder="搜索内容..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="text-xs bg-gray-100 border border-gray-200 rounded-lg px-3 py-1.5 pr-8 focus:outline-none focus:ring-1 focus:ring-gray-300"
                />
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="absolute right-2.5 top-1/2 transform -translate-y-1/2 text-gray-400">
                  <circle cx="11" cy="11" r="8"/>
                  <path d="m21 21-4.35-4.35"/>
                </svg>
              </div>
              <button onClick={handleAddRootNode} className="text-gray-400 hover:text-gray-900 transition-colors">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>
              </button>
            </div>
          </div>
          <div className="p-4 pb-20 overflow-y-auto no-scrollbar">
            {externalNodes.map(node => (
              <TreeItem 
                key={node.id} 
                node={node} 
                activeId={activeNodeId} 
                onSelect={setActiveNodeId}
                onAddNode={handleAddNode}
                onRenameNode={handleRenameNode}
                onDeleteNode={handleDeleteNode}
                editingNodeId={editingNodeId}
                editInputRef={editInputRef}
                searchQuery={searchQuery}
              />
            ))}
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col bg-white relative">
        <header className={`h-14 px-10 border-b border-gray-50 flex items-center justify-between transition-all duration-700 ${isFocusMode ? 'opacity-0' : 'opacity-100'}`}>
          <div className="flex items-center gap-6">
             <span className="text-sm font-medium text-gray-900 tracking-tight">{activeNode?.title || '未选择'}</span>
             <span className="text-[10px] text-gray-300 font-mono tracking-widest uppercase">
               {activeNode?.content?.length || 0} 字
             </span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowOutlineImport(true)} className={`p-2 rounded-lg transition-all text-gray-300 hover:text-gray-600`}>
               <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            </button>
            <button onClick={() => setShowLibrary(!showLibrary)} className={`p-2 rounded-lg transition-all ${showLibrary ? 'bg-gray-100 text-gray-900' : 'text-gray-300 hover:text-gray-600'}`}>
               <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>
            </button>
            <button onClick={toggleFocus} className={`p-2 rounded-lg transition-all ${isFocusMode ? 'bg-gray-900 text-white' : 'text-gray-300 hover:text-gray-600'}`}>
               <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-10">
          <div className={`mx-auto max-w-2xl py-12 transition-all duration-1000 ${isFocusMode ? 'max-w-3xl' : ''}`}>
            {activeNode ? (
              <div className="space-y-8">
                {/* 文章简介 */}
                <div className="bg-gray-50/50 border border-gray-100 rounded-[2rem] p-8">
                  <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">文章简介</h3>
                  <textarea 
                    value={activeNode?.articleIntro || ''} 
                    onChange={(e) => updateArticleIntro(e.target.value)} 
                    placeholder="在此输入文章简介..." 
                    className="w-full bg-transparent border-none outline-none text-sm text-gray-600 leading-relaxed resize-none"
                    rows={4}
                  />
                </div>
                
                {/* 正文内容 */}
                <Editor 
                  key={activeNode.id} 
                  content={activeNode.content || ''} 
                  onChange={updateContent} 
                  placeholder="在此开始书写..."
                />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-200">
                <p className="text-xs font-bold uppercase tracking-widest italic">请从左侧选择一个章节开始创作</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <InspirationDrawer 
        isOpen={showLibrary} 
        onClose={() => setShowLibrary(false)} 
        characters={characters}
        events={events}
        onNavigate={onNavigate}
      />
    </div>
  );
};

const TreeItem: React.FC<any> = ({ node, activeId, onSelect, onAddNode, onRenameNode, onDeleteNode, editingNodeId, editInputRef, depth = 0, searchQuery = '' }) => {
  const [isOpen, setIsOpen] = useState(node.isOpen ?? true);
  const isActive = node.id === activeId;
  const isEditing = editingNodeId === node.id;

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

  const getIcon = () => {
    const s = isActive ? "stroke-gray-900" : "stroke-gray-300";
    switch (node.type) {
      case 'book': return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={s}><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>;
      case 'volume': return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={s}><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>;
      case 'chapter': return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={s}><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>;
      default: return <div className="w-1.5 h-1.5 bg-gray-200 rounded-full"/>;
    }
  };

  const handleAddNode = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onAddNode) {
      onAddNode(node.id);
    }
  };

  const handleDeleteNode = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDeleteNode) {
      onDeleteNode(node.id);
    }
  };

  const handleRenameNode = (e: React.FocusEvent) => {
    if (onRenameNode) {
      onRenameNode(node.id, e.target.value);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (onRenameNode) {
        onRenameNode(node.id, (e.target as HTMLInputElement).value);
      }
    } else if (e.key === 'Escape') {
      // 取消编辑
    }
  };

  return (
    <div className="mb-0.5">
      <div 
        className={`group flex items-center gap-2.5 py-1.5 px-3 rounded-lg cursor-pointer transition-all ${isActive ? 'bg-gray-100 shadow-sm' : 'hover:bg-gray-50'}`}
        onClick={() => onSelect(node.id)}
        onDoubleClick={() => onRenameNode && onRenameNode(node.id, node.title)}
      >
        <span className={`w-3 h-3 flex items-center justify-center text-[9px] text-gray-300 transition-transform ${isOpen ? 'rotate-0' : '-rotate-90'} ${!node.children?.length && 'invisible'}`} onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}>
          ▼
        </span>
        <span className="flex-shrink-0">{getIcon()}</span>
        {isEditing ? (
          <input 
            ref={editInputRef} 
            className="text-xs flex-1 bg-transparent border-none outline-none font-semibold text-gray-900"
            defaultValue={node.title}
            onBlur={handleRenameNode}
            onKeyDown={handleKeyDown}
          />
        ) : (
          <span className={`text-xs truncate flex-1 tracking-tight ${isActive ? 'font-semibold text-gray-900' : 'text-gray-500 font-light'}`}>
            {node.title}
          </span>
        )}
        <div className="flex items-center gap-1">
          <button 
            className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-300 hover:text-gray-600"
            onClick={handleAddNode}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          </button>
          <button 
            className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-300 hover:text-red-400"
            onClick={handleDeleteNode}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
          </button>
        </div>
      </div>
      {node.children && isOpen && (
        <div className="ml-5 mt-0.5 border-l border-gray-100 pl-2">
          {node.children.map((child: any) => (
            <TreeItem 
              key={child.id} 
              node={child} 
              activeId={activeId} 
              onSelect={onSelect} 
              onAddNode={onAddNode}
              onRenameNode={onRenameNode}
              onDeleteNode={onDeleteNode}
              editingNodeId={editingNodeId}
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

export default ProjectStudio;
