// Options page script for MangaTrackMuse extension
class MangaOptions {
  constructor() {
    this.settings = {};
    this.mangaList = [];
    this.init();
  }

  async init() {
    await this.loadSettings();
    await this.loadMangaList();
    this.setupEventListeners();
    this.renderMangaList();
    console.log('MangaTrackMuse options page initialized');
  }

  async loadSettings() {
    const data = await chrome.storage.local.get(['settings']);
    this.settings = data.settings || {
      autoDetect: true,
      notifications: true,
      syncInterval: 30,
      preferredSites: ['mangadx.org', 'mangakakalot.com']
    };
    
    this.updateUI();
  }

  async loadMangaList() {
    const data = await chrome.storage.local.get(['mangaList']);
    this.mangaList = data.mangaList || [];
  }

  updateUI() {
    // Update toggles
    document.querySelectorAll('.toggle').forEach(toggle => {
      const setting = toggle.dataset.setting;
      if (this.settings[setting]) {
        toggle.classList.add('active');
      } else {
        toggle.classList.remove('active');
      }
    });

    // Update sync interval
    document.getElementById('syncInterval').value = this.settings.syncInterval;

    // Update preferred sites
    document.querySelectorAll('[data-site]').forEach(checkbox => {
      const site = checkbox.dataset.site;
      checkbox.checked = this.settings.preferredSites.includes(site);
    });
  }

  setupEventListeners() {
    // Toggle switches
    document.querySelectorAll('.toggle').forEach(toggle => {
      toggle.addEventListener('click', () => {
        const setting = toggle.dataset.setting;
        this.settings[setting] = !this.settings[setting];
        toggle.classList.toggle('active');
        this.saveSettings();
      });
    });

    // Sync interval
    document.getElementById('syncInterval').addEventListener('change', (e) => {
      this.settings.syncInterval = parseInt(e.target.value);
      this.saveSettings();
    });

    // Preferred sites
    document.querySelectorAll('[data-site]').forEach(checkbox => {
      checkbox.addEventListener('change', (e) => {
        const site = e.target.dataset.site;
        if (e.target.checked) {
          if (!this.settings.preferredSites.includes(site)) {
            this.settings.preferredSites.push(site);
          }
        } else {
          this.settings.preferredSites = this.settings.preferredSites.filter(s => s !== site);
        }
        this.saveSettings();
      });
    });
  }

  async saveSettings() {
    await chrome.storage.local.set({ settings: this.settings });
    console.log('Settings saved:', this.settings);
  }

  renderMangaList() {
    const container = document.getElementById('manga-list');
    
    if (this.mangaList.length === 0) {
      container.innerHTML = '<p style="color: #888;">Nenhum mangá salvo ainda</p>';
      return;
    }

    container.innerHTML = this.mangaList.map(manga => `
      <div class="manga-item">
        <img src="${manga.thumbnail || 'icons/icon-base.png'}" alt="${manga.title}">
        <div class="manga-info">
          <h4>${manga.title}</h4>
          <p>Capítulo ${manga.currentChapter} • ${manga.site}</p>
          <p style="font-size: 11px;">Última leitura: ${this.formatDate(manga.lastRead)}</p>
        </div>
        <div class="manga-actions">
          <button class="icon-button" onclick="window.options.openManga('${manga.id}')" title="Abrir">
            📖
          </button>
          <button class="icon-button" onclick="window.options.editManga('${manga.id}')" title="Editar">
            ✏️
          </button>
          <button class="icon-button" onclick="window.options.deleteManga('${manga.id}')" title="Remover">
            🗑️
          </button>
        </div>
      </div>
    `).join('');
  }

  formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  async openManga(mangaId) {
    const manga = this.mangaList.find(m => m.id === mangaId);
    if (manga) {
      chrome.tabs.create({ url: manga.url });
    }
  }

  async editManga(mangaId) {
    const manga = this.mangaList.find(m => m.id === mangaId);
    if (!manga) return;

    const newChapter = prompt(`Editar capítulo atual para "${manga.title}":`, manga.currentChapter);
    if (newChapter !== null && !isNaN(newChapter) && newChapter.trim() !== '') {
      manga.currentChapter = parseFloat(newChapter);
      manga.lastRead = new Date().toISOString();
      
      await chrome.storage.local.set({ mangaList: this.mangaList });
      this.renderMangaList();
      
      this.showToast('Capítulo atualizado com sucesso!');
    }
  }

  async deleteManga(mangaId) {
    const manga = this.mangaList.find(m => m.id === mangaId);
    if (!manga) return;

    if (confirm(`Tem certeza que deseja remover "${manga.title}" da lista?`)) {
      this.mangaList = this.mangaList.filter(m => m.id !== mangaId);
      await chrome.storage.local.set({ mangaList: this.mangaList });
      this.renderMangaList();
      
      this.showToast('Mangá removido da lista!');
    }
  }

  showToast(message) {
    const toast = document.createElement('div');
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #333;
      color: white;
      padding: 12px 16px;
      border-radius: 8px;
      font-size: 14px;
      z-index: 1000;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    `;
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
      document.body.removeChild(toast);
    }, 3000);
  }
}

// Global functions for button onclick handlers
async function exportData() {
  try {
    const data = await chrome.storage.local.get(null);
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `mangatrack-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    
    URL.revokeObjectURL(url);
    window.options.showToast('Dados exportados com sucesso!');
  } catch (error) {
    console.error('Export error:', error);
    window.options.showToast('Erro ao exportar dados');
  }
}

function importData() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  
  input.onchange = async (e) => {
    try {
      const file = e.target.files[0];
      if (!file) return;
      
      const text = await file.text();
      const data = JSON.parse(text);
      
      if (confirm('Isso irá sobrescrever todos os dados atuais. Continuar?')) {
        await chrome.storage.local.clear();
        await chrome.storage.local.set(data);
        
        window.options.showToast('Dados importados com sucesso!');
        setTimeout(() => location.reload(), 1500);
      }
    } catch (error) {
      console.error('Import error:', error);
      window.options.showToast('Erro ao importar dados');
    }
  };
  
  input.click();
}

async function clearAllData() {
  if (confirm('Tem certeza que deseja apagar TODOS os dados? Esta ação não pode ser desfeita!')) {
    if (confirm('Última confirmação: todos os mangás e configurações serão perdidos!')) {
      await chrome.storage.local.clear();
      window.options.showToast('Todos os dados foram apagados!');
      setTimeout(() => location.reload(), 1500);
    }
  }
}

// Initialize options page
document.addEventListener('DOMContentLoaded', () => {
  window.options = new MangaOptions();
});