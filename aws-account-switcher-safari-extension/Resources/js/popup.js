function createProfileSet(profiles, userInfo, settings) {
  const {
    loginDisplayNameAccount, loginDisplayNameUser,
    roleDisplayNameAccount, roleDisplayNameUser,
  } = userInfo;
  const { showOnlyMatchingRoles } = settings;

  const baseAccount = brushAccountId(loginDisplayNameAccount);
  const loginRole = extractLoginRole(loginDisplayNameUser.split("/", 2)[0]);
  const filterByTargetRole = showOnlyMatchingRoles ? (roleDisplayNameUser || loginRole) : null;

  return new ProfileSet(profiles, baseAccount, { loginRole, filterByTargetRole });
}

class ProfileSet {
  constructor(items, baseAccount, { loginRole, filterByTargetRole }) {
    // Map that has entries { <awsAccountId>: <Profile> }
    this.srcProfileMap = {};
    let destsBySrcMap = {}; // { <srcProfileName>: [<destProfile>... ] }
    let independentOrSrcProfiles = [];
    let independentDests = [];

    items.forEach(item => {
      if (item.source_profile) {
        if (item.source_profile in destsBySrcMap) {
          destsBySrcMap[item.source_profile].push(item);
        } else {
          destsBySrcMap[item.source_profile] = [item];
        }
      } else {
        independentOrSrcProfiles.push(item);
      }
    });

    independentOrSrcProfiles.forEach(item => {
      if (item.profile in destsBySrcMap) {
        let key = item.aws_account_id;
        if (item.role_name) key += '/' + item.role_name;
        this.srcProfileMap[key] = item;
      } else {
        independentDests.push(item);
      }
    });

    let complexDests = [];
    const baseProfile = this.srcProfileMap[baseAccount + "/" + loginRole] || this.srcProfileMap[baseAccount];
    if (baseProfile) {
      complexDests = this._decideComplexDestProfiles(baseProfile, destsBySrcMap, filterByTargetRole);
      delete destsBySrcMap[baseProfile.profile];
    }

    // To display roles on the list
    this.destProfiles = [].concat(independentDests).concat(complexDests);
  }

  _decideComplexDestProfiles(baseProfile, destsBySrcMap, filterByTargetRole) {
    let profiles = (destsBySrcMap[baseProfile.profile] || []).map(profile => {
      if (!profile.role_name) {
        profile.role_name = baseProfile.target_role_name;
      }

      if (!profile.region && baseProfile.target_region) {
        profile.region = baseProfile.target_region;
      }
      
      return profile
    });

    if (filterByTargetRole) {
      profiles = profiles.filter(el => el.role_name === filterByTargetRole);
    }
    return profiles;
  }
}

function brushAccountId(val) {
  const r = val.match(/^(\d{4})\-(\d{4})\-(\d{4})$/);
  if (!r) return val;
  return r[1] + r[2] + r[3];
}

