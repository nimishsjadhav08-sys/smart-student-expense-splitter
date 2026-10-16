// ============================================================
// Smart Student Expense Splitter
// Frontend JavaScript (app.js)
// Simple, clean DOM manipulation and API calls for college project
// Includes offline / direct browser fallback if backend is offline
// ============================================================

// Base API URL (relative so it works seamlessly on localhost:3000)
const API_BASE = "";

// State
let currentUser = null;
let allStudents = [];
let isLocalFallbackActive = false;

// ==========================================
// Offline Local Storage Fallback Engine
// ==========================================
const DEFAULT_STUDENTS = [
    { id: 1, name: "Rahul Sharma", email: "rahul@college.edu", password: "pass" },
    { id: 2, name: "Priya Patel", email: "priya@college.edu", password: "pass" },
    { id: 3, name: "Amit Verma", email: "amit@college.edu", password: "pass" },
    { id: 4, name: "Sneha Rao", email: "sneha@college.edu", password: "pass" }
];

const DEFAULT_EXPENSES = [
    {
        id: 1,
        title: "Hostel Room Wi-Fi Bill",
        amount: 1200.0,
        paidById: 1,
        paidByName: "Rahul Sharma",
        createdAt: "2026-10-01 10:00:00",
        splitStudentIds: [1, 2, 3, 4],
        splitStudentNames: ["Rahul Sharma", "Priya Patel", "Amit Verma", "Sneha Rao"],
        perPersonAmount: 300.0
    },
    {
        id: 2,
        title: "Saturday Dinner & Swiggy",
        amount: 1800.0,
        paidById: 2,
        paidByName: "Priya Patel",
        createdAt: "2026-10-03 20:30:00",
        splitStudentIds: [1, 2, 3],
        splitStudentNames: ["Rahul Sharma", "Priya Patel", "Amit Verma"],
        perPersonAmount: 600.0
    },
    {
        id: 3,
        title: "Project Printouts & Stationery",
        amount: 350.0,
        paidById: 3,
        paidByName: "Amit Verma",
        createdAt: "2026-10-05 14:15:00",
        splitStudentIds: [1, 3],
        splitStudentNames: ["Rahul Sharma", "Amit Verma"],
        perPersonAmount: 175.0
    }
];

function getStoredLocalStudents() {
    try {
        const raw = localStorage.getItem("expense_local_students");
        if (raw) return JSON.parse(raw);
    } catch (e) {}
    localStorage.setItem("expense_local_students", JSON.stringify(DEFAULT_STUDENTS));
    return [...DEFAULT_STUDENTS];
}

function saveStoredLocalStudents(list) {
    try {
        localStorage.setItem("expense_local_students", JSON.stringify(list));
    } catch (e) {}
}

function getStoredLocalExpenses() {
    try {
        const raw = localStorage.getItem("expense_local_expenses");
        if (raw) return JSON.parse(raw);
    } catch (e) {}
    localStorage.setItem("expense_local_expenses", JSON.stringify(DEFAULT_EXPENSES));
    return [...DEFAULT_EXPENSES];
}

function saveStoredLocalExpenses(list) {
    try {
        localStorage.setItem("expense_local_expenses", JSON.stringify(list));
    } catch (e) {}
}

