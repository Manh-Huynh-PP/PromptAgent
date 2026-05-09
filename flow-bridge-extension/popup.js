/**
 * popup.js — PromptAgent Flow Bridge v3.1
 * CRUD project manager with Edit mode
 */

/** @type {number|null} Index of project being edited, null = add mode */
let editingIndex = null;

let currentActiveProjectIndex = null;
let currentActiveGemUrl = null;
let currentActiveFlowUrl = null;

/** SVG icon constants (Lucide-style, 16px default) */
const ICONS = {
  folder: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>',
  rocket: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/></svg>',
  edit: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>',
  trash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>',
  save: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="m9 12 2 2 4-4"/></svg>'
};

document.addEventListener('DOMContentLoaded', () => {
  loadProjects();
  loadSettings();

  document.getElementById('addBtn').addEventListener('click', saveProject);
  document.getElementById('cancelBtn').addEventListener('click', cancelEdit);
  document.getElementById('exportBtn').addEventListener('click', exportProjects);
  document.getElementById('importBtn').addEventListener('click', () => document.getElementById('importFile').click());
  document.getElementById('importFile').addEventListener('change', importProjects);
  
  document.getElementById('settingsBtn').addEventListener('click', () => {
    document.getElementById('settingsSection').style.display = 'block';
    document.getElementById('projectFormSection').style.display = 'none';
  });
  document.getElementById('cancelSettingsBtn').addEventListener('click', () => {
    document.getElementById('settingsSection').style.display = 'none';
    document.getElementById('projectFormSection').style.display = 'block';
  });
  document.getElementById('saveSettingsBtn').addEventListener('click', saveSettings);
  document.getElementById('autoNewProjectBtn').addEventListener('click', autoNewProject);
  document.getElementById('fetchTabsBtn').addEventListener('click', fetchCurrentTabs);
  
  document.getElementById('updateLinksBtn').addEventListener('click', updateActiveLinks);

  // Auto-submit toggle
  const autoCheckbox = document.getElementById('autoSubmitCheckbox');
  chrome.storage.sync.get(['autoSubmit'], (result) => {
    autoCheckbox.checked = !!result.autoSubmit;
  });
  autoCheckbox.addEventListener('change', () => {
    chrome.storage.sync.set({ autoSubmit: autoCheckbox.checked });
  });
});

function updateActiveLinks() {
  if (currentActiveProjectIndex !== null && currentActiveGemUrl && currentActiveFlowUrl) {
    chrome.storage.sync.get(['flowProjects'], (result) => {
      const projects = result.flowProjects || [];
      if (projects[currentActiveProjectIndex]) {
        projects[currentActiveProjectIndex].gemUrl = currentActiveGemUrl;
        projects[currentActiveProjectIndex].flowUrl = currentActiveFlowUrl;
        chrome.storage.sync.set({ flowProjects: projects }, () => {
          renderProjects(projects);
          
          // Provide visual feedback
          const btn = document.getElementById('updateLinksBtn');
          const originalText = btn.innerHTML;
          btn.innerHTML = ICONS.check + ' Updated!';
          setTimeout(() => { btn.innerHTML = originalText; }, 2000);
        });
      }
    });
  }
}

function fetchCurrentTabs() {
  const btn = document.getElementById('fetchTabsBtn');
  const originalHtml = btn.innerHTML;
  btn.innerHTML = 'Fetching...';
  
  chrome.tabs.query({}, (tabs) => {
    // Sort tabs to get active ones first
    const gemTabs = tabs.filter(t => t.url && t.url.includes('gemini.google.com')).sort((a,b) => (b.active ? 1 : 0) - (a.active ? 1 : 0));
    const flowTabs = tabs.filter(t => t.url && t.url.includes('labs.google/fx/tools/flow')).sort((a,b) => (b.active ? 1 : 0) - (a.active ? 1 : 0));
    
    if (gemTabs.length > 0 && flowTabs.length > 0) {
      document.getElementById('gemUrl').value = gemTabs[0].url;
      document.getElementById('flowUrl').value = flowTabs[0].url;
      btn.innerHTML = 'Fetched!';
      
      if (!document.getElementById('projectName').value) {
        document.getElementById('projectName').value = "Detected Project";
      }
    } else {
      btn.innerHTML = '⚠️ Not Found';
    }
    
    setTimeout(() => { btn.innerHTML = originalHtml; }, 2000);
  });
}

