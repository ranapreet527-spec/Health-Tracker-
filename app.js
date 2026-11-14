// Health Tracker Pro - Core Application Engine
// State Management, Persistence, Analytics, and UI Controller

const STORAGE_KEY = 'PULSE_HEALTH_STORE_V1';

class HealthApp {
    constructor() {
        this.state = this.loadState();
        this.selectedDate = this.getTodayDateString();
        this.activeView = 'dashboard';

        this.init();
    }

    // Date helper: YYYY-MM-DD in local time
    getTodayDateString() {
        const d = new Date();
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    formatDisplayDate(dateStr) {
        const [year, month, day] = dateStr.split('-').map(Number);
        const d = new Date(year, month - 1, day);
        const today = new Date();
        const isToday = d.toDateString() === today.toDateString();

        const yesterday = new Date();
        yesterday.setDate(today.getDate() - 1);
        const isYesterday = d.toDateString() === yesterday.toDateString();

        if (isToday) return 'Today, ' + d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        if (isYesterday) return 'Yesterday, ' + d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    }

    // Default Profile & Seed Data Generator
    getDefaultState() {
        return {
            profile: {
                name: 'Alex Morgan',
                age: 28,
                gender: 'Female',
                height: 172, // cm
                weight: 68.5, // kg
                targetWeight: 65.0,
                stepGoal: 10000,
                waterGoal: 2500, // ml
                calorieGoal: 2100, // kcal
                sleepGoal: 8, // hours
                unit: 'metric',
                soundEnabled: true,
                theme: 'dark'
            },
            habitsTemplate: [
                { id: 'h1', text: '15 min morning sunlight' },
                { id: 'h2', text: 'Daily multivitamin & omega-3' },
                { id: 'h3', text: '10,000 steps baseline' },
                { id: 'h4', text: '10 min mindfulness pause' },
                { id: 'h5', text: 'Screen cutoff 45m before bed' }
            ],
            medicationsTemplate: [
                { id: 'm1', name: 'Vitamin D3', dosage: '2000 IU', time: '08:30 AM' },
                { id: 'm2', name: 'Omega-3 Fish Oil', dosage: '1000 mg', time: '01:00 PM' },
                { id: 'm3', name: 'Magnesium Glycinate', dosage: '200 mg', time: '09:30 PM' }
            ],
            entries: {}
        };
    }

    // Generate 14 days of realistic health history
    generateDemoData(baseState) {
        const today = new Date();
        const workoutsPool = [
            { name: 'Outdoor Jogging', type: 'Running', durationMin: 35, calories: 340, intensity: 'Moderate' },
            { name: 'Full Body HIIT', type: 'HIIT', durationMin: 30, calories: 290, intensity: 'High' },
            { name: 'Morning Vinyasa Flow', type: 'Yoga', durationMin: 40, calories: 160, intensity: 'Low' },
            { name: 'Evening Power Walk', type: 'Walking', durationMin: 45, calories: 210, intensity: 'Low' },
            { name: 'Upper Body Strength', type: 'Strength', durationMin: 45, calories: 280, intensity: 'High' },
            { name: 'Road Cycling', type: 'Cycling', durationMin: 50, calories: 420, intensity: 'Moderate' }
        ];

        const mealsPool = [
            { category: 'breakfast', name: 'Avocado Toast & Poached Eggs', calories: 420, protein: 18, carbs: 34, fat: 22 },
            { category: 'breakfast', name: 'Rolled Oats with Berries & Honey', calories: 380, protein: 12, carbs: 62, fat: 8 },
            { category: 'lunch', name: 'Grilled Chicken & Quinoa Salad', calories: 580, protein: 46, carbs: 48, fat: 18 },
            { category: 'lunch', name: 'Mediterranean Salmon Rice Bowl', calories: 640, protein: 42, carbs: 55, fat: 24 },
            { category: 'dinner', name: 'Steak with Roasted Asparagus & Sweet Potato', calories: 620, protein: 50, carbs: 40, fat: 22 },
            { category: 'dinner', name: 'Tofu Stir-Fry with Brown Rice', calories: 490, protein: 26, carbs: 58, fat: 16 },
            { category: 'snack', name: 'Greek Yogurt with Walnuts', calories: 210, protein: 16, carbs: 12, fat: 10 },
            { category: 'snack', name: 'Whey Protein Shake & Banana', calories: 260, protein: 28, carbs: 32, fat: 3 }
        ];

        for (let i = 13; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(today.getDate() - i);
            const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

            const stepBase = 8000 + Math.floor(Math.sin(i * 1.5) * 2500) + Math.floor(Math.random() * 1200);
            const waterBase = 2000 + Math.floor(Math.cos(i * 1.2) * 500) + Math.floor(Math.random() * 300);
            const sleepHours = Number((7.0 + (Math.sin(i * 0.8) * 1.2) + Math.random() * 0.4).toFixed(1));
            const weightShift = Number((69.2 - (13 - i) * 0.05 + (Math.random() * 0.3 - 0.15)).toFixed(1));

            // Select 1-2 workouts
            const dayWorkouts = [];
            if (i % 2 === 0 || i === 0) {
                const w = workoutsPool[(i + 1) % workoutsPool.length];
                dayWorkouts.push({
                    id: 'w_' + Math.random().toString(36).substr(2, 6),
                    ...w,
                    time: '07:30 AM'
                });
            }

            // Select 3-4 meals
            const dayMeals = [
                { id: 'm_' + Math.random().toString(36).substr(2, 6), ...mealsPool[i % 2], time: '08:30 AM' },
                { id: 'm_' + Math.random().toString(36).substr(2, 6), ...mealsPool[2 + (i % 2)], time: '01:15 PM' },
                { id: 'm_' + Math.random().toString(36).substr(2, 6), ...mealsPool[4 + (i % 2)], time: '07:30 PM' },
                { id: 'm_' + Math.random().toString(36).substr(2, 6), ...mealsPool[6 + (i % 2)], time: '04:00 PM' }
            ];

            // Water logs
            const waterLogs = [
                { time: '08:00 AM', amount: 350 },
                { time: '11:30 AM', amount: 500 },
                { time: '02:30 PM', amount: 500 },
                { time: '05:00 PM', amount: 500 }
            ];
            if (waterBase > 2000) {
                waterLogs.push({ time: '08:00 PM', amount: waterBase - 1850 });
            }

            // Habits
            const habits = baseState.habitsTemplate.map((h, idx) => ({
                id: h.id,
                completed: Math.random() > 0.25 || idx === 0 // mostly done
            }));

            // Medications
            const medications = baseState.medicationsTemplate.map(m => ({
                id: m.id,
                taken: Math.random() > 0.15
            }));

            baseState.entries[dateStr] = {
                steps: Math.min(16000, Math.max(4500, stepBase)),
                water: waterBase,
                waterLogs: waterLogs,
                workouts: dayWorkouts,
                meals: dayMeals,
                sleep: {
                    bedtime: '23:15',
                    wakeTime: '07:15',
                    durationHours: Math.min(9.5, Math.max(5.5, sleepHours)),
                    quality: sleepHours >= 7.5 ? 'Restful' : (sleepHours >= 6.5 ? 'Average' : 'Fragmented'),
                    score: Math.min(96, Math.max(62, Math.round(sleepHours * 11 + 6))),
                    notes: 'Felt well-rested throughout the day.'
                },
                vitals: {
                    bpSystolic: 116 + Math.floor(Math.random() * 8),
                    bpDiastolic: 74 + Math.floor(Math.random() * 6),
                    heartRate: 64 + Math.floor(Math.random() * 8),
                    bloodGlucose: 92 + Math.floor(Math.random() * 10),
                    spO2: 98 + (Math.random() > 0.5 ? 1 : 0),
                    weight: weightShift,
                    bmi: Number((weightShift / Math.pow(baseState.profile.height / 100, 2)).toFixed(1))
                },
                habits: habits,
                medications: medications,
                mood: {
                    rating: ['great', 'good', 'neutral'][i % 3],
                    energy: 8,
                    notes: 'High energy and positive focus.'
                }
            };
        }
        return baseState;
    }

    loadState() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (raw) {
                const parsed = JSON.parse(raw);
                if (parsed && parsed.profile && parsed.entries) {
                    return parsed;
                }
            }
        } catch (e) {
            console.warn('Failed to load state from localStorage:', e);
        }

