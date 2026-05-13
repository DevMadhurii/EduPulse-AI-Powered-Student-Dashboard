// ========== GLOBAL DATA ==========
let subjectsList = JSON.parse(localStorage.getItem('subjects')) || ["CAO","PYTHON","DAA","PAS","COI","LDBA","MDM"];
let studentsData = JSON.parse(localStorage.getItem('students')) || [];
let assignmentsData = JSON.parse(localStorage.getItem('assignments')) || [];
let attendanceLogs = JSON.parse(localStorage.getItem('attendanceLogs')) || [];

let defaultTimetable = {
    Monday: [{ period: "9:00-10:00", subject: "CAO", staff: "Prof. Sharma" }, { period: "10:00-11:00", subject: "PYTHON", staff: "Prof. Verma" }, { period: "11:00-12:00", subject: "DAA", staff: "Prof. Gupta" }, { period: "1:00-2:00", subject: "PAS", staff: "Prof. Nair" }],
    Tuesday: [{ period: "9:00-10:00", subject: "COI", staff: "Prof. Joshi" }, { period: "10:00-11:00", subject: "LDBA", staff: "Prof. Patil" }, { period: "11:00-12:00", subject: "MDM", staff: "Prof. Kulkarni" }, { period: "1:00-2:00", subject: "PYTHON Lab", staff: "Prof. Verma" }],
    Wednesday: [{ period: "9:00-10:00", subject: "DAA", staff: "Prof. Gupta" }, { period: "10:00-11:00", subject: "CAO", staff: "Prof. Sharma" }, { period: "11:00-12:00", subject: "COI", staff: "Prof. Joshi" }, { period: "1:00-2:00", subject: "Self Study", staff: "-" }],
    Thursday: [{ period: "9:00-10:00", subject: "LDBA", staff: "Prof. Patil" }, { period: "10:00-11:00", subject: "MDM", staff: "Prof. Kulkarni" }, { period: "11:00-12:00", subject: "PAS", staff: "Prof. Nair" }, { period: "1:00-2:00", subject: "Python", staff: "Prof. Verma" }],
    Friday: [{ period: "9:00-10:00", subject: "CAO Lab", staff: "Prof. Sharma" }, { period: "10:00-11:00", subject: "DAA Lab", staff: "Prof. Gupta" }, { period: "11:00-12:00", subject: "VLab", staff: "Prof. Patil" }, { period: "1:00-2:00", subject: "Sports", staff: "Coach" }],
    Saturday: [{ period: "9:00-12:00", subject: "Project Work", staff: "Prof. Kulkarni" }, { period: "1:00-2:00", subject: "Mentorship", staff: "Prof. Sharma" }]
};
let timetableData = JSON.parse(localStorage.getItem('timetable')) || defaultTimetable;

let noticesData = JSON.parse(localStorage.getItem('notices')) || [
    { id: "n1", title: "📢 Exam Form Release", description: "Exam forms available from 15th May. Last date: 25th May", releaseDate: "2026-05-15", lastDate: "2026-05-25" },
    { id: "n2", title: "⚠️ Assignment Deadline", description: "All assignments due by 30th May", releaseDate: "2026-05-10", lastDate: "2026-05-30" }
];

let currentUser = null;
let radarChart = null;
let classBarChart = null;

function computeOverall(student) {
    let ct1Sum = 0, ct2Sum = 0, midSum = 0;
    for (let sub of subjectsList) {
        ct1Sum += student.marks[sub]?.ct1 || 0;
        ct2Sum += student.marks[sub]?.ct2 || 0;
        midSum += student.marks[sub]?.mid || 0;
    }
    let ct1Avg = ct1Sum / subjectsList.length;
    let ct2Avg = ct2Sum / subjectsList.length;
    let midAvg = midSum / subjectsList.length;
    return (student.attendance * 0.2) + (ct1Avg * 0.2) + (ct2Avg * 0.2) + (midAvg * 0.4);
}

function initData() {
    if (studentsData.length === 0) {
        for (let i = 1; i <= 50; i++) {
            let roll = "S" + (1000 + i);
            let marks = {};
            for (let sub of subjectsList) marks[sub] = { ct1: Math.floor(Math.random() * 40 + 50), ct2: Math.floor(Math.random() * 40 + 50), mid: Math.floor(Math.random() * 40 + 50) };
            studentsData.push({
                id: roll, name: `Student ${i}`, email: `student${i}@demo.com`, password: `pass${1000 + i}`,
                rollNo: roll, role: "student", attendance: Math.floor(Math.random() * 30 + 65), fee: Math.random() > 0.2 ? "paid" : "pending",
                skills: "JavaScript, React", contact: `98${Math.floor(Math.random() * 90000000 + 10000000)}`,
                marks: marks, assignments: [], practicals: { daa: false, python: false, vlab: false }
            });
        }
        studentsData.push({ id: "admin", name: "Admin", email: "admin@demo.com", password: "admin123", role: "admin", attendance: 100, fee: "paid", skills: "", contact: "", marks: {}, assignments: [], practicals: {} });
        localStorage.setItem('students', JSON.stringify(studentsData));
    }
    if (assignmentsData.length === 0) {
        assignmentsData = [{ id: "a1", subject: "CAO", title: "CAO Assignment 1", deadline: "2026-05-25", description: "Pipeline design" }];
        localStorage.setItem('assignments', JSON.stringify(assignmentsData));
    }
    for (let s of studentsData) {
        if (s.role === 'student') {
            let logs = attendanceLogs.filter(l => l.studentId === s.id);
            if (logs.length) s.attendance = Math.round(logs.filter(l => l.status === 'present').length / logs.length * 100);
        }
    }
    localStorage.setItem('students', JSON.stringify(studentsData));
    if (!localStorage.getItem('timetable')) localStorage.setItem('timetable', JSON.stringify(timetableData));
    if (!localStorage.getItem('notices')) localStorage.setItem('notices', JSON.stringify(noticesData));
}
initData();

