console.log('service worker');

chrome.runtime.onMessage.addListener((e, sender) => {
  console.log('Receved a message by content script', e, sender);
  (async () => {
    const tabs = await chrome.tabs.query({ active: true });
    tabs.forEach(async (tab) => {
      setInterval(async () => {
        if (tab.id !== undefined) {
          const response = await chrome.tabs.sendMessage(tab.id, { greeting: 'hello from sw.' });
          // do something with response here, not outside the function
          console.log('Send a message to content script. Response:', response);
        }
      }, 1 * 1000);
    });
  })();
});
