const form = document.querySelector("#project-form");
const nameInput = document.querySelector("#name");
const statusInput = document.querySelector("#status");
const startDateInput = document.querySelector("#start-date");
const deadlineInput = document.querySelector("#deadline");
const saveButton = document.querySelector("#save-button");
const cancelButton = document.querySelector("#cancel-button");
const message = document.querySelector("#message");
const projectList = document.querySelector("#project-list");
const emptyState = document.querySelector("#empty-state");
const totalProjects = document.querySelector("#total-projects");
const activeProjects = document.querySelector("#active-projects");
const completedProjects = document.querySelector("#completed-projects");
const projectCount = document.querySelector("#project-count");
const formTitle = document.querySelector("#form-title");

const STORAGE_KEY = "workshop-projects-v1";

let projects = [];
let editingId = null;
let storageAvailable = true;

function createProjectId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function getTodayString() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function showMessage(text, type = "success") {
  message.textContent = text;
  message.dataset.type = type;
}

function updateDateConstraints() {
  deadlineInput.min = startDateInput.value || "";
  startDateInput.max = deadlineInput.value || "";
}

function validateProject(name, startDate, deadline) {
  if (!name.trim()) {
    showMessage("Please enter a project name.", "error");
    return false;
  }

  if (startDate && deadline && deadline < startDate) {
    showMessage("Deadline cannot be before the start date.", "error");
    deadlineInput.focus();
    return false;
  }

  return true;
}

function updateSaveButton() {
  saveButton.replaceChildren();

  const icon = document.createElement("span");
  icon.setAttribute("aria-hidden", "true");
  icon.textContent = editingId !== null ? "✓" : "＋";

  saveButton.append(
    icon,
    document.createTextNode(
      editingId !== null ? " Save changes" : " Save Project"
    )
  );
}

function resetForm() {
  form.reset();
  editingId = null;

  updateSaveButton();
  cancelButton.hidden = true;

  if (formTitle) {
    formTitle.textContent = "Add a Project";
  }

  updateDateConstraints();
}

function updateStatistics() {
  totalProjects.textContent = projects.length;

  activeProjects.textContent = projects.filter(
    project => project.status === "In Progress"
  ).length;

  completedProjects.textContent = projects.filter(
    project => project.status === "Completed"
  ).length;

  projectCount.textContent =
    `${projects.length} ${projects.length === 1 ? "project" : "projects"}`;
}

function createElement(tag, className, text) {
  const element = document.createElement(tag);

  if (className) {
    element.className = className;
  }

  if (text !== undefined) {
    element.textContent = text;
  }

  return element;
}

function createStatusBadge(status) {
  const badge = createElement("span", "status-badge", status);

  const classes = {
    "Planned": "status-planned",
    "In Progress": "status-in-progress",
    "Completed": "status-completed"
  };

  badge.classList.add(classes[status] || "status-planned");
  return badge;
}

function formatDate(dateString) {
  if (!dateString) {
    return "Not set";
  }

  const date = new Date(`${dateString}T00:00:00`);

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric"
  });
}

function createProjectDates(project) {
  const container = createElement("div", "project-dates");

  const start = createElement("div", "project-date");
  start.append(
    createElement("span", "date-label", "START DATE"),
    createElement("span", "", formatDate(project.startDate))
  );

  const deadline = createElement("div", "project-date");
  deadline.append(
    createElement("span", "date-label", "DEADLINE"),
    createElement("span", "", formatDate(project.deadline))
  );

  if (project.deadline && project.status !== "Completed") {
    const today = getTodayString();

    if (project.deadline < today) {
      deadline.append(
        createElement("span", "deadline-warning warning-overdue", "Overdue")
      );
    } else if (project.deadline === today) {
      deadline.append(
        createElement("span", "deadline-warning warning-soon", "Due today")
      );
    } else {
      const remainingDays = Math.ceil(
        (
          new Date(`${project.deadline}T00:00:00`) -
          new Date(`${today}T00:00:00`)
        ) / 86400000
      );

      if (remainingDays <= 3) {
        deadline.append(
          createElement("span", "deadline-warning warning-soon", "Due soon")
        );
      }
    }
  }

  container.append(start, deadline);
  return container;
}

function createIconButton(className, iconText, label, onClick) {
  const button = createElement("button", className);
  button.type = "button";
  button.setAttribute("aria-label", label);
  button.title = label;

  const icon = createElement("span", "action-icon", iconText);
  icon.setAttribute("aria-hidden", "true");

  button.append(icon);
  button.addEventListener("click", onClick);

  return button;
}

function createProjectActions(project) {
  const actions = createElement("div", "project-actions");

  const editButton = createIconButton(
    "edit-button",
    "✎",
    `Edit ${project.name}`,
    () => startEditing(project.id)
  );

  const deleteButton = createIconButton(
    "delete-button",
    "🗑",
    `Delete ${project.name}`,
    () => deleteProject(project.id)
  );

  actions.append(editButton, deleteButton);
  return actions;
}

