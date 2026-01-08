// Local Storage Utility Functions
export class StorageManager {
  constructor() {
    this.prefix = "examportal_";
    this.encryptionEnabled = false;
  }

  // Set item with prefix
  set(key, value, options = {}) {
    const fullKey = this.prefix + key;
    const data = {
      value: value,
      timestamp: Date.now(),
      expires: options.expires ? Date.now() + options.expires : null,
      version: options.version || "1.0",
    };

    try {
      const stringValue = JSON.stringify(data);
      localStorage.setItem(fullKey, stringValue);
      return true;
    } catch (error) {
      console.error("Storage set error:", error);

      // If storage is full, clear expired items and try again
      if (error.name === "QuotaExceededError") {
        this.clearExpired();
        try {
          const stringValue = JSON.stringify(data);
          localStorage.setItem(fullKey, stringValue);
          return true;
        } catch (retryError) {
          console.error("Storage still full after cleanup:", retryError);
          return false;
        }
      }

      return false;
    }
  }

  // Get item
  get(key, defaultValue = null) {
    const fullKey = this.prefix + key;

    try {
      const item = localStorage.getItem(fullKey);

      if (!item) {
        return defaultValue;
      }

      const data = JSON.parse(item);

      // Check if expired
      if (data.expires && Date.now() > data.expires) {
        this.remove(key);
        return defaultValue;
      }

      return data.value;
    } catch (error) {
      console.error("Storage get error:", error);
      return defaultValue;
    }
  }

  // Remove item
  remove(key) {
    const fullKey = this.prefix + key;
    try {
      localStorage.removeItem(fullKey);
      return true;
    } catch (error) {
      console.error("Storage remove error:", error);
      return false;
    }
  }

  // Clear all items with prefix
  clear() {
    try {
      const keysToRemove = [];

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith(this.prefix)) {
          keysToRemove.push(key);
        }
      }

      keysToRemove.forEach((key) => {
        localStorage.removeItem(key);
      });

      return true;
    } catch (error) {
      console.error("Storage clear error:", error);
      return false;
    }
  }

  // Clear expired items
  clearExpired() {
    try {
      const now = Date.now();
      let cleared = 0;

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);

        if (key.startsWith(this.prefix)) {
          try {
            const item = localStorage.getItem(key);
            const data = JSON.parse(item);

            if (data.expires && now > data.expires) {
              localStorage.removeItem(key);
              cleared++;
            }
          } catch (e) {
            // If we can't parse it, remove it
            localStorage.removeItem(key);
            cleared++;
          }
        }
      }

      console.log(`Cleared ${cleared} expired items`);
      return cleared;
    } catch (error) {
      console.error("Clear expired error:", error);
      return 0;
    }
  }

  // Get all keys
  keys() {
    const keys = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key.startsWith(this.prefix)) {
        keys.push(key.substring(this.prefix.length));
      }
    }

    return keys;
  }

  // Get storage usage
  getUsage() {
    try {
      let total = 0;

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        const value = localStorage.getItem(key);
        total += key.length + (value ? value.length : 0);
      }

      return {
        bytes: total,
        kilobytes: (total / 1024).toFixed(2),
        megabytes: (total / (1024 * 1024)).toFixed(4),
        items: localStorage.length,
      };
    } catch (error) {
      console.error("Get usage error:", error);
      return null;
    }
  }

  // Download backup
  downloadBackup(filename = "examportal_backup.json") {
    try {
      const backup = {};

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith(this.prefix)) {
          backup[key] = localStorage.getItem(key);
        }
      }

      const dataStr = JSON.stringify(backup, null, 2);
      const dataBlob = new Blob([dataStr], { type: "application/json" });

      const link = document.createElement("a");
      link.href = URL.createObjectURL(dataBlob);
      link.download = filename;
      link.click();

      URL.revokeObjectURL(link.href);
      return true;
    } catch (error) {
      console.error("Backup error:", error);
      return false;
    }
  }

  // Restore from backup
  restoreBackup(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const backup = JSON.parse(e.target.result);
          let restored = 0;
          let failed = 0;

          Object.entries(backup).forEach(([key, value]) => {
            try {
              localStorage.setItem(key, value);
              restored++;
            } catch (error) {
              console.error(`Failed to restore ${key}:`, error);
              failed++;
            }
          });

          resolve({ restored, failed });
        } catch (error) {
          reject(new Error("Invalid backup file"));
        }
      };

      reader.onerror = () => {
        reject(new Error("Failed to read file"));
      };

      reader.readAsText(file);
    });
  }

  // User preferences
  getUserPreferences() {
    return this.get("user_preferences", {
      theme: "light",
      fontSize: "medium",
      language: "en",
      notifications: true,
      autoDownload: false,
      gridView: true,
    });
  }

  // Update user preferences
  updateUserPreferences(preferences) {
    const current = this.getUserPreferences();
    const updated = { ...current, ...preferences };
    return this.set("user_preferences", updated);
  }

  // Download history
  getDownloadHistory() {
    return this.get("download_history", []);
  }

  // Add to download history
  addToDownloadHistory(item) {
    const history = this.getDownloadHistory();
    history.unshift({
      ...item,
      timestamp: new Date().toISOString(),
    });

    // Keep only last 100 items
    if (history.length > 100) {
      history.length = 100;
    }

    return this.set("download_history", history);
  }

  // Clear download history
  clearDownloadHistory() {
    return this.remove("download_history");
  }

  // Favorites
  getFavorites() {
    return this.get("favorites", []);
  }

  // Add favorite
  addFavorite(itemId) {
    const favorites = this.getFavorites();

    if (!favorites.includes(itemId)) {
      favorites.push(itemId);
      return this.set("favorites", favorites);
    }

    return true;
  }

  // Remove favorite
  removeFavorite(itemId) {
    const favorites = this.getFavorites();
    const index = favorites.indexOf(itemId);

    if (index > -1) {
      favorites.splice(index, 1);
      return this.set("favorites", favorites);
    }

    return true;
  }

  // Check if item is favorite
  isFavorite(itemId) {
    const favorites = this.getFavorites();
    return favorites.includes(itemId);
  }

  // Recent searches
  getRecentSearches(limit = 10) {
    const searches = this.get("recent_searches", []);
    return searches.slice(0, limit);
  }

  // Add search to history
  addSearch(query) {
    if (!query || query.trim().length < 2) return;

    const searches = this.get("recent_searches", []);
    const trimmedQuery = query.trim();

    // Remove if already exists
    const index = searches.indexOf(trimmedQuery);
    if (index > -1) {
      searches.splice(index, 1);
    }

    // Add to beginning
    searches.unshift(trimmedQuery);

    // Keep only last 50 searches
    if (searches.length > 50) {
      searches.length = 50;
    }

    return this.set("recent_searches", searches);
  }

  // Clear search history
  clearSearchHistory() {
    return this.remove("recent_searches");
  }
}

// Create global instance
export const storage = new StorageManager();
