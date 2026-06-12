const express = require('express');
const router = express.Router();
const db = require('../db');

function requireLogin(req, res, next) {
    if (!req.session.user) {
        return res.status(401).json({ error: 'Not logged in' });
    }
    next();
}

const presetGoals = [
    { name: 'Education Funds', target: 20000, durationValue: 4, durationUnit: 'years', icon: '🎓', color: '#e6f0ff' },
    { name: 'Emergency Fund', target: 15000, durationValue: 2, durationUnit: 'years', icon: '🛡️', color: '#fff5e6' },
    { name: 'Home Purchase', target: 80000, durationValue: 10, durationUnit: 'years', icon: '🏠', color: '#e6ffe6' },
    { name: 'Retirement Fund', target: 500000, durationValue: 30, durationUnit: 'years', icon: '🌅', color: '#fce6ff' },
    { name: 'Travel Fund', target: 8000, durationValue: 1, durationUnit: 'years', icon: '✈️', color: '#e6f9ff' }
];

async function ensureUserGoals(userId) {
    const [existingGoals] = await db.query(
        'SELECT id FROM financial_goals WHERE user_id = ? LIMIT 1',
        [userId]
    );

    if (existingGoals.length === 0) {
        for (const goal of presetGoals) {
            await db.query(
                `INSERT INTO financial_goals 
                (user_id, name, target_amount, duration_value, duration_unit, icon, color, current_amount, is_preset)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    userId,
                    goal.name,
                    goal.target,
                    goal.durationValue,
                    goal.durationUnit === 'year' ? 'years' : goal.durationUnit,
                    goal.icon,
                    goal.color,
                    goal.name === 'Education Funds' ? 10000 : 0,
                    true
                ]
            );
        }
    }

    const [settings] = await db.query(
        'SELECT * FROM financial_goal_settings WHERE user_id = ?',
        [userId]
    );

    if (settings.length === 0) {
        const [firstGoal] = await db.query(
            'SELECT id FROM financial_goals WHERE user_id = ? ORDER BY id ASC LIMIT 1',
            [userId]
        );

        await db.query(
            `INSERT INTO financial_goal_settings 
            (user_id, selected_goal_id, risk_level)
            VALUES (?, ?, ?)`,
            [userId, firstGoal[0].id, 'moderate']
        );
    }
}

function formatGoal(row) {
    const unit =
        row.duration_value === 1
            ? row.duration_unit.replace(/s$/, '')
            : row.duration_unit;

    return {
        id: row.id,
        name: row.name,
        target: Number(row.target_amount),
        duration: `${row.duration_value} ${unit}`,
        durationValue: row.duration_value,
        durationUnit: row.duration_unit,
        icon: row.icon,
        color: row.color,
        currentAmount: Number(row.current_amount),
        description: row.description || '',
        isPreset: !!row.is_preset
    };
}

// GET all goals + settings
router.get('/', requireLogin, async (req, res) => {
    try {
        const userId = req.session.user.id;

        await ensureUserGoals(userId);

        const [goals] = await db.query(
            'SELECT * FROM financial_goals WHERE user_id = ? ORDER BY id ASC',
            [userId]
        );

        const [settings] = await db.query(
            'SELECT selected_goal_id, risk_level FROM financial_goal_settings WHERE user_id = ?',
            [userId]
        );

        res.json({
            goals: goals.map(formatGoal),
            selectedGoalId: settings[0].selected_goal_id,
            riskLevel: settings[0].risk_level
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to load goals' });
    }
});

// Add custom goal
router.post('/', requireLogin, async (req, res) => {
    try {
        const userId = req.session.user.id;
        const { name, target, durationValue, durationUnit, icon, color } = req.body;

        if (!name || !target || !durationValue || !durationUnit) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const [result] = await db.query(
            `INSERT INTO financial_goals
            (user_id, name, target_amount, duration_value, duration_unit, icon, color, is_preset)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                userId,
                name,
                target,
                durationValue,
                durationUnit,
                icon || '🎯',
                color || '#e6f0ff',
                false
            ]
        );

        res.json({ success: true, goalId: result.insertId });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to create goal' });
    }
});