function calculateLocalSummary(currentStudentId) {
    const students = getStoredLocalStudents();
    const expenses = getStoredLocalExpenses();

    let totalGroupExpense = 0.0;
    const paidMap = {};
    const shareMap = {};

    students.forEach(s => {
        paidMap[s.id] = 0.0;
        shareMap[s.id] = 0.0;
    });

    expenses.forEach(exp => {
        totalGroupExpense += exp.amount;
        paidMap[exp.paidById] = (paidMap[exp.paidById] || 0.0) + exp.amount;
        exp.splitStudentIds.forEach(sid => {
            shareMap[sid] = (shareMap[sid] || 0.0) + exp.perPersonAmount;
        });
    });

    const myPaid = paidMap[currentStudentId] || 0.0;
    const myShare = shareMap[currentStudentId] || 0.0;
    const myNetBalance = myPaid - myShare;

    const studentSummaries = students.map(s => {
        const paid = paidMap[s.id] || 0.0;
        const share = shareMap[s.id] || 0.0;
        const net = paid - share;
        return {
            id: s.id,
            name: s.name,
            totalPaid: paid,
            totalShare: share,
            netBalance: net
        };
    });

    // Simplify debts
    const debtors = [];
    const creditors = [];

    students.forEach(s => {
        const net = Math.round(((paidMap[s.id] || 0.0) - (shareMap[s.id] || 0.0)) * 100) / 100;
        if (net < -0.01) {
            debtors.push({ id: s.id, name: s.name, amount: -net });
        } else if (net > 0.01) {
            creditors.push({ id: s.id, name: s.name, amount: net });
        }
    });

    const settlements = [];
    let d = 0, c = 0;
    while (d < debtors.length && c < creditors.length) {
        const settle = Math.min(debtors[d].amount, creditors[c].amount);
        settlements.push({
            fromId: debtors[d].id,
            fromName: debtors[d].name,
            toId: creditors[c].id,
            toName: creditors[c].name,
            amount: settle
        });
        debtors[d].amount -= settle;
        creditors[c].amount -= settle;
        if (debtors[d].amount < 0.01) d++;
        if (creditors[c].amount < 0.01) c++;
    }

    return {
        databaseMode: "Browser Standalone Mode",
        totalGroupExpense,
        myPaid,
        myShare,
        myNetBalance,
        studentSummaries,
        settlements
    };
}

// ==========================================
// Initialization
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
    // Check if user was previously saved in localStorage, or default to Rahul Sharma (ID 1)
    const saved = localStorage.getItem("expense_app_user");
    if (saved) {
        try {
            currentUser = JSON.parse(saved);
        } catch (e) {
            currentUser = null;
        }
    }

    if (!currentUser) {
        // Direct access: default to Rahul Sharma (ID: 1)
        currentUser = { id: 1, name: "Rahul Sharma", email: "rahul@college.edu" };
        try {
            localStorage.setItem("expense_app_user", JSON.stringify(currentUser));
        } catch (e) {}
    }

    // Directly open main dashboard
    showAppScreen();

    // Attach event listeners to forms
    const loginForm = document.getElementById("login-form");
    if (loginForm) loginForm.addEventListener("submit", handleLogin);
    const regForm = document.getElementById("register-form");
    if (regForm) regForm.addEventListener("submit", handleRegister);
    const expForm = document.getElementById("expense-form");
    if (expForm) expForm.addEventListener("submit", handleAddExpense);
    const expAmt = document.getElementById("expense-amount");
    if (expAmt) expAmt.addEventListener("input", updateLiveSplitPreview);
});

// ==========================================
// Navigation & Screen Toggling
// ==========================================
function showAuthScreen() {
    const authSec = document.getElementById("auth-section");
    if (authSec) authSec.style.display = "block";
    const mainSec = document.getElementById("main-section");
    if (mainSec) mainSec.style.display = "none";
}

function showAppScreen() {
    const authSec = document.getElementById("auth-section");
    if (authSec) authSec.style.display = "none";
    const mainSec = document.getElementById("main-section");
    if (mainSec) mainSec.style.display = "block";
    const userNav = document.getElementById("user-nav-info");
    if (userNav) userNav.style.display = "flex";

    // Set logged-in username in header if present
    const headerName = document.getElementById("header-user-name");
    if (headerName && currentUser) {
        headerName.innerText = currentUser.name;
    }

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
        // Local fallback
        const localList = getStoredLocalStudents();
        const found = localList.find(s => s.email.toLowerCase() === email.toLowerCase());
        if (found) {
            currentUser = found;
            localStorage.setItem("expense_app_user", JSON.stringify(currentUser));
            showAppScreen();
        } else {
            alertBox.innerText = "Error connecting to backend server. Make sure Java server is running.";
            alertBox.className = "alert alert-error";
            alertBox.style.display = "block";
        }
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
        // Local register fallback
        const localList = getStoredLocalStudents();
        const nextId = localList.length > 0 ? Math.max(...localList.map(s => s.id)) + 1 : 1;
        const newStudent = { id: nextId, name, email, password };
        localList.push(newStudent);
        saveStoredLocalStudents(localList);
        currentUser = newStudent;
        localStorage.setItem("expense_app_user", JSON.stringify(currentUser));
        showAppScreen();
    }
}

function quickLogin(email, password) {
    document.getElementById("login-email").value = email;
    document.getElementById("login-password").value = password;
    document.getElementById("login-form").dispatchEvent(new Event("submit"));
}

