var g_branches = [];
var g_enabled = false;

chrome.browserAction.onClicked.addListener(function() {
  if (!g_enabled) {
    chrome.browserAction.setBadgeText({text: "..."});
    g_enabled = true;
    loadOmahaBranches();
  } else {
    chrome.browserAction.setBadgeText({text: ""});
    g_enabled = false;
  }
});

chrome.tabs.onUpdated.addListener( function (tabId, changeInfo, tab) {
  if (g_enabled && changeInfo.status == 'complete' && tab.active) {
    enableForTab(tabId);
  }
})

chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    if (request.type == "getCommitPosition"){
      return getCommitPosition(request.sha1, sendResponse);
    }
  }
);

function enableForTab(tabId) {
  chrome.tabs.executeScript(tabId, {file: "contentscript.js"});
  chrome.tabs.insertCSS(tabId, {file: "basic.css"});
}

function getCommitPosition(sha1, sendResponse) {
  var xhr = new XMLHttpRequest();
  xhr.open("GET", "https://chromium.googlesource.com/chromium/src.git/+log/" + sha1 +"?format=JSON&n=1", true);
  xhr.onreadystatechange = function() {
    if (xhr.readyState != 4 || xhr.status != 200)
      return;
    var resp = xhr.responseText;
    if (resp.startsWith(')]}\''))
      resp = resp.slice(5);
    var data = JSON.parse(resp);
    var commit_message = data.log[0].message;
    var matches = /Cr-Commit-Position:\s*(.*)@\{#(\d+)\}/.exec(commit_message);
    if (!matches)
      return;
    var branch = matches[1];
    var pos = matches[2];
    var descr = branch + ', #' + pos;
    if (branch == 'refs/heads/master') {
      g_branches.forEach(function(branch_config) {
        descr += '\n  ' + branch_config.os + ': ';
        branch_config.versions.forEach(function(branch_descr) {
          if (pos <= Number.parseInt(branch_descr.branch_base_position)) {
            descr += ' ' + branch_descr.channel + '(' + branch_descr.version + ')';
          }
        });
      });
    }
    descr += '\n---------------------------------';
    descr += '\n\n' + commit_message.split('\n')[0];
    sendResponse(descr);
  }
  xhr.send();
  return true;
}

function loadOmahaBranches() {
  var xhr = new XMLHttpRequest();
  xhr.open("GET", "https://omahaproxy.appspot.com/all.json", true);
  xhr.onreadystatechange = function() {
    if (xhr.readyState != 4 || xhr.status != 200)
      return;
    g_branches = JSON.parse(xhr.responseText);
    console.log('Loaded Omaha branches');
    console.log(g_branches);
    chrome.browserAction.setBadgeText({text: "ON"});
    chrome.tabs.query({active: true}, function(tabs){
      if (tabs.length <= 0)
        return;
      enableForTab(tabs[0].id);
    });
  }
  xhr.send();
}
