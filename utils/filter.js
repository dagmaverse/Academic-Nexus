// Filter Utility Functions
export class FilterManager {
  constructor() {
    this.activeFilters = {
      category: "all",
      grade: "all",
      year: "all",
      subject: "all",
      sortBy: "popular",
      tags: [],
    };

    this.filterCallbacks = [];
  }

  // Initialize filters from URL parameters
  initFromURL() {
    const params = new URLSearchParams(window.location.search);

    this.activeFilters = {
      category: params.get("category") || "all",
      grade: params.get("grade") || "all",
      year: params.get("year") || "all",
      subject: params.get("subject") || "all",
      sortBy: params.get("sort") || "popular",
      tags: params.get("tags") ? params.get("tags").split(",") : [],
    };

    this.updateURL();
    return this.activeFilters;
  }

  // Apply filters to resources
  applyFilters(resources, filters = null) {
    const activeFilters = filters || this.activeFilters;
    let filtered = [...resources];

    // Category filter
    if (activeFilters.category !== "all") {
      filtered = filtered.filter(
        (item) => item.category === activeFilters.category
      );
    }

    // Grade filter
    if (activeFilters.grade !== "all") {
      filtered = filtered.filter((item) => item.grade === activeFilters.grade);
    }

    // Year filter
    if (activeFilters.year !== "all") {
      filtered = filtered.filter((item) => item.year === activeFilters.year);
    }

    // Subject filter
    if (activeFilters.subject !== "all") {
      filtered = filtered.filter(
        (item) => item.subject === activeFilters.subject
      );
    }

    // Tags filter
    if (activeFilters.tags.length > 0) {
      filtered = filtered.filter((item) =>
        activeFilters.tags.every((tag) => item.tags && item.tags.includes(tag))
      );
    }

    // Apply sorting
    filtered = this.applySorting(filtered, activeFilters.sortBy);

    return filtered;
  }

  // Apply sorting
  applySorting(resources, sortBy) {
    const sorted = [...resources];

    switch (sortBy) {
      case "newest":
        sorted.sort(
          (a, b) => new Date(b.uploaded || 0) - new Date(a.uploaded || 0)
        );
        break;

      case "oldest":
        sorted.sort(
          (a, b) => new Date(a.uploaded || 0) - new Date(b.uploaded || 0)
        );
        break;

      case "popular":
        sorted.sort((a, b) => (b.downloads || 0) - (a.downloads || 0));
        break;

      case "name-asc":
        sorted.sort((a, b) => a.title.localeCompare(b.title));
        break;

      case "name-desc":
        sorted.sort((a, b) => b.title.localeCompare(a.title));
        break;

      case "size-asc":
        sorted.sort(
          (a, b) =>
            this.parseFileSize(a.fileSize) - this.parseFileSize(b.fileSize)
        );
        break;

      case "size-desc":
        sorted.sort(
          (a, b) =>
            this.parseFileSize(b.fileSize) - this.parseFileSize(a.fileSize)
        );
        break;
    }

    return sorted;
  }

  // Parse file size string to bytes
  parseFileSize(sizeString) {
    if (!sizeString) return 0;

    const match = sizeString.match(/^(\d+(?:\.\d+)?)\s*(B|KB|MB|GB)$/i);
    if (!match) return 0;

    const [, number, unit] = match;
    const num = parseFloat(number);

    switch (unit.toUpperCase()) {
      case "GB":
        return num * 1024 * 1024 * 1024;
      case "MB":
        return num * 1024 * 1024;
      case "KB":
        return num * 1024;
      default:
        return num;
    }
  }

  // Set a filter
  setFilter(key, value) {
    this.activeFilters[key] = value;
    this.updateURL();
    this.notifyListeners();
    return this.activeFilters;
  }

  // Set multiple filters
  setFilters(filters) {
    Object.assign(this.activeFilters, filters);
    this.updateURL();
    this.notifyListeners();
    return this.activeFilters;
  }

  // Reset all filters
  resetFilters() {
    this.activeFilters = {
      category: "all",
      grade: "all",
      year: "all",
      subject: "all",
      sortBy: "popular",
      tags: [],
    };

    this.updateURL();
    this.notifyListeners();
    return this.activeFilters;
  }

  // Get active filters
  getActiveFilters() {
    return { ...this.activeFilters };
  }

  // Update URL with current filters
  updateURL() {
    const params = new URLSearchParams();

    Object.entries(this.activeFilters).forEach(([key, value]) => {
      if (value !== "all" && value !== "popular" && value !== "") {
        if (Array.isArray(value)) {
          if (value.length > 0) {
            params.set(key, value.join(","));
          }
        } else {
          params.set(key, value);
        }
      }
    });

    const newURL = params.toString()
      ? `${window.location.pathname}?${params.toString()}`
      : window.location.pathname;

    window.history.replaceState({}, "", newURL);
  }

  // Register filter change listener
  onFilterChange(callback) {
    this.filterCallbacks.push(callback);
    return () => {
      const index = this.filterCallbacks.indexOf(callback);
      if (index > -1) {
        this.filterCallbacks.splice(index, 1);
      }
    };
  }

