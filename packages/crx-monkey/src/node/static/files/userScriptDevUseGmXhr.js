/* eslint-disable no-undef */
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

function watchScriptDiff(initialCode) {
  let scriptContentTmp = initialCode;

  setInterval(() => {
    getResponse().then((code) => {
      if (scriptContentTmp !== code) {
        location.reload();
      }
    });
  }, 1000);

  return scriptContentTmp;
}

getResponse().then((code) => {
  watchScriptDiff(code);

  const scriptElem = document.createElement('script');
  scriptElem.textContent = code;
  unsafeWindow.document.body.appendChild(scriptElem);
});
