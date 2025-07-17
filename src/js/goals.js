let goals = JSON.parse(localStorage.getItem("goalsList") || "[]");
window.completedGames = window.completedGames || JSON.parse(localStorage.getItem("completedGames") || "[]");

// Show/hide deadline input based on goal type
const goalTypeDesc = document.getElementById("goalTypeDesc");
const goalDescriptions = {
  completed: "Set a number of games you want to complete until a specific day! ⚠️ The goal will be deleted after that time, no matter if the goal was met.",
  sessions: "Set the number of hours you want to log before a deadline. ⚠️ The goal will be deleted after the deadline, even if not completed.",
  trophies: "Set a trophy hunt goal for today! ⚠️ This goal will disappear at midnight. Track your progress manually. (+1 or +5 trophies)",
  picker: "Set how many times you want to use the picker. Each time you pick a game, it counts toward this goal."
};

document.getElementById("goalType").addEventListener("change", function() {
  const type = this.value;
  document.getElementById("goalDeadlineWrapper").style.display =
    (type === "completed" || type === "sessions") ? "block" : "none";
  goalTypeDesc.textContent = goalDescriptions[type] || "";
  goalTypeDesc.className = "form-text mt-2" + ((type === "completed" || type === "sessions" || type === "trophies") ? " text-danger" : " text-secondary");
});

function saveGoals() {
  localStorage.setItem("goalsList", JSON.stringify(goals));
}

function renderGoals() {
  const goalsList = document.getElementById("goalsList");
  goalsList.innerHTML = "";
  if (goals.length === 0) {
    goalsList.innerHTML = `<div class="text-muted">No goals yet. Add one above!</div>`;
    return;
  }
  goals.forEach((goal, idx) => {
    const today = new Date();
    let expired = false;
    let progress = 0;
    let extra = ""; // <-- Add this line!
    let percent = 0; // <-- And this line!

    // Progress calculation (same as your code)
    switch (goal.type) {
      case "completed":
        const completedGamesArr = typeof completedGames !== "undefined" ? completedGames : getCompletedGames();
        progress = completedGamesArr.filter(g =>
          g.completedAt &&
          new Date(g.completedAt) >= new Date(goal.createdAt) && // <-- Only after goal was created
          (!goal.deadline || new Date(g.completedAt) <= new Date(goal.deadline))
        ).length;
        percent = Math.min(100, Math.round((progress / goal.target) * 100));
        extra = goal.deadline ? `<span class="badge bg-secondary ms-2">Deadline: ${goal.deadline}</span>` : "";
        break;
      case "sessions":
        progress = goal.progress || 0;
        percent = Math.min(100, Math.round((progress / goal.target) * 100));
        extra = goal.deadline ? `<span class="badge bg-secondary ms-2">Deadline: ${goal.deadline}</span>` : "";
        extra += `<button class="btn btn-sm btn-outline-success ms-2" onclick="addSessionHour(${idx})">+1 Hour</button>`;
        break;
      case "trophies":
        progress = goal.progress || 0;
        percent = Math.min(100, Math.round((progress / goal.target) * 100));
        // Countdown logic
        if (goal.deadline) {
          const now = new Date();
          const deadlineDate = new Date(goal.deadline);
          const diffMs = deadlineDate - now;
          if (diffMs > 0) {
            const hours = Math.floor(diffMs / (1000 * 60 * 60));
            const minutes = Math.floor((diffMs / (1000 * 60)) % 60);
            extra = `<span class="badge bg-danger ms-2">Disappears in ${hours}h ${minutes}m</span>`;
          } else {
            extra = `<span class="badge bg-danger ms-2">Expired</span>`;
          }
        }
        extra += `<button class="btn btn-sm btn-outline-success ms-2" onclick="addTrophy(${idx})">+1 Trophy</button>`;
        extra += `<button class="btn btn-sm btn-outline-success ms-2" onclick="addTrophyFive(${idx})">+5 Trophies</button>`;
        break;
      case "picker":
        progress = goal.progress || 0;
        percent = Math.min(100, Math.round((progress / goal.target) * 100));
        break;
    }

    // Delete if completed
    if (progress >= goal.target && !goal.completed) {
    goal.completed = true;
    setTimeout(() => {
        if (window.incrementGoalsCompleted) window.incrementGoalsCompleted();
        deleteGoal(idx);
    }, 500);
    return;
    }

    // Delete if expired and not completed
    if (goal.deadline) {
    const deadlineDate = new Date(goal.deadline);
    if (today > deadlineDate && !goal.completed) {
        expired = true;
        setTimeout(() => { deleteGoal(idx); }, 500);
        return;
    }
    }

    goalsList.innerHTML += `
      <div class="card mb-2${expired ? ' d-none' : ''}">
        <div class="card-body py-2">
          <div class="d-flex justify-content-between align-items-center">
            <div>
              <strong>${getGoalLabel(goal.type)}</strong>
              <span class="text-muted ms-2">${progress}/${goal.target}</span>
              ${extra}
            </div>
            <div>
              <button class="btn btn-sm btn-secondary me-1" onclick="editGoal(${idx})"><i class="bi bi-pencil"></i></button>
              <button class="btn btn-sm btn-danger" onclick="confirmDeleteGoal(${idx})"><i class="bi bi-trash"></i></button>
            </div>
          </div>
          <div class="progress mt-2" style="height: 18px;">
            <div class="progress-bar bg-success" role="progressbar" style="width: ${percent}%;">
              ${percent}%
            </div>
          </div>
        </div>
      </div>
    `;
  });
}

