document.addEventListener("DOMContentLoaded", () => {
  const input = document.getElementById("textInput");
  const button = document.getElementById("openLinkBtn");
  const output = document.getElementById("textOutput");
  const shortcutsContainer = document.getElementById("shortcuts");
  const settingsButton = document.getElementById("settingsBtn");

  // Open URL or search Bing
  button.addEventListener("click", openLink);

  // Press Enter to open/search
  input.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      openLink();
    }
  });

  // Open extension settings
  if (settingsButton) {
    settingsButton.addEventListener("click", () => {
      chrome.runtime.openOptionsPage();
    });
  }

  // Load shortcuts when popup opens
  loadShortcuts();

  /**
   * Opens a URL directly or searches Bing
   * if the input is not a URL.
   */
  function openLink() {
    const inputValue = input.value.trim();

    if (!inputValue) {
      output.textContent = "Please enter a URL or search query.";
      return;
    }

    let url;

    /*
     * Detect URLs.
     *
     * Examples:
     * https://example.com
     * http://example.com
     * example.com
     */
    if (
      /^https?:\/\//i.test(inputValue) ||
      /^[\w.-]+\.[a-z]{2,}(\/.*)?$/i.test(inputValue)
    ) {
      url = /^https?:\/\//i.test(inputValue)
        ? inputValue
        : "https://" + inputValue;
    } else {
      /*
       * Anything that isn't a URL is treated
       * as a Bing search query.
       */
      url = "https://www.bing.com/search?q=" + encodeURIComponent(inputValue);
    }

    // Validate the final URL
    try {
      new URL(url);
    } catch (error) {
      console.error("Invalid URL:", error);
      output.textContent = "Invalid URL or search query.";
      return;
    }

    // Open the page in a new Chrome tab
    chrome.tabs
      .create({
        url: url,
      })
      .then((tab) => {
        console.log("Opened tab:", tab.id);
        output.textContent = "Opening...";

        // Clear the input after opening
        input.value = "";
      })
      .catch((error) => {
        console.error("Failed to open tab:", error);
        output.textContent = "Could not open the page.";
      });
  }

  /**
   * Load predefined shortcuts from shortcuts.txt.
   */
  async function loadShortcuts() {
    if (!shortcutsContainer) {
      return;
    }

    try {
      const response = await fetch(chrome.runtime.getURL("shortcuts.txt"));

      if (!response.ok) {
        throw new Error(`Failed to load shortcuts.txt: ${response.status}`);
      }

      const text = await response.text();

      const shortcuts = parseShortcuts(text);

      shortcutsContainer.innerHTML = "";

      if (shortcuts.length === 0) {
        shortcutsContainer.textContent = "No shortcuts available.";
        return;
      }

      shortcuts.forEach((shortcut) => {
        createShortcutButton(shortcut);
      });

      // Also load user-created shortcuts
      await loadCustomShortcuts();
    } catch (error) {
      console.error("Failed to load shortcuts:", error);

      shortcutsContainer.textContent = "Could not load shortcuts.";
    }
  }

  /**
   * Load shortcuts created through Settings.
   */
  async function loadCustomShortcuts() {
    try {
      const data = await chrome.storage.local.get({
        customShortcuts: [],
      });

      const customShortcuts = data.customShortcuts;

      customShortcuts.forEach((shortcut) => {
        createShortcutButton(shortcut);
      });
    } catch (error) {
      console.error("Failed to load custom shortcuts:", error);
    }
  }

  /**
   * Create a button for a shortcut.
   */
  function createShortcutButton(shortcut) {
    const shortcutButton = document.createElement("button");

    shortcutButton.className = "shortcutButton";

    shortcutButton.textContent = shortcut.name;

    shortcutButton.title = shortcut.url;

    shortcutButton.type = "button";

    shortcutButton.addEventListener("click", () => {
      openShortcut(shortcut.url);
    });

    shortcutsContainer.appendChild(shortcutButton);
  }

  /**
   * Open a shortcut in a new tab.
   */
  function openShortcut(url) {
    if (!url) {
      return;
    }

    chrome.tabs
      .create({
        url: url,
      })
      .then((tab) => {
        console.log("Opened shortcut tab:", tab.id);
      })
      .catch((error) => {
        console.error("Failed to open shortcut:", error);

        output.textContent = "Could not open shortcut.";
      });
  }

  /**
   * Convert shortcuts.txt into shortcut objects.
   *
   * Format:
   *
   * Google=https://www.google.com
   * Bing=https://www.bing.com
   * YouTube=https://www.youtube.com
   */
  function parseShortcuts(text) {
    return (
      text
        .split(/\r?\n/)
        .map((line) => line.trim())

        // Ignore empty lines and comments
        .filter((line) => {
          return line.length > 0 && !line.startsWith("#");
        })

        .map((line) => {
          const separator = line.indexOf("=");

          if (separator === -1) {
            return null;
          }

          const name = line.slice(0, separator).trim();

          const url = line.slice(separator + 1).trim();

          if (!name || !url) {
            return null;
          }

          return {
            name: name,
            url: url,
          };
        })

        .filter(Boolean)
    );
  }
});
