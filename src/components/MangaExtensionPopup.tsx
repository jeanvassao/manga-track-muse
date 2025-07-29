import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { BookOpen, Plus, Settings, Download, ExternalLink, ChevronDown, Globe, Calendar, Bookmark, List, Clock } from 'lucide-react';

interface MangaData {
  id: string;
  title: string;
  lastChapter: number;
  lastReadDate: string;
  currentSite: string;
  alternativeSites: string[];
  coverUrl?: string;
  nextChapterUrl: string;
}

const mockMangaData: MangaData[] = [
  {
    id: '1',
    title: 'One Piece',
    lastChapter: 1096,
    lastReadDate: '2024-01-28',
    currentSite: 'mangahost.net',
    alternativeSites: ['mangayabu.top', 'unionmangas.com', 'lermanga.org'],
    nextChapterUrl: 'https://mangahost.net/manga/one-piece/1097'
  },
  {
    id: '2',
    title: 'Attack on Titan',
    lastChapter: 139,
    lastReadDate: '2024-01-27',
    currentSite: 'unionmangas.com',
    alternativeSites: ['mangahost.net', 'lermanga.org'],
    nextChapterUrl: 'https://unionmangas.com/manga/attack-on-titan/140'
  },
  {
    id: '3',
    title: 'Demon Slayer',
    lastChapter: 205,
    lastReadDate: '2024-01-26',
    currentSite: 'lermanga.org',
    alternativeSites: ['mangahost.net', 'mangayabu.top'],
    nextChapterUrl: 'https://lermanga.org/manga/demon-slayer/206'
  },
  {
    id: '4',
    title: 'Naruto',
    lastChapter: 650,
    lastReadDate: '2024-01-25',
    currentSite: 'mangahost.net',
    alternativeSites: ['unionmangas.com', 'lermanga.org'],
    nextChapterUrl: 'https://mangahost.net/manga/naruto/651'
  },
  {
    id: '5',
    title: 'My Hero Academia',
    lastChapter: 380,
    lastReadDate: '2024-01-24',
    currentSite: 'mangayabu.top',
    alternativeSites: ['mangahost.net', 'unionmangas.com'],
    nextChapterUrl: 'https://mangayabu.top/manga/my-hero-academia/381'
  },
  {
    id: '6',
    title: 'Jujutsu Kaisen',
    lastChapter: 245,
    lastReadDate: '2024-01-23',
    currentSite: 'lermanga.org',
    alternativeSites: ['mangahost.net', 'mangayabu.top'],
    nextChapterUrl: 'https://lermanga.org/manga/jujutsu-kaisen/246'
  },
  {
    id: '7',
    title: 'Dragon Ball',
    lastChapter: 519,
    lastReadDate: '2024-01-20',
    currentSite: 'unionmangas.com',
    alternativeSites: ['mangahost.net', 'lermanga.org'],
    nextChapterUrl: 'https://unionmangas.com/manga/dragon-ball/520'
  }
];

const MangaCard: React.FC<{ manga: MangaData }> = ({ manga }) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', { 
      day: '2-digit', 
      month: 'short' 
    });
  };

  const handleContinueReading = () => {
    window.open(manga.nextChapterUrl, '_blank');
  };

  const handleSiteSelect = (site: string) => {
    // Simular URL para outros sites
    const baseUrl = `https://${site}/manga/${manga.title.toLowerCase().replace(/\s+/g, '-')}/${manga.lastChapter + 1}`;
    window.open(baseUrl, '_blank');
  };

  return (
    <Card className="bg-manga-surface border-border/40 hover:bg-manga-surface-hover transition-all duration-300 shadow-card hover:shadow-glow group">
      <div className="p-4 space-y-3">
        {/* Título e informações básicas */}
        <div className="space-y-2">
          <h3 className="font-semibold text-foreground text-lg leading-tight group-hover:text-primary-glow transition-colors">
            {manga.title}
          </h3>
          
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Bookmark className="w-3.5 h-3.5 text-manga-chapter" />
              <span>Cap. {manga.lastChapter}</span>
            </div>
            
            <div className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              <span>{formatDate(manga.lastReadDate)}</span>
            </div>
          </div>

          <div className="flex items-center gap-1 text-xs text-manga-site">
            <Globe className="w-3 h-3" />
            <span>lido em {manga.currentSite}</span>
          </div>
        </div>

        {/* Botões de ação */}
        <div className="flex gap-2 pt-2">
          <Button 
            onClick={handleContinueReading}
            className="flex-1 bg-gradient-primary hover:shadow-glow text-primary-foreground font-medium transition-all duration-300"
            size="sm"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Continuar Lendo
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="outline" 
                size="sm"
                className="border-border/40 hover:bg-manga-surface-hover hover:border-primary/40"
              >
                <ChevronDown className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent 
              align="end" 
              className="bg-popover border-border/40 shadow-float"
            >
              <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                Outros sites:
              </div>
              {manga.alternativeSites.map((site) => (
                <DropdownMenuItem 
                  key={site}
                  onClick={() => handleSiteSelect(site)}
                  className="hover:bg-manga-surface cursor-pointer"
                >
                  <Globe className="w-3.5 h-3.5 mr-2" />
                  {site}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </Card>
  );
};

const MangaListItem: React.FC<{ manga: MangaData }> = ({ manga }) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const diffTime = today.getTime() - date.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'hoje';
    if (diffDays === 1) return 'ontem';
    if (diffDays < 7) return `${diffDays}d atrás`;
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
  };

  const handleContinueReading = () => {
    window.open(manga.nextChapterUrl, '_blank');
  };

  return (
    <div className="group hover:bg-manga-surface/50 rounded-lg p-3 transition-colors duration-200 cursor-pointer border border-transparent hover:border-border/30">
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-foreground text-sm truncate group-hover:text-primary-glow transition-colors">
            {manga.title}
          </h3>
          <div className="flex items-center gap-3 mt-1">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Bookmark className="w-3 h-3 text-manga-chapter" />
              <span>Cap. {manga.lastChapter}</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="w-3 h-3" />
              <span>{formatDate(manga.lastReadDate)}</span>
            </div>
          </div>
        </div>
        
        <Button
          onClick={handleContinueReading}
          size="sm"
          className="ml-3 h-7 px-3 bg-gradient-primary hover:shadow-glow text-primary-foreground text-xs opacity-0 group-hover:opacity-100 transition-all duration-200"
        >
          <ExternalLink className="w-3 h-3 mr-1" />
          Ler
        </Button>
      </div>
    </div>
  );
};

