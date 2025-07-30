// Popup script for MangaTrackMuse extension
class MangaExtensionPopup {
  constructor() {
    this.init();
  }

  async init() {
    try {
      // Load the React app build
      await this.loadReactApp();
      
      // Initialize manga data
      await this.initializeMangaData();
      
      // Setup event listeners
      this.setupEventListeners();
      
      console.log('MangaTrackMuse popup initialized');
    } catch (error) {
      console.error('Error initializing popup:', error);
      this.showError('Erro ao carregar a extensão');
    }
  }

  async loadReactApp() {
    // In a real extension, you'd load the built React app
    // For now, we'll create a basic interface
    const root = document.getElementById('popup-root');
    root.innerHTML = `
      <div style="padding: 16px; height: 100%; box-sizing: border-box;">
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 16px;">
          <img src="icons/icon48.png" width="24" height="24" style="border-radius: 4px;">
          <h1 style="margin: 0; font-size: 18px; font-weight: 600;">MangaTrackMuse</h1>
        </div>
        
        <div style="background: #1a1a1a; border-radius: 8px; padding: 12px; margin-bottom: 12px;">
          <h3 style="margin: 0 0 8px 0; font-size: 14px; color: #8b5cf6;">Site Atual</h3>
          <p id="current-site" style="margin: 0; font-size: 12px; color: #888;">Detectando...</p>
        </div>
        
        <div style="background: #1a1a1a; border-radius: 8px; padding: 12px; margin-bottom: 12px;">
          <h3 style="margin: 0 0 8px 0; font-size: 14px; color: #8b5cf6;">Mangás Recentes</h3>
          <div id="recent-manga" style="color: #888; font-size: 12px;">Carregando...</div>
        </div>
        
        <div style="display: flex; gap: 8px; margin-top: auto;">
          <button id="add-manga" style="flex: 1; background: #8b5cf6; color: white; border: none; padding: 8px 12px; border-radius: 6px; font-size: 12px; cursor: pointer;">
            Adicionar Mangá
          </button>
          <button id="settings" style="background: #333; color: white; border: none; padding: 8px 12px; border-radius: 6px; font-size: 12px; cursor: pointer;">
            ⚙️
          </button>
        </div>
      </div>
    `;
  }

  async initializeMangaData() {
    try {
      // Get current tab info
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      const currentSite = this.detectMangaSite(tab.url);
      
      document.getElementById('current-site').textContent = currentSite || 'Site não suportado';
      
      // Load manga data from storage
      const data = await chrome.storage.local.get(['mangaList']);
      const mangaList = data.mangaList || [];
      
      this.displayRecentManga(mangaList);
    } catch (error) {
      console.error('Error loading manga data:', error);
    }
  }

  detectMangaSite(url) {
    if (!url) return null;
    
    const sites = {
      'mangadx.org': 'MangaDex',
      'mangakakalot.com': 'Mangakakalot',
      'manganelo.com': 'Manganelo',
      'readmanganato.com': 'Manganato',
      'mangareader.net': 'MangaReader',
      'mangafreak.net': 'MangaFreak',
      'kissmanga.org': 'KissManga',
      'mangahere.cc': 'MangaHere',
      'mangafox.me': 'MangaFox',
      'mangapark.net': 'MangaPark'
    };

    for (const [domain, name] of Object.entries(sites)) {
      if (url.includes(domain)) {
        return name;
      }
    }
    
    return null;
  }

  displayRecentManga(mangaList) {
    const container = document.getElementById('recent-manga');
    
    if (mangaList.length === 0) {
      container.innerHTML = '<p style="margin: 0; color: #666;">Nenhum mangá encontrado</p>';
      return;
    }

    // Sort by last read and take first 3
    const recent = mangaList
      .sort((a, b) => new Date(b.lastRead) - new Date(a.lastRead))
      .slice(0, 3);

    container.innerHTML = recent.map(manga => `
      <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid #333;">
        <div style="flex: 1;">
          <div style="font-size: 12px; font-weight: 500; color: white; margin-bottom: 2px;">
            ${manga.title}
          </div>
          <div style="font-size: 10px; color: #888;">
            Cap. ${manga.currentChapter} • ${this.formatDate(manga.lastRead)}
          </div>
        </div>
        <button onclick="window.mangaPopup.openManga('${manga.id}')" 
                style="background: #8b5cf6; color: white; border: none; padding: 4px 8px; border-radius: 4px; font-size: 10px; cursor: pointer;">
          Ler
        </button>
      </div>
    `).join('');
  }

  formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 60) return `${minutes}m atrás`;
    if (hours < 24) return `${hours}h atrás`;
    return `${days}d atrás`;
  }

  setupEventListeners() {
    document.getElementById('add-manga').addEventListener('click', () => {
      this.addCurrentManga();
    });
    
    document.getElementById('settings').addEventListener('click', () => {
      chrome.tabs.create({ url: chrome.runtime.getURL('options.html') });
    });
  }

  async addCurrentManga() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      // Send message to content script to extract manga info
      const response = await chrome.tabs.sendMessage(tab.id, { action: 'extractMangaInfo' });
      
      if (response && response.success) {
        // Save manga to storage
        const data = await chrome.storage.local.get(['mangaList']);
        const mangaList = data.mangaList || [];
        
        const newManga = {
          id: Date.now().toString(),
          title: response.title,
          currentChapter: response.chapter,
          url: tab.url,
          site: this.detectMangaSite(tab.url),
          lastRead: new Date().toISOString()
        };
        
        // Check if manga already exists
        const existingIndex = mangaList.findIndex(m => m.title === newManga.title);
        if (existingIndex >= 0) {
          mangaList[existingIndex] = newManga;
        } else {
          mangaList.push(newManga);
        }
        
        await chrome.storage.local.set({ mangaList });
        
        // Refresh display
        this.displayRecentManga(mangaList);
        
        // Show success feedback
        this.showToast('Mangá adicionado com sucesso!');
      } else {
        this.showToast('Não foi possível detectar informações do mangá');
      }
    } catch (error) {
      console.error('Error adding manga:', error);
      this.showToast('Erro ao adicionar mangá');
    }
  }

  async openManga(mangaId) {
    try {
      const data = await chrome.storage.local.get(['mangaList']);
      const mangaList = data.mangaList || [];
      const manga = mangaList.find(m => m.id === mangaId);
      
      if (manga) {
        chrome.tabs.create({ url: manga.url });
      }
    } catch (error) {
      console.error('Error opening manga:', error);
    }
  }

  showToast(message) {
    const toast = document.createElement('div');
    toast.style.cssText = `
      position: fixed;
      bottom: 16px;
      left: 50%;
      transform: translateX(-50%);
      background: #333;
      color: white;
      padding: 8px 12px;
      border-radius: 6px;
      font-size: 12px;
      z-index: 1000;
    `;
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
      document.body.removeChild(toast);
    }, 3000);
  }

  showError(message) {
    const root = document.getElementById('popup-root');
    root.innerHTML = `
      <div style="padding: 16px; text-align: center;">
        <p style="color: #ff6b6b; margin-bottom: 16px;">${message}</p>
        <button onclick="location.reload()" style="background: #8b5cf6; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer;">
          Tentar Novamente
        </button>
      </div>
    `;
  }
}

// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.mangaPopup = new MangaExtensionPopup();
});