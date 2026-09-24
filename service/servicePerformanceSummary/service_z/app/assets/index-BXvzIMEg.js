(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const l of document.querySelectorAll('link[rel="modulepreload"]'))r(l);new MutationObserver(l=>{for(const i of l)if(i.type==="childList")for(const o of i.addedNodes)o.tagName==="LINK"&&o.rel==="modulepreload"&&r(o)}).observe(document,{childList:!0,subtree:!0});function n(l){const i={};return l.integrity&&(i.integrity=l.integrity),l.referrerPolicy&&(i.referrerPolicy=l.referrerPolicy),l.crossOrigin==="use-credentials"?i.credentials="include":l.crossOrigin==="anonymous"?i.credentials="omit":i.credentials="same-origin",i}function r(l){if(l.ep)return;l.ep=!0;const i=n(l);fetch(l.href,i)}})();function Yc(e){return e&&e.__esModule&&Object.prototype.hasOwnProperty.call(e,"default")?e.default:e}var Ns={exports:{}},El={},Es={exports:{}},L={};/**
 * @license React
 * react.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */var hr=Symbol.for("react.element"),Kc=Symbol.for("react.portal"),Xc=Symbol.for("react.fragment"),Gc=Symbol.for("react.strict_mode"),Zc=Symbol.for("react.profiler"),Jc=Symbol.for("react.provider"),qc=Symbol.for("react.context"),ed=Symbol.for("react.forward_ref"),td=Symbol.for("react.suspense"),nd=Symbol.for("react.memo"),rd=Symbol.for("react.lazy"),da=Symbol.iterator;function ld(e){return e===null||typeof e!="object"?null:(e=da&&e[da]||e["@@iterator"],typeof e=="function"?e:null)}var js={isMounted:function(){return!1},enqueueForceUpdate:function(){},enqueueReplaceState:function(){},enqueueSetState:function(){}},Rs=Object.assign,Ts={};function Sn(e,t,n){this.props=e,this.context=t,this.refs=Ts,this.updater=n||js}Sn.prototype.isReactComponent={};Sn.prototype.setState=function(e,t){if(typeof e!="object"&&typeof e!="function"&&e!=null)throw Error("setState(...): takes an object of state variables to update or a function which returns an object of state variables.");this.updater.enqueueSetState(this,e,t,"setState")};Sn.prototype.forceUpdate=function(e){this.updater.enqueueForceUpdate(this,e,"forceUpdate")};function bs(){}bs.prototype=Sn.prototype;function mo(e,t,n){this.props=e,this.context=t,this.refs=Ts,this.updater=n||js}var ho=mo.prototype=new bs;ho.constructor=mo;Rs(ho,Sn.prototype);ho.isPureReactComponent=!0;var fa=Array.isArray,Ps=Object.prototype.hasOwnProperty,vo={current:null},zs={key:!0,ref:!0,__self:!0,__source:!0};function Ls(e,t,n){var r,l={},i=null,o=null;if(t!=null)for(r in t.ref!==void 0&&(o=t.ref),t.key!==void 0&&(i=""+t.key),t)Ps.call(t,r)&&!zs.hasOwnProperty(r)&&(l[r]=t[r]);var a=arguments.length-2;if(a===1)l.children=n;else if(1<a){for(var u=Array(a),c=0;c<a;c++)u[c]=arguments[c+2];l.children=u}if(e&&e.defaultProps)for(r in a=e.defaultProps,a)l[r]===void 0&&(l[r]=a[r]);return{$$typeof:hr,type:e,key:i,ref:o,props:l,_owner:vo.current}}function id(e,t){return{$$typeof:hr,type:e.type,key:t,ref:e.ref,props:e.props,_owner:e._owner}}function yo(e){return typeof e=="object"&&e!==null&&e.$$typeof===hr}function od(e){var t={"=":"=0",":":"=2"};return"$"+e.replace(/[=:]/g,function(n){return t[n]})}var pa=/\/+/g;function Ql(e,t){return typeof e=="object"&&e!==null&&e.key!=null?od(""+e.key):t.toString(36)}function Br(e,t,n,r,l){var i=typeof e;(i==="undefined"||i==="boolean")&&(e=null);var o=!1;if(e===null)o=!0;else switch(i){case"string":case"number":o=!0;break;case"object":switch(e.$$typeof){case hr:case Kc:o=!0}}if(o)return o=e,l=l(o),e=r===""?"."+Ql(o,0):r,fa(l)?(n="",e!=null&&(n=e.replace(pa,"$&/")+"/"),Br(l,t,n,"",function(c){return c})):l!=null&&(yo(l)&&(l=id(l,n+(!l.key||o&&o.key===l.key?"":(""+l.key).replace(pa,"$&/")+"/")+e)),t.push(l)),1;if(o=0,r=r===""?".":r+":",fa(e))for(var a=0;a<e.length;a++){i=e[a];var u=r+Ql(i,a);o+=Br(i,t,n,u,l)}else if(u=ld(e),typeof u=="function")for(e=u.call(e),a=0;!(i=e.next()).done;)i=i.value,u=r+Ql(i,a++),o+=Br(i,t,n,u,l);else if(i==="object")throw t=String(e),Error("Objects are not valid as a React child (found: "+(t==="[object Object]"?"object with keys {"+Object.keys(e).join(", ")+"}":t)+"). If you meant to render a collection of children, use an array instead.");return o}function Cr(e,t,n){if(e==null)return e;var r=[],l=0;return Br(e,r,"","",function(i){return t.call(n,i,l++)}),r}function ad(e){if(e._status===-1){var t=e._result;t=t(),t.then(function(n){(e._status===0||e._status===-1)&&(e._status=1,e._result=n)},function(n){(e._status===0||e._status===-1)&&(e._status=2,e._result=n)}),e._status===-1&&(e._status=0,e._result=t)}if(e._status===1)return e._result.default;throw e._result}var he={current:null},Wr={transition:null},sd={ReactCurrentDispatcher:he,ReactCurrentBatchConfig:Wr,ReactCurrentOwner:vo};function Ds(){throw Error("act(...) is not supported in production builds of React.")}L.Children={map:Cr,forEach:function(e,t,n){Cr(e,function(){t.apply(this,arguments)},n)},count:function(e){var t=0;return Cr(e,function(){t++}),t},toArray:function(e){return Cr(e,function(t){return t})||[]},only:function(e){if(!yo(e))throw Error("React.Children.only expected to receive a single React element child.");return e}};L.Component=Sn;L.Fragment=Xc;L.Profiler=Zc;L.PureComponent=mo;L.StrictMode=Gc;L.Suspense=td;L.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED=sd;L.act=Ds;L.cloneElement=function(e,t,n){if(e==null)throw Error("React.cloneElement(...): The argument must be a React element, but you passed "+e+".");var r=Rs({},e.props),l=e.key,i=e.ref,o=e._owner;if(t!=null){if(t.ref!==void 0&&(i=t.ref,o=vo.current),t.key!==void 0&&(l=""+t.key),e.type&&e.type.defaultProps)var a=e.type.defaultProps;for(u in t)Ps.call(t,u)&&!zs.hasOwnProperty(u)&&(r[u]=t[u]===void 0&&a!==void 0?a[u]:t[u])}var u=arguments.length-2;if(u===1)r.children=n;else if(1<u){a=Array(u);for(var c=0;c<u;c++)a[c]=arguments[c+2];r.children=a}return{$$typeof:hr,type:e.type,key:l,ref:i,props:r,_owner:o}};L.createContext=function(e){return e={$$typeof:qc,_currentValue:e,_currentValue2:e,_threadCount:0,Provider:null,Consumer:null,_defaultValue:null,_globalName:null},e.Provider={$$typeof:Jc,_context:e},e.Consumer=e};L.createElement=Ls;L.createFactory=function(e){var t=Ls.bind(null,e);return t.type=e,t};L.createRef=function(){return{current:null}};L.forwardRef=function(e){return{$$typeof:ed,render:e}};L.isValidElement=yo;L.lazy=function(e){return{$$typeof:rd,_payload:{_status:-1,_result:e},_init:ad}};L.memo=function(e,t){return{$$typeof:nd,type:e,compare:t===void 0?null:t}};L.startTransition=function(e){var t=Wr.transition;Wr.transition={};try{e()}finally{Wr.transition=t}};L.unstable_act=Ds;L.useCallback=function(e,t){return he.current.useCallback(e,t)};L.useContext=function(e){return he.current.useContext(e)};L.useDebugValue=function(){};L.useDeferredValue=function(e){return he.current.useDeferredValue(e)};L.useEffect=function(e,t){return he.current.useEffect(e,t)};L.useId=function(){return he.current.useId()};L.useImperativeHandle=function(e,t,n){return he.current.useImperativeHandle(e,t,n)};L.useInsertionEffect=function(e,t){return he.current.useInsertionEffect(e,t)};L.useLayoutEffect=function(e,t){return he.current.useLayoutEffect(e,t)};L.useMemo=function(e,t){return he.current.useMemo(e,t)};L.useReducer=function(e,t,n){return he.current.useReducer(e,t,n)};L.useRef=function(e){return he.current.useRef(e)};L.useState=function(e){return he.current.useState(e)};L.useSyncExternalStore=function(e,t,n){return he.current.useSyncExternalStore(e,t,n)};L.useTransition=function(){return he.current.useTransition()};L.version="18.3.1";Es.exports=L;var V=Es.exports;const ud=Yc(V);/**
 * @license React
 * react-jsx-runtime.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */var cd=V,dd=Symbol.for("react.element"),fd=Symbol.for("react.fragment"),pd=Object.prototype.hasOwnProperty,gd=cd.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentOwner,md={key:!0,ref:!0,__self:!0,__source:!0};function Is(e,t,n){var r,l={},i=null,o=null;n!==void 0&&(i=""+n),t.key!==void 0&&(i=""+t.key),t.ref!==void 0&&(o=t.ref);for(r in t)pd.call(t,r)&&!md.hasOwnProperty(r)&&(l[r]=t[r]);if(e&&e.defaultProps)for(r in t=e.defaultProps,t)l[r]===void 0&&(l[r]=t[r]);return{$$typeof:dd,type:e,key:i,ref:o,props:l,_owner:gd.current}}El.Fragment=fd;El.jsx=Is;El.jsxs=Is;Ns.exports=El;var s=Ns.exports,As={exports:{}},be={},Ms={exports:{}},Os={};/**
 * @license React
 * scheduler.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */(function(e){function t(N,b){var z=N.length;N.push(b);e:for(;0<z;){var X=z-1>>>1,ne=N[X];if(0<l(ne,b))N[X]=b,N[z]=ne,z=X;else break e}}function n(N){return N.length===0?null:N[0]}function r(N){if(N.length===0)return null;var b=N[0],z=N.pop();if(z!==b){N[0]=z;e:for(var X=0,ne=N.length,_r=ne>>>1;X<_r;){var bt=2*(X+1)-1,Hl=N[bt],Pt=bt+1,Sr=N[Pt];if(0>l(Hl,z))Pt<ne&&0>l(Sr,Hl)?(N[X]=Sr,N[Pt]=z,X=Pt):(N[X]=Hl,N[bt]=z,X=bt);else if(Pt<ne&&0>l(Sr,z))N[X]=Sr,N[Pt]=z,X=Pt;else break e}}return b}function l(N,b){var z=N.sortIndex-b.sortIndex;return z!==0?z:N.id-b.id}if(typeof performance=="object"&&typeof performance.now=="function"){var i=performance;e.unstable_now=function(){return i.now()}}else{var o=Date,a=o.now();e.unstable_now=function(){return o.now()-a}}var u=[],c=[],g=1,m=null,h=3,v=!1,x=!1,w=!1,D=typeof setTimeout=="function"?setTimeout:null,p=typeof clearTimeout=="function"?clearTimeout:null,d=typeof setImmediate<"u"?setImmediate:null;typeof navigator<"u"&&navigator.scheduling!==void 0&&navigator.scheduling.isInputPending!==void 0&&navigator.scheduling.isInputPending.bind(navigator.scheduling);function f(N){for(var b=n(c);b!==null;){if(b.callback===null)r(c);else if(b.startTime<=N)r(c),b.sortIndex=b.expirationTime,t(u,b);else break;b=n(c)}}function y(N){if(w=!1,f(N),!x)if(n(u)!==null)x=!0,Rn(_);else{var b=n(c);b!==null&&Vl(y,b.startTime-N)}}function _(N,b){x=!1,w&&(w=!1,p(j),j=-1),v=!0;var z=h;try{for(f(b),m=n(u);m!==null&&(!(m.expirationTime>b)||N&&!pe());){var X=m.callback;if(typeof X=="function"){m.callback=null,h=m.priorityLevel;var ne=X(m.expirationTime<=b);b=e.unstable_now(),typeof ne=="function"?m.callback=ne:m===n(u)&&r(u),f(b)}else r(u);m=n(u)}if(m!==null)var _r=!0;else{var bt=n(c);bt!==null&&Vl(y,bt.startTime-b),_r=!1}return _r}finally{m=null,h=z,v=!1}}var S=!1,E=null,j=-1,F=5,P=-1;function pe(){return!(e.unstable_now()-P<F)}function M(){if(E!==null){var N=e.unstable_now();P=N;var b=!0;try{b=E(!0,N)}finally{b?O():(S=!1,E=null)}}else S=!1}var O;if(typeof d=="function")O=function(){d(M)};else if(typeof MessageChannel<"u"){var Ye=new MessageChannel,jn=Ye.port2;Ye.port1.onmessage=M,O=function(){jn.postMessage(null)}}else O=function(){D(M,0)};function Rn(N){E=N,S||(S=!0,O())}function Vl(N,b){j=D(function(){N(e.unstable_now())},b)}e.unstable_IdlePriority=5,e.unstable_ImmediatePriority=1,e.unstable_LowPriority=4,e.unstable_NormalPriority=3,e.unstable_Profiling=null,e.unstable_UserBlockingPriority=2,e.unstable_cancelCallback=function(N){N.callback=null},e.unstable_continueExecution=function(){x||v||(x=!0,Rn(_))},e.unstable_forceFrameRate=function(N){0>N||125<N?console.error("forceFrameRate takes a positive int between 0 and 125, forcing frame rates higher than 125 fps is not supported"):F=0<N?Math.floor(1e3/N):5},e.unstable_getCurrentPriorityLevel=function(){return h},e.unstable_getFirstCallbackNode=function(){return n(u)},e.unstable_next=function(N){switch(h){case 1:case 2:case 3:var b=3;break;default:b=h}var z=h;h=b;try{return N()}finally{h=z}},e.unstable_pauseExecution=function(){},e.unstable_requestPaint=function(){},e.unstable_runWithPriority=function(N,b){switch(N){case 1:case 2:case 3:case 4:case 5:break;default:N=3}var z=h;h=N;try{return b()}finally{h=z}},e.unstable_scheduleCallback=function(N,b,z){var X=e.unstable_now();switch(typeof z=="object"&&z!==null?(z=z.delay,z=typeof z=="number"&&0<z?X+z:X):z=X,N){case 1:var ne=-1;break;case 2:ne=250;break;case 5:ne=1073741823;break;case 4:ne=1e4;break;default:ne=5e3}return ne=z+ne,N={id:g++,callback:b,priorityLevel:N,startTime:z,expirationTime:ne,sortIndex:-1},z>X?(N.sortIndex=z,t(c,N),n(u)===null&&N===n(c)&&(w?(p(j),j=-1):w=!0,Vl(y,z-X))):(N.sortIndex=ne,t(u,N),x||v||(x=!0,Rn(_))),N},e.unstable_shouldYield=pe,e.unstable_wrapCallback=function(N){var b=h;return function(){var z=h;h=b;try{return N.apply(this,arguments)}finally{h=z}}}})(Os);Ms.exports=Os;var hd=Ms.exports;/**
 * @license React
 * react-dom.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */var vd=V,Ee=hd;function k(e){for(var t="https://reactjs.org/docs/error-decoder.html?invariant="+e,n=1;n<arguments.length;n++)t+="&args[]="+encodeURIComponent(arguments[n]);return"Minified React error #"+e+"; visit "+t+" for the full message or use the non-minified dev environment for full errors and additional helpful warnings."}var Fs=new Set,Zn={};function Ht(e,t){pn(e,t),pn(e+"Capture",t)}function pn(e,t){for(Zn[e]=t,e=0;e<t.length;e++)Fs.add(t[e])}var it=!(typeof window>"u"||typeof window.document>"u"||typeof window.document.createElement>"u"),ki=Object.prototype.hasOwnProperty,yd=/^[:A-Z_a-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD][:A-Z_a-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD\-.0-9\u00B7\u0300-\u036F\u203F-\u2040]*$/,ga={},ma={};function xd(e){return ki.call(ma,e)?!0:ki.call(ga,e)?!1:yd.test(e)?ma[e]=!0:(ga[e]=!0,!1)}function wd(e,t,n,r){if(n!==null&&n.type===0)return!1;switch(typeof t){case"function":case"symbol":return!0;case"boolean":return r?!1:n!==null?!n.acceptsBooleans:(e=e.toLowerCase().slice(0,5),e!=="data-"&&e!=="aria-");default:return!1}}function kd(e,t,n,r){if(t===null||typeof t>"u"||wd(e,t,n,r))return!0;if(r)return!1;if(n!==null)switch(n.type){case 3:return!t;case 4:return t===!1;case 5:return isNaN(t);case 6:return isNaN(t)||1>t}return!1}function ve(e,t,n,r,l,i,o){this.acceptsBooleans=t===2||t===3||t===4,this.attributeName=r,this.attributeNamespace=l,this.mustUseProperty=n,this.propertyName=e,this.type=t,this.sanitizeURL=i,this.removeEmptyString=o}var se={};"children dangerouslySetInnerHTML defaultValue defaultChecked innerHTML suppressContentEditableWarning suppressHydrationWarning style".split(" ").forEach(function(e){se[e]=new ve(e,0,!1,e,null,!1,!1)});[["acceptCharset","accept-charset"],["className","class"],["htmlFor","for"],["httpEquiv","http-equiv"]].forEach(function(e){var t=e[0];se[t]=new ve(t,1,!1,e[1],null,!1,!1)});["contentEditable","draggable","spellCheck","value"].forEach(function(e){se[e]=new ve(e,2,!1,e.toLowerCase(),null,!1,!1)});["autoReverse","externalResourcesRequired","focusable","preserveAlpha"].forEach(function(e){se[e]=new ve(e,2,!1,e,null,!1,!1)});"allowFullScreen async autoFocus autoPlay controls default defer disabled disablePictureInPicture disableRemotePlayback formNoValidate hidden loop noModule noValidate open playsInline readOnly required reversed scoped seamless itemScope".split(" ").forEach(function(e){se[e]=new ve(e,3,!1,e.toLowerCase(),null,!1,!1)});["checked","multiple","muted","selected"].forEach(function(e){se[e]=new ve(e,3,!0,e,null,!1,!1)});["capture","download"].forEach(function(e){se[e]=new ve(e,4,!1,e,null,!1,!1)});["cols","rows","size","span"].forEach(function(e){se[e]=new ve(e,6,!1,e,null,!1,!1)});["rowSpan","start"].forEach(function(e){se[e]=new ve(e,5,!1,e.toLowerCase(),null,!1,!1)});var xo=/[\-:]([a-z])/g;function wo(e){return e[1].toUpperCase()}"accent-height alignment-baseline arabic-form baseline-shift cap-height clip-path clip-rule color-interpolation color-interpolation-filters color-profile color-rendering dominant-baseline enable-background fill-opacity fill-rule flood-color flood-opacity font-family font-size font-size-adjust font-stretch font-style font-variant font-weight glyph-name glyph-orientation-horizontal glyph-orientation-vertical horiz-adv-x horiz-origin-x image-rendering letter-spacing lighting-color marker-end marker-mid marker-start overline-position overline-thickness paint-order panose-1 pointer-events rendering-intent shape-rendering stop-color stop-opacity strikethrough-position strikethrough-thickness stroke-dasharray stroke-dashoffset stroke-linecap stroke-linejoin stroke-miterlimit stroke-opacity stroke-width text-anchor text-decoration text-rendering underline-position underline-thickness unicode-bidi unicode-range units-per-em v-alphabetic v-hanging v-ideographic v-mathematical vector-effect vert-adv-y vert-origin-x vert-origin-y word-spacing writing-mode xmlns:xlink x-height".split(" ").forEach(function(e){var t=e.replace(xo,wo);se[t]=new ve(t,1,!1,e,null,!1,!1)});"xlink:actuate xlink:arcrole xlink:role xlink:show xlink:title xlink:type".split(" ").forEach(function(e){var t=e.replace(xo,wo);se[t]=new ve(t,1,!1,e,"http://www.w3.org/1999/xlink",!1,!1)});["xml:base","xml:lang","xml:space"].forEach(function(e){var t=e.replace(xo,wo);se[t]=new ve(t,1,!1,e,"http://www.w3.org/XML/1998/namespace",!1,!1)});["tabIndex","crossOrigin"].forEach(function(e){se[e]=new ve(e,1,!1,e.toLowerCase(),null,!1,!1)});se.xlinkHref=new ve("xlinkHref",1,!1,"xlink:href","http://www.w3.org/1999/xlink",!0,!1);["src","href","action","formAction"].forEach(function(e){se[e]=new ve(e,1,!1,e.toLowerCase(),null,!0,!0)});function ko(e,t,n,r){var l=se.hasOwnProperty(t)?se[t]:null;(l!==null?l.type!==0:r||!(2<t.length)||t[0]!=="o"&&t[0]!=="O"||t[1]!=="n"&&t[1]!=="N")&&(kd(t,n,l,r)&&(n=null),r||l===null?xd(t)&&(n===null?e.removeAttribute(t):e.setAttribute(t,""+n)):l.mustUseProperty?e[l.propertyName]=n===null?l.type===3?!1:"":n:(t=l.attributeName,r=l.attributeNamespace,n===null?e.removeAttribute(t):(l=l.type,n=l===3||l===4&&n===!0?"":""+n,r?e.setAttributeNS(r,t,n):e.setAttribute(t,n))))}var ut=vd.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED,Nr=Symbol.for("react.element"),Kt=Symbol.for("react.portal"),Xt=Symbol.for("react.fragment"),_o=Symbol.for("react.strict_mode"),_i=Symbol.for("react.profiler"),$s=Symbol.for("react.provider"),Us=Symbol.for("react.context"),So=Symbol.for("react.forward_ref"),Si=Symbol.for("react.suspense"),Ci=Symbol.for("react.suspense_list"),Co=Symbol.for("react.memo"),dt=Symbol.for("react.lazy"),Bs=Symbol.for("react.offscreen"),ha=Symbol.iterator;function Tn(e){return e===null||typeof e!="object"?null:(e=ha&&e[ha]||e["@@iterator"],typeof e=="function"?e:null)}var Y=Object.assign,Yl;function On(e){if(Yl===void 0)try{throw Error()}catch(n){var t=n.stack.trim().match(/\n( *(at )?)/);Yl=t&&t[1]||""}return`
`+Yl+e}var Kl=!1;function Xl(e,t){if(!e||Kl)return"";Kl=!0;var n=Error.prepareStackTrace;Error.prepareStackTrace=void 0;try{if(t)if(t=function(){throw Error()},Object.defineProperty(t.prototype,"props",{set:function(){throw Error()}}),typeof Reflect=="object"&&Reflect.construct){try{Reflect.construct(t,[])}catch(c){var r=c}Reflect.construct(e,[],t)}else{try{t.call()}catch(c){r=c}e.call(t.prototype)}else{try{throw Error()}catch(c){r=c}e()}}catch(c){if(c&&r&&typeof c.stack=="string"){for(var l=c.stack.split(`
`),i=r.stack.split(`
`),o=l.length-1,a=i.length-1;1<=o&&0<=a&&l[o]!==i[a];)a--;for(;1<=o&&0<=a;o--,a--)if(l[o]!==i[a]){if(o!==1||a!==1)do if(o--,a--,0>a||l[o]!==i[a]){var u=`
`+l[o].replace(" at new "," at ");return e.displayName&&u.includes("<anonymous>")&&(u=u.replace("<anonymous>",e.displayName)),u}while(1<=o&&0<=a);break}}}finally{Kl=!1,Error.prepareStackTrace=n}return(e=e?e.displayName||e.name:"")?On(e):""}function _d(e){switch(e.tag){case 5:return On(e.type);case 16:return On("Lazy");case 13:return On("Suspense");case 19:return On("SuspenseList");case 0:case 2:case 15:return e=Xl(e.type,!1),e;case 11:return e=Xl(e.type.render,!1),e;case 1:return e=Xl(e.type,!0),e;default:return""}}function Ni(e){if(e==null)return null;if(typeof e=="function")return e.displayName||e.name||null;if(typeof e=="string")return e;switch(e){case Xt:return"Fragment";case Kt:return"Portal";case _i:return"Profiler";case _o:return"StrictMode";case Si:return"Suspense";case Ci:return"SuspenseList"}if(typeof e=="object")switch(e.$$typeof){case Us:return(e.displayName||"Context")+".Consumer";case $s:return(e._context.displayName||"Context")+".Provider";case So:var t=e.render;return e=e.displayName,e||(e=t.displayName||t.name||"",e=e!==""?"ForwardRef("+e+")":"ForwardRef"),e;case Co:return t=e.displayName||null,t!==null?t:Ni(e.type)||"Memo";case dt:t=e._payload,e=e._init;try{return Ni(e(t))}catch{}}return null}function Sd(e){var t=e.type;switch(e.tag){case 24:return"Cache";case 9:return(t.displayName||"Context")+".Consumer";case 10:return(t._context.displayName||"Context")+".Provider";case 18:return"DehydratedFragment";case 11:return e=t.render,e=e.displayName||e.name||"",t.displayName||(e!==""?"ForwardRef("+e+")":"ForwardRef");case 7:return"Fragment";case 5:return t;case 4:return"Portal";case 3:return"Root";case 6:return"Text";case 16:return Ni(t);case 8:return t===_o?"StrictMode":"Mode";case 22:return"Offscreen";case 12:return"Profiler";case 21:return"Scope";case 13:return"Suspense";case 19:return"SuspenseList";case 25:return"TracingMarker";case 1:case 0:case 17:case 2:case 14:case 15:if(typeof t=="function")return t.displayName||t.name||null;if(typeof t=="string")return t}return null}function Nt(e){switch(typeof e){case"boolean":case"number":case"string":case"undefined":return e;case"object":return e;default:return""}}function Ws(e){var t=e.type;return(e=e.nodeName)&&e.toLowerCase()==="input"&&(t==="checkbox"||t==="radio")}function Cd(e){var t=Ws(e)?"checked":"value",n=Object.getOwnPropertyDescriptor(e.constructor.prototype,t),r=""+e[t];if(!e.hasOwnProperty(t)&&typeof n<"u"&&typeof n.get=="function"&&typeof n.set=="function"){var l=n.get,i=n.set;return Object.defineProperty(e,t,{configurable:!0,get:function(){return l.call(this)},set:function(o){r=""+o,i.call(this,o)}}),Object.defineProperty(e,t,{enumerable:n.enumerable}),{getValue:function(){return r},setValue:function(o){r=""+o},stopTracking:function(){e._valueTracker=null,delete e[t]}}}}function Er(e){e._valueTracker||(e._valueTracker=Cd(e))}function Vs(e){if(!e)return!1;var t=e._valueTracker;if(!t)return!0;var n=t.getValue(),r="";return e&&(r=Ws(e)?e.checked?"true":"false":e.value),e=r,e!==n?(t.setValue(e),!0):!1}function tl(e){if(e=e||(typeof document<"u"?document:void 0),typeof e>"u")return null;try{return e.activeElement||e.body}catch{return e.body}}function Ei(e,t){var n=t.checked;return Y({},t,{defaultChecked:void 0,defaultValue:void 0,value:void 0,checked:n??e._wrapperState.initialChecked})}function va(e,t){var n=t.defaultValue==null?"":t.defaultValue,r=t.checked!=null?t.checked:t.defaultChecked;n=Nt(t.value!=null?t.value:n),e._wrapperState={initialChecked:r,initialValue:n,controlled:t.type==="checkbox"||t.type==="radio"?t.checked!=null:t.value!=null}}function Hs(e,t){t=t.checked,t!=null&&ko(e,"checked",t,!1)}function ji(e,t){Hs(e,t);var n=Nt(t.value),r=t.type;if(n!=null)r==="number"?(n===0&&e.value===""||e.value!=n)&&(e.value=""+n):e.value!==""+n&&(e.value=""+n);else if(r==="submit"||r==="reset"){e.removeAttribute("value");return}t.hasOwnProperty("value")?Ri(e,t.type,n):t.hasOwnProperty("defaultValue")&&Ri(e,t.type,Nt(t.defaultValue)),t.checked==null&&t.defaultChecked!=null&&(e.defaultChecked=!!t.defaultChecked)}function ya(e,t,n){if(t.hasOwnProperty("value")||t.hasOwnProperty("defaultValue")){var r=t.type;if(!(r!=="submit"&&r!=="reset"||t.value!==void 0&&t.value!==null))return;t=""+e._wrapperState.initialValue,n||t===e.value||(e.value=t),e.defaultValue=t}n=e.name,n!==""&&(e.name=""),e.defaultChecked=!!e._wrapperState.initialChecked,n!==""&&(e.name=n)}function Ri(e,t,n){(t!=="number"||tl(e.ownerDocument)!==e)&&(n==null?e.defaultValue=""+e._wrapperState.initialValue:e.defaultValue!==""+n&&(e.defaultValue=""+n))}var Fn=Array.isArray;function an(e,t,n,r){if(e=e.options,t){t={};for(var l=0;l<n.length;l++)t["$"+n[l]]=!0;for(n=0;n<e.length;n++)l=t.hasOwnProperty("$"+e[n].value),e[n].selected!==l&&(e[n].selected=l),l&&r&&(e[n].defaultSelected=!0)}else{for(n=""+Nt(n),t=null,l=0;l<e.length;l++){if(e[l].value===n){e[l].selected=!0,r&&(e[l].defaultSelected=!0);return}t!==null||e[l].disabled||(t=e[l])}t!==null&&(t.selected=!0)}}function Ti(e,t){if(t.dangerouslySetInnerHTML!=null)throw Error(k(91));return Y({},t,{value:void 0,defaultValue:void 0,children:""+e._wrapperState.initialValue})}function xa(e,t){var n=t.value;if(n==null){if(n=t.children,t=t.defaultValue,n!=null){if(t!=null)throw Error(k(92));if(Fn(n)){if(1<n.length)throw Error(k(93));n=n[0]}t=n}t==null&&(t=""),n=t}e._wrapperState={initialValue:Nt(n)}}function Qs(e,t){var n=Nt(t.value),r=Nt(t.defaultValue);n!=null&&(n=""+n,n!==e.value&&(e.value=n),t.defaultValue==null&&e.defaultValue!==n&&(e.defaultValue=n)),r!=null&&(e.defaultValue=""+r)}function wa(e){var t=e.textContent;t===e._wrapperState.initialValue&&t!==""&&t!==null&&(e.value=t)}function Ys(e){switch(e){case"svg":return"http://www.w3.org/2000/svg";case"math":return"http://www.w3.org/1998/Math/MathML";default:return"http://www.w3.org/1999/xhtml"}}function bi(e,t){return e==null||e==="http://www.w3.org/1999/xhtml"?Ys(t):e==="http://www.w3.org/2000/svg"&&t==="foreignObject"?"http://www.w3.org/1999/xhtml":e}var jr,Ks=function(e){return typeof MSApp<"u"&&MSApp.execUnsafeLocalFunction?function(t,n,r,l){MSApp.execUnsafeLocalFunction(function(){return e(t,n,r,l)})}:e}(function(e,t){if(e.namespaceURI!=="http://www.w3.org/2000/svg"||"innerHTML"in e)e.innerHTML=t;else{for(jr=jr||document.createElement("div"),jr.innerHTML="<svg>"+t.valueOf().toString()+"</svg>",t=jr.firstChild;e.firstChild;)e.removeChild(e.firstChild);for(;t.firstChild;)e.appendChild(t.firstChild)}});function Jn(e,t){if(t){var n=e.firstChild;if(n&&n===e.lastChild&&n.nodeType===3){n.nodeValue=t;return}}e.textContent=t}var Bn={animationIterationCount:!0,aspectRatio:!0,borderImageOutset:!0,borderImageSlice:!0,borderImageWidth:!0,boxFlex:!0,boxFlexGroup:!0,boxOrdinalGroup:!0,columnCount:!0,columns:!0,flex:!0,flexGrow:!0,flexPositive:!0,flexShrink:!0,flexNegative:!0,flexOrder:!0,gridArea:!0,gridRow:!0,gridRowEnd:!0,gridRowSpan:!0,gridRowStart:!0,gridColumn:!0,gridColumnEnd:!0,gridColumnSpan:!0,gridColumnStart:!0,fontWeight:!0,lineClamp:!0,lineHeight:!0,opacity:!0,order:!0,orphans:!0,tabSize:!0,widows:!0,zIndex:!0,zoom:!0,fillOpacity:!0,floodOpacity:!0,stopOpacity:!0,strokeDasharray:!0,strokeDashoffset:!0,strokeMiterlimit:!0,strokeOpacity:!0,strokeWidth:!0},Nd=["Webkit","ms","Moz","O"];Object.keys(Bn).forEach(function(e){Nd.forEach(function(t){t=t+e.charAt(0).toUpperCase()+e.substring(1),Bn[t]=Bn[e]})});function Xs(e,t,n){return t==null||typeof t=="boolean"||t===""?"":n||typeof t!="number"||t===0||Bn.hasOwnProperty(e)&&Bn[e]?(""+t).trim():t+"px"}function Gs(e,t){e=e.style;for(var n in t)if(t.hasOwnProperty(n)){var r=n.indexOf("--")===0,l=Xs(n,t[n],r);n==="float"&&(n="cssFloat"),r?e.setProperty(n,l):e[n]=l}}var Ed=Y({menuitem:!0},{area:!0,base:!0,br:!0,col:!0,embed:!0,hr:!0,img:!0,input:!0,keygen:!0,link:!0,meta:!0,param:!0,source:!0,track:!0,wbr:!0});function Pi(e,t){if(t){if(Ed[e]&&(t.children!=null||t.dangerouslySetInnerHTML!=null))throw Error(k(137,e));if(t.dangerouslySetInnerHTML!=null){if(t.children!=null)throw Error(k(60));if(typeof t.dangerouslySetInnerHTML!="object"||!("__html"in t.dangerouslySetInnerHTML))throw Error(k(61))}if(t.style!=null&&typeof t.style!="object")throw Error(k(62))}}function zi(e,t){if(e.indexOf("-")===-1)return typeof t.is=="string";switch(e){case"annotation-xml":case"color-profile":case"font-face":case"font-face-src":case"font-face-uri":case"font-face-format":case"font-face-name":case"missing-glyph":return!1;default:return!0}}var Li=null;function No(e){return e=e.target||e.srcElement||window,e.correspondingUseElement&&(e=e.correspondingUseElement),e.nodeType===3?e.parentNode:e}var Di=null,sn=null,un=null;function ka(e){if(e=xr(e)){if(typeof Di!="function")throw Error(k(280));var t=e.stateNode;t&&(t=Pl(t),Di(e.stateNode,e.type,t))}}function Zs(e){sn?un?un.push(e):un=[e]:sn=e}function Js(){if(sn){var e=sn,t=un;if(un=sn=null,ka(e),t)for(e=0;e<t.length;e++)ka(t[e])}}function qs(e,t){return e(t)}function eu(){}var Gl=!1;function tu(e,t,n){if(Gl)return e(t,n);Gl=!0;try{return qs(e,t,n)}finally{Gl=!1,(sn!==null||un!==null)&&(eu(),Js())}}function qn(e,t){var n=e.stateNode;if(n===null)return null;var r=Pl(n);if(r===null)return null;n=r[t];e:switch(t){case"onClick":case"onClickCapture":case"onDoubleClick":case"onDoubleClickCapture":case"onMouseDown":case"onMouseDownCapture":case"onMouseMove":case"onMouseMoveCapture":case"onMouseUp":case"onMouseUpCapture":case"onMouseEnter":(r=!r.disabled)||(e=e.type,r=!(e==="button"||e==="input"||e==="select"||e==="textarea")),e=!r;break e;default:e=!1}if(e)return null;if(n&&typeof n!="function")throw Error(k(231,t,typeof n));return n}var Ii=!1;if(it)try{var bn={};Object.defineProperty(bn,"passive",{get:function(){Ii=!0}}),window.addEventListener("test",bn,bn),window.removeEventListener("test",bn,bn)}catch{Ii=!1}function jd(e,t,n,r,l,i,o,a,u){var c=Array.prototype.slice.call(arguments,3);try{t.apply(n,c)}catch(g){this.onError(g)}}var Wn=!1,nl=null,rl=!1,Ai=null,Rd={onError:function(e){Wn=!0,nl=e}};function Td(e,t,n,r,l,i,o,a,u){Wn=!1,nl=null,jd.apply(Rd,arguments)}function bd(e,t,n,r,l,i,o,a,u){if(Td.apply(this,arguments),Wn){if(Wn){var c=nl;Wn=!1,nl=null}else throw Error(k(198));rl||(rl=!0,Ai=c)}}function Qt(e){var t=e,n=e;if(e.alternate)for(;t.return;)t=t.return;else{e=t;do t=e,t.flags&4098&&(n=t.return),e=t.return;while(e)}return t.tag===3?n:null}function nu(e){if(e.tag===13){var t=e.memoizedState;if(t===null&&(e=e.alternate,e!==null&&(t=e.memoizedState)),t!==null)return t.dehydrated}return null}function _a(e){if(Qt(e)!==e)throw Error(k(188))}function Pd(e){var t=e.alternate;if(!t){if(t=Qt(e),t===null)throw Error(k(188));return t!==e?null:e}for(var n=e,r=t;;){var l=n.return;if(l===null)break;var i=l.alternate;if(i===null){if(r=l.return,r!==null){n=r;continue}break}if(l.child===i.child){for(i=l.child;i;){if(i===n)return _a(l),e;if(i===r)return _a(l),t;i=i.sibling}throw Error(k(188))}if(n.return!==r.return)n=l,r=i;else{for(var o=!1,a=l.child;a;){if(a===n){o=!0,n=l,r=i;break}if(a===r){o=!0,r=l,n=i;break}a=a.sibling}if(!o){for(a=i.child;a;){if(a===n){o=!0,n=i,r=l;break}if(a===r){o=!0,r=i,n=l;break}a=a.sibling}if(!o)throw Error(k(189))}}if(n.alternate!==r)throw Error(k(190))}if(n.tag!==3)throw Error(k(188));return n.stateNode.current===n?e:t}function ru(e){return e=Pd(e),e!==null?lu(e):null}function lu(e){if(e.tag===5||e.tag===6)return e;for(e=e.child;e!==null;){var t=lu(e);if(t!==null)return t;e=e.sibling}return null}var iu=Ee.unstable_scheduleCallback,Sa=Ee.unstable_cancelCallback,zd=Ee.unstable_shouldYield,Ld=Ee.unstable_requestPaint,G=Ee.unstable_now,Dd=Ee.unstable_getCurrentPriorityLevel,Eo=Ee.unstable_ImmediatePriority,ou=Ee.unstable_UserBlockingPriority,ll=Ee.unstable_NormalPriority,Id=Ee.unstable_LowPriority,au=Ee.unstable_IdlePriority,jl=null,Ze=null;function Ad(e){if(Ze&&typeof Ze.onCommitFiberRoot=="function")try{Ze.onCommitFiberRoot(jl,e,void 0,(e.current.flags&128)===128)}catch{}}var Ve=Math.clz32?Math.clz32:Fd,Md=Math.log,Od=Math.LN2;function Fd(e){return e>>>=0,e===0?32:31-(Md(e)/Od|0)|0}var Rr=64,Tr=4194304;function $n(e){switch(e&-e){case 1:return 1;case 2:return 2;case 4:return 4;case 8:return 8;case 16:return 16;case 32:return 32;case 64:case 128:case 256:case 512:case 1024:case 2048:case 4096:case 8192:case 16384:case 32768:case 65536:case 131072:case 262144:case 524288:case 1048576:case 2097152:return e&4194240;case 4194304:case 8388608:case 16777216:case 33554432:case 67108864:return e&130023424;case 134217728:return 134217728;case 268435456:return 268435456;case 536870912:return 536870912;case 1073741824:return 1073741824;default:return e}}function il(e,t){var n=e.pendingLanes;if(n===0)return 0;var r=0,l=e.suspendedLanes,i=e.pingedLanes,o=n&268435455;if(o!==0){var a=o&~l;a!==0?r=$n(a):(i&=o,i!==0&&(r=$n(i)))}else o=n&~l,o!==0?r=$n(o):i!==0&&(r=$n(i));if(r===0)return 0;if(t!==0&&t!==r&&!(t&l)&&(l=r&-r,i=t&-t,l>=i||l===16&&(i&4194240)!==0))return t;if(r&4&&(r|=n&16),t=e.entangledLanes,t!==0)for(e=e.entanglements,t&=r;0<t;)n=31-Ve(t),l=1<<n,r|=e[n],t&=~l;return r}function $d(e,t){switch(e){case 1:case 2:case 4:return t+250;case 8:case 16:case 32:case 64:case 128:case 256:case 512:case 1024:case 2048:case 4096:case 8192:case 16384:case 32768:case 65536:case 131072:case 262144:case 524288:case 1048576:case 2097152:return t+5e3;case 4194304:case 8388608:case 16777216:case 33554432:case 67108864:return-1;case 134217728:case 268435456:case 536870912:case 1073741824:return-1;default:return-1}}function Ud(e,t){for(var n=e.suspendedLanes,r=e.pingedLanes,l=e.expirationTimes,i=e.pendingLanes;0<i;){var o=31-Ve(i),a=1<<o,u=l[o];u===-1?(!(a&n)||a&r)&&(l[o]=$d(a,t)):u<=t&&(e.expiredLanes|=a),i&=~a}}function Mi(e){return e=e.pendingLanes&-1073741825,e!==0?e:e&1073741824?1073741824:0}function su(){var e=Rr;return Rr<<=1,!(Rr&4194240)&&(Rr=64),e}function Zl(e){for(var t=[],n=0;31>n;n++)t.push(e);return t}function vr(e,t,n){e.pendingLanes|=t,t!==536870912&&(e.suspendedLanes=0,e.pingedLanes=0),e=e.eventTimes,t=31-Ve(t),e[t]=n}function Bd(e,t){var n=e.pendingLanes&~t;e.pendingLanes=t,e.suspendedLanes=0,e.pingedLanes=0,e.expiredLanes&=t,e.mutableReadLanes&=t,e.entangledLanes&=t,t=e.entanglements;var r=e.eventTimes;for(e=e.expirationTimes;0<n;){var l=31-Ve(n),i=1<<l;t[l]=0,r[l]=-1,e[l]=-1,n&=~i}}function jo(e,t){var n=e.entangledLanes|=t;for(e=e.entanglements;n;){var r=31-Ve(n),l=1<<r;l&t|e[r]&t&&(e[r]|=t),n&=~l}}var A=0;function uu(e){return e&=-e,1<e?4<e?e&268435455?16:536870912:4:1}var cu,Ro,du,fu,pu,Oi=!1,br=[],vt=null,yt=null,xt=null,er=new Map,tr=new Map,pt=[],Wd="mousedown mouseup touchcancel touchend touchstart auxclick dblclick pointercancel pointerdown pointerup dragend dragstart drop compositionend compositionstart keydown keypress keyup input textInput copy cut paste click change contextmenu reset submit".split(" ");function Ca(e,t){switch(e){case"focusin":case"focusout":vt=null;break;case"dragenter":case"dragleave":yt=null;break;case"mouseover":case"mouseout":xt=null;break;case"pointerover":case"pointerout":er.delete(t.pointerId);break;case"gotpointercapture":case"lostpointercapture":tr.delete(t.pointerId)}}function Pn(e,t,n,r,l,i){return e===null||e.nativeEvent!==i?(e={blockedOn:t,domEventName:n,eventSystemFlags:r,nativeEvent:i,targetContainers:[l]},t!==null&&(t=xr(t),t!==null&&Ro(t)),e):(e.eventSystemFlags|=r,t=e.targetContainers,l!==null&&t.indexOf(l)===-1&&t.push(l),e)}function Vd(e,t,n,r,l){switch(t){case"focusin":return vt=Pn(vt,e,t,n,r,l),!0;case"dragenter":return yt=Pn(yt,e,t,n,r,l),!0;case"mouseover":return xt=Pn(xt,e,t,n,r,l),!0;case"pointerover":var i=l.pointerId;return er.set(i,Pn(er.get(i)||null,e,t,n,r,l)),!0;case"gotpointercapture":return i=l.pointerId,tr.set(i,Pn(tr.get(i)||null,e,t,n,r,l)),!0}return!1}function gu(e){var t=It(e.target);if(t!==null){var n=Qt(t);if(n!==null){if(t=n.tag,t===13){if(t=nu(n),t!==null){e.blockedOn=t,pu(e.priority,function(){du(n)});return}}else if(t===3&&n.stateNode.current.memoizedState.isDehydrated){e.blockedOn=n.tag===3?n.stateNode.containerInfo:null;return}}}e.blockedOn=null}function Vr(e){if(e.blockedOn!==null)return!1;for(var t=e.targetContainers;0<t.length;){var n=Fi(e.domEventName,e.eventSystemFlags,t[0],e.nativeEvent);if(n===null){n=e.nativeEvent;var r=new n.constructor(n.type,n);Li=r,n.target.dispatchEvent(r),Li=null}else return t=xr(n),t!==null&&Ro(t),e.blockedOn=n,!1;t.shift()}return!0}function Na(e,t,n){Vr(e)&&n.delete(t)}function Hd(){Oi=!1,vt!==null&&Vr(vt)&&(vt=null),yt!==null&&Vr(yt)&&(yt=null),xt!==null&&Vr(xt)&&(xt=null),er.forEach(Na),tr.forEach(Na)}function zn(e,t){e.blockedOn===t&&(e.blockedOn=null,Oi||(Oi=!0,Ee.unstable_scheduleCallback(Ee.unstable_NormalPriority,Hd)))}function nr(e){function t(l){return zn(l,e)}if(0<br.length){zn(br[0],e);for(var n=1;n<br.length;n++){var r=br[n];r.blockedOn===e&&(r.blockedOn=null)}}for(vt!==null&&zn(vt,e),yt!==null&&zn(yt,e),xt!==null&&zn(xt,e),er.forEach(t),tr.forEach(t),n=0;n<pt.length;n++)r=pt[n],r.blockedOn===e&&(r.blockedOn=null);for(;0<pt.length&&(n=pt[0],n.blockedOn===null);)gu(n),n.blockedOn===null&&pt.shift()}var cn=ut.ReactCurrentBatchConfig,ol=!0;function Qd(e,t,n,r){var l=A,i=cn.transition;cn.transition=null;try{A=1,To(e,t,n,r)}finally{A=l,cn.transition=i}}function Yd(e,t,n,r){var l=A,i=cn.transition;cn.transition=null;try{A=4,To(e,t,n,r)}finally{A=l,cn.transition=i}}function To(e,t,n,r){if(ol){var l=Fi(e,t,n,r);if(l===null)ai(e,t,r,al,n),Ca(e,r);else if(Vd(l,e,t,n,r))r.stopPropagation();else if(Ca(e,r),t&4&&-1<Wd.indexOf(e)){for(;l!==null;){var i=xr(l);if(i!==null&&cu(i),i=Fi(e,t,n,r),i===null&&ai(e,t,r,al,n),i===l)break;l=i}l!==null&&r.stopPropagation()}else ai(e,t,r,null,n)}}var al=null;function Fi(e,t,n,r){if(al=null,e=No(r),e=It(e),e!==null)if(t=Qt(e),t===null)e=null;else if(n=t.tag,n===13){if(e=nu(t),e!==null)return e;e=null}else if(n===3){if(t.stateNode.current.memoizedState.isDehydrated)return t.tag===3?t.stateNode.containerInfo:null;e=null}else t!==e&&(e=null);return al=e,null}function mu(e){switch(e){case"cancel":case"click":case"close":case"contextmenu":case"copy":case"cut":case"auxclick":case"dblclick":case"dragend":case"dragstart":case"drop":case"focusin":case"focusout":case"input":case"invalid":case"keydown":case"keypress":case"keyup":case"mousedown":case"mouseup":case"paste":case"pause":case"play":case"pointercancel":case"pointerdown":case"pointerup":case"ratechange":case"reset":case"resize":case"seeked":case"submit":case"touchcancel":case"touchend":case"touchstart":case"volumechange":case"change":case"selectionchange":case"textInput":case"compositionstart":case"compositionend":case"compositionupdate":case"beforeblur":case"afterblur":case"beforeinput":case"blur":case"fullscreenchange":case"focus":case"hashchange":case"popstate":case"select":case"selectstart":return 1;case"drag":case"dragenter":case"dragexit":case"dragleave":case"dragover":case"mousemove":case"mouseout":case"mouseover":case"pointermove":case"pointerout":case"pointerover":case"scroll":case"toggle":case"touchmove":case"wheel":case"mouseenter":case"mouseleave":case"pointerenter":case"pointerleave":return 4;case"message":switch(Dd()){case Eo:return 1;case ou:return 4;case ll:case Id:return 16;case au:return 536870912;default:return 16}default:return 16}}var mt=null,bo=null,Hr=null;function hu(){if(Hr)return Hr;var e,t=bo,n=t.length,r,l="value"in mt?mt.value:mt.textContent,i=l.length;for(e=0;e<n&&t[e]===l[e];e++);var o=n-e;for(r=1;r<=o&&t[n-r]===l[i-r];r++);return Hr=l.slice(e,1<r?1-r:void 0)}function Qr(e){var t=e.keyCode;return"charCode"in e?(e=e.charCode,e===0&&t===13&&(e=13)):e=t,e===10&&(e=13),32<=e||e===13?e:0}function Pr(){return!0}function Ea(){return!1}function Pe(e){function t(n,r,l,i,o){this._reactName=n,this._targetInst=l,this.type=r,this.nativeEvent=i,this.target=o,this.currentTarget=null;for(var a in e)e.hasOwnProperty(a)&&(n=e[a],this[a]=n?n(i):i[a]);return this.isDefaultPrevented=(i.defaultPrevented!=null?i.defaultPrevented:i.returnValue===!1)?Pr:Ea,this.isPropagationStopped=Ea,this}return Y(t.prototype,{preventDefault:function(){this.defaultPrevented=!0;var n=this.nativeEvent;n&&(n.preventDefault?n.preventDefault():typeof n.returnValue!="unknown"&&(n.returnValue=!1),this.isDefaultPrevented=Pr)},stopPropagation:function(){var n=this.nativeEvent;n&&(n.stopPropagation?n.stopPropagation():typeof n.cancelBubble!="unknown"&&(n.cancelBubble=!0),this.isPropagationStopped=Pr)},persist:function(){},isPersistent:Pr}),t}var Cn={eventPhase:0,bubbles:0,cancelable:0,timeStamp:function(e){return e.timeStamp||Date.now()},defaultPrevented:0,isTrusted:0},Po=Pe(Cn),yr=Y({},Cn,{view:0,detail:0}),Kd=Pe(yr),Jl,ql,Ln,Rl=Y({},yr,{screenX:0,screenY:0,clientX:0,clientY:0,pageX:0,pageY:0,ctrlKey:0,shiftKey:0,altKey:0,metaKey:0,getModifierState:zo,button:0,buttons:0,relatedTarget:function(e){return e.relatedTarget===void 0?e.fromElement===e.srcElement?e.toElement:e.fromElement:e.relatedTarget},movementX:function(e){return"movementX"in e?e.movementX:(e!==Ln&&(Ln&&e.type==="mousemove"?(Jl=e.screenX-Ln.screenX,ql=e.screenY-Ln.screenY):ql=Jl=0,Ln=e),Jl)},movementY:function(e){return"movementY"in e?e.movementY:ql}}),ja=Pe(Rl),Xd=Y({},Rl,{dataTransfer:0}),Gd=Pe(Xd),Zd=Y({},yr,{relatedTarget:0}),ei=Pe(Zd),Jd=Y({},Cn,{animationName:0,elapsedTime:0,pseudoElement:0}),qd=Pe(Jd),ef=Y({},Cn,{clipboardData:function(e){return"clipboardData"in e?e.clipboardData:window.clipboardData}}),tf=Pe(ef),nf=Y({},Cn,{data:0}),Ra=Pe(nf),rf={Esc:"Escape",Spacebar:" ",Left:"ArrowLeft",Up:"ArrowUp",Right:"ArrowRight",Down:"ArrowDown",Del:"Delete",Win:"OS",Menu:"ContextMenu",Apps:"ContextMenu",Scroll:"ScrollLock",MozPrintableKey:"Unidentified"},lf={8:"Backspace",9:"Tab",12:"Clear",13:"Enter",16:"Shift",17:"Control",18:"Alt",19:"Pause",20:"CapsLock",27:"Escape",32:" ",33:"PageUp",34:"PageDown",35:"End",36:"Home",37:"ArrowLeft",38:"ArrowUp",39:"ArrowRight",40:"ArrowDown",45:"Insert",46:"Delete",112:"F1",113:"F2",114:"F3",115:"F4",116:"F5",117:"F6",118:"F7",119:"F8",120:"F9",121:"F10",122:"F11",123:"F12",144:"NumLock",145:"ScrollLock",224:"Meta"},of={Alt:"altKey",Control:"ctrlKey",Meta:"metaKey",Shift:"shiftKey"};function af(e){var t=this.nativeEvent;return t.getModifierState?t.getModifierState(e):(e=of[e])?!!t[e]:!1}function zo(){return af}var sf=Y({},yr,{key:function(e){if(e.key){var t=rf[e.key]||e.key;if(t!=="Unidentified")return t}return e.type==="keypress"?(e=Qr(e),e===13?"Enter":String.fromCharCode(e)):e.type==="keydown"||e.type==="keyup"?lf[e.keyCode]||"Unidentified":""},code:0,location:0,ctrlKey:0,shiftKey:0,altKey:0,metaKey:0,repeat:0,locale:0,getModifierState:zo,charCode:function(e){return e.type==="keypress"?Qr(e):0},keyCode:function(e){return e.type==="keydown"||e.type==="keyup"?e.keyCode:0},which:function(e){return e.type==="keypress"?Qr(e):e.type==="keydown"||e.type==="keyup"?e.keyCode:0}}),uf=Pe(sf),cf=Y({},Rl,{pointerId:0,width:0,height:0,pressure:0,tangentialPressure:0,tiltX:0,tiltY:0,twist:0,pointerType:0,isPrimary:0}),Ta=Pe(cf),df=Y({},yr,{touches:0,targetTouches:0,changedTouches:0,altKey:0,metaKey:0,ctrlKey:0,shiftKey:0,getModifierState:zo}),ff=Pe(df),pf=Y({},Cn,{propertyName:0,elapsedTime:0,pseudoElement:0}),gf=Pe(pf),mf=Y({},Rl,{deltaX:function(e){return"deltaX"in e?e.deltaX:"wheelDeltaX"in e?-e.wheelDeltaX:0},deltaY:function(e){return"deltaY"in e?e.deltaY:"wheelDeltaY"in e?-e.wheelDeltaY:"wheelDelta"in e?-e.wheelDelta:0},deltaZ:0,deltaMode:0}),hf=Pe(mf),vf=[9,13,27,32],Lo=it&&"CompositionEvent"in window,Vn=null;it&&"documentMode"in document&&(Vn=document.documentMode);var yf=it&&"TextEvent"in window&&!Vn,vu=it&&(!Lo||Vn&&8<Vn&&11>=Vn),ba=" ",Pa=!1;function yu(e,t){switch(e){case"keyup":return vf.indexOf(t.keyCode)!==-1;case"keydown":return t.keyCode!==229;case"keypress":case"mousedown":case"focusout":return!0;default:return!1}}function xu(e){return e=e.detail,typeof e=="object"&&"data"in e?e.data:null}var Gt=!1;function xf(e,t){switch(e){case"compositionend":return xu(t);case"keypress":return t.which!==32?null:(Pa=!0,ba);case"textInput":return e=t.data,e===ba&&Pa?null:e;default:return null}}function wf(e,t){if(Gt)return e==="compositionend"||!Lo&&yu(e,t)?(e=hu(),Hr=bo=mt=null,Gt=!1,e):null;switch(e){case"paste":return null;case"keypress":if(!(t.ctrlKey||t.altKey||t.metaKey)||t.ctrlKey&&t.altKey){if(t.char&&1<t.char.length)return t.char;if(t.which)return String.fromCharCode(t.which)}return null;case"compositionend":return vu&&t.locale!=="ko"?null:t.data;default:return null}}var kf={color:!0,date:!0,datetime:!0,"datetime-local":!0,email:!0,month:!0,number:!0,password:!0,range:!0,search:!0,tel:!0,text:!0,time:!0,url:!0,week:!0};function za(e){var t=e&&e.nodeName&&e.nodeName.toLowerCase();return t==="input"?!!kf[e.type]:t==="textarea"}function wu(e,t,n,r){Zs(r),t=sl(t,"onChange"),0<t.length&&(n=new Po("onChange","change",null,n,r),e.push({event:n,listeners:t}))}var Hn=null,rr=null;function _f(e){Pu(e,0)}function Tl(e){var t=qt(e);if(Vs(t))return e}function Sf(e,t){if(e==="change")return t}var ku=!1;if(it){var ti;if(it){var ni="oninput"in document;if(!ni){var La=document.createElement("div");La.setAttribute("oninput","return;"),ni=typeof La.oninput=="function"}ti=ni}else ti=!1;ku=ti&&(!document.documentMode||9<document.documentMode)}function Da(){Hn&&(Hn.detachEvent("onpropertychange",_u),rr=Hn=null)}function _u(e){if(e.propertyName==="value"&&Tl(rr)){var t=[];wu(t,rr,e,No(e)),tu(_f,t)}}function Cf(e,t,n){e==="focusin"?(Da(),Hn=t,rr=n,Hn.attachEvent("onpropertychange",_u)):e==="focusout"&&Da()}function Nf(e){if(e==="selectionchange"||e==="keyup"||e==="keydown")return Tl(rr)}function Ef(e,t){if(e==="click")return Tl(t)}function jf(e,t){if(e==="input"||e==="change")return Tl(t)}function Rf(e,t){return e===t&&(e!==0||1/e===1/t)||e!==e&&t!==t}var Qe=typeof Object.is=="function"?Object.is:Rf;function lr(e,t){if(Qe(e,t))return!0;if(typeof e!="object"||e===null||typeof t!="object"||t===null)return!1;var n=Object.keys(e),r=Object.keys(t);if(n.length!==r.length)return!1;for(r=0;r<n.length;r++){var l=n[r];if(!ki.call(t,l)||!Qe(e[l],t[l]))return!1}return!0}function Ia(e){for(;e&&e.firstChild;)e=e.firstChild;return e}function Aa(e,t){var n=Ia(e);e=0;for(var r;n;){if(n.nodeType===3){if(r=e+n.textContent.length,e<=t&&r>=t)return{node:n,offset:t-e};e=r}e:{for(;n;){if(n.nextSibling){n=n.nextSibling;break e}n=n.parentNode}n=void 0}n=Ia(n)}}function Su(e,t){return e&&t?e===t?!0:e&&e.nodeType===3?!1:t&&t.nodeType===3?Su(e,t.parentNode):"contains"in e?e.contains(t):e.compareDocumentPosition?!!(e.compareDocumentPosition(t)&16):!1:!1}function Cu(){for(var e=window,t=tl();t instanceof e.HTMLIFrameElement;){try{var n=typeof t.contentWindow.location.href=="string"}catch{n=!1}if(n)e=t.contentWindow;else break;t=tl(e.document)}return t}function Do(e){var t=e&&e.nodeName&&e.nodeName.toLowerCase();return t&&(t==="input"&&(e.type==="text"||e.type==="search"||e.type==="tel"||e.type==="url"||e.type==="password")||t==="textarea"||e.contentEditable==="true")}function Tf(e){var t=Cu(),n=e.focusedElem,r=e.selectionRange;if(t!==n&&n&&n.ownerDocument&&Su(n.ownerDocument.documentElement,n)){if(r!==null&&Do(n)){if(t=r.start,e=r.end,e===void 0&&(e=t),"selectionStart"in n)n.selectionStart=t,n.selectionEnd=Math.min(e,n.value.length);else if(e=(t=n.ownerDocument||document)&&t.defaultView||window,e.getSelection){e=e.getSelection();var l=n.textContent.length,i=Math.min(r.start,l);r=r.end===void 0?i:Math.min(r.end,l),!e.extend&&i>r&&(l=r,r=i,i=l),l=Aa(n,i);var o=Aa(n,r);l&&o&&(e.rangeCount!==1||e.anchorNode!==l.node||e.anchorOffset!==l.offset||e.focusNode!==o.node||e.focusOffset!==o.offset)&&(t=t.createRange(),t.setStart(l.node,l.offset),e.removeAllRanges(),i>r?(e.addRange(t),e.extend(o.node,o.offset)):(t.setEnd(o.node,o.offset),e.addRange(t)))}}for(t=[],e=n;e=e.parentNode;)e.nodeType===1&&t.push({element:e,left:e.scrollLeft,top:e.scrollTop});for(typeof n.focus=="function"&&n.focus(),n=0;n<t.length;n++)e=t[n],e.element.scrollLeft=e.left,e.element.scrollTop=e.top}}var bf=it&&"documentMode"in document&&11>=document.documentMode,Zt=null,$i=null,Qn=null,Ui=!1;function Ma(e,t,n){var r=n.window===n?n.document:n.nodeType===9?n:n.ownerDocument;Ui||Zt==null||Zt!==tl(r)||(r=Zt,"selectionStart"in r&&Do(r)?r={start:r.selectionStart,end:r.selectionEnd}:(r=(r.ownerDocument&&r.ownerDocument.defaultView||window).getSelection(),r={anchorNode:r.anchorNode,anchorOffset:r.anchorOffset,focusNode:r.focusNode,focusOffset:r.focusOffset}),Qn&&lr(Qn,r)||(Qn=r,r=sl($i,"onSelect"),0<r.length&&(t=new Po("onSelect","select",null,t,n),e.push({event:t,listeners:r}),t.target=Zt)))}function zr(e,t){var n={};return n[e.toLowerCase()]=t.toLowerCase(),n["Webkit"+e]="webkit"+t,n["Moz"+e]="moz"+t,n}var Jt={animationend:zr("Animation","AnimationEnd"),animationiteration:zr("Animation","AnimationIteration"),animationstart:zr("Animation","AnimationStart"),transitionend:zr("Transition","TransitionEnd")},ri={},Nu={};it&&(Nu=document.createElement("div").style,"AnimationEvent"in window||(delete Jt.animationend.animation,delete Jt.animationiteration.animation,delete Jt.animationstart.animation),"TransitionEvent"in window||delete Jt.transitionend.transition);function bl(e){if(ri[e])return ri[e];if(!Jt[e])return e;var t=Jt[e],n;for(n in t)if(t.hasOwnProperty(n)&&n in Nu)return ri[e]=t[n];return e}var Eu=bl("animationend"),ju=bl("animationiteration"),Ru=bl("animationstart"),Tu=bl("transitionend"),bu=new Map,Oa="abort auxClick cancel canPlay canPlayThrough click close contextMenu copy cut drag dragEnd dragEnter dragExit dragLeave dragOver dragStart drop durationChange emptied encrypted ended error gotPointerCapture input invalid keyDown keyPress keyUp load loadedData loadedMetadata loadStart lostPointerCapture mouseDown mouseMove mouseOut mouseOver mouseUp paste pause play playing pointerCancel pointerDown pointerMove pointerOut pointerOver pointerUp progress rateChange reset resize seeked seeking stalled submit suspend timeUpdate touchCancel touchEnd touchStart volumeChange scroll toggle touchMove waiting wheel".split(" ");function jt(e,t){bu.set(e,t),Ht(t,[e])}for(var li=0;li<Oa.length;li++){var ii=Oa[li],Pf=ii.toLowerCase(),zf=ii[0].toUpperCase()+ii.slice(1);jt(Pf,"on"+zf)}jt(Eu,"onAnimationEnd");jt(ju,"onAnimationIteration");jt(Ru,"onAnimationStart");jt("dblclick","onDoubleClick");jt("focusin","onFocus");jt("focusout","onBlur");jt(Tu,"onTransitionEnd");pn("onMouseEnter",["mouseout","mouseover"]);pn("onMouseLeave",["mouseout","mouseover"]);pn("onPointerEnter",["pointerout","pointerover"]);pn("onPointerLeave",["pointerout","pointerover"]);Ht("onChange","change click focusin focusout input keydown keyup selectionchange".split(" "));Ht("onSelect","focusout contextmenu dragend focusin keydown keyup mousedown mouseup selectionchange".split(" "));Ht("onBeforeInput",["compositionend","keypress","textInput","paste"]);Ht("onCompositionEnd","compositionend focusout keydown keypress keyup mousedown".split(" "));Ht("onCompositionStart","compositionstart focusout keydown keypress keyup mousedown".split(" "));Ht("onCompositionUpdate","compositionupdate focusout keydown keypress keyup mousedown".split(" "));var Un="abort canplay canplaythrough durationchange emptied encrypted ended error loadeddata loadedmetadata loadstart pause play playing progress ratechange resize seeked seeking stalled suspend timeupdate volumechange waiting".split(" "),Lf=new Set("cancel close invalid load scroll toggle".split(" ").concat(Un));function Fa(e,t,n){var r=e.type||"unknown-event";e.currentTarget=n,bd(r,t,void 0,e),e.currentTarget=null}function Pu(e,t){t=(t&4)!==0;for(var n=0;n<e.length;n++){var r=e[n],l=r.event;r=r.listeners;e:{var i=void 0;if(t)for(var o=r.length-1;0<=o;o--){var a=r[o],u=a.instance,c=a.currentTarget;if(a=a.listener,u!==i&&l.isPropagationStopped())break e;Fa(l,a,c),i=u}else for(o=0;o<r.length;o++){if(a=r[o],u=a.instance,c=a.currentTarget,a=a.listener,u!==i&&l.isPropagationStopped())break e;Fa(l,a,c),i=u}}}if(rl)throw e=Ai,rl=!1,Ai=null,e}function U(e,t){var n=t[Qi];n===void 0&&(n=t[Qi]=new Set);var r=e+"__bubble";n.has(r)||(zu(t,e,2,!1),n.add(r))}function oi(e,t,n){var r=0;t&&(r|=4),zu(n,e,r,t)}var Lr="_reactListening"+Math.random().toString(36).slice(2);function ir(e){if(!e[Lr]){e[Lr]=!0,Fs.forEach(function(n){n!=="selectionchange"&&(Lf.has(n)||oi(n,!1,e),oi(n,!0,e))});var t=e.nodeType===9?e:e.ownerDocument;t===null||t[Lr]||(t[Lr]=!0,oi("selectionchange",!1,t))}}function zu(e,t,n,r){switch(mu(t)){case 1:var l=Qd;break;case 4:l=Yd;break;default:l=To}n=l.bind(null,t,n,e),l=void 0,!Ii||t!=="touchstart"&&t!=="touchmove"&&t!=="wheel"||(l=!0),r?l!==void 0?e.addEventListener(t,n,{capture:!0,passive:l}):e.addEventListener(t,n,!0):l!==void 0?e.addEventListener(t,n,{passive:l}):e.addEventListener(t,n,!1)}function ai(e,t,n,r,l){var i=r;if(!(t&1)&&!(t&2)&&r!==null)e:for(;;){if(r===null)return;var o=r.tag;if(o===3||o===4){var a=r.stateNode.containerInfo;if(a===l||a.nodeType===8&&a.parentNode===l)break;if(o===4)for(o=r.return;o!==null;){var u=o.tag;if((u===3||u===4)&&(u=o.stateNode.containerInfo,u===l||u.nodeType===8&&u.parentNode===l))return;o=o.return}for(;a!==null;){if(o=It(a),o===null)return;if(u=o.tag,u===5||u===6){r=i=o;continue e}a=a.parentNode}}r=r.return}tu(function(){var c=i,g=No(n),m=[];e:{var h=bu.get(e);if(h!==void 0){var v=Po,x=e;switch(e){case"keypress":if(Qr(n)===0)break e;case"keydown":case"keyup":v=uf;break;case"focusin":x="focus",v=ei;break;case"focusout":x="blur",v=ei;break;case"beforeblur":case"afterblur":v=ei;break;case"click":if(n.button===2)break e;case"auxclick":case"dblclick":case"mousedown":case"mousemove":case"mouseup":case"mouseout":case"mouseover":case"contextmenu":v=ja;break;case"drag":case"dragend":case"dragenter":case"dragexit":case"dragleave":case"dragover":case"dragstart":case"drop":v=Gd;break;case"touchcancel":case"touchend":case"touchmove":case"touchstart":v=ff;break;case Eu:case ju:case Ru:v=qd;break;case Tu:v=gf;break;case"scroll":v=Kd;break;case"wheel":v=hf;break;case"copy":case"cut":case"paste":v=tf;break;case"gotpointercapture":case"lostpointercapture":case"pointercancel":case"pointerdown":case"pointermove":case"pointerout":case"pointerover":case"pointerup":v=Ta}var w=(t&4)!==0,D=!w&&e==="scroll",p=w?h!==null?h+"Capture":null:h;w=[];for(var d=c,f;d!==null;){f=d;var y=f.stateNode;if(f.tag===5&&y!==null&&(f=y,p!==null&&(y=qn(d,p),y!=null&&w.push(or(d,y,f)))),D)break;d=d.return}0<w.length&&(h=new v(h,x,null,n,g),m.push({event:h,listeners:w}))}}if(!(t&7)){e:{if(h=e==="mouseover"||e==="pointerover",v=e==="mouseout"||e==="pointerout",h&&n!==Li&&(x=n.relatedTarget||n.fromElement)&&(It(x)||x[ot]))break e;if((v||h)&&(h=g.window===g?g:(h=g.ownerDocument)?h.defaultView||h.parentWindow:window,v?(x=n.relatedTarget||n.toElement,v=c,x=x?It(x):null,x!==null&&(D=Qt(x),x!==D||x.tag!==5&&x.tag!==6)&&(x=null)):(v=null,x=c),v!==x)){if(w=ja,y="onMouseLeave",p="onMouseEnter",d="mouse",(e==="pointerout"||e==="pointerover")&&(w=Ta,y="onPointerLeave",p="onPointerEnter",d="pointer"),D=v==null?h:qt(v),f=x==null?h:qt(x),h=new w(y,d+"leave",v,n,g),h.target=D,h.relatedTarget=f,y=null,It(g)===c&&(w=new w(p,d+"enter",x,n,g),w.target=f,w.relatedTarget=D,y=w),D=y,v&&x)t:{for(w=v,p=x,d=0,f=w;f;f=Yt(f))d++;for(f=0,y=p;y;y=Yt(y))f++;for(;0<d-f;)w=Yt(w),d--;for(;0<f-d;)p=Yt(p),f--;for(;d--;){if(w===p||p!==null&&w===p.alternate)break t;w=Yt(w),p=Yt(p)}w=null}else w=null;v!==null&&$a(m,h,v,w,!1),x!==null&&D!==null&&$a(m,D,x,w,!0)}}e:{if(h=c?qt(c):window,v=h.nodeName&&h.nodeName.toLowerCase(),v==="select"||v==="input"&&h.type==="file")var _=Sf;else if(za(h))if(ku)_=jf;else{_=Nf;var S=Cf}else(v=h.nodeName)&&v.toLowerCase()==="input"&&(h.type==="checkbox"||h.type==="radio")&&(_=Ef);if(_&&(_=_(e,c))){wu(m,_,n,g);break e}S&&S(e,h,c),e==="focusout"&&(S=h._wrapperState)&&S.controlled&&h.type==="number"&&Ri(h,"number",h.value)}switch(S=c?qt(c):window,e){case"focusin":(za(S)||S.contentEditable==="true")&&(Zt=S,$i=c,Qn=null);break;case"focusout":Qn=$i=Zt=null;break;case"mousedown":Ui=!0;break;case"contextmenu":case"mouseup":case"dragend":Ui=!1,Ma(m,n,g);break;case"selectionchange":if(bf)break;case"keydown":case"keyup":Ma(m,n,g)}var E;if(Lo)e:{switch(e){case"compositionstart":var j="onCompositionStart";break e;case"compositionend":j="onCompositionEnd";break e;case"compositionupdate":j="onCompositionUpdate";break e}j=void 0}else Gt?yu(e,n)&&(j="onCompositionEnd"):e==="keydown"&&n.keyCode===229&&(j="onCompositionStart");j&&(vu&&n.locale!=="ko"&&(Gt||j!=="onCompositionStart"?j==="onCompositionEnd"&&Gt&&(E=hu()):(mt=g,bo="value"in mt?mt.value:mt.textContent,Gt=!0)),S=sl(c,j),0<S.length&&(j=new Ra(j,e,null,n,g),m.push({event:j,listeners:S}),E?j.data=E:(E=xu(n),E!==null&&(j.data=E)))),(E=yf?xf(e,n):wf(e,n))&&(c=sl(c,"onBeforeInput"),0<c.length&&(g=new Ra("onBeforeInput","beforeinput",null,n,g),m.push({event:g,listeners:c}),g.data=E))}Pu(m,t)})}function or(e,t,n){return{instance:e,listener:t,currentTarget:n}}function sl(e,t){for(var n=t+"Capture",r=[];e!==null;){var l=e,i=l.stateNode;l.tag===5&&i!==null&&(l=i,i=qn(e,n),i!=null&&r.unshift(or(e,i,l)),i=qn(e,t),i!=null&&r.push(or(e,i,l))),e=e.return}return r}function Yt(e){if(e===null)return null;do e=e.return;while(e&&e.tag!==5);return e||null}function $a(e,t,n,r,l){for(var i=t._reactName,o=[];n!==null&&n!==r;){var a=n,u=a.alternate,c=a.stateNode;if(u!==null&&u===r)break;a.tag===5&&c!==null&&(a=c,l?(u=qn(n,i),u!=null&&o.unshift(or(n,u,a))):l||(u=qn(n,i),u!=null&&o.push(or(n,u,a)))),n=n.return}o.length!==0&&e.push({event:t,listeners:o})}var Df=/\r\n?/g,If=/\u0000|\uFFFD/g;function Ua(e){return(typeof e=="string"?e:""+e).replace(Df,`
`).replace(If,"")}function Dr(e,t,n){if(t=Ua(t),Ua(e)!==t&&n)throw Error(k(425))}function ul(){}var Bi=null,Wi=null;function Vi(e,t){return e==="textarea"||e==="noscript"||typeof t.children=="string"||typeof t.children=="number"||typeof t.dangerouslySetInnerHTML=="object"&&t.dangerouslySetInnerHTML!==null&&t.dangerouslySetInnerHTML.__html!=null}var Hi=typeof setTimeout=="function"?setTimeout:void 0,Af=typeof clearTimeout=="function"?clearTimeout:void 0,Ba=typeof Promise=="function"?Promise:void 0,Mf=typeof queueMicrotask=="function"?queueMicrotask:typeof Ba<"u"?function(e){return Ba.resolve(null).then(e).catch(Of)}:Hi;function Of(e){setTimeout(function(){throw e})}function si(e,t){var n=t,r=0;do{var l=n.nextSibling;if(e.removeChild(n),l&&l.nodeType===8)if(n=l.data,n==="/$"){if(r===0){e.removeChild(l),nr(t);return}r--}else n!=="$"&&n!=="$?"&&n!=="$!"||r++;n=l}while(n);nr(t)}function wt(e){for(;e!=null;e=e.nextSibling){var t=e.nodeType;if(t===1||t===3)break;if(t===8){if(t=e.data,t==="$"||t==="$!"||t==="$?")break;if(t==="/$")return null}}return e}function Wa(e){e=e.previousSibling;for(var t=0;e;){if(e.nodeType===8){var n=e.data;if(n==="$"||n==="$!"||n==="$?"){if(t===0)return e;t--}else n==="/$"&&t++}e=e.previousSibling}return null}var Nn=Math.random().toString(36).slice(2),Ge="__reactFiber$"+Nn,ar="__reactProps$"+Nn,ot="__reactContainer$"+Nn,Qi="__reactEvents$"+Nn,Ff="__reactListeners$"+Nn,$f="__reactHandles$"+Nn;function It(e){var t=e[Ge];if(t)return t;for(var n=e.parentNode;n;){if(t=n[ot]||n[Ge]){if(n=t.alternate,t.child!==null||n!==null&&n.child!==null)for(e=Wa(e);e!==null;){if(n=e[Ge])return n;e=Wa(e)}return t}e=n,n=e.parentNode}return null}function xr(e){return e=e[Ge]||e[ot],!e||e.tag!==5&&e.tag!==6&&e.tag!==13&&e.tag!==3?null:e}function qt(e){if(e.tag===5||e.tag===6)return e.stateNode;throw Error(k(33))}function Pl(e){return e[ar]||null}var Yi=[],en=-1;function Rt(e){return{current:e}}function B(e){0>en||(e.current=Yi[en],Yi[en]=null,en--)}function $(e,t){en++,Yi[en]=e.current,e.current=t}var Et={},fe=Rt(Et),we=Rt(!1),$t=Et;function gn(e,t){var n=e.type.contextTypes;if(!n)return Et;var r=e.stateNode;if(r&&r.__reactInternalMemoizedUnmaskedChildContext===t)return r.__reactInternalMemoizedMaskedChildContext;var l={},i;for(i in n)l[i]=t[i];return r&&(e=e.stateNode,e.__reactInternalMemoizedUnmaskedChildContext=t,e.__reactInternalMemoizedMaskedChildContext=l),l}function ke(e){return e=e.childContextTypes,e!=null}function cl(){B(we),B(fe)}function Va(e,t,n){if(fe.current!==Et)throw Error(k(168));$(fe,t),$(we,n)}function Lu(e,t,n){var r=e.stateNode;if(t=t.childContextTypes,typeof r.getChildContext!="function")return n;r=r.getChildContext();for(var l in r)if(!(l in t))throw Error(k(108,Sd(e)||"Unknown",l));return Y({},n,r)}function dl(e){return e=(e=e.stateNode)&&e.__reactInternalMemoizedMergedChildContext||Et,$t=fe.current,$(fe,e),$(we,we.current),!0}function Ha(e,t,n){var r=e.stateNode;if(!r)throw Error(k(169));n?(e=Lu(e,t,$t),r.__reactInternalMemoizedMergedChildContext=e,B(we),B(fe),$(fe,e)):B(we),$(we,n)}var tt=null,zl=!1,ui=!1;function Du(e){tt===null?tt=[e]:tt.push(e)}function Uf(e){zl=!0,Du(e)}function Tt(){if(!ui&&tt!==null){ui=!0;var e=0,t=A;try{var n=tt;for(A=1;e<n.length;e++){var r=n[e];do r=r(!0);while(r!==null)}tt=null,zl=!1}catch(l){throw tt!==null&&(tt=tt.slice(e+1)),iu(Eo,Tt),l}finally{A=t,ui=!1}}return null}var tn=[],nn=0,fl=null,pl=0,ze=[],Le=0,Ut=null,nt=1,rt="";function zt(e,t){tn[nn++]=pl,tn[nn++]=fl,fl=e,pl=t}function Iu(e,t,n){ze[Le++]=nt,ze[Le++]=rt,ze[Le++]=Ut,Ut=e;var r=nt;e=rt;var l=32-Ve(r)-1;r&=~(1<<l),n+=1;var i=32-Ve(t)+l;if(30<i){var o=l-l%5;i=(r&(1<<o)-1).toString(32),r>>=o,l-=o,nt=1<<32-Ve(t)+l|n<<l|r,rt=i+e}else nt=1<<i|n<<l|r,rt=e}function Io(e){e.return!==null&&(zt(e,1),Iu(e,1,0))}function Ao(e){for(;e===fl;)fl=tn[--nn],tn[nn]=null,pl=tn[--nn],tn[nn]=null;for(;e===Ut;)Ut=ze[--Le],ze[Le]=null,rt=ze[--Le],ze[Le]=null,nt=ze[--Le],ze[Le]=null}var Ne=null,Ce=null,W=!1,We=null;function Au(e,t){var n=De(5,null,null,0);n.elementType="DELETED",n.stateNode=t,n.return=e,t=e.deletions,t===null?(e.deletions=[n],e.flags|=16):t.push(n)}function Qa(e,t){switch(e.tag){case 5:var n=e.type;return t=t.nodeType!==1||n.toLowerCase()!==t.nodeName.toLowerCase()?null:t,t!==null?(e.stateNode=t,Ne=e,Ce=wt(t.firstChild),!0):!1;case 6:return t=e.pendingProps===""||t.nodeType!==3?null:t,t!==null?(e.stateNode=t,Ne=e,Ce=null,!0):!1;case 13:return t=t.nodeType!==8?null:t,t!==null?(n=Ut!==null?{id:nt,overflow:rt}:null,e.memoizedState={dehydrated:t,treeContext:n,retryLane:1073741824},n=De(18,null,null,0),n.stateNode=t,n.return=e,e.child=n,Ne=e,Ce=null,!0):!1;default:return!1}}function Ki(e){return(e.mode&1)!==0&&(e.flags&128)===0}function Xi(e){if(W){var t=Ce;if(t){var n=t;if(!Qa(e,t)){if(Ki(e))throw Error(k(418));t=wt(n.nextSibling);var r=Ne;t&&Qa(e,t)?Au(r,n):(e.flags=e.flags&-4097|2,W=!1,Ne=e)}}else{if(Ki(e))throw Error(k(418));e.flags=e.flags&-4097|2,W=!1,Ne=e}}}function Ya(e){for(e=e.return;e!==null&&e.tag!==5&&e.tag!==3&&e.tag!==13;)e=e.return;Ne=e}function Ir(e){if(e!==Ne)return!1;if(!W)return Ya(e),W=!0,!1;var t;if((t=e.tag!==3)&&!(t=e.tag!==5)&&(t=e.type,t=t!=="head"&&t!=="body"&&!Vi(e.type,e.memoizedProps)),t&&(t=Ce)){if(Ki(e))throw Mu(),Error(k(418));for(;t;)Au(e,t),t=wt(t.nextSibling)}if(Ya(e),e.tag===13){if(e=e.memoizedState,e=e!==null?e.dehydrated:null,!e)throw Error(k(317));e:{for(e=e.nextSibling,t=0;e;){if(e.nodeType===8){var n=e.data;if(n==="/$"){if(t===0){Ce=wt(e.nextSibling);break e}t--}else n!=="$"&&n!=="$!"&&n!=="$?"||t++}e=e.nextSibling}Ce=null}}else Ce=Ne?wt(e.stateNode.nextSibling):null;return!0}function Mu(){for(var e=Ce;e;)e=wt(e.nextSibling)}function mn(){Ce=Ne=null,W=!1}function Mo(e){We===null?We=[e]:We.push(e)}var Bf=ut.ReactCurrentBatchConfig;function Dn(e,t,n){if(e=n.ref,e!==null&&typeof e!="function"&&typeof e!="object"){if(n._owner){if(n=n._owner,n){if(n.tag!==1)throw Error(k(309));var r=n.stateNode}if(!r)throw Error(k(147,e));var l=r,i=""+e;return t!==null&&t.ref!==null&&typeof t.ref=="function"&&t.ref._stringRef===i?t.ref:(t=function(o){var a=l.refs;o===null?delete a[i]:a[i]=o},t._stringRef=i,t)}if(typeof e!="string")throw Error(k(284));if(!n._owner)throw Error(k(290,e))}return e}function Ar(e,t){throw e=Object.prototype.toString.call(t),Error(k(31,e==="[object Object]"?"object with keys {"+Object.keys(t).join(", ")+"}":e))}function Ka(e){var t=e._init;return t(e._payload)}function Ou(e){function t(p,d){if(e){var f=p.deletions;f===null?(p.deletions=[d],p.flags|=16):f.push(d)}}function n(p,d){if(!e)return null;for(;d!==null;)t(p,d),d=d.sibling;return null}function r(p,d){for(p=new Map;d!==null;)d.key!==null?p.set(d.key,d):p.set(d.index,d),d=d.sibling;return p}function l(p,d){return p=Ct(p,d),p.index=0,p.sibling=null,p}function i(p,d,f){return p.index=f,e?(f=p.alternate,f!==null?(f=f.index,f<d?(p.flags|=2,d):f):(p.flags|=2,d)):(p.flags|=1048576,d)}function o(p){return e&&p.alternate===null&&(p.flags|=2),p}function a(p,d,f,y){return d===null||d.tag!==6?(d=hi(f,p.mode,y),d.return=p,d):(d=l(d,f),d.return=p,d)}function u(p,d,f,y){var _=f.type;return _===Xt?g(p,d,f.props.children,y,f.key):d!==null&&(d.elementType===_||typeof _=="object"&&_!==null&&_.$$typeof===dt&&Ka(_)===d.type)?(y=l(d,f.props),y.ref=Dn(p,d,f),y.return=p,y):(y=qr(f.type,f.key,f.props,null,p.mode,y),y.ref=Dn(p,d,f),y.return=p,y)}function c(p,d,f,y){return d===null||d.tag!==4||d.stateNode.containerInfo!==f.containerInfo||d.stateNode.implementation!==f.implementation?(d=vi(f,p.mode,y),d.return=p,d):(d=l(d,f.children||[]),d.return=p,d)}function g(p,d,f,y,_){return d===null||d.tag!==7?(d=Ft(f,p.mode,y,_),d.return=p,d):(d=l(d,f),d.return=p,d)}function m(p,d,f){if(typeof d=="string"&&d!==""||typeof d=="number")return d=hi(""+d,p.mode,f),d.return=p,d;if(typeof d=="object"&&d!==null){switch(d.$$typeof){case Nr:return f=qr(d.type,d.key,d.props,null,p.mode,f),f.ref=Dn(p,null,d),f.return=p,f;case Kt:return d=vi(d,p.mode,f),d.return=p,d;case dt:var y=d._init;return m(p,y(d._payload),f)}if(Fn(d)||Tn(d))return d=Ft(d,p.mode,f,null),d.return=p,d;Ar(p,d)}return null}function h(p,d,f,y){var _=d!==null?d.key:null;if(typeof f=="string"&&f!==""||typeof f=="number")return _!==null?null:a(p,d,""+f,y);if(typeof f=="object"&&f!==null){switch(f.$$typeof){case Nr:return f.key===_?u(p,d,f,y):null;case Kt:return f.key===_?c(p,d,f,y):null;case dt:return _=f._init,h(p,d,_(f._payload),y)}if(Fn(f)||Tn(f))return _!==null?null:g(p,d,f,y,null);Ar(p,f)}return null}function v(p,d,f,y,_){if(typeof y=="string"&&y!==""||typeof y=="number")return p=p.get(f)||null,a(d,p,""+y,_);if(typeof y=="object"&&y!==null){switch(y.$$typeof){case Nr:return p=p.get(y.key===null?f:y.key)||null,u(d,p,y,_);case Kt:return p=p.get(y.key===null?f:y.key)||null,c(d,p,y,_);case dt:var S=y._init;return v(p,d,f,S(y._payload),_)}if(Fn(y)||Tn(y))return p=p.get(f)||null,g(d,p,y,_,null);Ar(d,y)}return null}function x(p,d,f,y){for(var _=null,S=null,E=d,j=d=0,F=null;E!==null&&j<f.length;j++){E.index>j?(F=E,E=null):F=E.sibling;var P=h(p,E,f[j],y);if(P===null){E===null&&(E=F);break}e&&E&&P.alternate===null&&t(p,E),d=i(P,d,j),S===null?_=P:S.sibling=P,S=P,E=F}if(j===f.length)return n(p,E),W&&zt(p,j),_;if(E===null){for(;j<f.length;j++)E=m(p,f[j],y),E!==null&&(d=i(E,d,j),S===null?_=E:S.sibling=E,S=E);return W&&zt(p,j),_}for(E=r(p,E);j<f.length;j++)F=v(E,p,j,f[j],y),F!==null&&(e&&F.alternate!==null&&E.delete(F.key===null?j:F.key),d=i(F,d,j),S===null?_=F:S.sibling=F,S=F);return e&&E.forEach(function(pe){return t(p,pe)}),W&&zt(p,j),_}function w(p,d,f,y){var _=Tn(f);if(typeof _!="function")throw Error(k(150));if(f=_.call(f),f==null)throw Error(k(151));for(var S=_=null,E=d,j=d=0,F=null,P=f.next();E!==null&&!P.done;j++,P=f.next()){E.index>j?(F=E,E=null):F=E.sibling;var pe=h(p,E,P.value,y);if(pe===null){E===null&&(E=F);break}e&&E&&pe.alternate===null&&t(p,E),d=i(pe,d,j),S===null?_=pe:S.sibling=pe,S=pe,E=F}if(P.done)return n(p,E),W&&zt(p,j),_;if(E===null){for(;!P.done;j++,P=f.next())P=m(p,P.value,y),P!==null&&(d=i(P,d,j),S===null?_=P:S.sibling=P,S=P);return W&&zt(p,j),_}for(E=r(p,E);!P.done;j++,P=f.next())P=v(E,p,j,P.value,y),P!==null&&(e&&P.alternate!==null&&E.delete(P.key===null?j:P.key),d=i(P,d,j),S===null?_=P:S.sibling=P,S=P);return e&&E.forEach(function(M){return t(p,M)}),W&&zt(p,j),_}function D(p,d,f,y){if(typeof f=="object"&&f!==null&&f.type===Xt&&f.key===null&&(f=f.props.children),typeof f=="object"&&f!==null){switch(f.$$typeof){case Nr:e:{for(var _=f.key,S=d;S!==null;){if(S.key===_){if(_=f.type,_===Xt){if(S.tag===7){n(p,S.sibling),d=l(S,f.props.children),d.return=p,p=d;break e}}else if(S.elementType===_||typeof _=="object"&&_!==null&&_.$$typeof===dt&&Ka(_)===S.type){n(p,S.sibling),d=l(S,f.props),d.ref=Dn(p,S,f),d.return=p,p=d;break e}n(p,S);break}else t(p,S);S=S.sibling}f.type===Xt?(d=Ft(f.props.children,p.mode,y,f.key),d.return=p,p=d):(y=qr(f.type,f.key,f.props,null,p.mode,y),y.ref=Dn(p,d,f),y.return=p,p=y)}return o(p);case Kt:e:{for(S=f.key;d!==null;){if(d.key===S)if(d.tag===4&&d.stateNode.containerInfo===f.containerInfo&&d.stateNode.implementation===f.implementation){n(p,d.sibling),d=l(d,f.children||[]),d.return=p,p=d;break e}else{n(p,d);break}else t(p,d);d=d.sibling}d=vi(f,p.mode,y),d.return=p,p=d}return o(p);case dt:return S=f._init,D(p,d,S(f._payload),y)}if(Fn(f))return x(p,d,f,y);if(Tn(f))return w(p,d,f,y);Ar(p,f)}return typeof f=="string"&&f!==""||typeof f=="number"?(f=""+f,d!==null&&d.tag===6?(n(p,d.sibling),d=l(d,f),d.return=p,p=d):(n(p,d),d=hi(f,p.mode,y),d.return=p,p=d),o(p)):n(p,d)}return D}var hn=Ou(!0),Fu=Ou(!1),gl=Rt(null),ml=null,rn=null,Oo=null;function Fo(){Oo=rn=ml=null}function $o(e){var t=gl.current;B(gl),e._currentValue=t}function Gi(e,t,n){for(;e!==null;){var r=e.alternate;if((e.childLanes&t)!==t?(e.childLanes|=t,r!==null&&(r.childLanes|=t)):r!==null&&(r.childLanes&t)!==t&&(r.childLanes|=t),e===n)break;e=e.return}}function dn(e,t){ml=e,Oo=rn=null,e=e.dependencies,e!==null&&e.firstContext!==null&&(e.lanes&t&&(xe=!0),e.firstContext=null)}function Me(e){var t=e._currentValue;if(Oo!==e)if(e={context:e,memoizedValue:t,next:null},rn===null){if(ml===null)throw Error(k(308));rn=e,ml.dependencies={lanes:0,firstContext:e}}else rn=rn.next=e;return t}var At=null;function Uo(e){At===null?At=[e]:At.push(e)}function $u(e,t,n,r){var l=t.interleaved;return l===null?(n.next=n,Uo(t)):(n.next=l.next,l.next=n),t.interleaved=n,at(e,r)}function at(e,t){e.lanes|=t;var n=e.alternate;for(n!==null&&(n.lanes|=t),n=e,e=e.return;e!==null;)e.childLanes|=t,n=e.alternate,n!==null&&(n.childLanes|=t),n=e,e=e.return;return n.tag===3?n.stateNode:null}var ft=!1;function Bo(e){e.updateQueue={baseState:e.memoizedState,firstBaseUpdate:null,lastBaseUpdate:null,shared:{pending:null,interleaved:null,lanes:0},effects:null}}function Uu(e,t){e=e.updateQueue,t.updateQueue===e&&(t.updateQueue={baseState:e.baseState,firstBaseUpdate:e.firstBaseUpdate,lastBaseUpdate:e.lastBaseUpdate,shared:e.shared,effects:e.effects})}function lt(e,t){return{eventTime:e,lane:t,tag:0,payload:null,callback:null,next:null}}function kt(e,t,n){var r=e.updateQueue;if(r===null)return null;if(r=r.shared,I&2){var l=r.pending;return l===null?t.next=t:(t.next=l.next,l.next=t),r.pending=t,at(e,n)}return l=r.interleaved,l===null?(t.next=t,Uo(r)):(t.next=l.next,l.next=t),r.interleaved=t,at(e,n)}function Yr(e,t,n){if(t=t.updateQueue,t!==null&&(t=t.shared,(n&4194240)!==0)){var r=t.lanes;r&=e.pendingLanes,n|=r,t.lanes=n,jo(e,n)}}function Xa(e,t){var n=e.updateQueue,r=e.alternate;if(r!==null&&(r=r.updateQueue,n===r)){var l=null,i=null;if(n=n.firstBaseUpdate,n!==null){do{var o={eventTime:n.eventTime,lane:n.lane,tag:n.tag,payload:n.payload,callback:n.callback,next:null};i===null?l=i=o:i=i.next=o,n=n.next}while(n!==null);i===null?l=i=t:i=i.next=t}else l=i=t;n={baseState:r.baseState,firstBaseUpdate:l,lastBaseUpdate:i,shared:r.shared,effects:r.effects},e.updateQueue=n;return}e=n.lastBaseUpdate,e===null?n.firstBaseUpdate=t:e.next=t,n.lastBaseUpdate=t}function hl(e,t,n,r){var l=e.updateQueue;ft=!1;var i=l.firstBaseUpdate,o=l.lastBaseUpdate,a=l.shared.pending;if(a!==null){l.shared.pending=null;var u=a,c=u.next;u.next=null,o===null?i=c:o.next=c,o=u;var g=e.alternate;g!==null&&(g=g.updateQueue,a=g.lastBaseUpdate,a!==o&&(a===null?g.firstBaseUpdate=c:a.next=c,g.lastBaseUpdate=u))}if(i!==null){var m=l.baseState;o=0,g=c=u=null,a=i;do{var h=a.lane,v=a.eventTime;if((r&h)===h){g!==null&&(g=g.next={eventTime:v,lane:0,tag:a.tag,payload:a.payload,callback:a.callback,next:null});e:{var x=e,w=a;switch(h=t,v=n,w.tag){case 1:if(x=w.payload,typeof x=="function"){m=x.call(v,m,h);break e}m=x;break e;case 3:x.flags=x.flags&-65537|128;case 0:if(x=w.payload,h=typeof x=="function"?x.call(v,m,h):x,h==null)break e;m=Y({},m,h);break e;case 2:ft=!0}}a.callback!==null&&a.lane!==0&&(e.flags|=64,h=l.effects,h===null?l.effects=[a]:h.push(a))}else v={eventTime:v,lane:h,tag:a.tag,payload:a.payload,callback:a.callback,next:null},g===null?(c=g=v,u=m):g=g.next=v,o|=h;if(a=a.next,a===null){if(a=l.shared.pending,a===null)break;h=a,a=h.next,h.next=null,l.lastBaseUpdate=h,l.shared.pending=null}}while(!0);if(g===null&&(u=m),l.baseState=u,l.firstBaseUpdate=c,l.lastBaseUpdate=g,t=l.shared.interleaved,t!==null){l=t;do o|=l.lane,l=l.next;while(l!==t)}else i===null&&(l.shared.lanes=0);Wt|=o,e.lanes=o,e.memoizedState=m}}function Ga(e,t,n){if(e=t.effects,t.effects=null,e!==null)for(t=0;t<e.length;t++){var r=e[t],l=r.callback;if(l!==null){if(r.callback=null,r=n,typeof l!="function")throw Error(k(191,l));l.call(r)}}}var wr={},Je=Rt(wr),sr=Rt(wr),ur=Rt(wr);function Mt(e){if(e===wr)throw Error(k(174));return e}function Wo(e,t){switch($(ur,t),$(sr,e),$(Je,wr),e=t.nodeType,e){case 9:case 11:t=(t=t.documentElement)?t.namespaceURI:bi(null,"");break;default:e=e===8?t.parentNode:t,t=e.namespaceURI||null,e=e.tagName,t=bi(t,e)}B(Je),$(Je,t)}function vn(){B(Je),B(sr),B(ur)}function Bu(e){Mt(ur.current);var t=Mt(Je.current),n=bi(t,e.type);t!==n&&($(sr,e),$(Je,n))}function Vo(e){sr.current===e&&(B(Je),B(sr))}var H=Rt(0);function vl(e){for(var t=e;t!==null;){if(t.tag===13){var n=t.memoizedState;if(n!==null&&(n=n.dehydrated,n===null||n.data==="$?"||n.data==="$!"))return t}else if(t.tag===19&&t.memoizedProps.revealOrder!==void 0){if(t.flags&128)return t}else if(t.child!==null){t.child.return=t,t=t.child;continue}if(t===e)break;for(;t.sibling===null;){if(t.return===null||t.return===e)return null;t=t.return}t.sibling.return=t.return,t=t.sibling}return null}var ci=[];function Ho(){for(var e=0;e<ci.length;e++)ci[e]._workInProgressVersionPrimary=null;ci.length=0}var Kr=ut.ReactCurrentDispatcher,di=ut.ReactCurrentBatchConfig,Bt=0,Q=null,q=null,re=null,yl=!1,Yn=!1,cr=0,Wf=0;function ue(){throw Error(k(321))}function Qo(e,t){if(t===null)return!1;for(var n=0;n<t.length&&n<e.length;n++)if(!Qe(e[n],t[n]))return!1;return!0}function Yo(e,t,n,r,l,i){if(Bt=i,Q=t,t.memoizedState=null,t.updateQueue=null,t.lanes=0,Kr.current=e===null||e.memoizedState===null?Yf:Kf,e=n(r,l),Yn){i=0;do{if(Yn=!1,cr=0,25<=i)throw Error(k(301));i+=1,re=q=null,t.updateQueue=null,Kr.current=Xf,e=n(r,l)}while(Yn)}if(Kr.current=xl,t=q!==null&&q.next!==null,Bt=0,re=q=Q=null,yl=!1,t)throw Error(k(300));return e}function Ko(){var e=cr!==0;return cr=0,e}function Xe(){var e={memoizedState:null,baseState:null,baseQueue:null,queue:null,next:null};return re===null?Q.memoizedState=re=e:re=re.next=e,re}function Oe(){if(q===null){var e=Q.alternate;e=e!==null?e.memoizedState:null}else e=q.next;var t=re===null?Q.memoizedState:re.next;if(t!==null)re=t,q=e;else{if(e===null)throw Error(k(310));q=e,e={memoizedState:q.memoizedState,baseState:q.baseState,baseQueue:q.baseQueue,queue:q.queue,next:null},re===null?Q.memoizedState=re=e:re=re.next=e}return re}function dr(e,t){return typeof t=="function"?t(e):t}function fi(e){var t=Oe(),n=t.queue;if(n===null)throw Error(k(311));n.lastRenderedReducer=e;var r=q,l=r.baseQueue,i=n.pending;if(i!==null){if(l!==null){var o=l.next;l.next=i.next,i.next=o}r.baseQueue=l=i,n.pending=null}if(l!==null){i=l.next,r=r.baseState;var a=o=null,u=null,c=i;do{var g=c.lane;if((Bt&g)===g)u!==null&&(u=u.next={lane:0,action:c.action,hasEagerState:c.hasEagerState,eagerState:c.eagerState,next:null}),r=c.hasEagerState?c.eagerState:e(r,c.action);else{var m={lane:g,action:c.action,hasEagerState:c.hasEagerState,eagerState:c.eagerState,next:null};u===null?(a=u=m,o=r):u=u.next=m,Q.lanes|=g,Wt|=g}c=c.next}while(c!==null&&c!==i);u===null?o=r:u.next=a,Qe(r,t.memoizedState)||(xe=!0),t.memoizedState=r,t.baseState=o,t.baseQueue=u,n.lastRenderedState=r}if(e=n.interleaved,e!==null){l=e;do i=l.lane,Q.lanes|=i,Wt|=i,l=l.next;while(l!==e)}else l===null&&(n.lanes=0);return[t.memoizedState,n.dispatch]}function pi(e){var t=Oe(),n=t.queue;if(n===null)throw Error(k(311));n.lastRenderedReducer=e;var r=n.dispatch,l=n.pending,i=t.memoizedState;if(l!==null){n.pending=null;var o=l=l.next;do i=e(i,o.action),o=o.next;while(o!==l);Qe(i,t.memoizedState)||(xe=!0),t.memoizedState=i,t.baseQueue===null&&(t.baseState=i),n.lastRenderedState=i}return[i,r]}function Wu(){}function Vu(e,t){var n=Q,r=Oe(),l=t(),i=!Qe(r.memoizedState,l);if(i&&(r.memoizedState=l,xe=!0),r=r.queue,Xo(Yu.bind(null,n,r,e),[e]),r.getSnapshot!==t||i||re!==null&&re.memoizedState.tag&1){if(n.flags|=2048,fr(9,Qu.bind(null,n,r,l,t),void 0,null),le===null)throw Error(k(349));Bt&30||Hu(n,t,l)}return l}function Hu(e,t,n){e.flags|=16384,e={getSnapshot:t,value:n},t=Q.updateQueue,t===null?(t={lastEffect:null,stores:null},Q.updateQueue=t,t.stores=[e]):(n=t.stores,n===null?t.stores=[e]:n.push(e))}function Qu(e,t,n,r){t.value=n,t.getSnapshot=r,Ku(t)&&Xu(e)}function Yu(e,t,n){return n(function(){Ku(t)&&Xu(e)})}function Ku(e){var t=e.getSnapshot;e=e.value;try{var n=t();return!Qe(e,n)}catch{return!0}}function Xu(e){var t=at(e,1);t!==null&&He(t,e,1,-1)}function Za(e){var t=Xe();return typeof e=="function"&&(e=e()),t.memoizedState=t.baseState=e,e={pending:null,interleaved:null,lanes:0,dispatch:null,lastRenderedReducer:dr,lastRenderedState:e},t.queue=e,e=e.dispatch=Qf.bind(null,Q,e),[t.memoizedState,e]}function fr(e,t,n,r){return e={tag:e,create:t,destroy:n,deps:r,next:null},t=Q.updateQueue,t===null?(t={lastEffect:null,stores:null},Q.updateQueue=t,t.lastEffect=e.next=e):(n=t.lastEffect,n===null?t.lastEffect=e.next=e:(r=n.next,n.next=e,e.next=r,t.lastEffect=e)),e}function Gu(){return Oe().memoizedState}function Xr(e,t,n,r){var l=Xe();Q.flags|=e,l.memoizedState=fr(1|t,n,void 0,r===void 0?null:r)}function Ll(e,t,n,r){var l=Oe();r=r===void 0?null:r;var i=void 0;if(q!==null){var o=q.memoizedState;if(i=o.destroy,r!==null&&Qo(r,o.deps)){l.memoizedState=fr(t,n,i,r);return}}Q.flags|=e,l.memoizedState=fr(1|t,n,i,r)}function Ja(e,t){return Xr(8390656,8,e,t)}function Xo(e,t){return Ll(2048,8,e,t)}function Zu(e,t){return Ll(4,2,e,t)}function Ju(e,t){return Ll(4,4,e,t)}function qu(e,t){if(typeof t=="function")return e=e(),t(e),function(){t(null)};if(t!=null)return e=e(),t.current=e,function(){t.current=null}}function ec(e,t,n){return n=n!=null?n.concat([e]):null,Ll(4,4,qu.bind(null,t,e),n)}function Go(){}function tc(e,t){var n=Oe();t=t===void 0?null:t;var r=n.memoizedState;return r!==null&&t!==null&&Qo(t,r[1])?r[0]:(n.memoizedState=[e,t],e)}function nc(e,t){var n=Oe();t=t===void 0?null:t;var r=n.memoizedState;return r!==null&&t!==null&&Qo(t,r[1])?r[0]:(e=e(),n.memoizedState=[e,t],e)}function rc(e,t,n){return Bt&21?(Qe(n,t)||(n=su(),Q.lanes|=n,Wt|=n,e.baseState=!0),t):(e.baseState&&(e.baseState=!1,xe=!0),e.memoizedState=n)}function Vf(e,t){var n=A;A=n!==0&&4>n?n:4,e(!0);var r=di.transition;di.transition={};try{e(!1),t()}finally{A=n,di.transition=r}}function lc(){return Oe().memoizedState}function Hf(e,t,n){var r=St(e);if(n={lane:r,action:n,hasEagerState:!1,eagerState:null,next:null},ic(e))oc(t,n);else if(n=$u(e,t,n,r),n!==null){var l=me();He(n,e,r,l),ac(n,t,r)}}function Qf(e,t,n){var r=St(e),l={lane:r,action:n,hasEagerState:!1,eagerState:null,next:null};if(ic(e))oc(t,l);else{var i=e.alternate;if(e.lanes===0&&(i===null||i.lanes===0)&&(i=t.lastRenderedReducer,i!==null))try{var o=t.lastRenderedState,a=i(o,n);if(l.hasEagerState=!0,l.eagerState=a,Qe(a,o)){var u=t.interleaved;u===null?(l.next=l,Uo(t)):(l.next=u.next,u.next=l),t.interleaved=l;return}}catch{}finally{}n=$u(e,t,l,r),n!==null&&(l=me(),He(n,e,r,l),ac(n,t,r))}}function ic(e){var t=e.alternate;return e===Q||t!==null&&t===Q}function oc(e,t){Yn=yl=!0;var n=e.pending;n===null?t.next=t:(t.next=n.next,n.next=t),e.pending=t}function ac(e,t,n){if(n&4194240){var r=t.lanes;r&=e.pendingLanes,n|=r,t.lanes=n,jo(e,n)}}var xl={readContext:Me,useCallback:ue,useContext:ue,useEffect:ue,useImperativeHandle:ue,useInsertionEffect:ue,useLayoutEffect:ue,useMemo:ue,useReducer:ue,useRef:ue,useState:ue,useDebugValue:ue,useDeferredValue:ue,useTransition:ue,useMutableSource:ue,useSyncExternalStore:ue,useId:ue,unstable_isNewReconciler:!1},Yf={readContext:Me,useCallback:function(e,t){return Xe().memoizedState=[e,t===void 0?null:t],e},useContext:Me,useEffect:Ja,useImperativeHandle:function(e,t,n){return n=n!=null?n.concat([e]):null,Xr(4194308,4,qu.bind(null,t,e),n)},useLayoutEffect:function(e,t){return Xr(4194308,4,e,t)},useInsertionEffect:function(e,t){return Xr(4,2,e,t)},useMemo:function(e,t){var n=Xe();return t=t===void 0?null:t,e=e(),n.memoizedState=[e,t],e},useReducer:function(e,t,n){var r=Xe();return t=n!==void 0?n(t):t,r.memoizedState=r.baseState=t,e={pending:null,interleaved:null,lanes:0,dispatch:null,lastRenderedReducer:e,lastRenderedState:t},r.queue=e,e=e.dispatch=Hf.bind(null,Q,e),[r.memoizedState,e]},useRef:function(e){var t=Xe();return e={current:e},t.memoizedState=e},useState:Za,useDebugValue:Go,useDeferredValue:function(e){return Xe().memoizedState=e},useTransition:function(){var e=Za(!1),t=e[0];return e=Vf.bind(null,e[1]),Xe().memoizedState=e,[t,e]},useMutableSource:function(){},useSyncExternalStore:function(e,t,n){var r=Q,l=Xe();if(W){if(n===void 0)throw Error(k(407));n=n()}else{if(n=t(),le===null)throw Error(k(349));Bt&30||Hu(r,t,n)}l.memoizedState=n;var i={value:n,getSnapshot:t};return l.queue=i,Ja(Yu.bind(null,r,i,e),[e]),r.flags|=2048,fr(9,Qu.bind(null,r,i,n,t),void 0,null),n},useId:function(){var e=Xe(),t=le.identifierPrefix;if(W){var n=rt,r=nt;n=(r&~(1<<32-Ve(r)-1)).toString(32)+n,t=":"+t+"R"+n,n=cr++,0<n&&(t+="H"+n.toString(32)),t+=":"}else n=Wf++,t=":"+t+"r"+n.toString(32)+":";return e.memoizedState=t},unstable_isNewReconciler:!1},Kf={readContext:Me,useCallback:tc,useContext:Me,useEffect:Xo,useImperativeHandle:ec,useInsertionEffect:Zu,useLayoutEffect:Ju,useMemo:nc,useReducer:fi,useRef:Gu,useState:function(){return fi(dr)},useDebugValue:Go,useDeferredValue:function(e){var t=Oe();return rc(t,q.memoizedState,e)},useTransition:function(){var e=fi(dr)[0],t=Oe().memoizedState;return[e,t]},useMutableSource:Wu,useSyncExternalStore:Vu,useId:lc,unstable_isNewReconciler:!1},Xf={readContext:Me,useCallback:tc,useContext:Me,useEffect:Xo,useImperativeHandle:ec,useInsertionEffect:Zu,useLayoutEffect:Ju,useMemo:nc,useReducer:pi,useRef:Gu,useState:function(){return pi(dr)},useDebugValue:Go,useDeferredValue:function(e){var t=Oe();return q===null?t.memoizedState=e:rc(t,q.memoizedState,e)},useTransition:function(){var e=pi(dr)[0],t=Oe().memoizedState;return[e,t]},useMutableSource:Wu,useSyncExternalStore:Vu,useId:lc,unstable_isNewReconciler:!1};function Ue(e,t){if(e&&e.defaultProps){t=Y({},t),e=e.defaultProps;for(var n in e)t[n]===void 0&&(t[n]=e[n]);return t}return t}function Zi(e,t,n,r){t=e.memoizedState,n=n(r,t),n=n==null?t:Y({},t,n),e.memoizedState=n,e.lanes===0&&(e.updateQueue.baseState=n)}var Dl={isMounted:function(e){return(e=e._reactInternals)?Qt(e)===e:!1},enqueueSetState:function(e,t,n){e=e._reactInternals;var r=me(),l=St(e),i=lt(r,l);i.payload=t,n!=null&&(i.callback=n),t=kt(e,i,l),t!==null&&(He(t,e,l,r),Yr(t,e,l))},enqueueReplaceState:function(e,t,n){e=e._reactInternals;var r=me(),l=St(e),i=lt(r,l);i.tag=1,i.payload=t,n!=null&&(i.callback=n),t=kt(e,i,l),t!==null&&(He(t,e,l,r),Yr(t,e,l))},enqueueForceUpdate:function(e,t){e=e._reactInternals;var n=me(),r=St(e),l=lt(n,r);l.tag=2,t!=null&&(l.callback=t),t=kt(e,l,r),t!==null&&(He(t,e,r,n),Yr(t,e,r))}};function qa(e,t,n,r,l,i,o){return e=e.stateNode,typeof e.shouldComponentUpdate=="function"?e.shouldComponentUpdate(r,i,o):t.prototype&&t.prototype.isPureReactComponent?!lr(n,r)||!lr(l,i):!0}function sc(e,t,n){var r=!1,l=Et,i=t.contextType;return typeof i=="object"&&i!==null?i=Me(i):(l=ke(t)?$t:fe.current,r=t.contextTypes,i=(r=r!=null)?gn(e,l):Et),t=new t(n,i),e.memoizedState=t.state!==null&&t.state!==void 0?t.state:null,t.updater=Dl,e.stateNode=t,t._reactInternals=e,r&&(e=e.stateNode,e.__reactInternalMemoizedUnmaskedChildContext=l,e.__reactInternalMemoizedMaskedChildContext=i),t}function es(e,t,n,r){e=t.state,typeof t.componentWillReceiveProps=="function"&&t.componentWillReceiveProps(n,r),typeof t.UNSAFE_componentWillReceiveProps=="function"&&t.UNSAFE_componentWillReceiveProps(n,r),t.state!==e&&Dl.enqueueReplaceState(t,t.state,null)}function Ji(e,t,n,r){var l=e.stateNode;l.props=n,l.state=e.memoizedState,l.refs={},Bo(e);var i=t.contextType;typeof i=="object"&&i!==null?l.context=Me(i):(i=ke(t)?$t:fe.current,l.context=gn(e,i)),l.state=e.memoizedState,i=t.getDerivedStateFromProps,typeof i=="function"&&(Zi(e,t,i,n),l.state=e.memoizedState),typeof t.getDerivedStateFromProps=="function"||typeof l.getSnapshotBeforeUpdate=="function"||typeof l.UNSAFE_componentWillMount!="function"&&typeof l.componentWillMount!="function"||(t=l.state,typeof l.componentWillMount=="function"&&l.componentWillMount(),typeof l.UNSAFE_componentWillMount=="function"&&l.UNSAFE_componentWillMount(),t!==l.state&&Dl.enqueueReplaceState(l,l.state,null),hl(e,n,l,r),l.state=e.memoizedState),typeof l.componentDidMount=="function"&&(e.flags|=4194308)}function yn(e,t){try{var n="",r=t;do n+=_d(r),r=r.return;while(r);var l=n}catch(i){l=`
Error generating stack: `+i.message+`
`+i.stack}return{value:e,source:t,stack:l,digest:null}}function gi(e,t,n){return{value:e,source:null,stack:n??null,digest:t??null}}function qi(e,t){try{console.error(t.value)}catch(n){setTimeout(function(){throw n})}}var Gf=typeof WeakMap=="function"?WeakMap:Map;function uc(e,t,n){n=lt(-1,n),n.tag=3,n.payload={element:null};var r=t.value;return n.callback=function(){kl||(kl=!0,uo=r),qi(e,t)},n}function cc(e,t,n){n=lt(-1,n),n.tag=3;var r=e.type.getDerivedStateFromError;if(typeof r=="function"){var l=t.value;n.payload=function(){return r(l)},n.callback=function(){qi(e,t)}}var i=e.stateNode;return i!==null&&typeof i.componentDidCatch=="function"&&(n.callback=function(){qi(e,t),typeof r!="function"&&(_t===null?_t=new Set([this]):_t.add(this));var o=t.stack;this.componentDidCatch(t.value,{componentStack:o!==null?o:""})}),n}function ts(e,t,n){var r=e.pingCache;if(r===null){r=e.pingCache=new Gf;var l=new Set;r.set(t,l)}else l=r.get(t),l===void 0&&(l=new Set,r.set(t,l));l.has(n)||(l.add(n),e=cp.bind(null,e,t,n),t.then(e,e))}function ns(e){do{var t;if((t=e.tag===13)&&(t=e.memoizedState,t=t!==null?t.dehydrated!==null:!0),t)return e;e=e.return}while(e!==null);return null}function rs(e,t,n,r,l){return e.mode&1?(e.flags|=65536,e.lanes=l,e):(e===t?e.flags|=65536:(e.flags|=128,n.flags|=131072,n.flags&=-52805,n.tag===1&&(n.alternate===null?n.tag=17:(t=lt(-1,1),t.tag=2,kt(n,t,1))),n.lanes|=1),e)}var Zf=ut.ReactCurrentOwner,xe=!1;function ge(e,t,n,r){t.child=e===null?Fu(t,null,n,r):hn(t,e.child,n,r)}function ls(e,t,n,r,l){n=n.render;var i=t.ref;return dn(t,l),r=Yo(e,t,n,r,i,l),n=Ko(),e!==null&&!xe?(t.updateQueue=e.updateQueue,t.flags&=-2053,e.lanes&=~l,st(e,t,l)):(W&&n&&Io(t),t.flags|=1,ge(e,t,r,l),t.child)}function is(e,t,n,r,l){if(e===null){var i=n.type;return typeof i=="function"&&!la(i)&&i.defaultProps===void 0&&n.compare===null&&n.defaultProps===void 0?(t.tag=15,t.type=i,dc(e,t,i,r,l)):(e=qr(n.type,null,r,t,t.mode,l),e.ref=t.ref,e.return=t,t.child=e)}if(i=e.child,!(e.lanes&l)){var o=i.memoizedProps;if(n=n.compare,n=n!==null?n:lr,n(o,r)&&e.ref===t.ref)return st(e,t,l)}return t.flags|=1,e=Ct(i,r),e.ref=t.ref,e.return=t,t.child=e}function dc(e,t,n,r,l){if(e!==null){var i=e.memoizedProps;if(lr(i,r)&&e.ref===t.ref)if(xe=!1,t.pendingProps=r=i,(e.lanes&l)!==0)e.flags&131072&&(xe=!0);else return t.lanes=e.lanes,st(e,t,l)}return eo(e,t,n,r,l)}function fc(e,t,n){var r=t.pendingProps,l=r.children,i=e!==null?e.memoizedState:null;if(r.mode==="hidden")if(!(t.mode&1))t.memoizedState={baseLanes:0,cachePool:null,transitions:null},$(on,Se),Se|=n;else{if(!(n&1073741824))return e=i!==null?i.baseLanes|n:n,t.lanes=t.childLanes=1073741824,t.memoizedState={baseLanes:e,cachePool:null,transitions:null},t.updateQueue=null,$(on,Se),Se|=e,null;t.memoizedState={baseLanes:0,cachePool:null,transitions:null},r=i!==null?i.baseLanes:n,$(on,Se),Se|=r}else i!==null?(r=i.baseLanes|n,t.memoizedState=null):r=n,$(on,Se),Se|=r;return ge(e,t,l,n),t.child}function pc(e,t){var n=t.ref;(e===null&&n!==null||e!==null&&e.ref!==n)&&(t.flags|=512,t.flags|=2097152)}function eo(e,t,n,r,l){var i=ke(n)?$t:fe.current;return i=gn(t,i),dn(t,l),n=Yo(e,t,n,r,i,l),r=Ko(),e!==null&&!xe?(t.updateQueue=e.updateQueue,t.flags&=-2053,e.lanes&=~l,st(e,t,l)):(W&&r&&Io(t),t.flags|=1,ge(e,t,n,l),t.child)}function os(e,t,n,r,l){if(ke(n)){var i=!0;dl(t)}else i=!1;if(dn(t,l),t.stateNode===null)Gr(e,t),sc(t,n,r),Ji(t,n,r,l),r=!0;else if(e===null){var o=t.stateNode,a=t.memoizedProps;o.props=a;var u=o.context,c=n.contextType;typeof c=="object"&&c!==null?c=Me(c):(c=ke(n)?$t:fe.current,c=gn(t,c));var g=n.getDerivedStateFromProps,m=typeof g=="function"||typeof o.getSnapshotBeforeUpdate=="function";m||typeof o.UNSAFE_componentWillReceiveProps!="function"&&typeof o.componentWillReceiveProps!="function"||(a!==r||u!==c)&&es(t,o,r,c),ft=!1;var h=t.memoizedState;o.state=h,hl(t,r,o,l),u=t.memoizedState,a!==r||h!==u||we.current||ft?(typeof g=="function"&&(Zi(t,n,g,r),u=t.memoizedState),(a=ft||qa(t,n,a,r,h,u,c))?(m||typeof o.UNSAFE_componentWillMount!="function"&&typeof o.componentWillMount!="function"||(typeof o.componentWillMount=="function"&&o.componentWillMount(),typeof o.UNSAFE_componentWillMount=="function"&&o.UNSAFE_componentWillMount()),typeof o.componentDidMount=="function"&&(t.flags|=4194308)):(typeof o.componentDidMount=="function"&&(t.flags|=4194308),t.memoizedProps=r,t.memoizedState=u),o.props=r,o.state=u,o.context=c,r=a):(typeof o.componentDidMount=="function"&&(t.flags|=4194308),r=!1)}else{o=t.stateNode,Uu(e,t),a=t.memoizedProps,c=t.type===t.elementType?a:Ue(t.type,a),o.props=c,m=t.pendingProps,h=o.context,u=n.contextType,typeof u=="object"&&u!==null?u=Me(u):(u=ke(n)?$t:fe.current,u=gn(t,u));var v=n.getDerivedStateFromProps;(g=typeof v=="function"||typeof o.getSnapshotBeforeUpdate=="function")||typeof o.UNSAFE_componentWillReceiveProps!="function"&&typeof o.componentWillReceiveProps!="function"||(a!==m||h!==u)&&es(t,o,r,u),ft=!1,h=t.memoizedState,o.state=h,hl(t,r,o,l);var x=t.memoizedState;a!==m||h!==x||we.current||ft?(typeof v=="function"&&(Zi(t,n,v,r),x=t.memoizedState),(c=ft||qa(t,n,c,r,h,x,u)||!1)?(g||typeof o.UNSAFE_componentWillUpdate!="function"&&typeof o.componentWillUpdate!="function"||(typeof o.componentWillUpdate=="function"&&o.componentWillUpdate(r,x,u),typeof o.UNSAFE_componentWillUpdate=="function"&&o.UNSAFE_componentWillUpdate(r,x,u)),typeof o.componentDidUpdate=="function"&&(t.flags|=4),typeof o.getSnapshotBeforeUpdate=="function"&&(t.flags|=1024)):(typeof o.componentDidUpdate!="function"||a===e.memoizedProps&&h===e.memoizedState||(t.flags|=4),typeof o.getSnapshotBeforeUpdate!="function"||a===e.memoizedProps&&h===e.memoizedState||(t.flags|=1024),t.memoizedProps=r,t.memoizedState=x),o.props=r,o.state=x,o.context=u,r=c):(typeof o.componentDidUpdate!="function"||a===e.memoizedProps&&h===e.memoizedState||(t.flags|=4),typeof o.getSnapshotBeforeUpdate!="function"||a===e.memoizedProps&&h===e.memoizedState||(t.flags|=1024),r=!1)}return to(e,t,n,r,i,l)}function to(e,t,n,r,l,i){pc(e,t);var o=(t.flags&128)!==0;if(!r&&!o)return l&&Ha(t,n,!1),st(e,t,i);r=t.stateNode,Zf.current=t;var a=o&&typeof n.getDerivedStateFromError!="function"?null:r.render();return t.flags|=1,e!==null&&o?(t.child=hn(t,e.child,null,i),t.child=hn(t,null,a,i)):ge(e,t,a,i),t.memoizedState=r.state,l&&Ha(t,n,!0),t.child}function gc(e){var t=e.stateNode;t.pendingContext?Va(e,t.pendingContext,t.pendingContext!==t.context):t.context&&Va(e,t.context,!1),Wo(e,t.containerInfo)}function as(e,t,n,r,l){return mn(),Mo(l),t.flags|=256,ge(e,t,n,r),t.child}var no={dehydrated:null,treeContext:null,retryLane:0};function ro(e){return{baseLanes:e,cachePool:null,transitions:null}}function mc(e,t,n){var r=t.pendingProps,l=H.current,i=!1,o=(t.flags&128)!==0,a;if((a=o)||(a=e!==null&&e.memoizedState===null?!1:(l&2)!==0),a?(i=!0,t.flags&=-129):(e===null||e.memoizedState!==null)&&(l|=1),$(H,l&1),e===null)return Xi(t),e=t.memoizedState,e!==null&&(e=e.dehydrated,e!==null)?(t.mode&1?e.data==="$!"?t.lanes=8:t.lanes=1073741824:t.lanes=1,null):(o=r.children,e=r.fallback,i?(r=t.mode,i=t.child,o={mode:"hidden",children:o},!(r&1)&&i!==null?(i.childLanes=0,i.pendingProps=o):i=Ml(o,r,0,null),e=Ft(e,r,n,null),i.return=t,e.return=t,i.sibling=e,t.child=i,t.child.memoizedState=ro(n),t.memoizedState=no,e):Zo(t,o));if(l=e.memoizedState,l!==null&&(a=l.dehydrated,a!==null))return Jf(e,t,o,r,a,l,n);if(i){i=r.fallback,o=t.mode,l=e.child,a=l.sibling;var u={mode:"hidden",children:r.children};return!(o&1)&&t.child!==l?(r=t.child,r.childLanes=0,r.pendingProps=u,t.deletions=null):(r=Ct(l,u),r.subtreeFlags=l.subtreeFlags&14680064),a!==null?i=Ct(a,i):(i=Ft(i,o,n,null),i.flags|=2),i.return=t,r.return=t,r.sibling=i,t.child=r,r=i,i=t.child,o=e.child.memoizedState,o=o===null?ro(n):{baseLanes:o.baseLanes|n,cachePool:null,transitions:o.transitions},i.memoizedState=o,i.childLanes=e.childLanes&~n,t.memoizedState=no,r}return i=e.child,e=i.sibling,r=Ct(i,{mode:"visible",children:r.children}),!(t.mode&1)&&(r.lanes=n),r.return=t,r.sibling=null,e!==null&&(n=t.deletions,n===null?(t.deletions=[e],t.flags|=16):n.push(e)),t.child=r,t.memoizedState=null,r}function Zo(e,t){return t=Ml({mode:"visible",children:t},e.mode,0,null),t.return=e,e.child=t}function Mr(e,t,n,r){return r!==null&&Mo(r),hn(t,e.child,null,n),e=Zo(t,t.pendingProps.children),e.flags|=2,t.memoizedState=null,e}function Jf(e,t,n,r,l,i,o){if(n)return t.flags&256?(t.flags&=-257,r=gi(Error(k(422))),Mr(e,t,o,r)):t.memoizedState!==null?(t.child=e.child,t.flags|=128,null):(i=r.fallback,l=t.mode,r=Ml({mode:"visible",children:r.children},l,0,null),i=Ft(i,l,o,null),i.flags|=2,r.return=t,i.return=t,r.sibling=i,t.child=r,t.mode&1&&hn(t,e.child,null,o),t.child.memoizedState=ro(o),t.memoizedState=no,i);if(!(t.mode&1))return Mr(e,t,o,null);if(l.data==="$!"){if(r=l.nextSibling&&l.nextSibling.dataset,r)var a=r.dgst;return r=a,i=Error(k(419)),r=gi(i,r,void 0),Mr(e,t,o,r)}if(a=(o&e.childLanes)!==0,xe||a){if(r=le,r!==null){switch(o&-o){case 4:l=2;break;case 16:l=8;break;case 64:case 128:case 256:case 512:case 1024:case 2048:case 4096:case 8192:case 16384:case 32768:case 65536:case 131072:case 262144:case 524288:case 1048576:case 2097152:case 4194304:case 8388608:case 16777216:case 33554432:case 67108864:l=32;break;case 536870912:l=268435456;break;default:l=0}l=l&(r.suspendedLanes|o)?0:l,l!==0&&l!==i.retryLane&&(i.retryLane=l,at(e,l),He(r,e,l,-1))}return ra(),r=gi(Error(k(421))),Mr(e,t,o,r)}return l.data==="$?"?(t.flags|=128,t.child=e.child,t=dp.bind(null,e),l._reactRetry=t,null):(e=i.treeContext,Ce=wt(l.nextSibling),Ne=t,W=!0,We=null,e!==null&&(ze[Le++]=nt,ze[Le++]=rt,ze[Le++]=Ut,nt=e.id,rt=e.overflow,Ut=t),t=Zo(t,r.children),t.flags|=4096,t)}function ss(e,t,n){e.lanes|=t;var r=e.alternate;r!==null&&(r.lanes|=t),Gi(e.return,t,n)}function mi(e,t,n,r,l){var i=e.memoizedState;i===null?e.memoizedState={isBackwards:t,rendering:null,renderingStartTime:0,last:r,tail:n,tailMode:l}:(i.isBackwards=t,i.rendering=null,i.renderingStartTime=0,i.last=r,i.tail=n,i.tailMode=l)}function hc(e,t,n){var r=t.pendingProps,l=r.revealOrder,i=r.tail;if(ge(e,t,r.children,n),r=H.current,r&2)r=r&1|2,t.flags|=128;else{if(e!==null&&e.flags&128)e:for(e=t.child;e!==null;){if(e.tag===13)e.memoizedState!==null&&ss(e,n,t);else if(e.tag===19)ss(e,n,t);else if(e.child!==null){e.child.return=e,e=e.child;continue}if(e===t)break e;for(;e.sibling===null;){if(e.return===null||e.return===t)break e;e=e.return}e.sibling.return=e.return,e=e.sibling}r&=1}if($(H,r),!(t.mode&1))t.memoizedState=null;else switch(l){case"forwards":for(n=t.child,l=null;n!==null;)e=n.alternate,e!==null&&vl(e)===null&&(l=n),n=n.sibling;n=l,n===null?(l=t.child,t.child=null):(l=n.sibling,n.sibling=null),mi(t,!1,l,n,i);break;case"backwards":for(n=null,l=t.child,t.child=null;l!==null;){if(e=l.alternate,e!==null&&vl(e)===null){t.child=l;break}e=l.sibling,l.sibling=n,n=l,l=e}mi(t,!0,n,null,i);break;case"together":mi(t,!1,null,null,void 0);break;default:t.memoizedState=null}return t.child}function Gr(e,t){!(t.mode&1)&&e!==null&&(e.alternate=null,t.alternate=null,t.flags|=2)}function st(e,t,n){if(e!==null&&(t.dependencies=e.dependencies),Wt|=t.lanes,!(n&t.childLanes))return null;if(e!==null&&t.child!==e.child)throw Error(k(153));if(t.child!==null){for(e=t.child,n=Ct(e,e.pendingProps),t.child=n,n.return=t;e.sibling!==null;)e=e.sibling,n=n.sibling=Ct(e,e.pendingProps),n.return=t;n.sibling=null}return t.child}function qf(e,t,n){switch(t.tag){case 3:gc(t),mn();break;case 5:Bu(t);break;case 1:ke(t.type)&&dl(t);break;case 4:Wo(t,t.stateNode.containerInfo);break;case 10:var r=t.type._context,l=t.memoizedProps.value;$(gl,r._currentValue),r._currentValue=l;break;case 13:if(r=t.memoizedState,r!==null)return r.dehydrated!==null?($(H,H.current&1),t.flags|=128,null):n&t.child.childLanes?mc(e,t,n):($(H,H.current&1),e=st(e,t,n),e!==null?e.sibling:null);$(H,H.current&1);break;case 19:if(r=(n&t.childLanes)!==0,e.flags&128){if(r)return hc(e,t,n);t.flags|=128}if(l=t.memoizedState,l!==null&&(l.rendering=null,l.tail=null,l.lastEffect=null),$(H,H.current),r)break;return null;case 22:case 23:return t.lanes=0,fc(e,t,n)}return st(e,t,n)}var vc,lo,yc,xc;vc=function(e,t){for(var n=t.child;n!==null;){if(n.tag===5||n.tag===6)e.appendChild(n.stateNode);else if(n.tag!==4&&n.child!==null){n.child.return=n,n=n.child;continue}if(n===t)break;for(;n.sibling===null;){if(n.return===null||n.return===t)return;n=n.return}n.sibling.return=n.return,n=n.sibling}};lo=function(){};yc=function(e,t,n,r){var l=e.memoizedProps;if(l!==r){e=t.stateNode,Mt(Je.current);var i=null;switch(n){case"input":l=Ei(e,l),r=Ei(e,r),i=[];break;case"select":l=Y({},l,{value:void 0}),r=Y({},r,{value:void 0}),i=[];break;case"textarea":l=Ti(e,l),r=Ti(e,r),i=[];break;default:typeof l.onClick!="function"&&typeof r.onClick=="function"&&(e.onclick=ul)}Pi(n,r);var o;n=null;for(c in l)if(!r.hasOwnProperty(c)&&l.hasOwnProperty(c)&&l[c]!=null)if(c==="style"){var a=l[c];for(o in a)a.hasOwnProperty(o)&&(n||(n={}),n[o]="")}else c!=="dangerouslySetInnerHTML"&&c!=="children"&&c!=="suppressContentEditableWarning"&&c!=="suppressHydrationWarning"&&c!=="autoFocus"&&(Zn.hasOwnProperty(c)?i||(i=[]):(i=i||[]).push(c,null));for(c in r){var u=r[c];if(a=l!=null?l[c]:void 0,r.hasOwnProperty(c)&&u!==a&&(u!=null||a!=null))if(c==="style")if(a){for(o in a)!a.hasOwnProperty(o)||u&&u.hasOwnProperty(o)||(n||(n={}),n[o]="");for(o in u)u.hasOwnProperty(o)&&a[o]!==u[o]&&(n||(n={}),n[o]=u[o])}else n||(i||(i=[]),i.push(c,n)),n=u;else c==="dangerouslySetInnerHTML"?(u=u?u.__html:void 0,a=a?a.__html:void 0,u!=null&&a!==u&&(i=i||[]).push(c,u)):c==="children"?typeof u!="string"&&typeof u!="number"||(i=i||[]).push(c,""+u):c!=="suppressContentEditableWarning"&&c!=="suppressHydrationWarning"&&(Zn.hasOwnProperty(c)?(u!=null&&c==="onScroll"&&U("scroll",e),i||a===u||(i=[])):(i=i||[]).push(c,u))}n&&(i=i||[]).push("style",n);var c=i;(t.updateQueue=c)&&(t.flags|=4)}};xc=function(e,t,n,r){n!==r&&(t.flags|=4)};function In(e,t){if(!W)switch(e.tailMode){case"hidden":t=e.tail;for(var n=null;t!==null;)t.alternate!==null&&(n=t),t=t.sibling;n===null?e.tail=null:n.sibling=null;break;case"collapsed":n=e.tail;for(var r=null;n!==null;)n.alternate!==null&&(r=n),n=n.sibling;r===null?t||e.tail===null?e.tail=null:e.tail.sibling=null:r.sibling=null}}function ce(e){var t=e.alternate!==null&&e.alternate.child===e.child,n=0,r=0;if(t)for(var l=e.child;l!==null;)n|=l.lanes|l.childLanes,r|=l.subtreeFlags&14680064,r|=l.flags&14680064,l.return=e,l=l.sibling;else for(l=e.child;l!==null;)n|=l.lanes|l.childLanes,r|=l.subtreeFlags,r|=l.flags,l.return=e,l=l.sibling;return e.subtreeFlags|=r,e.childLanes=n,t}function ep(e,t,n){var r=t.pendingProps;switch(Ao(t),t.tag){case 2:case 16:case 15:case 0:case 11:case 7:case 8:case 12:case 9:case 14:return ce(t),null;case 1:return ke(t.type)&&cl(),ce(t),null;case 3:return r=t.stateNode,vn(),B(we),B(fe),Ho(),r.pendingContext&&(r.context=r.pendingContext,r.pendingContext=null),(e===null||e.child===null)&&(Ir(t)?t.flags|=4:e===null||e.memoizedState.isDehydrated&&!(t.flags&256)||(t.flags|=1024,We!==null&&(po(We),We=null))),lo(e,t),ce(t),null;case 5:Vo(t);var l=Mt(ur.current);if(n=t.type,e!==null&&t.stateNode!=null)yc(e,t,n,r,l),e.ref!==t.ref&&(t.flags|=512,t.flags|=2097152);else{if(!r){if(t.stateNode===null)throw Error(k(166));return ce(t),null}if(e=Mt(Je.current),Ir(t)){r=t.stateNode,n=t.type;var i=t.memoizedProps;switch(r[Ge]=t,r[ar]=i,e=(t.mode&1)!==0,n){case"dialog":U("cancel",r),U("close",r);break;case"iframe":case"object":case"embed":U("load",r);break;case"video":case"audio":for(l=0;l<Un.length;l++)U(Un[l],r);break;case"source":U("error",r);break;case"img":case"image":case"link":U("error",r),U("load",r);break;case"details":U("toggle",r);break;case"input":va(r,i),U("invalid",r);break;case"select":r._wrapperState={wasMultiple:!!i.multiple},U("invalid",r);break;case"textarea":xa(r,i),U("invalid",r)}Pi(n,i),l=null;for(var o in i)if(i.hasOwnProperty(o)){var a=i[o];o==="children"?typeof a=="string"?r.textContent!==a&&(i.suppressHydrationWarning!==!0&&Dr(r.textContent,a,e),l=["children",a]):typeof a=="number"&&r.textContent!==""+a&&(i.suppressHydrationWarning!==!0&&Dr(r.textContent,a,e),l=["children",""+a]):Zn.hasOwnProperty(o)&&a!=null&&o==="onScroll"&&U("scroll",r)}switch(n){case"input":Er(r),ya(r,i,!0);break;case"textarea":Er(r),wa(r);break;case"select":case"option":break;default:typeof i.onClick=="function"&&(r.onclick=ul)}r=l,t.updateQueue=r,r!==null&&(t.flags|=4)}else{o=l.nodeType===9?l:l.ownerDocument,e==="http://www.w3.org/1999/xhtml"&&(e=Ys(n)),e==="http://www.w3.org/1999/xhtml"?n==="script"?(e=o.createElement("div"),e.innerHTML="<script><\/script>",e=e.removeChild(e.firstChild)):typeof r.is=="string"?e=o.createElement(n,{is:r.is}):(e=o.createElement(n),n==="select"&&(o=e,r.multiple?o.multiple=!0:r.size&&(o.size=r.size))):e=o.createElementNS(e,n),e[Ge]=t,e[ar]=r,vc(e,t,!1,!1),t.stateNode=e;e:{switch(o=zi(n,r),n){case"dialog":U("cancel",e),U("close",e),l=r;break;case"iframe":case"object":case"embed":U("load",e),l=r;break;case"video":case"audio":for(l=0;l<Un.length;l++)U(Un[l],e);l=r;break;case"source":U("error",e),l=r;break;case"img":case"image":case"link":U("error",e),U("load",e),l=r;break;case"details":U("toggle",e),l=r;break;case"input":va(e,r),l=Ei(e,r),U("invalid",e);break;case"option":l=r;break;case"select":e._wrapperState={wasMultiple:!!r.multiple},l=Y({},r,{value:void 0}),U("invalid",e);break;case"textarea":xa(e,r),l=Ti(e,r),U("invalid",e);break;default:l=r}Pi(n,l),a=l;for(i in a)if(a.hasOwnProperty(i)){var u=a[i];i==="style"?Gs(e,u):i==="dangerouslySetInnerHTML"?(u=u?u.__html:void 0,u!=null&&Ks(e,u)):i==="children"?typeof u=="string"?(n!=="textarea"||u!=="")&&Jn(e,u):typeof u=="number"&&Jn(e,""+u):i!=="suppressContentEditableWarning"&&i!=="suppressHydrationWarning"&&i!=="autoFocus"&&(Zn.hasOwnProperty(i)?u!=null&&i==="onScroll"&&U("scroll",e):u!=null&&ko(e,i,u,o))}switch(n){case"input":Er(e),ya(e,r,!1);break;case"textarea":Er(e),wa(e);break;case"option":r.value!=null&&e.setAttribute("value",""+Nt(r.value));break;case"select":e.multiple=!!r.multiple,i=r.value,i!=null?an(e,!!r.multiple,i,!1):r.defaultValue!=null&&an(e,!!r.multiple,r.defaultValue,!0);break;default:typeof l.onClick=="function"&&(e.onclick=ul)}switch(n){case"button":case"input":case"select":case"textarea":r=!!r.autoFocus;break e;case"img":r=!0;break e;default:r=!1}}r&&(t.flags|=4)}t.ref!==null&&(t.flags|=512,t.flags|=2097152)}return ce(t),null;case 6:if(e&&t.stateNode!=null)xc(e,t,e.memoizedProps,r);else{if(typeof r!="string"&&t.stateNode===null)throw Error(k(166));if(n=Mt(ur.current),Mt(Je.current),Ir(t)){if(r=t.stateNode,n=t.memoizedProps,r[Ge]=t,(i=r.nodeValue!==n)&&(e=Ne,e!==null))switch(e.tag){case 3:Dr(r.nodeValue,n,(e.mode&1)!==0);break;case 5:e.memoizedProps.suppressHydrationWarning!==!0&&Dr(r.nodeValue,n,(e.mode&1)!==0)}i&&(t.flags|=4)}else r=(n.nodeType===9?n:n.ownerDocument).createTextNode(r),r[Ge]=t,t.stateNode=r}return ce(t),null;case 13:if(B(H),r=t.memoizedState,e===null||e.memoizedState!==null&&e.memoizedState.dehydrated!==null){if(W&&Ce!==null&&t.mode&1&&!(t.flags&128))Mu(),mn(),t.flags|=98560,i=!1;else if(i=Ir(t),r!==null&&r.dehydrated!==null){if(e===null){if(!i)throw Error(k(318));if(i=t.memoizedState,i=i!==null?i.dehydrated:null,!i)throw Error(k(317));i[Ge]=t}else mn(),!(t.flags&128)&&(t.memoizedState=null),t.flags|=4;ce(t),i=!1}else We!==null&&(po(We),We=null),i=!0;if(!i)return t.flags&65536?t:null}return t.flags&128?(t.lanes=n,t):(r=r!==null,r!==(e!==null&&e.memoizedState!==null)&&r&&(t.child.flags|=8192,t.mode&1&&(e===null||H.current&1?ee===0&&(ee=3):ra())),t.updateQueue!==null&&(t.flags|=4),ce(t),null);case 4:return vn(),lo(e,t),e===null&&ir(t.stateNode.containerInfo),ce(t),null;case 10:return $o(t.type._context),ce(t),null;case 17:return ke(t.type)&&cl(),ce(t),null;case 19:if(B(H),i=t.memoizedState,i===null)return ce(t),null;if(r=(t.flags&128)!==0,o=i.rendering,o===null)if(r)In(i,!1);else{if(ee!==0||e!==null&&e.flags&128)for(e=t.child;e!==null;){if(o=vl(e),o!==null){for(t.flags|=128,In(i,!1),r=o.updateQueue,r!==null&&(t.updateQueue=r,t.flags|=4),t.subtreeFlags=0,r=n,n=t.child;n!==null;)i=n,e=r,i.flags&=14680066,o=i.alternate,o===null?(i.childLanes=0,i.lanes=e,i.child=null,i.subtreeFlags=0,i.memoizedProps=null,i.memoizedState=null,i.updateQueue=null,i.dependencies=null,i.stateNode=null):(i.childLanes=o.childLanes,i.lanes=o.lanes,i.child=o.child,i.subtreeFlags=0,i.deletions=null,i.memoizedProps=o.memoizedProps,i.memoizedState=o.memoizedState,i.updateQueue=o.updateQueue,i.type=o.type,e=o.dependencies,i.dependencies=e===null?null:{lanes:e.lanes,firstContext:e.firstContext}),n=n.sibling;return $(H,H.current&1|2),t.child}e=e.sibling}i.tail!==null&&G()>xn&&(t.flags|=128,r=!0,In(i,!1),t.lanes=4194304)}else{if(!r)if(e=vl(o),e!==null){if(t.flags|=128,r=!0,n=e.updateQueue,n!==null&&(t.updateQueue=n,t.flags|=4),In(i,!0),i.tail===null&&i.tailMode==="hidden"&&!o.alternate&&!W)return ce(t),null}else 2*G()-i.renderingStartTime>xn&&n!==1073741824&&(t.flags|=128,r=!0,In(i,!1),t.lanes=4194304);i.isBackwards?(o.sibling=t.child,t.child=o):(n=i.last,n!==null?n.sibling=o:t.child=o,i.last=o)}return i.tail!==null?(t=i.tail,i.rendering=t,i.tail=t.sibling,i.renderingStartTime=G(),t.sibling=null,n=H.current,$(H,r?n&1|2:n&1),t):(ce(t),null);case 22:case 23:return na(),r=t.memoizedState!==null,e!==null&&e.memoizedState!==null!==r&&(t.flags|=8192),r&&t.mode&1?Se&1073741824&&(ce(t),t.subtreeFlags&6&&(t.flags|=8192)):ce(t),null;case 24:return null;case 25:return null}throw Error(k(156,t.tag))}function tp(e,t){switch(Ao(t),t.tag){case 1:return ke(t.type)&&cl(),e=t.flags,e&65536?(t.flags=e&-65537|128,t):null;case 3:return vn(),B(we),B(fe),Ho(),e=t.flags,e&65536&&!(e&128)?(t.flags=e&-65537|128,t):null;case 5:return Vo(t),null;case 13:if(B(H),e=t.memoizedState,e!==null&&e.dehydrated!==null){if(t.alternate===null)throw Error(k(340));mn()}return e=t.flags,e&65536?(t.flags=e&-65537|128,t):null;case 19:return B(H),null;case 4:return vn(),null;case 10:return $o(t.type._context),null;case 22:case 23:return na(),null;case 24:return null;default:return null}}var Or=!1,de=!1,np=typeof WeakSet=="function"?WeakSet:Set,C=null;function ln(e,t){var n=e.ref;if(n!==null)if(typeof n=="function")try{n(null)}catch(r){K(e,t,r)}else n.current=null}function io(e,t,n){try{n()}catch(r){K(e,t,r)}}var us=!1;function rp(e,t){if(Bi=ol,e=Cu(),Do(e)){if("selectionStart"in e)var n={start:e.selectionStart,end:e.selectionEnd};else e:{n=(n=e.ownerDocument)&&n.defaultView||window;var r=n.getSelection&&n.getSelection();if(r&&r.rangeCount!==0){n=r.anchorNode;var l=r.anchorOffset,i=r.focusNode;r=r.focusOffset;try{n.nodeType,i.nodeType}catch{n=null;break e}var o=0,a=-1,u=-1,c=0,g=0,m=e,h=null;t:for(;;){for(var v;m!==n||l!==0&&m.nodeType!==3||(a=o+l),m!==i||r!==0&&m.nodeType!==3||(u=o+r),m.nodeType===3&&(o+=m.nodeValue.length),(v=m.firstChild)!==null;)h=m,m=v;for(;;){if(m===e)break t;if(h===n&&++c===l&&(a=o),h===i&&++g===r&&(u=o),(v=m.nextSibling)!==null)break;m=h,h=m.parentNode}m=v}n=a===-1||u===-1?null:{start:a,end:u}}else n=null}n=n||{start:0,end:0}}else n=null;for(Wi={focusedElem:e,selectionRange:n},ol=!1,C=t;C!==null;)if(t=C,e=t.child,(t.subtreeFlags&1028)!==0&&e!==null)e.return=t,C=e;else for(;C!==null;){t=C;try{var x=t.alternate;if(t.flags&1024)switch(t.tag){case 0:case 11:case 15:break;case 1:if(x!==null){var w=x.memoizedProps,D=x.memoizedState,p=t.stateNode,d=p.getSnapshotBeforeUpdate(t.elementType===t.type?w:Ue(t.type,w),D);p.__reactInternalSnapshotBeforeUpdate=d}break;case 3:var f=t.stateNode.containerInfo;f.nodeType===1?f.textContent="":f.nodeType===9&&f.documentElement&&f.removeChild(f.documentElement);break;case 5:case 6:case 4:case 17:break;default:throw Error(k(163))}}catch(y){K(t,t.return,y)}if(e=t.sibling,e!==null){e.return=t.return,C=e;break}C=t.return}return x=us,us=!1,x}function Kn(e,t,n){var r=t.updateQueue;if(r=r!==null?r.lastEffect:null,r!==null){var l=r=r.next;do{if((l.tag&e)===e){var i=l.destroy;l.destroy=void 0,i!==void 0&&io(t,n,i)}l=l.next}while(l!==r)}}function Il(e,t){if(t=t.updateQueue,t=t!==null?t.lastEffect:null,t!==null){var n=t=t.next;do{if((n.tag&e)===e){var r=n.create;n.destroy=r()}n=n.next}while(n!==t)}}function oo(e){var t=e.ref;if(t!==null){var n=e.stateNode;switch(e.tag){case 5:e=n;break;default:e=n}typeof t=="function"?t(e):t.current=e}}function wc(e){var t=e.alternate;t!==null&&(e.alternate=null,wc(t)),e.child=null,e.deletions=null,e.sibling=null,e.tag===5&&(t=e.stateNode,t!==null&&(delete t[Ge],delete t[ar],delete t[Qi],delete t[Ff],delete t[$f])),e.stateNode=null,e.return=null,e.dependencies=null,e.memoizedProps=null,e.memoizedState=null,e.pendingProps=null,e.stateNode=null,e.updateQueue=null}function kc(e){return e.tag===5||e.tag===3||e.tag===4}function cs(e){e:for(;;){for(;e.sibling===null;){if(e.return===null||kc(e.return))return null;e=e.return}for(e.sibling.return=e.return,e=e.sibling;e.tag!==5&&e.tag!==6&&e.tag!==18;){if(e.flags&2||e.child===null||e.tag===4)continue e;e.child.return=e,e=e.child}if(!(e.flags&2))return e.stateNode}}function ao(e,t,n){var r=e.tag;if(r===5||r===6)e=e.stateNode,t?n.nodeType===8?n.parentNode.insertBefore(e,t):n.insertBefore(e,t):(n.nodeType===8?(t=n.parentNode,t.insertBefore(e,n)):(t=n,t.appendChild(e)),n=n._reactRootContainer,n!=null||t.onclick!==null||(t.onclick=ul));else if(r!==4&&(e=e.child,e!==null))for(ao(e,t,n),e=e.sibling;e!==null;)ao(e,t,n),e=e.sibling}function so(e,t,n){var r=e.tag;if(r===5||r===6)e=e.stateNode,t?n.insertBefore(e,t):n.appendChild(e);else if(r!==4&&(e=e.child,e!==null))for(so(e,t,n),e=e.sibling;e!==null;)so(e,t,n),e=e.sibling}var oe=null,Be=!1;function ct(e,t,n){for(n=n.child;n!==null;)_c(e,t,n),n=n.sibling}function _c(e,t,n){if(Ze&&typeof Ze.onCommitFiberUnmount=="function")try{Ze.onCommitFiberUnmount(jl,n)}catch{}switch(n.tag){case 5:de||ln(n,t);case 6:var r=oe,l=Be;oe=null,ct(e,t,n),oe=r,Be=l,oe!==null&&(Be?(e=oe,n=n.stateNode,e.nodeType===8?e.parentNode.removeChild(n):e.removeChild(n)):oe.removeChild(n.stateNode));break;case 18:oe!==null&&(Be?(e=oe,n=n.stateNode,e.nodeType===8?si(e.parentNode,n):e.nodeType===1&&si(e,n),nr(e)):si(oe,n.stateNode));break;case 4:r=oe,l=Be,oe=n.stateNode.containerInfo,Be=!0,ct(e,t,n),oe=r,Be=l;break;case 0:case 11:case 14:case 15:if(!de&&(r=n.updateQueue,r!==null&&(r=r.lastEffect,r!==null))){l=r=r.next;do{var i=l,o=i.destroy;i=i.tag,o!==void 0&&(i&2||i&4)&&io(n,t,o),l=l.next}while(l!==r)}ct(e,t,n);break;case 1:if(!de&&(ln(n,t),r=n.stateNode,typeof r.componentWillUnmount=="function"))try{r.props=n.memoizedProps,r.state=n.memoizedState,r.componentWillUnmount()}catch(a){K(n,t,a)}ct(e,t,n);break;case 21:ct(e,t,n);break;case 22:n.mode&1?(de=(r=de)||n.memoizedState!==null,ct(e,t,n),de=r):ct(e,t,n);break;default:ct(e,t,n)}}function ds(e){var t=e.updateQueue;if(t!==null){e.updateQueue=null;var n=e.stateNode;n===null&&(n=e.stateNode=new np),t.forEach(function(r){var l=fp.bind(null,e,r);n.has(r)||(n.add(r),r.then(l,l))})}}function $e(e,t){var n=t.deletions;if(n!==null)for(var r=0;r<n.length;r++){var l=n[r];try{var i=e,o=t,a=o;e:for(;a!==null;){switch(a.tag){case 5:oe=a.stateNode,Be=!1;break e;case 3:oe=a.stateNode.containerInfo,Be=!0;break e;case 4:oe=a.stateNode.containerInfo,Be=!0;break e}a=a.return}if(oe===null)throw Error(k(160));_c(i,o,l),oe=null,Be=!1;var u=l.alternate;u!==null&&(u.return=null),l.return=null}catch(c){K(l,t,c)}}if(t.subtreeFlags&12854)for(t=t.child;t!==null;)Sc(t,e),t=t.sibling}function Sc(e,t){var n=e.alternate,r=e.flags;switch(e.tag){case 0:case 11:case 14:case 15:if($e(t,e),Ke(e),r&4){try{Kn(3,e,e.return),Il(3,e)}catch(w){K(e,e.return,w)}try{Kn(5,e,e.return)}catch(w){K(e,e.return,w)}}break;case 1:$e(t,e),Ke(e),r&512&&n!==null&&ln(n,n.return);break;case 5:if($e(t,e),Ke(e),r&512&&n!==null&&ln(n,n.return),e.flags&32){var l=e.stateNode;try{Jn(l,"")}catch(w){K(e,e.return,w)}}if(r&4&&(l=e.stateNode,l!=null)){var i=e.memoizedProps,o=n!==null?n.memoizedProps:i,a=e.type,u=e.updateQueue;if(e.updateQueue=null,u!==null)try{a==="input"&&i.type==="radio"&&i.name!=null&&Hs(l,i),zi(a,o);var c=zi(a,i);for(o=0;o<u.length;o+=2){var g=u[o],m=u[o+1];g==="style"?Gs(l,m):g==="dangerouslySetInnerHTML"?Ks(l,m):g==="children"?Jn(l,m):ko(l,g,m,c)}switch(a){case"input":ji(l,i);break;case"textarea":Qs(l,i);break;case"select":var h=l._wrapperState.wasMultiple;l._wrapperState.wasMultiple=!!i.multiple;var v=i.value;v!=null?an(l,!!i.multiple,v,!1):h!==!!i.multiple&&(i.defaultValue!=null?an(l,!!i.multiple,i.defaultValue,!0):an(l,!!i.multiple,i.multiple?[]:"",!1))}l[ar]=i}catch(w){K(e,e.return,w)}}break;case 6:if($e(t,e),Ke(e),r&4){if(e.stateNode===null)throw Error(k(162));l=e.stateNode,i=e.memoizedProps;try{l.nodeValue=i}catch(w){K(e,e.return,w)}}break;case 3:if($e(t,e),Ke(e),r&4&&n!==null&&n.memoizedState.isDehydrated)try{nr(t.containerInfo)}catch(w){K(e,e.return,w)}break;case 4:$e(t,e),Ke(e);break;case 13:$e(t,e),Ke(e),l=e.child,l.flags&8192&&(i=l.memoizedState!==null,l.stateNode.isHidden=i,!i||l.alternate!==null&&l.alternate.memoizedState!==null||(ea=G())),r&4&&ds(e);break;case 22:if(g=n!==null&&n.memoizedState!==null,e.mode&1?(de=(c=de)||g,$e(t,e),de=c):$e(t,e),Ke(e),r&8192){if(c=e.memoizedState!==null,(e.stateNode.isHidden=c)&&!g&&e.mode&1)for(C=e,g=e.child;g!==null;){for(m=C=g;C!==null;){switch(h=C,v=h.child,h.tag){case 0:case 11:case 14:case 15:Kn(4,h,h.return);break;case 1:ln(h,h.return);var x=h.stateNode;if(typeof x.componentWillUnmount=="function"){r=h,n=h.return;try{t=r,x.props=t.memoizedProps,x.state=t.memoizedState,x.componentWillUnmount()}catch(w){K(r,n,w)}}break;case 5:ln(h,h.return);break;case 22:if(h.memoizedState!==null){ps(m);continue}}v!==null?(v.return=h,C=v):ps(m)}g=g.sibling}e:for(g=null,m=e;;){if(m.tag===5){if(g===null){g=m;try{l=m.stateNode,c?(i=l.style,typeof i.setProperty=="function"?i.setProperty("display","none","important"):i.display="none"):(a=m.stateNode,u=m.memoizedProps.style,o=u!=null&&u.hasOwnProperty("display")?u.display:null,a.style.display=Xs("display",o))}catch(w){K(e,e.return,w)}}}else if(m.tag===6){if(g===null)try{m.stateNode.nodeValue=c?"":m.memoizedProps}catch(w){K(e,e.return,w)}}else if((m.tag!==22&&m.tag!==23||m.memoizedState===null||m===e)&&m.child!==null){m.child.return=m,m=m.child;continue}if(m===e)break e;for(;m.sibling===null;){if(m.return===null||m.return===e)break e;g===m&&(g=null),m=m.return}g===m&&(g=null),m.sibling.return=m.return,m=m.sibling}}break;case 19:$e(t,e),Ke(e),r&4&&ds(e);break;case 21:break;default:$e(t,e),Ke(e)}}function Ke(e){var t=e.flags;if(t&2){try{e:{for(var n=e.return;n!==null;){if(kc(n)){var r=n;break e}n=n.return}throw Error(k(160))}switch(r.tag){case 5:var l=r.stateNode;r.flags&32&&(Jn(l,""),r.flags&=-33);var i=cs(e);so(e,i,l);break;case 3:case 4:var o=r.stateNode.containerInfo,a=cs(e);ao(e,a,o);break;default:throw Error(k(161))}}catch(u){K(e,e.return,u)}e.flags&=-3}t&4096&&(e.flags&=-4097)}function lp(e,t,n){C=e,Cc(e)}function Cc(e,t,n){for(var r=(e.mode&1)!==0;C!==null;){var l=C,i=l.child;if(l.tag===22&&r){var o=l.memoizedState!==null||Or;if(!o){var a=l.alternate,u=a!==null&&a.memoizedState!==null||de;a=Or;var c=de;if(Or=o,(de=u)&&!c)for(C=l;C!==null;)o=C,u=o.child,o.tag===22&&o.memoizedState!==null?gs(l):u!==null?(u.return=o,C=u):gs(l);for(;i!==null;)C=i,Cc(i),i=i.sibling;C=l,Or=a,de=c}fs(e)}else l.subtreeFlags&8772&&i!==null?(i.return=l,C=i):fs(e)}}function fs(e){for(;C!==null;){var t=C;if(t.flags&8772){var n=t.alternate;try{if(t.flags&8772)switch(t.tag){case 0:case 11:case 15:de||Il(5,t);break;case 1:var r=t.stateNode;if(t.flags&4&&!de)if(n===null)r.componentDidMount();else{var l=t.elementType===t.type?n.memoizedProps:Ue(t.type,n.memoizedProps);r.componentDidUpdate(l,n.memoizedState,r.__reactInternalSnapshotBeforeUpdate)}var i=t.updateQueue;i!==null&&Ga(t,i,r);break;case 3:var o=t.updateQueue;if(o!==null){if(n=null,t.child!==null)switch(t.child.tag){case 5:n=t.child.stateNode;break;case 1:n=t.child.stateNode}Ga(t,o,n)}break;case 5:var a=t.stateNode;if(n===null&&t.flags&4){n=a;var u=t.memoizedProps;switch(t.type){case"button":case"input":case"select":case"textarea":u.autoFocus&&n.focus();break;case"img":u.src&&(n.src=u.src)}}break;case 6:break;case 4:break;case 12:break;case 13:if(t.memoizedState===null){var c=t.alternate;if(c!==null){var g=c.memoizedState;if(g!==null){var m=g.dehydrated;m!==null&&nr(m)}}}break;case 19:case 17:case 21:case 22:case 23:case 25:break;default:throw Error(k(163))}de||t.flags&512&&oo(t)}catch(h){K(t,t.return,h)}}if(t===e){C=null;break}if(n=t.sibling,n!==null){n.return=t.return,C=n;break}C=t.return}}function ps(e){for(;C!==null;){var t=C;if(t===e){C=null;break}var n=t.sibling;if(n!==null){n.return=t.return,C=n;break}C=t.return}}function gs(e){for(;C!==null;){var t=C;try{switch(t.tag){case 0:case 11:case 15:var n=t.return;try{Il(4,t)}catch(u){K(t,n,u)}break;case 1:var r=t.stateNode;if(typeof r.componentDidMount=="function"){var l=t.return;try{r.componentDidMount()}catch(u){K(t,l,u)}}var i=t.return;try{oo(t)}catch(u){K(t,i,u)}break;case 5:var o=t.return;try{oo(t)}catch(u){K(t,o,u)}}}catch(u){K(t,t.return,u)}if(t===e){C=null;break}var a=t.sibling;if(a!==null){a.return=t.return,C=a;break}C=t.return}}var ip=Math.ceil,wl=ut.ReactCurrentDispatcher,Jo=ut.ReactCurrentOwner,Ie=ut.ReactCurrentBatchConfig,I=0,le=null,J=null,ae=0,Se=0,on=Rt(0),ee=0,pr=null,Wt=0,Al=0,qo=0,Xn=null,ye=null,ea=0,xn=1/0,et=null,kl=!1,uo=null,_t=null,Fr=!1,ht=null,_l=0,Gn=0,co=null,Zr=-1,Jr=0;function me(){return I&6?G():Zr!==-1?Zr:Zr=G()}function St(e){return e.mode&1?I&2&&ae!==0?ae&-ae:Bf.transition!==null?(Jr===0&&(Jr=su()),Jr):(e=A,e!==0||(e=window.event,e=e===void 0?16:mu(e.type)),e):1}function He(e,t,n,r){if(50<Gn)throw Gn=0,co=null,Error(k(185));vr(e,n,r),(!(I&2)||e!==le)&&(e===le&&(!(I&2)&&(Al|=n),ee===4&&gt(e,ae)),_e(e,r),n===1&&I===0&&!(t.mode&1)&&(xn=G()+500,zl&&Tt()))}function _e(e,t){var n=e.callbackNode;Ud(e,t);var r=il(e,e===le?ae:0);if(r===0)n!==null&&Sa(n),e.callbackNode=null,e.callbackPriority=0;else if(t=r&-r,e.callbackPriority!==t){if(n!=null&&Sa(n),t===1)e.tag===0?Uf(ms.bind(null,e)):Du(ms.bind(null,e)),Mf(function(){!(I&6)&&Tt()}),n=null;else{switch(uu(r)){case 1:n=Eo;break;case 4:n=ou;break;case 16:n=ll;break;case 536870912:n=au;break;default:n=ll}n=zc(n,Nc.bind(null,e))}e.callbackPriority=t,e.callbackNode=n}}function Nc(e,t){if(Zr=-1,Jr=0,I&6)throw Error(k(327));var n=e.callbackNode;if(fn()&&e.callbackNode!==n)return null;var r=il(e,e===le?ae:0);if(r===0)return null;if(r&30||r&e.expiredLanes||t)t=Sl(e,r);else{t=r;var l=I;I|=2;var i=jc();(le!==e||ae!==t)&&(et=null,xn=G()+500,Ot(e,t));do try{sp();break}catch(a){Ec(e,a)}while(!0);Fo(),wl.current=i,I=l,J!==null?t=0:(le=null,ae=0,t=ee)}if(t!==0){if(t===2&&(l=Mi(e),l!==0&&(r=l,t=fo(e,l))),t===1)throw n=pr,Ot(e,0),gt(e,r),_e(e,G()),n;if(t===6)gt(e,r);else{if(l=e.current.alternate,!(r&30)&&!op(l)&&(t=Sl(e,r),t===2&&(i=Mi(e),i!==0&&(r=i,t=fo(e,i))),t===1))throw n=pr,Ot(e,0),gt(e,r),_e(e,G()),n;switch(e.finishedWork=l,e.finishedLanes=r,t){case 0:case 1:throw Error(k(345));case 2:Lt(e,ye,et);break;case 3:if(gt(e,r),(r&130023424)===r&&(t=ea+500-G(),10<t)){if(il(e,0)!==0)break;if(l=e.suspendedLanes,(l&r)!==r){me(),e.pingedLanes|=e.suspendedLanes&l;break}e.timeoutHandle=Hi(Lt.bind(null,e,ye,et),t);break}Lt(e,ye,et);break;case 4:if(gt(e,r),(r&4194240)===r)break;for(t=e.eventTimes,l=-1;0<r;){var o=31-Ve(r);i=1<<o,o=t[o],o>l&&(l=o),r&=~i}if(r=l,r=G()-r,r=(120>r?120:480>r?480:1080>r?1080:1920>r?1920:3e3>r?3e3:4320>r?4320:1960*ip(r/1960))-r,10<r){e.timeoutHandle=Hi(Lt.bind(null,e,ye,et),r);break}Lt(e,ye,et);break;case 5:Lt(e,ye,et);break;default:throw Error(k(329))}}}return _e(e,G()),e.callbackNode===n?Nc.bind(null,e):null}function fo(e,t){var n=Xn;return e.current.memoizedState.isDehydrated&&(Ot(e,t).flags|=256),e=Sl(e,t),e!==2&&(t=ye,ye=n,t!==null&&po(t)),e}function po(e){ye===null?ye=e:ye.push.apply(ye,e)}function op(e){for(var t=e;;){if(t.flags&16384){var n=t.updateQueue;if(n!==null&&(n=n.stores,n!==null))for(var r=0;r<n.length;r++){var l=n[r],i=l.getSnapshot;l=l.value;try{if(!Qe(i(),l))return!1}catch{return!1}}}if(n=t.child,t.subtreeFlags&16384&&n!==null)n.return=t,t=n;else{if(t===e)break;for(;t.sibling===null;){if(t.return===null||t.return===e)return!0;t=t.return}t.sibling.return=t.return,t=t.sibling}}return!0}function gt(e,t){for(t&=~qo,t&=~Al,e.suspendedLanes|=t,e.pingedLanes&=~t,e=e.expirationTimes;0<t;){var n=31-Ve(t),r=1<<n;e[n]=-1,t&=~r}}function ms(e){if(I&6)throw Error(k(327));fn();var t=il(e,0);if(!(t&1))return _e(e,G()),null;var n=Sl(e,t);if(e.tag!==0&&n===2){var r=Mi(e);r!==0&&(t=r,n=fo(e,r))}if(n===1)throw n=pr,Ot(e,0),gt(e,t),_e(e,G()),n;if(n===6)throw Error(k(345));return e.finishedWork=e.current.alternate,e.finishedLanes=t,Lt(e,ye,et),_e(e,G()),null}function ta(e,t){var n=I;I|=1;try{return e(t)}finally{I=n,I===0&&(xn=G()+500,zl&&Tt())}}function Vt(e){ht!==null&&ht.tag===0&&!(I&6)&&fn();var t=I;I|=1;var n=Ie.transition,r=A;try{if(Ie.transition=null,A=1,e)return e()}finally{A=r,Ie.transition=n,I=t,!(I&6)&&Tt()}}function na(){Se=on.current,B(on)}function Ot(e,t){e.finishedWork=null,e.finishedLanes=0;var n=e.timeoutHandle;if(n!==-1&&(e.timeoutHandle=-1,Af(n)),J!==null)for(n=J.return;n!==null;){var r=n;switch(Ao(r),r.tag){case 1:r=r.type.childContextTypes,r!=null&&cl();break;case 3:vn(),B(we),B(fe),Ho();break;case 5:Vo(r);break;case 4:vn();break;case 13:B(H);break;case 19:B(H);break;case 10:$o(r.type._context);break;case 22:case 23:na()}n=n.return}if(le=e,J=e=Ct(e.current,null),ae=Se=t,ee=0,pr=null,qo=Al=Wt=0,ye=Xn=null,At!==null){for(t=0;t<At.length;t++)if(n=At[t],r=n.interleaved,r!==null){n.interleaved=null;var l=r.next,i=n.pending;if(i!==null){var o=i.next;i.next=l,r.next=o}n.pending=r}At=null}return e}function Ec(e,t){do{var n=J;try{if(Fo(),Kr.current=xl,yl){for(var r=Q.memoizedState;r!==null;){var l=r.queue;l!==null&&(l.pending=null),r=r.next}yl=!1}if(Bt=0,re=q=Q=null,Yn=!1,cr=0,Jo.current=null,n===null||n.return===null){ee=1,pr=t,J=null;break}e:{var i=e,o=n.return,a=n,u=t;if(t=ae,a.flags|=32768,u!==null&&typeof u=="object"&&typeof u.then=="function"){var c=u,g=a,m=g.tag;if(!(g.mode&1)&&(m===0||m===11||m===15)){var h=g.alternate;h?(g.updateQueue=h.updateQueue,g.memoizedState=h.memoizedState,g.lanes=h.lanes):(g.updateQueue=null,g.memoizedState=null)}var v=ns(o);if(v!==null){v.flags&=-257,rs(v,o,a,i,t),v.mode&1&&ts(i,c,t),t=v,u=c;var x=t.updateQueue;if(x===null){var w=new Set;w.add(u),t.updateQueue=w}else x.add(u);break e}else{if(!(t&1)){ts(i,c,t),ra();break e}u=Error(k(426))}}else if(W&&a.mode&1){var D=ns(o);if(D!==null){!(D.flags&65536)&&(D.flags|=256),rs(D,o,a,i,t),Mo(yn(u,a));break e}}i=u=yn(u,a),ee!==4&&(ee=2),Xn===null?Xn=[i]:Xn.push(i),i=o;do{switch(i.tag){case 3:i.flags|=65536,t&=-t,i.lanes|=t;var p=uc(i,u,t);Xa(i,p);break e;case 1:a=u;var d=i.type,f=i.stateNode;if(!(i.flags&128)&&(typeof d.getDerivedStateFromError=="function"||f!==null&&typeof f.componentDidCatch=="function"&&(_t===null||!_t.has(f)))){i.flags|=65536,t&=-t,i.lanes|=t;var y=cc(i,a,t);Xa(i,y);break e}}i=i.return}while(i!==null)}Tc(n)}catch(_){t=_,J===n&&n!==null&&(J=n=n.return);continue}break}while(!0)}function jc(){var e=wl.current;return wl.current=xl,e===null?xl:e}function ra(){(ee===0||ee===3||ee===2)&&(ee=4),le===null||!(Wt&268435455)&&!(Al&268435455)||gt(le,ae)}function Sl(e,t){var n=I;I|=2;var r=jc();(le!==e||ae!==t)&&(et=null,Ot(e,t));do try{ap();break}catch(l){Ec(e,l)}while(!0);if(Fo(),I=n,wl.current=r,J!==null)throw Error(k(261));return le=null,ae=0,ee}function ap(){for(;J!==null;)Rc(J)}function sp(){for(;J!==null&&!zd();)Rc(J)}function Rc(e){var t=Pc(e.alternate,e,Se);e.memoizedProps=e.pendingProps,t===null?Tc(e):J=t,Jo.current=null}function Tc(e){var t=e;do{var n=t.alternate;if(e=t.return,t.flags&32768){if(n=tp(n,t),n!==null){n.flags&=32767,J=n;return}if(e!==null)e.flags|=32768,e.subtreeFlags=0,e.deletions=null;else{ee=6,J=null;return}}else if(n=ep(n,t,Se),n!==null){J=n;return}if(t=t.sibling,t!==null){J=t;return}J=t=e}while(t!==null);ee===0&&(ee=5)}function Lt(e,t,n){var r=A,l=Ie.transition;try{Ie.transition=null,A=1,up(e,t,n,r)}finally{Ie.transition=l,A=r}return null}function up(e,t,n,r){do fn();while(ht!==null);if(I&6)throw Error(k(327));n=e.finishedWork;var l=e.finishedLanes;if(n===null)return null;if(e.finishedWork=null,e.finishedLanes=0,n===e.current)throw Error(k(177));e.callbackNode=null,e.callbackPriority=0;var i=n.lanes|n.childLanes;if(Bd(e,i),e===le&&(J=le=null,ae=0),!(n.subtreeFlags&2064)&&!(n.flags&2064)||Fr||(Fr=!0,zc(ll,function(){return fn(),null})),i=(n.flags&15990)!==0,n.subtreeFlags&15990||i){i=Ie.transition,Ie.transition=null;var o=A;A=1;var a=I;I|=4,Jo.current=null,rp(e,n),Sc(n,e),Tf(Wi),ol=!!Bi,Wi=Bi=null,e.current=n,lp(n),Ld(),I=a,A=o,Ie.transition=i}else e.current=n;if(Fr&&(Fr=!1,ht=e,_l=l),i=e.pendingLanes,i===0&&(_t=null),Ad(n.stateNode),_e(e,G()),t!==null)for(r=e.onRecoverableError,n=0;n<t.length;n++)l=t[n],r(l.value,{componentStack:l.stack,digest:l.digest});if(kl)throw kl=!1,e=uo,uo=null,e;return _l&1&&e.tag!==0&&fn(),i=e.pendingLanes,i&1?e===co?Gn++:(Gn=0,co=e):Gn=0,Tt(),null}function fn(){if(ht!==null){var e=uu(_l),t=Ie.transition,n=A;try{if(Ie.transition=null,A=16>e?16:e,ht===null)var r=!1;else{if(e=ht,ht=null,_l=0,I&6)throw Error(k(331));var l=I;for(I|=4,C=e.current;C!==null;){var i=C,o=i.child;if(C.flags&16){var a=i.deletions;if(a!==null){for(var u=0;u<a.length;u++){var c=a[u];for(C=c;C!==null;){var g=C;switch(g.tag){case 0:case 11:case 15:Kn(8,g,i)}var m=g.child;if(m!==null)m.return=g,C=m;else for(;C!==null;){g=C;var h=g.sibling,v=g.return;if(wc(g),g===c){C=null;break}if(h!==null){h.return=v,C=h;break}C=v}}}var x=i.alternate;if(x!==null){var w=x.child;if(w!==null){x.child=null;do{var D=w.sibling;w.sibling=null,w=D}while(w!==null)}}C=i}}if(i.subtreeFlags&2064&&o!==null)o.return=i,C=o;else e:for(;C!==null;){if(i=C,i.flags&2048)switch(i.tag){case 0:case 11:case 15:Kn(9,i,i.return)}var p=i.sibling;if(p!==null){p.return=i.return,C=p;break e}C=i.return}}var d=e.current;for(C=d;C!==null;){o=C;var f=o.child;if(o.subtreeFlags&2064&&f!==null)f.return=o,C=f;else e:for(o=d;C!==null;){if(a=C,a.flags&2048)try{switch(a.tag){case 0:case 11:case 15:Il(9,a)}}catch(_){K(a,a.return,_)}if(a===o){C=null;break e}var y=a.sibling;if(y!==null){y.return=a.return,C=y;break e}C=a.return}}if(I=l,Tt(),Ze&&typeof Ze.onPostCommitFiberRoot=="function")try{Ze.onPostCommitFiberRoot(jl,e)}catch{}r=!0}return r}finally{A=n,Ie.transition=t}}return!1}function hs(e,t,n){t=yn(n,t),t=uc(e,t,1),e=kt(e,t,1),t=me(),e!==null&&(vr(e,1,t),_e(e,t))}function K(e,t,n){if(e.tag===3)hs(e,e,n);else for(;t!==null;){if(t.tag===3){hs(t,e,n);break}else if(t.tag===1){var r=t.stateNode;if(typeof t.type.getDerivedStateFromError=="function"||typeof r.componentDidCatch=="function"&&(_t===null||!_t.has(r))){e=yn(n,e),e=cc(t,e,1),t=kt(t,e,1),e=me(),t!==null&&(vr(t,1,e),_e(t,e));break}}t=t.return}}function cp(e,t,n){var r=e.pingCache;r!==null&&r.delete(t),t=me(),e.pingedLanes|=e.suspendedLanes&n,le===e&&(ae&n)===n&&(ee===4||ee===3&&(ae&130023424)===ae&&500>G()-ea?Ot(e,0):qo|=n),_e(e,t)}function bc(e,t){t===0&&(e.mode&1?(t=Tr,Tr<<=1,!(Tr&130023424)&&(Tr=4194304)):t=1);var n=me();e=at(e,t),e!==null&&(vr(e,t,n),_e(e,n))}function dp(e){var t=e.memoizedState,n=0;t!==null&&(n=t.retryLane),bc(e,n)}function fp(e,t){var n=0;switch(e.tag){case 13:var r=e.stateNode,l=e.memoizedState;l!==null&&(n=l.retryLane);break;case 19:r=e.stateNode;break;default:throw Error(k(314))}r!==null&&r.delete(t),bc(e,n)}var Pc;Pc=function(e,t,n){if(e!==null)if(e.memoizedProps!==t.pendingProps||we.current)xe=!0;else{if(!(e.lanes&n)&&!(t.flags&128))return xe=!1,qf(e,t,n);xe=!!(e.flags&131072)}else xe=!1,W&&t.flags&1048576&&Iu(t,pl,t.index);switch(t.lanes=0,t.tag){case 2:var r=t.type;Gr(e,t),e=t.pendingProps;var l=gn(t,fe.current);dn(t,n),l=Yo(null,t,r,e,l,n);var i=Ko();return t.flags|=1,typeof l=="object"&&l!==null&&typeof l.render=="function"&&l.$$typeof===void 0?(t.tag=1,t.memoizedState=null,t.updateQueue=null,ke(r)?(i=!0,dl(t)):i=!1,t.memoizedState=l.state!==null&&l.state!==void 0?l.state:null,Bo(t),l.updater=Dl,t.stateNode=l,l._reactInternals=t,Ji(t,r,e,n),t=to(null,t,r,!0,i,n)):(t.tag=0,W&&i&&Io(t),ge(null,t,l,n),t=t.child),t;case 16:r=t.elementType;e:{switch(Gr(e,t),e=t.pendingProps,l=r._init,r=l(r._payload),t.type=r,l=t.tag=gp(r),e=Ue(r,e),l){case 0:t=eo(null,t,r,e,n);break e;case 1:t=os(null,t,r,e,n);break e;case 11:t=ls(null,t,r,e,n);break e;case 14:t=is(null,t,r,Ue(r.type,e),n);break e}throw Error(k(306,r,""))}return t;case 0:return r=t.type,l=t.pendingProps,l=t.elementType===r?l:Ue(r,l),eo(e,t,r,l,n);case 1:return r=t.type,l=t.pendingProps,l=t.elementType===r?l:Ue(r,l),os(e,t,r,l,n);case 3:e:{if(gc(t),e===null)throw Error(k(387));r=t.pendingProps,i=t.memoizedState,l=i.element,Uu(e,t),hl(t,r,null,n);var o=t.memoizedState;if(r=o.element,i.isDehydrated)if(i={element:r,isDehydrated:!1,cache:o.cache,pendingSuspenseBoundaries:o.pendingSuspenseBoundaries,transitions:o.transitions},t.updateQueue.baseState=i,t.memoizedState=i,t.flags&256){l=yn(Error(k(423)),t),t=as(e,t,r,n,l);break e}else if(r!==l){l=yn(Error(k(424)),t),t=as(e,t,r,n,l);break e}else for(Ce=wt(t.stateNode.containerInfo.firstChild),Ne=t,W=!0,We=null,n=Fu(t,null,r,n),t.child=n;n;)n.flags=n.flags&-3|4096,n=n.sibling;else{if(mn(),r===l){t=st(e,t,n);break e}ge(e,t,r,n)}t=t.child}return t;case 5:return Bu(t),e===null&&Xi(t),r=t.type,l=t.pendingProps,i=e!==null?e.memoizedProps:null,o=l.children,Vi(r,l)?o=null:i!==null&&Vi(r,i)&&(t.flags|=32),pc(e,t),ge(e,t,o,n),t.child;case 6:return e===null&&Xi(t),null;case 13:return mc(e,t,n);case 4:return Wo(t,t.stateNode.containerInfo),r=t.pendingProps,e===null?t.child=hn(t,null,r,n):ge(e,t,r,n),t.child;case 11:return r=t.type,l=t.pendingProps,l=t.elementType===r?l:Ue(r,l),ls(e,t,r,l,n);case 7:return ge(e,t,t.pendingProps,n),t.child;case 8:return ge(e,t,t.pendingProps.children,n),t.child;case 12:return ge(e,t,t.pendingProps.children,n),t.child;case 10:e:{if(r=t.type._context,l=t.pendingProps,i=t.memoizedProps,o=l.value,$(gl,r._currentValue),r._currentValue=o,i!==null)if(Qe(i.value,o)){if(i.children===l.children&&!we.current){t=st(e,t,n);break e}}else for(i=t.child,i!==null&&(i.return=t);i!==null;){var a=i.dependencies;if(a!==null){o=i.child;for(var u=a.firstContext;u!==null;){if(u.context===r){if(i.tag===1){u=lt(-1,n&-n),u.tag=2;var c=i.updateQueue;if(c!==null){c=c.shared;var g=c.pending;g===null?u.next=u:(u.next=g.next,g.next=u),c.pending=u}}i.lanes|=n,u=i.alternate,u!==null&&(u.lanes|=n),Gi(i.return,n,t),a.lanes|=n;break}u=u.next}}else if(i.tag===10)o=i.type===t.type?null:i.child;else if(i.tag===18){if(o=i.return,o===null)throw Error(k(341));o.lanes|=n,a=o.alternate,a!==null&&(a.lanes|=n),Gi(o,n,t),o=i.sibling}else o=i.child;if(o!==null)o.return=i;else for(o=i;o!==null;){if(o===t){o=null;break}if(i=o.sibling,i!==null){i.return=o.return,o=i;break}o=o.return}i=o}ge(e,t,l.children,n),t=t.child}return t;case 9:return l=t.type,r=t.pendingProps.children,dn(t,n),l=Me(l),r=r(l),t.flags|=1,ge(e,t,r,n),t.child;case 14:return r=t.type,l=Ue(r,t.pendingProps),l=Ue(r.type,l),is(e,t,r,l,n);case 15:return dc(e,t,t.type,t.pendingProps,n);case 17:return r=t.type,l=t.pendingProps,l=t.elementType===r?l:Ue(r,l),Gr(e,t),t.tag=1,ke(r)?(e=!0,dl(t)):e=!1,dn(t,n),sc(t,r,l),Ji(t,r,l,n),to(null,t,r,!0,e,n);case 19:return hc(e,t,n);case 22:return fc(e,t,n)}throw Error(k(156,t.tag))};function zc(e,t){return iu(e,t)}function pp(e,t,n,r){this.tag=e,this.key=n,this.sibling=this.child=this.return=this.stateNode=this.type=this.elementType=null,this.index=0,this.ref=null,this.pendingProps=t,this.dependencies=this.memoizedState=this.updateQueue=this.memoizedProps=null,this.mode=r,this.subtreeFlags=this.flags=0,this.deletions=null,this.childLanes=this.lanes=0,this.alternate=null}function De(e,t,n,r){return new pp(e,t,n,r)}function la(e){return e=e.prototype,!(!e||!e.isReactComponent)}function gp(e){if(typeof e=="function")return la(e)?1:0;if(e!=null){if(e=e.$$typeof,e===So)return 11;if(e===Co)return 14}return 2}function Ct(e,t){var n=e.alternate;return n===null?(n=De(e.tag,t,e.key,e.mode),n.elementType=e.elementType,n.type=e.type,n.stateNode=e.stateNode,n.alternate=e,e.alternate=n):(n.pendingProps=t,n.type=e.type,n.flags=0,n.subtreeFlags=0,n.deletions=null),n.flags=e.flags&14680064,n.childLanes=e.childLanes,n.lanes=e.lanes,n.child=e.child,n.memoizedProps=e.memoizedProps,n.memoizedState=e.memoizedState,n.updateQueue=e.updateQueue,t=e.dependencies,n.dependencies=t===null?null:{lanes:t.lanes,firstContext:t.firstContext},n.sibling=e.sibling,n.index=e.index,n.ref=e.ref,n}function qr(e,t,n,r,l,i){var o=2;if(r=e,typeof e=="function")la(e)&&(o=1);else if(typeof e=="string")o=5;else e:switch(e){case Xt:return Ft(n.children,l,i,t);case _o:o=8,l|=8;break;case _i:return e=De(12,n,t,l|2),e.elementType=_i,e.lanes=i,e;case Si:return e=De(13,n,t,l),e.elementType=Si,e.lanes=i,e;case Ci:return e=De(19,n,t,l),e.elementType=Ci,e.lanes=i,e;case Bs:return Ml(n,l,i,t);default:if(typeof e=="object"&&e!==null)switch(e.$$typeof){case $s:o=10;break e;case Us:o=9;break e;case So:o=11;break e;case Co:o=14;break e;case dt:o=16,r=null;break e}throw Error(k(130,e==null?e:typeof e,""))}return t=De(o,n,t,l),t.elementType=e,t.type=r,t.lanes=i,t}function Ft(e,t,n,r){return e=De(7,e,r,t),e.lanes=n,e}function Ml(e,t,n,r){return e=De(22,e,r,t),e.elementType=Bs,e.lanes=n,e.stateNode={isHidden:!1},e}function hi(e,t,n){return e=De(6,e,null,t),e.lanes=n,e}function vi(e,t,n){return t=De(4,e.children!==null?e.children:[],e.key,t),t.lanes=n,t.stateNode={containerInfo:e.containerInfo,pendingChildren:null,implementation:e.implementation},t}function mp(e,t,n,r,l){this.tag=t,this.containerInfo=e,this.finishedWork=this.pingCache=this.current=this.pendingChildren=null,this.timeoutHandle=-1,this.callbackNode=this.pendingContext=this.context=null,this.callbackPriority=0,this.eventTimes=Zl(0),this.expirationTimes=Zl(-1),this.entangledLanes=this.finishedLanes=this.mutableReadLanes=this.expiredLanes=this.pingedLanes=this.suspendedLanes=this.pendingLanes=0,this.entanglements=Zl(0),this.identifierPrefix=r,this.onRecoverableError=l,this.mutableSourceEagerHydrationData=null}function ia(e,t,n,r,l,i,o,a,u){return e=new mp(e,t,n,a,u),t===1?(t=1,i===!0&&(t|=8)):t=0,i=De(3,null,null,t),e.current=i,i.stateNode=e,i.memoizedState={element:r,isDehydrated:n,cache:null,transitions:null,pendingSuspenseBoundaries:null},Bo(i),e}function hp(e,t,n){var r=3<arguments.length&&arguments[3]!==void 0?arguments[3]:null;return{$$typeof:Kt,key:r==null?null:""+r,children:e,containerInfo:t,implementation:n}}function Lc(e){if(!e)return Et;e=e._reactInternals;e:{if(Qt(e)!==e||e.tag!==1)throw Error(k(170));var t=e;do{switch(t.tag){case 3:t=t.stateNode.context;break e;case 1:if(ke(t.type)){t=t.stateNode.__reactInternalMemoizedMergedChildContext;break e}}t=t.return}while(t!==null);throw Error(k(171))}if(e.tag===1){var n=e.type;if(ke(n))return Lu(e,n,t)}return t}function Dc(e,t,n,r,l,i,o,a,u){return e=ia(n,r,!0,e,l,i,o,a,u),e.context=Lc(null),n=e.current,r=me(),l=St(n),i=lt(r,l),i.callback=t??null,kt(n,i,l),e.current.lanes=l,vr(e,l,r),_e(e,r),e}function Ol(e,t,n,r){var l=t.current,i=me(),o=St(l);return n=Lc(n),t.context===null?t.context=n:t.pendingContext=n,t=lt(i,o),t.payload={element:e},r=r===void 0?null:r,r!==null&&(t.callback=r),e=kt(l,t,o),e!==null&&(He(e,l,o,i),Yr(e,l,o)),o}function Cl(e){if(e=e.current,!e.child)return null;switch(e.child.tag){case 5:return e.child.stateNode;default:return e.child.stateNode}}function vs(e,t){if(e=e.memoizedState,e!==null&&e.dehydrated!==null){var n=e.retryLane;e.retryLane=n!==0&&n<t?n:t}}function oa(e,t){vs(e,t),(e=e.alternate)&&vs(e,t)}function vp(){return null}var Ic=typeof reportError=="function"?reportError:function(e){console.error(e)};function aa(e){this._internalRoot=e}Fl.prototype.render=aa.prototype.render=function(e){var t=this._internalRoot;if(t===null)throw Error(k(409));Ol(e,t,null,null)};Fl.prototype.unmount=aa.prototype.unmount=function(){var e=this._internalRoot;if(e!==null){this._internalRoot=null;var t=e.containerInfo;Vt(function(){Ol(null,e,null,null)}),t[ot]=null}};function Fl(e){this._internalRoot=e}Fl.prototype.unstable_scheduleHydration=function(e){if(e){var t=fu();e={blockedOn:null,target:e,priority:t};for(var n=0;n<pt.length&&t!==0&&t<pt[n].priority;n++);pt.splice(n,0,e),n===0&&gu(e)}};function sa(e){return!(!e||e.nodeType!==1&&e.nodeType!==9&&e.nodeType!==11)}function $l(e){return!(!e||e.nodeType!==1&&e.nodeType!==9&&e.nodeType!==11&&(e.nodeType!==8||e.nodeValue!==" react-mount-point-unstable "))}function ys(){}function yp(e,t,n,r,l){if(l){if(typeof r=="function"){var i=r;r=function(){var c=Cl(o);i.call(c)}}var o=Dc(t,r,e,0,null,!1,!1,"",ys);return e._reactRootContainer=o,e[ot]=o.current,ir(e.nodeType===8?e.parentNode:e),Vt(),o}for(;l=e.lastChild;)e.removeChild(l);if(typeof r=="function"){var a=r;r=function(){var c=Cl(u);a.call(c)}}var u=ia(e,0,!1,null,null,!1,!1,"",ys);return e._reactRootContainer=u,e[ot]=u.current,ir(e.nodeType===8?e.parentNode:e),Vt(function(){Ol(t,u,n,r)}),u}function Ul(e,t,n,r,l){var i=n._reactRootContainer;if(i){var o=i;if(typeof l=="function"){var a=l;l=function(){var u=Cl(o);a.call(u)}}Ol(t,o,e,l)}else o=yp(n,t,e,l,r);return Cl(o)}cu=function(e){switch(e.tag){case 3:var t=e.stateNode;if(t.current.memoizedState.isDehydrated){var n=$n(t.pendingLanes);n!==0&&(jo(t,n|1),_e(t,G()),!(I&6)&&(xn=G()+500,Tt()))}break;case 13:Vt(function(){var r=at(e,1);if(r!==null){var l=me();He(r,e,1,l)}}),oa(e,1)}};Ro=function(e){if(e.tag===13){var t=at(e,134217728);if(t!==null){var n=me();He(t,e,134217728,n)}oa(e,134217728)}};du=function(e){if(e.tag===13){var t=St(e),n=at(e,t);if(n!==null){var r=me();He(n,e,t,r)}oa(e,t)}};fu=function(){return A};pu=function(e,t){var n=A;try{return A=e,t()}finally{A=n}};Di=function(e,t,n){switch(t){case"input":if(ji(e,n),t=n.name,n.type==="radio"&&t!=null){for(n=e;n.parentNode;)n=n.parentNode;for(n=n.querySelectorAll("input[name="+JSON.stringify(""+t)+'][type="radio"]'),t=0;t<n.length;t++){var r=n[t];if(r!==e&&r.form===e.form){var l=Pl(r);if(!l)throw Error(k(90));Vs(r),ji(r,l)}}}break;case"textarea":Qs(e,n);break;case"select":t=n.value,t!=null&&an(e,!!n.multiple,t,!1)}};qs=ta;eu=Vt;var xp={usingClientEntryPoint:!1,Events:[xr,qt,Pl,Zs,Js,ta]},An={findFiberByHostInstance:It,bundleType:0,version:"18.3.1",rendererPackageName:"react-dom"},wp={bundleType:An.bundleType,version:An.version,rendererPackageName:An.rendererPackageName,rendererConfig:An.rendererConfig,overrideHookState:null,overrideHookStateDeletePath:null,overrideHookStateRenamePath:null,overrideProps:null,overridePropsDeletePath:null,overridePropsRenamePath:null,setErrorHandler:null,setSuspenseHandler:null,scheduleUpdate:null,currentDispatcherRef:ut.ReactCurrentDispatcher,findHostInstanceByFiber:function(e){return e=ru(e),e===null?null:e.stateNode},findFiberByHostInstance:An.findFiberByHostInstance||vp,findHostInstancesForRefresh:null,scheduleRefresh:null,scheduleRoot:null,setRefreshHandler:null,getCurrentFiber:null,reconcilerVersion:"18.3.1-next-f1338f8080-20240426"};if(typeof __REACT_DEVTOOLS_GLOBAL_HOOK__<"u"){var $r=__REACT_DEVTOOLS_GLOBAL_HOOK__;if(!$r.isDisabled&&$r.supportsFiber)try{jl=$r.inject(wp),Ze=$r}catch{}}be.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED=xp;be.createPortal=function(e,t){var n=2<arguments.length&&arguments[2]!==void 0?arguments[2]:null;if(!sa(t))throw Error(k(200));return hp(e,t,null,n)};be.createRoot=function(e,t){if(!sa(e))throw Error(k(299));var n=!1,r="",l=Ic;return t!=null&&(t.unstable_strictMode===!0&&(n=!0),t.identifierPrefix!==void 0&&(r=t.identifierPrefix),t.onRecoverableError!==void 0&&(l=t.onRecoverableError)),t=ia(e,1,!1,null,null,n,!1,r,l),e[ot]=t.current,ir(e.nodeType===8?e.parentNode:e),new aa(t)};be.findDOMNode=function(e){if(e==null)return null;if(e.nodeType===1)return e;var t=e._reactInternals;if(t===void 0)throw typeof e.render=="function"?Error(k(188)):(e=Object.keys(e).join(","),Error(k(268,e)));return e=ru(t),e=e===null?null:e.stateNode,e};be.flushSync=function(e){return Vt(e)};be.hydrate=function(e,t,n){if(!$l(t))throw Error(k(200));return Ul(null,e,t,!0,n)};be.hydrateRoot=function(e,t,n){if(!sa(e))throw Error(k(405));var r=n!=null&&n.hydratedSources||null,l=!1,i="",o=Ic;if(n!=null&&(n.unstable_strictMode===!0&&(l=!0),n.identifierPrefix!==void 0&&(i=n.identifierPrefix),n.onRecoverableError!==void 0&&(o=n.onRecoverableError)),t=Dc(t,null,e,1,n??null,l,!1,i,o),e[ot]=t.current,ir(e),r)for(e=0;e<r.length;e++)n=r[e],l=n._getVersion,l=l(n._source),t.mutableSourceEagerHydrationData==null?t.mutableSourceEagerHydrationData=[n,l]:t.mutableSourceEagerHydrationData.push(n,l);return new Fl(t)};be.render=function(e,t,n){if(!$l(t))throw Error(k(200));return Ul(null,e,t,!1,n)};be.unmountComponentAtNode=function(e){if(!$l(e))throw Error(k(40));return e._reactRootContainer?(Vt(function(){Ul(null,null,e,!1,function(){e._reactRootContainer=null,e[ot]=null})}),!0):!1};be.unstable_batchedUpdates=ta;be.unstable_renderSubtreeIntoContainer=function(e,t,n,r){if(!$l(n))throw Error(k(200));if(e==null||e._reactInternals===void 0)throw Error(k(38));return Ul(e,t,n,!1,r)};be.version="18.3.1-next-f1338f8080-20240426";function Ac(){if(!(typeof __REACT_DEVTOOLS_GLOBAL_HOOK__>"u"||typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE!="function"))try{__REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE(Ac)}catch(e){console.error(e)}}Ac(),As.exports=be;var kp=As.exports,Mc,xs=kp;Mc=xs.createRoot,xs.hydrateRoot;const gr={REPORTS:{SERVICE_CALL_LOG:"Service_Call_Logs",SERVICE_REPORT:"All_Service_Reports",SERVICE_FEEDBACK:"All_Service_Feedback1",FIELD_EXECUTIVE:"Field_Executives",EMPLOYEES:"All_Employees",SERVICE_QUOTATION:"Service_Quotations",SERVICE_INVOICE:"Service_Invoice_Follow_up_Un_paid",REJECTION_REPLACEMENT:"Rejection_And_Replacement_Register_Report",STANDBY_UNIT:"Stand_By_Unit1",AMC_CONTRACT:"All_Amc_Contracts",PRODUCT:"All_Product",EXPENSE_ENGINEER:"Expense_of_Engineer_Report",REWORK:"All_Reworks",TRAINING_REPORT:"Training_Reports",TOOL_KIT:"Production_Tool_Kit_of_Engineers1",VEHICLE_SERVICE:"Vehicle_Service_Reports",INTERNAL_CALIBRATION:"Internal_Calibrations"},PAGE_SIZE:1e3,SERVICE_DEPARTMENT_ROLE_ID:"302392000000624113",WEEK_STARTS_ON:1},ie=gr.REPORTS,kr=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"],_p=["January","February","March","April","May","June","July","August","September","October","November","December"],Sp=864e5,wn=e=>String(e).padStart(2,"0"),mr=e=>new Date(e.getFullYear(),e.getMonth(),e.getDate()),En=(e,t)=>new Date(e.getFullYear(),e.getMonth(),e.getDate()+t),Cp=(e,t)=>new Date(e.getFullYear()+t,e.getMonth(),e.getDate()),je=e=>new Date(e.getFullYear(),e.getMonth(),1),Np=e=>new Date(e.getFullYear(),e.getMonth()+1,0),Oc=e=>new Date(e.getFullYear(),0,1),Fe=e=>En(mr(e),-((e.getDay()-gr.WEEK_STARTS_ON+7)%7)),ws=(e,t)=>e<t?e:t,Fc=(e,t)=>Math.round((mr(t)-mr(e))/Sp);function $c(e){if(e==null||e==="")return null;if(e instanceof Date)return Number.isNaN(e.getTime())?null:e;const t=String(e).trim(),n="(?:[ T,]+(\\d{1,2}):(\\d{2})(?::(\\d{2}))?)?";let r,l,i,o;if(r=t.match(new RegExp("^(\\d{4})[-/.](\\d{1,2})[-/.](\\d{1,2})"+n)))l=+r[1],i=+r[2]-1,o=+r[3];else if(r=t.match(new RegExp("^(\\d{1,2})[-/. ]([A-Za-z]{3,9})[-/. ,]+(\\d{2,4})"+n))){if(i=kr.findIndex(a=>a.toLowerCase()===r[2].slice(0,3).toLowerCase()),i<0)return null;o=+r[1],l=+r[3]}else if(r=t.match(new RegExp("^(\\d{1,2})[-/.](\\d{1,2})[-/.](\\d{2,4})"+n)))o=+r[1],i=+r[2]-1,l=+r[3];else return null;return l<100&&(l+=2e3),i<0||i>11||o<1||o>31?null:new Date(l,i,o,+(r[4]||0),+(r[5]||0),+(r[6]||0))}function Re(e){const t=$c(e);return t?mr(t):null}const Bl=(e,t)=>{const n=Re(e);return n!==null&&n.getTime()===t.getTime()},te=(e,t,n)=>{const r=Re(e);return r!==null&&r>=t&&r<=n},Ep=(e,t)=>{const n=Re(e);return n!==null&&n<=t},jp=(e,t)=>{const n=Re(e);return n!==null&&n>=t},Uc=e=>e?`${wn(e.getDate())}-${wn(e.getMonth()+1)}-${e.getFullYear()}`:"",Bc=e=>e?`${wn(e.getDate())}-${kr[e.getMonth()]}-${e.getFullYear()}`:"",Nl=e=>e?`${wn(e.getDate())} ${kr[e.getMonth()]} ${e.getFullYear()}`:"",Ur=e=>e?`${e.getFullYear()}-${wn(e.getMonth()+1)}-${wn(e.getDate())}`:"";function ks(e){if(!e)return null;const t=e.match(/^(\d{4})-(\d{2})-(\d{2})$/);if(!t)return null;const n=new Date(+t[1],+t[2]-1,+t[3]);return n.getFullYear()===+t[1]&&n.getMonth()===+t[2]-1&&n.getDate()===+t[3]?n:null}function _s(e,t){return e==="last7"?{from:En(t,-6),to:t}:e==="month"?{from:je(t),to:t}:{from:t,to:t}}const Wc=e=>e==null||e===""||Array.isArray(e)&&e.length===0||typeof e=="object"&&!Array.isArray(e)&&Object.keys(e).length===0,Z=e=>!Wc(e);function qe(e){return e==null||e===""?"":typeof e=="object"?e.ID!==void 0?String(e.ID):e.id!==void 0?String(e.id):"":String(e)}function T(e){if(e==null)return"";if(Array.isArray(e))return e.map(T).join(", ");if(typeof e=="object"){const t=e.display_value??e.zc_display_value;return t==null?"":String(t)}return String(e)}function Ae(e){if(e==null||e==="")return 0;const t=typeof e=="number"?e:Number(String(e).replace(/,/g,"").trim());return Number.isFinite(t)?t:0}function Wl(e){const t=T(e).trim();if(t==="")return NaN;const n=Number(t);return Number.isFinite(n)?n:NaN}const Rp=e=>e===!0||String(e).toLowerCase()==="true",kn=e=>Array.isArray(e)?e:[],Te=(e,t)=>e.reduce((n,r)=>n+t(r),0),R=(e,t=1)=>{const n=10**t;return Math.round((e+Number.EPSILON)*n)/n},ua=e=>T(e.Nature_Of_Calls);function ca(e,t){const n=new Map;return e.forEach(r=>{const l=t(r);n.set(l,(n.get(l)||0)+1)}),n}const yi=Bc,go={serviceCallLogs:{report:ie.SERVICE_CALL_LOG,label:"Service Call Log",stage:"today",criteria:e=>`(Date_field >= "${yi(ws(Oc(e),Fe(e)))}" || Status == "Pending")`,fields:["Date_field","Status","Customer_Name","Service_Engineer_Name","Nature_Of_Calls","Repeat_Call_Reason","Service_Call_Log_No"]},serviceReports:{report:ie.SERVICE_REPORT,label:"Service Report",stage:"today",criteria:e=>`(Call_Attended_Date >= "${yi(ws(Fe(e),je(e)))}" || Added_Time >= "${yi(je(e))} 00:00:00")`,fields:["Call_Attended_Date","Call_Received_Date","Service_Call_Log","Service_Engineer_Name","Status","Product","Added_Time","Spare_Replaced"]},feedbacks:{report:ie.SERVICE_FEEDBACK,label:"Service Feedback",stage:"today",fields:["Company_Name","Rating","Call_attended_date","Any_additional_comments_or_suggestions_would_be_appreciated1"]},fieldExecutives:{report:ie.FIELD_EXECUTIVE,label:"Field Executive",stage:"today",fields:["Date_field","Leave_Break","Employee_Name","Did_you_collect_google_rating"]},employees:{report:ie.EMPLOYEES,label:"Employees",stage:"today",fields:["Employee_Name","Department_Role"]},quotations:{report:ie.SERVICE_QUOTATION,label:"Service Quotation",stage:"today",fields:["Date_field","Status","Customer_Name","Nature_of_Calls"]},invoices:{report:ie.SERVICE_INVOICE,label:"Service Invoice",stage:"today",fields:["Date_field","Customer","Final_Total","Spare_Amount","Service_Amount","Service_Call_Log"]},replacements:{report:ie.REJECTION_REPLACEMENT,label:"Rejection & Replacement",stage:"weekly",fields:["Department","Date_field","Status"]},standbyUnits:{report:ie.STANDBY_UNIT,label:"Stand By Unit",stage:"weekly",fields:["StandBy_To","Outward_Date","Inward_Date"]},amcContracts:{report:ie.AMC_CONTRACT,label:"AMC Contract",stage:"weekly",fields:["Quotation_Number"]},products:{report:ie.PRODUCT,label:"Product",stage:"weekly",criteria:()=>"Is_Red_Tag_Material == true",fields:["Product_Name","Is_Red_Tag_Material"]},engineerExpenses:{report:ie.EXPENSE_ENGINEER,label:"Engineer Expense",stage:"monthly",fields:["Date_field1234567890","Service_Engineer_Name","Overall_Engineer","Material_Replaced1"]},reworks:{report:ie.REWORK,label:"Rework",stage:"monthly",fields:["Date_field","Approximate_Cost"]},trainingReports:{report:ie.TRAINING_REPORT,label:"Training Report",stage:"monthly",fields:["Report"]},toolReports:{report:ie.TOOL_KIT,label:"Tool Kit",stage:"monthly",fields:["Month_field","Status","Service_Tools_Kit_of_Engineers"]},vehicleReports:{report:ie.VEHICLE_SERVICE,label:"Vehicle Service",stage:"monthly",fields:["Month_field","Status","Service_Tools_Kit_of_Engineers|Report"]},calibrationRecords:{report:ie.INTERNAL_CALIBRATION,label:"Internal Calibration",stage:"monthly",fields:["UUC_E","Meter_Type","Meter_Make","Meter_S","Calibration_Type","Rev_Date","Approved_By","Tested_By","Rev_No"]}},Tp=e=>Object.keys(go).filter(t=>go[t].stage===e);let Ss=Promise.resolve();const xi=new Map,Mn={fieldConfig:"unknown"},_n={datasets:{},data:{},results:{}};_n.text=()=>Object.values(_n.results).flat().map(e=>`${e.tab}	${e.label}	${e.value}`).join(`
`);typeof window<"u"&&(window.__ADROIT_DEBUG__=_n);function bp(e){const t=Ss.then(e);return Ss=t.catch(()=>{}),t}function el(e){if(!e)return"unknown error";if(typeof e=="string")return e;if(e.message)return e.code?`${e.code}: ${e.message}`:e.message;try{return JSON.stringify(e)}catch{return String(e)}}async function wi(e,t,n){const r=[];let l=null;do{const i={report_name:e,max_records:gr.PAGE_SIZE};n&&(i.field_config="all"),t&&(i.criteria=t),l&&(i.record_cursor=l);const o=await window.ZOHO.CREATOR.DATA.getRecords(i),a=(o==null?void 0:o.data)||[];r.push(...a),l=(o==null?void 0:o.record_cursor)||null,!l&&a.length>=gr.PAGE_SIZE&&console.warn(`[Creator] ${e}: got ${a.length} records and no record_cursor - the list may be truncated.`)}while(l);return r}async function Pp(e,t,n){const r=Mn.fieldConfig!=="unsupported";try{const l=await wi(e.report,t,r);return r&&(Mn.fieldConfig="ok"),l}catch(l){n.error=el(l)}if(t){n.criteriaRejected=!0;try{const l=await wi(e.report,"",r);return r&&(Mn.fieldConfig="ok"),l}catch(l){n.error=el(l)}}if(r&&Mn.fieldConfig!=="ok")try{const l=await wi(e.report,"",!1);return Mn.fieldConfig="unsupported",n.fieldConfigRejected=!0,l}catch(l){n.error=el(l)}return[]}function zp(e,t,n){if(!n.length||!t.fields)return;const r=new Set;n.forEach(i=>Object.keys(i||{}).forEach(o=>r.add(o)));const l=t.fields.filter(i=>!i.split("|").some(o=>r.has(o)));l.length&&console.warn(`[Creator] ${e} (${t.report}): field(s) not returned - ${l.join(", ")}. Check the field link names / the report's columns. Returned fields: `+[...r].join(", "))}async function Lp(e,t,n){const r=Date.now(),l={report:t.report,criteria:n||null,count:0,ms:0,error:null,criteriaRejected:!1,fieldConfigRejected:!1},i=await Pp(t,n,l);l.count=i.length,l.ms=Date.now()-r,i.length&&(l.error=null),_n.datasets[e]=l,_n.data[e]=i;{const o=[];l.criteriaRejected&&o.push("criteria rejected -> loaded unfiltered"),l.fieldConfigRejected&&o.push("field_config rejected"),i.length||o.push(l.error?`no records (${l.error})`:"no records"),console.log(`[Creator] ${t.label} (${t.report}): ${i.length} records in ${l.ms} ms`+(o.length?` - ${o.join("; ")}`:"")),zp(e,t,i)}return i}function Dp(e,t){const n=go[e],r=n.criteria?n.criteria(t):"",l=`${e}|${r}`;return xi.has(l)||xi.set(l,bp(()=>Lp(e,n,r))),xi.get(l)}const Vc=e=>(e.employees||[]).filter(t=>qe(t.Department_Role)===gr.SERVICE_DEPARTMENT_ROLE_ID);function Dt(e,t,n){let r=R(e*n/t,1);return e>0&&r<10&&(r=10),r===0&&(r=2),r}function Ip(e,t){const n=e.serviceCallLogs||[],r=e.feedbacks||[],l=f=>Bl(f,t),i=n.filter(f=>l(f.Date_field)).length,o=["Emergency Leave","Informed Leave"],a=(e.fieldExecutives||[]).filter(f=>l(f.Date_field)&&!o.includes(T(f.Leave_Break))).length,u=new Set(n.filter(f=>T(f.Status)==="Completed").map(f=>String(f.ID))),c=new Set;(e.serviceReports||[]).forEach(f=>{if(!l(f.Call_Attended_Date))return;const y=qe(f.Service_Call_Log);y&&u.has(y)&&c.add(y)});const g=(e.quotations||[]).filter(f=>l(f.Date_field)&&T(f.Status)==="Sent").length,m=r.filter(f=>Z(f.Company_Name)&&l(f.Call_attended_date)).length,h=En(t,-2),v=n.filter(f=>T(f.Status)==="Pending"&&Ep(f.Date_field,h)).length,x=(f,y)=>T(f.Rating)===y,w=r.filter(f=>x(f,"2")||x(f,"1")&&l(f.Call_attended_date)).length,D=ca(n.filter(f=>l(f.Date_field)&&T(f.Status)==="Pending"),f=>qe(f.Customer_Name));let p=0;D.forEach((f,y)=>{y&&f>=2&&(p+=1)});const d=(e.invoices||[]).filter(f=>l(f.Date_field)&&Z(f.Customer));return{total_calls_today:i,executives_act_today:a,service_reports_submitted_count:c.size,quot_sent_today:g,cust_feedback_rec:m,pending_calls:v,customer_regret_cases_count:w,repeated_calls_count:p,invoices_gen_today:d.length,total_invoiced_amt_today:R(Te(d,f=>Ae(f.Final_Total)),2)}}function Ap(e,t){const n=(e.serviceReports||[]).filter(i=>Bl(i.Call_Attended_Date,t)),r=Vc(e).map(i=>{const o=n.filter(a=>qe(a.Service_Engineer_Name)===String(i.ID));return{Engineer_Name:T(i.Employee_Name),assignedToday:o.length,completedToday:o.filter(a=>T(a.Status)==="Completed").length}});let l=0;return r.forEach(i=>{l=Math.max(l,i.assignedToday,i.completedToday)}),l===0?l=1:l<10&&(l=10),r.map(i=>({...i,assignedHeight:Dt(i.assignedToday,l,155),completedHeight:Dt(i.completedToday,l,155)}))}function Mp(e,t){const n=(e.invoices||[]).filter(m=>Bl(m.Date_field,t)),r=e.serviceCallLogs||[],l=new Map(r.map(m=>[String(m.ID),m])),i=new Map(r.map(m=>[T(m.Service_Call_Log_No),m]));let o=0,a=0,u=0;n.forEach(m=>{const h=l.get(qe(m.Service_Call_Log))||i.get(T(m.Service_Call_Log)),v=h?ua(h):"",x=Ae(m.Final_Total);v==="AMC"?o+=x:v==="Installation"?a+=x:v==="Repair"&&(u+=x)});const c={amc_amt:R(o,2),installtion_amt:R(a,2),repair_amt:R(u,2),service_amt:R(Te(n,m=>Ae(m.Service_Amount)),2),spares_amt:R(Te(n,m=>Ae(m.Spare_Amount)),2)};let g=Math.max(0,...Object.values(c));return g===0?g=1:g<1e4&&(g=1e4),{...c,amc_height:Dt(c.amc_amt,g,180),install_height:Dt(c.installtion_amt,g,180),repair_height:Dt(c.repair_amt,g,180),service_height:Dt(c.service_amt,g,180),spares_height:Dt(c.spares_amt,g,180)}}function Op(e,t){let n=0,r=0,l=0,i=0;(e.serviceCallLogs||[]).filter(a=>Bl(a.Date_field,t)).forEach(a=>{const u=T(a.Repeat_Call_Reason);u!==""&&(i+=1,u==="Lack of Knowledge"?n+=1:u==="Parts Unavailability"?r+=1:u==="Power Issue"&&(l+=1))});const o=a=>i>0?a*100/i:0;return{lackOfKnowledge:o(n),partsUnavailability:o(r),powerIssue:o(l),totalRepeatCalls:i}}function Fp(e){const t=(e.feedbacks||[]).filter(r=>Z(r.Company_Name)&&Z(r.Rating));if(!t.length)return{average_rating:0,percentage:0,total_count:0};const n=Te(t,r=>Ae(r.Rating))/t.length;return{average_rating:R(n,1),percentage:R(n/5*100,1),total_count:t.length}}function $p(e,t){const n=Fe(t);return(e.fieldExecutives||[]).filter(r=>te(r.Date_field,n,t)&&Z(r.Employee_Name)&&T(r.Did_you_collect_google_rating)==="Yes").length}function Up(e,t){const n=Fe(t),r=(e.serviceCallLogs||[]).filter(a=>te(a.Date_field,n,t)),l=Vc(e);let i=0;const o=l.map(a=>{const u=r.filter(w=>qe(w.Service_Engineer_Name)===String(a.ID)),c=u.length,g=u.filter(w=>T(w.Status)==="Completed").length,m=u.filter(w=>T(w.Status)==="Pending").length;i+=c;let h=0,v=0;c>0&&(h=R(g*100/c,1),v=R(m*100/c,1)),g>0&&h<5&&(h=5),m>0&&v<5&&(v=5);const x=h+v;return x>100&&(h=R(h*100/x,1),v=R(v*100/x,1)),{engineer_id:a.ID,engineer_name:T(a.Employee_Name),total_calls_this_week:c,calls_completed:g,calls_pending:m,completed_height:h,pending_height:v}});return{from_date:n,to_date:t,per_engineer:o,total_calls:i,num_engineers:l.length,average_calls_per_engineer_week:l.length>0?R(i/l.length,1):0}}function Bp(e,t){const n=En(t,-6),r=(e.serviceCallLogs||[]).filter(i=>Z(i.Customer_Name)&&te(i.Date_field,n,t)&&T(i.Status)!=="Pending");if(r.length===0)return 0;let l=0;return ca(r,i=>qe(i.Customer_Name)).forEach(i=>{i>1&&(l+=i)}),R(l*100/r.length,1)}function Wp(e,t){const n=Fe(t),r=(e.feedbacks||[]).filter(i=>Z(i.Company_Name)&&te(i.Call_attended_date,n,t));return r.length===0?0:r.filter(i=>["1","2","3"].includes(T(i.Rating))).length*100/r.length}function Vp(e,t){const n=Fe(t);return(e.serviceCallLogs||[]).filter(r=>ua(r)==="AMC"&&te(r.Date_field,n,t)&&T(r.Status)==="Completed").length}function Hp(e,t){const n=Fe(t);return(e.replacements||[]).filter(r=>T(r.Department)==="Service"&&te(r.Date_field,n,t)&&T(r.Status)==="Pending").length}function Qp(e,t){const n=Fe(t);return(e.standbyUnits||[]).filter(r=>Z(r.StandBy_To)&&te(r.Outward_Date,n,t)&&Wc(r.Inward_Date)).length}function Yp(e,t){const n=je(t),r=(e.serviceCallLogs||[]).filter(i=>T(i.Status)==="Pending"),l=[];return[0,7,14,21].forEach(i=>{const o=En(t,-i);if(i>0&&o<n)return;let a=Fe(o);a<n&&(a=n);let u=0,c=0,g=0;r.filter(m=>te(m.Date_field,a,o)).forEach(m=>{const h=Math.abs(Fc(o,Re(m.Date_field)));h<=2?u+=1:h<=5?c+=1:g+=1}),l.push({"0-2_Days":u,"3-5_Days":c,above_5_Days:g,Total:u+c+g})}),l}function Kp(e,t){const n=Fe(t),r=(e.quotations||[]).filter(u=>Z(u.Customer_Name)&&T(u.Nature_of_Calls)==="AMC"&&te(u.Date_field,n,t)),l=new Set((e.amcContracts||[]).map(u=>qe(u.Quotation_Number))),i=r.filter(u=>l.has(String(u.ID))).length,o=r.length,a=o-i;return{week_start:n,week_end:t,total:o,closed:i,pending:a,closed_percent:o>0?R(i*100/o,1):0,pending_percent:o>0?R(a*100/o,1):0}}function Xp(e,t){const n=je(t),r=Np(t),l=new Set((e.products||[]).filter(o=>Rp(o.Is_Red_Tag_Material)).map(o=>T(o.Product_Name))),i=[0,0,0,0];return(e.serviceReports||[]).forEach(o=>{const a=Re(o.Call_Attended_Date);if(!a||a<n||a>r)return;const u=T(o.Product);u===""||!l.has(u)||(i[Math.min(3,Math.floor(Fc(n,a)/7))]+=1)}),{week1:i[0],week2:i[1],week3:i[2],week4:i[3],maxValue:Math.max(1,...i)}}function Gp(e,t){const n=(e.feedbacks||[]).filter(l=>Z(l.Company_Name)),r=[];return[1,2,3,4].forEach(l=>{const i=En(t,-(l-1)*7),o=Fe(i),a=n.filter(g=>te(g.Call_attended_date,o,i));let u=0;a.length>0&&(u=R(Te(a,g=>Ae(g.Rating))/a.length,1));let c=R(u/5*150,1);u>0&&c<10&&(c=10),r.push({week_number:l,week_label:`Week ${l}`,average_rating:u,total_feedback:a.length,bar_height:c})}),r.reverse()}function Zp(e){return(e.feedbacks||[]).filter(t=>Z(t.Company_Name)).slice(0,5).map(t=>{const n=T(t.Any_additional_comments_or_suggestions_would_be_appreciated1),r=Wl(t.Rating);return{id:t.ID,created_date:Re(t.Call_attended_date),customer_name:T(t.Company_Name),rating:Number.isFinite(r)?r:0,comments:n!==""?n:"No comments"}})}function Jp(e,t){const n=Fe(t),r=(e.serviceReports||[]).filter(o=>Z(o.Call_Received_Date)&&Z(o.Service_Call_Log)&&te(o.Call_Attended_Date,n,t));if(r.length===0)return"0";let l=0,i=0;return r.forEach(o=>{const a=Re(o.Call_Received_Date),u=Re(o.Call_Attended_Date);if(!a||!u)return;const c=(u-a)/36e5;c>=0&&(l+=c,i+=1)}),i>0?String(R(l/i,1)):"0"}function qp(e,t){const n=je(t);let r=0,l=0,i=0;return(e.serviceCallLogs||[]).filter(o=>te(o.Date_field,n,t)).forEach(o=>{const a=ua(o);a==="Warranty"?r+=1:a==="PW"?l+=1:a==="AMC"&&(i+=1)}),{warranty_count:r,post_warranty:l,amc_count:i,warranty_amount:0,post_warranty_amount:0}}const Hc=(e,t,n)=>(e.engineerExpenses||[]).filter(r=>te(r.Date_field1234567890,t,n)),Qc=(e,t,n)=>Te((e.reworks||[]).filter(r=>te(r.Date_field,t,n)),r=>Ae(r.Approximate_Cost));function eg(e,t){const n=je(t),r=Te(Hc(e,n,t),l=>Te(kn(l.Material_Replaced1),i=>Ae(i.Engineer_Expenses)));return R(r+Qc(e,n,t),2)}function tg(e,t){const n=je(t),r=(e.serviceCallLogs||[]).filter(i=>Z(i.Customer_Name)&&te(i.Date_field,n,t)&&T(i.Status)==="Pending");let l=0;return ca(r,i=>qe(i.Customer_Name)).forEach(i=>{i>1&&(l+=1)}),{repead_calls:l}}function ng(e,t){const n=je(t);return(e.serviceReports||[]).filter(r=>T(r.Status)==="Pending For Spares"&&te(r.Call_Attended_Date,n,t)).length}function rg(e,t){const n=je(t);let r=0;return(e.trainingReports||[]).forEach(l=>{kn(l.Report).forEach(i=>{te(i.Date_field,n,t)&&(r+=Ae(i.Total_Hours))})}),R(r,2)}function lg(e,t){const n=_p[t.getMonth()],r=(u,c)=>{let g=0,m=0;return u.filter(h=>T(h.Month_field)===n).forEach(h=>{const v=c.find(w=>kn(h[w]).length>0),x=v?kn(h[v]):[];g+=x.length,T(h.Status)==="Approved"&&(m+=x.length)}),{required:g,completed:m}},l=r(e.toolReports||[],["Service_Tools_Kit_of_Engineers"]),i=r(e.vehicleReports||[],["Service_Tools_Kit_of_Engineers","Report"]),o=l.required+i.required,a=l.completed+i.completed;return{tool_required:l.required,tool_completed:l.completed,vehicle_required:i.required,vehicle_completed:i.completed,total_required:o,total_completed:a,compliance_percentage:o>0?R(a/o*100,2):0}}function ig(e){const t=(e.feedbacks||[]).filter(r=>Z(r.Company_Name));if(t.length===0)return{positive_feedback_percentage:0,avg_feedback:0};const n=t.filter(r=>Wl(r.Rating)>=4).length;return{positive_feedback_percentage:R(n*100/t.length,1),avg_feedback:R(Te(t,r=>Ae(r.Rating))/t.length,1)}}function og(e,t){const n=je(t);let r=0,l=0,i=0;(e.serviceReports||[]).forEach(u=>{const c=$c(u.Added_Time);!c||c<n||c>t||kn(u.Spare_Replaced).forEach(g=>{if(!te(g.Date_field,n,t))return;const m=T(g.Nature_of_Calls);m==="AMC"?r+=1:m==="PW"?l+=1:m==="Warranty"&&(i+=1)})});const o=r+l+i,a=u=>o>0?u/o*100:0;return{amc_percentage:a(r),pw_percentage:a(l),w_percentage:a(i),has_data:o>0}}function ag(e,t){const n=je(t),r=Hc(e,n,t).filter(u=>Z(u.Service_Engineer_Name)),l=Qc(e,n,t);let i=0,o=0;r.forEach(u=>{i+=Te(kn(u.Material_Replaced1),c=>Ae(c.Direct_Expense)),o+=Ae(u.Overall_Engineer),o+=l});const a=i+o;return{direct_expense:R(i,2),indirect_expense:R(o,2),total_expense:R(a,2),direct_percent:a>0?R(i*100/a,1):0,indirect_percent:a>0?R(o*100/a,1):0}}function sg(e,t){const n=Oc(t),r=Array.from({length:12},()=>new Map);return(e.serviceCallLogs||[]).filter(l=>te(l.Date_field,n,t)&&T(l.Status)!=="Pending"&&Z(l.Customer_Name)).forEach(l=>{const i=r[Re(l.Date_field).getMonth()],o=qe(l.Customer_Name);i.set(o,(i.get(o)||0)+1)}),kr.slice(0,t.getMonth()+1).map((l,i)=>{let o=0;return r[i].forEach(a=>{a>1&&(o+=a)}),{month:l,repeat_calls:o}})}function ug(e,t){const n=t.getFullYear(),r=kr.map(o=>({name:o,total:0,count:0}));(e.feedbacks||[]).forEach(o=>{const a=Re(o.Call_attended_date);if(!a||a.getFullYear()!==n)return;const u=Wl(o.Rating);!Number.isFinite(u)||u<=0||u>5||(r[a.getMonth()].total+=u,r[a.getMonth()].count+=1)});const l=Te(r,o=>o.total),i=Te(r,o=>o.count);return{months:r.map(o=>({name:o.name,average:o.count>0?R(o.total/o.count,2):0,count:o.count})),overall_average:i>0?R(l/i,2):0,overall_count:i}}function cg(e,t){const n=je(t);return(e.feedbacks||[]).filter(r=>jp(r.Call_attended_date,n)&&Z(r.Company_Name)&&Wl(r.Rating)<=3).map(r=>({customer_name:T(r.Company_Name),customer_feedback:T(r.Any_additional_comments_or_suggestions_would_be_appreciated1),feedback_date:Re(r.Call_attended_date)}))}function dg(e,t){const n=t.getMonth(),r=t.getFullYear();return(e.calibrationRecords||[]).map(l=>{let i=T(l.UUC_E);i===""&&(i=`${T(l.Meter_Type)} - ${T(l.Meter_Make)}`);let o=T(l.Calibration_Type);o===""&&(o="Calibration Report");const a=Re(l.Rev_Date);let u=null,c=!1,g=!1;a&&(u=Cp(a,1),c=u.getMonth()===n&&u.getFullYear()===r,g=u<t);let m="Not Assigned";Z(l.Approved_By)?m=T(l.Approved_By):Z(l.Tested_By)&&(m=T(l.Tested_By));let h="Pending",v="orange";return Z(l.Approved_By)?c?(h="Completed",v="green"):(h="Up to Date",v="blue"):g&&(h="Overdue",v="red"),{equipment:i,report_type:o,last_service_date:a?Nl(a):"N/A",next_service_date:u?Nl(u):"N/A",is_due_this_month:c,is_overdue:g,service_person:m,status:h,status_color:v}})}function fg(e,t){return{tiles:Ip(e,t),executives:Ap(e,t),invoiceTrend:Mp(e,t),repeatReasons:Op(e,t),feedbackTrend:Fp(e)}}function pg(e,t){const n=Gp(e,t),r=n.filter(o=>o.average_rating>0),l=r.length>0?R(Te(r,o=>o.average_rating)/r.length,1):0,i=Math.floor(l);return{googleReviews:$p(e,t),engineer:Up(e,t),avgResponseTime:Jp(e,t),repeatCallPercent:Bp(e,t),regretPercent:Wp(e,t),amcLeads:Vp(e,t),pendingReplacements:Hp(e,t),standbyPending:Qp(e,t),aging:Yp(e,t),amc:Kp(e,t),redTag:Xp(e,t),satisfaction:n,overallAvg:l,fullStars:i,hasHalfStar:l-i>=.5,recentFeedbacks:Zp(e)}}function gg(e,t){return{callLogs:qp(e,t),indirectExpense:eg(e,t),repeatCalls:tg(e,t).repead_calls,stockDelays:ng(e,t),trainingHours:rg(e,t),compliance:lg(e,t),positiveFeedback:ig(e),costByCategory:og(e,t),expense:ag(e,t),repeatTrend:sg(e,t),satisfaction:ug(e,t),complaints:cg(e,t),calibration:dg(e,t)}}function mg(e,t){const n=[],r=(l,i)=>n.push({tab:e,label:l,value:String(i)});if(e==="today"){const l=t.tiles;r("Total Calls Logged Today",l.total_calls_today),r("Service Executives Active Today",l.executives_act_today),r("Service Reports Submitted",l.service_reports_submitted_count),r("Quotations Sent Today",l.quot_sent_today),r("Customer Feedbacks Collected",l.cust_feedback_rec),r("Pending Calls > 48 Hrs",l.pending_calls),r("Customer Regret Cases",l.customer_regret_cases_count),r("Repeat Calls Logged",l.repeated_calls_count),r("Invoices Generated Today",l.invoices_gen_today),r("Invoice Amounts (₹)",l.total_invoiced_amt_today),t.executives.forEach(u=>r(`Executive ${u.Engineer_Name}: assigned / closed`,`${u.assignedToday} / ${u.completedToday}`));const i=t.invoiceTrend;r("Invoice Amount Trend: AMC",i.amc_amt),r("Invoice Amount Trend: Install",i.installtion_amt),r("Invoice Amount Trend: Repair",i.repair_amt),r("Invoice Amount Trend: Service",i.service_amt),r("Invoice Amount Trend: Spares",i.spares_amt);const o=t.repeatReasons;r("Repeat Calls Reason: total calls",o.totalRepeatCalls),r("Repeat Calls Reason: Lack of Knowledge %",R(o.lackOfKnowledge,1)),r("Repeat Calls Reason: Parts Unavailability %",R(o.partsUnavailability,1)),r("Repeat Calls Reason: Power Issue %",R(o.powerIssue,1));const a=t.feedbackTrend;r("Service Feedback Trend: average rating",a.average_rating),r("Service Feedback Trend: percent",`${a.percentage}%`),r("Service Feedback Trend: feedback count",a.total_count)}if(e==="weekly"&&(r("Avg Calls Attended per Engineer",t.engineer.average_calls_per_engineer_week),r("Average Response Time (hrs)",t.avgResponseTime),r("Repeat Call %",`${t.repeatCallPercent.toFixed(1)}%`),r("Customer Regret %",`${R(t.regretPercent,2).toFixed(2)}%`),r("Google Review Collection %",`${t.googleReviews}%`),r("AMC Leads Generated",t.amcLeads),r("Pending Replacements",t.pendingReplacements),r("Standby Units Pending Collection",t.standbyPending),t.engineer.per_engineer.forEach(l=>r(`Engineer-wise Call Volume ${l.engineer_name}: total / completed / pending`,`${l.total_calls_this_week} / ${l.calls_completed} / ${l.calls_pending}`)),r("Customer Satisfaction: average rating",t.overallAvg),t.satisfaction.forEach(l=>r(`Weekly Rating Trend ${l.week_label} (${l.total_feedback} feedbacks)`,l.average_rating)),r("Recent Feedbacks: rows shown",t.recentFeedbacks.length),t.aging.forEach((l,i)=>r(`Pending Call Ageing Week ${i+1}: 0-2 / 3-5 / >5 days`,`${l["0-2_Days"]} / ${l["3-5_Days"]} / ${l.above_5_Days}`)),r("AMC Offer vs Closed: offered",t.amc.total),r("AMC Offer vs Closed: closed",t.amc.closed),r("AMC Offer vs Closed: closed %",`${t.amc.closed_percent}%`),r("Red Tag Item Trend: Week 1",t.redTag.week1),r("Red Tag Item Trend: Week 2",t.redTag.week2),r("Red Tag Item Trend: Week 3",t.redTag.week3),r("Red Tag Item Trend: Week 4",t.redTag.week4)),e==="monthly"){r("Total Calls Logged: Warranty",t.callLogs.warranty_count),r("Total Calls Logged: Post Warranty",t.callLogs.post_warranty),r("Total Calls Logged: AMC",t.callLogs.amc_count),r("Expenses for Complaints: Warranty Expense",t.callLogs.warranty_amount),r("Expenses for Complaints: Post Warranty",t.callLogs.post_warranty_amount),r("Indirect Expenses",t.indirectExpense),r("Repeat Call Analysis (calls)",t.repeatCalls),r("Stock Unavailability Delays (cases)",t.stockDelays),r("Training Hours Conducted (hrs)",t.trainingHours),r("Tool & Vehicle Inspections Completed",`${t.compliance.compliance_percentage}%`),r("Customer Feedback Summary: average",t.positiveFeedback.avg_feedback),r("Customer Feedback Summary: % positive",`${t.positiveFeedback.positive_feedback_percentage}%`);const l=t.expense;r("Expense Breakdown: Direct",`${l.direct_expense} (${l.direct_percent}%)`),r("Expense Breakdown: Indirect",`${l.indirect_expense} (${l.indirect_percent}%)`);const i=t.costByCategory;r("Complaint Cost by Category: has data",i.has_data),r("Complaint Cost by Category: Under Warranty %",R(i.w_percentage,1)),r("Complaint Cost by Category: Post Warranty %",R(i.pw_percentage,1)),r("Complaint Cost by Category: AMC %",R(i.amc_percentage,1)),t.repeatTrend.forEach(o=>r(`Repeat Call Trend ${o.month}`,o.repeat_calls)),r("Customer Satisfaction: average rating",t.satisfaction.overall_average),r("Customer Satisfaction: reviews",t.satisfaction.overall_count),r("Recent Complaints: rows shown",t.complaints.length),t.calibration.forEach(o=>r(`Calibration: ${o.equipment}`,`${o.status} (next ${o.next_service_date})`))}return n}const hg=`
/* ================= TABS ================= */
.tab-container {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    max-width: 100%;
    margin: 0;
    padding: 0;
}
.tab-input { display: none; }
.tab-buttons {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    margin-bottom: 0;
    padding: 0;
    list-style: none;
}
.tab-label {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 10px 20px;
    background: #91b6ff;
    border-radius: 6px;
    cursor: pointer;
    font-weight: 600;
    font-size: 14px;
    color: #374151;
    transition: all 0.3s ease;
}
.tab-label:hover { background: #d1d5db; }
.tab-input:checked + label.tab-label {
    background-color: #2563eb !important;
    color: #ffffff !important;
}
.tab-content {
    display: none;
    padding: 20px;
    border: 1px solid #ddd;
    border-radius: 8px;
    background: #f4f7fb;
    margin-top: 20px;
}
#tab1:checked ~ .tab-contents #content1,
#tab2:checked ~ .tab-contents #content2,
#tab3:checked ~ .tab-contents #content3 { display: block; }

/* ================= RESPONSIVE ================= */
@media (max-width:1000px){ .kpi-row{ grid-template-columns: repeat(3, 1fr); } .main-grid{ grid-template-columns:1fr; } }
@media (max-width:640px){ .kpi-row{ grid-template-columns:repeat(2,1fr); } .donut-wrapper{ flex-direction:column; gap:20px; } }

/* ================= BODY ================= */
body{margin:0;padding:0;font-family:'Poppins',sans-serif;background:#f4f7fb;color:#0f172a;line-height:1.4;}

/* ================= TODAY DASHBOARD ================= */
header{padding:18px 26px;background:#fff;box-shadow:0 1px 4px rgba(0,0,0,0.05);display:flex;justify-content:space-between;align-items:center;}
  header h1{font-size:18px;font-weight:600;}
  header .date{font-size:13px;color:#6b7280;}
  .container{
   /* max-width:1400px; */
    margin:18px auto;
    width: 100%;
      max-width: inherit;
    }
  
  /* COUNT TILES */
  .tiles{display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:14px;margin-bottom:18px;}
  .tile{background:#fff;padding:14px;border-radius:12px;box-shadow:0 6px 12px rgba(16,24,40,0.04);}
  .tile .label{font-size:13px;color:#6b7280;margin-bottom:6px;}
  .tile .value{font-weight:700;font-size:20px;margin-bottom:4px;text-align: center;}

  .red{color:#ef4444;}

  /* CHARTS */
  .charts{display:grid;grid-template-columns:2fr 1fr;gap:14px;}
  .card{background:#fff;padding:16px;border-radius:12px;box-shadow:0 6px 12px rgba(16,24,40,0.04);}
  .card h3{font-size:16px;margin-bottom:12px;}

  /* VERTICAL BAR CHART */
  .legend{display:flex;gap:20px;margin-bottom:20px;}
  .legend span{display:flex;align-items:center;gap:6px;font-size:14px;}
  .dot{width:14px;height:14px;border-radius:3px;}
  .assigned-dot{background:#3b82f6;}
  .closed-dot{background:#16a34a;}

  .bar-chart-row{
    display:flex;
    align-items:flex-end;
    justify-content:space-around;
    height:200px;
    gap:20px;
    border-left:1px solid #ccc;
    border-bottom:1px solid #ccc;
    padding-bottom:10px;
}
.bar-group{
    display:flex;
    flex-direction:column;
    align-items:center;
    gap:6px;
}
.bars{
    display:flex;
    gap:6px;
    align-items:flex-end;
    height:180px;
}
.bar-container{
    display:flex;
    flex-direction:column;
    align-items:center;
}
.bar{
    width:30px;
    border-radius:6px 6px 0 0;
}
/* ===== BAR CHART ANIMATION (CSS ONLY) ===== */
.bar {
    transform-origin: bottom;
    transform: scaleY(0);
    animation: grow 1.4s ease-out forwards;
}

/* Delay each bar slightly using nth-child */
.bar-container:nth-child(1) .bar {
    animation-delay: .1s;
}
.bar-container:nth-child(2) .bar {
    animation-delay: .2s;
}

@keyframes grow {
    to { transform: scaleY(1); }
}
.assigned{background:#3b82f6;}
.closed{background:#16a34a;}
.exec-label{font-size:14px;margin-top:6px;text-align:center;}

/* Number on top of each bar */
.bar-number{
    font-size:12px;
    font-weight:600;
    color:#0f172a;
    margin-bottom:4px;
}

  /* Placeholders for other charts */
  .line-chart,.pie-chart,.gauge-chart{height:120px;background:linear-gradient(90deg,#2463eb,#9db9ff);border-radius:6px;}
  .small-cards{display:flex;flex-direction:column;gap:12px;}
  table{width:100%;border-collapse:collapse;}
  th,td{padding:8px 10px;text-align:left;border-bottom:1px solid rgba(15,23,42,0.05);font-size:13px;}
  th{color:#6b7280;font-weight:600;}

  @media(max-width:900px){.charts{grid-template-columns:1fr;}}
.pie-chart{
  width:150px;
  height:150px;
  border-radius:50%;
  margin:auto;
  position:relative;
  /* Using CSS variables to define slices dynamically */
  --k: calc(var(--knowledge) * 1%);
  --p: calc(var(--parts) * 1%);
  --pw: calc(var(--power) * 1%);
  background:
    conic-gradient(
      #3b82f6 0% var(--k),
      #16a34a var(--k) calc(var(--k) + var(--p)),
      #f59e0b calc(var(--k) + var(--p)) 100%
    );
}

.pie-chart .label{
  position:absolute;
  font-size:12px;
  font-weight:600;
  color:#fff;
  text-shadow:0 0 3px rgba(0,0,0,0.5);
  display:flex;
  align-items:center;
  justify-content:center;
  width:35px;
  height:20px;
  border-radius:6px;
}
/* ===== PIE CHART ANIMATION (CSS ONLY) ===== */
.pie-chart {
    transform: rotate(-90deg);
    animation: pieSpin 1.2s ease-out forwards;
}

@keyframes pieSpin {
    to { transform: rotate(0deg); }
}
.pie-chart .knowledge{top:20px;left:50%;}
.pie-chart .parts{bottom:90px;left:30px;}
.pie-chart .power{bottom:30px;right:70px;}

.legend{
  display:flex;
  justify-content:space-around;
  font-size:13px;
  gap:5px;
}
.dot{
  width:14px;
  height:14px;
  border-radius:50%;
  display:inline-block;
  margin-right:6px;
}
  /* -------------------- gauge-cnt2 -------------------- */
    .gauge-cnt2-wrapper {
      flex: 0 0 240px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }

    .gauge-cnt2-container {
      position: relative;
      width: 450px;
      height: 170px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
      border-radius: 20px;
      padding: 20px;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
    }

    .gauge-cnt2-arc-container {
      position: relative;
      width: 160px;
      height: 80px;
    }

    .gauge-cnt2-bg-arc {
      width: 160px;
      height: 80px;
      border-radius: 80px 80px 0 0;
      background: #e8ecef;
      position: relative;
      overflow: hidden;
    }

    .gauge-cnt2-progress-arc {
      position: absolute;
      bottom: 0;
      left: 0;
      width: 160px;
      height: 80px;
      border-radius: 80px 80px 0 0;
      background: linear-gradient(90deg, #ff6b6b 0%, #feca57 25%, #48dbfb 50%, #1dd1a1 75%, #10ac84 100%);
      clip-path: polygon(0 100%,
          0 0,
          calc(var(--percentage, 0) * 1%) 0,
          calc(var(--percentage, 0) * 1%) 100%);
      animation: fillgauge-cnt2Arc 2s ease-out forwards;
    }

    @keyframes fillgauge-cnt2Arc {
      from {
        clip-path: polygon(0 100%, 0 100%, 0 100%, 0 100%);
      }

      to {
        clip-path: polygon(0 100%,
            0 0,
            calc(var(--percentage, 0) * 1%) 0,
            calc(var(--percentage, 0) * 1%) 100%);

      }
    }

    .gauge-cnt2-inner-cutout {
      position: absolute;
      bottom: 0;
      left: 50%;
      transform: translateX(-50%);
      width: 120px;
      height: 60px;
      background: #fff;
      border-radius: 60px 60px 0 0;
      box-shadow: inset 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .gauge-cnt2-value-display {
      position: absolute;
      bottom: 15px;
      left: 50%;
      transform: translateX(-50%);
      text-align: center;
      z-index: 10;
    }

    .gauge-cnt2-percentage {
      font-size: 28px;
      font-weight: 800;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      line-height: 1;
      margin-bottom: 4px;
    }

    .gauge-cnt2-text {
      font-size: 11px;
      color: #6c757d;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .gauge-cnt2-wrapper {
      position: relative;
      /* make wrapper relative for absolute positioning */
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    }



    .gauge-cnt2-indicator {
      position: absolute;
      bottom: 0;
      left: 50%;
      width: 4px;
      height: 60px;
      background: linear-gradient(180deg, #667eea 0%, #764ba2 100%);
      transform-origin: bottom center;
      transform: translateX(-50%) rotate(calc(-90deg + (var(--percentage, 0) * 1.8deg)));
      border-radius: 4px 4px 0 0;
      animation: rotateIndicator 2s ease-out forwards;
      z-index: 5;
      box-shadow: 0 0 10px rgba(102, 126, 234, 0.5);
    }

    .gauge-cnt2-indicator::after {
      content: '';
      position: absolute;
      bottom: -8px;
      left: 50%;
      transform: translateX(-50%);
      width: 16px;
      height: 16px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 50%;
      border: 3px solid #fff;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    }

    @keyframes rotateIndicator {
      from {
        transform: translateX(-50%) rotate(-90deg);
      }

      to {
        transform: translateX(-50%) rotate(calc(-90deg + (var(--percentage, 0) * 1.8deg)));
      }
    }

    .gauge-cnt2-labels {
      position: absolute;
      bottom: -5px;
      width: 100%;
      display: flex;
      justify-content: space-between;
      padding: 0 5px;
      font-size: 10px;
      color: #adb5bd;
      font-weight: 600;
    }

    /* Heading inside the gauge-cnt2 curve */
    /* Heading inside the gauge-cnt2, above the arc */
    .gauge-cnt2-inside-heading {
      position: absolute;
      top: 10px;
      /* adjust as needed to sit in the red box area */
      left: 50%;
      transform: translateX(-50%);
      font-size: 14px;
      font-weight: 700;
      color: #333;
      text-align: center;
      z-index: 10;
      pointer-events: none;
      /* ensures it doesn’t interfere with gauge-cnt2 hover/animation */
    }
    /* ================== INVOICE COLUMN CHART ================== */
.invoice-chart{
    display:flex;
    justify-content:space-between;
    align-items:flex-end;
    height:220px;
    padding:10px 6px 0;
    border-bottom:1px solid #d1d5db;
    border-left:1px solid #d1d5db;
}

.col{
    display:flex;
    flex-direction:column;
    align-items:center;
    gap:6px;
    flex:1;
}

.col-bar{
    width:32px;
    background:#3b82f6;
    border-radius:6px 6px 0 0;
    height:var(--h);
    
    /* Animation */
    transform-origin:bottom;
    transform:scaleY(0);
    animation:growCol 1.4s ease-out forwards;
}

@keyframes growCol{
    to{ transform:scaleY(1); }
}

.col-label{
    font-size:13px;
    font-weight:600;
    margin-top:4px;
}

.col-value{
    font-size:12px;
    color:#4b5563;
}

.label {
    text-align: center;
    margin-top: 10px;
    font-size: 14px;
}

/* ================= WEEKLY DASHBOARD ================= */
:root {
  --bg:#f8f9fa;
  --card:#ffffff;
  --muted:#6b7280;
  --completed:#5dc35a;
  --pending:#e84c3d;
  --radius:12px;
}
/* Reset */
*{box-sizing:border-box;margin:0;padding:0;}
body{
  font-family:Inter, sans-serif;
  background:var(--bg);
  color:#111827;
}
/* WRAPPER */
.weekly-wrap{
  width:100%;
  max-width:1200px;
  margin:20px auto;
  padding:0 16px;
  box-sizing:border-box;
}
/* Heading Card */
.weekly-heading-card {
  background: var(--card);
  border-radius: var(--radius);
  padding: 20px 30px;
  margin-bottom: 30px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.12);
  font-size: 24px;
  font-weight: 600;
  text-align: center;
  color: #111827;
  border-left: 6px solid #a3dda1;
  width:100%;
}
/* KPI Tiles */
.weekly-kpi-grid{
  display:grid;
  grid-template-columns:repeat(4, 1fr);
  gap:16px;
  margin-bottom:40px;
}
.weekly-kpi-card{
  background:var(--card);
  border-radius:var(--radius);
  padding:20px;
  display:flex;
  flex-direction:column;
  align-items:center;
  justify-content:center;
  box-shadow:0 2px 8px rgba(0,0,0,0.08);
  transition:.3s;
  border-bottom: 4px solid #5dc35a91;
}
.weekly-kpi-card:hover{
  transform:translateY(-5px);
  box-shadow:0 4px 16px rgba(0,0,0,0.15);
}
.weekly-kpi-title{color:var(--muted);font-size:13px;margin-bottom:8px;text-align:center;}
.weekly-kpi-value{font-size:22px;font-weight:700;color:#000;text-align:center;}
/* Chart Cards */
.weekly-chart-card{
  background:var(--card);
  border-radius:var(--radius);
  padding:20px;
  box-shadow:0 2px 8px rgba(0,0,0,0.08);
  margin-bottom:40px;
}
.weekly-chart-title{
  font-weight:600;
  margin-bottom:16px;
  text-align:center;
  font-size: 18px;
}
/* Legend */
.weekly-legend{display:flex;justify-content:center;gap:20px;margin-bottom:15px;font-size:13px;color:#111;}
.weekly-legend-item{display:flex;align-items:center;gap:6px;}
.weekly-legend-color{width:15px;height:15px;border-radius:3px;}
/* Bar Chart */
.weekly-bar-chart{
  display:flex;
  align-items:flex-end;
  justify-content: space-around;
  height:250px;
  border-left:2px solid #444;
  border-bottom:2px solid #444;
  padding-bottom:10px;
  gap:20px;
}
.weekly-bar-group{display:flex;flex-direction:column;align-items:center;}
.weekly-bar {
  width:100px;
  height:180px;
  border-radius:0px;
  overflow:hidden;
  display:flex;
  flex-direction:column-reverse;
}
.weekly-bar .weekly-segment:last-child {
  border-top-left-radius: 0px;
  border-top-right-radius: 0px;
}
.weekly-bar .weekly-segment:first-child {
  border-bottom-left-radius: 0px;
  border-bottom-right-radius: 0px;
}
.weekly-segment{
  width:100%;
  display:flex;
  align-items:center;
  justify-content:center;
  color:#fff;
  font-size:10px;
  font-weight:600;
  opacity:0;
  animation: grow 1s forwards;
}
.completed{background:var(--completed);}
.pending{background:var(--pending);}
.weekly-value{font-size:12px;font-weight:600;margin-bottom:6px;text-align:center;}
.weekly-label{font-size:13px;margin-top:6px;text-align:center;}
@keyframes grow{
  0%{opacity:0;transform:translateY(20px);}
  100%{opacity:1;transform:translateY(0);}
}
/* Donut Chart */
.weekly-donut-container {position: relative;width: 200px;height: 200px;margin: auto;}
.weekly-donut {
  width: 100%;height: 100%;border-radius: 50%;
  background: conic-gradient(#3b82f6 0% 50%, #10b981 50% 100%);
  display: flex;align-items: center;justify-content: center;
  animation: rotateDonut 2s ease-out;
}
@keyframes rotateDonut{0%{transform:rotate(-360deg);}100%{transform:rotate(0deg);}}
.weekly-donut-inner{
  width:60%;height:60%;background:#fff;
  border-radius:50%;
  display:flex;align-items:center;justify-content:center;
  font-weight:600;font-size:16px;
}
/* Satisfaction Grid */
.weekly-satisfaction-grid{
  display:grid;
  grid-template-columns:1fr 1fr;
  gap:25px;
}
/* Customer Satisfaction Styles */
.weekly-rating-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border-radius: 10px;
}
.weekly-rating-display {
  text-align: center;
  margin-bottom: 30px;
}
.weekly-rating-score {
  font-size: 56px;
  font-weight: 700;
  color: #111827;
  margin-bottom: 10px;
}
.weekly-stars-container {
  font-size: 32px;
  margin-bottom: 10px;
  letter-spacing: 4px;
}
.weekly-star.filled {
  color: #fbbf24;
  text-shadow: 0 2px 4px rgba(251, 191, 36, 0.3);
}
.weekly-star.empty {
  color: #d1d5db;
}
.weekly-rating-label {
  font-size: 14px;
  color: var(--muted);
  font-weight: 500;
}
/* Weekly Trend Bars */
.weekly-trend-title {
  font-size: 14px;
  font-weight: 600;
  color: #111827;
  margin-bottom: 15px;
  text-align: center;
}
.weekly-trend {
  display: flex;
  align-items: flex-end;
  justify-content: space-around;
  height: 180px;
  width: 100%;
  padding: 0 20px 30px 15px;
  border-left: 2px solid #d1d5db;
  border-bottom: 2px solid #d1d5db;
  gap: 30px;
  position: relative;
}
.weekly-week-bar-group {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 50px;
}
.weekly-week-bar {
  width: 50px;
  background: linear-gradient(180deg, #fbbf24 0%, #f59e0b 100%);
  border-radius: 6px 6px 0 0;
  box-shadow: 0 -2px 10px rgba(251, 191, 36, 0.4);
  position: relative;
  transition: all 0.3s ease;
  cursor: pointer;
  animation: growBar 1.2s ease forwards;
  opacity: 0;
  min-height: 20px;
}
.weekly-week-bar:hover {
  transform: translateY(-5px);
  box-shadow: 0 -4px 15px rgba(251, 191, 36, 0.6);
  filter: brightness(1.1);
}
.weekly-week-bar::after {
  content: attr(data-rating);
  position: absolute;
  top: -25px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 11px;
  font-weight: 700;
  color: #111827;
  background: #fff;
  padding: 3px 8px;
  border-radius: 4px;
  box-shadow: 0 2px 6px rgba(0,0,0,0.15);
  opacity: 0;
  transition: opacity 0.3s;
  white-space: nowrap;
}
.weekly-week-bar:hover::after {
  opacity: 1;
}
.weekly-week-label {
  font-size: 12px;
  color: #6b7280;
  font-weight: 600;
  margin-top: 8px;
}
@keyframes growBar {
  0% { opacity: 0; transform: scaleY(0); transform-origin: bottom; }
  100% { opacity: 1; transform: scaleY(1); transform-origin: bottom; }
}
/* Feedback Section */
.weekly-feedback-section {
  padding: 20px;
  background: #ffffff;
  border-radius: 10px;
  border: 1px solid #e5e7eb;
}
.weekly-feedback-title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 15px;
  color: #111827;
}
.weekly-complaints-list {
  max-height: 340px;
  overflow-y: auto;
  padding-right: 10px;
}
.weekly-feedback-item {
  padding: 15px;
  border-left: 4px solid #10b981;
  background: #f0fdf4;
  margin-bottom: 12px;
  border-radius: 6px;
  transition: transform 0.2s, box-shadow 0.2s;
}
.weekly-feedback-item:hover {
  transform: translateX(5px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}
.weekly-feedback-item.positive { border-left-color: #10b981; background: #f0fdf4; }
.weekly-feedback-item.neutral { border-left-color: #f59e0b; background: #fffbeb; }
.weekly-feedback-item.negative { border-left-color: #ef4444; background: #fef2f2; }
.weekly-feedback-date { font-size: 11px; color: #6b7280; margin-bottom: 6px; font-weight: 500; }
.weekly-feedback-text { font-size: 13px; color: #111827; margin-bottom: 8px; line-height: 1.5; }
.weekly-feedback-rating { font-size: 14px; color: #fbbf24; display: flex; align-items: center; gap: 6px; }
.weekly-rating-number { font-weight: 600; color: #111827; font-size: 12px; }
/* Responsive */
@media(max-width:1200px){ .weekly-kpi-grid{grid-template-columns:repeat(2,1fr);} }
@media(max-width:700px){ .weekly-kpi-grid{grid-template-columns:1fr;} .weekly-satisfaction-grid{grid-template-columns:1fr;} }

/* ================= MONTHLY DASHBOARD ================= */
:root{
  --bg33:#f0f2f5;
  --card33:#ffffff;
  --accent-blue33:#3b82f6;
  --accent-green33:#10b981;
  --accent-amber33:#f59e0b;
  --text-dark33:#1f2937;
  --text-muted33:#6b7280;
  --border-grey3:#d1d5db;
}
/* Dashboard Wrapper */
.dashboard-container3 {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 16px;
}
.page-title3{
  font-size:28px;
  background:var(--card33);
  border-radius:14px;
  padding:16px;
  box-shadow:0 2px 6px rgba(0,0,0,0.07);
  border-top:6px solid #9ea7b5;
  margin:16px 0;
  font-weight:500;
  text-align:center;
}

/* Cards */
.card3{
  background:var(--card33);
  border-radius:14px;
  padding:16px;
  box-shadow:0 2px 6px rgba(0,0,0,0.07);
  border-bottom:3px solid var(--border-grey3);
  margin-bottom:16px;
}
.cards3{
  margin-bottom:16px;
}
.card3 h3{
  margin:0 0 16px 0;
  font-size:16px;
  font-weight:600;
}

/* Top Section */
.top-section3{
  display:flex;
  gap:16px;
  margin-bottom:16px;
}
.top-section3 .card3{
  flex:1;
}
.top-section3 .cards3{
  flex:1;
}

/* Tiles */
.tiles3{
  display:flex;
  gap:16px;
}
.tile3{
  flex:1;
  background:#ffffff;
  border-radius:5px;
  padding:16px;
  display:flex;
  flex-direction:column;
  justify-content:space-between;
  box-shadow:0 4px 12px rgba(0,0,0,0.04);
  transition:all .2s ease;
  cursor:pointer;
}
.tile3:hover{
  transform:translateY(-3px);
  box-shadow:0 10px 24px rgba(0,0,0,0.1);
}
.label3{font-size:14px;font-weight:500;text-align:center;color: #626262;}
.value3{font-size:20px;font-weight:600;text-align:center;}

/* Service Insights Grid */
.service-grid3{
  display:grid;
  grid-template-columns:repeat(3,1fr);
  gap:16px;
}
@media(max-width:1100px){
  .service-grid3{grid-template-columns:repeat(2,1fr);}
}
@media(max-width:700px){
  .service-grid3{grid-template-columns:1fr;}
}

/* FLEX ROW FOR PIE + BAR CHART */
.flex-chart-container3{
  display:flex;
  gap:16px;
  flex-wrap:wrap;
  justify-content:space-between;
}

/* Charts Cards */
.flex-chart-container3 .card3{
  flex:1;
  min-width:300px;
  flex-direction:column;
  justify-content:center;
  align-items:center;
  padding:16px;
}

/* PIE CHART */
.pie-chart3{
  width:200px;
  height:200px;
  border-radius:50%;
  --direct3:60;
  --indirect3:40;
  background: conic-gradient(var(--accent-blue33) 0% calc(var(--direct3)*1%), var(--accent-green33) calc(var(--direct3)*1%) 100%);
  transform: rotate(-90deg);
  animation: pieSpin3 1.2s ease-out forwards;
  position: relative;
}
@keyframes pieSpin3{
  from { transform: rotate(-90deg) scale(0.7); opacity:0;}
  to { transform: rotate(-90deg) scale(1); opacity:1;}
}

/* Pie Tooltips */
.pie-chart-container3 {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.pie-chart-container3 .tooltip3 {
  position:absolute;
  padding:5px 10px;
  background:#1f2937;
  color:#fff;
  border-radius:6px;
  font-size:12px;
  font-weight:600;
  white-space:nowrap;
  opacity:0;
  pointer-events:none;
  transition:opacity .2s;
}
.direct-tooltip3{
  top:10%;
  left:50%;
  transform:translateX(-50%);
}
.indirect-tooltip3{
  bottom:10%;
  left:50%;
  transform:translateX(-50%);
}
.pie-chart-container3:hover .tooltip3{
  opacity:1;
}

/* Legend */
.legend3{
  display:flex;
  justify-content:center;
  gap:16px;
  margin-top:16px;
  font-size:14px;
}
.dot3{
  width:14px;
  height:14px;
  border-radius:50%;
  display:inline-block;
  margin-right:6px;
}
.direct-dot3{background:var(--accent-blue33);}
.indirect-dot3{background:var(--accent-green33);}

/* BAR CHART */
.bar-chart-container3{
  width:100%;
}
.bar3{
  background:#f8f9fa;
  border-radius:12px;
  padding:16px;
  margin-bottom:16px;
  display:flex;
  flex-direction:column;
  gap:8px;
}
.bar-label3{
  font-size:14px;
  font-weight:500;
  color:#636161;
}
.bar-inner3{
  height:25px;
  border-radius:12px;
  position:relative;
  overflow:hidden;
}
.bar-fill3{
  height:100%;
  border-radius:12px;
  width:0%;
  animation: fillBar3 1.2s forwards;
  position:relative;
  background:#837459;
}
.bar-fill3.post3{background:#837459;}
.bar-fill3.amc3{background:#837459;}
.bar-fills3{
  height:100%;
  border-radius:12px;
  width:0%;
  animation: fillBar3 1.2s forwards;
  position:relative;
  background:#f59e0b;
}
.bar-fill3.posts3{background:#10b981;}
.bar-value3{
  position:absolute;
  right:8px;
  top:0;
  bottom:0;
  display:flex;
  align-items:center;
  color:#fff;
  font-weight:600;
  font-size:12px;
}
@keyframes fillBar3{
  to { width: var(--bar-width); }
}

/* Responsive */
@media(max-width:1000px){
  .flex-chart-container3{
    flex-direction:column;
    align-items:center;
  }
  .flex-chart-container3 .card3{
    max-width:100%;
  }
}

/* Line Chart */
.line-chart3 {
  position: relative;
  height: 250px;
  margin-top:16px;
}
.line-chart3 svg {
  width: 100%;
  height: 100%;
}
.stroke_blue3 {
  stroke-dasharray: 1000;
  stroke-dashoffset: 1000;
  animation: drawLine3 2s forwards ease-out;
}
@keyframes drawLine3 {
  to { stroke-dashoffset: 0; }
}
.point3 {
  opacity: 0;
  transform: scale(0);
  animation: appearPoint3 2s forwards ease-out;
  animation-delay: 2s;
}
@keyframes appearPoint3 {
  to { opacity: 1; transform: scale(1); }
}

/* Legend */
.legend3 {
  display: flex;
  justify-content: center;
  gap: 16px;
  margin-top: 16px;
}
.legend-item3 {
  display: flex;
  align-items: center;
  gap: 8px;
}
.legend-color3 {
  width: 20px;
  height: 4px;
  border-radius: 2px;
}

/* Table */
.table3 th, .table3 td {
  padding: 16px;
  border-bottom:1px solid #eee;
}
.table3 th {
  border-bottom:2px solid #ddd;
  background:#f3f4f6;
  text-align:left;
}
 /* Customer Satisfaction */
      .satisfaction-grid3 {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 25px;
      }

      .rating-display3 {
        text-align: center;
        padding: 20px;
      }

      .rating-score3 {
        font-size: 64px;
        font-weight: 700;
        color: #667eea;
        margin-bottom: 10px;
      }

      .rating-stars3 {
        font-size: 32px;
        color: #fbbf24;
        margin-bottom: 10px;
      }

      .rating-label3 {
        color: #6b7280;
        font-size: 14px;
      }

      /* Complaints List */
      .complaints-list3 {
        max-height: 300px;
        overflow-y: auto;
      }

      .complaint-item3 {
        padding: 15px;
        border-left: 4px solid #ef4444;
        background: #fef2f2;
        margin-bottom: 12px;
        border-radius: 6px;
        transition: transform 0.3s ease;
      }

      .complaint-item3:hover {
        transform: translateX(5px);
      }

      .complaint-date3 {
        font-size: 11px;
        color: #991b1b;
        font-weight: 600;
        margin-bottom: 5px;
      }

      .complaint-text3{
        font-size: 13px;
        color: #7f1d1d;
      }

      /* Competitors Section */
      .competitors-table3 {
        width: 100%;
        border-collapse: collapse;
      }

      .competitors-table3 th {
        background: #c1c1c1;
        color: #141414;
        padding: 15px;
        text-align: left;
        font-weight: 600;
      }

      .competitors-table3 td {
        padding: 15px;
        border-bottom: 1px solid #e5e7eb;
      }

      .competitors-table3 tr:hover {
        background: #f9fafb;
      }

      /* Stacked Bar Chart */
      .stacked-bar-chart3 {
        display: flex;
        flex-direction: column;
        gap: 15px;
        padding: 10px 0;
      }

      .stacked-bar-row3 {
        display: flex;
        align-items: center;
        gap: 15px;
      }

      .stacked-bar-label3 {
        width: 80px;
        font-size: 13px;
        font-weight: 500;
        color: #4b5563;
      }

      .stacked-bar3 {
        flex: 1;
        height: 40px;
        display: flex;
        border-radius: 6px;
        overflow: hidden;
        background: #f3f4f6;
      }

      .stacked-segment3 {
        height: 100%;
        transition: all 0.6s ease;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 11px;
        font-weight: 600;
        cursor: pointer;
      }

      .stacked-segment3:hover {
        opacity: 0.8;
        filter: brightness(1.1);
      }

      .segment-price3 {
        background: #ef4444;
      }

      .segment-quality3 {
        background: #f59e0b;
      }

      .segment-delivery3 {
        background: #8b5cf6;
      }

      .segment-other3 {
        background: #6b7280;
      }

      /* Responsive */
      @media (max-width: 768px) {
        .charts-grid3 {
          grid-template-columns: 1fr;
        }

        .satisfaction-grid3 {
          grid-template-columns: 1fr;
        }
      }

      /* Animation Classes */
      @keyframes fadeInUp {
        from {
          opacity: 0;
          transform: translateY(20px);
        }

        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      .animate-in3 {
        animation: fadeInUp 0.6s ease forwards;
      }
        /* Bar Chart */
      .bar-chart3 {
        display: flex;
        align-items: flex-end;
        justify-content: space-between;
        height: 250px;
        gap: 15px;
      }


      .bar-group-yoy3 {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 8px;
      }

      .bars-yoy3 {
        display: flex;
        align-items: flex-end;
        gap: 4px;
        height: 200px;
        width: 100%;
        justify-content: center;
      }

      .bar-yoy3 {
        width: 70px;
        border-radius: 4px 4px 0 0;
        transition: all 0.6s ease;
        position: relative;
        cursor: pointer;
      }

      .bar-yoy3:hover {
        opacity: 0.8;
        transform: scaleY(1.05);
      }

      .bar-yoy3:hover .bar-value-label3 {
        opacity: 1;
        transform: translateY(-5px);
      }

      .bar-group3 {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 8px;
      }

      .bars3 {
        display: flex;
        align-items: flex-end;
        gap: 4px;
        height: 200px;
        width: 100%;
        justify-content: center;
      }

      .bars3 {
        width: 20px;
        border-radius: 4px 4px 0 0;
        transition: all 0.6s ease;
        position: relative;
        cursor: pointer;
      }

      .bars3:hover {
        opacity: 0.8;
        transform: scaleY(1.05);
      }

      .bars3:hover .bar-value-label3 {
        opacity: 1;
        transform: translateY(-5px);
      }

      .bar-value-label3 {
        position: absolute;
        top: -25px;
        left: 50%;
        transform: translateX(-50%);
        background: #1f2937;
        color: white;
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 10px;
        font-weight: 600;
        white-space: nowrap;
        opacity: 0;
        transition: all 0.3s ease;
        pointer-events: none;
        z-index: 10;
      }

      .bar-value-label3::after {
        content: '';
        position: absolute;
        bottom: -4px;
        left: 50%;
        transform: translateX(-50%);
        width: 0;
        height: 0;
        border-left: 4px solid transparent;
        border-right: 4px solid transparent;
        border-top: 4px solid #1f2937;
      }

      .bar.sales3 {
        background: linear-gradient(180deg, #10b981 0%, #059669 100%);
      }

      .bar.cost3 {
        background: linear-gradient(180deg, #8b5cf6 0%, #7c3aed 100%);
      }

      .bar.profit3 {
        background: linear-gradient(180deg, #f59e0b 0%, #d97706 100%);
      }

      .bar-label3 {
        font-size: 11px;
        color: #6b7280;
        font-weight: 500;
        text-align: center;
      }

      /* Horizontal Bar Chart */
      .horizontal-bar-chart3 {
        display: flex;
        flex-direction: column;
        gap: 20px;
        padding: 10px 0;
      }

      .horizontal-bar-row3 {
        display: flex;
        align-items: center;
        gap: 15px;
      }

      .horizontal-bar-label3 {
        min-width: 100px;
        font-size: 13px;
        font-weight: 600;
        color: #1f2937;
      }

      .horizontal-bar-wrapper3 {
        flex: 1;
        position: relative;
      }

      .horizontal-bar3 {
        height: 40px;
        border-radius: 8px;
        position: relative;
        overflow: hidden;
        transition: all 0.6s ease;
        cursor: pointer;
      }

      .horizontal-bar3:hover {
        transform: scaleX(1.02);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      }

      .horizontal-bar-value3 {
        position: absolute;
        right: 15px;
        top: 50%;
        transform: translateY(-50%);
        color: white;
        font-size: 14px;
        font-weight: 700;
        text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
      }

      .horizontal-bar.q13 {
        background: linear-gradient(90deg, #ef4444 0%, #dc2626 100%);
      }

      .horizontal-bar.q23 {
        background: linear-gradient(90deg, #f59e0b 0%, #d97706 100%);
      }

      .horizontal-bar.q33 {
        background: linear-gradient(90deg, #10b981 0%, #059669 100%);
      }

      .horizontal-bar.q43 {
        background: linear-gradient(90deg, #3b82f6 0%, #2563eb 100%);
      }
       /* -------------------- Gauge -------------------- */
    .gauge-wrapper3 {
      flex: 0 0 240px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }

    .gauge-container3 {
      position: relative;
      width: 450px;
      height: 130px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
      border-radius: 20px;
      padding: 20px;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
    }

    .gauge-arc-container3 {
      position: relative;
      width: 160px;
      height: 80px;
    }

    .gauge-bg-arc3 {
      width: 160px;
      height: 80px;
      border-radius: 80px 80px 0 0;
      background: #e8ecef;
      position: relative;
      overflow: hidden;
    }

    .gauge-progress-arc3 {
      position: absolute;
      bottom: 0;
      left: 0;
      width: 160px;
      height: 80px;
      border-radius: 80px 80px 0 0;
      background: linear-gradient(90deg, #ff6b6b 0%, #feca57 25%, #48dbfb 50%, #1dd1a1 75%, #10ac84 100%);
      clip-path: polygon(0 100%,
          0 0,
          calc(var(--percentage, 0) * 1%) 0,
          calc(var(--percentage, 0) * 1%) 100%);
      animation: fillGaugeArc 2s ease-out forwards;
    }

    @keyframes fillGaugeArc {
      from {
        clip-path: polygon(0 100%, 0 100%, 0 100%, 0 100%);
      }

      to {
        clip-path: polygon(0 100%,
            0 0,
            calc(var(--percentage, 0) * 1%) 0,
            calc(var(--percentage, 0) * 1%) 100%);

      }
    }

    .gauge-inner-cutout3 {
      position: absolute;
      bottom: 0;
      left: 50%;
      transform: translateX(-50%);
      width: 120px;
      height: 60px;
      background: #fff;
      border-radius: 60px 60px 0 0;
      box-shadow: inset 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .gauge-value-display3 {
      position: absolute;
      bottom: 15px;
      left: 50%;
      transform: translateX(-50%);
      text-align: center;
      z-index: 10;
    }

    .gauge-percentage3 {
      font-size: 28px;
      font-weight: 800;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      line-height: 1;
      margin-bottom: 4px;
    }

    .gauge-text3 {
      font-size: 11px;
      color: #6c757d;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
   .gauge-wrapper3 {
  position: relative; /* make wrapper relative for absolute positioning */
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: white;
  border-radius: 6px;
  margin-bottom: 16px;
  border-radius: 14px;
    padding: 16px;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.07);
    border-bottom: 3px solid var(--border-grey3);
}



    .gauge-indicator3 {
      position: absolute;
      bottom: 0;
      left: 50%;
      width: 4px;
      height: 60px;
      background: linear-gradient(180deg, #667eea 0%, #764ba2 100%);
      transform-origin: bottom center;
      transform: translateX(-50%) rotate(calc(-90deg + (var(--percentage, 0) * 1.8deg)));
      border-radius: 4px 4px 0 0;
      animation: rotateIndicator 2s ease-out forwards;
      z-index: 5;
      box-shadow: 0 0 10px rgba(102, 126, 234, 0.5);
    }

    .gauge-indicator3::after {
      content: '';
      position: absolute;
      bottom: -8px;
      left: 50%;
      transform: translateX(-50%);
      width: 16px;
      height: 16px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 50%;
      border: 3px solid #fff;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    }

    @keyframes rotateIndicator {
      from {
        transform: translateX(-50%) rotate(-90deg);
      }

      to {
        transform: translateX(-50%) rotate(calc(-90deg + (var(--percentage, 0) * 1.8deg)));
      }
    }

    .gauge-labels3 {
      position: absolute;
      bottom: -5px;
      width: 100%;
      display: flex;
      justify-content: space-between;
      padding: 0 5px;
      font-size: 10px;
      color: #adb5bd;
      font-weight: 600;
    }
    /* Heading inside the gauge curve */
/* Heading inside the gauge, above the arc */
.gauge-inside-heading3 {
  position: absolute;
  top: 10px; /* adjust as needed to sit in the red box area */
  left: 50%;
  transform: translateX(-50%);
  font-size: 14px;
  font-weight: 700;
  color: #333;
  text-align: center;
  z-index: 10;
  pointer-events: none; /* ensures it doesn’t interfere with gauge hover/animation */
}
.chart-gauge-wrapper3{
  display: flex;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

.chart-gauge-wrapper3 .card3,
.chart-gauge-wrapper3 .gauge-wrapper3 {
  flex: 1;
  min-width: 300px;
}
    .benchmarks-section3 {
      background: #ffffff;
      padding: 20px;
      border-radius: 12px;
      box-shadow: 0 3px 10px rgba(0, 0, 0, 0.08);
      max-width: 1360px;
      margin: 0 auto;
    margin-bottom : 15px;
    }

    .section-header3 {
      display: flex;
      align-items: center;
      margin-bottom: 20px;
      padding-bottom: 10px;
      border-bottom: 2px solid #e5e7eb;
    }

    .section-title3 {
      font-size: 20px;
      font-weight: 600;
      color: #1f2937;
    }

    .benchmark-table3 {
      width: 100%;
      border-collapse: collapse;
      table-layout: fixed;
      border: 2px solid #d1d5db; /* full table border */
    }

    .benchmark-table3 th,
    .benchmark-table3 td {
      padding: 12px 10px;
      border: 1px solid #d1d5db; /* all cell borders */
      vertical-align: middle;
      text-align: center;
    }

    .benchmark-table3 th {
      background: #f3f4f6;
      font-size: 14px;
      font-weight: 600;
      color: #111827;
    }

    .benchmark-table3 td:first-child {
      text-align: left;
      font-weight: 500;
    }
`,vg=`
.widget-status{padding:40px 20px;text-align:center;color:#6b7280;font-size:14px;}
.widget-error{color:#b91c1c;}
.date-filter{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin:0 0 18px;padding:12px 14px;background:#0f766e;border-radius:10px;color:#fff;box-shadow:0 3px 10px rgba(15,118,110,.18);}
.date-filter label{font-size:13px;font-weight:600;}
.date-filter select,.date-filter input{min-height:34px;border:1px solid rgba(255,255,255,.55);border-radius:7px;background:#fff;color:#134e4a;padding:0 9px;font:inherit;}
.date-filter select{font-weight:600;cursor:pointer;}
.date-filter .date-range-label{font-size:13px;opacity:.92;}
@media (max-width:640px){.date-filter{align-items:stretch;}.date-filter select,.date-filter input{width:100%;}.date-filter .date-range-label{width:100%;}}
`,yg=e=>{let t="";for(let n=1;n<=5;n+=1)t+=n<=e?"★":"☆";return t};function xg({view:e,today:t}){const{tiles:n,executives:r,invoiceTrend:l,repeatReasons:i,feedbackTrend:o}=e,a=502.65,u=!i.totalRepeatCalls,c=u?0:i.lackOfKnowledge,g=u?0:i.partsUnavailability,m=u?0:i.powerIssue,h=c/100*a,v=g/100*a,x=m/100*a,w=0-h,D=0-(h+v),p=[["Total Calls Logged Today",n.total_calls_today],["Service Executives Active Today",n.executives_act_today],["Service Reports Submitted",n.service_reports_submitted_count],["Quotations Sent Today",n.quot_sent_today],["Customer Feedbacks Collected",n.cust_feedback_rec],["Pending Calls > 48 Hrs",n.pending_calls,!0],["Customer Regret Cases",n.customer_regret_cases_count,!0],["Repeat Calls Logged",n.repeated_calls_count],["Invoices Generated Today",n.invoices_gen_today],["Invoice Amounts (₹)",`₹ ${n.total_invoiced_amt_today}`]],d=[["AMC",l.amc_height,l.amc_amt],["Install",l.install_height,l.installtion_amt],["Repair",l.repair_height,l.repair_amt],["Service",l.service_height,l.service_amt],["Spares",l.spares_height,l.spares_amt]],f=[["#3b82f6","Lack of Knowledge",c],["#16a34a","Parts Unavailability",g],["#f59e0b","Power Issue",m]];return s.jsxs(s.Fragment,{children:[s.jsxs("header",{children:[s.jsx("h1",{children:"TAB 1 — TODAY'S"}),s.jsxs("div",{className:"date",children:["Date: ",Uc(t)]})]}),s.jsxs("main",{className:"container",children:[s.jsx("section",{className:"tiles",children:p.map(([y,_,S])=>s.jsxs("div",{className:"tile",children:[s.jsx("div",{className:"label",children:y}),s.jsx("div",{className:S?"value red":"value",children:_})]},y))}),s.jsxs("div",{style:{display:"flex",flexDirection:"column",gap:"14px"},children:[s.jsxs("div",{className:"card",children:[s.jsx("h3",{children:"Service Executive Performance (Today)"}),s.jsxs("div",{className:"legend",children:[s.jsxs("span",{children:[s.jsx("span",{className:"dot assigned-dot"}),"Assigned"]}),s.jsxs("span",{children:[s.jsx("span",{className:"dot closed-dot"}),"Closed"]})]}),s.jsx("div",{className:"bar-chart-row",children:r.map((y,_)=>s.jsxs("div",{className:"bar-group",children:[s.jsxs("div",{className:"bars",children:[s.jsxs("div",{className:"bar-container",children:[s.jsx("div",{className:"bar-number",children:y.assignedToday}),s.jsx("div",{className:"bar assigned",style:{height:`${y.assignedHeight}px`}})]}),s.jsxs("div",{className:"bar-container",children:[s.jsx("div",{className:"bar-number",children:y.completedToday}),s.jsx("div",{className:"bar closed",style:{height:`${y.completedHeight}px`}})]})]}),s.jsx("div",{className:"exec-label",children:y.Engineer_Name})]},_))})]}),s.jsxs("div",{className:"card",children:[s.jsx("h3",{children:"Invoice Amount Trend (Today)"}),s.jsx("div",{className:"invoice-chart",children:d.map(([y,_,S])=>s.jsxs("div",{className:"col",children:[s.jsx("div",{className:"col-bar",style:{"--h":`${_}px`}}),s.jsx("div",{className:"col-label",children:y}),s.jsxs("div",{className:"col-value",children:["₹ ",S]})]},y))})]}),s.jsxs("div",{style:{display:"flex",gap:"14px",margin:"10px"},children:[s.jsxs("div",{className:"card",style:{flex:1},children:[s.jsx("h3",{children:"Repeat Calls Reason Breakdown"}),s.jsx("div",{style:{position:"relative",width:"250px",height:"250px",margin:"20px auto"},children:u?s.jsxs("svg",{viewBox:"0 0 200 200",style:{width:"100%",height:"100%"},children:[s.jsx("circle",{cx:"100",cy:"100",r:"80",fill:"none",stroke:"#e5e7eb",strokeWidth:"60"}),s.jsx("circle",{cx:"100",cy:"100",r:"50",fill:"white"}),s.jsx("text",{x:"100",y:"105",textAnchor:"middle",style:{fontSize:"16px",fill:"#999",fontWeight:600},children:"No Data"})]}):s.jsxs(s.Fragment,{children:[s.jsxs("svg",{viewBox:"0 0 200 200",style:{width:"100%",height:"100%",transform:"rotate(-90deg)"},children:[c>0&&s.jsx("circle",{cx:"100",cy:"100",r:"80",fill:"none",stroke:"#3b82f6",strokeWidth:"60",strokeDasharray:`${h} ${a}`,strokeDashoffset:0,style:{transition:"all 1s ease"}}),g>0&&s.jsx("circle",{cx:"100",cy:"100",r:"80",fill:"none",stroke:"#16a34a",strokeWidth:"60",strokeDasharray:`${v} ${a}`,strokeDashoffset:w,style:{transition:"all 1s ease"}}),m>0&&s.jsx("circle",{cx:"100",cy:"100",r:"80",fill:"none",stroke:"#f59e0b",strokeWidth:"60",strokeDasharray:`${x} ${a}`,strokeDashoffset:D,style:{transition:"all 1s ease"}}),s.jsx("circle",{cx:"100",cy:"100",r:"50",fill:"white"})]}),s.jsxs("div",{style:{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%, -50%)",textAlign:"center"},children:[s.jsx("div",{style:{fontSize:"32px",fontWeight:700,color:"#1f2937"},children:i.totalRepeatCalls}),s.jsx("div",{style:{fontSize:"12px",color:"#6b7280"},children:"Total Calls"})]})]})}),s.jsx("div",{style:{marginTop:"24px",display:"flex",flexDirection:"column",gap:"10px",alignItems:"center"},children:f.map(([y,_,S])=>s.jsxs("div",{style:{display:"flex",alignItems:"center",gap:"8px"},children:[s.jsx("span",{style:{width:"14px",height:"14px",borderRadius:"50%",background:y,display:"inline-block"}}),s.jsxs("span",{style:{fontSize:"14px",color:"#555"},children:[_,": ",R(S,1),"%"]})]},_))})]}),s.jsxs("div",{className:"gauge-cnt2-container",style:{"--percentage":o.percentage},children:[s.jsxs("div",{className:"gauge-cnt2-inside-heading",children:["Service Feedback Trend (Avg: ",o.average_rating,"/5)"]}),s.jsxs("div",{className:"gauge-cnt2-arc-container",children:[s.jsx("div",{className:"gauge-cnt2-bg-arc",children:s.jsx("div",{className:"gauge-cnt2-progress-arc"})}),s.jsx("div",{className:"gauge-cnt2-inner-cutout"}),s.jsx("div",{className:"gauge-cnt2-indicator"}),s.jsxs("div",{className:"gauge-cnt2-value-display",children:[s.jsxs("div",{className:"gauge-cnt2-percentage",children:[o.percentage,"%"]}),s.jsx("div",{className:"gauge-cnt2-text",children:"Average"})]})]}),s.jsxs("div",{className:"gauge-cnt2-labels",children:[s.jsx("span",{children:"0%"}),s.jsx("span",{children:"100%"})]})]})]})]})]})]})}function wg({view:e}){const{engineer:t,aging:n,amc:r,redTag:l,satisfaction:i,recentFeedbacks:o}=e,a=[["Avg Calls Attended per Engineer",t.average_calls_per_engineer_week],["Average Response Time (hrs)",e.avgResponseTime],["Repeat Call %",`${e.repeatCallPercent.toFixed(1)}%`],["Customer Regret %",`${R(e.regretPercent,2).toFixed(2)}%`],["Google Review Collection %",`${e.googleReviews}%`],["AMC Leads Generated",e.amcLeads],["Pending Replacements",e.pendingReplacements],["Standby Units Pending Collection",e.standbyPending]],u=[l.week1,l.week2,l.week3,l.week4].map(c=>{let g=l.maxValue>0?c*200/l.maxValue:0;return c>0&&g<30&&(g=30),{count:c,height:g}});return s.jsxs("div",{className:"weekly-wrap",children:[s.jsx("h1",{className:"weekly-heading-card",children:"Weekly Performance Dashboard"}),s.jsx("div",{className:"weekly-kpi-grid",children:a.map(([c,g])=>s.jsxs("div",{className:"weekly-kpi-card",children:[s.jsx("div",{className:"weekly-kpi-title",children:c}),s.jsx("div",{className:"weekly-kpi-value",children:g})]},c))}),s.jsxs("div",{className:"weekly-chart-card",children:[s.jsx("div",{className:"weekly-chart-title",children:"Engineer-wise Call Volume"}),s.jsxs("div",{className:"weekly-legend",children:[s.jsxs("div",{className:"weekly-legend-item",children:[s.jsx("div",{className:"weekly-legend-color completed"})," Completed"]}),s.jsxs("div",{className:"weekly-legend-item",children:[s.jsx("div",{className:"weekly-legend-color pending"})," Pending"]})]}),s.jsx("div",{className:"weekly-bar-chart",children:t.per_engineer.map((c,g)=>s.jsxs("div",{className:"weekly-bar-group",children:[s.jsxs("div",{className:"weekly-bar",children:[s.jsx("div",{className:"weekly-segment completed",style:{height:`${c.completed_height}%`},children:c.calls_completed}),s.jsx("div",{className:"weekly-segment pending",style:{height:`${c.pending_height}%`},children:c.calls_pending})]}),s.jsxs("div",{className:"weekly-value",children:["Total: ",c.total_calls_this_week]}),s.jsx("div",{className:"weekly-label",children:c.engineer_name})]},g))})]}),s.jsxs("div",{className:"weekly-chart-card",children:[s.jsx("div",{className:"weekly-chart-title",children:"Customer Satisfaction"}),s.jsxs("div",{className:"weekly-satisfaction-grid",children:[s.jsxs("div",{className:"weekly-rating-section",children:[s.jsxs("div",{className:"weekly-rating-display",children:[s.jsx("div",{className:"weekly-rating-score",children:e.overallAvg}),s.jsx("div",{className:"weekly-stars-container",children:[1,2,3,4,5].map(c=>{const g=c<=e.fullStars||c===e.fullStars+1&&e.hasHalfStar;return s.jsx("span",{className:g?"weekly-star filled":"weekly-star empty",children:"★"},c)})}),s.jsx("div",{className:"weekly-rating-label",children:"Average Customer Rating"})]}),s.jsx("div",{className:"weekly-trend-title",children:"Weekly Rating Trend"}),s.jsx("div",{className:"weekly-trend",children:i.length>0?i.map((c,g)=>s.jsxs("div",{className:"weekly-week-bar-group",children:[s.jsx("div",{className:"weekly-week-bar","data-rating":c.average_rating,style:{height:`${c.bar_height}%`,animationDelay:`${g*.2}s`}}),s.jsx("div",{className:"weekly-week-label",children:c.week_label})]},c.week_label)):s.jsx("div",{style:{textAlign:"center",padding:"20px",color:"#6b7280"},children:"No data available"})})]}),s.jsxs("div",{className:"weekly-feedback-section",children:[s.jsx("h3",{className:"weekly-feedback-title",children:"Recent Feedbacks"}),s.jsx("div",{className:"weekly-complaints-list",children:o.length>0?o.map((c,g)=>{const m=c.rating>=4?"positive":c.rating<=2?"negative":"neutral";return s.jsxs("div",{className:`weekly-feedback-item ${m}`,children:[s.jsx("div",{className:"weekly-feedback-date",children:Bc(c.created_date)}),s.jsxs("div",{className:"weekly-feedback-text",children:[c.comments," – Customer: ",c.customer_name]}),s.jsxs("div",{className:"weekly-feedback-rating",children:[yg(c.rating)," ",s.jsx("span",{className:"weekly-rating-number",children:c.rating})]})]},c.id||g)}):s.jsx("div",{style:{textAlign:"center",padding:"20px",color:"#6b7280"},children:"No feedback available"})})]})]})]}),s.jsxs("div",{className:"weekly-chart-card",children:[s.jsx("div",{className:"weekly-chart-title",children:"Pending Call Ageing"}),s.jsxs("div",{className:"weekly-legend",children:[s.jsxs("div",{className:"weekly-legend-item",children:[s.jsx("div",{className:"weekly-legend-color",style:{background:"#3b82f6"}})," 0-2 Days"]}),s.jsxs("div",{className:"weekly-legend-item",children:[s.jsx("div",{className:"weekly-legend-color",style:{background:"#10b981"}})," 3-5 Days"]}),s.jsxs("div",{className:"weekly-legend-item",children:[s.jsx("div",{className:"weekly-legend-color",style:{background:"#f59e0b"}})," >5 Days"]})]}),s.jsx("div",{className:"weekly-bar-chart",children:n.map((c,g)=>{const m=c["0-2_Days"],h=c["3-5_Days"],v=c.above_5_Days,x=m+h+v,w=D=>(x>0?D*100/x:0)||2;return s.jsxs("div",{className:"weekly-bar-group",children:[s.jsxs("div",{className:"weekly-bar",children:[s.jsx("div",{className:"weekly-segment",style:{height:`${w(m)}%`,background:"#3b82f6"},children:m}),s.jsx("div",{className:"weekly-segment",style:{height:`${w(h)}%`,background:"#10b981"},children:h}),s.jsx("div",{className:"weekly-segment",style:{height:`${w(v)}%`,background:"#f59e0b"},children:v})]}),s.jsxs("div",{className:"weekly-value",children:["Total: ",x]}),s.jsxs("div",{className:"weekly-label",children:["Week ",g+1]})]},g)})})]}),s.jsxs("div",{className:"weekly-chart-card",style:{textAlign:"center"},children:[s.jsx("div",{className:"weekly-chart-title",children:"AMC Offer vs Closed – Conversion Chart"}),s.jsx("div",{className:"weekly-donut-container",children:s.jsx("div",{className:"weekly-donut",style:{background:`conic-gradient(from 0deg, #10b981 0% ${r.closed_percent}%, #3b82f6 ${r.closed_percent}% 100%)`},children:s.jsx("div",{className:"weekly-donut-inner",children:r.total})})}),s.jsxs("div",{className:"weekly-legend",style:{justifyContent:"center",display:"flex",gap:"20px",marginTop:"15px"},children:[s.jsxs("div",{className:"weekly-legend-item",style:{display:"flex",alignItems:"center",gap:"6px"},children:[s.jsx("div",{className:"weekly-legend-color",style:{width:"15px",height:"15px",background:"#10b981"}}),"Closed - ",r.closed," (",r.closed_percent,"%)"]}),s.jsxs("div",{className:"weekly-legend-item",style:{display:"flex",alignItems:"center",gap:"6px"},children:[s.jsx("div",{className:"weekly-legend-color",style:{width:"15px",height:"15px",background:"#3b82f6"}}),"Offered - ",r.total]})]})]}),s.jsxs("div",{className:"weekly-chart-card",children:[s.jsx("div",{className:"weekly-chart-title",children:"Red Tag Item Trend (Service Dept)"}),s.jsx("div",{className:"weekly-legend",children:s.jsxs("div",{className:"weekly-legend-item",children:[s.jsx("div",{className:"weekly-legend-color",style:{background:"#ef4444"}})," Red Tag Items"]})}),s.jsx("div",{className:"weekly-bar-chart",style:{height:"200px",gap:"20px",borderLeft:"2px solid #444",borderBottom:"2px solid #444",paddingBottom:"10px",justifyContent:"space-around"},children:u.map((c,g)=>s.jsxs("div",{className:"weekly-bar-group",children:[s.jsx("div",{className:"weekly-bar",style:{height:`${c.height}px`},children:s.jsx("span",{className:"weekly-segment",style:{color:"#ffffff",fontSize:"12px",fontWeight:600},children:c.count})}),s.jsxs("div",{className:"weekly-label",children:["Week ",g+1]})]},g))})]})]})}const kg={display:"inline-block",padding:"5px 12px",borderRadius:"12px",fontSize:"12px",fontWeight:600},_g={green:{backgroundColor:"#d4edda",color:"#155724"},orange:{backgroundColor:"#fff3cd",color:"#856404"},red:{backgroundColor:"#f8d7da",color:"#721c24"},blue:{backgroundColor:"#d1ecf1",color:"#0c5460"}};function Sg({trend:e}){const t=e.length,n=Math.max(700,80+t*90);let r=Math.max(0,...e.map(c=>c.repeat_calls));r=r>0?r+10:100;const l=80,i=t<=1?0:(n-l-40)/(t-1),o=180,a=o-20,u=e.map((c,g)=>({x:l+g*i,y:o-c.repeat_calls/r*a,month:c.month}));return s.jsxs("svg",{viewBox:`0 0 ${n} 220`,preserveAspectRatio:"xMidYMid meet",children:[s.jsx("line",{x1:"50",y1:"20",x2:"50",y2:"180",stroke:"#e0e0e0",strokeWidth:"1"}),s.jsx("line",{x1:"50",y1:"180",x2:n-20,y2:"180",stroke:"#e0e0e0",strokeWidth:"2"}),s.jsx("text",{x:"30",y:"185",fontSize:"11",fill:"#666",children:"0"}),s.jsx("text",{x:"30",y:"140",fontSize:"11",fill:"#666",children:"25"}),s.jsx("text",{x:"30",y:"95",fontSize:"11",fill:"#666",children:"50"}),s.jsx("text",{x:"30",y:"50",fontSize:"11",fill:"#666",children:"75"}),s.jsx("text",{x:"25",y:"25",fontSize:"11",fill:"#666",children:"100"}),s.jsx("polyline",{points:u.map(c=>`${c.x},${c.y}`).join(" "),fill:"none",stroke:"#3b82f6",strokeWidth:"3",className:"stroke_blue3"}),u.map((c,g)=>s.jsxs(ud.Fragment,{children:[s.jsx("circle",{cx:c.x,cy:c.y,r:"5",fill:"#3b82f6",className:"point3"}),s.jsx("text",{x:c.x,y:"200",textAnchor:"middle",fontSize:"12",fill:"#666",children:c.month})]},g))]})}function Cg({view:e}){const{callLogs:t,expense:n,costByCategory:r,positiveFeedback:l,satisfaction:i,complaints:o,calibration:a}=e,u=i.overall_average,c=Math.floor(u),g=u-c>=.5;let m="";for(let v=1;v<=5;v+=1)m+=v<=c||v===c+1&&g?"★":"☆";const h=[["Under Warranty",r.w_percentage,""],["Post Warranty",r.pw_percentage," post3"],["AMC",r.amc_percentage," amc3"]];return s.jsxs("div",{className:"dashboard-container3",children:[s.jsx("div",{className:"page-title3",children:"Monthly Insights"}),s.jsxs("div",{className:"top-section3",children:[s.jsxs("div",{className:"cards3",children:[s.jsx("h3",{children:"Total Calls Logged (Month)"}),s.jsxs("div",{className:"tiles3",children:[s.jsxs("div",{className:"tile3",children:[s.jsx("div",{className:"label3",children:"Warranty"}),s.jsx("div",{className:"value3",children:t.warranty_count})]}),s.jsxs("div",{className:"tile3",children:[s.jsx("div",{className:"label3",children:"Post Warranty"}),s.jsx("div",{className:"value3",children:t.post_warranty})]}),s.jsxs("div",{className:"tile3",children:[s.jsx("div",{className:"label3",children:"AMC"}),s.jsx("div",{className:"value3",children:t.amc_count})]})]})]}),s.jsxs("div",{className:"cards3",children:[s.jsx("h3",{children:"Expenses for Complaints"}),s.jsxs("div",{className:"tiles3",children:[s.jsxs("div",{className:"tile3",children:[s.jsx("div",{className:"label3",children:"Warranty Expense"}),s.jsxs("div",{className:"value3",children:["₹ ",t.warranty_amount]})]}),s.jsxs("div",{className:"tile3",children:[s.jsx("div",{className:"label3",children:"Post Warranty"}),s.jsxs("div",{className:"value3",children:["₹ ",t.post_warranty_amount]})]})]})]})]}),s.jsxs("div",{className:"cards3",children:[s.jsx("h3",{children:"Service Insights"}),s.jsxs("div",{className:"service-grid3",children:[s.jsxs("div",{className:"tile3",children:[s.jsx("div",{className:"label3",children:"Indirect Expenses"}),s.jsxs("div",{className:"value3",children:["₹ ",e.indirectExpense]})]}),s.jsxs("div",{className:"tile3",children:[s.jsx("div",{className:"label3",children:"Repeat Call Analysis"}),s.jsxs("div",{className:"value3",children:[e.repeatCalls," calls"]})]}),s.jsxs("div",{className:"tile3",children:[s.jsx("div",{className:"label3",children:"Stock Unavailability Delays"}),s.jsxs("div",{className:"value3",children:[e.stockDelays," cases"]})]}),s.jsxs("div",{className:"tile3",children:[s.jsx("div",{className:"label3",children:"Training Hours Conducted"}),s.jsxs("div",{className:"value3",children:[e.trainingHours," hrs"]})]}),s.jsxs("div",{className:"tile3",children:[s.jsx("div",{className:"label3",children:"Tool & Vehicle Inspections Completed"}),s.jsxs("div",{className:"value3",children:[e.compliance.compliance_percentage,"%"]})]}),s.jsxs("div",{className:"tile3",children:[s.jsx("div",{className:"label3",children:"Customer Feedback Summary"}),s.jsxs("div",{className:"value3",children:[l.avg_feedback," ⭐ | ",l.positive_feedback_percentage,"% Positive"]})]})]})]}),s.jsxs("div",{className:"flex-chart-container3",children:[s.jsxs("div",{className:"card3 pie-chart-container3",children:[s.jsx("h3",{children:"Expense Breakdown"}),s.jsx("div",{className:"pie-chart3",style:{"--direct3":n.direct_percent,"--indirect3":n.indirect_percent}}),s.jsxs("div",{className:"tooltip3 direct-tooltip3",children:["Direct: ₹ ",n.direct_expense," (",n.direct_percent,"%)"]}),s.jsxs("div",{className:"tooltip3 indirect-tooltip3",children:["Indirect: ₹ ",n.indirect_expense," (",n.indirect_percent,"%)"]}),s.jsxs("div",{className:"legend3",children:[s.jsxs("span",{children:[s.jsx("span",{className:"dot3 direct-dot3"}),"Direct - ₹ ",n.direct_expense," (",n.direct_percent,"%)"]}),s.jsxs("span",{children:[s.jsx("span",{className:"dot3 indirect-dot3"}),"Indirect - ₹ ",n.indirect_expense," (",n.indirect_percent,"%)"]})]})]}),r.has_data?s.jsxs("div",{className:"card3 bar-chart-container3",children:[s.jsx("h3",{children:"Complaint Cost by Category"}),h.map(([v,x,w])=>s.jsxs("div",{className:"bar3",children:[s.jsx("div",{className:"bar-label3",children:v}),s.jsx("div",{className:"bar-inner3",children:s.jsx("div",{className:`bar-fill3${w}`,style:{"--bar-width":`${x}%`},children:s.jsxs("div",{className:"bar-value3",children:[R(x,1),"%"]})})})]},v))]}):s.jsx("div",{className:"card3 bar-chart-container3",style:{display:"flex",alignItems:"center",justifyContent:"center",height:"300px"},children:s.jsx("div",{style:{color:"#6b7280",fontSize:"16px"},children:"No complaint cost category data available for this period"})})]}),s.jsxs("div",{className:"chart-gauge-wrapper3",children:[s.jsxs("div",{className:"card3",children:[s.jsx("h3",{children:"Repeat Call Trend – Month-over-Month"}),s.jsx("div",{className:"line-chart3",children:s.jsx(Sg,{trend:e.repeatTrend})}),s.jsx("div",{className:"legend3",children:s.jsxs("div",{className:"legend-item3",children:[s.jsx("div",{className:"legend-color3",style:{background:"#3b82f6"}}),s.jsx("span",{children:"Repeat Calls"})]})})]}),s.jsx("div",{className:"gauge-wrapper3",children:s.jsxs("div",{className:"gauge-container3",style:{"--percentage":l.positive_feedback_percentage},children:[s.jsx("div",{className:"gauge-inside-heading3",children:"% Positive Feedback"}),s.jsxs("div",{className:"gauge-arc-container3",children:[s.jsx("div",{className:"gauge-bg-arc3",children:s.jsx("div",{className:"gauge-progress-arc3"})}),s.jsx("div",{className:"gauge-inner-cutout3"}),s.jsx("div",{className:"gauge-indicator3"}),s.jsxs("div",{className:"gauge-value-display3",children:[s.jsx("div",{className:"gauge-percentage3",children:l.positive_feedback_percentage}),s.jsx("div",{className:"gauge-text3",children:"Feedback"})]})]}),s.jsxs("div",{className:"gauge-labels3",children:[s.jsx("span",{children:"0%"}),s.jsx("span",{children:"100%"})]})]})})]}),s.jsxs("div",{className:"benchmarks-section3 animate-in",children:[s.jsx("div",{className:"section-header3",children:s.jsxs("div",{className:"section-title3",children:["Customer Satisfaction (",i.overall_count," reviews)"]})}),s.jsxs("div",{className:"satisfaction-grid3",children:[s.jsxs("div",{children:[s.jsxs("div",{className:"rating-display3",children:[s.jsx("div",{className:"rating-score3",children:u}),s.jsx("div",{className:"rating-stars3",children:m}),s.jsx("div",{className:"rating-label3",children:"Average Customer Rating"})]}),s.jsx("div",{className:"bar-chart3",style:{height:"180px",marginTop:"20px"},children:i.months.map(v=>{let x=0;return v.average>0&&(x=v.average/5*100,x<5&&(x=5)),s.jsxs("div",{className:"bar-group3",children:[s.jsx("div",{className:"bars3",children:s.jsx("div",{className:"bar3",style:v.count>0?{height:`${x}%`,background:"linear-gradient(180deg, #fbbf24 0%, #f59e0b 100%)"}:{height:"5%",background:"#e5e7eb"}})}),s.jsx("div",{className:"bar-label3",children:v.name})]},v.name)})})]}),s.jsxs("div",{children:[s.jsx("h3",{style:{fontSize:"16px",fontWeight:600,marginBottom:"15px",color:"#1f2937"},children:"Recent Complaints"}),s.jsx("div",{className:"complaints-list3",children:o.length>0?o.map((v,x)=>s.jsxs("div",{className:"complaint-item3",children:[s.jsx("div",{className:"complaint-date3",children:Uc(v.feedback_date)}),s.jsxs("div",{className:"complaint-text3",children:[v.customer_feedback," - Customer: ",v.customer_name]})]},x)):s.jsxs("div",{className:"complaint-item3",children:[s.jsx("div",{className:"complaint-date3",children:"Empty"}),s.jsx("div",{className:"complaint-text3",children:"No Data found!"})]})})]})]})]}),s.jsxs("div",{className:"card3",children:[s.jsx("h3",{children:"Calibration / Maintenance Reports"}),s.jsxs("table",{className:"table3",style:{width:"100%",borderCollapse:"collapse",fontSize:"14px"},children:[s.jsx("thead",{children:s.jsxs("tr",{children:[s.jsx("th",{children:"Equipment"}),s.jsx("th",{children:"Report Type"}),s.jsx("th",{children:"Last Service Date"}),s.jsx("th",{children:"Next Service Date"}),s.jsx("th",{children:"Service Person"}),s.jsx("th",{children:"Status"})]})}),s.jsx("tbody",{children:a.map((v,x)=>{let w={};return v.is_due_this_month?w={backgroundColor:"#fffacd"}:v.is_overdue&&(w={backgroundColor:"#ffe6e6"}),s.jsxs("tr",{style:w,children:[s.jsx("td",{children:v.equipment}),s.jsx("td",{children:v.report_type}),s.jsx("td",{children:v.last_service_date}),s.jsx("td",{children:v.next_service_date}),s.jsx("td",{children:v.service_person}),s.jsx("td",{style:{textAlign:"center"},children:s.jsx("span",{style:{...kg,..._g[v.status_color]},children:v.status})})]},x)})})]})]})]})}function Cs({children:e,error:t}){return s.jsx("div",{className:t?"widget-status widget-error":"widget-status",children:e})}function Ng({preset:e,onPresetChange:t,customFrom:n,customTo:r,onCustomFromChange:l,onCustomToChange:i,range:o}){return s.jsxs("div",{className:"date-filter",children:[s.jsx("label",{htmlFor:"dashboard-date-filter",children:"Date range"}),s.jsxs("select",{id:"dashboard-date-filter",value:e,onChange:a=>t(a.target.value),children:[s.jsx("option",{value:"today",children:"Today"}),s.jsx("option",{value:"last7",children:"Last 7 Days"}),s.jsx("option",{value:"month",children:"This Month"}),s.jsx("option",{value:"custom",children:"Custom Date Range"})]}),e==="custom"&&s.jsxs(s.Fragment,{children:[s.jsx("input",{"aria-label":"Start date",type:"date",value:n,max:r,onChange:a=>l(a.target.value)}),s.jsx("span",{children:"to"}),s.jsx("input",{"aria-label":"End date",type:"date",value:r,min:n,onChange:a=>i(a.target.value)})]}),s.jsxs("span",{className:"date-range-label",children:[Nl(o.from)," – ",Nl(o.to)]})]})}function Eg(){const e=V.useMemo(()=>mr(new Date),[]),[t,n]=V.useState("today"),[r,l]=V.useState("today"),[i,o]=V.useState(Ur(e)),[a,u]=V.useState(Ur(e)),[c,g]=V.useState({}),[m,h]=V.useState({today:"idle",weekly:"idle",monthly:"idle"}),[v,x]=V.useState(""),w=V.useRef({}),D=V.useRef({}),p=V.useMemo(()=>{if(r!=="custom")return _s(r,e);const M=ks(i)||e,O=ks(a)||e;return M<=O?{from:M,to:O}:{from:O,to:M}},[e,i,a,r]),d=p.to,f=V.useCallback(M=>{if(l(M),M!=="custom"){const O=_s(M,e);o(Ur(O.from)),u(Ur(O.to))}},[e]),y=V.useCallback(async M=>{if(!w.current[M]){w.current[M]=!0,h(O=>({...O,[M]:"loading"}));try{for(const O of Tp(M)){const Ye=await Dp(O,d);g(jn=>({...jn,[O]:Ye}))}h(O=>({...O,[M]:"done"}))}catch(O){console.error("Dashboard loading error:",O),x(el(O))}}},[d]);V.useEffect(()=>{var M,O,Ye;if(!((Ye=(O=(M=window.ZOHO)==null?void 0:M.CREATOR)==null?void 0:O.DATA)!=null&&Ye.getRecords)){x("Zoho Creator Widget SDK is not available.");return}y("today")},[y]),V.useEffect(()=>{w.current={},D.current={},h({today:"idle",weekly:"idle",monthly:"idle"}),y("today")},[d,y]),V.useEffect(()=>{v||(t==="weekly"&&y("weekly"),t==="monthly"&&y("monthly"))},[t,v,y]);const _=m.today==="done",S=_&&m.weekly==="done",E=_&&m.monthly==="done",j=V.useMemo(()=>_?fg(c,d):null,[_,c,d]),F=V.useMemo(()=>S?pg(c,d):null,[S,c,d]),P=V.useMemo(()=>E?gg(c,d):null,[E,c,d]);V.useEffect(()=>{[["today",j],["weekly",F],["monthly",P]].forEach(([M,O])=>{if(!O||D.current[M])return;D.current[M]=!0;const Ye=mg(M,O);_n.results[M]=Ye,console.log(`[Dashboard] ${M} values - compare with the Deluge dashboard (copy(__ADROIT_DEBUG__.text()) copies all tabs)`),console.table(Ye.map(({label:jn,value:Rn})=>({label:jn,value:Rn})))})},[j,F,P]);const pe=s.jsx(Cs,{children:v?"":"Loading dashboard data..."});return s.jsxs(s.Fragment,{children:[s.jsx("style",{children:hg}),s.jsx("style",{children:vg}),s.jsxs("div",{className:"tab-container",children:[v&&s.jsx(Cs,{error:!0,children:v}),s.jsx(Ng,{preset:r,onPresetChange:f,customFrom:i,customTo:a,onCustomFromChange:o,onCustomToChange:u,range:p}),s.jsx("input",{type:"radio",name:"tabs",id:"tab1",className:"tab-input",checked:t==="today",onChange:()=>n("today")}),s.jsx("input",{type:"radio",name:"tabs",id:"tab2",className:"tab-input",checked:t==="weekly",onChange:()=>n("weekly")}),s.jsx("input",{type:"radio",name:"tabs",id:"tab3",className:"tab-input",checked:t==="monthly",onChange:()=>n("monthly")}),s.jsxs("div",{className:"tab-buttons",children:[s.jsx("label",{htmlFor:"tab1",className:"tab-label",children:"Today's"}),s.jsx("label",{htmlFor:"tab2",className:"tab-label",children:"Weekly"}),s.jsx("label",{htmlFor:"tab3",className:"tab-label",children:"Monthly"})]}),s.jsxs("div",{className:"tab-contents",children:[s.jsx("div",{id:"content1",className:"tab-content",children:j?s.jsx(xg,{view:j,today:d}):pe}),s.jsx("div",{id:"content2",className:"tab-content",children:F?s.jsx(wg,{view:F}):t==="weekly"?pe:null}),s.jsx("div",{id:"content3",className:"tab-content",children:P?s.jsx(Cg,{view:P}):t==="monthly"?pe:null})]})]})]})}Mc(document.getElementById("root")).render(s.jsx(Eg,{}));
