// ============================================================
// Smart Student Expense Splitter
// Frontend JavaScript (app.js)
// Simple, clean DOM manipulation and API calls for college project
// ============================================================

// Base API URL (relative so it works seamlessly on localhost:8080)
const API_BASE = "";

// State
let currentUser = null;
let allStudents = [];

// Initialize when page loads
document.addEventListener("DOMContentLoaded", () => {
    // Check if user was previously saved in localStorage
    const saved = localStorage.getItem("expense_app_user");
    if (saved) {
        try {
            currentUser = JSON.parse(saved);
        } catch (e) {
            currentUser = null;
        }
    }

    if (currentUser) {
        showAppScreen();
    } else {
        showAuthScreen();
    }

    // Attach event listeners to forms
    document.getElementById("login-form").addEventListener("submit", handleLogin);
    document.getElementById("register-form").addEventListener("submit", handleRegister);
    document.getElementById("expense-form").addEventListener("submit", handleAddExpense);
    document.getElementById("expense-amount").addEventListener("input", updateLiveSplitPreview);
});

// ==========================================
// Navigation & Screen Toggling
// ==========================================

function showAuthScreen() {
    document.getElementById("auth-section").style.display = "block";
    document.getElementById("main-section").style.display = "none";
    document.getElementById("user-nav-info").style.display = "none";
}

function showAppScreen() {
    document.getElementById("auth-section").style.display = "none";
    document.getElementById("main-section").style.display = "block";
    document.getElementById("user-nav-info").style.display = "flex";

    // Set logged-in username in header
    document.getElementById("header-user-name").innerText = currentUser.name;

    // Load initial data
    loadStudents();
    loadDashboard();
}

function switchTab(tabName) {
    // Hide all tabs
    document.querySelectorAll(".tab-content").forEach(el => el.style.display = "none");
    document.querySelectorAll(".tab-btn").forEach(btn => btn.classList.remove("active"));

    // Show target tab
    document.getElementById("tab-" + tabName).style.display = "block";
    document.getElementById("btn-tab-" + tabName).classList.add("active");

    if (tabName === "dashboard") {
        loadDashboard();
    } else if (tabName === "history") {
        loadExpenseHistory();
    } else if (tabName === "add") {
        updateLiveSplitPreview();
    }
}

function switchAuthTab(type) {
    if (type === "login") {
        document.getElementById("login-container").style.display = "block";
        document.getElementById("register-container").style.display = "none";
        document.getElementById("tab-login-btn").classList.add("active");
        document.getElementById("tab-reg-btn").classList.remove("active");
    } else {
        document.getElementById("login-container").style.display = "none";
        document.getElementById("register-container").style.display = "block";
        document.getElementById("tab-login-btn").classList.remove("active");
        document.getElementById("tab-reg-btn").classList.add("active");
    }
}

// ==========================================
// Authentication Logic
// ==========================================

async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById("login-email").value.trim();
    const password = document.getElementById("login-password").value;
    const alertBox = document.getElementById("login-alert");

    alertBox.style.display = "none";

    try {
        const res = await fetch(`${API_BASE}/api/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
        });
        const data = await res.json();

        if (data.success && data.student) {
            currentUser = data.student;
            localStorage.setItem("expense_app_user", JSON.stringify(currentUser));
            showAppScreen();
        } else {
            alertBox.innerText = data.message || "Invalid credentials";
            alertBox.className = "alert alert-error";
            alertBox.style.display = "block";
        }
    } catch (err) {
        alertBox.innerText = "Error connecting to backend server. Make sure Java server is running.";
        alertBox.className = "alert alert-error";
        alertBox.style.display = "block";
    }
}

async function handleRegister(e) {
    e.preventDefault();
    const name = document.getElementById("reg-name").value.trim();
    const email = document.getElementById("reg-email").value.trim();
    const password = document.getElementById("reg-password").value;
    const alertBox = document.getElementById("reg-alert");

    alertBox.style.display = "none";

    try {
        const res = await fetch(`${API_BASE}/api/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, email, password })
        });
        const data = await res.json();

        if (data.success && data.student) {
            currentUser = data.student;
            localStorage.setItem("expense_app_user", JSON.stringify(currentUser));
            showAppScreen();
        } else {
            alertBox.innerText = data.message || "Registration failed";
            alertBox.className = "alert alert-error";
            alertBox.style.display = "block";
        }
    } catch (err) {
        alertBox.innerText = "Error connecting to backend server.";
        alertBox.className = "alert alert-error";
        alertBox.style.display = "block";
    }
}

