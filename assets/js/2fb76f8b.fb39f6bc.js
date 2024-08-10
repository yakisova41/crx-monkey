"use strict";(self.webpackChunkcrx_monkey=self.webpackChunkcrx_monkey||[]).push([[456],{3531:(e,s,n)=>{n.r(s),n.d(s,{assets:()=>c,contentTitle:()=>i,default:()=>l,frontMatter:()=>r,metadata:()=>a,toc:()=>d});var o=n(4848),t=n(8453);const r={},i="Bypass Message API",a={id:"API/ConnectorRequired/message",title:"Bypass Message API",description:"To use the API, connection_isolated must be set to true in manifest.",source:"@site/docs/API/ConnectorRequired/message.md",sourceDirName:"API/ConnectorRequired",slug:"/API/ConnectorRequired/message",permalink:"/crx-monkey/docs/API/ConnectorRequired/message",draft:!1,unlisted:!1,tags:[],version:"current",frontMatter:{},sidebar:"tutorialSidebar",previous:{title:"getExtensionId",permalink:"/crx-monkey/docs/API/ConnectorRequired/get-extension-id"},next:{title:"Configuring Introduction",permalink:"/crx-monkey/docs/Configuring/introduction"}},c={},d=[{value:"bypassMessage",id:"bypassmessage",level:2},{value:"remove()",id:"remove",level:3},{value:"bypassSendMessage",id:"bypasssendmessage",level:2}];function m(e){const s={a:"a",admonition:"admonition",code:"code",h1:"h1",h2:"h2",h3:"h3",p:"p",pre:"pre",...(0,t.R)(),...e.components};return(0,o.jsxs)(o.Fragment,{children:[(0,o.jsx)(s.h1,{id:"bypass-message-api",children:"Bypass Message API"}),"\n",(0,o.jsxs)(s.admonition,{type:"tip",children:[(0,o.jsxs)(s.p,{children:["To use the API, ",(0,o.jsx)(s.code,{children:"connection_isolated"})," must be set to true in manifest."]}),(0,o.jsx)(s.p,{children:(0,o.jsx)(s.a,{href:"/docs/API/introduction#connector-required-api",children:"Show Details"})})]}),"\n",(0,o.jsx)(s.h2,{id:"bypassmessage",children:"bypassMessage"}),"\n",(0,o.jsxs)(s.p,{children:["Bypass message reception (",(0,o.jsx)(s.code,{children:"chrome.runtime.onMessage.addListener"}),")."]}),"\n",(0,o.jsx)(s.pre,{children:(0,o.jsx)(s.code,{className:"language-js",children:"import { bypassSendMessage } from 'crx-monkey';\n\nconst listener = bypassMessage((msg) => {\n  console.log('Receved a message.', msg);\n});\n\nlistener.remove();\n"})}),"\n",(0,o.jsx)(s.h3,{id:"remove",children:"remove()"}),"\n",(0,o.jsx)(s.p,{children:"Ends message waiting"}),"\n",(0,o.jsx)(s.h2,{id:"bypasssendmessage",children:"bypassSendMessage"}),"\n",(0,o.jsxs)(s.p,{children:["Bypass sending messages (",(0,o.jsx)(s.code,{children:"chrome.runtime.sendMessage"}),")."]}),"\n",(0,o.jsx)(s.pre,{children:(0,o.jsx)(s.code,{className:"language-js",children:"import { bypassSendMessage } from 'crx-monkey';\n\nbypassSendMessage({ msg: 'Hi' });\n"})})]})}function l(e={}){const{wrapper:s}={...(0,t.R)(),...e.components};return s?(0,o.jsx)(s,{...e,children:(0,o.jsx)(m,{...e})}):m(e)}},8453:(e,s,n)=>{n.d(s,{R:()=>i,x:()=>a});var o=n(6540);const t={},r=o.createContext(t);function i(e){const s=o.useContext(r);return o.useMemo((function(){return"function"==typeof e?e(s):{...s,...e}}),[s,e])}function a(e){let s;return s=e.disableParentContext?"function"==typeof e.components?e.components(t):e.components||t:i(e.components),o.createElement(r.Provider,{value:s},e.children)}}}]);