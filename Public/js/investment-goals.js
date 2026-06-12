/* ─────────────── DATABASE STATE ─────────────── */

let GOALS = [];
let selectedGoalId = null;
let selectedGoalIdInModal = null;
let durationUnit = 'years';

/* ─────────────── API HELPER ─────────────── */

async function api(url, options = {}) {
    const res = await fetch(url, {
        headers: {
            'Content-Type': 'application/json'
        },
        ...options
    });

    if (res.status === 401) {
        window.location.href = '/login.html?error=session';
        throw new Error('Not logged in');
    }

    if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'API request failed');
    }

    return res.json();
}

async function loadGoalsFromDatabase() {
    const data = await api('/api/goals');

    GOALS = data.goals || [];
    selectedGoalId = data.selectedGoalId;

    if (!selectedGoalId && GOALS.length > 0) {
        selectedGoalId = GOALS[0].id;
    }

    updateUI();
}

/* ─────────────── HELPERS ─────────────── */

function fmt(n) {
    return 'RM ' + Number(n || 0).toLocaleString('en-MY', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
    });
}

function getSelectedGoal() {
    return GOALS.find(g => g.id === selectedGoalId) || GOALS[0];
}

function updateUI() {
    const g = getSelectedGoal();

    if (!g) return;

    const target = Number(g.target || 0);
    const current = Math.min(Number(g.currentAmount || 0), target);
    const pct = target > 0 ? Math.round((current / target) * 100) : 0;
    const remaining = target - current;

    document.getElementById('display-goal').textContent = g.name;
    document.getElementById('display-target').textContent = fmt(target);
    document.getElementById('display-duration').textContent = g.duration;

    document.getElementById('progress-goal-tag').textContent = g.name;
    document.getElementById('current-amt-display').textContent = fmt(current);
    document.getElementById('target-amt-display').textContent = ' / ' + fmt(target);
    document.getElementById('pct-label').textContent = pct + '%';
    document.getElementById('remaining-label').textContent = fmt(remaining) + ' remaining';

    const durParts = g.duration.split(' ');
    const durNum = parseFloat(durParts[0]);
    const isMonths = durParts[1] && durParts[1].startsWith('month');
    const months = isMonths ? durNum : durNum * 12;

    const monthlyNeeded = remaining > 0 && months > 0 ? remaining / months : 0;

    document.getElementById('monthly-label').textContent =
        fmt(+monthlyNeeded.toFixed(2)) + ' / month';

    setTimeout(() => {
        document.getElementById('progressBar').style.width = pct + '%';
    }, 80);

    updateDescDisplay();
}

/* ─────────────── DESCRIPTION HELPERS ─────────────── */

function updateDescDisplay() {
    const g = getSelectedGoal();

    if (!g) return;

    const desc = g.description || '';
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
    const g = getSelectedGoal();

    if (!g) return;

    document.getElementById('descInput').value = g.description || '';

    document.getElementById('desc-modal-subtitle').textContent =
        'Add a personal note or description for "' + g.name + '".';

    document.getElementById('descModal').classList.add('active');

    setTimeout(() => document.getElementById('descInput').focus(), 100);
}

function closeDescModal() {
    document.getElementById('descModal').classList.remove('active');
}

async function saveDesc() {
    const g = getSelectedGoal();

    if (!g) return;

    const val = document.getElementById('descInput').value.trim();

    await api(`/api/goals/${g.id}/description`, {
        method: 'PATCH',
        body: JSON.stringify({ description: val })
    });

    closeDescModal();
    await loadGoalsFromDatabase();
}

/* ─────────────── FUND MODAL ─────────────── */

function openFundModal() {
    document.getElementById('fundInput').value = '';
    document.getElementById('fundInput').style.borderColor = '';
    document.getElementById('fundModal').classList.add('active');

    setTimeout(() => document.getElementById('fundInput').focus(), 100);
}

function closeFundModal() {
    document.getElementById('fundModal').classList.remove('active');
}

async function saveFund() {
    const g = getSelectedGoal();

    if (!g) return;

    const input = document.getElementById('fundInput');
    const val = parseFloat(input.value);

    if (!val || val <= 0) {
        input.style.borderColor = '#e05050';
        return;
    }

    await api(`/api/goals/${g.id}/fund`, {
        method: 'PATCH',
        body: JSON.stringify({ amount: val })
    });

    closeFundModal();
    await loadGoalsFromDatabase();
}

async function resetGoal() {
    const g = getSelectedGoal();

    if (!g) return;

    document.getElementById('progressBar').style.width = '0%';

    await api(`/api/goals/${g.id}/reset`, {
        method: 'PATCH'
    });

    await loadGoalsFromDatabase();
}

/* ─────────────── GOAL MODAL ─────────────── */

