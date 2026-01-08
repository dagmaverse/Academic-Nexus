// Analytics Utility Functions
export class AnalyticsTracker {
  constructor() {
    this.enabled = true;
    this.queue = [];
    this.maxRetries = 3;
    this.endpoint = "/api/analytics"; // Your analytics endpoint

    // Load pending events
    this.loadQueue();

    // Send queue periodically
    setInterval(() => this.flushQueue(), 30000); // Every 30 seconds

    // Send queue on page unload
    window.addEventListener("beforeunload", () => {
      this.flushQueue(true); // Force sync send
    });
  }

  // Track page view
  trackPageView(page, title = null) {
    const event = {
      type: "pageview",
      page: page,
      title: title || document.title,
      referrer: document.referrer,
      timestamp: new Date().toISOString(),
      screen: `${window.screen.width}x${window.screen.height}`,
      language: navigator.language,
      userAgent: navigator.userAgent,
    };

    return this.queueEvent(event);
  }

  // Track download
  trackDownload(fileId, fileName, fileType, fileSize = null) {
    const event = {
      type: "download",
      fileId: fileId,
      fileName: fileName,
      fileType: fileType,
      fileSize: fileSize,
      timestamp: new Date().toISOString(),
      url: window.location.href,
    };

    return this.queueEvent(event);
  }

  // Track search
  trackSearch(query, resultsCount = 0, filters = {}) {
    const event = {
      type: "search",
      query: query,
      resultsCount: resultsCount,
      filters: filters,
      timestamp: new Date().toISOString(),
    };

    return this.queueEvent(event);
  }

  // Track filter change
  trackFilterChange(filterType, value, resultsCount = 0) {
    const event = {
      type: "filter",
      filterType: filterType,
      value: value,
      resultsCount: resultsCount,
      timestamp: new Date().toISOString(),
    };

    return this.queueEvent(event);
  }

  // Track user interaction
  trackInteraction(element, action, metadata = {}) {
    const event = {
      type: "interaction",
      element: element,
      action: action,
      metadata: metadata,
      timestamp: new Date().toISOString(),
      page: window.location.pathname,
    };

    return this.queueEvent(event);
  }

  // Track error
  trackError(error, context = {}) {
    const event = {
      type: "error",
      error: error.message || error.toString(),
      stack: error.stack,
      context: context,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
    };

    return this.queueEvent(event);
  }

  // Track performance
  trackPerformance(metric, value, metadata = {}) {
    const event = {
      type: "performance",
      metric: metric,
      value: value,
      metadata: metadata,
      timestamp: new Date().toISOString(),
    };

    return this.queueEvent(event);
  }

  // Queue event for sending
  queueEvent(event) {
    if (!this.enabled) return false;

    // Add session ID
    event.sessionId = this.getSessionId();

    // Add user ID if available
    const userId = this.getUserId();
    if (userId) {
      event.userId = userId;
    }

    // Add to queue
    this.queue.push(event);

    // Save queue to localStorage
    this.saveQueue();

    // Auto-send if queue is getting large
    if (this.queue.length >= 20) {
      this.flushQueue();
    }

    return true;
  }

  // Send queued events
  async flushQueue(sync = false) {
    if (this.queue.length === 0 || !this.enabled) return;

    const eventsToSend = [...this.queue];
    this.queue = [];

    if (sync) {
      // Synchronous send for page unload
      this.sendEventsSync(eventsToSend);
    } else {
      // Asynchronous send
      await this.sendEvents(eventsToSend);
    }
  }

