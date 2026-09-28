let allSubmissions = [];
let lessonSubmissions = [];
let drawingPromptSubmissions = [];
let otherSubmissions = [];

let originalPageSubmissions = [];

let submissionList;

let currentFilter = "all";
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
  // Page 2 -> /submissions/2
  // Page 3 -> /submissions/3
  // Page 4 -> /submissions/4
  // etc.

  return page === 1 ? `${baseUrl}/` : `${baseUrl}/${page}`;
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
                            Scanning submissions...
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

                <div class="dab-filter-options">

                    <label class="dab-radio-option">
                        <input
                            type="radio"
                            name="dab-filter"
                            value="all"
                            checked
                        >

                        <span class="dab-radio"></span>

                        <span class="dab-mode-label dab-active-label">
                            All
                        </span>
                    </label>


                    <label class="dab-radio-option">
                        <input
                            type="radio"
                            name="dab-filter"
                            value="lessons"
                        >

                        <span class="dab-radio"></span>

                        <span class="dab-mode-label">
                            Lessons Only
                        </span>
                    </label>


                    <label class="dab-radio-option">
                        <input
                            type="radio"
                            name="dab-filter"
                            value="drawing-prompts"
                        >

                        <span class="dab-radio"></span>

                        <span class="dab-mode-label">
                            Drawing Prompts Only
                        </span>
                    </label>


                    <label class="dab-radio-option">
                        <input
                            type="radio"
                            name="dab-filter"
                            value="others"
                        >

                        <span class="dab-radio"></span>

                        <span class="dab-mode-label">
                            Others
                        </span>
                    </label>

                </div>


                <div
                    id="dab-filter-status"
                    class="dab-filter-status dab-loading"
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

  document.querySelectorAll('input[name="dab-filter"]').forEach((radio) => {
    radio.addEventListener("change", (event) => {
      currentFilter = event.target.value;

      updateActiveLabel();

      renderSubmissions();
    });
  });

  document.querySelector("#dab-refresh").addEventListener("click", () => {
    scanSubmissions();
  });
}

// --------------------------------------------------
// Active label
// --------------------------------------------------

function updateActiveLabel() {
  const options = document.querySelectorAll(".dab-radio-option");

  options.forEach((option) => {
    const radio = option.querySelector('input[type="radio"]');

    const label = option.querySelector(".dab-mode-label");

    if (!radio || !label) {
      return;
    }

    label.classList.toggle("dab-active-label", radio.value === currentFilter);
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

  let submissions;

  switch (currentFilter) {
    case "lessons":
      submissions = lessonSubmissions;
      break;

    case "drawing-prompts":
      submissions = drawingPromptSubmissions;
      break;

    case "others":
      submissions = otherSubmissions;
      break;

    case "all":
    default:
      submissions = allSubmissions;
      break;
  }

  submissionList.innerHTML = "";

  submissions.forEach((submission) => {
    submissionList.appendChild(submission.cloneNode(true));
  });

  const totalCount = allSubmissions.length;

  const subtitle = document.querySelector(".dab-filter-subtitle");

  if (subtitle) {
    subtitle.textContent = `${totalCount} total submission${
      totalCount === 1 ? "" : "s"
    }`;
  }

  let statusMessage;

  switch (currentFilter) {
    case "lessons":
      statusMessage = `Showing ${lessonSubmissions.length} lesson submission${
        lessonSubmissions.length === 1 ? "" : "s"
      }`;
      break;

    case "drawing-prompts":
      statusMessage = `Showing ${drawingPromptSubmissions.length} drawing prompt submission${
        drawingPromptSubmissions.length === 1 ? "" : "s"
      }`;
      break;

    case "others":
      statusMessage = `Showing ${otherSubmissions.length} other submission${
        otherSubmissions.length === 1 ? "" : "s"
      }`;
      break;

    case "all":
    default:
      statusMessage = `Showing all ${totalCount} submissions`;
      break;
  }

  setStatus(statusMessage, false);
}

// --------------------------------------------------
// Submission classification
// --------------------------------------------------

function isLessonSubmission(title) {
  if (/^Lesson [1-7]: /.test(title)) {
    return true;
  }

  const challenges = [
    "250 Box Challenge",
    "250 Cylinder Challenge",
    "25 Wheel Challenge",
    "25 Texture Challenge",
    "100 Treasure Chest Challenge",
  ];

  return challenges.some((challenge) => title.startsWith(challenge));
}

function isDrawingPromptSubmission(title) {
  return title.startsWith("Drawing Prompt: ");
}

// --------------------------------------------------
// Scan everything
// --------------------------------------------------

async function scanSubmissions() {
  console.log("SCAN START");

  if (isLoading) {
    return;
  }

  isLoading = true;

  const filterOptions = document.querySelectorAll('input[name="dab-filter"]');

  const refresh = document.querySelector("#dab-refresh");

  filterOptions.forEach((radio) => {
    radio.disabled = true;
  });

  if (refresh) {
    refresh.disabled = true;

    refresh.classList.add("dab-spinning");
  }

  setStatus("Scanning submissions...", true);

  try {
    allSubmissions = [];
    lessonSubmissions = [];
    drawingPromptSubmissions = [];
    otherSubmissions = [];

    // Drawabox displays a maximum of 20
    // submissions per page.
    const PAGE_SIZE = 20;

    let page = 1;

    while (true) {
      setStatus(`Scanning page ${page}...`, true);

      const submissions = await fetchPage(page);

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
          otherSubmissions.push(clone.cloneNode(true));

          return;
        }

        const title = titleElement.textContent.trim();

        if (isLessonSubmission(title)) {
          lessonSubmissions.push(clone.cloneNode(true));
        } else if (isDrawingPromptSubmission(title)) {
          drawingPromptSubmissions.push(clone.cloneNode(true));
        } else {
          otherSubmissions.push(clone.cloneNode(true));
        }
      });

      /*
       * Drawabox displays a maximum of 20
       * submissions per page.
       *
       * If a page contains fewer than 20
       * submissions, it is the final page.
       */

      if (submissions.length < PAGE_SIZE) {
        break;
      }

      page++;
    }

    console.log(`Total submissions: ${allSubmissions.length}`);

    console.log(`Lesson submissions: ${lessonSubmissions.length}`);

    console.log(
      `Drawing prompt submissions: ${drawingPromptSubmissions.length}`,
    );

    console.log(`Other submissions: ${otherSubmissions.length}`);

    renderSubmissions();
  } catch (error) {
    console.error("Drawabox Filter:", error);

    setStatus("Something went wrong while scanning.", false);
  } finally {
    isLoading = false;

    filterOptions.forEach((radio) => {
      radio.disabled = false;
    });

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
  /*
   * Prevent the extension from initializing more than once
   * on the same page.
   */

  if (document.querySelector("#drawabox-filter-ui")) {
    console.log("Drawabox Filter: Already initialized.");

    return;
  }

  const submissions = document.querySelectorAll("li.homework-submission");

  if (submissions.length === 0) {
    console.error("Drawabox Filter: No submissions found.");

    return;
  }

  /*
   * Store the original submissions currently
   * displayed by Drawabox.
   */

  originalPageSubmissions = Array.from(submissions).map((submission) =>
    submission.cloneNode(true),
  );

  submissionList = submissions[0].parentElement;

  createUI();

  /*
   * Scan automatically so the total count and
   * filtered results are ready immediately.
   *
   * The default is "all", so the initial scan
   * does not hide any submissions.
   */

  scanSubmissions();
}

initialize();
