// Validation Utility Functions
export class Validator {
  constructor() {
    this.rules = {
      email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      phone: /^\+?[\d\s-]{10,}$/,
      url: /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/,
      filename: /^[^\\/:*?"<>|]+$/,
      pdfUrl: /\.pdf($|\?)/i,
      year: /^\d{4}$/,
    };
  }

  // Validate email
  validateEmail(email) {
    if (!email) return { valid: false, error: "Email is required" };

    if (!this.rules.email.test(email)) {
      return { valid: false, error: "Invalid email format" };
    }

    return { valid: true };
  }

  // Validate phone number
  validatePhone(phone) {
    if (!phone) return { valid: false, error: "Phone number is required" };

    const cleaned = phone.replace(/[\s-]/g, "");

    if (!this.rules.phone.test(cleaned)) {
      return { valid: false, error: "Invalid phone number format" };
    }

    return { valid: true };
  }

  // Validate URL
  validateURL(url, options = {}) {
    if (!url) return { valid: false, error: "URL is required" };

    try {
      const urlObj = new URL(url);

      if (options.requireHttps && urlObj.protocol !== "https:") {
        return { valid: false, error: "URL must use HTTPS" };
      }

      if (options.allowedDomains && options.allowedDomains.length > 0) {
        const domain = urlObj.hostname;
        const isAllowed = options.allowedDomains.some(
          (allowed) => domain === allowed || domain.endsWith("." + allowed)
        );

        if (!isAllowed) {
          return { valid: false, error: "URL domain not allowed" };
        }
      }

      if (options.requirePDF && !this.rules.pdfUrl.test(url)) {
        return { valid: false, error: "URL must point to a PDF file" };
      }

      return { valid: true };
    } catch {
      return { valid: false, error: "Invalid URL format" };
    }
  }

  // Validate file
  validateFile(file, options = {}) {
    if (!file) return { valid: false, error: "File is required" };

    const errors = [];

    // Check file type
    if (options.allowedTypes && options.allowedTypes.length > 0) {
      const fileType = file.type || this.getFileTypeFromName(file.name);
      const isAllowed = options.allowedTypes.includes(fileType);

      if (!isAllowed) {
        errors.push(`File type must be: ${options.allowedTypes.join(", ")}`);
      }
    }

    // Check file size
    if (options.maxSize && file.size > options.maxSize) {
      const maxSizeMB = (options.maxSize / (1024 * 1024)).toFixed(2);
      errors.push(`File size must be less than ${maxSizeMB}MB`);
    }

    // Check filename
    if (!this.rules.filename.test(file.name)) {
      errors.push("Invalid filename");
    }

    if (errors.length > 0) {
      return { valid: false, errors };
    }

    return { valid: true };
  }

  // Validate PDF URL
  validatePDFUrl(url) {
    return this.validateURL(url, { requirePDF: true });
  }

  // Validate year
  validateYear(year, options = {}) {
    if (!year) return { valid: false, error: "Year is required" };

    if (!this.rules.year.test(year)) {
      return { valid: false, error: "Year must be 4 digits" };
    }

    const yearNum = parseInt(year);
    const currentYear = new Date().getFullYear();

    if (options.minYear && yearNum < options.minYear) {
      return {
        valid: false,
        error: `Year must be ${options.minYear} or later`,
      };
    }

    if (options.maxYear && yearNum > options.maxYear) {
      return {
        valid: false,
        error: `Year must be ${options.maxYear} or earlier`,
      };
    }

    return { valid: true };
  }

  // Validate grade
  validateGrade(grade) {
    if (!grade) return { valid: false, error: "Grade is required" };

    const gradeNum = parseInt(grade);

    if (isNaN(gradeNum) || gradeNum < 9 || gradeNum > 12) {
      return { valid: false, error: "Grade must be between 9 and 12" };
    }

    return { valid: true };
  }

  // Validate search query
  validateSearchQuery(query, options = {}) {
    if (!query) return { valid: false, error: "Search query is required" };

    const trimmed = query.trim();

    if (trimmed.length < (options.minLength || 2)) {
      return {
        valid: false,
        error: `Query must be at least ${options.minLength || 2} characters`,
      };
    }

    if (options.maxLength && trimmed.length > options.maxLength) {
      return {
        valid: false,
        error: `Query must be less than ${options.maxLength} characters`,
      };
    }

    // Check for dangerous characters
    const dangerousChars = /[<>{}[\]\\]/;
    if (dangerousChars.test(trimmed)) {
      return { valid: false, error: "Query contains invalid characters" };
    }

    return { valid: true };
  }

  // Validate resource data
  validateResource(resource) {
    const errors = [];

    // Validate title
    if (!resource.title || resource.title.trim().length < 3) {
      errors.push("Title must be at least 3 characters");
    }

    if (resource.title && resource.title.length > 200) {
      errors.push("Title must be less than 200 characters");
    }

    // Validate description
    if (!resource.description || resource.description.trim().length < 10) {
      errors.push("Description must be at least 10 characters");
    }

    // Validate subject
    if (!resource.subject) {
      errors.push("Subject is required");
    }

    // Validate grade
    const gradeValidation = this.validateGrade(resource.grade);
    if (!gradeValidation.valid) {
      errors.push(gradeValidation.error);
    }

    // Validate category
    const validCategories = ["textbook", "past-paper", "notes", "guide"];
    if (!validCategories.includes(resource.category)) {
      errors.push(`Category must be one of: ${validCategories.join(", ")}`);
    }

    // Validate file size format
    if (resource.fileSize) {
      const sizeRegex = /^\d+(\.\d+)?\s*(B|KB|MB|GB)$/i;
      if (!sizeRegex.test(resource.fileSize)) {
        errors.push('File size must be in format like "15.2 MB"');
      }
    }

    // Validate downloads count
    if (resource.downloads !== undefined) {
      const downloads = parseInt(resource.downloads);
      if (isNaN(downloads) || downloads < 0) {
        errors.push("Downloads must be a positive number");
      }
    }

    // Validate URL if present
    if (resource.pdfUrl) {
      const urlValidation = this.validatePDFUrl(resource.pdfUrl);
      if (!urlValidation.valid) {
        errors.push(urlValidation.error);
      }
    }

    // Validate image URL if present
    if (resource.image) {
      const urlValidation = this.validateURL(resource.image);
      if (!urlValidation.valid) {
        errors.push(`Image URL: ${urlValidation.error}`);
      }
    }

    // Validate tags if present
    if (resource.tags && Array.isArray(resource.tags)) {
      if (resource.tags.length > 10) {
        errors.push("Maximum 10 tags allowed");
      }

      resource.tags.forEach((tag) => {
        if (tag.length > 20) {
          errors.push(`Tag "${tag}" is too long (max 20 characters)`);
        }

        if (!/^[a-zA-Z0-9\s-]+$/.test(tag)) {
          errors.push(`Tag "${tag}" contains invalid characters`);
        }
      });
    }

    if (errors.length > 0) {
      return { valid: false, errors };
    }

    return { valid: true };
  }

  // Validate form data
  validateForm(formData, schema) {
    const errors = {};

    Object.entries(schema).forEach(([field, rules]) => {
      const value = formData[field];
      const fieldErrors = [];

      // Required check
      if (rules.required && (!value || value.toString().trim() === "")) {
        fieldErrors.push(`${rules.label || field} is required`);
      }

      // Type check
      if (value && rules.type) {
        if (rules.type === "email" && !this.validateEmail(value).valid) {
          fieldErrors.push("Invalid email format");
        }

        if (rules.type === "url" && !this.validateURL(value).valid) {
          fieldErrors.push("Invalid URL format");
        }

        if (rules.type === "number") {
          const num = parseFloat(value);
          if (isNaN(num)) {
            fieldErrors.push("Must be a number");
          } else {
            if (rules.min !== undefined && num < rules.min) {
              fieldErrors.push(`Must be at least ${rules.min}`);
            }

            if (rules.max !== undefined && num > rules.max) {
              fieldErrors.push(`Must be at most ${rules.max}`);
            }
          }
        }
      }

      // Length check
      if (value && rules.minLength && value.length < rules.minLength) {
        fieldErrors.push(`Must be at least ${rules.minLength} characters`);
      }

      if (value && rules.maxLength && value.length > rules.maxLength) {
        fieldErrors.push(`Must be at most ${rules.maxLength} characters`);
      }

      // Pattern check
      if (value && rules.pattern && !rules.pattern.test(value)) {
        fieldErrors.push(rules.message || "Invalid format");
      }

      // Custom validation
      if (value && rules.validate) {
        const customResult = rules.validate(value, formData);
        if (customResult && !customResult.valid) {
          fieldErrors.push(customResult.error);
        }
      }

      if (fieldErrors.length > 0) {
        errors[field] = fieldErrors;
      }
    });

    if (Object.keys(errors).length > 0) {
      return { valid: false, errors };
    }

    return { valid: true };
  }

  // Sanitize input
  sanitize(input, type = "text") {
    if (!input) return "";

    let sanitized = input.toString().trim();

    switch (type) {
      case "html":
        // Remove HTML tags
        sanitized = sanitized.replace(/<[^>]*>/g, "");
        break;

      case "email":
        sanitized = sanitized.toLowerCase();
        break;

      case "filename":
        sanitized = sanitized.replace(/[\\/:*?"<>|]/g, "_");
        break;

      case "url":
        // Ensure URL starts with http:// or https://
        if (
          !sanitized.startsWith("http://") &&
          !sanitized.startsWith("https://")
        ) {
          sanitized = "https://" + sanitized;
        }
        break;
    }

    return sanitized;
  }

  // Get file type from filename
  getFileTypeFromName(filename) {
    const extension = filename.split(".").pop().toLowerCase();

    const typeMap = {
      pdf: "application/pdf",
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      png: "image/png",
      gif: "image/gif",
      doc: "application/msword",
      docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      xls: "application/vnd.ms-excel",
      xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      zip: "application/zip",
      rar: "application/x-rar-compressed",
    };

    return typeMap[extension] || "application/octet-stream";
  }

  // Format validation errors for display
  formatErrors(errors) {
    if (typeof errors === "string") {
      return errors;
    }

    if (Array.isArray(errors)) {
      return errors.join("\n");
    }

    if (typeof errors === "object") {
      return Object.values(errors).flat().join("\n");
    }

    return "Validation failed";
  }
}

// Create global instance
export const validator = new Validator();