function getGoalLabel(type) {
  switch (type) {
    case "completed": return "Games Completed";
    case "sessions": return "Log Play Sessions";
    case "trophies": return "Trophy Hunt!";
    case "picker": return "Use Picker X Times";
    default: return "Goal";
  }
}

document.getElementById("addGoalForm").addEventListener("submit", function(e) {
  e.preventDefault();
  const type = document.getElementById("goalType").value;
  const target = parseInt(document.getElementById("goalTarget").value, 10);
  let deadline = document.getElementById("goalDeadline").value || null;
  if (!type || !target || target < 1) return;
  const title = getGoalLabel(type);
  const createdAt = new Date().toISOString();

  // Trophy Hunt: deadline is midnight today
  if (type === "trophies") {
    const now = new Date();
    const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0);
    deadline = midnight.toISOString().slice(0, 16); // "YYYY-MM-DDTHH:MM"
  }

  goals.push({ type, target, deadline, progress: 0, completed: false, title, createdAt });
  saveGoals();
  renderGoals();
  this.reset();
  document.getElementById("goalDeadlineWrapper").style.display = "none";
});

// Trophy Hunt +1
function addTrophy(idx) {
  goals[idx].progress = (goals[idx].progress || 0) + 1;
  saveGoals();
  renderGoals();
}

// Trophy Hunt +5
function addTrophyFive(idx) {
  goals[idx].progress = (goals[idx].progress || 0) + 5;
  saveGoals();
  renderGoals();
}

// Picker goal +1 (call this in your pickGame function)
window.incrementPickerGoals = function() {
  goals.forEach(goal => {
    if (goal.type === "picker") {
      goal.progress = (goal.progress || 0) + 1;
    }
  });
  saveGoals();
  renderGoals();
};

// Edit/Delete logic (reuse your previous modal code)
function editGoal(idx) {
  const goal = goals[idx];
  const goalsList = document.getElementById("goalsList");
  const card = goalsList.children[idx];
  card.querySelector('.card-body').innerHTML = `
    <div>
      <input type="number" class="form-control mb-2" id="editGoalTarget" value="${goal.target}" min="1" />
      ${goal.deadline !== undefined && goal.deadline !== null ? `
        <input type="date" class="form-control mb-2" id="editGoalDeadline" value="${goal.deadline}" />
      ` : ""}
      <div class="d-flex gap-2 justify-content-end">
        <button class="btn btn-success btn-sm" onclick="saveGoalEdit(${idx})">Save</button>
        <button class="btn btn-secondary btn-sm" onclick="renderGoals()">Cancel</button>
      </div>
    </div>
  `;
}

function saveGoalEdit(idx) {
  const target = parseInt(document.getElementById("editGoalTarget").value, 10);
  if (!target || target < 1) return;
  goals[idx].target = target;
  if (document.getElementById("editGoalDeadline")) {
    goals[idx].deadline = document.getElementById("editGoalDeadline").value;
  }
  saveGoals();
  renderGoals();
}

function confirmDeleteGoal(idx) {
  showGoalDeleteModal(idx);
}

function deleteGoal(idx) {
  goals.splice(idx, 1);
  saveGoals();
  renderGoals();
  closeGoalDeleteModal();
}

// Custom modal for goal deletion
function showGoalDeleteModal(idx) {
  let modal = document.createElement('div');
  modal.id = "goalDeleteModal";
  modal.className = "custom-modal-bg";
  modal.innerHTML = `
    <div class="custom-modal-content" style="max-width:320px;text-align:center;">
      <h5>Delete Goal?</h5>
      <p>Are you sure you want to delete this goal?</p>
      <div class="d-flex gap-2 justify-content-center mt-3">
        <button class="btn btn-danger btn-sm" id="confirmDeleteGoalBtn">Delete</button>
        <button class="btn btn-secondary btn-sm" id="cancelDeleteGoalBtn">Cancel</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  document.getElementById("confirmDeleteGoalBtn").onclick = () => deleteGoal(idx);
  document.getElementById("cancelDeleteGoalBtn").onclick = closeGoalDeleteModal;
}

function closeGoalDeleteModal() {
  const modal = document.getElementById("goalDeleteModal");
  if (modal) document.body.removeChild(modal);
}

// Call renderGoals() on load and after changes
document.addEventListener("DOMContentLoaded", renderGoals);

// Add session hour
function addSessionHour(idx) {
  goals[idx].progress = (goals[idx].progress || 0) + 1;
  saveGoals();
  renderGoals();
}

function getCompletedGames() {
  return JSON.parse(localStorage.getItem("completedGames") || "[]");
}

function cleanUpCompletedGoals() {
  goals = goals.filter(goal => !goal.completed);
  saveGoals();
}

document.addEventListener("DOMContentLoaded", () => {
  cleanUpCompletedGoals();
  renderGoals();
});