  // Notify all listeners
  notifyListeners() {
    this.filterCallbacks.forEach((callback) => {
      callback(this.activeFilters);
    });
  }

  // Get available filter options from resources
  getFilterOptions(resources) {
    const options = {
      categories: new Set(),
      grades: new Set(),
      years: new Set(),
      subjects: new Set(),
      tags: new Set(),
    };

    resources.forEach((resource) => {
      if (resource.category) options.categories.add(resource.category);
      if (resource.grade) options.grades.add(resource.grade);
      if (resource.year) options.years.add(resource.year);
      if (resource.subject) options.subjects.add(resource.subject);
      if (resource.tags) {
        resource.tags.forEach((tag) => options.tags.add(tag));
      }
    });

    // Convert Sets to sorted arrays
    return {
      categories: Array.from(options.categories).sort(),
      grades: Array.from(options.grades).sort((a, b) => a - b),
      years: Array.from(options.years).sort((a, b) => b - a),
      subjects: Array.from(options.subjects).sort(),
      tags: Array.from(options.tags).sort(),
    };
  }

  // Create filter UI elements
  createFilterUI(options, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = "";

    // Category filter
    this.createSelectFilter(
      container,
      "Category",
      "category",
      ["all", ...options.categories],
      this.activeFilters.category
    );

    // Grade filter
    this.createSelectFilter(
      container,
      "Grade",
      "grade",
      ["all", ...options.grades],
      this.activeFilters.grade
    );

    // Year filter
    this.createSelectFilter(
      container,
      "Year",
      "year",
      ["all", ...options.years],
      this.activeFilters.year
    );

    // Subject filter
    this.createSelectFilter(
      container,
      "Subject",
      "subject",
      ["all", ...options.subjects],
      this.activeFilters.subject
    );

    // Sort filter
    this.createSelectFilter(
      container,
      "Sort By",
      "sortBy",
      [
        "popular",
        "newest",
        "oldest",
        "name-asc",
        "name-desc",
        "size-asc",
        "size-desc",
      ],
      this.activeFilters.sortBy
    );

    // Tags filter
    this.createTagsFilter(container, "Tags", options.tags);

    // Reset button
    const resetBtn = document.createElement("button");
    resetBtn.className = "btn btn-outline";
    resetBtn.innerHTML = '<i class="fas fa-redo"></i> Reset Filters';
    resetBtn.addEventListener("click", () => {
      this.resetFilters();
      this.createFilterUI(options, containerId);
    });
    container.appendChild(resetBtn);
  }

  // Create select filter
  createSelectFilter(container, label, key, options, selectedValue) {
    const wrapper = document.createElement("div");
    wrapper.className = "filter-group";

    const labelEl = document.createElement("label");
    labelEl.textContent = label;
    labelEl.htmlFor = `filter-${key}`;

    const select = document.createElement("select");
    select.id = `filter-${key}`;
    select.className = "filter-select";
    select.dataset.filterKey = key;

    options.forEach((option) => {
      const optionEl = document.createElement("option");
      optionEl.value = option;
      optionEl.textContent = this.formatOptionLabel(option);
      optionEl.selected = option === selectedValue;
      select.appendChild(optionEl);
    });

    select.addEventListener("change", (e) => {
      this.setFilter(key, e.target.value);
    });

    wrapper.appendChild(labelEl);
    wrapper.appendChild(select);
    container.appendChild(wrapper);
  }

  // Create tags filter
  createTagsFilter(container, label, tags) {
    if (tags.length === 0) return;

    const wrapper = document.createElement("div");
    wrapper.className = "filter-group";

    const labelEl = document.createElement("label");
    labelEl.textContent = label;

    const tagsContainer = document.createElement("div");
    tagsContainer.className = "tags-container";

    tags.forEach((tag) => {
      const tagEl = document.createElement("button");
      tagEl.className = "tag-filter";
      tagEl.textContent = tag;
      tagEl.dataset.tag = tag;

      if (this.activeFilters.tags.includes(tag)) {
        tagEl.classList.add("active");
      }

      tagEl.addEventListener("click", () => {
        this.toggleTag(tag);
        tagEl.classList.toggle("active");
      });

      tagsContainer.appendChild(tagEl);
    });

    wrapper.appendChild(labelEl);
    wrapper.appendChild(tagsContainer);
    container.appendChild(wrapper);
  }

  // Toggle tag in filter
  toggleTag(tag) {
    const index = this.activeFilters.tags.indexOf(tag);

    if (index === -1) {
      this.activeFilters.tags.push(tag);
    } else {
      this.activeFilters.tags.splice(index, 1);
    }

    this.updateURL();
    this.notifyListeners();
  }

  // Format option label
  formatOptionLabel(option) {
    if (option === "all") return "All";
    if (option === "popular") return "Most Popular";
    if (option === "newest") return "Newest First";
    if (option === "oldest") return "Oldest First";
    if (option === "name-asc") return "Name (A-Z)";
    if (option === "name-desc") return "Name (Z-A)";
    if (option === "size-asc") return "Size (Smallest)";
    if (option === "size-desc") return "Size (Largest)";
    return option.toString();
  }
}

// Create global instance
export const filterManager = new FilterManager();
