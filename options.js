document.addEventListener("DOMContentLoaded", () => {
  const nameInput = document.getElementById("shortcutName");
  const urlInput = document.getElementById("shortcutUrl");
  const addButton = document.getElementById("addShortcutBtn");
  const shortcutList = document.getElementById("shortcutList");
  const status = document.getElementById("status");

  addButton.addEventListener("click", addShortcut);

  loadShortcuts();

  async function addShortcut() {
    const name = nameInput.value.trim();
    let url = urlInput.value.trim();

    if (!name) {
      showStatus("Please enter a shortcut name.");
      return;
    }

    if (!url) {
      showStatus("Please enter a URL.");
      return;
    }

    if (!/^https?:\/\//i.test(url)) {
      url = "https://" + url;
    }

    try {
      new URL(url);
    } catch {
      showStatus("Please enter a valid URL.");
      return;
    }

    /*
     * Chrome extensions cannot directly rewrite a packaged
     * shortcuts.txt file at runtime.
     *
     * Store user-created shortcuts separately using
     * chrome.storage.local.
     */

    const data = await chrome.storage.local.get({
      customShortcuts: [],
    });

    const customShortcuts = data.customShortcuts;

    customShortcuts.push({
      name,
      url,
    });

    await chrome.storage.local.set({
      customShortcuts,
    });

    nameInput.value = "";
    urlInput.value = "";

    showStatus("Shortcut added.");

    loadShortcuts();
  }

  async function loadShortcuts() {
    shortcutList.innerHTML = "";

    const builtInShortcuts = await loadBuiltInShortcuts();

    const data = await chrome.storage.local.get({
      customShortcuts: [],
    });

    const customShortcuts = data.customShortcuts;

    const allShortcuts = [...builtInShortcuts, ...customShortcuts];

    if (allShortcuts.length === 0) {
      shortcutList.textContent = "No shortcuts available.";
      return;
    }

    allShortcuts.forEach((shortcut) => {
      const item = document.createElement("div");

      item.className = "shortcutItem";

      const name = document.createElement("span");
      name.textContent = shortcut.name;

      const openButton = document.createElement("button");
      openButton.textContent = "Open";

      openButton.addEventListener("click", () => {
        chrome.tabs.create({
          url: shortcut.url,
        });
      });

      item.appendChild(name);
      item.appendChild(openButton);

      shortcutList.appendChild(item);
    });
  }

  async function loadBuiltInShortcuts() {
    try {
      const response = await fetch(chrome.runtime.getURL("shortcuts.txt"));

      if (!response.ok) {
        throw new Error("Could not load shortcuts.txt");
      }

      const text = await response.text();

      return parseShortcuts(text);
    } catch (error) {
      console.error(error);
      return [];
    }
  }

  function parseShortcuts(text) {
    return text
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#"))
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
          name,
          url,
        };
      })
      .filter(Boolean);
  }

  function showStatus(message) {
    status.textContent = message;

    setTimeout(() => {
      status.textContent = "";
    }, 2500);
  }
});
