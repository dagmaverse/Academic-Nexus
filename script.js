// Import utility modules
import { downloadManager } from "./utils/download.js";
import { searchEngine } from "./utils/search.js";
import { filterManager } from "./utils/filter.js";
import { storage } from "./utils/storage.js";
import { analytics } from "./utils/analytics.js";
import { validator } from "./utils/validation.js";

AOS.init({
  duration: 1000, // Animations last 1 second
  easing: "ease-in-out", // Smooth acceleration and deceleration
  once: true, // Elements animate only the first time you scroll to them
  mirror: false, // No animation when scrolling back up
});

// Main Application Controller
class ExamPortal {
  constructor() {
    this.currentGrade = "9";
    this.currentYear = "all";
    this.currentCategory = "all";
    this.searchTerm = "";

    // Use storage utility instead of direct localStorage
    this.downloadHistory = storage.getDownloadHistory();
    this.favorites = storage.getFavorites();

    this.resourcesData = [];
    this.pastPapersData = [];
    this.textbooksData = {};

    // Initialize utility instances
    this.downloadManager = downloadManager;
    this.searchEngine = searchEngine;
    this.filterManager = filterManager;
    this.storage = storage;
    this.analytics = analytics;
    this.validator = validator;

    this.init();
  }

  async init() {
    // Initialize theme
    this.initTheme();

    // Initialize mobile menu
    this.initMobileMenu();

    // Initialize navigation
    this.initNavigation();

    // Load data
    await this.loadData();

    // Populate year filters (show years present in data)
    this.populateYearFilters();

    // Initialize search engine with data
    this.searchEngine.indexResources(this.resourcesData);

    // Initialize filters (this will handle both old and new UI)
    this.initFilters();

    // Initialize filters from URL
    this.filterManager.initFromURL();
    this.currentCategory = this.filterManager.getActiveFilters().category;
    this.currentYear = this.filterManager.getActiveFilters().year;
    this.currentGrade = this.filterManager.getActiveFilters().grade;

    // Load initial content
    this.loadAllResources();
    this.loadPastPapers();
    this.loadTextbooks();

    // Initialize search
    this.initSearch();

    // Initialize filters UI
    this.initFilters();

    // Initialize download tracking
    this.initDownloadTracking();

    // Track page view with analytics
    this.analytics.trackPageView(window.location.pathname, document.title);

    console.log("Exam Portal initialized successfully");
  }

  async loadData() {
    try {
      // Load resources data
      const resourcesModule = await import("./data/resources.js");
      this.resourcesData = resourcesModule.resourcesData || [];

      // Load past papers data
      const pastPapersModule = await import("./data/past-papers.js");
      this.pastPapersData = pastPapersModule.pastPapersData || [];

      // Load textbooks data
      const textbooksModule = await import("./data/textbooks.js");
      this.textbooksData = textbooksModule.textbooksData || {};

      console.log("Data loaded successfully");
    } catch (error) {
      console.error("Error loading data:", error);
      this.showError("Failed to load data. Please refresh the page.");
    }
  }

