// Search Utility Functions
export class SearchEngine {
  constructor() {
    this.searchIndex = [];
    this.isIndexed = false;
    this.searchOptions = {
      threshold: 0.3,
      distance: 100,
      keys: ["title", "description", "subject", "tags", "grade", "year"],
    };
  }

  // Index resources for fast searching
  indexResources(resources) {
    // Store full resources for returning complete objects
    this.fullResources = resources;
    
    this.searchIndex = resources.map((resource) => ({
      id: resource.id,
      title: resource.title,
      description: resource.description,
      subject: resource.subject,
      tags: resource.tags || [],
      grade: resource.grade,
      year: resource.year,
      category: resource.category,
      // Create searchable text
      searchText: this.createSearchText(resource),
    }));

    this.isIndexed = true;
    console.log(`Indexed ${this.searchIndex.length} resources`);
  }

  // Create searchable text from resource
  createSearchText(resource) {
    const parts = [
      resource.title,
      resource.description,
      resource.subject,
      resource.grade,
      resource.year,
    ];

    if (resource.tags) {
      parts.push(...resource.tags);
    }

    return parts
      .filter(Boolean)
      .map((part) => part.toString().toLowerCase())
      .join(" ");
  }

  // Perform search
  search(query, options = {}) {
    if (!query || !this.isIndexed) {
      return options.returnAll ? (this.fullResources || []) : [];
    }

    const searchTerm = query.toLowerCase().trim();

    // Simple search implementation
    // In production, use a library like Fuse.js or Lunr.js
    const results = this.searchIndex.filter((item) => {
      // Exact matches
      if (item.title.toLowerCase().includes(searchTerm)) return true;
      if (item.description.toLowerCase().includes(searchTerm)) return true;
      if (item.subject.toLowerCase().includes(searchTerm)) return true;

      // Tag matches
      if (item.tags.some((tag) => tag.toLowerCase().includes(searchTerm)))
        return true;

      // Partial matches
      const words = searchTerm.split(" ");
      return words.some((word) => item.searchText.includes(word));
    });

    // Sort by relevance
    results.sort((a, b) => {
      const aScore = this.calculateRelevance(a, searchTerm);
      const bScore = this.calculateRelevance(b, searchTerm);
      return bScore - aScore;
    });

    // Apply filters
    const filteredResults = this.applyFilters(results, options.filters);

    // Map back to full resource objects
    const fullResults = filteredResults
      .map((item) => this.fullResources.find((r) => r.id === item.id))
      .filter(Boolean); // Remove any undefined items

    // Limit results
    if (options.limit && fullResults.length > options.limit) {
      return fullResults.slice(0, options.limit);
    }

    return fullResults;
  }

  // Calculate relevance score
  calculateRelevance(item, searchTerm) {
    let score = 0;

    // Title match (highest weight)
    if (item.title.toLowerCase().includes(searchTerm)) {
      score += 100;
    }

    // Subject match
    if (item.subject.toLowerCase().includes(searchTerm)) {
      score += 50;
    }

    // Exact match in description
    if (item.description.toLowerCase().includes(searchTerm)) {
      score += 30;
    }

    // Tag match
    if (item.tags.some((tag) => tag.toLowerCase().includes(searchTerm))) {
      score += 20;
    }

    // Word matches
    const words = searchTerm.split(" ");
    words.forEach((word) => {
      if (item.searchText.includes(word)) {
        score += 10;
      }
    });

    // Boost popular items
    // You could add download count or rating here

    return score;
  }

  // Apply filters to search results
  applyFilters(results, filters = {}) {
    if (!filters || Object.keys(filters).length === 0) {
      return results;
    }

    return results.filter((item) => {
      // Category filter
      if (filters.category && item.category !== filters.category) {
        return false;
      }

      // Grade filter
      if (filters.grade && item.grade !== filters.grade) {
        return false;
      }

      // Year filter
      if (filters.year && item.year !== filters.year) {
        return false;
      }

      // Subject filter
      if (filters.subject && item.subject !== filters.subject) {
        return false;
      }

      return true;
    });
  }

  // Get search suggestions
  getSuggestions(query, limit = 5) {
    if (!query || query.length < 2) {
      return [];
    }

    const searchTerm = query.toLowerCase();
    const suggestions = new Set();

    // Search in titles
    this.searchIndex.forEach((item) => {
      if (item.title.toLowerCase().includes(searchTerm)) {
        suggestions.add(item.title);
      }
    });

    // Search in subjects
    this.searchIndex.forEach((item) => {
      if (item.subject.toLowerCase().includes(searchTerm)) {
        suggestions.add(item.subject);
      }
    });

    // Search in tags
    this.searchIndex.forEach((item) => {
      item.tags.forEach((tag) => {
        if (tag.toLowerCase().includes(searchTerm)) {
          suggestions.add(tag);
        }
      });
    });

    // Convert to array and limit
    return Array.from(suggestions).slice(0, limit);
  }

  // Get popular searches
  getPopularSearches(limit = 10) {
    const searches = JSON.parse(localStorage.getItem("searchHistory") || "[]");

    // Count occurrences
    const searchCounts = {};
    searches.forEach((term) => {
      searchCounts[term] = (searchCounts[term] || 0) + 1;
    });

    // Sort by frequency
    return Object.entries(searchCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit)
      .map(([term]) => term);
  }

  // Save search to history
  saveSearch(query) {
    if (!query || query.length < 2) return;

    const searches = JSON.parse(localStorage.getItem("searchHistory") || "[]");

    // Add to beginning and remove duplicates
    searches.unshift(query);
    const uniqueSearches = [...new Set(searches)];

    // Keep only last 50 searches
    if (uniqueSearches.length > 50) {
      uniqueSearches.length = 50;
    }

    localStorage.setItem("searchHistory", JSON.stringify(uniqueSearches));
  }

  // Clear search history
  clearSearchHistory() {
    localStorage.removeItem("searchHistory");
    return true;
  }

  // Advanced search with multiple criteria
  advancedSearch(criteria) {
    let results = [...this.searchIndex];

    // Apply each criterion
    if (criteria.keywords) {
      results = this.search(criteria.keywords, { returnAll: false });
    }

    if (criteria.category) {
      results = results.filter((item) => item.category === criteria.category);
    }

    if (criteria.grade) {
      results = results.filter((item) => item.grade === criteria.grade);
    }

    if (criteria.subject) {
      results = results.filter((item) => item.subject === criteria.subject);
    }

    if (criteria.year) {
      results = results.filter((item) => item.year === criteria.year);
    }

    if (criteria.tags && criteria.tags.length > 0) {
      results = results.filter((item) =>
        criteria.tags.some((tag) => item.tags.includes(tag))
      );
    }

    // Sort by specified field
    if (criteria.sortBy) {
      results.sort((a, b) => {
        const field = criteria.sortBy;
        const order = criteria.sortOrder === "desc" ? -1 : 1;

        if (a[field] < b[field]) return -1 * order;
        if (a[field] > b[field]) return 1 * order;
        return 0;
      });
    }

    return results;
  }
}

// Create global instance
export const searchEngine = new SearchEngine();