function loadSettings() {
  chrome.storage.sync.get(['defaultGemUrl'], (result) => {
    if (result.defaultGemUrl) {
      document.getElementById('defaultGemUrl').value = result.defaultGemUrl;
    }
  });
}

function saveSettings() {
  const defaultGemUrl = document.getElementById('defaultGemUrl').value.trim();
  chrome.storage.sync.set({ defaultGemUrl }, () => {
    document.getElementById('settingsSection').style.display = 'none';
    document.getElementById('projectFormSection').style.display = 'block';
  });
}

function autoNewProject() {
  const newNameInput = document.getElementById('newProjectName');
  const name = newNameInput.value.trim() || "New Project";

  chrome.storage.sync.get(['defaultGemUrl', 'flowProjects'], (result) => {
    const gemUrl = result.defaultGemUrl || chrome.runtime.getURL("guide.html");
    const flowUrl = "https://labs.google/fx/tools/flow";
    
    const projects = result.flowProjects || [];
    const newId = Date.now().toString();
    projects.push({ name, gemUrl, flowUrl, id: newId });

    chrome.storage.sync.set({ flowProjects: projects }, () => {
      renderProjects(projects);
      newNameInput.value = '';
      launchSplitView(gemUrl, flowUrl, newId);
    });
  });
}

function loadProjects() {
  chrome.storage.sync.get(['flowProjects'], (result) => {
    const projects = result.flowProjects || [];
    renderProjects(projects);
    checkActiveTabs();
  });
}

function renderProjects(projects) {
  const list = document.getElementById('projectList');
  list.innerHTML = '';
  
  if (projects.length === 0) {
    list.innerHTML = '<div class="empty-state">No projects yet</div>';
    return;
  }

  projects.forEach((proj, index) => {
    const card = document.createElement('div');
    card.className = 'project-card';
    if (editingIndex === index) card.classList.add('editing');
    
    const icon = document.createElement('div');
    icon.className = 'icon';
    icon.innerHTML = ICONS.folder;
    
    const info = document.createElement('div');
    info.className = 'info';
    info.innerHTML = `
      <div class="name" title="${proj.name}">
        <span class="active-indicator"></span>${proj.name}
      </div>
    `;
    
    const actions = document.createElement('div');
    actions.className = 'actions';
    
    const launchBtn = document.createElement('button');
    launchBtn.className = 'btn-launch';
    launchBtn.innerHTML = ICONS.rocket + ' Launch';
    launchBtn.onclick = () => launchSplitView(proj.gemUrl, proj.flowUrl, proj.id);

    const editBtn = document.createElement('button');
    editBtn.className = 'btn-ghost btn-edit';
    editBtn.innerHTML = ICONS.edit;
    editBtn.title = 'Edit';
    editBtn.onclick = () => startEdit(index, proj);
    
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'btn-ghost btn-delete';
    deleteBtn.innerHTML = ICONS.trash;
    deleteBtn.title = 'Delete';
    deleteBtn.onclick = () => deleteProject(index);
    
    actions.appendChild(launchBtn);
    actions.appendChild(editBtn);
    actions.appendChild(deleteBtn);
    
    card.appendChild(icon);
    card.appendChild(info);
    card.appendChild(actions);
    list.appendChild(card);
  });
}

// ── Edit Mode ──────────────────────────────────

function startEdit(index, proj) {
  editingIndex = index;

  // Fill form with project data
  document.getElementById('projectName').value = proj.name;
  document.getElementById('gemUrl').value = proj.gemUrl;
  document.getElementById('flowUrl').value = proj.flowUrl;

  // Switch to edit mode UI
  setFormMode('edit');

  // Highlight the card being edited
  loadProjects();

  // Focus the name field
  document.getElementById('projectName').focus();
}

function cancelEdit() {
  editingIndex = null;
  clearForm();
  setFormMode('add');
  loadProjects();
}

