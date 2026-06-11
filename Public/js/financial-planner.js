window.addEventListener('load', () => {
    // Preset goals (must match Investment_goals.html)
    const PRESETS = [
        { name: 'Education Funds', target: 20000, duration: '4 years' },
        { name: 'Emergency Fund', target: 15000, duration: '2 years' },
        { name: 'Home Purchase', target: 80000, duration: '10 years' },
        { name: 'Retirement Fund', target: 500000, duration: '30 years' },
        { name: 'Travel Fund', target: 8000, duration: '1 year' },
    ];

    // Load custom goals and state from localStorage
    let goals = [...PRESETS];
    try {
        const custom = JSON.parse(localStorage.getItem('moneta_custom_goals') || '[]');
        custom.forEach(g => goals.push(g));
    } catch (e) { }

    let goalIndex = 0, currentAmt = 10000;
    try {
        const s = JSON.parse(localStorage.getItem('moneta_state') || 'null');
        if (s && typeof s.goalIndex === 'number') {
            goalIndex = Math.min(s.goalIndex, goals.length - 1);
            // read per-goal amount; fall back to 0 if not set
            currentAmt = (s.amounts && s.amounts[goalIndex] != null)
                ? s.amounts[goalIndex] : 0;
        }
    } catch (e) { }

    const g = goals[goalIndex];
    const target = g.target;
    const current = Math.min(currentAmt, target);
    const pct = Math.round((current / target) * 100);
    const remaining = target - current;

    // Parse duration correctly (years or months)
    const parts = g.duration.split(' ');
    const durNum = parseFloat(parts[0]);
    const isMonths = parts[1] && parts[1].startsWith('month');
    const months = isMonths ? durNum : durNum * 12;
    const monthly = (remaining > 0 && months > 0) ? (remaining / months) : 0;

    const fmt = n => 'RM ' + n.toLocaleString('en-MY', { minimumFractionDigits: 0, maximumFractionDigits: 2 });

    document.getElementById('fp-goal-name').textContent = g.name;
    document.getElementById('fp-goal-amount').childNodes[0].textContent = fmt(current);
    document.getElementById('fp-goal-target').textContent = ' / ' + fmt(target);
    document.getElementById('fp-goal-pct').textContent = pct + '%';
    document.getElementById('fp-goal-info').innerHTML =
        'Duration: ' + g.duration + '<br>' + fmt(+monthly.toFixed(2)) + '/month';

    // Animate progress bar
    const bar = document.getElementById('progressBar');
    bar.style.width = '0%';
    setTimeout(() => { bar.style.width = pct + '%'; }, 100);
});
