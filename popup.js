document.addEventListener('DOMContentLoaded', function () {
  const jsonInput = document.getElementById('json-input');
  const jsonOutput = document.getElementById('json-output');
  const openStandaloneBtn = document.getElementById('open-standalone');
  const alwaysStandaloneCheck = document.getElementById('always-standalone');

  // Symbols for tree toggle
  const SYMBOL_COLLAPSED = '\u25B6'; // ▶
  const SYMBOL_EXPANDED = '\u25BC';   // ▼

  // Check if we're already in a standalone window
  const isStandalone = new URLSearchParams(window.location.search).get('mode') === 'standalone';

  if (isStandalone) {
    document.body.classList.add('standalone-body');
  }

  // Load settings
  chrome.storage.local.get(['alwaysStandalone'], (result) => {
    if (result.alwaysStandalone) {
      alwaysStandaloneCheck.checked = true;
      if (!isStandalone) {
        openStandaloneWindow();
      }
    }
  });

  // Save settings
  alwaysStandaloneCheck.addEventListener('change', () => {
    chrome.storage.local.set({ alwaysStandalone: alwaysStandaloneCheck.checked });
  });

  function openStandaloneWindow() {
    chrome.windows.create({
      url: chrome.runtime.getURL('popup.html?mode=standalone'),
      type: 'popup',
      width: 650,
      height: 750,
      focused: true
    }, (windowObj) => {
      if (chrome.runtime.lastError) {
        console.error('Failed to create window:', chrome.runtime.lastError);
        return;
      }
      // Only close if we are sure the new window is opening
      if (!isStandalone) {
        setTimeout(() => window.close(), 200);
      }
    });
  }

  openStandaloneBtn.addEventListener('click', openStandaloneWindow);

  jsonInput.addEventListener('keyup', function () {
    const inputText = jsonInput.value.trim();
    jsonOutput.innerHTML = '';

    if (!inputText) {
      return;
    }

    const foundJsons = findJsonObjects(inputText);

    if (foundJsons.length > 0) {
      foundJsons.forEach(item => {
        const { name, jsonString } = item;
        try {
          const json = JSON.parse(jsonString);
          const wrapper = document.createElement('div');
          wrapper.className = 'named-json-wrapper';
          
          const header = document.createElement('div');
          header.className = 'named-json-header';
          
          const title = document.createElement('span');
          title.textContent = name;
          
          const copyBtn = document.createElement('button');
          copyBtn.className = 'copy-btn';
          copyBtn.textContent = 'Copy';
          copyBtn.addEventListener('click', () => {
            navigator.clipboard.writeText(JSON.stringify(json, null, 2)).then(() => {
              copyBtn.textContent = 'Copied!';
              copyBtn.classList.add('copied');
              setTimeout(() => {
                copyBtn.textContent = 'Copy';
                copyBtn.classList.remove('copied');
              }, 2000);
            });
          });
          
          header.appendChild(title);
          header.appendChild(copyBtn);
          
          const tree = createTreeView(json);
          wrapper.appendChild(header);
          wrapper.appendChild(tree);
          jsonOutput.appendChild(wrapper);
        } catch (error) {
          // ignore parse errors for individual parts
        }
      });
    } else {
      // Fallback for single, unnamed JSON or multiple unnamed JSONs
      try {
        const json = JSON.parse(inputText);
        const tree = createTreeView(json);
        jsonOutput.appendChild(tree);
      } catch (error) {
        const jsonRegex = /({[\s\S]*?})/g;
        const matches = inputText.match(jsonRegex);
        let found = false;
        if (matches) {
          matches.forEach(match => {
            try {
              const json = JSON.parse(match);
              const tree = createTreeView(json);
              jsonOutput.appendChild(tree);
              found = true;
            } catch (e) { /* ignore */ }
          });
        }
        if (!found) {
          jsonOutput.textContent = 'No valid JSON found.';
        }
      }
    }
  });

  function findJsonObjects(text) {
    const results = [];
    const regex = /(\w+)\s*=\s*/g;
    let match;
    while ((match = regex.exec(text)) !== null) {
      const name = match[1];
      let startIndex = match.index + match[0].length;
      if (text[startIndex] !== '{') continue;
      let braceCount = 1;
      let inString = false;
      let endIndex = -1;
      for (let i = startIndex + 1; i < text.length; i++) {
        const char = text[i];
        if (char === '"' && text[i - 1] !== '\\') {
          inString = !inString;
        }
        if (inString) continue;
        if (char === '{') {
          braceCount++;
        } else if (char === '}') {
          braceCount--;
        }
        if (braceCount === 0) {
          endIndex = i;
          break;
        }
      }
      if (endIndex !== -1) {
        const jsonString = text.substring(startIndex, endIndex + 1);
        results.push({ name, jsonString });
      }
    }
    return results;
  }

  function createTreeView(obj) {
    const container = document.createElement('div');
    container.className = 'json-container';
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const item = document.createElement('div');
        item.className = 'json-item';
        
        const value = obj[key];
        const isObject = typeof value === 'object' && value !== null;

        if (isObject) {
          const toggle = document.createElement('span');
          toggle.className = 'json-toggle';
          toggle.textContent = SYMBOL_COLLAPSED + ' ';

          const keySpan = document.createElement('span');
          keySpan.className = 'json-key';
          keySpan.textContent = `"${key}": `;
          
          const childTree = createTreeView(value);
          childTree.style.display = 'none';

          item.appendChild(toggle);
          item.appendChild(keySpan);
          item.appendChild(childTree);

          toggle.addEventListener('click', function () {
            const isHidden = childTree.style.display === 'none';
            childTree.style.display = isHidden ? 'block' : 'none';
            toggle.textContent = (isHidden ? SYMBOL_EXPANDED : SYMBOL_COLLAPSED) + ' ';
          });
        } else {
          // Spacer for alignment if no toggle
          const spacer = document.createElement('span');
          spacer.className = 'json-toggle';
          spacer.style.visibility = 'hidden';
          spacer.textContent = SYMBOL_COLLAPSED + ' ';
          item.appendChild(spacer);

          const keySpan = document.createElement('span');
          keySpan.className = 'json-key';
          keySpan.textContent = `"${key}": `;
          item.appendChild(keySpan);

          const valueSpan = document.createElement('span');
          valueSpan.className = 'json-value';
          valueSpan.textContent = JSON.stringify(value);
          item.appendChild(valueSpan);
        }
        container.appendChild(item);
      }
    }
    return container;
  }
});