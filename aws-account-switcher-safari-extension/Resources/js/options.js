function parseKeyValue(line) {
  var strs = line.split('=', 2);
  var key = strs[0].trim();
  var val = strs[1].trim();
  return { key: key, value: val };
}

function brushProfile(item) {
  if (item.role_arn) {
    var parts = item.role_arn.split('/');
    var iams = parts.shift().split(':');

    item.aws_account_id = iams[4];
    item.role_name = parts.join('/');

    delete item.role_arn;
  }

  return item;
}


function loadAwsConfig(text) {
  var profiles = [];
  var lines = text.split(/\r\n|\r|\n/);

  var item = null;
  lines.forEach(function(rawline) {
    var line = rawline.trim();
    var field, r;

    var firstChar = line.charAt(0);
    if (firstChar === ';' || firstChar === '#') {
      line = ''; // Comment Line
    }

    if (r = line.match(/^\[(.+)\]$/)) {
      if (item) profiles.push(brushProfile(item));

      var pname = r[1].trim();
      pname = pname.replace(/^profile\s+/i, '');
      item = { profile: pname };
    } else if (item) {
      if (line.length > 0) {
        var field = parseKeyValue(line);
        item[field.key] = field.value;
      } else {
        profiles.push(brushProfile(item));
        item = null;
      }
    }
  })
  if (item) profiles.push(brushProfile(item));

  return profiles;
}
function ColorPicker(doc) {
  var colorPicker = doc.getElementById('colorPicker');
  var colorValue = doc.getElementById('colorValue');
  this.onpick = null;

  var me = this;

  colorPicker.oninput = function() {
    var rrggbb = this.value.substr(1);
    colorValue.value = rrggbb;
    if (me.onpick != null) {
      me.onpick(rrggbb);
    }
  }

  colorValue.oninput = function() {
    colorPicker.value = '#'+this.value;
    if (me.onpick != null) {
      me.onpick(this.value);
    }
  }

  colorValue.oninput = function() {
    colorPicker.value = '#'+this.value;
  }

  colorValue.onkeypress = function(evt) {
    if (evt.keyCode === 13) {
      if (me.onpick != null) {
        me.onpick(this.value);
      }
    }
  }
}

ColorPicker.prototype.setColor = function(color){
  colorPicker.value = '#'+color;
  colorValue.value = color;
}
class DataProfilesSplitter {
  constructor(by) {
    this.by = by || 40;
  }

  profilesFromDataSet(dataSet) {
    let profiles = dataSet.profiles;
    for (let i = 1; i < 5; i++) {
      const key = `profiles_${i}`;
      if (key in dataSet && dataSet[key].length > 0) {
        profiles = profiles.concat(dataSet[key]);
      } else {
        break;
      }
    }
    return profiles;
  }