// ========== LOGIN ==========
function doLogin() {
    let loginId = document.getElementById('loginId').value.trim();
    let pwd = document.getElementById('loginPwd').value.trim();
    let user = studentsData.find(u => (u.email === loginId || u.rollNo === loginId || u.id === loginId) && u.password === pwd);
    if (user) {
        currentUser = user;
        sessionStorage.setItem('currentUser', JSON.stringify(user));
        document.getElementById('loginScreen').style.display = 'none';
        document.getElementById('mainApp').style.display = 'block';
        if (user.role === 'admin') {
            document.getElementById('studentDashboard').style.display = 'none';
            document.getElementById('adminDashboard').style.display = 'block';
            document.getElementById('roleBadge').innerHTML = '<i class="fas fa-crown"></i> Admin Mode';
            loadAdminPanel();
        } else {
            document.getElementById('studentDashboard').style.display = 'block';
            document.getElementById('adminDashboard').style.display = 'none';
            document.getElementById('roleBadge').innerHTML = '<i class="fas fa-user-graduate"></i> Student Mode';
            loadStudentDashboard();
        }
    } else alert("❌ Invalid credentials!\n\nAdmin: admin@demo.com / admin123\nStudent: S1001 / pass1001");
}
function logout() { sessionStorage.clear(); location.reload(); }

// ========== STUDENT DASHBOARD ==========
function loadStudentDashboard() {
    let s = currentUser;
    document.getElementById('stuName').innerText = s.name;
    document.getElementById('stuRoll').innerText = "Roll: " + s.rollNo;
    document.getElementById('stuEmail').innerText = s.email;
    document.getElementById('stuContact').innerHTML = "📞 " + (s.contact || 'N/A');
    document.getElementById('stuSkills').innerText = s.skills || "Not set";
    let feeSpan = document.getElementById('feeBadge');
    if (s.fee === 'paid') { feeSpan.innerText = '✅ Fee Paid'; feeSpan.style.background = '#d1fae5'; feeSpan.style.color = '#065f46'; }
    else { feeSpan.innerText = '⚠️ Pending'; feeSpan.style.background = '#fee2e2'; feeSpan.style.color = '#991b1b'; }

    let ct1Sum = 0, ct2Sum = 0, midSum = 0;
    for (let sub of subjectsList) {
        ct1Sum += s.marks[sub]?.ct1 || 0;
        ct2Sum += s.marks[sub]?.ct2 || 0;
        midSum += s.marks[sub]?.mid || 0;
    }
    let ct1Avg = Math.round(ct1Sum / subjectsList.length);
    let ct2Avg = Math.round(ct2Sum / subjectsList.length);
    let midAvg = Math.round(midSum / subjectsList.length);
    let overall = Math.round(computeOverall(s));
    document.getElementById('attPerc').innerText = s.attendance;
    document.getElementById('ct1Perc').innerText = ct1Avg;
    document.getElementById('ct2Perc').innerText = ct2Avg;
    document.getElementById('midPerc').innerText = midAvg;
    document.getElementById('overPerc').innerText = overall;

    let riskDiv = document.getElementById('riskMsg');
    if (overall < 55) { riskDiv.innerText = "🔴 HIGH RISK - Immediate attention needed"; riskDiv.className = "risk-box risk-high"; }
    else if (overall < 70) { riskDiv.innerText = "🟡 MODERATE RISK - Need improvement"; riskDiv.className = "risk-box risk-mid"; }
    else { riskDiv.innerText = "🟢 LOW RISK - Excellent performance"; riskDiv.className = "risk-box risk-low"; }

    let ctx = document.getElementById('stuRadar').getContext('2d');
    if (radarChart) radarChart.destroy();
    radarChart = new Chart(ctx, { type: 'radar', data: { labels: ['Attendance', 'CT1', 'CT2', 'Mid', 'Overall'], datasets: [{ label: 'Your %', data: [s.attendance, ct1Avg, ct2Avg, midAvg, overall], backgroundColor: 'rgba(79,70,229,0.2)', borderColor: '#4f46e5' }] } });

    let tbody = '';
    for (let sub of subjectsList) tbody += `<tr><td class="p-2">${sub}</td><td class="p-2">${s.marks[sub]?.ct1 || 0}</td><td class="p-2">${s.marks[sub]?.ct2 || 0}</td><td class="p-2">${s.marks[sub]?.mid || 0}</td></tr>`;
    document.querySelector('#marksTable tbody').innerHTML = tbody;

    let assignHtml = '';
    for (let ass of assignmentsData) {
        let done = s.assignments.find(a => a.assignId === ass.id)?.completed || false;
        assignHtml += `<div style="display:flex; justify-content:space-between; padding:8px; border-bottom:1px solid #e2e8f0;"><span>📌 ${ass.title} (${ass.subject})</span><span style="color:${done ? 'green' : 'red'}">${done ? '✅ Complete' : '❌ Incomplete'}</span></div>`;
    }
    document.getElementById('stuAssignList').innerHTML = assignHtml || "<p>No assignments</p>";

    let practHtml = `
        <div style="display:flex; justify-content:space-between;"><span>🐍 Python</span><span style="color:${s.practicals.python ? 'green' : 'red'}">${s.practicals.python ? '✅ Complete' : '❌ Incomplete'}</span></div>
        <div style="display:flex; justify-content:space-between;"><span>⚙️ DAA</span><span style="color:${s.practicals.daa ? 'green' : 'red'}">${s.practicals.daa ? '✅ Complete' : '❌ Incomplete'}</span></div>
        <div style="display:flex; justify-content:space-between;"><span>🌐 VLab</span><span style="color:${s.practicals.vlab ? 'green' : 'red'}">${s.practicals.vlab ? '✅ Complete' : '❌ Incomplete'}</span></div>
    `;
    document.getElementById('stuPractList').innerHTML = practHtml;

    renderStudentTimetable();
    renderStudentNotices();
    document.getElementById('chatBox').innerHTML = '<div class="ai-msg">🤖 Hello! Ask me about attendance, marks, weak subject, assignments, practicals, contact.</div>';
    checkAndSendAlerts();
}

