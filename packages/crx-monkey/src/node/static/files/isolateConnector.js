/* eslint-disable no-undef */
window.addEventListener('message', (e) => {
  const { data, target } = e;

  if (data.type !== undefined && data.crxContentBuildId !== undefined) {
    if (data.crxContentBuildId === `${crxContentBuildId}`) {
      switch (data.type) {
        case 'get-id':
          target.dispatchEvent(
            new CustomEvent('crx-isolate-connector-result', {
              detail: {
                type: 'get-id',
                data: chrome.runtime.id,
              },
            }),
          );
          break;
        case 'on-message':
          chrome.runtime.onMessage.addListener((request, sender) => {
            target.dispatchEvent(
              new CustomEvent('crx-isolate-connector-result', {
                detail: {
                  type: 'on-message',
                  data: { request, sender },
                },
              }),
            );
          });
          break;
      }
    }
  }
});
