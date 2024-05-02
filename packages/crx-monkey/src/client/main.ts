export function getRunningRuntime() {
  if (typeof window.__CRX_CONTENT_BUILD_ID === 'undefined') {
    return 'Userscript';
  } else {
    return 'Extension';
  }
}

/**
 * Get `chrome.runtime.id`.
 *
 * You can get the extension id everyworld if running script by chrome extension.
 */
export async function getExtensionId() {
  window.postMessage(
    {
      type: 'get-id',
      crxContentBuildId: window.__CRX_CONTENT_BUILD_ID,
    },
    '*',
  );
  return await waitResultOnce<string>('get-id');
}

/**
 * Bypass `chrome.runtime.onMessage`.
 *
 * You can get a content of message receved the bypassing isolated content_script.
 * @param callback
 */
export function bypassMessage<T = never>(
  callback: (request: T, sender: chrome.runtime.MessageSender) => void,
) {
  window.postMessage(
    {
      type: 'on-message',
      crxContentBuildId: window.__CRX_CONTENT_BUILD_ID,
    },
    '*',
  );

  waitResult<{ request: T; sender: { id: string; origin: string } }>('on-message', (data) => {
    callback(data.request, data.sender);
  });
}

async function waitResult<T = string>(type: string, callback: (data: T) => void) {
  const onResult = (e: IsolateConnectorEvent<T>) => {
    if (e.detail.type === type) {
      callback(e.detail.data);
    }
  };

  window.addEventListener('crx-isolate-connector-result', onResult);
}

async function waitResultOnce<T = string>(type: string): Promise<T> {
  return new Promise((resolve) => {
    const onResult = (e: IsolateConnectorEvent<T>) => {
      if (e.detail.type === type) {
        window.removeEventListener('crx-isolate-connector-result', onResult);
        resolve(e.detail.data);
      }
    };

    window.addEventListener('crx-isolate-connector-result', onResult);
  });
}

type IsolateConnectorEvent<T> = CustomEvent<{
  type: string;
  data: T;
}>;

declare global {
  interface Window {
    __CRX_CONTENT_BUILD_ID: string;
  }

  interface WindowEventMap {
    'crx-isolate-connector-result': IsolateConnectorEvent<never>;
  }
}