function renderStudentTimetable() {
    let timetable = JSON.parse(localStorage.getItem('timetable')) || defaultTimetable;
    let days = Object.keys(timetable);
    let maxPeriods = 0;
    for (let day of days) if (timetable[day].length > maxPeriods) maxPeriods = timetable[day].length;
    let html = '<table class="timetable-table"><thead><tr><th>Day</th>';
    for (let i = 0; i < maxPeriods; i++) html += `<th>Period ${i+1}</th>`;
    html += '</tr></thead><tbody>';
    for (let day of days) {
        let slots = timetable[day];
        html += `<tr><td class="day-cell"><strong>${day}</strong></td>`;
        for (let i = 0; i < maxPeriods; i++) {
            if (i < slots.length) {
                let slot = slots[i];
                html += `<td><div><strong>${slot.period}</strong></div><div>${slot.subject}</div><div class="staff-name">(${slot.staff})</div></td>`;
            } else html += `<td>-</td>`;
        }
        html += '</tr>';
    }
    html += '</tbody></table>';
    document.getElementById('studentTimetable').innerHTML = html;
}

function renderStudentNotices() {
    let notices = JSON.parse(localStorage.getItem('notices')) || noticesData;
    notices.sort((a, b) => new Date(b.releaseDate) - new Date(a.releaseDate));
    let html = '';
    for (let n of notices) html += `<div class="notice-item"><h4>${n.title}</h4><p>${n.description}</p><div class="notice-date"><span>📅 Release: ${n.releaseDate}</span><span>⏰ Last Date: ${n.lastDate}</span></div></div>`;
    document.getElementById('studentNotices').innerHTML = html || "<p>No notices yet.</p>";
}

function checkAndSendAlerts() {
    if (currentUser.role !== 'student') return;
    let alerts = [];
    if (currentUser.attendance < 75) alerts.push(`⚠️ Your attendance is ${currentUser.attendance}% (below 75%). Improve to avoid debarment!`);
    if (currentUser.fee === 'pending') alerts.push(`💰 Your fee is pending. Please pay soon to avoid late fine.`);
    let notices = JSON.parse(localStorage.getItem('notices')) || [];
    let today = new Date(); today.setHours(0,0,0,0);
    for (let notice of notices) {
        if (notice.lastDate) {
            let lastDate = new Date(notice.lastDate); lastDate.setHours(0,0,0,0);
            let diff = Math.ceil((lastDate - today) / (1000*60*60*24));
            if (diff === 0) alerts.push(`📢 "${notice.title}" last date is TODAY!`);
            else if (diff === 1) alerts.push(`📢 "${notice.title}" last date is TOMORROW!`);
            else if (diff > 0 && diff <= 3) alerts.push(`📢 "${notice.title}" last date is in ${diff} days.`);
        }
    }
    if (alerts.length) showAlertBanner(alerts);
}
function showAlertBanner(alerts) {
    let existing = document.getElementById('alertBanner');
    if (existing) existing.remove();
    let banner = document.createElement('div');
    banner.id = 'alertBanner';
    banner.style.cssText = `position:fixed; top:70px; right:20px; background:#fef3c7; border-left:4px solid #f59e0b; color:#78350f; padding:12px 20px; border-radius:16px; box-shadow:0 10px 25px rgba(0,0,0,0.1); z-index:1000; max-width:350px; font-size:13px; font-weight:500; cursor:pointer;`;
    banner.innerHTML = `<div style="display:flex; gap:10px; align-items:start;"><i class="fas fa-bell" style="color:#f59e0b;"></i><div>${alerts.join('<br>')}</div><button onclick="this.parentElement.parentElement.remove()" style="background:none; border:none; cursor:pointer;">&times;</button></div>`;
    document.body.appendChild(banner);
    setTimeout(() => banner.remove(), 8000);
}

