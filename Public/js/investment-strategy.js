document.addEventListener("DOMContentLoaded", function () {
    const riskSelect = document.getElementById("riskLevel");
    const riskBadge = document.querySelector(".risk-badge");
    const strategyList = document.querySelector(".strategy-list");
    const strategyDuration = document.getElementById("strategy-duration");

    const PRESETS = [
        { name: 'Education Funds', target: 20000, duration: '4 years' },
        { name: 'Emergency Fund', target: 15000, duration: '2 years' },
        { name: 'Home Purchase', target: 80000, duration: '10 years' },
        { name: 'Retirement Fund', target: 500000, duration: '30 years' },
        { name: 'Travel Fund', target: 8000, duration: '1 year' },
    ];

    let goals = [...PRESETS];

    try {
        const custom = JSON.parse(localStorage.getItem('moneta_custom_goals') || '[]');
        custom.forEach(g => goals.push(g));
    } catch (e) { }

    let goalIndex = 0;

    try {
        const s = JSON.parse(localStorage.getItem('moneta_state') || 'null');
        if (s && typeof s.goalIndex === 'number') {
            goalIndex = Math.min(s.goalIndex, goals.length - 1);
        }
    } catch (e) { }

    const selectedGoal = goals[goalIndex];

    if (strategyDuration && selectedGoal) {
        strategyDuration.textContent = 'Duration: ' + selectedGoal.duration;
    }
    
    const strategies = {
        low: {
            badge: "Low Risk",
            html: `
                <div class="strategy-item">
                    <div class="item-header">
                        <a href="https://www.investopedia.com/terms/f/fixeddeposit.asp" target="_blank">Fixed Deposit</a>
                        <span class="pct-badge">60%</span>
                    </div>
                    <p>Fixed deposits are suitable for low-risk investors because they provide stable returns and help preserve capital.</p>
                </div>

                <div class="strategy-item">
                    <div class="item-header">
                        <a href="https://www.investopedia.com/terms/b/bond.asp" target="_blank">Bonds</a>
                        <span class="pct-badge">40%</span>
                    </div>
                    <p>Bonds are generally lower-risk investments that provide steady income through interest payments.</p>
                </div>
            `
        },

        moderate: {
            badge: "Moderate Risk",
            html: `
                <div class="strategy-item">
                    <div class="item-header">
                        <a href="https://www.investopedia.com/terms/b/bond.asp" target="_blank">Bonds</a>
                        <span class="pct-badge">50%</span>
                    </div>
                    <p>Bonds are fixed-income investments where investors lend money to a government or company for a set period.</p>
                </div>

                <div class="strategy-item">
                    <div class="item-header">
                        <a href="https://www.investopedia.com/terms/b/balancedfund.asp" target="_blank">Balanced Fund</a>
                        <span class="pct-badge">50%</span>
                    </div>
                    <p>Balanced funds combine stocks and bonds, making them suitable for investors who want both growth and stability.</p>
                </div>
            `
        },

        high: {
            badge: "High Risk",
            html: `
                <div class="strategy-item">
                    <div class="item-header">
                        <a href="https://www.investopedia.com/terms/s/stock.asp" target="_blank">Stocks</a>
                        <span class="pct-badge">70%</span>
                    </div>
                    <p>Stocks offer higher growth potential but also come with higher price changes and investment risk.</p>
                </div>

                <div class="strategy-item">
                    <div class="item-header">
                        <a href="https://www.investopedia.com/terms/e/etf.asp" target="_blank">ETFs</a>
                        <span class="pct-badge">30%</span>
                    </div>
                    <p>ETFs allow investors to invest in a group of assets, giving diversification while still allowing growth potential.</p>
                </div>
            `
        }
    };

    function updateStrategy() {
        const selectedRisk = riskSelect.value;
        const selectedStrategy = strategies[selectedRisk];

        riskBadge.textContent = selectedStrategy.badge;
        strategyList.innerHTML = selectedStrategy.html;

        localStorage.setItem("moneta_risk_level", selectedRisk);
    }

    const savedRisk = localStorage.getItem("moneta_risk_level") || "moderate";
    riskSelect.value = savedRisk;
    updateStrategy();

    riskSelect.addEventListener("change", updateStrategy);
});