document.addEventListener("DOMContentLoaded", async function () {
    const riskSelect = document.getElementById("riskLevel");
    const riskBadge = document.querySelector(".risk-badge");
    const strategyList = document.querySelector(".strategy-list");
    const strategyDuration = document.getElementById("strategy-duration");

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

    function renderStrategy(riskLevel) {
        const selectedStrategy = strategies[riskLevel] || strategies.moderate;

        if (riskBadge) {
            riskBadge.textContent = selectedStrategy.badge;
        }

        if (strategyList) {
            strategyList.innerHTML = selectedStrategy.html;
        }
    }

    async function saveRiskLevel(riskLevel) {
        await api('/api/goals/settings/risk-level', {
            method: 'PATCH',
            body: JSON.stringify({ riskLevel })
        });
    }

    try {
        const data = await api('/api/goals');

        const goals = data.goals || [];
        const selectedGoalId = data.selectedGoalId;
        const savedRisk = data.riskLevel || 'moderate';

        const selectedGoal =
            goals.find(g => g.id === selectedGoalId) || goals[0];

        if (strategyDuration && selectedGoal) {
            strategyDuration.textContent = 'Duration: ' + selectedGoal.duration;
        }

        if (riskSelect) {
            riskSelect.value = savedRisk;
        }

        renderStrategy(savedRisk);

        if (riskSelect) {
            riskSelect.addEventListener("change", async function () {
                const selectedRisk = riskSelect.value;

                renderStrategy(selectedRisk);

                try {
                    await saveRiskLevel(selectedRisk);
                } catch (err) {
                    console.error('Failed to save risk level:', err);
                }
            });
        }
    } catch (err) {
        console.error('Failed to load investment strategy:', err);
    }
});