function sendMsg() {
    let inp = document.getElementById('chatInp').value.trim();
    if (!inp) return;
    addChatMsg(inp, 'user-msg');
    let reply = getAIreply(inp.toLowerCase());
    addChatMsg(reply, 'ai-msg');
    document.getElementById('chatInp').value = '';
}
function getAIreply(q) {
    let s = currentUser;
    if (q.includes('attendance')) return `📊 Attendance: ${s.attendance}% ${s.attendance < 75 ? '⚠️ Risk!' : '✅ Good'}`;
    if (q.includes('ct1')) return `📝 Class Test 1 average: ${Math.round(subjectsList.reduce((a,b)=>a+(s.marks[b]?.ct1||0),0)/subjectsList.length)}%`;
    if (q.includes('ct2')) return `📝 Class Test 2 average: ${Math.round(subjectsList.reduce((a,b)=>a+(s.marks[b]?.ct2||0),0)/subjectsList.length)}%`;
    if (q.includes('mid')) return `📝 Mid Sem average: ${Math.round(subjectsList.reduce((a,b)=>a+(s.marks[b]?.mid||0),0)/subjectsList.length)}%`;
    if (q.includes('overall')) return `📊 Overall performance: ${Math.round(computeOverall(s))}%`;
    if (q.includes('weak')) {
        let worst = subjectsList.reduce((a,b)=> (s.marks[a]?.mid||0) < (s.marks[b]?.mid||0) ? a : b);
        return `⚠️ Weakest subject: ${worst} (Mid: ${s.marks[worst]?.mid||0}%)`;
    }
    if (q.includes('assignment')) return `📌 You have ${s.assignments.filter(a=>!a.completed).length} incomplete assignments.`;
    if (q.includes('practical')) return `🧪 Practicals completed: ${Object.values(s.practicals).filter(v=>v).length}/3`;
    if (q.includes('contact')) return `📞 Contact: ${s.contact || 'Not provided'}`;
    return "💡 I can tell attendance, exam marks, overall, weak subject, assignments, practicals, contact.";
}
function addChatMsg(msg, cls) {
    let box = document.getElementById('chatBox');
    let div = document.createElement('div');
    div.className = `chat-msg ${cls}`;
    div.innerText = msg;
    box.appendChild(div);
    box.scrollTop = box.scrollHeight;
}

function loadAdminPanel() {
    renderStudentsList();
    renderSubjectsList();
    renderAdminAssignments();
    renderPracticalsTable();
    loadAttendance();
    renderTimetableEditor();
    renderNoticesAdmin();
    initClassChart();
    setupTabs();
}
function setupTabs() {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.onclick = () => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('tab-active'));
            btn.classList.add('tab-active');
            let id = btn.getAttribute('data-tab');
            document.querySelectorAll('#adminDashboard .card').forEach(c => c.style.display = 'none');
            document.getElementById(id + 'Tab').style.display = 'block';
            if (id === 'analytics') initClassChart();
            if (id === 'attendance') loadAttendance();
            if (id === 'assignments') { renderAdminAssignments(); renderCompletionMatrix(); }
            if (id === 'practicals') renderPracticalsTable();
            if (id === 'timetable') renderTimetableEditor();
            if (id === 'notices') renderNoticesAdmin();
        };
    });
    document.querySelector('.tab-btn').classList.add('tab-active');
    document.getElementById('studentsTab').style.display = 'block';
}

function renderStudentsList() {
    let search = document.getElementById('searchBox').value.toLowerCase();
    let list = studentsData.filter(s => s.role === 'student');
    if (search) list = list.filter(s => s.name.toLowerCase().includes(search) || s.rollNo.toLowerCase().includes(search));
    let html = '';
    for (let s of list) html += `<div class="student-row"><div><b>${s.name}</b> (${s.rollNo})<br><small>📞 ${s.contact || ''} | Att:${s.attendance}% | Overall:${Math.round(computeOverall(s))}%</small></div><div><button class="btn btn-primary" style="padding:4px 12px;" onclick="openEdit('${s.id}')">Edit</button> <button class="btn btn-danger" style="padding:4px 12px;" onclick="delStudent('${s.id}')">Del</button></div></div>`;
    document.getElementById('studentsList').innerHTML = html || "<p>No students found</p>";
}
document.getElementById('searchBox')?.addEventListener('keypress', e => { if (e.key === 'Enter') renderStudentsList(); });
document.getElementById('searchButton')?.addEventListener('click', renderStudentsList);

function showAddStudentForm() {
    document.getElementById('editId').value = '';
    document.getElementById('sName').value = '';
    document.getElementById('sEmail').value = '';
    document.getElementById('sRoll').value = '';
    document.getElementById('sPass').value = '';
    document.getElementById('sContact').value = '';
    document.getElementById('sFee').value = 'pending';
    document.getElementById('sSkills').value = '';
    let container = document.getElementById('marksModalContainer');
    container.innerHTML = '';
    for (let sub of subjectsList) container.innerHTML += `<div><label>${sub} CT1</label><input type="number" id="ct1_${sub}" value="0"></div><div><label>CT2</label><input type="number" id="ct2_${sub}" value="0"></div><div><label>Mid</label><input type="number" id="mid_${sub}" value="0"></div>`;
    document.getElementById('modalTitle').innerText = 'Add Student';
    document.getElementById('studentModal').style.display = 'flex';
}
function openEdit(id) {
    let s = studentsData.find(x => x.id === id);
    if (!s) return;
    document.getElementById('editId').value = s.id;
    document.getElementById('sName').value = s.name;
    document.getElementById('sEmail').value = s.email;
    document.getElementById('sRoll').value = s.rollNo;
    document.getElementById('sPass').value = s.password;
    document.getElementById('sContact').value = s.contact || '';
    document.getElementById('sFee').value = s.fee;
    document.getElementById('sSkills').value = s.skills || '';
    let container = document.getElementById('marksModalContainer');
    container.innerHTML = '';
    for (let sub of subjectsList) container.innerHTML += `<div><label>${sub} CT1</label><input type="number" id="ct1_${sub}" value="${s.marks[sub]?.ct1 || 0}"></div><div><label>CT2</label><input type="number" id="ct2_${sub}" value="${s.marks[sub]?.ct2 || 0}"></div><div><label>Mid</label><input type="number" id="mid_${sub}" value="${s.marks[sub]?.mid || 0}"></div>`;
    document.getElementById('modalTitle').innerText = 'Edit Student';
    document.getElementById('studentModal').style.display = 'flex';
}
function saveStudent() {
    let id = document.getElementById('editId').value;
    let name = document.getElementById('sName').value;
    let email = document.getElementById('sEmail').value;
    let roll = document.getElementById('sRoll').value;
    let pwd = document.getElementById('sPass').value;
    let contact = document.getElementById('sContact').value;
    let fee = document.getElementById('sFee').value;
    let skills = document.getElementById('sSkills').value;
    if (!name || !roll || !pwd) { alert("Name, Roll, Password required"); return; }
    let marks = {};
    for (let sub of subjectsList) marks[sub] = { ct1: parseInt(document.getElementById(`ct1_${sub}`).value)||0, ct2: parseInt(document.getElementById(`ct2_${sub}`).value)||0, mid: parseInt(document.getElementById(`mid_${sub}`).value)||0 };
    if (id) {
        let idx = studentsData.findIndex(s => s.id === id);
        if (idx !== -1) studentsData[idx] = { ...studentsData[idx], name, email, password: pwd, rollNo: roll, contact, fee, skills, marks };
    } else {
        if (studentsData.find(s => s.id === roll)) { alert("Roll exists"); return; }
        studentsData.push({ id: roll, name, email, password: pwd, rollNo: roll, role: 'student', attendance: 0, fee, skills, contact, marks, assignments: [], practicals: { daa: false, python: false, vlab: false } });
    }
    localStorage.setItem('students', JSON.stringify(studentsData));
    closeModal();
    renderStudentsList();
    initClassChart();
}
function delStudent(id) {
    if (confirm("Delete?")) {
        studentsData = studentsData.filter(s => s.id !== id);
        attendanceLogs = attendanceLogs.filter(l => l.studentId !== id);
        localStorage.setItem('students', JSON.stringify(studentsData));
        localStorage.setItem('attendanceLogs', JSON.stringify(attendanceLogs));
        renderStudentsList();
        initClassChart();
    }
}
function closeModal() { document.getElementById('studentModal').style.display = 'none'; }

