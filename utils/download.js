// Download Utility Functions
export class DownloadManager {
  constructor() {
    this.downloadQueue = [];
    this.isDownloading = false;
    this.maxRetries = 3;
  }

  // Download a single PDF file
  async downloadPDF(url, filename, options = {}) {
    const {
      showProgress = true,
      retryCount = 0,
      onProgress = null,
      onComplete = null,
      onError = null,
    } = options;

    try {
      if (showProgress) {
        this.showDownloadProgress(filename);
      }

      // Create download link
      const link = document.createElement("a");
      link.href = url;
      link.download = filename || this.extractFilenameFromUrl(url);
      link.target = "_blank";

      // Add to document, click, and remove
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Track download
      this.trackDownload(url, filename);

      if (onComplete) onComplete({ url, filename, success: true });

      return { success: true, url, filename };
    } catch (error) {
      console.error("Download error:", error);

      // Retry logic
      if (retryCount < this.maxRetries) {
        console.log(
          `Retrying download (${retryCount + 1}/${this.maxRetries})...`
        );
        return this.downloadPDF(url, filename, {
          ...options,
          retryCount: retryCount + 1,
        });
      }

      if (onError) onError({ url, filename, error });
      return { success: false, error: error.message };
    }
  }

  // Download multiple files as ZIP
  async downloadMultipleAsZip(files, zipName = "resources.zip") {
    try {
      this.showNotification(
        `Preparing ${files.length} files for download...`,
        "info"
      );

      // In a real implementation, this would use JSZip library
      // For now, we'll download them individually
      const results = [];

      for (const [index, file] of files.entries()) {
        const result = await this.downloadPDF(file.url, file.filename, {
          showProgress: false,
        });
        results.push(result);

        // Small delay between downloads
        if (index < files.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 500));
        }
      }

      this.showNotification(
        `Downloaded ${results.filter((r) => r.success).length} of ${
          files.length
        } files`,
        "success"
      );
      return results;
    } catch (error) {
      console.error("Batch download error:", error);
      this.showNotification("Failed to download files", "error");
      return [];
    }
  }

  // Track download in analytics
  trackDownload(url, filename) {
    const downloadData = {
      url,
      filename,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      referrer: document.referrer,
    };

    // Save to localStorage
    const downloads = JSON.parse(
      localStorage.getItem("downloadHistory") || "[]"
    );
    downloads.unshift(downloadData);

    // Keep only last 1000 downloads
    if (downloads.length > 1000) {
      downloads.length = 1000;
    }

    localStorage.setItem("downloadHistory", JSON.stringify(downloads));

    // Send to analytics (in production)
    this.sendAnalytics("download", downloadData);
  }

  // Show download progress
  showDownloadProgress(filename) {
    // Create or update progress element
    let progressEl = document.getElementById("download-progress");

    if (!progressEl) {
      progressEl = document.createElement("div");
      progressEl.id = "download-progress";
      progressEl.className = "download-progress";
      progressEl.innerHTML = `
        <div class="progress-content">
          <div class="progress-text">Preparing download: ${filename}</div>
          <div class="progress-bar">
            <div class="progress-fill"></div>
          </div>
        </div>
      `;

      // Add styles
      progressEl.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        background: var(--primary-color);
        color: white;
        padding: 1rem;
        z-index: 10000;
        animation: slideDown 0.3s ease;
      `;

      const progressFill = progressEl.querySelector(".progress-fill");
      progressFill.style.cssText = `
        width: 0%;
        height: 4px;
        background: white;
        transition: width 0.3s ease;
      `;

      document.body.appendChild(progressEl);

      // Animate progress
      setTimeout(() => {
        progressFill.style.width = "100%";
      }, 100);

      // Remove after completion
      setTimeout(() => {
        progressEl.style.animation = "slideUp 0.3s ease";
        setTimeout(() => progressEl.remove(), 300);
      }, 1500);
    }
  }

  // Extract filename from URL
  extractFilenameFromUrl(url) {
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      return (
        pathname.substring(pathname.lastIndexOf("/") + 1) || "download.pdf"
      );
    } catch {
      return "download.pdf";
    }
  }

  // Check file size before download
  async getFileSize(url) {
    try {
      const response = await fetch(url, { method: "HEAD" });
      const size = response.headers.get("content-length");
      return size ? this.formatFileSize(size) : "Unknown size";
    } catch {
      return "Unknown size";
    }
  }

  // Format file size
  formatFileSize(bytes) {
    if (bytes === 0) return "0 Bytes";

    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }

  // Send analytics data
  sendAnalytics(event, data) {
    // In production, send to your analytics service
    console.log(`Analytics: ${event}`, data);

    // Example: Send to Google Analytics
    if (typeof gtag !== "undefined") {
      gtag("event", event, {
        event_category: "download",
        event_label: data.filename,
        value: 1,
      });
    }
  }

  // Show notification
  showNotification(message, type = "info") {
    const notification = document.createElement("div");
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
      <i class="fas fa-${
        type === "success"
          ? "check-circle"
          : type === "error"
          ? "exclamation-circle"
          : "info-circle"
      }"></i>
      <span>${message}</span>
    `;

    notification.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: ${
        type === "success"
          ? "#10b981"
          : type === "error"
          ? "#ef4444"
          : "#3b82f6"
      };
      color: white;
      padding: 1rem 1.5rem;
      border-radius: 8px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
      display: flex;
      align-items: center;
      gap: 0.75rem;
      z-index: 9999;
      animation: slideInRight 0.3s ease;
      max-width: 400px;
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
      notification.style.animation = "slideOutRight 0.3s ease";
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }
}

// Create global instance
export const downloadManager = new DownloadManager();