// Quick Demo Login helper (convenient during lab viva)
function quickLogin(email, password) {
    document.getElementById("login-email").value = email;
    document.getElementById("login-password").value = password;
    document.getElementById("login-form").dispatchEvent(new Event("submit"));
}

function logout() {
    currentUser = null;
    localStorage.removeItem("expense_app_user");
    showAuthScreen();
}

// ==========================================
// Students Loading
// ==========================================

async function loadStudents() {
    try {
        const res = await fetch(`${API_BASE}/api/students`);
        allStudents = await res.json();

        // 1. Populate "Paid By" select dropdown
        const paidBySelect = document.getElementById("expense-paid-by");
        paidBySelect.innerHTML = "";
        allStudents.forEach(s => {
            const opt = document.createElement("option");
            opt.value = s.id;
            opt.innerText = s.name + (s.id === currentUser.id ? " (You)" : "");
            if (s.id === currentUser.id) {
                opt.selected = true;
            }
            paidBySelect.appendChild(opt);
        });

        // 2. Populate "Split Among" checkbox list
        const splitContainer = document.getElementById("split-checkboxes");
        splitContainer.innerHTML = "";
        allStudents.forEach(s => {
            const label = document.createElement("label");
            label.className = "checkbox-item";

            const chk = document.createElement("input");
            chk.type = "checkbox";
            chk.value = s.id;
            chk.checked = true; // Default selected
            chk.addEventListener("change", updateLiveSplitPreview);

            const span = document.createElement("span");
            span.innerText = s.name + (s.id === currentUser.id ? " (You)" : "");

            label.appendChild(chk);
            label.appendChild(span);
            splitContainer.appendChild(label);
        });

        updateLiveSplitPreview();
    } catch (err) {
        console.error("Failed to load students:", err);
    }
}

function selectAllStudents(select) {
    const checkboxes = document.querySelectorAll("#split-checkboxes input[type='checkbox']");
    checkboxes.forEach(c => c.checked = select);
    updateLiveSplitPreview();
}

function updateLiveSplitPreview() {
    const amountVal = parseFloat(document.getElementById("expense-amount").value) || 0;
    const checkboxes = document.querySelectorAll("#split-checkboxes input[type='checkbox']:checked");
    const count = checkboxes.length;

    const previewEl = document.getElementById("split-preview-text");
    if (count === 0) {
        previewEl.innerText = "Please select at least 1 student to split the expense.";
    } else if (amountVal <= 0) {
        previewEl.innerText = `Enter amount. Split will be divided equally among ${count} student(s).`;
    } else {
        const perPerson = (amountVal / count).toFixed(2);
        previewEl.innerHTML = `<strong>₹${perPerson}</strong> per student (Divided equally among ${count} selected students).`;
    }
}

// ==========================================
// Dashboard & Summaries
// ==========================================