function renderSubjectsList() {
    let html = '';
    for (let i=0; i<subjectsList.length; i++) html += `<div class="flex-between" style="padding:8px; border-bottom:1px solid #e2e8f0;"><span>${subjectsList[i]}</span><div><button class="btn btn-primary" style="padding:2px 8px;" onclick="editSubject(${i})">Edit</button> <button class="btn btn-danger" style="padding:2px 8px;" onclick="delSubject(${i})">Del</button></div></div>`;
    document.getElementById('subjectsList').innerHTML = html;
}
function addSubject() {
    let newSub = prompt("Enter subject name");
    if (newSub && !subjectsList.includes(newSub)) {
        subjectsList.push(newSub);
        localStorage.setItem('subjects', JSON.stringify(subjectsList));
        for (let s of studentsData) if (s.role === 'student') s.marks[newSub] = { ct1:0, ct2:0, mid:0 };
        localStorage.setItem('students', JSON.stringify(studentsData));
        renderSubjectsList();
        if (currentUser?.role === 'student') loadStudentDashboard();
    }
}
function editSubject(idx) {
    let newName = prompt("New name", subjectsList[idx]);
    if (newName && !subjectsList.includes(newName)) {
        let old = subjectsList[idx];
        subjectsList[idx] = newName;
        localStorage.setItem('subjects', JSON.stringify(subjectsList));
        for (let s of studentsData) if (s.role === 'student') { s.marks[newName] = s.marks[old]; delete s.marks[old]; }
        localStorage.setItem('students', JSON.stringify(studentsData));
        renderSubjectsList();
        if (currentUser?.role === 'student') loadStudentDashboard();
    }
}
function delSubject(idx) {
    if (subjectsList.length <= 1) { alert("Need at least one subject"); return; }
    let removed = subjectsList[idx];
    subjectsList.splice(idx,1);
    localStorage.setItem('subjects', JSON.stringify(subjectsList));
    for (let s of studentsData) if (s.role === 'student') delete s.marks[removed];
    localStorage.setItem('students', JSON.stringify(studentsData));
    renderSubjectsList();
    if (currentUser?.role === 'student') loadStudentDashboard();
}

function loadAttendance() {
    let date = document.getElementById('attDate').value;
    if (!date) date = new Date().toISOString().split('T')[0];
    document.getElementById('attDate').value = date;
    let list = studentsData.filter(s => s.role === 'student');
    let html = '';
    for (let s of list) {
        let existing = attendanceLogs.find(l => l.studentId === s.id && l.date === date);
        let checked = existing ? existing.status === 'present' : true;
        html += `<div class="flex-between" style="padding:10px; border-bottom:1px solid #e2e8f0;"><span><b>${s.name}</b> (${s.rollNo}) - Current: ${s.attendance}%</span><label><input type="checkbox" class="attCb" data-id="${s.id}" ${checked ? 'checked' : ''}> Present</label></div>`;
    }
    document.getElementById('attendanceTable').innerHTML = html;
}
function saveAttendance() {
    let date = document.getElementById('attDate').value;
    if (!date) { alert("Select date"); return; }
    let cbs = document.querySelectorAll('.attCb');
    attendanceLogs = attendanceLogs.filter(l => l.date !== date);
    for (let cb of cbs) {
        let studentId = cb.getAttribute('data-id');
        let status = cb.checked ? 'present' : 'absent';
        attendanceLogs.push({ studentId, date, status });
    }
    localStorage.setItem('attendanceLogs', JSON.stringify(attendanceLogs));
    for (let s of studentsData) if (s.role === 'student') {
        let logs = attendanceLogs.filter(l => l.studentId === s.id);
        s.attendance = logs.length ? Math.round(logs.filter(l => l.status === 'present').length / logs.length * 100) : 0;
    }
    localStorage.setItem('students', JSON.stringify(studentsData));
    loadAttendance();
    renderStudentsList();
    if (currentUser?.role === 'student') loadStudentDashboard();
    alert("Attendance saved!");
}