function createProjectCard(project) {
  const item = createElement("li", "project-card");

  const top = createElement("div", "project-card-top");
  const title = createElement("h3", "project-title", project.name);
  const badge = createStatusBadge(project.status);

  top.append(title, badge);

  item.append(
    top,
    createProjectDates(project),
    createProjectActions(project)
  );

  return item;
}

function renderProjects() {
  projectList.replaceChildren();

  emptyState.hidden = projects.length > 0;

  projects.forEach(project => {
    projectList.append(createProjectCard(project));
  });

  updateStatistics();
}

function startEditing(id) {
  const project = projects.find(item => item.id === id);

  if (!project) {
    return;
  }

  editingId = project.id;

  nameInput.value = project.name;
  statusInput.value = project.status;
  startDateInput.value = project.startDate || "";
  deadlineInput.value = project.deadline || "";
  nameInput.focus();

  updateSaveButton();
  cancelButton.hidden = false;

  if (formTitle) {
    formTitle.textContent = "Edit Project";
  }

  updateDateConstraints();
  showMessage("Editing project. Make your changes below.");
}

function resetFormAndRender() {
  resetForm();
  renderProjects();
}

function saveProjects() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
    storageAvailable = true;
    return true;
  } catch {
    storageAvailable = false;
    showMessage(
      "Your changes are visible, but could not be saved in this browser.",
      "error"
    );
    return false;
  }
}

function deleteProject(id) {
  const project = projects.find(item => item.id === id);

  if (!project) {
    return;
  }

  const confirmed = window.confirm(`Delete "${project.name}"?`);

  if (!confirmed) {
    return;
  }

  const previousProjects = projects;
  projects = projects.filter(item => item.id !== id);

  if (editingId === id) {
    resetForm();
  }

  renderProjects();
  saveProjects();

  if (storageAvailable) {
    showMessage("Project deleted successfully.");
  }

  // Keep the deleted project removed in the current page even if saving fails.
  void previousProjects;
}

form.addEventListener("submit", event => {
  event.preventDefault();

  const name = nameInput.value.trim();
  const status = statusInput.value;
  const startDate = startDateInput.value;
  const deadline = deadlineInput.value;

  if (!validateProject(name, startDate, deadline)) {
    return;
  }
  
  const duplicateExists = projects.some(project =>
    project.name.trim().toLowerCase() === name.toLowerCase() &&
    project.id !== editingId
  );

  if (duplicateExists) {
    showMessage(
      "A project with this name already exists. Please choose another name.",
      "error"
    );
    nameInput.focus();
    return;
  }


  const projectData = {
    name,
    status,
    startDate,
    deadline
  };

  let successMessage;

  if (editingId !== null) {
    const projectIndex = projects.findIndex(
      project => project.id === editingId
    );

    if (projectIndex === -1) {
      resetForm();
      renderProjects();
      showMessage(
        "That project could not be found. Please try again.",
        "error"
      );
      return;
    }

    projects[projectIndex] = {
      ...projects[projectIndex],
      ...projectData
    };

    successMessage = "Project updated successfully.";
  } else {
    projects.push({
      id: createProjectId(),
      ...projectData,
      createdAt: new Date().toISOString()
    });

    successMessage = "Project added successfully.";
  }

  renderProjects();
  resetForm();

  if (saveProjects()) {
    showMessage(successMessage);
  }
});

cancelButton.addEventListener("click", () => {
  resetForm();
  showMessage("Editing cancelled.");
});

startDateInput.addEventListener("change", updateDateConstraints);
deadlineInput.addEventListener("change", updateDateConstraints);

function loadProjects() {
  let storedData;

  try {
    storedData = localStorage.getItem(STORAGE_KEY);
  } catch {
    storageAvailable = false;
    showMessage(
      "Browser storage is unavailable. Projects may not be saved.",
      "error"
    );
    renderProjects();
    return;
  }

  if (storedData === null) {
    projects = [];
    renderProjects();
    return;
  }

  try {
    const parsedData = JSON.parse(storedData);

    const validArray =
      Array.isArray(parsedData) &&
      parsedData.every(project =>
        project !== null &&
        typeof project === "object" &&
        typeof project.id === "string" &&
        typeof project.name === "string" &&
        typeof project.status === "string" &&
        typeof (project.startDate ?? "") === "string" &&
        typeof (project.deadline ?? "") === "string"
      );

    if (!validArray) {
      projects = [];
      renderProjects();
      showMessage(
        "Saved project data is invalid. It has not been overwritten.",
        "error"
      );
      return;
    }

    projects = parsedData;
    renderProjects();
  } catch {
    projects = [];
    renderProjects();
    showMessage(
      "Saved project data could not be read. It has not been overwritten.",
      "error"
    );
  }
}

updateSaveButton();
updateDateConstraints();
loadProjects();
