const STORAGE_KEY = "midnightCircuitProjects";

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

let projects = loadProjects();
let editingId = null;

function loadProjects() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    const parsed = saved ? JSON.parse(saved) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveProjects() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  } catch {
    showMessage("Could not save projects in this browser.", "error");
  }
}

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
    nameInput.focus();
    return false;
  }

  if (startDate && deadline && deadline < startDate) {
    showMessage("Deadline cannot be before the start date.", "error");
    deadlineInput.focus();
    return false;
  }

  return true;
}

function resetForm() {
  form.reset();
  editingId = null;
  saveButton.innerHTML = "<span aria-hidden=\"true\">＋</span> Save Project";
  cancelButton.hidden = true;
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
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
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
  if (!dateString) return "Not set";

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
        (new Date(`${project.deadline}T00:00:00`) -
          new Date(`${today}T00:00:00`)) / 86400000
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

function createProjectActions(project) {
  const actions = createElement("div", "project-actions");

  const editButton = createElement("button", "edit-button", "Edit");
  editButton.type = "button";
  editButton.addEventListener("click", () => startEditing(project.id));

  const deleteButton = createElement("button", "delete-button", "Delete");
  deleteButton.type = "button";
  deleteButton.addEventListener("click", () => deleteProject(project.id));

  actions.append(editButton, deleteButton);
  return actions;
}

function createProjectCard(project) {
  const item = createElement("li", "project-card");

  const top = createElement("div", "project-card-top");
  const title = createElement("h3", "project-title", project.name);
  const badge = createStatusBadge(project.status);
  top.append(title, badge);

  item.append(top, createProjectDates(project), createProjectActions(project));
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
  if (!project) return;

  editingId = id;
  nameInput.value = project.name;
  statusInput.value = project.status;
  startDateInput.value = project.startDate || "";
  deadlineInput.value = project.deadline || "";

  saveButton.innerHTML = "<span aria-hidden=\"true\">✓</span> Update Project";
  cancelButton.hidden = false;

  updateDateConstraints();
  showMessage("Editing project. Make your changes below.");
  nameInput.focus();

  form.scrollIntoView({ behavior: "smooth", block: "center" });
}

function deleteProject(id) {
  const project = projects.find(item => item.id === id);
  if (!project) return;

  if (!window.confirm(`Delete "${project.name}"?`)) return;

  projects = projects.filter(item => item.id !== id);

  if (editingId === id) {
    resetForm();
  }

  saveProjects();
  renderProjects();
  showMessage("Project deleted successfully.");
}

form.addEventListener("submit", event => {
  event.preventDefault();

  const name = nameInput.value.trim();
  const status = statusInput.value;
  const startDate = startDateInput.value;
  const deadline = deadlineInput.value;

  if (!validateProject(name, startDate, deadline)) return;

  const projectData = {
    name,
    status,
    startDate,
    deadline
  };

  if (editingId) {
    projects = projects.map(project =>
      project.id === editingId
        ? { ...project, ...projectData }
        : project
    );

    showMessage("Project updated successfully.");
  } else {
    projects.push({
      id: createProjectId(),
      ...projectData,
      createdAt: new Date().toISOString()
    });

    showMessage("Project added successfully.");
  }

  saveProjects();
  renderProjects();
  resetForm();
});

cancelButton.addEventListener("click", () => {
  resetForm();
  showMessage("Editing cancelled.");
});

startDateInput.addEventListener("change", updateDateConstraints);
deadlineInput.addEventListener("change", updateDateConstraints);

updateDateConstraints();
renderProjects();
