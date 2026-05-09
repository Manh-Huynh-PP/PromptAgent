/**
 * popup.js — PromptAgent Flow Bridge v3.1
 * CRUD project manager with Edit mode
 */

/** @type {number|null} Index of project being edited, null = add mode */
let editingIndex = null;

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

  document.getElementById('addBtn').addEventListener('click', saveProject);
  document.getElementById('cancelBtn').addEventListener('click', cancelEdit);
  document.getElementById('exportBtn').addEventListener('click', exportProjects);
  document.getElementById('importBtn').addEventListener('click', () => document.getElementById('importFile').click());
  document.getElementById('importFile').addEventListener('change', importProjects);
});

function loadProjects() {
  chrome.storage.sync.get(['flowProjects'], (result) => {
    const projects = result.flowProjects || [];
    renderProjects(projects);
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
      <div class="name" title="${proj.name}">${proj.name}</div>
      <div class="meta">Gemini ↔ Flow</div>
    `;
    
    const actions = document.createElement('div');
    actions.className = 'actions';
    
    const launchBtn = document.createElement('button');
    launchBtn.className = 'btn-launch';
    launchBtn.innerHTML = ICONS.rocket + ' Launch';
    launchBtn.onclick = () => launchSplitView(proj.gemUrl, proj.flowUrl);

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
  const sectionLabel = document.querySelector('.section-label');

  if (mode === 'edit') {
    addBtn.innerHTML = ICONS.check + ' Update Project';
    addBtn.classList.add('btn-update');
    cancelBtn.style.display = 'inline-flex';
    sectionLabel.textContent = 'Edit Project';
  } else {
    addBtn.innerHTML = ICONS.save + ' Save Project';
    addBtn.classList.remove('btn-update');
    cancelBtn.style.display = 'none';
    sectionLabel.textContent = 'New Project';
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

function launchSplitView(gemUrl, flowUrl) {
  chrome.runtime.sendMessage({
    action: "OPEN_SPLIT_VIEW",
    gemUrl,
    flowUrl
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
