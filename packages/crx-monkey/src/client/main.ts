export function getRuntime() {
  if (typeof GM_info === 'undefined') {
    return 'Extension';
  } else {
    return 'Userscript';
  }
}

export function getPublicUrl() {
  if (getRuntime() === 'Extension') {
    return chrome.runtime.getURL('/public');
  } else {
    throw new Error('Cannot be run in Userscript.');
  }
}