  // Send events asynchronously
  async sendEvents(events) {
    try {
      const response = await fetch(this.endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ events: events }),
        // Don't wait too long
        signal: AbortSignal.timeout(5000),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      // Clear saved queue on success
      localStorage.removeItem("analytics_queue");

      return true;
    } catch (error) {
      console.error("Failed to send analytics:", error);

      // Re-queue failed events
      this.queue = [...events, ...this.queue];
      this.saveQueue();

      return false;
    }
  }

  // Send events synchronously (for page unload)
  sendEventsSync(events) {
    try {
      // Use sendBeacon if available
      if (navigator.sendBeacon) {
        const data = new Blob([JSON.stringify({ events: events })], {
          type: "application/json",
        });

        if (navigator.sendBeacon(this.endpoint, data)) {
          localStorage.removeItem("analytics_queue");
          return true;
        }
      }

      // Fallback to sync XHR
      const xhr = new XMLHttpRequest();
      xhr.open("POST", this.endpoint, false); // Sync request
      xhr.setRequestHeader("Content-Type", "application/json");
      xhr.send(JSON.stringify({ events: events }));

      if (xhr.status >= 200 && xhr.status < 300) {
        localStorage.removeItem("analytics_queue");
        return true;
      }

      throw new Error(`HTTP ${xhr.status}`);
    } catch (error) {
      console.error("Failed to send analytics sync:", error);

      // Save for next time
      this.queue = events;
      this.saveQueue();

      return false;
    }
  }

  // Save queue to localStorage
  saveQueue() {
    try {
      localStorage.setItem("analytics_queue", JSON.stringify(this.queue));
    } catch (error) {
      console.error("Failed to save analytics queue:", error);
    }
  }

  // Load queue from localStorage
  loadQueue() {
    try {
      const saved = localStorage.getItem("analytics_queue");
      if (saved) {
        this.queue = JSON.parse(saved);
      }
    } catch (error) {
      console.error("Failed to load analytics queue:", error);
      this.queue = [];
    }
  }

  // Get or create session ID
  getSessionId() {
    let sessionId = localStorage.getItem("analytics_session_id");

    if (!sessionId) {
      sessionId = this.generateId();
      localStorage.setItem("analytics_session_id", sessionId);

      // Set expiry for session (4 hours)
      localStorage.setItem(
        "analytics_session_expiry",
        Date.now() + 4 * 60 * 60 * 1000
      );
    } else {
      // Check if session expired
      const expiry = localStorage.getItem("analytics_session_expiry");
      if (!expiry || Date.now() > parseInt(expiry)) {
        sessionId = this.generateId();
        localStorage.setItem("analytics_session_id", sessionId);
        localStorage.setItem(
          "analytics_session_expiry",
          Date.now() + 4 * 60 * 60 * 1000
        );
      }
    }

    return sessionId;
  }

  // Get user ID
  getUserId() {
    // In a real app, this would come from authentication
    let userId = localStorage.getItem("user_id");

    if (!userId) {
      // Generate anonymous ID
      userId = "anonymous_" + this.generateId();
      localStorage.setItem("user_id", userId);
    }

    return userId;
  }

  // Generate unique ID
  generateId() {
    return "id_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);
  }

  // Enable/disable analytics
  setEnabled(enabled) {
    this.enabled = enabled;
    localStorage.setItem("analytics_enabled", enabled.toString());

    if (!enabled) {
      this.queue = [];
      localStorage.removeItem("analytics_queue");
    }

    return enabled;
  }

  // Get analytics status
  getStatus() {
    return {
      enabled: this.enabled,
      queueSize: this.queue.length,
      sessionId: this.getSessionId(),
      userId: this.getUserId(),
    };
  }

  // Get statistics
  getStatistics() {
    const stats = JSON.parse(localStorage.getItem("analytics_stats") || "{}");

    return {
      pageViews: stats.pageViews || 0,
      downloads: stats.downloads || 0,
      searches: stats.searches || 0,
      errors: stats.errors || 0,
      lastUpdated: stats.lastUpdated || null,
    };
  }

  // Update statistics
  updateStats(type) {
    const stats = this.getStatistics();

    switch (type) {
      case "pageview":
        stats.pageViews = (stats.pageViews || 0) + 1;
        break;
      case "download":
        stats.downloads = (stats.downloads || 0) + 1;
        break;
      case "search":
        stats.searches = (stats.searches || 0) + 1;
        break;
      case "error":
        stats.errors = (stats.errors || 0) + 1;
        break;
    }

    stats.lastUpdated = new Date().toISOString();
    localStorage.setItem("analytics_stats", JSON.stringify(stats));
  }
}

// Create global instance
export const analytics = new AnalyticsTracker();

// Auto-track page views
if (typeof window !== "undefined") {
  window.addEventListener("load", () => {
    setTimeout(() => {
      analytics.trackPageView(window.location.pathname, document.title);
    }, 1000);
  });

  // Track performance metrics
  window.addEventListener("load", () => {
    // Track page load time
    const perfData = window.performance.timing;
    const loadTime = perfData.loadEventEnd - perfData.navigationStart;

    analytics.trackPerformance("page_load", loadTime, {
      domReady: perfData.domContentLoadedEventEnd - perfData.navigationStart,
      ttfb: perfData.responseStart - perfData.requestStart,
    });
  });
}