async function loadDashboard() {
    if (!currentUser) return;

    try {
        const res = await fetch(`${API_BASE}/api/summary?studentId=${currentUser.id}`);
        const data = await res.json();

        // Update DB mode badge
        const dbBadge = document.getElementById("db-status-badge");
        if (dbBadge) {
            dbBadge.innerText = data.databaseMode || "Active";
        }

        // Metrics
        document.getElementById("metric-total-group").innerText = `₹${data.totalGroupExpense.toFixed(2)}`;
        document.getElementById("metric-my-paid").innerText = `₹${data.myPaid.toFixed(2)}`;
        document.getElementById("metric-my-share").innerText = `₹${data.myShare.toFixed(2)}`;

        const net = data.myNetBalance;
        const netCard = document.getElementById("metric-my-net-card");
        const netVal = document.getElementById("metric-my-net");
        const netSub = document.getElementById("metric-net-sub");

        netCard.classList.remove("green-border", "red-border");

        if (net > 0.01) {
            netCard.classList.add("green-border");
            netVal.innerText = `+₹${net.toFixed(2)}`;
            netVal.className = "metric-value text-positive";
            netSub.innerText = "You should receive this amount from the group";
            netSub.className = "metric-sub text-positive";
        } else if (net < -0.01) {
            netCard.classList.add("red-border");
            netVal.innerText = `-₹${Math.abs(net).toFixed(2)}`;
            netVal.className = "metric-value text-negative";
            netSub.innerText = "You owe this amount to the group";
            netSub.className = "metric-sub text-negative";
        } else {
            netVal.innerText = `₹0.00`;
            netVal.className = "metric-value text-neutral";
            netSub.innerText = "All settled! You owe nothing and are owed nothing";
            netSub.className = "metric-sub text-neutral";
        }

        // Render Settlements ("Who owes money to whom")
        renderSettlements(data.settlements || []);

        // Render Student Summary Table
        renderStudentTable(data.studentSummaries || []);

    } catch (err) {
        console.error("Failed to load dashboard:", err);
    }
}

function renderSettlements(settlements) {
    const container = document.getElementById("settlements-container");
    container.innerHTML = "";

    if (!settlements || settlements.length === 0) {
        container.innerHTML = `<div class="alert alert-success">🎉 All expenses are perfectly settled! No pending dues.</div>`;
        return;
    }

    settlements.forEach(s => {
        const item = document.createElement("div");
        item.className = "settlement-item";

        // Highlight if current user is involved
        const isFromMe = s.fromId === currentUser.id;
        const isToMe = s.toId === currentUser.id;

        let note = "";
        if (isFromMe) {
            note = ` <span style="color:#c53030; font-size:12px; font-weight:bold;">(You owe this)</span>`;
        } else if (isToMe) {
            note = ` <span style="color:#2f855a; font-size:12px; font-weight:bold;">(You will receive this)</span>`;
        }

        item.innerHTML = `
            <div>
                <strong>${escapeHtml(s.fromName)}</strong> owes <strong>${escapeHtml(s.toName)}</strong>${note}
            </div>
            <div class="settlement-badge">₹${s.amount.toFixed(2)}</div>
        `;
        container.appendChild(item);
    });
}

function renderStudentTable(summaries) {
    const tbody = document.getElementById("student-summary-tbody");
    tbody.innerHTML = "";

    summaries.forEach(s => {
        const tr = document.createElement("tr");
        if (s.id === currentUser.id) {
            tr.classList.add("current-user-row");
        }

        let statusText = "";
        if (s.netBalance > 0.01) {
            statusText = `<span class="text-positive">+ Gets back ₹${s.netBalance.toFixed(2)}</span>`;
        } else if (s.netBalance < -0.01) {
            statusText = `<span class="text-negative">- Owes ₹${Math.abs(s.netBalance).toFixed(2)}</span>`;
        } else {
            statusText = `<span class="text-neutral">Settled (₹0.00)</span>`;
        }

        tr.innerHTML = `
            <td>${escapeHtml(s.name)} ${s.id === currentUser.id ? "<strong>(You)</strong>" : ""}</td>
            <td>₹${s.totalPaid.toFixed(2)}</td>
            <td>₹${s.totalShare.toFixed(2)}</td>
            <td>${statusText}</td>
        `;
        tbody.appendChild(tr);
    });
}

// ==========================================
// Add Expense Logic
// ==========================================

