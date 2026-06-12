/* ─────────────── DATA ─────────────── */
const PRESET_COUNT = 5;
const GOALS = [
    { name: 'Education Funds', target: 20000, duration: '4 years', icon: '🎓', color: '#e6f0ff' },
    { name: 'Emergency Fund', target: 15000, duration: '2 years', icon: '🛡️', color: '#fff5e6' },
    { name: 'Home Purchase', target: 80000, duration: '10 years', icon: '🏠', color: '#e6ffe6' },
    { name: 'Retirement Fund', target: 500000, duration: '30 years', icon: '🌅', color: '#fce6ff' },
    { name: 'Travel Fund', target: 8000, duration: '1 year', icon: '✈️', color: '#e6f9ff' },
];

// Restore custom goals from localStorage
try {
    const saved = JSON.parse(localStorage.getItem('moneta_custom_goals') || '[]');
    saved.forEach(g => GOALS.push(g));
} catch (e) { }

// State — restore from localStorage if available
let state = (() => {
    try {
        const s = JSON.parse(localStorage.getItem('moneta_state') || 'null');
        if (s && typeof s.goalIndex === 'number') {
            s.goalIndex = Math.min(s.goalIndex, GOALS.length - 1);
            // migrate old single-amount format
            if (!s.amounts) s.amounts = {};
            // migrate: ensure descriptions object exists
            if (!s.descriptions) s.descriptions = {};
            return s;
        }
    } catch (e) { }
    return { goalIndex: 0, amounts: { 0: 10000 }, descriptions: {} };
})();

/* ─────────────── STORAGE HELPER ─────────────── */
function saveToStorage() {
    try {
        localStorage.setItem('moneta_state', JSON.stringify(state));
        localStorage.setItem('moneta_custom_goals', JSON.stringify(GOALS.slice(PRESET_COUNT)));
    } catch (e) { }
}