const RESERVED_SSO_PREFIX = "AWSReservedSSO_";
function extractLoginRole(role) {
  if (role.startsWith(RESERVED_SSO_PREFIX)) {
    // extract permission set from SSO role
    const lastUnderscore = role.lastIndexOf('_');
    return role.substr(RESERVED_SSO_PREFIX.length, lastUnderscore - RESERVED_SSO_PREFIX.length);
  }
  return role;
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

function openOptions() {
  if (window.chrome) {
    chrome.runtime.openOptionsPage(err => {
      console.error(`Error: ${err}`);
    });
  } else if (window.browser) {
    window.browser.runtime.openOptionsPage().catch(err => {
      console.error(`Error: ${err}`);
    });
  }
}

function getCurrentTab() {
  if (window.chrome) {
    return new Promise((resolve) => {
      chrome.tabs.query({ currentWindow:true, active:true }, tabs => {
        resolve(tabs[0]);
      });
    })
  } else if (window.browser) {
    return browser.tabs.query({ currentWindow:true, active:true }).then(tabs => tabs[0])
  }
}

function executeAction(tabId, action, data) {
  if (window.chrome) {
    return new Promise((resolve) => {
      chrome.tabs.sendMessage(tabId, { action, data }, {}, resolve);
    })
  } else if (window.browser) {
    return browser.tabs.sendMessage(tabId, { action, data })
  }
}

window.onload = function() {

  document.getElementById('openOptionsLink').onclick = function(e) {
    openOptions();
    return false;
  };

  document.getElementById('openCreditsLink').onclick = function(e) {
    chrome.tabs.create({ url: chrome.extension.getURL('credits.html')}, function(tab){});
    return false;
  };

  main();
};

function main() {
  getCurrentTab()
    .then(tab => {
      const url = new URL(tab.url);
      if (url.host.endsWith('.aws.amazon.com')
       || url.host.endsWith('.amazonaws-us-gov.com')
       || url.host.endsWith('.amazonaws.cn')) {
        executeAction(tab.id, 'loadInfo', {}).then(userInfo => {
          if (userInfo) {
            loadFormList(url, userInfo, tab.id);
            document.getElementById('main').style.display = 'block';
          } else {
            const noMain = document.getElementById('noMain');
            const p = noMain.querySelector('p');
            p.textContent = 'Failed to fetch user info from the AWS Management Console page';
            p.style.color = '#d11';
            noMain.style.display = 'block';
          }
        });
      } else {
        const p = noMain.querySelector('p');
        p.textContent = "You'll see the role list here when the current tab is AWS Management Console page.";
        p.style.color = '#666';
        noMain.style.display = 'block';
      }
    });
}

function loadFormList(currentUrl, userInfo, tabId) {
  const storageRepo = new SyncStorageRepository(chrome || browser);
  storageRepo.get(['hidesAccountId', 'showOnlyMatchingRoles', 'configStorageArea'])
  .then(data => {
    const hidesAccountId = data.hidesAccountId || false;
    const showOnlyMatchingRoles = data.showOnlyMatchingRoles || false;
    const configStorageArea = data.configStorageArea || 'sync';

    new StorageRepository(chrome || browser, configStorageArea).get(['profiles', 'profiles_1', 'profiles_2', 'profiles_3', 'profiles_4'])
    .then(data => {
      if (data.profiles) {
        const dps = new DataProfilesSplitter();
        const profiles = dps.profilesFromDataSet(data);
        const profileSet = createProfileSet(profiles, userInfo, { showOnlyMatchingRoles });

        const list = document.getElementById('roleList');
        loadProfiles(profileSet, tabId, list, currentUrl, userInfo.isGlobal, hidesAccountId);
      }
    });
  });
}

function loadProfiles(profileSet, tabId, list, currentUrl, isGlobal, hidesAccountId) {
  profileSet.destProfiles.forEach(item => {
    const color = item.color || 'aaaaaa';
    const li = document.createElement('li');
    const headSquare = document.createElement('span');
    headSquare.textContent = ' ';
    headSquare.className = 'headSquare';
    headSquare.style = `background-color: #${color}`;
    if (item.image) {
      headSquare.style += `; background-image: url('${item.image.replace(/"/g, '')}');`;
    }

    const anchor = document.createElement('a');
    anchor.href = "#";
    anchor.title = item.role_name + '@' + item.aws_account_id;
    anchor.dataset.profile = item.profile;
    anchor.dataset.rolename = item.role_name;
    anchor.dataset.account = item.aws_account_id;
    anchor.dataset.color = color;
    anchor.dataset.redirecturi = createRedirectURI(currentUrl, item.region);
    anchor.dataset.search = item.profile.toLowerCase() + ' ' + item.aws_account_id;

    anchor.appendChild(headSquare);
    anchor.appendChild(document.createTextNode(item.profile));

    if (hidesAccountId) {
      anchor.dataset.displayname = item.profile;
    } else {
      anchor.dataset.displayname = item.profile + '  |  ' + item.aws_account_id;

      const accountIdSpan = document.createElement('span');
      accountIdSpan.className = 'suffixAccountId';
      accountIdSpan.textContent = item.aws_account_id;
      anchor.appendChild(accountIdSpan);
    }

    li.appendChild(anchor);
    list.appendChild(li);
  });

  Array.from(list.querySelectorAll('li a')).forEach(anchor => {
    anchor.onclick = function() {
      const data = { ...this.dataset }; // do not directly refer DOM data in Firefox
      sendSwitchRole(tabId, data);
      return false;
    };
  });

  let AWSR_firstAnchor = null;
  document.getElementById('roleFilter').onkeyup = function(e) {
    const words = this.value.toLowerCase().split(' ');
    if (e.keyCode === 13) {
      if (AWSR_firstAnchor) {
        AWSR_firstAnchor.click();
      }
    } else {
      const lis = Array.from(document.querySelectorAll('#roleList > li'));
      let firstHitLi = null;
      lis.forEach(li => {
        const anchor = li.querySelector('a');
        const profileName = anchor.dataset.search;
        const hit = words.every(it => profileName.includes(it));
        li.style.display = hit ? 'block' : 'none';
        li.style.background = null;
        if (hit && firstHitLi === null) firstHitLi = li;
      });

      if (firstHitLi) {
        firstHitLi.style.background = '#f0f9ff';
        AWSR_firstAnchor = firstHitLi.querySelector('a');
      } else {
        AWSR_firstAnchor = null;
      }
    }
  };

  document.getElementById('roleFilter').focus();
}

function createRedirectURI(currentURL, destRegion) {
  if (!destRegion) return encodeURIComponent(currentURL.href);

  let redirectUri = currentURL.href;
  const md = currentURL.search.match(/region=([a-z\-1-9]+)/);
  if (md) {
    const currentRegion = md[1];
    if (currentRegion !== destRegion) {
      redirectUri = redirectUri.replace('region=' + currentRegion, 'region=' + destRegion);
    }
  }
  return encodeURIComponent(redirectUri);
}

function sendSwitchRole(tabId, data) {
  executeAction(tabId, 'switch', data).then(() => {
    let swcnt = localStorage.getItem('switchCount') || 0;
    localStorage.setItem('switchCount', ++swcnt);
    window.close();
  });
}