function logout() {
    currentUser = (allStudents && allStudents.length > 0) ? allStudents[0] : { id: 1, name: "Rahul Sharma", email: "rahul@college.edu" };
    try {
        localStorage.setItem("expense_app_user", JSON.stringify(currentUser));
    } catch (e) {}
    showAppScreen();
}

function switchStudentView(studentId) {
    const found = allStudents.find(s => String(s.id) === String(studentId));
    if (found) {
        currentUser = found;
        try {
            localStorage.setItem("expense_app_user", JSON.stringify(currentUser));
        } catch (e) {}

        const paidBySelect = document.getElementById("expense-paid-by");
        if (paidBySelect) {
            paidBySelect.value = currentUser.id;
        }

        loadStudents();
        loadDashboard();
    }
}

async function showAddStudentPrompt() {
    const name = prompt("Enter new student full name (e.g. Vikram Joshi):");
    if (!name || !name.trim()) return;
    const defaultEmail = name.trim().toLowerCase().replace(/[^a-z0-9]/g, '') + "@college.edu";
    const email = prompt("Enter college email:", defaultEmail) || defaultEmail;

    try {
        const res = await fetch(`${API_BASE}/api/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: name.trim(), email: email.trim(), password: "pass" })
        });
        const data = await res.json();
        if (data.success && data.student) {
            currentUser = data.student;
            try {
                localStorage.setItem("expense_app_user", JSON.stringify(currentUser));
            } catch (e) {}
            await loadStudents();
            await loadDashboard();
            alert(`Student "${name.trim()}" added to group!`);
        } else {
            alert(data.message || "Failed to add student.");
        }
    } catch (err) {
        // Local Add Student fallback
        const localList = getStoredLocalStudents();
        const nextId = localList.length > 0 ? Math.max(...localList.map(s => s.id)) + 1 : 1;
        const newStudent = { id: nextId, name: name.trim(), email: email.trim(), password: "pass" };
        localList.push(newStudent);
        saveStoredLocalStudents(localList);
        currentUser = newStudent;
        localStorage.setItem("expense_app_user", JSON.stringify(currentUser));
        await loadStudents();
        await loadDashboard();
        alert(`Student "${name.trim()}" added to group! (Browser Standalone Mode)`);
    }
}

// ==========================================
// Students Loading
// ==========================================
async function loadStudents() {
    try {
        const res = await fetch(`${API_BASE}/api/students`);
        if (!res.ok) throw new Error("HTTP error " + res.status);
        allStudents = await res.json();
        isLocalFallbackActive = false;
    } catch (err) {
        // Automatic fallback to browser-stored demo students
        isLocalFallbackActive = true;
        allStudents = getStoredLocalStudents();
    }

    if (currentUser && allStudents.length > 0) {
        const matched = allStudents.find(s => s.id === currentUser.id);
        if (matched) {
            currentUser = matched;
        } else {
            currentUser = allStudents[0];
        }
    } else if (allStudents.length > 0) {
        currentUser = allStudents[0];
    }

    // 1. Populate Header Student Switcher
    const headerSelect = document.getElementById("header-student-select");
    if (headerSelect) {
        headerSelect.innerHTML = "";
        allStudents.forEach(s => {
            const opt = document.createElement("option");
            opt.value = s.id;
            opt.textContent = s.name;
            if (currentUser && s.id === currentUser.id) {
                opt.selected = true;
            }
            headerSelect.appendChild(opt);
        });
    }

    // 2. Populate "Paid By" select dropdown
    const paidBySelect = document.getElementById("expense-paid-by");
    if (paidBySelect) {
        paidBySelect.innerHTML = "";
        allStudents.forEach(s => {
            const opt = document.createElement("option");
            opt.value = s.id;
            opt.innerText = s.name + (currentUser && s.id === currentUser.id ? " (You)" : "");
            if (currentUser && s.id === currentUser.id) {
                opt.selected = true;
            }
            paidBySelect.appendChild(opt);
        });
    }

    // 3. Populate "Split Among" checkbox list
    const splitContainer = document.getElementById("split-checkboxes");
    if (splitContainer) {
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
            span.innerText = s.name + (currentUser && s.id === currentUser.id ? " (You)" : "");

            label.appendChild(chk);
            label.appendChild(span);
            splitContainer.appendChild(label);
        });
    }

    updateLiveSplitPreview();
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

    let data;
    try {
        const res = await fetch(`${API_BASE}/api/summary?studentId=${currentUser.id}`);
        if (!res.ok) throw new Error("HTTP error " + res.status);
        data = await res.json();
    } catch (err) {
        data = calculateLocalSummary(currentUser.id);
    }

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

        if (!res.ok) throw new Error("HTTP " + res.status);
        const data = await res.json();
        if (data.success) {
            document.getElementById("expense-title").value = "";
            document.getElementById("expense-amount").value = "";
            selectAllStudents(true);
            showExpenseAlert("Expense added and split successfully!", "success");
            loadDashboard();
        } else {
            showExpenseAlert(data.message || "Failed to add expense.", "error");
        }
    } catch (err) {
        // Local Fallback
        const localList = getStoredLocalExpenses();
        const students = getStoredLocalStudents();
        const payer = students.find(s => s.id === paidById);
        const splitStudents = students.filter(s => studentIds.includes(s.id));
        const nextId = localList.length > 0 ? Math.max(...localList.map(e => e.id)) + 1 : 1;
        const perPerson = amount / studentIds.length;

        const newExp = {
            id: nextId,
            title,
            amount,
            paidById,
            paidByName: payer ? payer.name : "Student " + paidById,
            createdAt: new Date().toISOString().slice(0, 19).replace("T", " "),
            splitStudentIds: studentIds,
            splitStudentNames: splitStudents.map(s => s.name),
            perPersonAmount: perPerson
        };

        localList.push(newExp);
        saveStoredLocalExpenses(localList);

        document.getElementById("expense-title").value = "";
        document.getElementById("expense-amount").value = "";
        selectAllStudents(true);
        showExpenseAlert("Expense added and split successfully! (Saved locally)", "success");
        loadDashboard();
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
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;">Loading expenses...</td></tr>`;

    let expenses = [];
    try {
        const res = await fetch(`${API_BASE}/api/expenses`);
        if (!res.ok) throw new Error("HTTP error " + res.status);
        expenses = await res.json();
    } catch (err) {
        expenses = [...getStoredLocalExpenses()].reverse();
    }

    tbody.innerHTML = "";

    if (!expenses || expenses.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding: 20px; color:#718096;">No expenses added yet. Go to "Add Expense" to record one!</td></tr>`;
        return;
    }

    expenses.forEach((exp, idx) => {
        const tr = document.createElement("tr");
        const studentsStr = (exp.splitStudentNames || []).join(", ");

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
}

async function exportExpensesToCSV() {
    let expenses = [];
    try {
        const res = await fetch(`${API_BASE}/api/expenses`);
        if (!res.ok) throw new Error();
        expenses = await res.json();
    } catch (e) {
        expenses = getStoredLocalExpenses();
    }

    if (!expenses || expenses.length === 0) {
        alert("No expenses available to export.");
        return;
    }

    let csv = "ID,Date,Expense Name,Total Amount (INR),Paid By,Split Between,Share Per Person (INR)\n";
    expenses.forEach(exp => {
        const cleanTitle = `"${(exp.title || "").replace(/"/g, '""')}"`;
        const cleanPayer = `"${(exp.paidByName || "").replace(/"/g, '""')}"`;
        const cleanSplit = `"${(exp.splitStudentNames || []).join(", ").replace(/"/g, '""')}"`;
        csv += `${exp.id},${exp.createdAt || ""},${cleanTitle},${exp.amount.toFixed(2)},${cleanPayer},${cleanSplit},${exp.perPersonAmount.toFixed(2)}\n`;
    });

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `student_expenses_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

async function deleteExpense(id, title) {
    const confirmed = confirm(`Are you sure you want to delete "${title}"? This will remove the expense and recalculate everyone's balances.`);
    if (!confirmed) return;

    try {
        const res = await fetch(`${API_BASE}/api/expenses?id=${id}`, {
            method: "DELETE"
        });
        if (!res.ok) throw new Error();
        const data = await res.json();

        if (data.success) {
            alert("Expense deleted successfully.");
            loadExpenseHistory();
            loadDashboard();
            return;
        }
    } catch (err) {
        // Fallback local deletion
        const localList = getStoredLocalExpenses();
        const filtered = localList.filter(e => e.id !== id);
        saveStoredLocalExpenses(filtered);
        alert("Expense deleted successfully. (Local Mode)");
        loadExpenseHistory();
        loadDashboard();
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
