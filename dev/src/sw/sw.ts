console.log('service worker');

chrome.runtime.onMessage.addListener((e, sender) => {
  console.log('Receved a message by content script', e);

  const id = sender.tab?.id;

  if (id !== undefined) {
    console.log(sender);
    chrome.runtime.sendMessage(sender.id, { msg: 'Hi!! from sw' }, {}, () => {});
  }
});