  initTheme() {
    // Make this function defensive and compatible with legacy storage keys
    const themeToggle =
      document.getElementById("themeToggle") ||
      document.querySelector(".theme-toggle");

    if (!themeToggle) {
      console.warn(
        "Theme toggle button not found (#themeToggle or .theme-toggle)"
      );
      return;
    }

    // Ensure we have an <i> icon element for toggling the icon; if missing, create one
    let themeIcon = themeToggle.querySelector("i");
    if (!themeIcon) {
      themeIcon = document.createElement("i");
      themeToggle.appendChild(themeIcon);
    }

    const savedTheme =
      localStorage.getItem("theme") ||
      (localStorage.getItem("darkmode") === "active" ? "dark" : null) ||
      (window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light");

    document.documentElement.setAttribute("data-theme", savedTheme);
    themeIcon.className = savedTheme === "dark" ? "fas fa-sun" : "fas fa-moon";
    console.log("initTheme: applied theme ->", savedTheme);

    // Toggle handler: keep both storage keys in sync for compatibility
    themeToggle.addEventListener("click", () => {
      try {
        const currentTheme =
          document.documentElement.getAttribute("data-theme");
        const newTheme = currentTheme === "dark" ? "light" : "dark";

        document.documentElement.setAttribute("data-theme", newTheme);
        localStorage.setItem("theme", newTheme);
        if (newTheme === "dark") {
          localStorage.setItem("darkmode", "active");
        } else {
          localStorage.removeItem("darkmode");
        }

        themeIcon.className =
          newTheme === "dark" ? "fas fa-sun" : "fas fa-moon";
        console.log("initTheme: toggled theme ->", newTheme);
      } catch (err) {
        console.error("Error toggling theme:", err);
      }
    });
  }

  initMobileMenu() {
    const mobileToggle = document.getElementById("mobileToggle");
    const navMenu = document.getElementById("navMenu");

    if (!mobileToggle || !navMenu) {
      // Elements not present (e.g., non-mobile layout) — nothing to do
      console.warn("initMobileMenu: mobile toggle or nav menu not found");
      return;
    }

    // Ensure initial accessibility attributes and icon
    if (!mobileToggle.getAttribute("aria-expanded")) {
      mobileToggle.setAttribute("aria-expanded", "false");
    }
    if (!mobileToggle.querySelector("i")) {
      mobileToggle.innerHTML = '<i class="fas fa-bars" aria-hidden="true"></i>';
    }
    // Make sure nav menu floats above other content on mobile
    navMenu.style.zIndex = "1100";

    mobileToggle.addEventListener("click", (e) => {
      e.stopPropagation(); // prevent immediate document click handler from closing
      const isOpen = navMenu.classList.toggle("active");
      mobileToggle.innerHTML = isOpen
        ? '<i class="fas fa-times" aria-hidden="true"></i>'
        : '<i class="fas fa-bars" aria-hidden="true"></i>';
      mobileToggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
      document.body.classList.toggle("menu-open", isOpen);
      console.log("initMobileMenu: toggled ->", isOpen ? "open" : "closed");
    });

    // Close menu when clicking outside
    document.addEventListener("click", (e) => {
      if (!mobileToggle.contains(e.target) && !navMenu.contains(e.target)) {
        if (navMenu.classList.contains("active")) {
          navMenu.classList.remove("active");
          mobileToggle.innerHTML =
            '<i class="fas fa-bars" aria-hidden="true"></i>';
          mobileToggle.setAttribute("aria-expanded", "false");
          document.body.classList.remove("menu-open");
          console.log("initMobileMenu: closed by outside click");
        }
      }
    });
  }

  initNavigation() {
    // Smooth scroll for navigation links
    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
      anchor.addEventListener("click", (e) => {
        e.preventDefault();
        const targetId = anchor.getAttribute("href");
        if (targetId === "#") return;

        const targetElement = document.querySelector(targetId);
        if (targetElement) {
          window.scrollTo({
            top: targetElement.offsetTop - 80,
            behavior: "smooth",
          });

          // Update active nav link
          document.querySelectorAll(".nav-link").forEach((link) => {
            link.classList.remove("active");
          });
          anchor.classList.add("active");

          // Close mobile menu if open
          const navMenu = document.getElementById("navMenu");
          if (navMenu.classList.contains("active")) {
            navMenu.classList.remove("active");
            document.getElementById("mobileToggle").innerHTML =
              '<i class="fas fa-bars"></i>';
          }
        }
      });
    });

