let allSubmissions = [];
let lessonSubmissions = [];

let originalPageOneSubmissions = [];

let submissionList;

let currentFilter = "lessons";
let isLoading = false;

// --------------------------------------------------
// URL handling
// --------------------------------------------------

function getBaseUrl() {
  const path = window.location.pathname;

  // Remove a page number if one exists.
  const basePath = path.replace(/\/\d+\/?$/, "");

  // Remove any trailing slash before adding our own.
  return `${window.location.origin}${basePath.replace(/\/$/, "")}`;
}

function getPageUrl(page) {
  const baseUrl = getBaseUrl();

  // Drawabox uses:
  // Page 1 -> /submissions/
  // Page 2 -> /submissions/1
  // Page 3 -> /submissions/2
  // Page 4 -> /submissions/3
  // etc.

  return page === 1 ? `${baseUrl}/` : `${baseUrl}/${page - 1}`;
}

// --------------------------------------------------
// Fetching
// --------------------------------------------------

async function fetchPage(page) {
  const url = getPageUrl(page);

  console.log(`Fetching page ${page}: ${url}`);

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch page ${page}: ${response.status}`);
  }

  const html = await response.text();

  const parser = new DOMParser();

  const parsedDocument = parser.parseFromString(html, "text/html");

  return parsedDocument.querySelectorAll("li.homework-submission");
}

// --------------------------------------------------
// UI
// --------------------------------------------------

function createUI() {
  const ui = document.createElement("div");

  ui.id = "drawabox-filter-ui";

  ui.innerHTML = `
        <div class="dab-filter-card">

            <div class="dab-filter-header">

                <div class="dab-filter-title">

                    <div class="dab-filter-icon">
                        <span class="fas fa-filter"></span>
                    </div>

                    <div>

                        <div class="dab-filter-heading">
                            Submission Filter
                        </div>

                        <div class="dab-filter-subtitle">
                            Showing lesson submissions
                        </div>

                    </div>

                </div>


                <button
                    id="dab-refresh"
                    class="dab-icon-button"
                    title="Scan submissions again"
                    aria-label="Scan submissions again"
                >
                    <span class="fas fa-sync-alt"></span>
                </button>

            </div>


            <div class="dab-filter-body">

                <div class="dab-filter-mode">

                    <span class="dab-mode-label">
                        All submissions
                    </span>

                    <label class="dab-switch">

                        <input
                            type="checkbox"
                            id="dab-filter-toggle"
                            checked
                        >

                        <span class="dab-slider"></span>

                    </label>

                    <span class="dab-mode-label dab-active-label">
                        Lessons only
                    </span>

                </div>


                <div
                    id="dab-filter-status"
                    class="dab-filter-status"
                >

                    <span class="dab-spinner"></span>

                    <span id="dab-status-text">
                        Scanning submissions...
                    </span>

                </div>

            </div>

        </div>
    `;

  const firstSubmission = document.querySelector("li.homework-submission");

  if (firstSubmission) {
    const parent = firstSubmission.parentElement;

    parent.parentElement.insertBefore(ui, parent);
  } else {
    console.error("Drawabox Filter: Could not find submission list.");

    return;
  }

  document
    .querySelector("#dab-filter-toggle")
    .addEventListener("change", (event) => {
      currentFilter = event.target.checked ? "lessons" : "all";

      renderSubmissions();
    });

  document.querySelector("#dab-refresh").addEventListener("click", () => {
    scanSubmissions();
  });
}

// --------------------------------------------------
// Status
// --------------------------------------------------

function setStatus(message, loading = false) {
  const status = document.querySelector("#dab-filter-status");

  const text = document.querySelector("#dab-status-text");

  if (!status || !text) {
    return;
  }

  text.textContent = message;

  status.classList.toggle("dab-loading", loading);
}

// --------------------------------------------------
// Rendering
// --------------------------------------------------

function renderSubmissions() {
  if (!submissionList) {
    return;
  }

  const submissions =
    currentFilter === "lessons" ? lessonSubmissions : allSubmissions;

  submissionList.innerHTML = "";

  submissions.forEach((submission) => {
    submissionList.appendChild(submission.cloneNode(true));
  });

  const lessonCount = lessonSubmissions.length;

  const totalCount = allSubmissions.length;

  const subtitle = document.querySelector(".dab-filter-subtitle");

  if (subtitle) {
    if (currentFilter === "lessons") {
      subtitle.textContent = `${lessonCount} lesson submission${
        lessonCount === 1 ? "" : "s"
      }`;
    } else {
      subtitle.textContent = `${totalCount} total submission${
        totalCount === 1 ? "" : "s"
      }`;
    }
  }

  setStatus(
    currentFilter === "lessons"
      ? `Showing ${lessonCount} lesson submission${
          lessonCount === 1 ? "" : "s"
        }`
      : `Showing all ${totalCount} submissions`,

    false,
  );
}

// --------------------------------------------------
// Scan everything
// --------------------------------------------------

async function scanSubmissions() {
  if (isLoading) {
    return;
  }

  isLoading = true;

  const toggle = document.querySelector("#dab-filter-toggle");

  const refresh = document.querySelector("#dab-refresh");

  if (toggle) {
    toggle.disabled = true;
  }

  if (refresh) {
    refresh.disabled = true;

    refresh.classList.add("dab-spinning");
  }

  setStatus("Scanning submissions...", true);

  try {
    allSubmissions = [];
    lessonSubmissions = [];

    let page = 1;

    while (true) {
      setStatus(`Scanning page ${page}...`, true);

      let submissions;

      if (page === 1) {
        /*
         * Use the original page-1 submissions.
         *
         * We cannot read page 1 from the live DOM
         * because renderSubmissions() modifies it.
         */

        submissions = originalPageOneSubmissions;
      } else {
        submissions = await fetchPage(page);
      }

      console.log(`Page ${page}: ${submissions.length} submissions`);

      // No submissions means we've reached the end.
      if (submissions.length === 0) {
        break;
      }

      submissions.forEach((submission) => {
        const clone = submission.cloneNode(true);

        allSubmissions.push(clone);

        const titleElement = submission.querySelector("div.meta > h3");

        if (!titleElement) {
          return;
        }

        const title = titleElement.textContent.trim();

        /*
         * Drawing Prompt submissions always
         * begin with "Drawing Prompt: ".
         */

        if (!title.startsWith("Drawing Prompt: ")) {
          lessonSubmissions.push(clone.cloneNode(true));
        }
      });

      page++;
    }

    console.log(`Total submissions: ${allSubmissions.length}`);

    console.log(`Lesson submissions: ${lessonSubmissions.length}`);

    renderSubmissions();
  } catch (error) {
    console.error("Drawabox Filter:", error);

    setStatus("Something went wrong while scanning.", false);
  } finally {
    isLoading = false;

    if (toggle) {
      toggle.disabled = false;
    }

    if (refresh) {
      refresh.disabled = false;

      refresh.classList.remove("dab-spinning");
    }
  }
}

// --------------------------------------------------
// Initialization
// --------------------------------------------------

function initialize() {
  const submissions = document.querySelectorAll("li.homework-submission");

  if (submissions.length === 0) {
    console.error("Drawabox Filter: No submissions found.");

    return;
  }

  /*
   * Save an untouched copy of page 1 BEFORE
   * the extension modifies the DOM.
   */

  originalPageOneSubmissions = Array.from(submissions).map((submission) =>
    submission.cloneNode(true),
  );

  /*
   * Store the actual submission list.
   * This is where filtered submissions will
   * eventually be rendered.
   */

  submissionList = submissions[0].parentElement;

  createUI();

  scanSubmissions();
}

initialize();