function renderAdminAssignments() {
    let html = '';
    for (let a of assignmentsData) html += `<div class="flex-between" style="padding:12px; border-bottom:1px solid #e2e8f0; flex-wrap:wrap;"><div><b>${a.title}</b> (${a.subject})<br><small>Due: ${a.deadline}</small><p class="text-xs">${a.description || ''}</p></div><div><button class="btn btn-primary" onclick="editAssignment('${a.id}')">Edit</button> <button class="btn btn-danger" onclick="delAssignment('${a.id}')">Del</button></div></div>`;
    document.getElementById('adminAssignList').innerHTML = html;
    renderCompletionMatrix();
}
function renderCompletionMatrix() {
    let students = studentsData.filter(s => s.role === 'student');
    if (students.length === 0) { document.getElementById('completionTable').innerHTML = '<p>No students</p>'; return; }
    let html = '<thead><tr><th>Student (Roll No)</th>';
    for (let a of assignmentsData) html += `<th>${a.title}<br><small>${a.subject}</small></th>`;
    html += '</tr></thead><tbody>';
    for (let s of students) {
        html += `<tr><td class="student-info-cell"><strong>${s.name}</strong><br><small>${s.rollNo}</small></td>`;
        for (let a of assignmentsData) {
            let done = s.assignments.find(x => x.assignId === a.id)?.completed || false;
            html += `<td class="text-center"><button class="btn ${done ? 'btn-success' : 'btn-primary'}" style="padding:4px 12px;" onclick="toggleComplete('${s.id}','${a.id}')">${done ? '✅ Complete' : '❌ Incomplete'}</button></td>`;
        }
        html += '</tr>';
    }
    html += '</tbody>';
    document.getElementById('completionTable').innerHTML = html;
}
function toggleComplete(sid, aid) {
    let s = studentsData.find(x => x.id === sid);
    let idx = s.assignments.findIndex(x => x.assignId === aid);
    if (idx === -1) s.assignments.push({ assignId: aid, completed: true });
    else s.assignments[idx].completed = !s.assignments[idx].completed;
    localStorage.setItem('students', JSON.stringify(studentsData));
    renderCompletionMatrix();
    if (currentUser?.role === 'student') loadStudentDashboard();
}
function showAssignModal() {
    document.getElementById('assignEditId').value = '';
    document.getElementById('assignTitle').value = '';
    document.getElementById('assignDead').value = '';
    document.getElementById('assignDesc').value = '';
    let select = document.getElementById('assignSubj');
    select.innerHTML = subjectsList.map(s => `<option value="${s}">${s}</option>`).join('');
    document.getElementById('assignModal').style.display = 'flex';
}
function editAssignment(id) {
    let a = assignmentsData.find(x => x.id === id);
    if (a) {
        document.getElementById('assignEditId').value = a.id;
        document.getElementById('assignTitle').value = a.title;
        document.getElementById('assignDead').value = a.deadline;
        document.getElementById('assignDesc').value = a.description || '';
        let select = document.getElementById('assignSubj');
        select.innerHTML = subjectsList.map(s => `<option value="${s}" ${s === a.subject ? 'selected' : ''}>${s}</option>`).join('');
        document.getElementById('assignModal').style.display = 'flex';
    }
}
function saveAssignment() {
    let id = document.getElementById('assignEditId').value;
    let subject = document.getElementById('assignSubj').value;
    let title = document.getElementById('assignTitle').value;
    let deadline = document.getElementById('assignDead').value;
    let desc = document.getElementById('assignDesc').value;
    if (!title || !deadline) { alert("Title & deadline required"); return; }
    if (id) {
        let idx = assignmentsData.findIndex(a => a.id === id);
        if (idx !== -1) assignmentsData[idx] = { ...assignmentsData[idx], subject, title, deadline, description: desc };
    } else assignmentsData.push({ id: Date.now().toString(), subject, title, deadline, description: desc });
    localStorage.setItem('assignments', JSON.stringify(assignmentsData));
    closeAssignModal();
    renderAdminAssignments();
    if (currentUser?.role === 'student') loadStudentDashboard();
}
function delAssignment(id) {
    if (confirm("Delete?")) {
        assignmentsData = assignmentsData.filter(a => a.id !== id);
        localStorage.setItem('assignments', JSON.stringify(assignmentsData));
        renderAdminAssignments();
        if (currentUser?.role === 'student') loadStudentDashboard();
    }
}
function closeAssignModal() { document.getElementById('assignModal').style.display = 'none'; }

function renderPracticalsTable() {
    let studs = studentsData.filter(s => s.role === 'student');
    let html = `<div class="table-wrapper"><table class="practicals-table"><thead><tr><th>Student</th><th>DAA</th><th>Python</th><th>VLab</th></tr></thead><tbody>`;
    for (let s of studs) {
        html += `<tr><td class="student-info-cell"><strong>${s.name}</strong><br><small>${s.rollNo}</small></td>`;
        html += `<td class="text-center"><button class="btn ${s.practicals.daa ? 'btn-success' : 'btn-primary'}" onclick="togglePractical('${s.id}','daa')">${s.practicals.daa ? '✅ Completed' : '❌ Not Done'}</button></td>`;
        html += `<td class="text-center"><button class="btn ${s.practicals.python ? 'btn-success' : 'btn-primary'}" onclick="togglePractical('${s.id}','python')">${s.practicals.python ? '✅ Completed' : '❌ Not Done'}</button></td>`;
        html += `<td class="text-center"><button class="btn ${s.practicals.vlab ? 'btn-success' : 'btn-primary'}" onclick="togglePractical('${s.id}','vlab')">${s.practicals.vlab ? '✅ Completed' : '❌ Not Done'}</button></td>`;
        html += '<tr>';
    }
    html += `</tbody></table></div>`;
    document.getElementById('practicalsTable').innerHTML = html;
}
function togglePractical(sid, type) {
    let s = studentsData.find(x => x.id === sid);
    s.practicals[type] = !s.practicals[type];
    localStorage.setItem('students', JSON.stringify(studentsData));
    renderPracticalsTable();
    if (currentUser?.role === 'student') loadStudentDashboard();
}