    // Update active nav based on scroll position
    window.addEventListener("scroll", () => {
      const sections = document.querySelectorAll("section[id]");
      const scrollPosition = window.scrollY + 100;

      sections.forEach((section) => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.clientHeight;
        const sectionId = section.getAttribute("id");

        if (
          scrollPosition >= sectionTop &&
          scrollPosition < sectionTop + sectionHeight
        ) {
          document.querySelectorAll(".nav-link").forEach((link) => {
            link.classList.remove("active");
            if (link.getAttribute("href") === `#${sectionId}`) {
              link.classList.add("active");
            }
          });
        }
      });
    });
  }

  initSearch() {
    const searchInput = document.getElementById("searchInput");
    const searchBtn = document.querySelector(".search-btn");

    // Debounced search function
    let searchTimeout;
    searchInput.addEventListener("input", (e) => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        this.searchTerm = e.target.value.toLowerCase().trim();
        this.loadAllResources();
        this.showSearchResults(this.searchTerm);
      }, 300);
    });

    searchBtn.addEventListener("click", () => {
      this.searchTerm = searchInput.value.toLowerCase().trim();
      this.loadAllResources();
      this.showSearchResults(this.searchTerm);
    });

    // Clear search when clicking ESC
    searchInput.addEventListener("keyup", (e) => {
      if (e.key === "Escape") {
        searchInput.value = "";
        this.searchTerm = "";
        this.loadAllResources();
      }
    });
  }

  initFilters() {
    // Initialize advanced filter UI if container exists
    const filterContainer = document.getElementById("filterContainer");
    if (filterContainer) {
      this.initFilterUI();
    } else {
      // Fallback to old filter buttons
      this.initLegacyFilters();
    }
  }

  /*
   * Populate year filter buttons dynamically from pastPapersData
   * If `maxYear` is provided (number), only include years <= maxYear.
   * Otherwise show all years that exist in the dataset.
   */
  populateYearFilters(maxYear) {
    const container = document.querySelector(".year-filters");
    if (!container) return;

    const years = Array.from(
      new Set(this.pastPapersData.map((p) => parseInt(p.year, 10)))
    )
      .filter((y) => {
        if (isNaN(y)) return false;
        return typeof maxYear === "number" ? y <= maxYear : true;
      })
      .sort((a, b) => b - a);

    // Build buttons (keep a default 'All Years' button)
    container.innerHTML = "";

    const allBtn = document.createElement("button");
    allBtn.className = "year-btn active";
    allBtn.dataset.year = "all";
    allBtn.textContent = "All Years";
    container.appendChild(allBtn);

    years.forEach((y) => {
      const btn = document.createElement("button");
      btn.className = "year-btn";
      btn.dataset.year = String(y);
      btn.textContent = String(y);
      container.appendChild(btn);
    });
  }

  initLegacyFilters() {
    // Resource category filters (old style)
    document.querySelectorAll(".filter-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        document
          .querySelectorAll(".filter-btn")
          .forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        this.currentCategory = btn.dataset.filter;
        this.loadAllResources();

        // Track filter change
        this.analytics.trackFilterChange("category", this.currentCategory);
      });
    });

    // Past paper year filters
    document.querySelectorAll(".year-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        document
          .querySelectorAll(".year-btn")
          .forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        this.currentYear = btn.dataset.year;
        this.loadPastPapers();

        // Track filter change
        this.analytics.trackFilterChange("year", this.currentYear);
      });
    });

    // Textbook grade filters
    document.querySelectorAll(".grade-tab").forEach((tab) => {
      tab.addEventListener("click", () => {
        document
          .querySelectorAll(".grade-tab")
          .forEach((t) => t.classList.remove("active"));
        tab.classList.add("active");
        this.currentGrade = tab.dataset.grade;
        this.loadTextbooks();

        // Track filter change
        this.analytics.trackFilterChange("grade", this.currentGrade);
      });
    });
  }

  initFilterUI() {
    try {
      // Get filter options from data
      const filterOptions = this.filterManager.getFilterOptions(
        this.resourcesData
      );

      // Hide old filter buttons (optional)
      const oldFilterButtons = document.querySelector(".filter-buttons");
      if (oldFilterButtons) {
        oldFilterButtons.classList.add("legacy");
      }

      // Create advanced filter UI
      this.filterManager.createFilterUI(filterOptions, "filterContainer");

      // Listen to filter changes
      this.filterManager.onFilterChange((filters) => {
        // Update current filters
        this.currentCategory = filters.category;
        this.currentYear = filters.year;
        this.currentGrade = filters.grade;

        // Track filter changes with analytics
        if (filters.category !== "all") {
          this.analytics.trackFilterChange("category", filters.category);
        }
        if (filters.grade !== "all") {
          this.analytics.trackFilterChange("grade", filters.grade);
        }
        if (filters.year !== "all") {
          this.analytics.trackFilterChange("year", filters.year);
        }
        if (filters.subject !== "all") {
          this.analytics.trackFilterChange("subject", filters.subject);
        }
        if (filters.sortBy !== "popular") {
          this.analytics.trackFilterChange("sort", filters.sortBy);
        }

        // Update the old filter buttons to match (for consistency)
        this.updateLegacyFiltersToMatch(filters);

        // Reload resources with new filters
        this.loadAllResources();
        this.loadPastPapers();
        this.loadTextbooks();
      });

      // Ensure grade tabs still work when the advanced filter UI is active
      // (wire grade tab clicks to the filter manager so listeners fire)
      document.querySelectorAll(".grade-tab").forEach((tab) => {
        tab.addEventListener("click", () => {
          const grade = tab.dataset.grade || "9";
          this.filterManager.setFilter("grade", grade);
        });
      });

      console.log("Advanced filter UI initialized");
    } catch (error) {
      console.error("Error initializing filter UI:", error);
      // Fallback to legacy filters
      this.initLegacyFilters();
    }
  }

  updateLegacyFiltersToMatch(filters) {
    // Update category filter button
    document.querySelectorAll(".filter-btn").forEach((btn) => {
      if (btn.dataset.filter === filters.category) {
        btn.classList.add("active");
      } else {
        btn.classList.remove("active");
      }
    });

    // Update year filter button
    document.querySelectorAll(".year-btn").forEach((btn) => {
      if (btn.dataset.year === filters.year) {
        btn.classList.add("active");
      } else {
        btn.classList.remove("active");
      }
    });

    // Update grade filter button
    document.querySelectorAll(".grade-tab").forEach((tab) => {
      if (tab.dataset.grade === filters.grade) {
        tab.classList.add("active");
      } else {
        tab.classList.remove("active");
      }
    });
  }

  initDownloadTracking() {
    document.addEventListener("click", (e) => {
      // Handle resource downloads
      if (
        e.target.closest(".resource-download") ||
        e.target.closest(".download-link")
      ) {
        e.preventDefault();
        const link =
          e.target.closest(".resource-download") ||
          e.target.closest(".download-link");
        this.handleDownload(link);
      }

      // Handle paper downloads
      if (e.target.closest(".paper-download")) {
        e.preventDefault();
        const link = e.target.closest(".paper-download");
        this.handlePaperDownload(link);
      }

      // Handle textbook downloads
      if (e.target.closest(".textbook-download")) {
        e.preventDefault();
        const link = e.target.closest(".textbook-download");
        this.handleTextbookDownload(link);
      }
    });
  }

  loadAllResources() {
    try {
      // Get active filters from filter manager
      const activeFilters = this.filterManager.getActiveFilters();

      // Apply filters using filter manager utility
      let filteredResources = this.filterManager.applyFilters(
        this.resourcesData
      );

      // Apply search if there's a search term
      if (this.searchTerm) {
        // Use search engine utility
        filteredResources = this.searchEngine.search(this.searchTerm, {
          filters: activeFilters,
          limit: 100, // Limit search results
        });

        // Save search to history
        this.searchEngine.saveSearch(this.searchTerm);

        // Track search with analytics
        this.analytics.trackSearch(
          this.searchTerm,
          filteredResources.length,
          activeFilters
        );
      }

      // If no results, show message
      if (filteredResources.length === 0) {
        this.renderNoResults(activeFilters);
      } else {
        this.renderResources(filteredResources);
      }
    } catch (error) {
      console.error("Error loading resources:", error);
      this.analytics.trackError(error, { context: "loadResources" });
      this.showError("Failed to load resources. Please try again.");
    }
  }

  renderNoResults(filters) {
    const grid = document.getElementById("resourcesGrid");

    let message = "No resources found";
    let details = "Try adjusting your search or filter";

    // Provide more specific messages based on filters
    if (filters.category !== "all") {
      details = `No ${filters.category} resources found. Try removing the category filter.`;
    }

    if (filters.grade !== "all") {
      details = `No resources found for Grade ${filters.grade}. Try selecting a different grade.`;
    }

    if (this.searchTerm) {
      message = `No results for "${this.searchTerm}"`;
      details = "Try a different search term or remove filters";
    }

    grid.innerHTML = `
        <div class="no-results">
            <i class="fas fa-search"></i>
            <h3>${message}</h3>
            <p>${details}</p>
            <button class="btn btn-primary" id="resetFiltersBtn">
                <i class="fas fa-redo"></i> Reset All Filters
            </button>
        </div>
    `;

    // Add reset button listener
    document
      .getElementById("resetFiltersBtn")
      ?.addEventListener("click", () => {
        this.filterManager.resetFilters();
        this.searchTerm = "";
        document.getElementById("searchInput").value = "";
        this.loadAllResources();
      });
  }

  loadPastPapers() {
    try {
      let filteredPapers = this.pastPapersData;

      if (this.currentYear !== "all") {
        filteredPapers = filteredPapers.filter(
          (p) => p.year === this.currentYear
        );
      }

      this.renderPastPapers(filteredPapers);
    } catch (error) {
      console.error("Error loading past papers:", error);
      this.showError("Failed to load past papers. Please try again.");
    }
  }

  loadTextbooks() {
    try {
      // For textbooks, if grade is "all", default to "9"
      const gradeToLoad = this.currentGrade === "all" ? "9" : this.currentGrade;
      const gradeTextbooks = this.textbooksData[gradeToLoad] || [];

      // Update the active grade tab to match
      document.querySelectorAll(".grade-tab").forEach((tab) => {
        if (tab.dataset.grade === gradeToLoad) {
          tab.classList.add("active");
        } else {
          tab.classList.remove("active");
        }
      });

      // Update currentGrade for textbooks section
      this.currentGrade = gradeToLoad;

      this.renderTextbooks(gradeTextbooks, gradeToLoad);
    } catch (error) {
      console.error("Error loading textbooks:", error);
      this.showError("Failed to load textbooks. Please try again.");
    }
  }

  renderResources(resources) {
    const grid = document.getElementById("resourcesGrid");

    if (!grid) {
      console.error("Resources grid element not found");
      return;
    }

    if (resources.length === 0) {
      grid.innerHTML = `
                <div class="no-results">
                    <i class="fas fa-search"></i>
                    <h3>No resources found</h3>
                    <p>Try adjusting your search or filter</p>
                </div>
            `;
      return;
    }

    grid.innerHTML = resources
      .map(
        (resource) => `
            <div class="resource-card" data-id="${resource.id}">
                <div class="resource-image">
                    <img src="${resource.image}" alt="${
          resource.title
        }" loading="lazy">
                    ${
                      this.isNewResource(resource.uploaded)
                        ? '<span class="new-badge">NEW</span>'
                        : ""
                    }
                    ${
                      this.isFavorite(resource.id)
                        ? '<button class="favorite-btn active"><i class="fas fa-heart"></i></button>'
                        : '<button class="favorite-btn"><i class="far fa-heart"></i></button>'
                    }
                </div>
                <div class="resource-content">
                    <div class="resource-header">
                        <span class="resource-category">${this.getCategoryIcon(
                          resource.category
                        )} ${resource.category.toUpperCase()}</span>
                        <span class="resource-grade">Grade ${
                          resource.grade
                        }</span>
                    </div>
                    <h3 class="resource-title">${resource.title}</h3>
                    <p class="resource-description">${resource.description}</p>
                    
                    <div class="resource-meta">
                        <div class="resource-info">
                            <span><i class="fas fa-file-pdf"></i> ${
                              resource.fileSize
                            }</span>
                            <span><i class="fas fa-download"></i> ${this.formatDownloadCount(
                              resource.downloads
                            )}</span>
                            ${
                              resource.pages
                                ? `<span><i class="fas fa-file-alt"></i> ${resource.pages} pages</span>`
                                : ""
                            }
                        </div>
                        
                        <div class="resource-actions">
                            ${
                              resource.previewUrl
                                ? `<button class="btn-preview" data-preview="${resource.previewUrl}">
                                    <i class="fas fa-eye"></i> Preview
                                </button>`
                                : ""
                            }
                            <a href="${resource.pdfUrl}" 
                               class="resource-download" 
                               download 
                               data-id="${resource.id}"
                               data-title="${resource.title}">
                                <i class="fas fa-download"></i> Download
                            </a>
                        </div>
                    </div>
                    
                    <div class="resource-tags">
                        <span class="tag subject-tag">${resource.subject}</span>
                        ${
                          resource.tags
                            ? resource.tags
                                .map((tag) => `<span class="tag">${tag}</span>`)
                                .join("")
                            : ""
                        }
                    </div>
                    
                    <div class="resource-footer">
                        <span class="resource-date">
                            <i class="far fa-calendar"></i> ${this.formatDate(
                              resource.uploaded
                            )}
                        </span>
                        <span class="resource-quality">
                            <i class="fas fa-star"></i> ${
                              resource.quality || "High Quality"
                            }
                        </span>
                    </div>
                </div>
            </div>
        `
      )
      .join("");

    // Add event listeners to new elements
    this.addResourceEventListeners();
  }

  renderPastPapers(papers) {
    const grid = document.getElementById("papersGrid");

    if (papers.length === 0) {
      grid.innerHTML = `
                <div class="no-results">
                    <i class="fas fa-file-alt"></i>
                    <h3>No past papers found</h3>
                </div>
            `;
      return;
    }

    grid.innerHTML = papers
      .map(
        (paper) => `
            <div class="paper-card">
                <div class="paper-header">
                    <div class="paper-year">EUEE ${paper.year}</div>
                    <div class="paper-download-all">
                      <a href="${paper.combinedPdfUrl || "#"}" 
                         class="paper-download" 
                         data-year="${paper.year}"
                         data-type="combined"
                         role="button"
                         tabindex="0"
                         aria-label="Download all papers for ${paper.year}">
                        <i class="fas fa-download" aria-hidden="true"></i> Download All
                      </a>
                    </div>
                </div>
                
                <h3>${paper.year} Past Papers</h3>
                <p class="paper-description">${
                  paper.description ||
                  "Complete question papers with answers and explanations"
                }</p>
                
                <div class="paper-subjects">
                    ${paper.subjects
                      .map(
                        (subject) => `
                        <div class="paper-subject">
                            <div class="subject-info">
                                <span class="subject-name">${
                                  subject.name
                                }</span>
                                <span class="subject-meta">
                                    <i class="fas fa-download"></i> ${this.formatDownloadCount(
                                      subject.downloads || 0
                                    )}
                                    ${
                                      subject.pages
                                        ? `<i class="fas fa-file-alt"></i> ${subject.pages} pages`
                                        : ""
                                    }
                                </span>
                            </div>
                            <div class="subject-actions">
                                <a href="${subject.pdfUrl}" 
                                   class="paper-download" 
                                   download
                                   data-year="${paper.year}"
                                   data-subject="${subject.name}"
                                   role="button"
                                   tabindex="0"
                                   aria-label="Download ${subject.name} paper ${
                          paper.year
                        }">
                                    <i class="fas fa-download" aria-hidden="true"></i>
                                </a>
                                
                            </div>
                        </div>
                    `
                      )
                      .join("")}
                </div>
                
                <div class="paper-footer">
                    <span class="paper-total">
                        <i class="fas fa-book"></i> ${
                          paper.subjects.length
                        } Subjects
                    </span>
                    <span class="paper-size">
                        <i class="fas fa-hdd"></i> ${
                          paper.totalSize || "~25 MB"
                        }
                    </span>
                </div>
            </div>
        `
      )
      .join("");
  }

  renderTextbooks(textbooks, grade = null) {
    const grid = document.getElementById("textbooksGrid");

    if (!grid) {
      console.error("Textbooks grid element not found");
      return;
    }

    // Use provided grade or fall back to currentGrade, defaulting to "9" if "all"
    const displayGrade =
      grade || (this.currentGrade === "all" ? "9" : this.currentGrade);

    if (!textbooks || textbooks.length === 0) {
      grid.innerHTML = `
                <div class="no-results">
                    <i class="fas fa-book"></i>
                    <h3>No textbooks found for Grade ${displayGrade}</h3>
                </div>
            `;
      return;
    }

    grid.innerHTML = textbooks
      .map(
        (textbook) => `
            <div class="textbook-card">
                <div class="textbook-image">
                    <div class="textbook-cover">
                        <i class="fas fa-book-open"></i>
                    </div>
                    ${
                      textbook.edition
                        ? `<span class="edition-badge">${textbook.edition} Edition</span>`
                        : ""
                    }
                </div>
                
                <div class="textbook-content">
                    <div class="textbook-header">
                        <span class="textbook-grade">Grade ${
                          textbook.grade
                        }</span>
                        <span class="textbook-publisher">${(function (p) {
                          const pub = (p || "").toString();
                          return /moe|ministry/i.test(pub)
                            ? "MoE"
                            : pub || "MoE";
                        })(textbook.publisher)}</span>
                    </div>
                    
                    <h3 class="textbook-title">${textbook.subject}</h3>
                    <p class="textbook-description">${
                      textbook.description || "Official Ethiopian textbook"
                    }</p>
                    
                    <div class="textbook-meta">
                        <div class="textbook-info">
                            <span><i class="fas fa-calendar"></i> ${
                              textbook.year || "2023"
                            }</span>
                            <span><i class="fas fa-file-pdf"></i> ${
                              textbook.fileSize || "15.2 MB"
                            }</span>
                            <span><i class="fas fa-download"></i> ${this.formatDownloadCount(
                              textbook.downloads || 0
                            )}</span>
                        </div>
                        
                        ${
                          textbook.chapters
                            ? `<div class="textbook-chapters">
                                <i class="fas fa-list-ol"></i> ${textbook.chapters} Chapters
                              </div>`
                            : ""
                        }
                    </div>
                    
                    <div class="textbook-actions">
                        ${
                          textbook.previewUrl
                            ? `<a href="${textbook.previewUrl}" 
                               class="btn-preview" 
                               target="_blank">
                                <i class="fas fa-eye"></i> Preview
                            </a>`
                            : ""
                        }
                        <a href="${textbook.pdfUrl}" 
                           class="textbook-download" 
                           download
                           data-id="${textbook.id}"
                           data-subject="${textbook.subject}">
                            <i class="fas fa-download"></i> Download
                        </a>
                        ${
                          textbook.teacherGuideUrl
                            ? `<a href="${textbook.teacherGuideUrl}" 
                               class="btn-guide" 
                               download
                               title="Teacher's Guide">
                                <i class="fas fa-chalkboard-teacher"></i>
                            </a>`
                            : ""
                        }
                    </div>
                    
                    <div class="textbook-tags">
                        <span class="tag curriculum-tag">Official Curriculum</span>
                    </div>
                </div>
            </div>
        `
      )
      .join("");
  }

  async handleDownload(link) {
    const resourceId = link.dataset.id;
    const resourceTitle = link.dataset.title || "Resource";
    const pdfUrl = link.href;

    // Validate URL using validator utility
    const validation = this.validator.validatePDFUrl(pdfUrl);
    if (!validation.valid) {
      this.showNotification(validation.error, "error");
      return;
    }

    // Check availability
    const available = await this.isFileAvailable(pdfUrl);
    if (!available) {
      this.showNotification("Not available — coming soon.", "info");
      return;
    }

    // Check file size before downloading
    const fileSize = await this.downloadManager.getFileSize(pdfUrl);

    const confirmed = await this.showConfirmDialog(
      `Download "${resourceTitle}"?`,
      `File size: ${fileSize}. This will download the PDF file to your device.`
    );

    if (!confirmed) return;

    try {
      // Use download manager utility
      const result = await this.downloadManager.downloadPDF(
        pdfUrl,
        resourceTitle + ".pdf",
        {
          showProgress: true,
          onComplete: () => {
            // Track download with analytics
            this.analytics.trackDownload(
              resourceId,
              resourceTitle,
              "pdf",
              fileSize
            );

            // Save to storage
            this.storage.addToDownloadHistory({
              id: resourceId,
              title: resourceTitle,
              url: pdfUrl,
              type: "resource",
              fileSize: fileSize,
              timestamp: new Date().toISOString(),
            });

            // Update download count
            this.updateDownloadCount(resourceId);

            // Update statistics
            this.updateStatistics();
          },
          onError: (error) => {
            this.showNotification(
              "Failed to download. Please try again.",
              "error"
            );
            this.analytics.trackError(error, { context: "download" });
          },
        }
      );
    } catch (error) {
      console.error("Download error:", error);
      this.analytics.trackError(error, { context: "download" });
      this.showNotification(
        "Failed to download. Please check your connection.",
        "error"
      );
    }
  }

  async handlePaperDownload(link) {
    const year = link.dataset.year;
    const subject = link.dataset.subject;
    const type = link.dataset.type || "subject";
    const pdfUrl = link.href;

    if (pdfUrl === "#" || !pdfUrl) {
      this.showNotification("This paper is currently unavailable.", "error");
      return;
    }

    // Check availability
    const available = await this.isFileAvailable(pdfUrl);
    if (!available) {
      this.showNotification("Not available — coming soon.", "info");
      return;
    }

    const confirmed = await this.showConfirmDialog(
      `Download ${type === "combined" ? "All Papers" : subject} ${year}?`,
      type === "combined"
        ? "This will download all papers for this year as a ZIP file."
        : `This will download the ${subject} paper for ${year}.`
    );

    if (!confirmed) return;

    try {
      // Track download
      this.trackDownload(
        `${year}-${subject || "all"}`,
        `${subject || "All Papers"} ${year}`,
        "paper"
      );

      // Open download
      window.open(pdfUrl, "_blank");

      this.showNotification("Download started!", "success");
    } catch (error) {
      console.error("Download error:", error);
      this.showNotification("Failed to download. Please try again.", "error");
    }
  }

  async handleTextbookDownload(link) {
    const textbookId = link.dataset.id;
    const subject = link.dataset.subject;
    const pdfUrl = link.href;

    if (pdfUrl === "#" || !pdfUrl) {
      this.showNotification("This textbook is currently unavailable.", "error");
      return;
    }

    // Check availability
    const available = await this.isFileAvailable(pdfUrl);
    if (!available) {
      this.showNotification("Not available — coming soon.", "info");
      return;
    }

    const confirmed = await this.showConfirmDialog(
      `Download ${subject} Textbook?`,
      `This will download the ${subject} textbook for Grade ${this.currentGrade}.`
    );

    if (!confirmed) return;

    try {
      // Track download
      this.trackDownload(
        textbookId,
        `${subject} Grade ${this.currentGrade}`,
        "textbook"
      );

      // Open download
      window.open(pdfUrl, "_blank");

      this.showNotification("Download started!", "success");
    } catch (error) {
      console.error("Download error:", error);
      this.showNotification("Failed to download. Please try again.", "error");
    }
  }

  trackDownload(id, title, type) {
    // This is now handled by the download manager
    // Just update local state for UI
    const downloadRecord = {
      id,
      title,
      type,
      timestamp: new Date().toISOString(),
      date: new Date().toLocaleDateString(),
      time: new Date().toLocaleTimeString(),
    };

    this.downloadHistory.unshift(downloadRecord);

    // Keep only last 100 downloads in memory
    if (this.downloadHistory.length > 100) {
      this.downloadHistory = this.downloadHistory.slice(0, 100);
    }

    // Update statistics
    this.updateStatistics();
  }

  updateDownloadCount(resourceId) {
    // Update the download count display
    const downloadCountEl = document.querySelector(
      `[data-id="${resourceId}"] .download-count`
    );
    if (downloadCountEl) {
      const currentText = downloadCountEl.textContent;
      const currentCount = parseInt(currentText.replace(/\D/g, "")) || 0;
      downloadCountEl.textContent = `${(
        currentCount + 1
      ).toLocaleString()} downloads`;

      // Also update the data in memory
      const resource = this.resourcesData.find((r) => r.id === resourceId);
      if (resource) {
        resource.downloads = (resource.downloads || 0) + 1;
      }
    }
  }

  updateStatistics() {
    // Update total downloads from storage
    const downloadHistory = this.storage.getDownloadHistory();
    const totalDownloads = downloadHistory.length;

    document.querySelectorAll(".total-downloads").forEach((el) => {
      if (el.classList.contains("stat-number")) {
        this.animateCounter(el, totalDownloads);
      } else {
        el.textContent = totalDownloads.toLocaleString();
      }
    });

    // Update recent downloads
    const today = new Date().toDateString();
    const todayDownloads = downloadHistory.filter(
      (d) => new Date(d.timestamp).toDateString() === today
    ).length;

    document.querySelectorAll(".today-downloads").forEach((el) => {
      el.textContent = todayDownloads.toLocaleString();
    });

    // Get analytics stats
    const analyticsStats = this.analytics.getStatistics();
    console.log("Analytics stats:", analyticsStats);
  }

  animateCounter(element, target) {
    let current = 0;
    const increment = target / 50;
    const duration = 1000;
    const stepTime = duration / 50;

    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        element.textContent = target.toLocaleString();
        clearInterval(timer);
      } else {
        element.textContent = Math.floor(current).toLocaleString();
      }
    }, stepTime);
  }

  formatDownloadCount(count) {
    if (!count) return "0";
    if (count >= 1000000) {
      return (count / 1000000).toFixed(1) + "M";
    } else if (count >= 1000) {
      return (count / 1000).toFixed(1) + "K";
    }
    return count.toLocaleString();
  }

  formatDate(dateString) {
    if (!dateString) return "Recently";

    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;

    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  isNewResource(uploadedDate) {
    if (!uploadedDate) return false;
    const uploaded = new Date(uploadedDate);
    const now = new Date();
    const diffDays = Math.floor((now - uploaded) / (1000 * 60 * 60 * 24));
    return diffDays <= 7; // New if uploaded within last 7 days
  }

  isFavorite(resourceId) {
    return this.favorites.includes(resourceId);
  }

  getCategoryIcon(category) {
    const icons = {
      textbook: "fas fa-book",
      "past-paper": "fas fa-file-alt",
      notes: "fas fa-sticky-note",
      guide: "fas fa-compass",
    };
    return `<i class="${icons[category] || "fas fa-file"}"></i>`;
  }

  showSearchResults(term) {
    if (!term) return;

    const resultsCount = document.querySelectorAll(".resource-card").length;
    const searchInfo =
      document.getElementById("searchInfo") || this.createSearchInfoElement();

    searchInfo.innerHTML = `
            <div class="search-results-info">
                <span class="search-term">"${term}"</span>
                <span class="results-count">${resultsCount} results found</span>
                <button class="clear-search" id="clearSearch">
                    <i class="fas fa-times"></i> Clear
                </button>
            </div>
        `;

    document.getElementById("clearSearch")?.addEventListener("click", () => {
      document.getElementById("searchInput").value = "";
      this.searchTerm = "";
      this.loadAllResources();
      searchInfo.remove();
    });
  }

  createSearchInfoElement() {
    const container = document.querySelector(".resources .container");
    const searchInfo = document.createElement("div");
    searchInfo.id = "searchInfo";
    const resourcesGrid = container.querySelector(".resources-grid");
    if (resourcesGrid) {
      container.insertBefore(searchInfo, resourcesGrid);
    } else {
      container.appendChild(searchInfo);
    }
    return searchInfo;
  }

  showConfirmDialog(title, message) {
    return new Promise((resolve) => {
      // Create dialog
      const dialog = document.createElement("div");
      dialog.className = "confirm-dialog";
      dialog.innerHTML = `
                <div class="dialog-content">
                    <h3>${title}</h3>
                    <p>${message}</p>
                    <div class="dialog-actions">
                        <button class="btn-cancel">Cancel</button>
                        <button class="btn-confirm">Download</button>
                    </div>
                </div>
            `;

      // Styles are now in CSS, no need for inline styles

      document.body.appendChild(dialog);

      // Handle actions
      dialog.querySelector(".btn-cancel").addEventListener("click", () => {
        dialog.remove();
        resolve(false);
      });

      dialog.querySelector(".btn-confirm").addEventListener("click", () => {
        dialog.remove();
        resolve(true);
      });

      // Close on outside click
      dialog.addEventListener("click", (e) => {
        if (e.target === dialog) {
          dialog.remove();
          resolve(false);
        }
      });

      // Keyframes are now in CSS, no need to add them here
    });
  }

  showNotification(message, type = "info") {
    // Remove existing notifications
    document.querySelectorAll(".notification").forEach((n) => n.remove());

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
            <button class="notification-close"><i class="fas fa-times"></i></button>
        `;

    // Add styles
    notification.style.cssText = `
            position: fixed;
            top: 20px;
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
            box-shadow: var(--shadow-lg);
            display: flex;
            align-items: center;
            gap: 0.75rem;
            z-index: 9999;
            animation: slideInRight 0.3s ease;
            max-width: 400px;
        `;

    document.body.appendChild(notification);

    // Close button
    notification
      .querySelector(".notification-close")
      .addEventListener("click", () => {
        notification.style.animation = "slideOutRight 0.3s ease";
        setTimeout(() => notification.remove(), 300);
      });

    // Auto remove after 5 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.style.animation = "slideOutRight 0.3s ease";
        setTimeout(() => notification.remove(), 300);
      }
    }, 5000);

    // Add keyframes if not already added
    if (!document.querySelector("#notification-styles")) {
      const style = document.createElement("style");
      style.id = "notification-styles";
      style.textContent = `
                @keyframes slideInRight {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes slideOutRight {
                    from { transform: translateX(0); opacity: 1; }
                    to { transform: translateX(100%); opacity: 0; }
                }
            `;
      document.head.appendChild(style);
    }
  }

  async isFileAvailable(url) {
    try {
      const response = await fetch(url, { method: "HEAD" });
      return response.ok;
    } catch (e) {
      return false;
    }
  }

  showError(message) {
    this.showNotification(message, "error");
  }

  addResourceEventListeners() {
    // Favorite buttons
    document.querySelectorAll(".favorite-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const card = btn.closest(".resource-card");
        const resourceId = card.dataset.id;

        btn.classList.toggle("active");
        btn.innerHTML = btn.classList.contains("active")
          ? '<i class="fas fa-heart"></i>'
          : '<i class="far fa-heart"></i>';

        this.toggleFavorite(resourceId);
      });
    });

    // Preview buttons
    document.querySelectorAll(".btn-preview").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        const previewUrl = btn.dataset.preview;
        if (previewUrl && previewUrl !== "#") {
          window.open(previewUrl, "_blank");
        } else {
          this.showNotification(
            "Preview not available for this resource.",
            "info"
          );
        }
      });
    });
  }

  toggleFavorite(resourceId) {
    const index = this.favorites.indexOf(resourceId);
    if (index === -1) {
      this.favorites.push(resourceId);
      this.showNotification("Added to favorites", "success");
    } else {
      this.favorites.splice(index, 1);
      this.showNotification("Removed from favorites", "info");
    }
    localStorage.setItem("favorites", JSON.stringify(this.favorites));
  }

  addEventListeners() {
    // Load more resources on scroll
    window.addEventListener("scroll", () => {
      if (this.isScrolledToBottom() && !this.loadingMore) {
        this.loadMoreResources();
      }
    });

    // Update view counts (simulated)
    setInterval(() => {
      this.updateViewCounts();
    }, 30000);
  }

  isScrolledToBottom() {
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const scrollHeight = document.documentElement.scrollHeight;
    const clientHeight = document.documentElement.clientHeight;

    return scrollTop + clientHeight >= scrollHeight - 100;
  }

  async loadMoreResources() {
    // Implement pagination logic here
    console.log("Loading more resources...");
  }

  updateViewCounts() {
    // Simulate updating view counts
    document.querySelectorAll(".view-count").forEach((el) => {
      const current = parseInt(el.textContent.replace(/\D/g, "")) || 0;
      const increment = Math.floor(Math.random() * 3);
      el.textContent = (current + increment).toLocaleString() + " views";
    });
  }
}

// Initialize the application when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  // Create app instance
  window.examPortal = new ExamPortal();
});