const MangaExtensionPopup: React.FC = () => {
  const [mangaList] = useState<MangaData[]>(mockMangaData);
  const recentManga = mangaList.slice(0, 3); // Primeiros 3 para aba recentes

  return (
    <div className="w-[400px] h-[600px] bg-background flex flex-col overflow-hidden">
      {/* Background glow effect */}
      <div className="absolute inset-0 bg-gradient-glow pointer-events-none" />
      
      {/* Header */}
      <div className="relative bg-gradient-card border-b border-border/40 p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-primary rounded-lg shadow-glow">
            <BookOpen className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">Marcador de Mangás</h1>
            <p className="text-xs text-muted-foreground">Seus mangás em um lugar</p>
          </div>
        </div>
      </div>

      {/* Content with Tabs */}
      <div className="flex-1 overflow-hidden">
        <Tabs defaultValue="recent" className="h-full flex flex-col">
          <div className="px-4 pt-3">
            <TabsList className="grid w-full grid-cols-2 bg-manga-surface/50 border border-border/30">
              <TabsTrigger 
                value="recent" 
                className="data-[state=active]:bg-gradient-primary data-[state=active]:text-primary-foreground text-xs font-medium"
              >
                <Clock className="w-3.5 h-3.5 mr-1" />
                Recentes
              </TabsTrigger>
              <TabsTrigger 
                value="all" 
                className="data-[state=active]:bg-gradient-primary data-[state=active]:text-primary-foreground text-xs font-medium"
              >
                <List className="w-3.5 h-3.5 mr-1" />
                Todos ({mangaList.length})
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="recent" className="flex-1 overflow-auto p-4 pt-3 space-y-3 mt-0">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-secondary-foreground">
                Leituras Recentes
              </h2>
              <span className="text-xs text-muted-foreground">
                {recentManga.length} mangás
              </span>
            </div>

            {recentManga.map((manga) => (
              <MangaCard key={manga.id} manga={manga} />
            ))}
          </TabsContent>

          <TabsContent value="all" className="flex-1 overflow-auto p-4 pt-3 mt-0">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-secondary-foreground">
                Lista Completa
              </h2>
              <span className="text-xs text-muted-foreground">
                {mangaList.length} mangás
              </span>
            </div>

            <div className="space-y-1">
              {mangaList.map((manga) => (
                <MangaListItem key={manga.id} manga={manga} />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Floating Add Button */}
      <div className="absolute bottom-20 right-4">
        <Button
          size="sm"
          className="bg-gradient-primary hover:shadow-glow text-primary-foreground rounded-full w-12 h-12 p-0 shadow-float"
        >
          <Plus className="w-5 h-5" />
        </Button>
      </div>

      {/* Footer */}
      <div className="bg-gradient-card border-t border-border/40 p-3">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-4">
            <button className="flex items-center gap-1 text-muted-foreground hover:text-primary transition-colors">
              <Settings className="w-3.5 h-3.5" />
              Configurações
            </button>
            <button className="flex items-center gap-1 text-muted-foreground hover:text-primary transition-colors">
              <Download className="w-3.5 h-3.5" />
              Backup
            </button>
          </div>
          <span className="text-muted-foreground">v1.0.0</span>
        </div>
      </div>
    </div>
  );
};

export default MangaExtensionPopup;