async function handleAddExpense(e) {
    e.preventDefault();
    const title = document.getElementById("expense-title").value.trim();
    const amount = parseFloat(document.getElementById("expense-amount").value);
    const paidById = parseInt(document.getElementById("expense-paid-by").value);
    const alertBox = document.getElementById("expense-alert");

    alertBox.style.display = "none";

    // Gather selected student IDs
    const checkedBoxes = document.querySelectorAll("#split-checkboxes input[type='checkbox']:checked");
    const studentIds = Array.from(checkedBoxes).map(cb => parseInt(cb.value));

    if (!title) {
        showExpenseAlert("Please provide an expense title/description.", "error");
        return;
    }

    if (isNaN(amount) || amount <= 0) {
        showExpenseAlert("Please provide a valid positive amount.", "error");
        return;
    }

    if (studentIds.length === 0) {
        showExpenseAlert("Please select at least 1 student to split with.", "error");
        return;
    }

    try {
        const res = await fetch(`${API_BASE}/api/expenses`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                title: title,
                amount: amount,
                paidById: paidById,
                studentIds: studentIds
            })
        });

        const data = await res.json();
        if (data.success) {
            // Reset form
            document.getElementById("expense-title").value = "";
            document.getElementById("expense-amount").value = "";
            selectAllStudents(true);
            showExpenseAlert("Expense added and split successfully!", "success");

            // Refresh dashboard in background
            loadDashboard();
        } else {
            showExpenseAlert(data.message || "Failed to add expense.", "error");
        }
    } catch (err) {
        showExpenseAlert("Error connecting to server. Please try again.", "error");
    }
}

function showExpenseAlert(msg, type) {
    const alertBox = document.getElementById("expense-alert");
    alertBox.innerText = msg;
    alertBox.className = type === "success" ? "alert alert-success" : "alert alert-error";
    alertBox.style.display = "block";
}

// ==========================================
// Expense History & Delete
// ==========================================

async function loadExpenseHistory() {
    const tbody = document.getElementById("expense-history-tbody");
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;">Loading expenses...</td></tr>`;

    try {
        const res = await fetch(`${API_BASE}/api/expenses`);
        const expenses = await res.json();

        tbody.innerHTML = "";

        if (expenses.length === 0) {
            tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding: 20px; color:#718096;">No expenses added yet. Go to "Add Expense" to record one!</td></tr>`;
            return;
        }

        expenses.forEach((exp, idx) => {
            const tr = document.createElement("tr");
            const studentsStr = exp.splitStudentNames.join(", ");

            tr.innerHTML = `
                <td>${idx + 1}</td>
                <td>${exp.createdAt ? exp.createdAt.substring(0, 16) : "-"}</td>
                <td><strong>${escapeHtml(exp.title)}</strong></td>
                <td>₹${exp.amount.toFixed(2)}</td>
                <td>${escapeHtml(exp.paidByName)}</td>
                <td style="max-width:250px; font-size:13px;" title="${escapeHtml(studentsStr)}">
                    ${escapeHtml(studentsStr)}
                </td>
                <td>₹${exp.perPersonAmount.toFixed(2)}</td>
                <td>
                    <button class="btn btn-danger btn-sm" onclick="deleteExpense(${exp.id}, '${escapeHtml(exp.title)}')">Delete</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; color:#c53030;">Failed to load expense history.</td></tr>`;
    }
}

async function deleteExpense(id, title) {
    const confirmed = confirm(`Are you sure you want to delete "${title}"? This will remove the expense and recalculate everyone's balances.`);
    if (!confirmed) return;

    try {
        const res = await fetch(`${API_BASE}/api/expenses?id=${id}`, {
            method: "DELETE"
        });
        const data = await res.json();

        if (data.success) {
            alert("Expense deleted successfully.");
            loadExpenseHistory();
            loadDashboard();
        } else {
            alert(data.message || "Failed to delete expense.");
        }
    } catch (err) {
        alert("Error connecting to server.");
    }
}

// Utility to escape HTML and prevent XSS
function escapeHtml(text) {
    if (!text) return "";
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