/* ─────────────── HELPERS ─────────────── */
function fmt(n) {
    return 'RM ' + n.toLocaleString('en-MY', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

function updateUI() {
    const g = GOALS[state.goalIndex];
    const target = g.target;
    const current = Math.min(state.amounts[state.goalIndex] || 0, target);
    const pct = Math.round((current / target) * 100);
    const remaining = target - current;

    // Left cards
    document.getElementById('display-goal').textContent = g.name;
    document.getElementById('display-target').textContent = fmt(target);
    document.getElementById('display-duration').textContent = g.duration;

    // Right progress card
    document.getElementById('progress-goal-tag').textContent = g.name;
    document.getElementById('current-amt-display').textContent = fmt(current);
    document.getElementById('target-amt-display').textContent = ' / ' + fmt(target);
    document.getElementById('pct-label').textContent = pct + '%';
    document.getElementById('remaining-label').textContent = fmt(remaining) + ' remaining';

    // Monthly calc: parse duration correctly for both years and months
    const durParts = g.duration.split(' ');
    const durNum = parseFloat(durParts[0]);
    const isMonths = durParts[1] && durParts[1].startsWith('month');
    const months = isMonths ? durNum : durNum * 12;
    const monthlyNeeded = (remaining > 0 && months > 0) ? (remaining / months) : 0;
    document.getElementById('monthly-label').textContent =
        fmt(+monthlyNeeded.toFixed(2)) + ' / month';

    // Animate progress bar
    setTimeout(() => {
        document.getElementById('progressBar').style.width = pct + '%';
    }, 80);

    // Update description display
    updateDescDisplay();
}

/* ─────────────── DESCRIPTION HELPERS ─────────────── */
function updateDescDisplay() {
    const desc = state.descriptions[state.goalIndex] || '';
    const displayEl = document.getElementById('goal-desc-display');
    const btnEl = document.getElementById('desc-toggle-btn');
    if (desc) {
        displayEl.textContent = desc;
        displayEl.classList.remove('empty');
        btnEl.textContent = '✏ Edit Description';
    } else {
        displayEl.textContent = 'No description yet.';
        displayEl.classList.add('empty');
        btnEl.textContent = '✏ Add Description';
    }
}

function openDescModal() {
    const existing = state.descriptions[state.goalIndex] || '';
    document.getElementById('descInput').value = existing;
    const goalName = GOALS[state.goalIndex].name;
    document.getElementById('desc-modal-subtitle').textContent =
        'Add a personal note or description for "' + goalName + '".';
    document.getElementById('descModal').classList.add('active');
    setTimeout(() => document.getElementById('descInput').focus(), 100);
}

function closeDescModal() {
    document.getElementById('descModal').classList.remove('active');
}

function saveDesc() {
    const val = document.getElementById('descInput').value.trim();
    if (val) {
        state.descriptions[state.goalIndex] = val;
    } else {
        delete state.descriptions[state.goalIndex];
    }
    saveToStorage();
    closeDescModal();
    updateDescDisplay();
}

/* ─────────────── FUND MODAL ─────────────── */
function openFundModal() {
    document.getElementById('fundInput').value = '';
    document.getElementById('fundModal').classList.add('active');
    setTimeout(() => document.getElementById('fundInput').focus(), 100);
}
function closeFundModal() {
    document.getElementById('fundModal').classList.remove('active');
}
function saveFund() {
    const val = parseFloat(document.getElementById('fundInput').value);
    if (!val || val <= 0) {
        document.getElementById('fundInput').style.borderColor = '#e05050';
        return;
    }
    const idx = state.goalIndex;
    state.amounts[idx] = (state.amounts[idx] || 0) + val;
    saveToStorage();
    closeFundModal();
    updateUI();
}

function resetGoal() {
    state.amounts[state.goalIndex] = 0;
    document.getElementById('progressBar').style.width = '0%';
    saveToStorage();
    updateUI();
}

/* ─────────────── GOAL MODAL ─────────────── */
let selectedGoalIndex = 0;

function buildGoalList() {
    const container = document.getElementById('goalList');
    container.innerHTML = '';
    GOALS.forEach((g, i) => {
        const el = document.createElement('div');
        el.className = 'goal-option' + (i === selectedGoalIndex ? ' selected' : '');

        const isCustom = i >= 5; // first 5 are presets; user-added start at index 5
        el.innerHTML = `
                    <div class="goal-option-icon" style="background:${g.color}">${g.icon}</div>
                    <div class="goal-option-info">
                        <div class="goal-option-name">${g.name}</div>
                        <div class="goal-option-meta">Target: ${fmt(g.target)} &nbsp;·&nbsp; ${g.duration}</div>
                    </div>
                    <div class="goal-option-check"></div>
                    ${isCustom ? `<button class="goal-option-delete" title="Remove goal" data-idx="${i}">✕</button>` : ''}`;

        el.onclick = () => {
            selectedGoalIndex = i;
            buildGoalList();
        };

        // Delete button: stop click propagating to the option row
        if (isCustom) {
            const delBtn = el.querySelector('.goal-option-delete');
            delBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                deleteGoal(i);
            });
        }

        container.appendChild(el);
    });
}

function deleteGoal(idx) {
    GOALS.splice(idx, 1);

    // Re-key amounts and descriptions: shift all keys > idx down by 1
    const newAmounts = {};
    const newDescs = {};
    Object.keys(state.amounts).forEach(k => {
        const ki = parseInt(k);
        if (ki < idx) newAmounts[ki] = state.amounts[ki];
        else if (ki > idx) newAmounts[ki - 1] = state.amounts[ki];
    });
    Object.keys(state.descriptions).forEach(k => {
        const ki = parseInt(k);
        if (ki < idx) newDescs[ki] = state.descriptions[ki];
        else if (ki > idx) newDescs[ki - 1] = state.descriptions[ki];
    });
    state.amounts = newAmounts;
    state.descriptions = newDescs;

    if (selectedGoalIndex >= GOALS.length) selectedGoalIndex = GOALS.length - 1;
    else if (selectedGoalIndex > idx) selectedGoalIndex--;

    if (state.goalIndex >= GOALS.length) state.goalIndex = GOALS.length - 1;
    else if (state.goalIndex > idx) state.goalIndex--;

    saveToStorage();
    buildGoalList();
}


