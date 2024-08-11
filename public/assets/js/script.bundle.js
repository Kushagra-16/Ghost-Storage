(()=>{"use strict";var t={705:function(t,e,n){var o=this&&this.__awaiter||function(t,e,n,o){return new(n||(n=Promise))((function(a,r){function i(t){try{s(o.next(t))}catch(t){r(t)}}function c(t){try{s(o.throw(t))}catch(t){r(t)}}function s(t){var e;t.done?a(t.value):(e=t.value,e instanceof n?e:new n((function(t){t(e)}))).then(i,c)}s((o=o.apply(t,e||[])).next())}))},a=this&&this.__generator||function(t,e){var n,o,a,r,i={label:0,sent:function(){if(1&a[0])throw a[1];return a[1]},trys:[],ops:[]};return r={next:c(0),throw:c(1),return:c(2)},"function"==typeof Symbol&&(r[Symbol.iterator]=function(){return this}),r;function c(c){return function(s){return function(c){if(n)throw new TypeError("Generator is already executing.");for(;r&&(r=0,c[0]&&(i=0)),i;)try{if(n=1,o&&(a=2&c[0]?o.return:c[0]?o.throw||((a=o.return)&&a.call(o),0):o.next)&&!(a=a.call(o,c[1])).done)return a;switch(o=0,a&&(c=[2&c[0],a.value]),c[0]){case 0:case 1:a=c;break;case 4:return i.label++,{value:c[1],done:!1};case 5:i.label++,o=c[1],c=[0];continue;case 7:c=i.ops.pop(),i.trys.pop();continue;default:if(!((a=(a=i.trys).length>0&&a[a.length-1])||6!==c[0]&&2!==c[0])){i=0;continue}if(3===c[0]&&(!a||c[1]>a[0]&&c[1]<a[3])){i.label=c[1];break}if(6===c[0]&&i.label<a[1]){i.label=a[1],a=c;break}if(a&&i.label<a[2]){i.label=a[2],i.ops.push(c);break}a[2]&&i.ops.pop(),i.trys.pop();continue}c=e.call(t,i)}catch(t){c=[6,t],o=0}finally{n=a=0}if(5&c[0])throw c[1];return{value:c[0]?c[1]:void 0,done:!0}}([c,s])}}};Object.defineProperty(e,"__esModule",{value:!0});var r,i,c=n(185),s={};function u(t,e,n){return o(this,void 0,void 0,(function(){var o,r,s,u;return a(this,(function(a){return""!=(o=document.getElementById("path").dataset.path)&&(o+="/"),(r=new XMLHttpRequest).open("PUT","https://api.github.com/repos/Kushagra-16/storage/contents/".concat(o).concat(t.name),!0),r.setRequestHeader("Authorization","token ".concat(i)),r.setRequestHeader("Content-Type","application/json"),r.onload=function(){201==r.status||200==r.status?p(o.substring(0,o.lastIndexOf("/"))):console.error("Error uploading file ".concat(t.name),JSON.parse(r.responseText))},r.onerror=function(){console.error("Error Uploading")},n&&(s=document.getElementById("updown_progress"),u=document.getElementById("updown_progress_percent"),r.upload.onloadstart=function(){document.getElementById("updown_filename").innerHTML=t.name,document.getElementById("updown_file_count").innerHTML="(".concat(n.fileNo,"/").concat(n.filesCount,")"),document.getElementById("file_updown").style.visibility="initial"},r.upload.onprogress=function(t){if(t.lengthComputable){var e=t.loaded/t.total*100;u.innerHTML="".concat(Math.round(e),"%"),s.style.width="".concat(e,"%")}},r.upload.onloadend=function(){document.getElementById("file_updown").style.visibility="hidden",document.getElementById("updown_filename").innerHTML="",document.getElementById("updown_file_count").innerHTML="",s.style.width="0%",u.innerHTML="0%"}),r.send(JSON.stringify({message:"File Upload - ".concat(c.utils.getDateTime()),content:e,branch:"main"})),[2]}))}))}function l(t,e){return o(this,void 0,void 0,(function(){var n,o,r;return a(this,(function(a){return document.getElementById("path").dataset.path,(n=new XMLHttpRequest).open("GET",e,!0),n.setRequestHeader("Authorization","token ".concat(i)),n.setRequestHeader("Content-Type","application/json"),n.onload=function(){if(200===n.status){for(var e=JSON.parse(n.responseText),o=atob(e.content),a=new Array(o.length),r=0;r<o.length;r++)a[r]=o.charCodeAt(r);var i=new Uint8Array(a),c=new Blob([i],{type:"application/octet-stream"}),s=URL.createObjectURL(c),u=document.createElement("a");u.href=s,u.download=t,u.click(),URL.revokeObjectURL(s)}},o=document.getElementById("updown_progress"),r=document.getElementById("updown_progress_percent"),n.onloadstart=function(){document.getElementById("updown_filename").innerHTML=t,document.getElementById("updown_file_count").innerHTML="",document.getElementById("file_updown").style.visibility="initial"},n.onprogress=function(t){if(t.lengthComputable){var e=t.loaded/t.total*100;r.innerHTML="".concat(Math.round(e),"%"),o.style.width="".concat(e,"%")}},n.onloadend=function(){document.getElementById("file_updown").style.visibility="hidden",document.getElementById("updown_filename").innerHTML="",document.getElementById("updown_file_count").innerHTML="",o.style.width="0%",r.innerHTML="0%"},n.send(),[2]}))}))}function d(t){return o(this,void 0,void 0,(function(){var e;return a(this,(function(n){switch(n.label){case 0:return"Enter"!=t.key?[3,2]:(e=t.target.value,[4,u({name:"".concat(e,"/.ghost")},btoa("{}"))]);case 1:n.sent(),n.label=2;case 2:return[2]}}))}))}function p(t){return o(this,void 0,void 0,(function(){var e,n,r,u;return a(this,(function(f){switch(f.label){case 0:return c.utils.apply_page(t),e="https://api.github.com/repos/Kushagra-16/storage/contents/".concat(t),n={Authorization:"token ".concat(i),"Content-Type":"appliction/json"},s[e]&&(n["If-None-Match"]=s[e]),[4,fetch(e,{method:"GET",headers:n})];case 1:return 200!==(r=f.sent()).status?[3,3]:(s[e]=r.headers.get("ETag"),[4,r.json()]);case 2:return u=f.sent(),s["".concat(e,"_data")]=u,[3,4];case 3:304===r.status&&(u=s["".concat(e,"_data")]),f.label=4;case 4:return function(t){o(this,void 0,void 0,(function(){var e,n,r,s,u,f,m,h,y,g,v=this;return a(this,(function(b){switch(b.label){case 0:return e=document.getElementById("main"),s=(r=JSON).parse,u=atob,[4,fetch(t.filter((function(t){return".ghost"==t.name}))[0].git_url,{method:"GET",headers:{Authorization:"token ".concat(i),"Content-Type":"application/json"}})];case 1:return[4,b.sent().json()];case 2:for(n=s.apply(r,[u.apply(void 0,[b.sent().content])]),e.innerHTML='<div class="item item-new-folder"><svg class="item_icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-folder-plus" viewBox="0 0 16 16"><path d="m.5 3 .04.87a2 2 0 0 0-.342 1.311l.637 7A2 2 0 0 0 2.826 14H9v-1H2.826a1 1 0 0 1-.995-.91l-.637-7A1 1 0 0 1 2.19 4h11.62a1 1 0 0 1 .996 1.09L14.54 8h1.005l.256-2.819A2 2 0 0 0 13.81 3H9.828a2 2 0 0 1-1.414-.586l-.828-.828A2 2 0 0 0 6.172 1H2.5a2 2 0 0 0-2 2m5.672-1a1 1 0 0 1 .707.293L7.586 3H2.19q-.362.002-.683.12L1.5 2.98a1 1 0 0 1 1-.98z"/><path d="M13.5 9a.5.5 0 0 1 .5.5V11h1.5a.5.5 0 1 1 0 1H14v1.5a.5.5 0 1 1-1 0V12h-1.5a.5.5 0 0 1 0-1H13V9.5a.5.5 0 0 1 .5-.5"/></svg><input type="text" class="item_name" placeholder="Folder Name" id="new_folder_name"></div>',document.getElementById("new_folder_name").addEventListener("keydown",d),f=function(t){var r=document.createElement("div"),i=document.createElement("i"),s=document.createElement("span"),u=document.createElement("span");r.className="item",i.className="item_icon",((null===(g=n.hidden)||void 0===g?void 0:g.indexOf(t.name))>-1||".ghost"==t.name)&&r.classList.add("hidden_item"),s.className="item_name",u.className="item_size",r.dataset.id=t.name.split(".")[0];var d=c.utils.getIcon(t);if(d.subparts)for(var f=1;f<=d.subparts;f++){var m=document.createElement("span");m.className="path".concat(f),i.appendChild(m)}i.classList.add("icon-".concat(d.iconName)),s.innerText=t.name,"file"===t.type?(u.innerText=c.utils.formatSize(t.size),r.setAttribute("title",t.name),r.addEventListener("click",(function(){return o(v,void 0,void 0,(function(){return a(this,(function(e){switch(e.label){case 0:return[4,l(t.name,t.git_url)];case 1:return e.sent(),[2]}}))}))}))):"dir"===t.type&&r.addEventListener("click",(function(){e.innerHTML="",t.path.indexOf("/")>-1?document.getElementById("back_btn").dataset.path=t.path.substring(0,t.path.lastIndexOf("/")):document.getElementById("back_btn").dataset.path="",p(t.path)})),r.appendChild(i),r.appendChild(s),r.appendChild(u),e.appendChild(r)},m=0,h=t;m<h.length;m++)y=h[m],f(y);return[2]}}))}))}(u),[2]}}))}))}!function(){o(this,void 0,void 0,(function(){var t;return a(this,(function(e){switch(e.label){case 0:return t=prompt("Password: "),[4,c.utils.verify_password(t)];case 1:return e.sent()?(function(){var t=this;document.getElementById("files_input").addEventListener("input",(function(){for(var e=Array.from(document.getElementById("files_input").files),n=function(n){var r=e[n-1],i=new FileReader;i.onload=function(){return o(t,void 0,void 0,(function(){var t,o,c;return a(this,(function(a){switch(a.label){case 0:return t=i.result,o=new Uint8Array(t).reduce((function(t,e){return t+String.fromCharCode(e)}),""),c=btoa(o),[4,u(r,c,{fileNo:n,filesCount:e.length})];case 1:return a.sent(),[2]}}))}))},i.readAsArrayBuffer(r)},r=1;r<=e.length;r++)n(r)})),document.getElementById("back_btn").addEventListener("click",(function(){p(document.getElementById("back_btn").dataset.path)})),document.getElementById("add_btn").addEventListener("click",(function(){var t=document.getElementById("screen-context-menu");t.style.top="30px",t.style.right="30px",t.style.display="initial"})),document.body.addEventListener("click",(function(t){document.getElementById("add_btn").contains(t.target)||(document.getElementById("screen-context-menu").style.display="none"),document.getElementById("item-context-menu").style.display="none"}))}(),[4,c.utils.extract_token()]):[3,5];case 2:return i=e.sent(),[4,fetch("assets/resources/icons.json",{method:"GET"})];case 3:return[4,e.sent().json()];case 4:return r=e.sent(),c.utils.setup(r),p(""),[3,6];case 5:alert("Wrong Password.\nContent will not be loaded"),e.label=6;case 6:return[2]}}))}))}()},185:function(t,e){var n,o=this&&this.__awaiter||function(t,e,n,o){return new(n||(n=Promise))((function(a,r){function i(t){try{s(o.next(t))}catch(t){r(t)}}function c(t){try{s(o.throw(t))}catch(t){r(t)}}function s(t){var e;t.done?a(t.value):(e=t.value,e instanceof n?e:new n((function(t){t(e)}))).then(i,c)}s((o=o.apply(t,e||[])).next())}))},a=this&&this.__generator||function(t,e){var n,o,a,r,i={label:0,sent:function(){if(1&a[0])throw a[1];return a[1]},trys:[],ops:[]};return r={next:c(0),throw:c(1),return:c(2)},"function"==typeof Symbol&&(r[Symbol.iterator]=function(){return this}),r;function c(c){return function(s){return function(c){if(n)throw new TypeError("Generator is already executing.");for(;r&&(r=0,c[0]&&(i=0)),i;)try{if(n=1,o&&(a=2&c[0]?o.return:c[0]?o.throw||((a=o.return)&&a.call(o),0):o.next)&&!(a=a.call(o,c[1])).done)return a;switch(o=0,a&&(c=[2&c[0],a.value]),c[0]){case 0:case 1:a=c;break;case 4:return i.label++,{value:c[1],done:!1};case 5:i.label++,o=c[1],c=[0];continue;case 7:c=i.ops.pop(),i.trys.pop();continue;default:if(!((a=(a=i.trys).length>0&&a[a.length-1])||6!==c[0]&&2!==c[0])){i=0;continue}if(3===c[0]&&(!a||c[1]>a[0]&&c[1]<a[3])){i.label=c[1];break}if(6===c[0]&&i.label<a[1]){i.label=a[1],a=c;break}if(a&&i.label<a[2]){i.label=a[2],i.ops.push(c);break}a[2]&&i.ops.pop(),i.trys.pop();continue}c=e.call(t,i)}catch(t){c=[6,t],o=0}finally{n=a=0}if(5&c[0])throw c[1];return{value:c[0]?c[1]:void 0,done:!0}}([c,s])}}};Object.defineProperty(e,"__esModule",{value:!0}),e.utils=void 0;var r,i=function(){function t(t){this.salt=t,this.saltEnc=this.convertSaltToBinary(t)}return t.prototype.convertSaltToBinary=function(t){return t.split("").map((function(t){return t.charCodeAt(0).toString(2).padStart(8,"0")})).join("")},t.prototype.enc=function(t){var e=t.split("").map((function(t){return t.charCodeAt(0).toString(2).padStart(8,"0")})).join(this.saltEnc).match(/.{1,8}/g).map((function(t){return parseInt(t,2)}));return btoa(String.fromCharCode.apply(String,e))},t.prototype.dec=function(t){return atob(t).split("").map((function(t){return t.charCodeAt(0).toString(2).padStart(8,"0")})).join("").split(this.saltEnc).map((function(t){return String.fromCharCode(parseInt(t,2))})).join("")},t}();!function(t){t.getIcon=function(t){if("dir"===t.type){var e=n.defined.folder;for(var o in n.folderNames)Object.prototype.hasOwnProperty.call(n.folderNames,o)&&o==t.name.toLowerCase()&&(e=n.defined[n.folderNames[o]]);return{iconName:e=e.substring(0,e.indexOf(".")),subparts:n.iconSubparts[e]>1?n.iconSubparts[e]:void 0}}if("file"===t.type){for(var a in e=n.defined.file,n.fileNames)Object.prototype.hasOwnProperty.call(n.fileNames,a)&&a==t.name.toLowerCase()&&(e=n.defined[n.fileNames[a]]);for(var r in n.fileExtensions)if(Object.prototype.hasOwnProperty.call(n.fileExtensions,r)){var i=t.name.split(".");i[i.length-1]==r&&(e=n.defined[n.fileExtensions[r]])}return{iconName:e=e.substring(0,e.indexOf(".")),subparts:n.iconSubparts[e]>1?n.iconSubparts[e]:void 0}}},t.formatSize=function(t){return t<1024?"".concat(t," B"):t<Math.pow(1024,2)?"".concat((t/1024).toFixed(2)," KB"):t<Math.pow(1024,3)?"".concat((t/Math.pow(1024,2)).toFixed(2)," MB"):"".concat((t/Math.pow(1024,3)).toFixed(2)," GB")},t.getDateTime=function(){var t=new Date,e=new Date(t.getTime()+198e5),n=function(t){return t<10?"0"+t:t},o=n(e.getDate()),a=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][e.getMonth()],r=e.getFullYear(),i=e.getHours(),c=n(e.getMinutes()),s=n(e.getSeconds()),u=i>=12?"PM":"AM",l=n(i=(i%=12)||12);return"".concat(o,"/").concat(a,"/").concat(r," ").concat(l,":").concat(c,":").concat(s," ").concat(u)},t.apply_page=function(t){var e=document.getElementById("path");e.innerText="/ ".concat(t.replace(/\//g," / ")),e.dataset.path=t,t.indexOf("/")>-1?document.getElementById("back_btn").dataset.path=t.substring(0,t.lastIndexOf("/")):document.getElementById("back_btn").dataset.path="",""==t?(document.getElementById("back_btn").style.visibility="hidden",document.getElementById("add_btn").style.visibility="hidden"):(document.getElementById("back_btn").style.visibility="initial",document.getElementById("add_btn").style.visibility="initial")},t.setup=function(t){n=t},t.extract_token=function(){return o(this,void 0,void 0,(function(){var t,e;return a(this,(function(n){switch(n.label){case 0:return t=new i(document.documentElement.dataset.name).enc(document.documentElement.dataset.name),[4,fetch("/Ghost-Storage/assets/resources/.github.ghost",{method:"GET"})];case 1:return[4,n.sent().text()];case 2:return e=n.sent(),[2,new i(t).dec(e)]}}))}))},t.verify_password=function(t){return o(this,void 0,void 0,(function(){var e,n;return a(this,(function(o){switch(o.label){case 0:return e=new i(document.documentElement.dataset.name).enc(document.documentElement.dataset.name),[4,fetch("/Ghost-Storage/assets/resources/.password.ghost",{method:"GET"})];case 1:return[4,o.sent().text()];case 2:return n=o.sent(),new i(e).enc(t)==n?[2,!0]:[2,!1]}}))}))}}(r||(e.utils=r={}))}},e={};!function n(o){var a=e[o];if(void 0!==a)return a.exports;var r=e[o]={exports:{}};return t[o].call(r.exports,r,r.exports,n),r.exports}(705)})();