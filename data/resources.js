// Resources Data - Combined data from textbooks and past papers
// This creates a unified resource list that can be displayed in the resources section

// Import textbook and past paper data
import { textbooksData } from "./textbooks.js";
import { pastPapersData } from "./past-papers.js";

// Convert textbooks to resource format
const textbookResources = Object.values(textbooksData)
  .flat()
  .map((textbook) => ({
    id: textbook.id,
    title: textbook.title || `${textbook.subject} Grade ${textbook.grade}`,
    description:
      textbook.description ||
      `Official ${textbook.subject} textbook for Grade ${textbook.grade}`,
    category: "textbook",
    subject: textbook.subject,
    grade: textbook.grade,
    year: textbook.year || "2023",
    pdfUrl: textbook.pdfUrl,
    previewUrl: textbook.previewUrl,
    fileSize: textbook.fileSize || "15.2 MB",
    pages: textbook.pages,
    downloads: textbook.downloads || 0,
    uploaded: textbook.updated || textbook.year || "2023-01-01",
    quality: textbook.quality || "High Quality",
    tags: textbook.tags || [],
    image: `https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=300&fit=crop&q=80`,
    publisher: textbook.publisher || "MOE",
  }));

// Convert past papers to resource format
const pastPaperResources = pastPapersData.flatMap((paper) =>
  paper.subjects.map((subject) => ({
    id: `${subject.code || subject.name.toLowerCase()}-${paper.year}`,
    title: `${subject.name} EUEE ${paper.year}`,
    description: `${subject.name} past paper from ${paper.year} Ethiopian University Entrance Examination`,
    category: "past-paper",
    subject: subject.name,
    grade: "12",
    year: paper.year,
    pdfUrl: subject.pdfUrl,
    previewUrl: subject.previewUrl,
    fileSize: subject.fileSize || "5 MB",
    pages: subject.pages,
    downloads: subject.downloads || 0,
    uploaded: paper.uploaded || paper.year,
    quality: "High Quality",
    tags: subject.tags || [paper.year, "EUEE", subject.name],
    image: `https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=400&h=300&fit=crop&q=80`,
    questions: subject.questions,
    duration: subject.duration,
    difficulty: subject.difficulty,
  }))
);

// Combine all resources
export const resourcesData = [...textbookResources, ...pastPaperResources];

// Function to get all resources
export function getAllResources() {
  return resourcesData;
}

// Function to get resources by category
export function getResourcesByCategory(category) {
  return resourcesData.filter((resource) => resource.category === category);
}

// Function to get resources by grade
export function getResourcesByGrade(grade) {
  return resourcesData.filter(
    (resource) =>
      resource.grade === grade ||
      (resource.grade && resource.grade.includes(grade))
  );
}

// Function to get resources by subject
export function getResourcesBySubject(subject) {
  return resourcesData.filter((resource) => resource.subject === subject);
}

// Function to search resources
export function searchResources(query) {
  const searchTerm = query.toLowerCase().trim();
  return resourcesData.filter(
    (resource) =>
      resource.title.toLowerCase().includes(searchTerm) ||
      resource.description.toLowerCase().includes(searchTerm) ||
      resource.subject.toLowerCase().includes(searchTerm) ||
      (resource.tags &&
        resource.tags.some((tag) => tag.toLowerCase().includes(searchTerm))) ||
      resource.category.toLowerCase().includes(searchTerm)
  );
}

// Function to get popular resources
export function getPopularResources(limit = 10) {
  return [...resourcesData]
    .sort((a, b) => b.downloads - a.downloads)
    .slice(0, limit);
}

// Function to get new resources
export function getNewResources(limit = 10) {
  return [...resourcesData]
    .sort((a, b) => new Date(b.uploaded) - new Date(a.uploaded))
    .slice(0, limit);
}