  profilesToDataSet(profiles) {
    const orgProfiles = profiles.splice(0, this.by);
    const dataSet = { profiles: orgProfiles };
    for (let i = 1; i < 5; i++) {
      if (profiles.length > 0) {
        dataSet[`profiles_${i}`] = profiles.splice(0, this.by);
      } else {
        dataSet[`profiles_${i}`] = [];
      }
    }
    return dataSet;  
  }
}
var LZString=function(){function o(o,r){if(!t[o]){t[o]={};for(var n=0;n<o.length;n++)t[o][o.charAt(n)]=n}return t[o][r]}var r=String.fromCharCode,n="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",e="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+-$",t={},i={compressToBase64:function(o){if(null==o)return"";var r=i._compress(o,6,function(o){return n.charAt(o)});switch(r.length%4){default:case 0:return r;case 1:return r+"===";case 2:return r+"==";case 3:return r+"="}},decompressFromBase64:function(r){return null==r?"":""==r?null:i._decompress(r.length,32,function(e){return o(n,r.charAt(e))})},compressToUTF16:function(o){return null==o?"":i._compress(o,15,function(o){return r(o+32)})+" "},decompressFromUTF16:function(o){return null==o?"":""==o?null:i._decompress(o.length,16384,function(r){return o.charCodeAt(r)-32})},compressToUint8Array:function(o){for(var r=i.compress(o),n=new Uint8Array(2*r.length),e=0,t=r.length;t>e;e++){var s=r.charCodeAt(e);n[2*e]=s>>>8,n[2*e+1]=s%256}return n},decompressFromUint8Array:function(o){if(null===o||void 0===o)return i.decompress(o);for(var n=new Array(o.length/2),e=0,t=n.length;t>e;e++)n[e]=256*o[2*e]+o[2*e+1];var s=[];return n.forEach(function(o){s.push(r(o))}),i.decompress(s.join(""))},compressToEncodedURIComponent:function(o){return null==o?"":i._compress(o,6,function(o){return e.charAt(o)})},decompressFromEncodedURIComponent:function(r){return null==r?"":""==r?null:(r=r.replace(/ /g,"+"),i._decompress(r.length,32,function(n){return o(e,r.charAt(n))}))},compress:function(o){return i._compress(o,16,function(o){return r(o)})},_compress:function(o,r,n){if(null==o)return"";var e,t,i,s={},p={},u="",c="",a="",l=2,f=3,h=2,d=[],m=0,v=0;for(i=0;i<o.length;i+=1)if(u=o.charAt(i),Object.prototype.hasOwnProperty.call(s,u)||(s[u]=f++,p[u]=!0),c=a+u,Object.prototype.hasOwnProperty.call(s,c))a=c;else{if(Object.prototype.hasOwnProperty.call(p,a)){if(a.charCodeAt(0)<256){for(e=0;h>e;e++)m<<=1,v==r-1?(v=0,d.push(n(m)),m=0):v++;for(t=a.charCodeAt(0),e=0;8>e;e++)m=m<<1|1&t,v==r-1?(v=0,d.push(n(m)),m=0):v++,t>>=1}else{for(t=1,e=0;h>e;e++)m=m<<1|t,v==r-1?(v=0,d.push(n(m)),m=0):v++,t=0;for(t=a.charCodeAt(0),e=0;16>e;e++)m=m<<1|1&t,v==r-1?(v=0,d.push(n(m)),m=0):v++,t>>=1}l--,0==l&&(l=Math.pow(2,h),h++),delete p[a]}else for(t=s[a],e=0;h>e;e++)m=m<<1|1&t,v==r-1?(v=0,d.push(n(m)),m=0):v++,t>>=1;l--,0==l&&(l=Math.pow(2,h),h++),s[c]=f++,a=String(u)}if(""!==a){if(Object.prototype.hasOwnProperty.call(p,a)){if(a.charCodeAt(0)<256){for(e=0;h>e;e++)m<<=1,v==r-1?(v=0,d.push(n(m)),m=0):v++;for(t=a.charCodeAt(0),e=0;8>e;e++)m=m<<1|1&t,v==r-1?(v=0,d.push(n(m)),m=0):v++,t>>=1}else{for(t=1,e=0;h>e;e++)m=m<<1|t,v==r-1?(v=0,d.push(n(m)),m=0):v++,t=0;for(t=a.charCodeAt(0),e=0;16>e;e++)m=m<<1|1&t,v==r-1?(v=0,d.push(n(m)),m=0):v++,t>>=1}l--,0==l&&(l=Math.pow(2,h),h++),delete p[a]}else for(t=s[a],e=0;h>e;e++)m=m<<1|1&t,v==r-1?(v=0,d.push(n(m)),m=0):v++,t>>=1;l--,0==l&&(l=Math.pow(2,h),h++)}for(t=2,e=0;h>e;e++)m=m<<1|1&t,v==r-1?(v=0,d.push(n(m)),m=0):v++,t>>=1;for(;;){if(m<<=1,v==r-1){d.push(n(m));break}v++}return d.join("")},decompress:function(o){return null==o?"":""==o?null:i._decompress(o.length,32768,function(r){return o.charCodeAt(r)})},_decompress:function(o,n,e){var t,i,s,p,u,c,a,l,f=[],h=4,d=4,m=3,v="",w=[],A={val:e(0),position:n,index:1};for(i=0;3>i;i+=1)f[i]=i;for(p=0,c=Math.pow(2,2),a=1;a!=c;)u=A.val&A.position,A.position>>=1,0==A.position&&(A.position=n,A.val=e(A.index++)),p|=(u>0?1:0)*a,a<<=1;switch(t=p){case 0:for(p=0,c=Math.pow(2,8),a=1;a!=c;)u=A.val&A.position,A.position>>=1,0==A.position&&(A.position=n,A.val=e(A.index++)),p|=(u>0?1:0)*a,a<<=1;l=r(p);break;case 1:for(p=0,c=Math.pow(2,16),a=1;a!=c;)u=A.val&A.position,A.position>>=1,0==A.position&&(A.position=n,A.val=e(A.index++)),p|=(u>0?1:0)*a,a<<=1;l=r(p);break;case 2:return""}for(f[3]=l,s=l,w.push(l);;){if(A.index>o)return"";for(p=0,c=Math.pow(2,m),a=1;a!=c;)u=A.val&A.position,A.position>>=1,0==A.position&&(A.position=n,A.val=e(A.index++)),p|=(u>0?1:0)*a,a<<=1;switch(l=p){case 0:for(p=0,c=Math.pow(2,8),a=1;a!=c;)u=A.val&A.position,A.position>>=1,0==A.position&&(A.position=n,A.val=e(A.index++)),p|=(u>0?1:0)*a,a<<=1;f[d++]=r(p),l=d-1,h--;break;case 1:for(p=0,c=Math.pow(2,16),a=1;a!=c;)u=A.val&A.position,A.position>>=1,0==A.position&&(A.position=n,A.val=e(A.index++)),p|=(u>0?1:0)*a,a<<=1;f[d++]=r(p),l=d-1,h--;break;case 2:return w.join("")}if(0==h&&(h=Math.pow(2,m),m++),f[l])v=f[l];else{if(l!==d)return null;v=s+s.charAt(0)}w.push(v),f[d++]=s+v.charAt(0),h--,s=v,0==h&&(h=Math.pow(2,m),m++)}}};return i}();"function"==typeof define&&define.amd?define(function(){return LZString}):"undefined"!=typeof module&&null!=module&&(module.exports=LZString);
function elById(id) {
  return document.getElementById(id);
}

