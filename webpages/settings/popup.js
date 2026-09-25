document.getElementById('openLinkBtn')?.addEventListener('click', async () => {
  try {
    await chrome.tabs.create({ url: 'https://www.google.com' });
    console.log("Opened Chrome Google")
  } catch (error) {
    console.error('Failed to open the tab:', error);
  }
});