function setFormMode(mode) {
  const addBtn = document.getElementById('addBtn');
  const cancelBtn = document.getElementById('cancelBtn');
  const sectionLabel = document.getElementById('formSectionLabel');

  if (mode === 'edit') {
    addBtn.innerHTML = ICONS.check + ' Update Project';
    addBtn.classList.add('btn-update');
    cancelBtn.style.display = 'inline-flex';
    sectionLabel.textContent = 'Edit Project';
  } else {
    addBtn.innerHTML = ICONS.save + ' Save Project';
    addBtn.classList.remove('btn-update');
    cancelBtn.style.display = 'none';
    sectionLabel.textContent = 'Add Custom Project';
    
    // Re-check active tabs to correctly show activeProjectSection if needed
    checkActiveTabs();
  }
}

// ── Save (Add or Update) ───────────────────────

function saveProject() {
  const name = document.getElementById('projectName').value.trim();
  const gemUrl = document.getElementById('gemUrl').value.trim();
  const flowUrl = document.getElementById('flowUrl').value.trim();
  
  if (!name || !gemUrl || !flowUrl) {
    alert('Please fill in all fields.');
    return;
  }

  chrome.storage.sync.get(['flowProjects'], (result) => {
    const projects = result.flowProjects || [];

    if (editingIndex !== null && editingIndex < projects.length) {
      // Update existing
      projects[editingIndex] = {
        ...projects[editingIndex],
        name,
        gemUrl,
        flowUrl
      };
      editingIndex = null;
      setFormMode('add');
    } else {
      // Add new
      projects.push({ name, gemUrl, flowUrl, id: Date.now().toString() });
    }
    
    chrome.storage.sync.set({ flowProjects: projects }, () => {
      clearForm();
      renderProjects(projects);
    });
  });
}

function clearForm() {
  document.getElementById('projectName').value = '';
  document.getElementById('gemUrl').value = '';
  document.getElementById('flowUrl').value = '';
}

// ── Delete ──────────────────────────────────────

function deleteProject(index) {
  if (confirm('Delete this project?')) {
    chrome.storage.sync.get(['flowProjects'], (result) => {
      const projects = result.flowProjects || [];
      projects.splice(index, 1);

      // Reset edit mode if deleting the edited project
      if (editingIndex === index) {
        editingIndex = null;
        clearForm();
        setFormMode('add');
      } else if (editingIndex !== null && editingIndex > index) {
        editingIndex--; // Shift index after removal
      }

      chrome.storage.sync.set({ flowProjects: projects }, () => {
        renderProjects(projects);
      });
    });
  }
}

// ── Launch ──────────────────────────────────────

function launchSplitView(gemUrl, flowUrl, projectId) {
  chrome.runtime.sendMessage({
    action: "OPEN_SPLIT_VIEW",
    gemUrl,
    flowUrl,
    projectId
  });
}

// ── Export / Import ─────────────────────────────