        // Generate fresh demo state
        const fresh = this.getDefaultState();
        return this.generateDemoData(fresh);
    }

    saveState() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
        } catch (e) {
            console.error('Error saving state:', e);
        }
    }

    // Get or create today's entry
    getEntry(dateStr) {
        if (!this.state.entries[dateStr]) {
            this.state.entries[dateStr] = {
                steps: 0,
                water: 0,
                waterLogs: [],
                workouts: [],
                meals: [],
                sleep: {
                    bedtime: '23:00',
                    wakeTime: '07:00',
                    durationHours: 8,
                    quality: 'Restful',
                    score: 85,
                    notes: ''
                },
                vitals: {
                    bpSystolic: 120,
                    bpDiastolic: 80,
                    heartRate: 70,
                    bloodGlucose: 95,
                    spO2: 99,
                    weight: this.state.profile.weight,
                    bmi: Number((this.state.profile.weight / Math.pow(this.state.profile.height / 100, 2)).toFixed(1))
                },
                habits: this.state.habitsTemplate.map(h => ({ id: h.id, completed: false })),
                medications: this.state.medicationsTemplate.map(m => ({ id: m.id, taken: false })),
                mood: { rating: 'good', energy: 7, notes: '' }
            };
            this.saveState();
        }
        return this.state.entries[dateStr];
    }

    // Calculate Comprehensive Health Vitality Score (0-100)
    calculateHealthScore(entry) {
        if (!entry) return 0;
        const p = this.state.profile;

        // 1. Steps (up to 20 pts)
        const stepPct = Math.min(1.2, (entry.steps || 0) / p.stepGoal);
        const stepScore = Math.round(Math.min(20, stepPct * 20));

        // 2. Hydration (up to 20 pts)
        const waterPct = Math.min(1.2, (entry.water || 0) / p.waterGoal);
        const waterScore = Math.round(Math.min(20, waterPct * 20));

        // 3. Sleep (up to 20 pts)
        const sleepHours = entry.sleep ? entry.sleep.durationHours : 7;
        const sleepDiff = Math.abs(sleepHours - p.sleepGoal);
        const sleepScore = Math.round(Math.max(6, 20 - (sleepDiff * 3.5)));

        // 4. Nutrition (up to 20 pts)
        let totalCal = 0;
        if (entry.meals && entry.meals.length > 0) {
            totalCal = entry.meals.reduce((sum, m) => sum + (m.calories || 0), 0);
        }
        let nutriScore = 15;
        if (totalCal > 0) {
            const calDiffPct = Math.abs(totalCal - p.calorieGoal) / p.calorieGoal;
            nutriScore = Math.round(Math.max(5, 20 - (calDiffPct * 25)));
        }

        // 5. Habits & Workouts (up to 20 pts)
        let habitScore = 10;
        if (entry.habits && entry.habits.length > 0) {
            const comp = entry.habits.filter(h => h.completed).length;
            habitScore = Math.round((comp / entry.habits.length) * 12);
        }
        const workoutBonus = (entry.workouts && entry.workouts.length > 0) ? 8 : 0;
        const activityHabitScore = Math.min(20, habitScore + workoutBonus);

        const total = stepScore + waterScore + sleepScore + nutriScore + activityHabitScore;
        return Math.min(100, Math.max(0, total));
    }

    // AHA Blood Pressure Classification
    getBpCategory(systolic, diastolic) {
        if (!systolic || !diastolic) return { label: 'Unknown', className: 'status-optimal' };
        if (systolic < 120 && diastolic < 80) {
            return { label: 'Optimal', className: 'status-optimal' };
        } else if (systolic <= 129 && diastolic < 80) {
            return { label: 'Elevated', className: 'status-warning' };
        } else if ((systolic >= 130 && systolic <= 139) || (diastolic >= 80 && diastolic <= 89)) {
            return { label: 'Stage 1 HTN', className: 'status-warning' };
        } else {
            return { label: 'Stage 2 HTN', className: 'status-danger' };
        }
    }

    // BMI Category
    getBmiCategory(bmi) {
        if (!bmi) return { label: 'Normal', color: '#10b981' };
        if (bmi < 18.5) return { label: 'Underweight', color: '#38bdf8' };
        if (bmi < 25.0) return { label: 'Healthy / Normal', color: '#10b981' };
        if (bmi < 30.0) return { label: 'Overweight', color: '#f59e0b' };
        return { label: 'Obese', color: '#f43f5e' };
    }

    // Toast alert system
    showToast(msg, type = 'info') {
        const container = document.getElementById('toast-container');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.innerHTML = `<span>${msg}</span>`;
        if (type === 'danger') {
            toast.style.borderColor = 'var(--negative)';
        }

        container.appendChild(toast);
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 200);
        }, 2800);
    }

    // Initialization & Event Attachments
    init() {
        this.applyTheme(this.state.profile.theme || 'dark');
        if (window.soundFx) {
            window.soundFx.setEnabled(this.state.profile.soundEnabled !== false);
        }

        this.setupNavigation();
        this.setupDateNavigator();
        this.setupModals();
        this.setupQuickActions();
        this.render();

        window.addEventListener('resize', () => {
            this.renderCharts();
        });
    }

    applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        this.state.profile.theme = theme;
        const themeBtn = document.getElementById('theme-toggle-btn');
        if (themeBtn) {
            themeBtn.innerHTML = theme === 'light' 
                ? '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>'
                : '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';
        }
    }

    setupNavigation() {
        const navLinks = document.querySelectorAll('.nav-link, .mobile-nav-btn');
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const view = link.getAttribute('data-view');
                if (view) {
                    if (window.soundFx) window.soundFx.playTap();
                    this.switchView(view);
                }
            });
        });

        // Theme toggle
        const themeBtn = document.getElementById('theme-toggle-btn');
        if (themeBtn) {
            themeBtn.addEventListener('click', () => {
                const newTheme = document.documentElement.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
                this.applyTheme(newTheme);
                this.saveState();
                this.renderCharts();
                if (window.soundFx) window.soundFx.playTap();
            });
        }

        // Sound toggle
        const soundBtn = document.getElementById('sound-toggle-btn');
        if (soundBtn) {
            soundBtn.addEventListener('click', () => {
                this.state.profile.soundEnabled = !this.state.profile.soundEnabled;
                if (window.soundFx) {
                    window.soundFx.setEnabled(this.state.profile.soundEnabled);
                    if (this.state.profile.soundEnabled) window.soundFx.playTap();
                }
                this.updateSoundIcon();
                this.saveState();
                this.showToast(this.state.profile.soundEnabled ? 'Audio feedback enabled' : 'Audio feedback muted');
            });
            this.updateSoundIcon();
        }
    }

    updateSoundIcon() {
        const btn = document.getElementById('sound-toggle-btn');
        if (!btn) return;
        const on = this.state.profile.soundEnabled !== false;
        btn.innerHTML = on
            ? '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>'
            : '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>';
    }

    switchView(viewName) {
        this.activeView = viewName;
        document.querySelectorAll('.view-section').forEach(sec => sec.classList.remove('active'));
        const target = document.getElementById(`view-${viewName}`);
        if (target) target.classList.add('active');

        // Update nav buttons
        document.querySelectorAll('.nav-link, .mobile-nav-btn').forEach(btn => {
            if (btn.getAttribute('data-view') === viewName) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });

        // Trigger chart redraws after view becomes visible
        setTimeout(() => this.renderCharts(), 50);
    }

    setupDateNavigator() {
        const prevBtn = document.getElementById('prev-date-btn');
        const nextBtn = document.getElementById('next-date-btn');
        const todayChip = document.getElementById('today-chip');

        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                this.shiftDate(-1);
            });
        }
        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                this.shiftDate(1);
            });
        }
        if (todayChip) {
            todayChip.addEventListener('click', () => {
                this.selectedDate = this.getTodayDateString();
                if (window.soundFx) window.soundFx.playTap();
                this.render();
            });
        }
    }

    shiftDate(deltaDays) {
        const [year, month, day] = this.selectedDate.split('-').map(Number);
        const d = new Date(year, month - 1, day);
        d.setDate(d.getDate() + deltaDays);
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const dt = String(d.getDate()).padStart(2, '0');
        this.selectedDate = `${y}-${m}-${dt}`;
        if (window.soundFx) window.soundFx.playTap();
        this.render();
    }

    // Modal Manager
    openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('active');
            if (window.soundFx) window.soundFx.playTap();
        }
    }

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('active');
        }
    }

    setupModals() {
        // Modal close buttons & backdrop click
        document.querySelectorAll('.modal-overlay').forEach(overlay => {
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    overlay.classList.remove('active');
                }
            });
        });

        document.querySelectorAll('.modal-close-btn, .modal-cancel-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const overlay = btn.closest('.modal-overlay');
                if (overlay) overlay.classList.remove('active');
            });
        });

        // Quick log modal triggers
        const quickLogBtn = document.getElementById('quick-log-btn');
        if (quickLogBtn) {
            quickLogBtn.addEventListener('click', () => this.openModal('modal-quick-log'));
        }

        // Setup Forms
        this.setupWorkoutForm();
        this.setupMealForm();
        this.setupVitalsForm();
        this.setupSleepForm();
        this.setupHabitForm();
        this.setupProfileForm();
    }

    setupQuickActions() {
        // Fast Hydration Buttons
        document.querySelectorAll('.water-add-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const amount = parseInt(btn.getAttribute('data-amount'), 10) || 250;
                this.addWater(amount);
            });
        });
    }

    addWater(amount) {
        const entry = this.getEntry(this.selectedDate);
        entry.water = (entry.water || 0) + amount;
        
        const now = new Date();
        const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        entry.waterLogs.push({ time: timeStr, amount: amount });

        if (window.soundFx) window.soundFx.playWater();
        
        // If goal met
        if (entry.water >= this.state.profile.waterGoal && (entry.water - amount) < this.state.profile.waterGoal) {
            if (window.soundFx) setTimeout(() => window.soundFx.playCelebration(), 200);
            this.showToast('Hydration target reached', 'info');
        } else {
            this.showToast(`Logged +${amount} ml`, 'info');
        }

        this.saveState();
        this.render();
    }

    // Workout Form Handler
    setupWorkoutForm() {
        const form = document.getElementById('form-log-workout');
        if (!form) return;

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = document.getElementById('workout-name').value.trim();
            const type = document.getElementById('workout-type').value;
            const duration = parseInt(document.getElementById('workout-duration').value, 10) || 30;
            const calories = parseInt(document.getElementById('workout-calories').value, 10) || 200;
            const intensity = document.getElementById('workout-intensity').value;

            const entry = this.getEntry(this.selectedDate);
            const now = new Date();
            entry.workouts.push({
                id: 'w_' + Math.random().toString(36).substr(2, 6),
                name: name || `${type} session`,
                type,
                durationMin: duration,
                calories,
                intensity,
                time: now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
            });

            this.saveState();
            this.closeModal('modal-workout');
            if (window.soundFx) window.soundFx.playSuccess();
            this.showToast(`Workout logged: ${name || type} (${calories} kcal)`, 'info');
            this.render();
            form.reset();
        });
    }

    // Meal Form Handler
    setupMealForm() {
        const form = document.getElementById('form-log-meal');
        if (!form) return;

        // Meal presets quick select
        document.querySelectorAll('.meal-preset-chip').forEach(chip => {
            chip.addEventListener('click', () => {
                document.getElementById('meal-name').value = chip.getAttribute('data-name');
                document.getElementById('meal-calories').value = chip.getAttribute('data-cal');
                document.getElementById('meal-protein').value = chip.getAttribute('data-p');
                document.getElementById('meal-carbs').value = chip.getAttribute('data-c');
                document.getElementById('meal-fat').value = chip.getAttribute('data-f');
                if (window.soundFx) window.soundFx.playTap();
            });
        });

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const category = document.getElementById('meal-category').value;
            const name = document.getElementById('meal-name').value.trim() || 'Meal';
            const calories = parseInt(document.getElementById('meal-calories').value, 10) || 350;
            const protein = parseInt(document.getElementById('meal-protein').value, 10) || 20;
            const carbs = parseInt(document.getElementById('meal-carbs').value, 10) || 40;
            const fat = parseInt(document.getElementById('meal-fat').value, 10) || 12;

            const entry = this.getEntry(this.selectedDate);
            const now = new Date();
            entry.meals.push({
                id: 'm_' + Math.random().toString(36).substr(2, 6),
                category,
                name,
                calories,
                protein,
                carbs,
                fat,
                time: now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
            });

            this.saveState();
            this.closeModal('modal-meal');
            if (window.soundFx) window.soundFx.playSuccess();
            this.showToast(`Meal logged: ${name} (${calories} kcal)`, 'info');
            this.render();
            form.reset();
        });
    }

    // Vitals Form Handler
    setupVitalsForm() {
        const form = document.getElementById('form-log-vitals');
        if (!form) return;

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const sys = parseInt(document.getElementById('vitals-systolic').value, 10) || 120;
            const dia = parseInt(document.getElementById('vitals-diastolic').value, 10) || 80;
            const hr = parseInt(document.getElementById('vitals-hr').value, 10) || 72;
            const weight = parseFloat(document.getElementById('vitals-weight').value) || this.state.profile.weight;
            const glucose = parseInt(document.getElementById('vitals-glucose').value, 10) || 95;
            const spo2 = parseInt(document.getElementById('vitals-spo2').value, 10) || 99;

            const entry = this.getEntry(this.selectedDate);
            const hMeters = this.state.profile.height / 100;
            const bmi = Number((weight / (hMeters * hMeters)).toFixed(1));

            entry.vitals = {
                bpSystolic: sys,
                bpDiastolic: dia,
                heartRate: hr,
                bloodGlucose: glucose,
                spO2: spo2,
                weight: weight,
                bmi: bmi
            };

            // Update profile current weight
            this.state.profile.weight = weight;

            this.saveState();
            this.closeModal('modal-vitals');
            if (window.soundFx) window.soundFx.playSuccess();
            this.showToast('Vitals recorded', 'info');
            this.render();
        });
    }

    // Sleep Form Handler
    setupSleepForm() {
        const form = document.getElementById('form-log-sleep');
        if (!form) return;

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const bedtime = document.getElementById('sleep-bedtime').value || '23:00';
            const wakeTime = document.getElementById('sleep-waketime').value || '07:00';
            const quality = document.getElementById('sleep-quality').value || 'Restful';
            const notes = document.getElementById('sleep-notes').value.trim();

            const [bH, bM] = bedtime.split(':').map(Number);
            const [wH, wM] = wakeTime.split(':').map(Number);
            let bDate = new Date(2026, 0, 1, bH, bM);
            let wDate = new Date(2026, 0, (wH < bH || (wH === bH && wM < bM)) ? 2 : 1, wH, wM);
            let diffHours = Number(((wDate - bDate) / (1000 * 60 * 60)).toFixed(1));

            const entry = this.getEntry(this.selectedDate);
            let score = Math.round(Math.min(98, Math.max(50, diffHours * 11 + (quality === 'Restful' ? 12 : 5))));

            entry.sleep = {
                bedtime,
                wakeTime,
                durationHours: diffHours,
                quality,
                score,
                notes
            };

            this.saveState();
            this.closeModal('modal-sleep');
            if (window.soundFx) window.soundFx.playSuccess();
            this.showToast(`Sleep recorded: ${diffHours}h`, 'info');
            this.render();
        });
    }

    // Habit Form Handler
    setupHabitForm() {
        const form = document.getElementById('form-add-habit');
        if (!form) return;

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const text = document.getElementById('habit-text').value.trim();

            if (text) {
                const newId = 'h_' + Math.random().toString(36).substr(2, 6);
                this.state.habitsTemplate.push({ id: newId, text });
                
                const entry = this.getEntry(this.selectedDate);
                entry.habits.push({ id: newId, completed: false });

                this.saveState();
                this.closeModal('modal-habit');
                if (window.soundFx) window.soundFx.playTap();
                this.showToast(`Habit added: ${text}`, 'info');
                this.render();
                form.reset();
            }
        });
    }

    // Profile Settings Form
    setupProfileForm() {
        const form = document.getElementById('form-profile-settings');
        if (!form) return;

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const p = this.state.profile;
            p.name = document.getElementById('settings-name').value.trim() || p.name;
            p.height = parseFloat(document.getElementById('settings-height').value) || p.height;
            p.weight = parseFloat(document.getElementById('settings-weight').value) || p.weight;
            p.targetWeight = parseFloat(document.getElementById('settings-target-weight').value) || p.targetWeight;
            p.stepGoal = parseInt(document.getElementById('settings-step-goal').value, 10) || p.stepGoal;
            p.waterGoal = parseInt(document.getElementById('settings-water-goal').value, 10) || p.waterGoal;
            p.calorieGoal = parseInt(document.getElementById('settings-calorie-goal').value, 10) || p.calorieGoal;
            p.sleepGoal = parseFloat(document.getElementById('settings-sleep-goal').value) || p.sleepGoal;

            this.saveState();
            if (window.soundFx) window.soundFx.playSuccess();
            this.showToast('Profile and targets saved', 'info');
            this.render();
        });

        // Demo Data Button
        const demoBtn = document.getElementById('btn-load-demo-data');
        if (demoBtn) {
            demoBtn.addEventListener('click', () => {
                if (confirm('Load 14 days of realistic sample health history? Current entries will be updated.')) {
                    this.state = this.generateDemoData(this.getDefaultState());
                    this.saveState();
                    if (window.soundFx) window.soundFx.playSuccess();
                    this.showToast('14-day baseline data loaded', 'info');
                    this.render();
                }
            });
        }

        // Export Data
        const exportBtn = document.getElementById('btn-export-json');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(this.state, null, 2));
                const a = document.createElement('a');
                a.setAttribute('href', dataStr);
                a.setAttribute('download', `pulse_health_backup_${this.getTodayDateString()}.json`);
                document.body.appendChild(a);
                a.click();
                a.remove();
                this.showToast('Telemetry exported to JSON', 'info');
            });
        }

        // Import Data
        const importInput = document.getElementById('input-import-json');
        if (importInput) {
            importInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = (event) => {
                    try {
                        const parsed = JSON.parse(event.target.result);
                        if (parsed && parsed.profile && parsed.entries) {
                            this.state = parsed;
                            this.saveState();
                            if (window.soundFx) window.soundFx.playSuccess();
                            this.showToast('Backup imported', 'info');
                            this.render();
                        } else {
                            alert('Invalid health data file.');
                        }
                    } catch (err) {
                        alert('Could not parse JSON file.');
                    }
                };
                reader.readAsText(file);
            });
        }

        // Reset Data
        const resetBtn = document.getElementById('btn-reset-data');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                if (confirm('Are you sure you want to reset all health tracking data? This cannot be undone.')) {
                    localStorage.removeItem(STORAGE_KEY);
                    this.state = this.getDefaultState();
                    this.saveState();
                    if (window.soundFx) window.soundFx.playRemove();
                    this.showToast('All records cleared', 'danger');
                    this.render();
                }
            });
        }
    }

    // MAIN RENDER PASS
    render() {
        const entry = this.getEntry(this.selectedDate);
        const profile = this.state.profile;

        // 1. Update Date Display
        const dateEl = document.getElementById('current-date-display');
        if (dateEl) dateEl.innerText = this.formatDisplayDate(this.selectedDate);

        // 2. Calculate Health Score
        const score = this.calculateHealthScore(entry);
        this.renderHealthScore(score);

        // 3. Render Dashboard Metrics
        this.renderDashboardCards(entry, profile);

        // 4. Render Hydration Widget
        this.renderHydrationWidget(entry, profile);

        // 5. Render Nutrition
        this.renderNutritionWidget(entry, profile);

        // 6. Render Activity & Workouts
        this.renderWorkoutsWidget(entry, profile);

        // 7. Render Sleep & Vitals
        this.renderSleepWidget(entry, profile);
        this.renderVitalsWidget(entry, profile);

        // 8. Render Habits & Medications
        this.renderHabitsWidget(entry);

        // 9. Update Settings Form Fields
        this.populateSettingsFields();

        // 10. Render Charts
        this.renderCharts();
    }

    renderHealthScore(score) {
        const scoreValEl = document.getElementById('hero-health-score-text');
        const scoreStatusEl = document.getElementById('hero-health-score-status');
        
        let status = 'Optimal';
        let color = 'var(--positive)';
        if (score < 50) {
            status = 'Attention required';
            color = 'var(--negative)';
        } else if (score < 70) {
            status = 'Moderate';
            color = 'var(--warning)';
        } else if (score < 85) {
            status = 'Good';
            color = 'var(--accent)';
        }

        if (scoreValEl) scoreValEl.innerText = score;
        if (scoreStatusEl) {
            scoreStatusEl.innerText = status;
            scoreStatusEl.style.color = color;
        }

        if (window.HealthCharts) {
            HealthCharts.renderDonutProgress('canvas-hero-score', score, color, `${score}`, 'INDEX');
        }
    }

    renderDashboardCards(entry, profile) {
        // Steps card
        const stepsVal = entry.steps || 0;
        const stepsPct = Math.min(100, Math.round((stepsVal / profile.stepGoal) * 100));
        document.getElementById('card-steps-val').innerText = stepsVal.toLocaleString();
        document.getElementById('card-steps-goal').innerText = `Goal: ${profile.stepGoal.toLocaleString()}`;
        document.getElementById('card-steps-bar').style.width = `${stepsPct}%`;
        document.getElementById('card-steps-pct').innerText = `${stepsPct}%`;

        // Water card
        const waterVal = entry.water || 0;
        const waterPct = Math.min(100, Math.round((waterVal / profile.waterGoal) * 100));
        document.getElementById('card-water-val').innerText = waterVal.toLocaleString();
        document.getElementById('card-water-goal').innerText = `Goal: ${profile.waterGoal.toLocaleString()} ml`;
        document.getElementById('card-water-bar').style.width = `${waterPct}%`;
        document.getElementById('card-water-pct').innerText = `${waterPct}%`;

        // Calories card
        let totalCal = (entry.meals || []).reduce((s, m) => s + (m.calories || 0), 0);
        let burnedCal = (entry.workouts || []).reduce((s, w) => s + (w.calories || 0), 0);
        const calPct = Math.min(100, Math.round((totalCal / profile.calorieGoal) * 100));
        document.getElementById('card-cal-val').innerText = totalCal.toLocaleString();
        document.getElementById('card-cal-goal').innerText = `Target: ${profile.calorieGoal.toLocaleString()} kcal`;
        document.getElementById('card-cal-bar').style.width = `${calPct}%`;
        document.getElementById('card-cal-pct').innerText = `${calPct}% (${burnedCal} burned)`;

        // Sleep card
        const sleepHours = entry.sleep ? entry.sleep.durationHours : 0;
        const sleepPct = Math.min(100, Math.round((sleepHours / profile.sleepGoal) * 100));
        document.getElementById('card-sleep-val').innerText = `${sleepHours}h`;
        document.getElementById('card-sleep-goal').innerText = `Goal: ${profile.sleepGoal}h`;
        document.getElementById('card-sleep-bar').style.width = `${sleepPct}%`;
        document.getElementById('card-sleep-pct').innerText = `${entry.sleep ? entry.sleep.quality : 'Restful'}`;

        // Weight & BMI card
        const currentWeight = (entry.vitals && entry.vitals.weight) ? entry.vitals.weight : profile.weight;
        const hM = profile.height / 100;
        const currentBmi = Number((currentWeight / (hM * hM)).toFixed(1));
        const bmiCat = this.getBmiCategory(currentBmi);
        document.getElementById('card-weight-val').innerText = `${currentWeight} kg`;
        document.getElementById('card-weight-goal').innerText = `Target: ${profile.targetWeight} kg`;
        document.getElementById('card-bmi-badge').innerText = `BMI: ${currentBmi} (${bmiCat.label})`;
        document.getElementById('card-bmi-badge').style.color = bmiCat.color;
    }

    renderHydrationWidget(entry, profile) {
        const waterVal = entry.water || 0;
        const pct = Math.min(100, Math.round((waterVal / profile.waterGoal) * 100));
        
        // Fill the water bottle visual
        const liquid = document.getElementById('water-bottle-liquid');
        if (liquid) {
            liquid.style.height = `${pct}%`;
        }

        const textVal = document.getElementById('water-widget-val');
        if (textVal) textVal.innerText = `${waterVal} / ${profile.waterGoal} ml`;

        // Water log history
        const list = document.getElementById('water-logs-list');
        if (list) {
            if (!entry.waterLogs || entry.waterLogs.length === 0) {
                list.innerHTML = '<div style="color:var(--text-muted); text-align:center; padding:12px;">No water logs recorded for this day.</div>';
            } else {
                list.innerHTML = entry.waterLogs.map((log, idx) => `
                    <div class="food-item-row" style="margin-bottom:6px;">
                        <div class="food-details">
                            <span class="food-name">+${log.amount} ml</span>
                            <span class="food-sub">Logged at ${log.time}</span>
                        </div>
                        <button class="item-delete-btn" onclick="app.deleteWaterLog(${idx})">✕</button>
                    </div>
                `).join('');
            }
        }
    }

    deleteWaterLog(idx) {
        const entry = this.getEntry(this.selectedDate);
        if (entry.waterLogs && entry.waterLogs[idx]) {
            const removed = entry.waterLogs.splice(idx, 1)[0];
            entry.water = Math.max(0, (entry.water || 0) - removed.amount);
            this.saveState();
            if (window.soundFx) window.soundFx.playRemove();
            this.render();
        }
    }

    renderNutritionWidget(entry, profile) {
        let totalCal = 0, totalP = 0, totalC = 0, totalF = 0;
        const meals = entry.meals || [];
        meals.forEach(m => {
            totalCal += m.calories || 0;
            totalP += m.protein || 0;
            totalC += m.carbs || 0;
            totalF += m.fat || 0;
        });

        const remCal = profile.calorieGoal - totalCal;
        document.getElementById('nutrition-total-cal').innerText = totalCal.toLocaleString();
        document.getElementById('nutrition-rem-cal').innerText = remCal >= 0 ? `${remCal.toLocaleString()} left` : `${Math.abs(remCal)} over`;
        document.getElementById('nutrition-rem-cal').style.color = remCal >= 0 ? 'var(--positive)' : 'var(--negative)';

        document.getElementById('macro-protein-val').innerText = `${totalP}g`;
        document.getElementById('macro-carbs-val').innerText = `${totalC}g`;
        document.getElementById('macro-fat-val').innerText = `${totalF}g`;

        // Render Meals List
        const mealsHtml = meals.length === 0
            ? '<div style="color:var(--text-muted); text-align:center; padding:16px;">No meals logged for this day.</div>'
            : meals.map((m, idx) => `
                <div class="food-item-row">
                    <div class="food-details">
                        <span class="food-name">${m.name}</span>
                        <span class="food-sub">${m.category} · ${m.time} · P: ${m.protein}g · C: ${m.carbs}g · F: ${m.fat}g</span>
                    </div>
                    <div class="food-calories">
                        <span>${m.calories} kcal</span>
                        <button class="item-delete-btn" onclick="app.deleteMeal(${idx})">✕</button>
                    </div>
                </div>
            `).join('');

        const mealsContainer = document.getElementById('meals-feed-list');
        if (mealsContainer) mealsContainer.innerHTML = mealsHtml;

        const mealsTabContainer = document.getElementById('meals-tab-list');
        if (mealsTabContainer) mealsTabContainer.innerHTML = mealsHtml;
    }

    deleteMeal(idx) {
        const entry = this.getEntry(this.selectedDate);
        if (entry.meals && entry.meals[idx]) {
            entry.meals.splice(idx, 1);
            this.saveState();
            if (window.soundFx) window.soundFx.playRemove();
            this.render();
        }
    }

    renderWorkoutsWidget(entry, profile) {
        const workouts = entry.workouts || [];
        const totalBurn = workouts.reduce((s, w) => s + (w.calories || 0), 0);
        const totalMin = workouts.reduce((s, w) => s + (w.durationMin || 0), 0);

        document.getElementById('workout-total-burn').innerText = `${totalBurn} kcal`;
        document.getElementById('workout-total-duration').innerText = `${totalMin} mins`;

        const workoutsHtml = workouts.length === 0
            ? '<div style="color:var(--text-muted); text-align:center; padding:16px;">No workouts recorded today.</div>'
            : workouts.map((w, idx) => `
                <div class="food-item-row">
                    <div class="food-details">
                        <span class="food-name">${w.name} (${w.type})</span>
                        <span class="food-sub">${w.durationMin} mins · ${w.intensity} · ${w.time}</span>
                    </div>
                    <div class="food-calories">
                        <span>${w.calories} kcal</span>
                        <button class="item-delete-btn" onclick="app.deleteWorkout(${idx})">✕</button>
                    </div>
                </div>
            `).join('');

        const list = document.getElementById('workouts-feed-list');
        if (list) list.innerHTML = workoutsHtml;

        const workoutsTabList = document.getElementById('workouts-tab-list');
        if (workoutsTabList) workoutsTabList.innerHTML = workoutsHtml;
    }

    deleteWorkout(idx) {
        const entry = this.getEntry(this.selectedDate);
        if (entry.workouts && entry.workouts[idx]) {
            entry.workouts.splice(idx, 1);
            this.saveState();
            if (window.soundFx) window.soundFx.playRemove();
            this.render();
        }
    }

    renderSleepWidget(entry, profile) {
        const sleep = entry.sleep || { bedtime: '23:00', wakeTime: '07:00', durationHours: 8, quality: 'Restful', score: 85 };
        document.getElementById('sleep-duration-display').innerText = `${sleep.durationHours} hrs`;
        document.getElementById('sleep-times-display').innerText = `${sleep.bedtime} → ${sleep.wakeTime}`;
        document.getElementById('sleep-quality-tag').innerText = sleep.quality;
        document.getElementById('sleep-score-display').innerText = `Score: ${sleep.score || 85}/100`;
    }

    renderVitalsWidget(entry, profile) {
        const vitals = entry.vitals || { bpSystolic: 120, bpDiastolic: 80, heartRate: 70, bloodGlucose: 95, spO2: 99, weight: profile.weight };
        const bpCat = this.getBpCategory(vitals.bpSystolic, vitals.bpDiastolic);

        document.getElementById('vitals-bp-display').innerText = `${vitals.bpSystolic}/${vitals.bpDiastolic} mmHg`;
        const bpBadge = document.getElementById('vitals-bp-badge');
        bpBadge.innerText = bpCat.label;
        bpBadge.className = `vitals-status-pill ${bpCat.className}`;

        document.getElementById('vitals-hr-display').innerText = `${vitals.heartRate} bpm`;
        document.getElementById('vitals-glucose-display').innerText = `${vitals.bloodGlucose || 95} mg/dL`;
        document.getElementById('vitals-spo2-display').innerText = `${vitals.spO2 || 99}%`;
    }

    renderHabitsWidget(entry) {
        // Daily Habits Checklist
        const habitsList = document.getElementById('habits-checklist-container');
        if (habitsList) {
            const habits = entry.habits || [];
            habitsList.innerHTML = this.state.habitsTemplate.map(template => {
                const habitEntry = habits.find(h => h.id === template.id);
                const isChecked = habitEntry ? habitEntry.completed : false;
                return `
                    <div class="checklist-item ${isChecked ? 'checked' : ''}" onclick="app.toggleHabit('${template.id}')">
                        <div class="checkbox-custom">${isChecked ? '✓' : ''}</div>
                        <span class="checklist-title">${template.text}</span>
                        <div class="streak-pill">${this.calculateStreak(template.id)}d</div>
                    </div>
                `;
            }).join('');
        }

        // Medications Checklist
        const medsList = document.getElementById('medications-checklist-container');
        if (medsList) {
            const meds = entry.medications || [];
            medsList.innerHTML = this.state.medicationsTemplate.map(template => {
                const medEntry = meds.find(m => m.id === template.id);
                const isTaken = medEntry ? medEntry.taken : false;
                return `
                    <div class="checklist-item ${isTaken ? 'checked' : ''}" onclick="app.toggleMedication('${template.id}')">
                        <div class="checkbox-custom">${isTaken ? '✓' : ''}</div>
                        <div class="food-details" style="flex:1;">
                            <span class="checklist-title">${template.name} (${template.dosage})</span>
                            <span class="food-sub">Scheduled: ${template.time}</span>
                        </div>
                    </div>
                `;
            }).join('');
        }
    }

    toggleHabit(habitId) {
        const entry = this.getEntry(this.selectedDate);
        let h = entry.habits.find(item => item.id === habitId);
        if (!h) {
            h = { id: habitId, completed: true };
            entry.habits.push(h);
        } else {
            h.completed = !h.completed;
        }

        if (h.completed) {
            if (window.soundFx) window.soundFx.playSuccess();
            this.showToast('Habit completed! Streak maintained 🔥', 'success');
        } else {
            if (window.soundFx) window.soundFx.playTap();
        }

        this.saveState();
        this.render();
    }

    toggleMedication(medId) {
        const entry = this.getEntry(this.selectedDate);
        let m = entry.medications.find(item => item.id === medId);
        if (!m) {
            m = { id: medId, taken: true };
            entry.medications.push(m);
        } else {
            m.taken = !m.taken;
        }

        if (m.taken) {
            if (window.soundFx) window.soundFx.playSuccess();
            this.showToast('Medication recorded as taken', 'success');
        } else {
            if (window.soundFx) window.soundFx.playTap();
        }

        this.saveState();
        this.render();
    }

    calculateStreak(habitId) {
        let streak = 0;
        const d = new Date(this.selectedDate);
        for (let i = 0; i < 30; i++) {
            const checkDate = new Date(d);
            checkDate.setDate(d.getDate() - i);
            const dateStr = `${checkDate.getFullYear()}-${String(checkDate.getMonth() + 1).padStart(2, '0')}-${String(checkDate.getDate()).padStart(2, '0')}`;
            const entry = this.state.entries[dateStr];
            if (entry && entry.habits) {
                const habit = entry.habits.find(h => h.id === habitId);
                if (habit && habit.completed) {
                    streak++;
                } else if (i > 0) {
                    break;
                }
            } else if (i > 0) {
                break;
            }
        }
        return Math.max(1, streak);
    }

    populateSettingsFields() {
        const p = this.state.profile;
        const setVal = (id, val) => {
            const el = document.getElementById(id);
            if (el) el.value = val;
        };
        setVal('settings-name', p.name);
        setVal('settings-height', p.height);
        setVal('settings-weight', p.weight);
        setVal('settings-target-weight', p.targetWeight);
        setVal('settings-step-goal', p.stepGoal);
        setVal('settings-water-goal', p.waterGoal);
        setVal('settings-calorie-goal', p.calorieGoal);
        setVal('settings-sleep-goal', p.sleepGoal);

        // Header user name
        const userNameEl = document.getElementById('header-user-name');
        if (userNameEl) userNameEl.innerText = p.name;
    }

    // 7-day and 14-day Chart Renderer
    renderCharts() {
        if (!window.HealthCharts) return;

        // Gather last 7 days data
        const last7Days = [];
        const last7Labels = [];
        const today = new Date(this.selectedDate);

        for (let i = 6; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(today.getDate() - i);
            const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
            last7Days.push(dateStr);
            last7Labels.push(d.toLocaleDateString('en-US', { weekday: 'narrow' }));
        }

        // Steps Chart (Dashboard & Activity)
        const stepsData = last7Days.map(d => (this.state.entries[d] ? this.state.entries[d].steps : 0));
        HealthCharts.renderBarChart('canvas-steps-trend', last7Labels, stepsData, {
            goal: this.state.profile.stepGoal,
            unit: 'steps'
        });

        // Water Chart (Hydration view)
        const waterData = last7Days.map(d => (this.state.entries[d] ? this.state.entries[d].water : 0));
        HealthCharts.renderBarChart('canvas-water-trend', last7Labels, waterData, {
            goal: this.state.profile.waterGoal,
            unit: 'ml'
        });

        // Calories Chart (Nutrition view)
        const calData = last7Days.map(d => {
            const e = this.state.entries[d];
            if (!e || !e.meals) return 0;
            return e.meals.reduce((sum, m) => sum + (m.calories || 0), 0);
        });
        HealthCharts.renderBarChart('canvas-cal-trend', last7Labels, calData, {
            goal: this.state.profile.calorieGoal,
            unit: 'kcal'
        });

        // Sleep Chart (Sleep view)
        const sleepData = last7Days.map(d => (this.state.entries[d] && this.state.entries[d].sleep ? this.state.entries[d].sleep.durationHours : 0));
        HealthCharts.renderLineChart('canvas-sleep-trend', last7Labels, [
            { label: 'Duration', data: sleepData, color: '#a1a1a6', fill: false }
        ], { unit: 'hrs', yMin: 4, yMax: 10 });

        // Weight Line Chart (14 days)
        const last14Days = [];
        const last14Labels = [];
        for (let i = 13; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(today.getDate() - i);
            const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
            last14Days.push(dateStr);
            last14Labels.push(d.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' }));
        }

        const weightData = last14Days.map(d => {
            const e = this.state.entries[d];
            return (e && e.vitals && e.vitals.weight) ? e.vitals.weight : this.state.profile.weight;
        });

        HealthCharts.renderLineChart('canvas-weight-trend', last14Labels, [
            { label: 'Weight', data: weightData, color: '#ededed', fill: true }
        ], { unit: 'kg' });

        // Blood Pressure Chart (Systolic and Diastolic)
        const bpSys = last14Days.map(d => (this.state.entries[d] && this.state.entries[d].vitals ? this.state.entries[d].vitals.bpSystolic : 120));
        const bpDia = last14Days.map(d => (this.state.entries[d] && this.state.entries[d].vitals ? this.state.entries[d].vitals.bpDiastolic : 80));
        const bpConfig = {
            unit: 'mmHg',
            normalBand: { min: 75, max: 120 }
        };
        const bpDatasets = [
            { label: 'Systolic', data: bpSys, color: '#e5484d', fill: false },
            { label: 'Diastolic', data: bpDia, color: '#14b8a6', fill: false }
        ];

        HealthCharts.renderLineChart('canvas-bp-trend', last14Labels, bpDatasets, bpConfig);
        HealthCharts.renderLineChart('canvas-trends-bp', last14Labels, bpDatasets, bpConfig);

        // Trends View Charts
        HealthCharts.renderBarChart('canvas-trends-steps', last7Labels, stepsData, {
            goal: this.state.profile.stepGoal,
            unit: 'steps'
        });

        HealthCharts.renderBarChart('canvas-trends-water', last7Labels, waterData, {
            goal: this.state.profile.waterGoal,
            unit: 'ml'
        });

        HealthCharts.renderBarChart('canvas-trends-cal', last7Labels, calData, {
            goal: this.state.profile.calorieGoal,
            unit: 'kcal'
        });

        HealthCharts.renderLineChart('canvas-trends-sleep', last7Labels, [
            { label: 'Duration', data: sleepData, color: '#a1a1a6', fill: false }
        ], { unit: 'hrs', yMin: 4, yMax: 10 });
    }
}

// Global App Instance
document.addEventListener('DOMContentLoaded', () => {
    window.app = new HealthApp();
});