function openGoalModal() {
    selectedGoalIndex = state.goalIndex;
    buildGoalList();
    document.getElementById('goalModal').classList.add('active');
}
function closeGoalModal() {
    document.getElementById('goalModal').classList.remove('active');
}
function applyGoal() {
    if (selectedGoalIndex !== state.goalIndex) {
        state.goalIndex = selectedGoalIndex;
        // do NOT reset amount — each goal keeps its own funded amount
        document.getElementById('progressBar').style.width = '0%';
    }
    saveToStorage();
    closeGoalModal();
    updateUI();
}

/* ───────────────── GOAL FORM MODAL ───────────────── */
let durationUnit = 'years'; // 'years' or 'months'

function setUnit(unit) {
    durationUnit = unit;
    document.getElementById('unitYears').classList.toggle('active', unit === 'years');
    document.getElementById('unitMonths').classList.toggle('active', unit === 'months');
}

function openGoalFormModal() {
    // Clear form
    document.getElementById('formGoalName').value = '';
    document.getElementById('formGoalTarget').value = '';
    document.getElementById('formGoalDuration').value = '';
    setUnit('years');
    // Hide goal selector, show form
    document.getElementById('goalModal').classList.remove('active');
    document.getElementById('goalFormModal').classList.add('active');
    setTimeout(() => document.getElementById('formGoalName').focus(), 100);
}
function closeGoalFormModal() {
    document.getElementById('goalFormModal').classList.remove('active');
    // Return to goal selector
    document.getElementById('goalModal').classList.add('active');
}
function saveCustomGoal() {
    const name = document.getElementById('formGoalName').value.trim();
    const target = parseFloat(document.getElementById('formGoalTarget').value);
    const durNum = parseFloat(document.getElementById('formGoalDuration').value);

    // Validate
    const nameEl = document.getElementById('formGoalName');
    const tgtEl = document.getElementById('formGoalTarget');
    const durEl = document.getElementById('formGoalDuration');
    nameEl.style.borderColor = ''; tgtEl.style.borderColor = ''; durEl.style.borderColor = '';

    let ok = true;
    if (!name) { nameEl.style.borderColor = '#e05050'; ok = false; }
    if (!target || target <= 0) { tgtEl.style.borderColor = '#e05050'; ok = false; }
    if (!durNum || durNum <= 0) { durEl.style.borderColor = '#e05050'; ok = false; }
    if (!ok) return;

    // Build duration string and push to GOALS array
    const durStr = durationUnit === 'months'
        ? (durNum === 1 ? '1 month' : durNum + ' months')
        : (durNum === 1 ? '1 year' : durNum + ' years');

    const ICONS = ['⭐', '💡', '🎯', '💼', '🚀', '🌟', '💎', '🏆'];
    const COLORS = ['#fef9e7', '#eafaf1', '#eaf4fb', '#fdf2f8', '#f9ebea', '#e8f8f5', '#fdfefe', '#f0f0f0'];
    const idx = GOALS.length % ICONS.length;
    GOALS.push({ name, target, duration: durStr, icon: ICONS[idx], color: COLORS[idx] });

    saveToStorage();

    // Select the new goal and close
    selectedGoalIndex = GOALS.length - 1;
    document.getElementById('goalFormModal').classList.remove('active');
    // Refresh and reopen goal selector
    buildGoalList();
    document.getElementById('goalModal').classList.add('active');
}

/* ───────────────── CLOSE ON BACKDROP ───────────────── */
document.getElementById('fundModal').addEventListener('click', function (e) {
    if (e.target === this) closeFundModal();
});
document.getElementById('goalModal').addEventListener('click', function (e) {
    if (e.target === this) closeGoalModal();
});
document.getElementById('descModal').addEventListener('click', function (e) {
    if (e.target === this) closeDescModal();
});

/* ─────────────── INIT ─────────────── */
window.addEventListener('load', updateUI);