function renderTimetableEditor() {
    let timetable = JSON.parse(localStorage.getItem('timetable')) || defaultTimetable;
    let html = '<div style="margin-bottom: 12px;"><button onclick="addTimetableDay()" class="btn btn-success">+ Add Day</button></div>';
    for (let [day, slots] of Object.entries(timetable)) {
        html += `<div style="margin-bottom:20px; padding:12px; border:1px solid #e2e8f0; border-radius:16px;"><div class="flex-between"><strong>${day}</strong> <button onclick="removeTimetableDay('${day}')" class="btn btn-danger">Remove Day</button></div>`;
        for (let i=0; i<slots.length; i++) {
            let slot = slots[i];
            html += `<div class="timetable-editor-row" data-day="${day}" data-index="${i}">
                        <input type="text" placeholder="Time" value="${slot.period}" class="tt-period" style="width:120px;">
                        <input type="text" placeholder="Subject" value="${slot.subject}" class="tt-subject" style="width:150px;">
                        <input type="text" placeholder="Staff Name" value="${slot.staff}" class="tt-staff" style="width:150px;">
                        <button onclick="removeTimetableSlot('${day}',${i})" class="btn btn-danger">Remove</button>
                     </div>`;
        }
        html += `<button onclick="addTimetableSlot('${day}')" class="btn btn-primary" style="margin-top:8px;">+ Add Period</button></div>`;
    }
    document.getElementById('timetableEditor').innerHTML = html;
}
function addTimetableDay() {
    let newDay = prompt("Enter new day name (e.g., Sunday)");
    if (newDay) {
        let timetable = JSON.parse(localStorage.getItem('timetable')) || defaultTimetable;
        timetable[newDay] = [{ period: "9:00-10:00", subject: "New Subject", staff: "Staff Name" }];
        localStorage.setItem('timetable', JSON.stringify(timetable));
        renderTimetableEditor();
    }
}
function removeTimetableDay(day) {
    if (confirm(`Delete all periods for ${day}?`)) {
        let timetable = JSON.parse(localStorage.getItem('timetable')) || defaultTimetable;
        delete timetable[day];
        localStorage.setItem('timetable', JSON.stringify(timetable));
        renderTimetableEditor();
        if (currentUser?.role === 'student') loadStudentDashboard();
    }
}
function addTimetableSlot(day) {
    let timetable = JSON.parse(localStorage.getItem('timetable')) || defaultTimetable;
    timetable[day].push({ period: "New Time", subject: "New Subject", staff: "Staff" });
    localStorage.setItem('timetable', JSON.stringify(timetable));
    renderTimetableEditor();
}
function removeTimetableSlot(day, idx) {
    let timetable = JSON.parse(localStorage.getItem('timetable')) || defaultTimetable;
    timetable[day].splice(idx,1);
    if (timetable[day].length === 0) delete timetable[day];
    localStorage.setItem('timetable', JSON.stringify(timetable));
    renderTimetableEditor();
}
function saveTimetable() {
    let rows = document.querySelectorAll('.timetable-editor-row');
    let newTimetable = {};
    for (let row of rows) {
        let day = row.getAttribute('data-day');
        let period = row.querySelector('.tt-period').value.trim();
        let subject = row.querySelector('.tt-subject').value.trim();
        let staff = row.querySelector('.tt-staff').value.trim();
        if (!newTimetable[day]) newTimetable[day] = [];
        newTimetable[day].push({ period, subject, staff });
    }
    localStorage.setItem('timetable', JSON.stringify(newTimetable));
    alert("Timetable saved!");
    renderTimetableEditor();
    if (currentUser?.role === 'student') loadStudentDashboard();
}

