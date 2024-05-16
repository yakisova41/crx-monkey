/* eslint-disable no-undef */

const websocket = new WebSocket('ws://${devServer.host}:${devServer.websocket}');

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

async function getResponse() {
  return new Promise((resolve) => {
    GM.xmlHttpRequest({
      url: 'http://${devServer.host}:${devServer.port}/userscript',
      onload: (e) => {
        resolve(e.responseText);
      },
    });
  });
}

getResponse().then((code) => {
  let injectCode = code;

  //<if "bindGM">
  const bindGMverName = btoa(crypto.randomUUID()).replaceAll('=', '$');
  unsafeWindow[bindGMverName] = GM;
  injectCode = `const ${bindGMHash} = window["${bindGMverName}"];` + injectCode;
  //</if>

  const scriptElem = document.createElement('script');
  scriptElem.textContent = injectCode;
  unsafeWindow.document.body.appendChild(scriptElem);
});