// Update funded amount
router.patch('/:id/fund', requireLogin, async (req, res) => {
    try {
        const userId = req.session.user.id;
        const goalId = req.params.id;
        const amount = Number(req.body.amount);

        if (!amount || amount <= 0) {
            return res.status(400).json({ error: 'Invalid amount' });
        }

        await db.query(
            `UPDATE financial_goals
             SET current_amount = current_amount + ?
             WHERE id = ? AND user_id = ?`,
            [amount, goalId, userId]
        );

        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to update amount' });
    }
});

// Reset goal amount
router.patch('/:id/reset', requireLogin, async (req, res) => {
    try {
        const userId = req.session.user.id;
        const goalId = req.params.id;

        await db.query(
            `UPDATE financial_goals
             SET current_amount = 0
             WHERE id = ? AND user_id = ?`,
            [goalId, userId]
        );

        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to reset goal' });
    }
});

// Save description
router.patch('/:id/description', requireLogin, async (req, res) => {
    try {
        const userId = req.session.user.id;
        const goalId = req.params.id;
        const { description } = req.body;

        await db.query(
            `UPDATE financial_goals
             SET description = ?
             WHERE id = ? AND user_id = ?`,
            [description || null, goalId, userId]
        );

        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to save description' });
    }
});

// Delete custom goal
router.delete('/:id', requireLogin, async (req, res) => {
    try {
        const userId = req.session.user.id;
        const goalId = Number(req.params.id);

        const [goalRows] = await db.query(
            `SELECT id, is_preset
             FROM financial_goals
             WHERE id = ? AND user_id = ?`,
            [goalId, userId]
        );

        if (goalRows.length === 0) {
            return res.status(404).json({ error: 'Goal not found' });
        }

        if (goalRows[0].is_preset) {
            return res.status(400).json({ error: 'Preset goals cannot be deleted' });
        }

        await db.query(
            `DELETE FROM financial_goals
             WHERE id = ? AND user_id = ? AND is_preset = false`,
            [goalId, userId]
        );

        const [settingsRows] = await db.query(
            `SELECT selected_goal_id
             FROM financial_goal_settings
             WHERE user_id = ?`,
            [userId]
        );

        if (settingsRows.length > 0 && Number(settingsRows[0].selected_goal_id) === goalId) {
            const [firstGoal] = await db.query(
                `SELECT id
                 FROM financial_goals
                 WHERE user_id = ?
                 ORDER BY id ASC
                 LIMIT 1`,
                [userId]
            );

            await db.query(
                `UPDATE financial_goal_settings
                 SET selected_goal_id = ?
                 WHERE user_id = ?`,
                [firstGoal[0] ? firstGoal[0].id : null, userId]
            );
        }

        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to delete goal' });
    }
});


// Update selected goal
router.patch('/settings/selected-goal', requireLogin, async (req, res) => {
    try {
        const userId = req.session.user.id;
        const selectedGoalId = Number(req.body.selectedGoalId);

        if (!selectedGoalId) {
            return res.status(400).json({ error: 'Invalid selected goal' });
        }

        const [goalRows] = await db.query(
            `SELECT id
             FROM financial_goals
             WHERE id = ? AND user_id = ?`,
            [selectedGoalId, userId]
        );

        if (goalRows.length === 0) {
            return res.status(404).json({ error: 'Goal not found' });
        }

        await db.query(
            `UPDATE financial_goal_settings
             SET selected_goal_id = ?
             WHERE user_id = ?`,
            [selectedGoalId, userId]
        );

        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to update selected goal' });
    }
});

// Update risk level
router.patch('/settings/risk-level', requireLogin, async (req, res) => {
    try {
        const userId = req.session.user.id;
        const { riskLevel } = req.body;

        if (!['low', 'moderate', 'high'].includes(riskLevel)) {
            return res.status(400).json({ error: 'Invalid risk level' });
        }

        await db.query(
            `UPDATE financial_goal_settings
             SET risk_level = ?
             WHERE user_id = ?`,
            [riskLevel, userId]
        );

        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to update risk level' });
    }
});

module.exports = router;
