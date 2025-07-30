// Background script for MangaTrackMuse extension
class MangaTrackBackground {
  constructor() {
    this.init();
  }

  init() {
    // Listen for extension installation
    chrome.runtime.onInstalled.addListener((details) => {
      this.handleInstallation(details);
    });

    // Listen for tab updates
    chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
      this.handleTabUpdate(tabId, changeInfo, tab);
    });

    // Listen for messages from content scripts and popup
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      this.handleMessage(message, sender, sendResponse);
      return true; // Keep message channel open for async response
    });

    // Listen for storage changes
    chrome.storage.onChanged.addListener((changes, namespace) => {
      this.handleStorageChange(changes, namespace);
    });

    console.log('MangaTrackMuse background script initialized');
  }

  async handleInstallation(details) {
    if (details.reason === 'install') {
      console.log('MangaTrackMuse extension installed');
      
      // Initialize default storage
      await this.initializeStorage();
      
      // Show welcome notification
      this.showNotification('welcome', {
        type: 'basic',
        iconUrl: 'icons/icon48.png',
        title: 'MangaTrackMuse Instalado!',
        message: 'Clique no ícone da extensão para começar a rastrear seus mangás.'
      });
    } else if (details.reason === 'update') {
      console.log('MangaTrackMuse extension updated');
    }
  }

  async initializeStorage() {
    const defaultData = {
      mangaList: [],
      settings: {
        autoDetect: true,
        notifications: true,
        syncInterval: 30, // minutes
        preferredSites: ['mangadx.org', 'mangakakalot.com']
      },
      lastSync: null
    };

    // Only set if doesn't exist
    const existing = await chrome.storage.local.get(Object.keys(defaultData));
    const updates = {};
    
    for (const [key, value] of Object.entries(defaultData)) {
      if (!(key in existing)) {
        updates[key] = value;
      }
    }

    if (Object.keys(updates).length > 0) {
      await chrome.storage.local.set(updates);
      console.log('Default storage initialized:', updates);
    }
  }

  handleTabUpdate(tabId, changeInfo, tab) {
    // Only process when page is completely loaded
    if (changeInfo.status !== 'complete' || !tab.url) return;

    // Check if this is a manga site
    const mangaSite = this.detectMangaSite(tab.url);
    if (mangaSite) {
      console.log(`Manga site detected: ${mangaSite} on tab ${tabId}`);
      
      // Update extension badge
      chrome.action.setBadgeText({
        text: '📖',
        tabId: tabId
      });
      
      chrome.action.setBadgeBackgroundColor({
        color: '#8b5cf6',
        tabId: tabId
      });

      // Auto-detect manga if enabled
      this.autoDetectManga(tabId, tab);
    } else {
      // Clear badge for non-manga sites
      chrome.action.setBadgeText({
        text: '',
        tabId: tabId
      });
    }
  }

  async handleMessage(message, sender, sendResponse) {
    try {
      switch (message.action) {
        case 'detectMangaSite':
          const site = this.detectMangaSite(message.url);
          sendResponse({ success: true, site });
          break;

        case 'saveMangaProgress':
          await this.saveMangaProgress(message.data);
          sendResponse({ success: true });
          break;

        case 'getMangaList':
          const data = await chrome.storage.local.get(['mangaList']);
          sendResponse({ success: true, mangaList: data.mangaList || [] });
          break;

        case 'updateMangaChapter':
          await this.updateMangaChapter(message.mangaId, message.chapter);
          sendResponse({ success: true });
          break;

        case 'notifyMangaRead':
          await this.handleMangaRead(message.mangaInfo);
          sendResponse({ success: true });
          break;

        default:
          console.warn('Unknown message action:', message.action);
          sendResponse({ success: false, error: 'Unknown action' });
      }
    } catch (error) {
      console.error('Error handling message:', error);
      sendResponse({ success: false, error: error.message });
    }
  }

  handleStorageChange(changes, namespace) {
    if (namespace === 'local') {
      console.log('Storage changed:', changes);
      
      // Notify popup of changes if needed
      chrome.runtime.sendMessage({
        action: 'storageChanged',
        changes
      }).catch(() => {
        // Popup might not be open, ignore error
      });
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

  async autoDetectManga(tabId, tab) {
    try {
      const settings = await this.getSettings();
      if (!settings.autoDetect) return;

      // Send message to content script to extract manga info
      const response = await chrome.tabs.sendMessage(tabId, {
        action: 'autoExtractMangaInfo'
      });

      if (response && response.success && response.mangaInfo) {
        console.log('Auto-detected manga:', response.mangaInfo);
        
        // Save or update manga progress
        await this.saveMangaProgress({
          ...response.mangaInfo,
          url: tab.url,
          site: this.detectMangaSite(tab.url),
          lastRead: new Date().toISOString()
        });
      }
    } catch (error) {
      // Content script might not be ready, ignore error
      console.debug('Auto-detect failed:', error.message);
    }
  }

  async saveMangaProgress(mangaData) {
    const data = await chrome.storage.local.get(['mangaList']);
    const mangaList = data.mangaList || [];
    
    // Find existing manga by title and site
    const existingIndex = mangaList.findIndex(m => 
      m.title === mangaData.title && m.site === mangaData.site
    );
    
    const mangaEntry = {
      id: existingIndex >= 0 ? mangaList[existingIndex].id : Date.now().toString(),
      title: mangaData.title,
      currentChapter: mangaData.currentChapter || mangaData.chapter,
      url: mangaData.url,
      site: mangaData.site,
      lastRead: mangaData.lastRead || new Date().toISOString(),
      totalChapters: mangaData.totalChapters,
      thumbnail: mangaData.thumbnail,
      alternativeSites: mangaData.alternativeSites || []
    };
    
    if (existingIndex >= 0) {
      mangaList[existingIndex] = mangaEntry;
    } else {
      mangaList.push(mangaEntry);
    }
    
    await chrome.storage.local.set({ mangaList });
    console.log('Manga progress saved:', mangaEntry);
    
    // Show notification if new manga or chapter progress
    if (existingIndex < 0 || mangaList[existingIndex].currentChapter !== mangaEntry.currentChapter) {
      this.showProgressNotification(mangaEntry);
    }
  }

  async updateMangaChapter(mangaId, chapter) {
    const data = await chrome.storage.local.get(['mangaList']);
    const mangaList = data.mangaList || [];
    
    const mangaIndex = mangaList.findIndex(m => m.id === mangaId);
    if (mangaIndex >= 0) {
      mangaList[mangaIndex].currentChapter = chapter;
      mangaList[mangaIndex].lastRead = new Date().toISOString();
      
      await chrome.storage.local.set({ mangaList });
      console.log('Manga chapter updated:', mangaList[mangaIndex]);
    }
  }

  async handleMangaRead(mangaInfo) {
    // Update reading statistics
    const stats = await this.getReadingStats();
    stats.totalChaptersRead = (stats.totalChaptersRead || 0) + 1;
    stats.lastReadDate = new Date().toISOString();
    
    await chrome.storage.local.set({ readingStats: stats });
    
    // Update manga progress
    await this.saveMangaProgress(mangaInfo);
  }

  async getSettings() {
    const data = await chrome.storage.local.get(['settings']);
    return data.settings || {};
  }

  async getReadingStats() {
    const data = await chrome.storage.local.get(['readingStats']);
    return data.readingStats || {};
  }

  showNotification(id, options) {
    if (chrome.notifications) {
      chrome.notifications.create(id, options);
    }
  }

  showProgressNotification(manga) {
    this.showNotification(`progress_${manga.id}`, {
      type: 'basic',
      iconUrl: 'icons/icon48.png',
      title: 'Progresso Atualizado',
      message: `${manga.title} - Capítulo ${manga.currentChapter}`
    });
  }
}

// Initialize background script
new MangaTrackBackground();