function buildGoalList() {
    const container = document.getElementById('goalList');
    container.innerHTML = '';

    GOALS.forEach((g) => {
        const el = document.createElement('div');
        el.className = 'goal-option' + (g.id === selectedGoalIdInModal ? ' selected' : '');

        el.innerHTML = `
            <div class="goal-option-icon" style="background:${g.color}">${g.icon}</div>
            <div class="goal-option-info">
                <div class="goal-option-name">${g.name}</div>
                <div class="goal-option-meta">Target: ${fmt(g.target)} &nbsp;·&nbsp; ${g.duration}</div>
            </div>
            <div class="goal-option-check"></div>
            ${!g.isPreset ? `<button class="goal-option-delete" title="Remove goal">✕</button>` : ''}
        `;

        el.onclick = () => {
            selectedGoalIdInModal = g.id;
            buildGoalList();
        };

        const delBtn = el.querySelector('.goal-option-delete');

        if (delBtn) {
            delBtn.addEventListener('click', async (e) => {
                e.stopPropagation();
                await deleteGoal(g.id);
            });
        }

        container.appendChild(el);
    });
}

async function deleteGoal(goalId) {
    await api(`/api/goals/${goalId}`, {
        method: 'DELETE'
    });

    const data = await api('/api/goals');

    GOALS = data.goals || [];
    selectedGoalId = data.selectedGoalId;

    if (!GOALS.some(g => g.id === selectedGoalIdInModal)) {
        selectedGoalIdInModal = selectedGoalId;
    }

    buildGoalList();
    updateUI();
}

function openGoalModal() {
    selectedGoalIdInModal = selectedGoalId;
    buildGoalList();
    document.getElementById('goalModal').classList.add('active');
}

function closeGoalModal() {
    document.getElementById('goalModal').classList.remove('active');
}

async function applyGoal() {
    if (!selectedGoalIdInModal) return;

    selectedGoalId = selectedGoalIdInModal;

    document.getElementById('progressBar').style.width = '0%';

    await api('/api/goals/settings/selected-goal', {
        method: 'PATCH',
        body: JSON.stringify({ selectedGoalId })
    });

    closeGoalModal();
    await loadGoalsFromDatabase();
}

/* ───────────────── GOAL FORM MODAL ───────────────── */

function setUnit(unit) {
    durationUnit = unit;

    document.getElementById('unitYears').classList.toggle('active', unit === 'years');
    document.getElementById('unitMonths').classList.toggle('active', unit === 'months');
}

function openGoalFormModal() {
    document.getElementById('formGoalName').value = '';
    document.getElementById('formGoalTarget').value = '';
    document.getElementById('formGoalDuration').value = '';

    setUnit('years');

    document.getElementById('goalModal').classList.remove('active');
    document.getElementById('goalFormModal').classList.add('active');

    setTimeout(() => document.getElementById('formGoalName').focus(), 100);
}

function closeGoalFormModal() {
    document.getElementById('goalFormModal').classList.remove('active');
    document.getElementById('goalModal').classList.add('active');
}

async function saveCustomGoal() {
    const name = document.getElementById('formGoalName').value.trim();
    const target = parseFloat(document.getElementById('formGoalTarget').value);
    const durNum = parseFloat(document.getElementById('formGoalDuration').value);

    const nameEl = document.getElementById('formGoalName');
    const tgtEl = document.getElementById('formGoalTarget');
    const durEl = document.getElementById('formGoalDuration');

    nameEl.style.borderColor = '';
    tgtEl.style.borderColor = '';
    durEl.style.borderColor = '';

    let ok = true;

    if (!name) {
        nameEl.style.borderColor = '#e05050';
        ok = false;
    }

    if (!target || target <= 0) {
        tgtEl.style.borderColor = '#e05050';
        ok = false;
    }

    if (!durNum || durNum <= 0) {
        durEl.style.borderColor = '#e05050';
        ok = false;
    }

    if (!ok) return;

    const ICONS = ['⭐', '💡', '🎯', '💼', '🚀', '🌟', '💎', '🏆'];
    const COLORS = ['#fef9e7', '#eafaf1', '#eaf4fb', '#fdf2f8', '#f9ebea', '#e8f8f5', '#fdfefe', '#f0f0f0'];

    const idx = GOALS.length % ICONS.length;

    const result = await api('/api/goals', {
        method: 'POST',
        body: JSON.stringify({
            name,
            target,
            durationValue: durNum,
            durationUnit,
            icon: ICONS[idx],
            color: COLORS[idx]
        })
    });

    const data = await api('/api/goals');

    GOALS = data.goals || [];
    selectedGoalId = data.selectedGoalId;
    selectedGoalIdInModal = result.goalId;

    document.getElementById('goalFormModal').classList.remove('active');
    document.getElementById('goalModal').classList.add('active');

    buildGoalList();
}

/* ───────────────── CLOSE ON BACKDROP ───────────────── */

function setupBackdropClose() {
    const fundModal = document.getElementById('fundModal');
    const goalModal = document.getElementById('goalModal');
    const descModal = document.getElementById('descModal');

    if (fundModal) {
        fundModal.addEventListener('click', function (e) {
            if (e.target === this) closeFundModal();
        });
    }

    if (goalModal) {
        goalModal.addEventListener('click', function (e) {
            if (e.target === this) closeGoalModal();
        });
    }

    if (descModal) {
        descModal.addEventListener('click', function (e) {
            if (e.target === this) closeDescModal();
        });
    }
}

/* ─────────────── INIT ─────────────── */

window.addEventListener('load', async () => {
    setupBackdropClose();

    try {
        await loadGoalsFromDatabase();
    } catch (err) {
        console.error('Failed to load investment goals:', err);
    }
});