function renderNoticesAdmin() {
    let notices = JSON.parse(localStorage.getItem('notices')) || noticesData;
    let html = '';
    for (let n of notices) html += `<div class="admin-notice-row"><div><strong>${n.title}</strong><br><small>Release: ${n.releaseDate} | Last: ${n.lastDate}</small><p>${n.description}</p></div><div><button class="btn btn-primary" onclick="editNotice('${n.id}')">Edit</button> <button class="btn btn-danger" onclick="deleteNotice('${n.id}')">Del</button></div></div>`;
    document.getElementById('noticesListAdmin').innerHTML = html || "<p>No notices. Add one.</p>";
}
function showAddNoticeModal() {
    document.getElementById('editNoticeId').value = '';
    document.getElementById('noticeTitle').value = '';
    document.getElementById('noticeDesc').value = '';
    document.getElementById('noticeReleaseDate').value = new Date().toISOString().split('T')[0];
    document.getElementById('noticeLastDate').value = '';
    document.getElementById('noticeModal').style.display = 'flex';
}
function editNotice(id) {
    let notices = JSON.parse(localStorage.getItem('notices')) || noticesData;
    let notice = notices.find(n => n.id === id);
    if (notice) {
        document.getElementById('editNoticeId').value = notice.id;
        document.getElementById('noticeTitle').value = notice.title;
        document.getElementById('noticeDesc').value = notice.description;
        document.getElementById('noticeReleaseDate').value = notice.releaseDate;
        document.getElementById('noticeLastDate').value = notice.lastDate;
        document.getElementById('noticeModal').style.display = 'flex';
    }
}
function saveNotice() {
    let id = document.getElementById('editNoticeId').value;
    let title = document.getElementById('noticeTitle').value;
    let desc = document.getElementById('noticeDesc').value;
    let releaseDate = document.getElementById('noticeReleaseDate').value;
    let lastDate = document.getElementById('noticeLastDate').value;
    if (!title || !desc) { alert("Title and description required"); return; }
    let notices = JSON.parse(localStorage.getItem('notices')) || noticesData;
    if (id) {
        let idx = notices.findIndex(n => n.id === id);
        if (idx !== -1) notices[idx] = { ...notices[idx], title, description: desc, releaseDate, lastDate };
    } else notices.push({ id: "n"+Date.now(), title, description: desc, releaseDate, lastDate });
    localStorage.setItem('notices', JSON.stringify(notices));
    closeNoticeModal();
    renderNoticesAdmin();
    if (currentUser?.role === 'student') loadStudentDashboard();
}
function deleteNotice(id) {
    if (confirm("Delete notice?")) {
        let notices = JSON.parse(localStorage.getItem('notices')) || noticesData;
        notices = notices.filter(n => n.id !== id);
        localStorage.setItem('notices', JSON.stringify(notices));
        renderNoticesAdmin();
        if (currentUser?.role === 'student') loadStudentDashboard();
    }
}
function closeNoticeModal() { document.getElementById('noticeModal').style.display = 'none'; }

function initClassChart() {
    let studs = studentsData.filter(s => s.role === 'student');
    if (studs.length === 0) return;
    let overalls = studs.map(s => computeOverall(s));
    let ctx = document.getElementById('classChart').getContext('2d');
    if (classBarChart) classBarChart.destroy();
    classBarChart = new Chart(ctx, { type: 'bar', data: { labels: studs.map(s=>s.name), datasets: [{ label: 'Overall %', data: overalls, backgroundColor: '#4f46e5', borderRadius: 8 }] } });
    let sorted = [...studs].sort((a,b)=>computeOverall(b)-computeOverall(a));
    let top3 = sorted.slice(0,3);
    document.getElementById('topStudents').innerHTML = top3.map(s=>`🏅 ${s.name} (${Math.round(computeOverall(s))}%)`).join('<br>') || "None";
    let atRisk = studs.filter(s=>computeOverall(s)<55);
    document.getElementById('riskStudents').innerHTML = atRisk.map(s=>`⚠️ ${s.name} (${Math.round(computeOverall(s))}%)`).join('<br>') || "✅ None";
}

function triggerCSV() {
    document.getElementById('csvFile').click();
    document.getElementById('csvFile').onchange = e => {
        let file = e.target.files[0];
        if (!file) return;
        Papa.parse(file, { header: true, complete: res => {
            let added = 0;
            for (let row of res.data) {
                if (row.name && row.rollNo && !studentsData.find(s => s.id === row.rollNo)) {
                    let marks = {};
                    for (let sub of subjectsList) marks[sub] = { ct1: parseInt(row[sub+'_ct1'])||0, ct2: parseInt(row[sub+'_ct2'])||0, mid: parseInt(row[sub+'_mid'])||0 };
                    studentsData.push({
                        id: row.rollNo, name: row.name, email: row.email || `${row.rollNo}@demo.com`, password: row.password || "123456",
                        rollNo: row.rollNo, role: "student", attendance: parseInt(row.attendance)||0, fee: row.fee||"pending",
                        skills: row.skills||"", contact: row.contact||"", marks: marks, assignments: [], practicals: { daa: false, python: false, vlab: false }
                    });
                    added++;
                }
            }
            if (added) {
                localStorage.setItem('students', JSON.stringify(studentsData));
                alert(`${added} students added!`);
                if (currentUser && currentUser.role === 'admin') { renderStudentsList(); initClassChart(); }
            } else alert("No new students found.");
        }});
    };
}

function initDarkMode() {
    if (localStorage.getItem('darkMode') === 'true') document.body.classList.add('dark');
    document.getElementById('darkModeToggle').onclick = () => {
        document.body.classList.toggle('dark');
        localStorage.setItem('darkMode', document.body.classList.contains('dark'));
        if (radarChart) radarChart.update();
        if (classBarChart) classBarChart.update();
    };
}

let saved = sessionStorage.getItem('currentUser');
if (saved) {
    let usr = JSON.parse(saved);
    let exists = studentsData.find(s => s.id === usr.id);
    if (exists) {
        currentUser = exists;
        document.getElementById('loginScreen').style.display = 'none';
        document.getElementById('mainApp').style.display = 'block';
        if (currentUser.role === 'admin') {
            document.getElementById('studentDashboard').style.display = 'none';
            document.getElementById('adminDashboard').style.display = 'block';
            document.getElementById('roleBadge').innerHTML = '<i class="fas fa-crown"></i> Admin Mode';
            loadAdminPanel();
        } else {
            document.getElementById('studentDashboard').style.display = 'block';
            document.getElementById('adminDashboard').style.display = 'none';
            document.getElementById('roleBadge').innerHTML = '<i class="fas fa-user-graduate"></i> Student Mode';
            loadStudentDashboard();
        }
    } else sessionStorage.removeItem('currentUser');
}
initDarkMode();