window.onload = function() {
  let colorPicker = new ColorPicker(document);

  let selection = [];
  let textArea = elById('awsConfigTextArea');
  textArea.onselect = function() {
    let str = this.value.substring(this.selectionStart, this.selectionEnd);
    let r = str.match(/^([0-9a-fA-F]{6})$/);
    if (r !== null) {
      colorPicker.setColor(r[1]);
      selection = [this.selectionStart, this.selectionEnd];
      colorPicker.onpick = function(newColor) {
        str = textArea.value;
        textArea.value = str.substring(0, selection[0]) + newColor + str.substring(selection[1]);
      }
    } else {
      selection = [];
      colorPicker.onpick = null;
    }
  }

  let msgSpan = elById('msgSpan');
  let saveButton = elById('saveButton');
  saveButton.onclick = function() {
    let rawstr = textArea.value;

    try {
      const profiles = loadAwsConfig(rawstr);
      if (profiles.length > 200) {
        updateMessage(msgSpan, 'Failed to save bacause the number of profiles exceeded maximum 200!', '#dd1111');
        return;
      }

      localStorage['rawdata'] = rawstr;

      const dps = new DataProfilesSplitter();
      const dataSet = dps.profilesToDataSet(profiles);
      dataSet.lztext = LZString.compressToUTF16(rawstr);

      chrome.storage.sync.set(dataSet,
        function() {
          const { lastError } = chrome.runtime || browser.runtime;
          if (lastError) {
            updateMessage(msgSpan, lastError.message, '#dd1111');
            return;
          }

          updateMessage(msgSpan, 'Configuration has been updated!', '#1111dd');
          setTimeout(function() {
            msgSpan.firstChild.remove();
          }, 2500);
        });
    } catch (e) {
      updateMessage(msgSpan, 'Failed to save because of invalid format!', '#dd1111');
    }
  }

  const booleanSettings = ['hidesAccountId', 'showOnlyMatchingRoles', 'autoAssumeLastRole'];
  for (let key of booleanSettings) {
    elById(`${key}CheckBox`).onchange = function() {
      chrome.storage.sync.set({ [key]: this.checked });
    }
  }

  elById('configSenderIdText').onchange = function() {
    chrome.storage.sync.set({ configSenderId: this.value });
  }

  chrome.storage.sync.get(['lztext', 'configSenderId'].concat(booleanSettings), function(data) {
    let rawData = localStorage['rawdata'];
    if (data.lztext) {
      try {
        rawData = LZString.decompressFromUTF16(data.lztext);
      } catch(err) {
        rawdata = ';; !!!WARNING!!!\n;; Latest setting is broken.\n;; !!!WARNING!!!\n';
      }
    }
    textArea.value = rawData || '';
    elById('configSenderIdText').value = data.configSenderId || '';
    for (let key of booleanSettings) {
      elById(`${key}CheckBox`).checked = data[key] || false;
    }

    if ('hidesHistory' in data) {
      // clean deprecated key
      chrome.storage.sync.remove(['hidesHistory'], () => {})
    }
  });
}

function updateMessage(el, msg, color) {
  const span = document.createElement('span');
  span.style.color = color;
  span.textContent = msg;
  const child = el.firstChild;
  if (child) {
    el.replaceChild(span, child);
  } else {
    el.appendChild(span);
  }
}
