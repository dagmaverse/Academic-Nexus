// Theme toggle: persist dark mode in localStorage.
// Use single #themeToggle button (getElementById) and use data-theme attribute to match CSS.
// Note: This is a fallback implementation. script.js also handles theme toggle.
let darkmode = localStorage.getItem("darkmode") || localStorage.getItem("theme");
const themeToggle = document.getElementById("themeToggle");

const enableDarkmode = () => {
  document.documentElement.setAttribute("data-theme", "dark");
  localStorage.setItem("theme", "dark");
  localStorage.setItem("darkmode", "active");
};

const disableDarkmode = () => {
  document.documentElement.setAttribute("data-theme", "light");
  localStorage.setItem("theme", "light");
  localStorage.removeItem("darkmode");
};

// Initialize on load
if (darkmode === "active" || darkmode === "dark") {
  enableDarkmode();
} else if (window.matchMedia("(prefers-color-scheme: dark)").matches && !localStorage.getItem("theme")) {
  enableDarkmode();
}

if (themeToggle) {
  themeToggle.addEventListener("click", () => {
    const currentTheme = document.documentElement.getAttribute("data-theme");
    if (currentTheme === "dark") {
      disableDarkmode();
    } else {
      enableDarkmode();
    }
  });
} else {
  // Fallback for debugging: theme toggle button not found
  console.warn("Theme toggle button not found: #themeToggle");
}
