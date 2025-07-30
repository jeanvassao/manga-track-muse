// Content script for MangaTrackMuse extension
class MangaContentScript {
  constructor() {
    this.site = this.detectCurrentSite();
    this.init();
  }

  init() {
    // Listen for messages from background/popup
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      this.handleMessage(message, sender, sendResponse);
      return true; // Keep message channel open
    });

    // Auto-detect manga info when page loads
    if (this.site) {
      this.detectMangaInfo();
    }

    console.log('MangaTrackMuse content script loaded on:', this.site || 'unknown site');
  }

  detectCurrentSite() {
    const url = window.location.href;
    const hostname = window.location.hostname;

    const sites = {
      'mangadx.org': 'mangadex',
      'mangakakalot.com': 'mangakakalot', 
      'manganelo.com': 'manganelo',
      'readmanganato.com': 'manganato',
      'mangareader.net': 'mangareader',
      'mangafreak.net': 'mangafreak',
      'kissmanga.org': 'kissmanga',
      'mangahere.cc': 'mangahere',
      'mangafox.me': 'mangafox',
      'mangapark.net': 'mangapark'
    };

    for (const [domain, name] of Object.entries(sites)) {
      if (hostname.includes(domain) || url.includes(domain)) {
        return name;
      }
    }

    return null;
  }

  async handleMessage(message, sender, sendResponse) {
    try {
      switch (message.action) {
        case 'extractMangaInfo':
          const mangaInfo = await this.extractMangaInfo();
          sendResponse({ success: true, ...mangaInfo });
          break;

        case 'autoExtractMangaInfo':
          const autoInfo = await this.extractMangaInfo();
          if (autoInfo.title && autoInfo.chapter) {
            sendResponse({ success: true, mangaInfo: autoInfo });
          } else {
            sendResponse({ success: false });
          }
          break;

        case 'detectSite':
          sendResponse({ success: true, site: this.site });
          break;

        default:
          sendResponse({ success: false, error: 'Unknown action' });
      }
    } catch (error) {
      console.error('Content script error:', error);
      sendResponse({ success: false, error: error.message });
    }
  }

  async detectMangaInfo() {
    try {
      const info = await this.extractMangaInfo();
      if (info.title && info.chapter) {
        // Notify background script about manga reading
        chrome.runtime.sendMessage({
          action: 'notifyMangaRead',
          mangaInfo: {
            ...info,
            url: window.location.href,
            site: this.site
          }
        });
      }
    } catch (error) {
      console.debug('Auto-detect manga info failed:', error);
    }
  }

  async extractMangaInfo() {
    if (!this.site) {
      throw new Error('Unknown manga site');
    }

    const extractors = {
      mangadex: this.extractMangaDx.bind(this),
      mangakakalot: this.extractMangakakalot.bind(this),
      manganelo: this.extractManganelo.bind(this),
      manganato: this.extractManganato.bind(this),
      mangareader: this.extractMangaReader.bind(this),
      mangafreak: this.extractMangaFreak.bind(this),
      kissmanga: this.extractKissManga.bind(this),
      mangahere: this.extractMangaHere.bind(this),
      mangafox: this.extractMangaFox.bind(this),
      mangapark: this.extractMangaPark.bind(this)
    };

    const extractor = extractors[this.site];
    if (!extractor) {
      throw new Error(`No extractor for site: ${this.site}`);
    }

    return await extractor();
  }

  extractMangaDx() {
    const title = this.getTextContent('h1', '.manga-title', '[data-title]');
    const chapterElement = document.querySelector('.chapter-title, .chapter-name, [class*="chapter"]');
    const chapter = this.extractChapterNumber(chapterElement?.textContent);
    const thumbnail = document.querySelector('.manga-cover img, .cover img')?.src;

    return {
      title: this.cleanTitle(title),
      chapter: chapter,
      thumbnail: thumbnail
    };
  }

  extractMangakakalot() {
    const title = this.getTextContent('h1', '.manga-info-title', '.info-title');
    const chapterText = this.getTextContent('.chapter-name', '.chapter-title', '.breadcrumb');
    const chapter = this.extractChapterNumber(chapterText);
    const thumbnail = document.querySelector('.manga-info-pic img, .info-pic img')?.src;

    return {
      title: this.cleanTitle(title),
      chapter: chapter,
      thumbnail: thumbnail
    };
  }

  extractManganelo() {
    const title = this.getTextContent('h1', '.story-info-right h1', '.info-title');
    const chapterText = this.getTextContent('.panel-chapter-info-title', '.chapter-name');
    const chapter = this.extractChapterNumber(chapterText);
    const thumbnail = document.querySelector('.story-info-left img, .info-image img')?.src;

    return {
      title: this.cleanTitle(title),
      chapter: chapter,
      thumbnail: thumbnail
    };
  }

  extractManganato() {
    const title = this.getTextContent('h1', '.story-info-right h1', '.info-title');
    const chapterText = this.getTextContent('.panel-chapter-info-title', '.chapter-name');
    const chapter = this.extractChapterNumber(chapterText);
    const thumbnail = document.querySelector('.story-info-left img, .info-image img')?.src;

    return {
      title: this.cleanTitle(title),
      chapter: chapter,
      thumbnail: thumbnail
    };
  }

  extractMangaReader() {
    const title = this.getTextContent('h1', '.manga-title', '.series-title');
    const chapterText = this.getTextContent('.chapter-title', '.page-title', '.breadcrumb');
    const chapter = this.extractChapterNumber(chapterText);
    const thumbnail = document.querySelector('.series-cover img, .manga-cover img')?.src;

    return {
      title: this.cleanTitle(title),
      chapter: chapter,
      thumbnail: thumbnail
    };
  }

  extractMangaFreak() {
    const title = this.getTextContent('h1', '.manga-title', '.series-title');
    const chapterText = this.getTextContent('.chapter-title', '.page-title');
    const chapter = this.extractChapterNumber(chapterText);
    const thumbnail = document.querySelector('.manga-cover img, .series-cover img')?.src;

    return {
      title: this.cleanTitle(title),
      chapter: chapter,
      thumbnail: thumbnail
    };
  }

  extractKissManga() {
    const title = this.getTextContent('h1', '.manga-title', '.info-title');
    const chapterText = this.getTextContent('.chapter-title', '.chapter-name');
    const chapter = this.extractChapterNumber(chapterText);
    const thumbnail = document.querySelector('.manga-cover img, .info-cover img')?.src;

    return {
      title: this.cleanTitle(title),
      chapter: chapter,
      thumbnail: thumbnail
    };
  }

  extractMangaHere() {
    const title = this.getTextContent('h1', '.manga-title', '.detail-title');
    const chapterText = this.getTextContent('.chapter-title', '.reader-title');
    const chapter = this.extractChapterNumber(chapterText);
    const thumbnail = document.querySelector('.manga-cover img, .detail-cover img')?.src;

    return {
      title: this.cleanTitle(title),
      chapter: chapter,
      thumbnail: thumbnail
    };
  }

  extractMangaFox() {
    const title = this.getTextContent('h1', '.manga-title', '.detail-title');
    const chapterText = this.getTextContent('.chapter-title', '.reader-title');
    const chapter = this.extractChapterNumber(chapterText);
    const thumbnail = document.querySelector('.manga-cover img, .detail-cover img')?.src;

    return {
      title: this.cleanTitle(title),
      chapter: chapter,
      thumbnail: thumbnail
    };
  }

  extractMangaPark() {
    const title = this.getTextContent('h1', '.manga-title', '.series-title');
    const chapterText = this.getTextContent('.chapter-title', '.episode-title');
    const chapter = this.extractChapterNumber(chapterText);
    const thumbnail = document.querySelector('.manga-cover img, .series-cover img')?.src;

    return {
      title: this.cleanTitle(title),
      chapter: chapter,
      thumbnail: thumbnail
    };
  }

  getTextContent(...selectors) {
    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element?.textContent?.trim()) {
        return element.textContent.trim();
      }
    }
    return '';
  }

  extractChapterNumber(text) {
    if (!text) return null;
    
    // Common patterns for chapter numbers
    const patterns = [
      /chapter\s*(\d+(?:\.\d+)?)/i,
      /cap(?:ítulo)?\s*(\d+(?:\.\d+)?)/i,
      /ch\s*(\d+(?:\.\d+)?)/i,
      /(\d+(?:\.\d+)?)/
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        const num = parseFloat(match[1]);
        return isNaN(num) ? null : num;
      }
    }

    return null;
  }

  cleanTitle(title) {
    if (!title) return '';
    
    // Remove common suffixes and prefixes
    return title
      .replace(/\s*-\s*read\s*online/i, '')
      .replace(/\s*manga\s*online/i, '')
      .replace(/\s*-\s*mangakakalot/i, '')
      .replace(/\s*-\s*manganelo/i, '')
      .replace(/\s*\|\s*.*/i, '')
      .trim();
  }
}

// Initialize content script when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new MangaContentScript();
  });
} else {
  new MangaContentScript();
}