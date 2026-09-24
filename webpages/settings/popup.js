document.addEventListener("DOMContentLoaded", function () {
    const button = document.getElementById('openLinkBtn');
    button.addEventListener('click', function() {
        chrome.tabs.create({
            url: "https://google.com",
            active: true
        });
    });
});