function exportProjects() {
  chrome.storage.sync.get(['flowProjects'], (result) => {
    const projects = result.flowProjects || [];
    const blob = new Blob([JSON.stringify(projects, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'promptagent_projects.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  });
}

function importProjects(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const imported = JSON.parse(e.target.result);
      if (!Array.isArray(imported)) throw new Error('Invalid format');
      
      chrome.storage.sync.get(['flowProjects'], (result) => {
        const existing = result.flowProjects || [];
        const merged = [...existing, ...imported];
        chrome.storage.sync.set({ flowProjects: merged }, () => {
          renderProjects(merged);
        });
      });
    } catch (err) {
      alert('Invalid JSON file.');
    }
    document.getElementById('importFile').value = '';
  };
  reader.readAsText(file);
}

// ── Active Tabs Logic ─────────────────────────

function checkActiveTabs() {
  chrome.runtime.sendMessage({ action: "GET_ACTIVE_PAIRS" }, (response) => {
    const activePairs = response?.activePairs || [];
    chrome.tabs.query({}, (tabs) => {
      chrome.storage.sync.get(['flowProjects'], (result) => {
        let projects = result.flowProjects || [];
        let needsSave = false;
        
        // Migrate old projects to have an ID
        projects.forEach(p => {
          if (!p.id) {
            p.id = Date.now().toString() + Math.random().toString(36).substring(7);
            needsSave = true;
          }
        });
        
        if (needsSave) {
          chrome.storage.sync.set({ flowProjects: projects });
        }

        let activeFound = false;
        currentActiveProjectIndex = null;
        currentActiveGemUrl = null;
        currentActiveFlowUrl = null;

        document.querySelectorAll('.project-card').forEach((card, index) => {
          const proj = projects[index];
          const launchBtn = card.querySelector('.btn-launch');
          if (!proj || !launchBtn) return;

          // Check against activePairs first
          const pair = activePairs.find(p => p.projectId === proj.id);
          let gemTab, flowTab;

          if (pair) {
            gemTab = tabs.find(t => t.id === pair.gemTabId);
            flowTab = tabs.find(t => t.id === pair.flowTabId);
          } else {
            // Fallback for pre-existing tabs or auto-detected but not launched via extension
            const gemFragment = urlToFragment(proj.gemUrl);
            const flowFragment = urlToFragment(proj.flowUrl);
            gemTab = tabs.find(t => t.url && t.url.includes(gemFragment));
            flowTab = tabs.find(t => t.url && t.url.includes(flowFragment));
          }

          if (gemTab && flowTab) {
            activeFound = true;
            if (currentActiveProjectIndex === null) {
              currentActiveProjectIndex = index;
              currentActiveGemUrl = gemTab.url;
              currentActiveFlowUrl = flowTab.url;
            }
            card.classList.add('active');
            launchBtn.innerHTML = ICONS.rocket + ' Focus';
            launchBtn.onclick = () => focusTabs(gemTab.id, flowTab.id);
          } else {
            card.classList.remove('active');
            launchBtn.innerHTML = ICONS.rocket + ' Launch';
            launchBtn.onclick = () => launchSplitView(proj.gemUrl, proj.flowUrl, proj.id);
          }
        });

        // Auto-detect unconfigured pair
        const gemTabs = tabs.filter(t => t.url && t.url.includes('gemini.google.com'));
        const flowTabs = tabs.filter(t => t.url && t.url.includes('labs.google/fx/tools/flow'));

        if (gemTabs.length > 0 && flowTabs.length > 0) {
          const firstGem = gemTabs[0];
          const firstFlow = flowTabs[0];
          
          const isKnownPair = projects.some(p => {
             const pair = activePairs.find(ap => ap.projectId === p.id);
             if (pair && pair.gemTabId === firstGem.id && pair.flowTabId === firstFlow.id) return true;
             
             const pGem = urlToFragment(p.gemUrl);
             const pFlow = urlToFragment(p.flowUrl);
             return firstGem.url.includes(pGem) && firstFlow.url.includes(pFlow);
          });

          if (!isKnownPair && editingIndex === null) {
            const gemInput = document.getElementById('gemUrl');
            const flowInput = document.getElementById('flowUrl');
            const nameInput = document.getElementById('projectName');
            
            if (!gemInput.value && !flowInput.value) {
              gemInput.value = firstGem.url;
              flowInput.value = firstFlow.url;
              if (!nameInput.value) {
                nameInput.value = "Detected Project";
              }
            }
          }
        }

        const formSection = document.getElementById('projectFormSection');
        const activeSection = document.getElementById('activeProjectSection');

        if (activeFound && editingIndex === null) {
          formSection.style.display = 'none';
          activeSection.style.display = 'block';
          if (currentActiveProjectIndex !== null) {
            document.getElementById('activeProjectInfo').textContent = projects[currentActiveProjectIndex].name;
          }
        } else if (editingIndex === null) {
          formSection.style.display = 'block';
          activeSection.style.display = 'none';
        } else if (editingIndex !== null) {
          activeSection.style.display = 'none';
        }

        const statusDot = document.getElementById('globalStatusDot');
        const statusText = document.getElementById('globalStatusText');
        if (activeFound) {
          statusDot.style.background = '#10b981'; // Green
          statusDot.style.boxShadow = '0 0 8px rgba(16, 185, 129, 0.4)';
          statusText.textContent = 'Active project connected';
        } else {
          statusDot.style.background = 'var(--subtle)'; // Gray
          statusDot.style.boxShadow = 'none';
          statusText.textContent = 'No active projects';
        }
      });
    });
  });
}

function urlToFragment(url) {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname + urlObj.pathname;
  } catch (e) {
    // Fallback if it's not a valid URL (like a chrome-extension:// path or just fragment)
    return url.replace(/^\*:\/\//, "").replace(/\/?\*$/, "").split('?')[0].split('#')[0];
  }
}

function focusTabs(gemTabId, flowTabId) {
  chrome.runtime.sendMessage({
    action: "FOCUS_TABS",
    gemTabId,
    flowTabId
  });
}
