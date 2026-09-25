document.getElementById('openLinkBtn')?.addEventListener('click', async () => {
  try {
    await chrome.tabs.create({ url: 'https://www.google.com' });
  } catch (error) {
    console.error('Failed to open the tab:', error);
  }
});