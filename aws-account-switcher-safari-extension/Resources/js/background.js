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

class AwsConfigIniParser {
  load(text) {
    const lines = text.split(/\r\n|\r|\n/);

    this.profiles = [];
    this.item = null;
    lines.forEach(line => { this.parseLine(line); });
    this.appendProfile();

    return this.profiles;
  }

  parseLine(line) {
    line = line.replace(/[\;\#].*$/, '').trim(); // trim comment and spaces
    if (line.length === 0) return; // skip empty line

    const item = this.item;
    const md = line.match(/^\[(.+)\]$/);
    if (md) {
      this.appendProfile();
      this.newProfile(md[1].trim());
    } else if (item) {
      const field = this.parseKeyValue(line);
      if (field.key in item) throw new Error(`duplicate definition of ${field.key}`)
      item[field.key] = field.value;
    } else {
      throw new Error('profile is not declared before the key property definitions')
    }
  }

  trimComment(str) {
    return str.replace(/[;#].*$/, '')
  }

  parseKeyValue(line) {
    const [key, val] = line.split('=', 2);
    if (val === undefined) throw new Error('invalid key property definition')
    return { key: key.trim(), value: val.trim() };
  }

  newProfile(name) {
    const pname = name.replace(/^profile\s+/i, '');
    this.item = { profile: pname };
  }

  appendProfile() {
    if (!this.item) return;

    const profile = this.brushAwsProfile(this.item);
    this.profiles.push(profile);
    this.item = null;
  }

  brushAwsProfile(item) {
    if (item.role_arn) {
      const parts = item.role_arn.split('/');
      const iams = parts.shift().split(':');

      item.aws_account_id = iams[4];
      item.role_name = parts.join('/');

      delete item.role_arn;
    }

    if (!item.aws_account_id) throw new Error('invalid profile definition whose the AWS account id is not specified')

    return item;
  }
}

function loadAwsConfig(text) {
  const parser = new AwsConfigIniParser();
  return parser.load(text);
}

var LZString=function(){function o(o,r){if(!t[o]){t[o]={};for(var n=0;n<o.length;n++)t[o][o.charAt(n)]=n;}return t[o][r]}var r=String.fromCharCode,n="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",e="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+-$",t={},i={compressToBase64:function(o){if(null==o)return "";var r=i._compress(o,6,function(o){return n.charAt(o)});switch(r.length%4){default:case 0:return r;case 1:return r+"===";case 2:return r+"==";case 3:return r+"="}},decompressFromBase64:function(r){return null==r?"":""==r?null:i._decompress(r.length,32,function(e){return o(n,r.charAt(e))})},compressToUTF16:function(o){return null==o?"":i._compress(o,15,function(o){return r(o+32)})+" "},decompressFromUTF16:function(o){return null==o?"":""==o?null:i._decompress(o.length,16384,function(r){return o.charCodeAt(r)-32})},compressToUint8Array:function(o){for(var r=i.compress(o),n=new Uint8Array(2*r.length),e=0,t=r.length;t>e;e++){var s=r.charCodeAt(e);n[2*e]=s>>>8,n[2*e+1]=s%256;}return n},decompressFromUint8Array:function(o){if(null===o||void 0===o)return i.decompress(o);for(var n=new Array(o.length/2),e=0,t=n.length;t>e;e++)n[e]=256*o[2*e]+o[2*e+1];var s=[];return n.forEach(function(o){s.push(r(o));}),i.decompress(s.join(""))},compressToEncodedURIComponent:function(o){return null==o?"":i._compress(o,6,function(o){return e.charAt(o)})},decompressFromEncodedURIComponent:function(r){return null==r?"":""==r?null:(r=r.replace(/ /g,"+"),i._decompress(r.length,32,function(n){return o(e,r.charAt(n))}))},compress:function(o){return i._compress(o,16,function(o){return r(o)})},_compress:function(o,r,n){if(null==o)return "";var e,t,i,s={},p={},u="",c="",a="",l=2,f=3,h=2,d=[],m=0,v=0;for(i=0;i<o.length;i+=1)if(u=o.charAt(i),Object.prototype.hasOwnProperty.call(s,u)||(s[u]=f++,p[u]=!0),c=a+u,Object.prototype.hasOwnProperty.call(s,c))a=c;else {if(Object.prototype.hasOwnProperty.call(p,a)){if(a.charCodeAt(0)<256){for(e=0;h>e;e++)m<<=1,v==r-1?(v=0,d.push(n(m)),m=0):v++;for(t=a.charCodeAt(0),e=0;8>e;e++)m=m<<1|1&t,v==r-1?(v=0,d.push(n(m)),m=0):v++,t>>=1;}else {for(t=1,e=0;h>e;e++)m=m<<1|t,v==r-1?(v=0,d.push(n(m)),m=0):v++,t=0;for(t=a.charCodeAt(0),e=0;16>e;e++)m=m<<1|1&t,v==r-1?(v=0,d.push(n(m)),m=0):v++,t>>=1;}l--,0==l&&(l=Math.pow(2,h),h++),delete p[a];}else for(t=s[a],e=0;h>e;e++)m=m<<1|1&t,v==r-1?(v=0,d.push(n(m)),m=0):v++,t>>=1;l--,0==l&&(l=Math.pow(2,h),h++),s[c]=f++,a=String(u);}if(""!==a){if(Object.prototype.hasOwnProperty.call(p,a)){if(a.charCodeAt(0)<256){for(e=0;h>e;e++)m<<=1,v==r-1?(v=0,d.push(n(m)),m=0):v++;for(t=a.charCodeAt(0),e=0;8>e;e++)m=m<<1|1&t,v==r-1?(v=0,d.push(n(m)),m=0):v++,t>>=1;}else {for(t=1,e=0;h>e;e++)m=m<<1|t,v==r-1?(v=0,d.push(n(m)),m=0):v++,t=0;for(t=a.charCodeAt(0),e=0;16>e;e++)m=m<<1|1&t,v==r-1?(v=0,d.push(n(m)),m=0):v++,t>>=1;}l--,0==l&&(l=Math.pow(2,h),h++),delete p[a];}else for(t=s[a],e=0;h>e;e++)m=m<<1|1&t,v==r-1?(v=0,d.push(n(m)),m=0):v++,t>>=1;l--,0==l&&(l=Math.pow(2,h),h++);}for(t=2,e=0;h>e;e++)m=m<<1|1&t,v==r-1?(v=0,d.push(n(m)),m=0):v++,t>>=1;for(;;){if(m<<=1,v==r-1){d.push(n(m));break}v++;}return d.join("")},decompress:function(o){return null==o?"":""==o?null:i._decompress(o.length,32768,function(r){return o.charCodeAt(r)})},_decompress:function(o,n,e){var i,s,p,u,c,a,l,f=[],h=4,d=4,m=3,v="",w=[],A={val:e(0),position:n,index:1};for(i=0;3>i;i+=1)f[i]=i;for(p=0,c=Math.pow(2,2),a=1;a!=c;)u=A.val&A.position,A.position>>=1,0==A.position&&(A.position=n,A.val=e(A.index++)),p|=(u>0?1:0)*a,a<<=1;switch(p){case 0:for(p=0,c=Math.pow(2,8),a=1;a!=c;)u=A.val&A.position,A.position>>=1,0==A.position&&(A.position=n,A.val=e(A.index++)),p|=(u>0?1:0)*a,a<<=1;l=r(p);break;case 1:for(p=0,c=Math.pow(2,16),a=1;a!=c;)u=A.val&A.position,A.position>>=1,0==A.position&&(A.position=n,A.val=e(A.index++)),p|=(u>0?1:0)*a,a<<=1;l=r(p);break;case 2:return ""}for(f[3]=l,s=l,w.push(l);;){if(A.index>o)return "";for(p=0,c=Math.pow(2,m),a=1;a!=c;)u=A.val&A.position,A.position>>=1,0==A.position&&(A.position=n,A.val=e(A.index++)),p|=(u>0?1:0)*a,a<<=1;switch(l=p){case 0:for(p=0,c=Math.pow(2,8),a=1;a!=c;)u=A.val&A.position,A.position>>=1,0==A.position&&(A.position=n,A.val=e(A.index++)),p|=(u>0?1:0)*a,a<<=1;f[d++]=r(p),l=d-1,h--;break;case 1:for(p=0,c=Math.pow(2,16),a=1;a!=c;)u=A.val&A.position,A.position>>=1,0==A.position&&(A.position=n,A.val=e(A.index++)),p|=(u>0?1:0)*a,a<<=1;f[d++]=r(p),l=d-1,h--;break;case 2:return w.join("")}if(0==h&&(h=Math.pow(2,m),m++),f[l])v=f[l];else {if(l!==d)return null;v=s+s.charAt(0);}w.push(v),f[d++]=s+v.charAt(0),h--,s=v,0==h&&(h=Math.pow(2,m),m++);}}};return i}();"function"==typeof define&&define.amd?define(function(){return LZString}):"undefined"!=typeof module&&null!=module&&(module.exports=LZString);

class StorageRepository {
  constructor(browser, storageArea) {
    this.runtime = browser.runtime;
    this.storageArea = browser.storage[storageArea];
  }

  get(keys) {
    return new Promise(resolve => {
      this.storageArea.get(keys, resolve);
    })
  }

  set(items) {
    return new Promise((resolve, reject) => {
      this.storageArea.set(items, () => {
        const { lastError } = this.runtime;
        if (lastError) return reject(lastError)
        resolve();
      });
    })
  }

  delete(keys) {
    this.storageArea.remove(keys, () => {});
  }
}

class SyncStorageRepository extends StorageRepository {
  constructor(browser) {
    super(browser, 'sync');
  }
}

class LocalStorageRepository extends StorageRepository {
  constructor(browser) {
    super(browser, 'local');
  }
}

const syncStorageRepo = new SyncStorageRepository(chrome || browser);

function saveAwsConfig(data, callback, storageRepo) {
  const rawstr = data;

  try {
    const profiles = loadAwsConfig(rawstr);
    if (profiles.length > 2000) {
      callback({
        result: 'failure',
        error: {
          message: 'The number of profiles exceeded maximum 2000.'
        }
      });
      return;
    }

    const dps = new DataProfilesSplitter(400);
    const dataSet = dps.profilesToDataSet(profiles);
    dataSet.lztext = LZString.compressToUTF16(rawstr);

    storageRepo.set(dataSet)
    .then(() => {
      callback({ result: 'success' });
    });
  } catch (e) {
    callback({
      result: 'failure',
      error: {
        message: e.message
      }
    });
  }
}

function initScript() {
  localStorage.setItem('switchCount', 0);
}

chrome.runtime.onStartup.addListener(function () { initScript(); });

chrome.runtime.onInstalled.addListener(function (details) {
  const { reason } = details;
  let page = null;
  if (reason === 'install' || reason === 'update') {
    page = 'updated.html';
  }
  if (page) {
    const url = chrome.extension.getURL(page);
    chrome.tabs.create({ url }, function(){});
  }

  initScript();
});

chrome.runtime.onMessageExternal.addListener(function (message, sender, sendResponse) {
  const { action, dataType, data } = message || {};
  if (!action || !dataType || !data) return;

  if (action !== 'updateConfig') {
    sendResponse({
      result: 'failure',
      error: { message: 'Invalid action' }
    });
    return;
  }

  if (dataType !== 'ini') {
    sendResponse({
      result: 'failure',
      error: { message: 'Invalid dataType' }
    });
    return;
  }

  syncStorageRepo.get(['configSenderId', 'configStorageArea'])
  .then(settings => {
    const configStorageArea = settings.configStorageArea || 'sync';
    const configSenderIds = (settings.configSenderId || '').split(',');

    if (configSenderIds.includes(sender.id)) {
      if (configStorageArea === 'sync') {
        // forcibly change
        syncStorageRepo.set({ configStorageArea: 'local' }).then(() => {});
      }
      saveAwsConfig(data, sendResponse, new LocalStorageRepository(chrome || browser));
    } else {
      setTimeout(() => {
        sendResponse({
          result: 'failure',
          error: { message: 'Invalid sender ID' }
        });
      }, 1000); // delay to prevent to try scanning id
    }
  });
});
