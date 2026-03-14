
import React, { useState, useEffect } from 'react';
import { AppSection, CharacterNode, CharacterLink, TimelineEvent, BibleNode, ProjectNode } from './types';
import Sidebar from './components/Sidebar';
import ProjectStudio from './components/ProjectStudio';
import CreativeLab from './components/CreativeLab';
import InspirationVault from './components/InspirationVault';
import Dashboard from './components/Dashboard';
import StoryBible from './components/StoryBible';

// --- INITIAL DATA ---
const INITIAL_CHARACTERS: CharacterNode[] = [
  { id: '1', name: '主角', role: '主角', faction: '主角阵营', bio: '你的主角描述...', avatar: 'https://i.pravatar.cc/150?u=1', x: 50, y: 50, color: 'border-indigo-500' },
  { id: '2', name: '配角', role: '配角', faction: '配角阵营', bio: '你的配角描述...', avatar: 'https://i.pravatar.cc/150?u=2', x: 20, y: 30, color: 'border-slate-500' },
];

const INITIAL_PROJECTS: ProjectNode[] = [
  {
    id: 'my_exercises',
    type: 'book',
    title: '创意练习集',
    isOpen: true,
    children: [
      { id: 'daily_ex', type: 'volume', title: '灵感日签', children: [] },
      { id: 'gallery_ex', type: 'volume', title: '脑洞画廊', children: [] },
      { id: 'slice_ex', type: 'volume', title: '光影切片', children: [] },
      { id: 'magic_ex', type: 'volume', title: '三词魔术', children: [] },
      { id: 'box_ex', type: 'volume', title: '剧情盲盒', children: [] },
    ]
  },
  {
    id: 'b1',
    type: 'book',
    title: '我的作品',
    isOpen: true,
    children: [
      {
        id: 'v1',
        type: 'volume',
        title: '第一卷',
        isOpen: true,
        children: [
          { id: 'c1', type: 'chapter', title: '第一章', content: '开始你的故事...', isOpen: true, children: [] },
        ]
      }
    ]
  }
];

// --- LOCAL STORAGE KEYS ---
const STORAGE_KEYS = {
  PROJECTS: 'musewriter_projects',
  CHARACTERS: 'musewriter_characters',
  LINKS: 'musewriter_links',
  EVENTS: 'musewriter_events',
  BIBLE_NODES: 'musewriter_bible_nodes'
};

const App: React.FC = () => {
  const [activeSection, setActiveSection] = useState<AppSection>(AppSection.DASHBOARD);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [labAutoStart, setLabAutoStart] = useState<string | null>(null);

  // Shared States
  const [projects, setProjects] = useState<ProjectNode[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.PROJECTS);
    return saved ? JSON.parse(saved) : INITIAL_PROJECTS;
  });
  const [characters, setCharacters] = useState<CharacterNode[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CHARACTERS);
    return saved ? JSON.parse(saved) : INITIAL_CHARACTERS;
  });
  const [links, setLinks] = useState<CharacterLink[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.LINKS);
    return saved ? JSON.parse(saved) : [];
  });
  const [events, setEvents] = useState<TimelineEvent[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.EVENTS);
    return saved ? JSON.parse(saved) : [];
  });
  const [bibleNodes, setBibleNodes] = useState<BibleNode[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.BIBLE_NODES);
    return saved ? JSON.parse(saved) : [];
  });

  // Save data to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects));
  }, [projects]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CHARACTERS, JSON.stringify(characters));
  }, [characters]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.LINKS, JSON.stringify(links));
  }, [links]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(events));
  }, [events]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.BIBLE_NODES, JSON.stringify(bibleNodes));
  }, [bibleNodes]);

  const handleNavigate = (section: AppSection, params?: any) => {
    setActiveSection(section);
    if (section === AppSection.CREATIVE_LAB && params?.exercise) {
      setLabAutoStart(params.exercise);
    } else {
      setLabAutoStart(null);
    }
  };

  const handleSaveExercise = (type: string, title: string, content: string) => {
    const typeMap: Record<string, string> = {
      'daily': 'daily_ex',
      'image': 'gallery_ex',
      'video': 'slice_ex',
      'three_word': 'magic_ex',
      'random': 'box_ex'
    };
    
    const targetFolderId = typeMap[type];
    const timestamp = new Date().toLocaleString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    
    const newNode: ProjectNode = {
      id: `ex_${Date.now()}`,
      type: 'chapter',
      title: `${title} (${timestamp})`,
      content: content,
      children: []
    };

    setProjects(prev => {
      return prev.map(book => {
        if (book.id === 'my_exercises') {
          return {
            ...book,
            children: book.children?.map(folder => {
              if (folder.id === targetFolderId) {
                return { ...folder, children: [newNode, ...(folder.children || [])] };
              }
              return folder;
            })
          };
        }
        return book;
      });
    });
  };

  return (
    <div className="flex h-screen w-full bg-slate-50 overflow-hidden">
      {!isFocusMode && <Sidebar activeSection={activeSection} onNavigate={handleNavigate} />}
      <main className="flex-1 flex flex-col relative">
        <SectionRenderer 
          section={activeSection} 
          isFocusMode={isFocusMode} 
          toggleFocus={() => setIsFocusMode(!isFocusMode)} 
          navigateToSection={handleNavigate}
          labInitialExercise={labAutoStart}
          projects={projects}
          onUpdateProjects={setProjects}
          onSaveExercise={handleSaveExercise}
          storyData={{ characters, events, links, bibleNodes }}
          setCharacters={setCharacters}
          setEvents={setEvents}
          setLinks={setLinks}
          setBibleNodes={setBibleNodes}
        />
      </main>
    </div>
  );
};

const SectionRenderer: React.FC<any> = ({ 
  section, isFocusMode, toggleFocus, navigateToSection, 
  labInitialExercise, projects, onUpdateProjects, onSaveExercise, 
  storyData, setCharacters, setEvents, setLinks, setBibleNodes 
}) => {
  switch (section) {
    case AppSection.DASHBOARD:
      return <Dashboard onNavigate={navigateToSection} />;
    case AppSection.PROJECT_STUDIO:
      return <ProjectStudio isFocusMode={isFocusMode} toggleFocus={toggleFocus} characters={storyData.characters} events={storyData.events} bibleNodes={storyData.bibleNodes} onNavigate={navigateToSection} externalNodes={projects} onNodesChange={onUpdateProjects} />;
    case AppSection.STORY_BIBLE:
      return (
        <StoryBible 
          characters={storyData.characters} 
          setCharacters={setCharacters} 
          links={storyData.links} 
          setLinks={setLinks} 
          events={storyData.events} 
          setEvents={setEvents} 
          bibleNodes={storyData.bibleNodes} 
          setBibleNodes={setBibleNodes} 
        />
      );
    case AppSection.CREATIVE_LAB:
      return <CreativeLab initialExercise={labInitialExercise} onSaveToProject={onSaveExercise} />;
    case AppSection.INSPIRATION_VAULT:
      return <InspirationVault />;
    default:
      return <Dashboard onNavigate={navigateToSection} />;
  }
};

export default App;
