# Drawabox Submission Filter

A lightweight browser extension that helps you sort Drawabox sketchbook submissions by type so you can focus on the work you care about.

## Overview

This project adds a filter panel to Drawabox submission pages and groups entries into four categories:

- All
- Lessons Only
- Drawing Prompts Only
- Others

It scans the submission list, classifies each item based on the page title, and updates the visible list when you switch filters.

## Features

- Filters submission pages by category
- Detects lesson-related entries such as `Lesson 1: ...` and challenge series like `250 Box Challenge`
- Detects drawing prompt entries starting with `Drawing Prompt:`
- Shows totals for each category and refreshes the current scan manually
- Works on paginated Drawabox sketchbook submission lists

## Supported URL pattern

The extension is designed to run on Drawabox sketchbook submission pages matching:

- `https://drawabox.com/community/sketchbook/{user_profile}`

Replace {user_profile} with your username. If the page does not match that pattern, the content script will not run.

## Installation

### Firefox

1. Install [Drawabox Submission Filter](https://addons.mozilla.org/en-US/firefox/addon/drawabox-submission-filter/) extension from Firefox Addons
2. Open a Drawabox sketchbook submissions page.
3. The filter panel should appear above the list.

### Chrome / Chromium-based browsers

1. Navigate to chrome://extensions/
2. Enable Developer mode.
3. Download and extract the files from this repo.
4. Select the extracted folder after clicking on `Load unpacked` from the top-left corner.
4. Navigate to a Drawabox submission page and confirm the filter panel appears.

## Usage

Once installed:

1. Visit a Drawabox submission page.
2. Use the filter buttons to switch between:
   - All submissions
   - Lesson submissions only
   - Drawing prompt submissions only
   - Other submissions
3. Click the refresh button to rescan the page if new submissions appear.

## Project structure

- `manifest.json` – browser extension manifest
- `content.js` – page scanning, classification logic, and UI injection
- `styles.css` – styling for the filter panel
- `README.md` – project documentation

## How the extension classifies submissions

The script identifies entries using the submission title:

- Lesson entries: titles such as `Lesson 1: ...` or challenge tasks like `250 Box Challenge`
- Drawing prompt entries: titles beginning with `Drawing Prompt:`
- Everything else: grouped under `Others`

This logic is handled in the browser page by the content script after the page loads.

## Development

To test or iterate locally:

1. Edit `content.js` or `styles.css`.
2. Reload the extension in your browser.
3. Refresh the Drawabox page to verify the filter still loads and functions correctly.

## Notes


- This extension depends on the structure of Drawabox submission pages and may need updates if the site markup changes.
- The extension does not collect user data; the manifest declares no required data collection permissions.

## Disclaimer

This project is not officially affiliated with Drawabox. It is a user-side browser enhancement designed to improve submission browsing on Drawabox sketchbook pages.
