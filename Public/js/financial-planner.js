let plannerGoals = [];
let plannerSelectedGoalId = null;
let plannerRiskLevel = 'moderate';

function fmt(n) {
    return 'RM ' + Number(n || 0).toLocaleString('en-MY', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
    });
}

async function api(url, options = {}) {
    const res = await fetch(url, {
        headers: {
            'Content-Type': 'application/json'
        },
        ...options
    });

    if (res.status === 401) {
        window.location.href = '/login.html?error=session';
        return;
    }

    if (!res.ok) {
        throw new Error('API request failed');
    }

    return res.json();
}

function getSelectedPlannerGoal() {
    return plannerGoals.find(g => g.id === plannerSelectedGoalId) || plannerGoals[0];
}

function renderStrategySummary() {
    const selectedRisk = plannerRiskLevel || 'moderate';

    const strategies = {
        low: {
            badge: "Low Risk",
            items: [
                { name: "Fixed Deposit", pct: "60%" },
                { name: "Bonds", pct: "40%" }
            ]
        },
        moderate: {
            badge: "Moderate Risk",
            items: [
                { name: "Bonds", pct: "50%" },
                { name: "Balanced Funds", pct: "50%" }
            ]
        },
        high: {
            badge: "High Risk",
            items: [
                { name: "Stocks", pct: "70%" },
                { name: "ETFs", pct: "30%" }
            ]
        }
    };

    const strategy = strategies[selectedRisk] || strategies.moderate;

    const riskBadge = document.querySelector(".strategies-body .risk-badge");
    const tagList = document.querySelector(".tag-list");
    const allocTable = document.querySelector(".alloc-table");

    if (riskBadge) {
        riskBadge.textContent = strategy.badge;
    }

    if (tagList) {
        tagList.innerHTML = strategy.items
            .map(item => `<span class="strat-tag">${item.name}</span>`)
            .join("");
    }

    if (allocTable) {
        allocTable.innerHTML = strategy.items
            .map(item => `
                <div class="alloc-row">
                    <span class="alloc-tag">${item.name}</span>
                    <span class="alloc-pct">${item.pct}</span>
                </div>
            `)
            .join("");
    }
}

function renderFinancialPlannerUI() {
    const g = getSelectedPlannerGoal();

    if (!g) return;

    const target = Number(g.target || 0);
    const current = Math.min(Number(g.currentAmount || 0), target);
    const pct = target > 0 ? Math.round((current / target) * 100) : 0;
    const remaining = target - current;

    const parts = g.duration.split(' ');
    const durNum = parseFloat(parts[0]);
    const isMonths = parts[1] && parts[1].startsWith('month');
    const months = isMonths ? durNum : durNum * 12;
    const monthly = remaining > 0 && months > 0 ? remaining / months : 0;

    document.getElementById('fp-goal-name').textContent = g.name;
    document.getElementById('fp-goal-amount').childNodes[0].textContent = fmt(current);
    document.getElementById('fp-goal-target').textContent = ' / ' + fmt(target);
    document.getElementById('fp-goal-pct').textContent = pct + '%';

    document.getElementById('fp-goal-info').innerHTML =
        'Duration: ' + g.duration + '<br>' + fmt(+monthly.toFixed(2)) + '/month';

    const strategyDuration = document.getElementById('fp-strategy-duration');

    if (strategyDuration) {
        strategyDuration.textContent = 'Duration: ' + g.duration;
    }

    renderStrategySummary();

    const bar = document.getElementById('progressBar');

    if (bar) {
        bar.style.width = '0%';
        setTimeout(() => {
            bar.style.width = pct + '%';
        }, 100);
    }
}

async function renderFinancialPlanner() {
    try {
        const data = await api('/api/goals');

        plannerGoals = data.goals || [];
        plannerSelectedGoalId = data.selectedGoalId;
        plannerRiskLevel = data.riskLevel || 'moderate';

        renderFinancialPlannerUI();
    } catch (err) {
        console.error('Failed to render financial planner:', err);
    }
}

window.addEventListener('load', renderFinancialPlanner);
window.addEventListener('pageshow', renderFinancialPlanner);