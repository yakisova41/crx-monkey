/* eslint-disable no-undef */
const websocket = new WebSocket(`ws://${devServer.host}:${devServer.websocket}`);

websocket.addEventListener('message', ({ data }) => {
  switch (data) {
    case 'RELOAD_CSS':
    case 'RELOAD_CONTENT_SCRIPT':
      location.reload();
      break;

    default:
      break;
  }
});
