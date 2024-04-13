/* eslint-disable no-undef */

function startWebsocket25secLife() {
  const websocket = new WebSocket(`ws://${host}:${websocket}`);

  websocket.addEventListener('message', ({ data }) => {
    switch (data) {
      case 'RELOAD_CONTENT_SCRIPT':
      case 'RELOAD_SW':
      case 'RELOAD_CSS':
      case 'RELOAD_POPUP_JS':
      case 'RELOAD_POPUP_HTML':
        chrome.runtime.reload();
        break;

      default:
        break;
    }
  });
  setTimeout(() => {
    websocket.close();
  }, 25 * 1000);
}

startWebsocket25secLife();
setInterval(() => {
  startWebsocket25secLife();
}, 25 * 1000);
