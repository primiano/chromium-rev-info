function insertTooltips (domNode) {
    if (domNode.nodeType === Node.ELEMENT_NODE) {
        var children = domNode.childNodes;
        for (var i=0; i<children.length; i++) {
            var child = children[i];
            if (child.className == 'tooltip_parsed')
              continue;
            insertTooltips(child);
        }
    }
    else if (domNode.nodeType === Node.TEXT_NODE) {
        var text = domNode.nodeValue;
        re = /[a-f0-9]{8,40}/g;
        while (match = re.exec(text)) {
            var span = document.createElement('span');
            var mid = domNode.splitText(match.index);
            mid.splitText(match[0].length);
            mid.parentNode.insertBefore(span,mid);
            mid.parentNode.removeChild(mid);
            span.appendChild(mid);
            span.className = 'tooltip_parsed';
            getCommitPosition(match[0], span);
            text = domNode.Value;
        }
    }
}

function getCommitPosition(sha1, node) {
  chrome.runtime.sendMessage({type: "getCommitPosition", sha1: sha1}, function(response) {
    if (response && response.length > 0) {
      node.className = 'tooltip';
      node.dataset['tooltip'] = response;
    }
  });
}

insertTooltips(document.body);
