import MangaExtensionPopup from '@/components/MangaExtensionPopup';

const Index = () => {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-8">
      <div className="text-center space-y-8">
        <div className="space-y-4">
          <h1 className="text-4xl font-bold text-foreground">Extensão de Mangás</h1>
          <p className="text-xl text-muted-foreground">Preview da interface da popup</p>
        </div>
        
        <div className="flex justify-center">
          <div className="border border-border/40 rounded-lg shadow-float">
            <MangaExtensionPopup />
          </div>
        </div>
        
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          Interface otimizada para popup de extensão (400x600px) com tema escuro e design moderno
        </p>
      </div>
    </div>
  );
};

export default Index;
