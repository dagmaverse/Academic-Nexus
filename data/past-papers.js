// Past Papers Database
export const pastPapersData = [
  {
    year: "2025",
    title: "EUEE 2025 Papers",
    description:
      "Complete set of Ethiopian University Entrance Examination papers for 2025",
    totalDownloads: 125600,
    totalSize: "85 MB",
    subjects: [
      {
        name: "Mathematics",
        code: "MATH-2025",
        downloads: 28900,
        fileSize: "8.7 MB",
        pages: 28,
        pdfUrl: "./pdfs/past-papers/2025/mathematics-2025.pdf",
        previewUrl: "https://drive.google.com/file/d/sample-math-2025/preview",
        questions: 60,
        duration: "3 hours",
        difficulty: "Medium",
        tags: ["Algebra", "Calculus", "Geometry", "Statistics"],
      },
      {
        name: "Physics",
        downloads: 15600,
        fileSize: "6.5 MB",
        pages: 22,
        code: "PHYS-2025",
        pdfUrl: "./pdfs/past-papers/2025/physics-2025.pdf",
        previewUrl:
          "https://drive.google.com/file/d/sample-physics-2025/preview",
        questions: 50,
        duration: "2.5 hours",
        difficulty: "Hard",
        tags: ["Mechanics", "Electricity", "Waves", "Modern Physics"],
      },
      {
        name: "Chemistry",
        downloads: 14200,
        fileSize: "5.8 MB",
        pages: 20,
        code: "CHEM-2025",
        pdfUrl: "./pdfs/past-papers/2025/chemistry-2025.pdf",
        questions: 50,
        duration: "2.5 hours",
        difficulty: "Medium",
        tags: ["Organic", "Inorganic", "Physical Chemistry"],
      },
      {
        name: "Biology",
        downloads: 13800,
        fileSize: "7.2 MB",
        pages: 25,
        code: "BIO-2025",
        pdfUrl: "./pdfs/past-papers/2025/biology-2025.pdf",
        questions: 55,
        duration: "2.5 hours",
        difficulty: "Medium",
        tags: ["Botany", "Zoology", "Genetics", "Ecology"],
      },
      {
        name: "English",
        downloads: 17500,
        fileSize: "4.5 MB",
        pages: 18,
        code: "ENG-2025",
        pdfUrl: "./pdfs/past-papers/2025/english-2025.pdf",
        questions: 80,
        duration: "2 hours",
        difficulty: "Easy",
        tags: ["Grammar", "Comprehension", "Literature"],
      },
      {
        name: "Aptitude",
        downloads: 12500,
        fileSize: "3.8 MB",
        pages: 16,
        code: "APT-2025",
        pdfUrl: "./pdfs/past-papers/2025/aptitude-2025.pdf",
        questions: 70,
        duration: "2 hours",
        difficulty: "Easy",
        tags: ["Grammar", "Comprehension", "Literature"],
      },
    ],
    combinedPdfUrl: "./pdfs/past-papers/2025/all-subjects-2025.zip",
    uploaded: "2025-01-10",
    updated: "2025-01-10",
  },
  {
    year: "2024",
    title: "EUEE 2024 Papers",
    description:
      "Complete set of Ethiopian University Entrance Examination papers for 2024",
    totalDownloads: 112800,
    totalSize: "82 MB",
    subjects: [
      {
        name: "Mathematics",
        downloads: 26500,
        fileSize: "8.5 MB",
        pdfUrl: "./pdfs/past-papers/2024/mathematics-2024.pdf",
      },
      {
        name: "Physics",
        downloads: 14500,
        fileSize: "6.3 MB",
        pdfUrl: "./pdfs/past-papers/2024/physics-2024.pdf",
      },
      {
        name: "Chemistry",
        downloads: 13200,
        fileSize: "5.6 MB",
        pdfUrl: "./pdfs/past-papers/2024/chemistry-2024.pdf",
      },
      {
        name: "Biology",
        downloads: 12800,
        fileSize: "7.0 MB",
        pdfUrl: "./pdfs/past-papers/2024/biology-2024.pdf",
      },
      {
        name: "English",
        downloads: 16200,
        fileSize: "4.3 MB",
        pdfUrl: "./pdfs/past-papers/2024/english-2024.pdf",
      },
    ],
    uploaded: "2025-01-09",
  },
  {
    year: "2023",
    title: "EUEE 2023 Papers",
    description:
      "Complete set of Ethiopian University Entrance Examination papers for 2023",
    totalDownloads: 105400,
    totalSize: "80 MB",
    subjects: [
      {
        name: "Mathematics",
        downloads: 24500,
        fileSize: "8.3 MB",
        pdfUrl: "./pdfs/past-papers/2023/mathematics-2023.pdf",
      },
      {
        name: "Physics",
        downloads: 13500,
        fileSize: "6.1 MB",
        pdfUrl: "./pdfs/past-papers/2023/physics-2023.pdf",
      },
      {
        name: "Chemistry",
        downloads: 12200,
        fileSize: "5.4 MB",
        pdfUrl: "./pdfs/past-papers/2023/chemistry-2023.pdf",
      },
      {
        name: "Biology",
        downloads: 11800,
        fileSize: "6.8 MB",
        pdfUrl: "./pdfs/past-papers/2023/biology-2023.pdf",
      },
    ],
    uploaded: "2025-01-08",
  },
];

// Function to get all years
export function getAllYears() {
  return pastPapersData.map((paper) => paper.year);
}

// Function to get papers by year
export function getPapersByYear(year) {
  return pastPapersData.find((paper) => paper.year === year);
}

// Function to get all subjects across years
export function getAllSubjects() {
  const subjects = new Set();
  pastPapersData.forEach((paper) => {
    paper.subjects.forEach((subject) => {
      subjects.add(subject.name);
    });
  });
  return Array.from(subjects);
}
