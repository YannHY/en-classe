class ActivityTimer {
    constructor(id) {
        this.id = id;
        this.minutesElement = document.getElementById(`activity${id}-minutes`);
        this.secondsElement = document.getElementById(`activity${id}-seconds`);
        this.lightElement = document.querySelector(`.activity-item:nth-child(${id}) .activity-circle`);
        this.timeLeft = 0;
        this.interval = null;
        this.isRunning = false;
        this.clickCount = 0;
        this.onComplete = null;
        this.initialTime = 0;
        this.progressBar = document.querySelector(`.activity-item:nth-child(${id}) .progress-bar`);
        this.alarmSound = document.getElementById('alarmSound');
        this.isAlarmPlaying = false;
        this.endTime = null; // Timestamp de fin pour persistance

        this.initializeEventListeners();
    }

    initializeEventListeners() {
        // Gestion des boutons plus/moins
        const plusBtn = document.querySelector(`.activity-item:nth-child(${this.id}) .time-btn.plus`);
        const minusBtn = document.querySelector(`.activity-item:nth-child(${this.id}) .time-btn.minus`);

        plusBtn.addEventListener('click', () => {
            if (!this.isRunning) {
                let minutes = parseInt(this.minutesElement.textContent);
                if (minutes < 59) {
                    minutes++;
                    this.minutesElement.textContent = String(minutes).padStart(2, '0');
                }
            }
        });

        minusBtn.addEventListener('click', () => {
            if (!this.isRunning) {
                let minutes = parseInt(this.minutesElement.textContent);
                if (minutes > 0) {
                    minutes--;
                    this.minutesElement.textContent = String(minutes).padStart(2, '0');
                }
            }
        });

        // Gestion du cercle de couleur (toujours accessible, même pendant le timer)
        this.lightElement.addEventListener('click', () => {
            this.clickCount = (this.clickCount + 1) % 4;
            switch (this.clickCount) {
                case 0:
                    this.lightElement.setAttribute('data-state', 'inactive');
                    break;
                case 1:
                    this.lightElement.setAttribute('data-state', 'active');
                    break;
                case 2:
                    this.lightElement.setAttribute('data-state', 'paused');
                    break;
                case 3:
                    this.lightElement.setAttribute('data-state', 'completed');
                    break;
            }
        });
    }

    start(timeLeft = null, initialTime = null) {
        const configuredTime = parseInt(this.minutesElement.textContent) * 60;
        const effectiveInitialTime = initialTime ?? configuredTime;
        const effectiveTimeLeft = timeLeft ?? configuredTime;

        if (!this.isRunning && configuredTime > 0 && effectiveTimeLeft > 0) {
            this.isRunning = true;
            this.timeLeft = effectiveTimeLeft;
            this.initialTime = effectiveInitialTime;
            this.endTime = Date.now() + (this.timeLeft * 1000);
            this.saveState();
            this.updateDisplay();

            this.interval = setInterval(() => {
                this.tick();
            }, 1000);

            return true;
        }

        return false;
    }

    getConfiguredTime() {
        return parseInt(this.minutesElement.textContent) * 60;
    }

    setElapsedState(initialTime) {
        this.stop();
        this.timeLeft = 0;
        this.initialTime = initialTime;
        this.endTime = null;
        this.updateDisplay();
        this.updateProgress();
        this.clearState();
    }

    // Reprendre un timer avec un temps restant spécifique
    resume(timeLeft, initialTime) {
        if (!this.isRunning && timeLeft > 0) {
            this.isRunning = true;
            this.timeLeft = timeLeft;
            this.initialTime = initialTime;
            this.endTime = Date.now() + (this.timeLeft * 1000);
            this.saveState();
            this.updateDisplay();
            this.updateProgress();

            this.interval = setInterval(() => {
                this.tick();
            }, 1000);
        }
    }

    tick() {
        // Calculer le temps restant basé sur l'heure de fin
        const now = Date.now();
        this.timeLeft = Math.max(0, Math.ceil((this.endTime - now) / 1000));

        if (this.timeLeft <= 0) {
            this.complete();
        } else {
            this.updateDisplay();
            this.updateProgress();
            this.saveState();
        }
    }

    complete() {
        const now = Date.now();
        const overtimeSeconds = this.endTime ? Math.max(0, Math.floor((now - this.endTime) / 1000)) : 0;
        this.isRunning = false;
        clearInterval(this.interval);
        this.interval = null;
        this.timeLeft = 0;
        this.endTime = null;
        this.updateDisplay();
        this.updateProgress();
        this.clearState();
        this.playAlarm();

        if (this.onComplete) {
            this.onComplete(overtimeSeconds);
        }
    }

    stop() {
        if (this.isRunning) {
            this.isRunning = false;
            clearInterval(this.interval);
            this.interval = null;
        }
        this.endTime = null;
        this.clearState();
    }

    reset() {
        this.stop();
        this.stopAlarm();
        this.minutesElement.textContent = '00';
        this.secondsElement.textContent = '00';
        this.lightElement.setAttribute('data-state', 'inactive');
        this.clickCount = 0;
        this.initialTime = 0;
        this.endTime = null;
        this.clearState();
        if (this.progressBar) {
            this.progressBar.style.width = '0%';
            this.progressBar.style.backgroundColor = '';
        }
    }

    // Sauvegarder l'état dans localStorage
    saveState() {
        const state = {
            endTime: this.endTime,
            initialTime: this.initialTime,
            isRunning: this.isRunning
        };
        localStorage.setItem(`activityTimer_${this.id}`, JSON.stringify(state));
    }

    // Effacer l'état du localStorage
    clearState() {
        localStorage.removeItem(`activityTimer_${this.id}`);
    }

    // Restaurer l'état depuis localStorage
    restoreState() {
        const saved = localStorage.getItem(`activityTimer_${this.id}`);
        if (saved) {
            const state = JSON.parse(saved);
            if (state.isRunning && state.endTime) {
                const now = Date.now();
                const timeLeft = Math.ceil((state.endTime - now) / 1000);

                if (timeLeft > 0) {
                    // Timer toujours en cours
                    this.endTime = state.endTime;
                    this.resume(timeLeft, state.initialTime);
                    return true;
                } else {
                    // Timer terminé pendant l'absence
                    const overtimeSeconds = Math.max(0, Math.floor((now - state.endTime) / 1000));
                    this.timeLeft = 0;
                    this.initialTime = state.initialTime || 0;
                    this.endTime = null;
                    this.updateDisplay();
                    this.updateProgress();
                    this.clearState();
                    this.playAlarm();
                    if (this.onComplete) {
                        this.onComplete(overtimeSeconds);
                    }
                    return 'completed';
                }
            }
        }
        return false;
    }

    updateDisplay() {
        const minutes = Math.max(0, Math.floor(this.timeLeft / 60));
        const seconds = Math.max(0, this.timeLeft % 60);
        this.minutesElement.textContent = String(minutes).padStart(2, '0');
        this.secondsElement.textContent = String(seconds).padStart(2, '0');
    }

    playAlarm() {
        if (!this.isAlarmPlaying && this.alarmSound) {
            this.isAlarmPlaying = true;
            this.alarmSound.currentTime = 0;
            this.alarmSound.play()
                .then(() => {
                    setTimeout(() => {
                        this.stopAlarm();
                    }, 3000);
                })
                .catch(error => console.error('Erreur lors de la lecture du son:', error));
        }
    }

    stopAlarm() {
        if (this.alarmSound) {
            this.alarmSound.pause();
            this.alarmSound.currentTime = 0;
            this.isAlarmPlaying = false;
        }
    }

    updateProgress() {
        if (this.progressBar && this.initialTime > 0) {
            const progress = ((this.initialTime - this.timeLeft) / this.initialTime) * 100;
            this.progressBar.style.width = `${progress}%`;

            // Color changes based on progress with semi-transparent colors
            if (progress > 75) {
                this.progressBar.style.backgroundColor = 'rgba(244, 67, 54, 0.4)'; // Red at the end
            } else if (progress > 50) {
                this.progressBar.style.backgroundColor = 'rgba(255, 152, 0, 0.4)'; // Orange in the middle
            } else {
                // Let CSS handle the default color
                this.progressBar.style.backgroundColor = '';
            }
        }
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    const getLocale = () => ((localStorage.getItem('site_lang') || localStorage.getItem('kanban_lang') || 'fr') === 'en' ? 'en-US' : 'fr-FR');

    const updateCurrentDate = () => {
        const dateElement = document.querySelector('.current-date span');
        if (!dateElement) return;
        const date = new Date();
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        dateElement.textContent = date.toLocaleDateString(getLocale(), options);
    };

    // Update current date
    updateCurrentDate();

    document.addEventListener('siteLanguageChanged', updateCurrentDate);

    // Create timer instances
    const timers = [];
    for (let i = 1; i <= 5; i++) {
        timers.push(new ActivityTimer(i));
    }

    // Configure timer sequence (saute les minuteurs à 00:00)
    const startNextTimer = (currentIndex, carryOverSeconds = 0) => {
        let carry = Math.max(0, carryOverSeconds);

        for (let nextIndex = currentIndex + 1; nextIndex < timers.length; nextIndex++) {
            const configuredTime = timers[nextIndex].getConfiguredTime();

            if (configuredTime <= 0) {
                continue;
            }

            const remainingTime = configuredTime - carry;

            if (remainingTime > 0) {
                timers[nextIndex].start(remainingTime, configuredTime);
                return true;
            }

            timers[nextIndex].setElapsedState(configuredTime);
            carry = Math.abs(remainingTime);
        }

        document.getElementById('startAllBtn').disabled = false;
        document.getElementById('stopAllBtn').disabled = true;
        return false;
    };

    for (let i = 0; i < timers.length - 1; i++) {
        timers[i].onComplete = (carryOverSeconds = 0) => {
            startNextTimer(i, carryOverSeconds);
        };
    }

    // Restaurer les timers depuis localStorage
    let anyRunning = false;
    for (let i = 0; i < timers.length; i++) {
        const result = timers[i].restoreState();
        if (result === true) {
            anyRunning = true;
        }
    }

    if (!anyRunning) {
        anyRunning = timers.some(timer => timer.isRunning);
    }

    // Mettre à jour l'état des boutons si des timers sont en cours
    if (anyRunning) {
        document.getElementById('startAllBtn').disabled = true;
        document.getElementById('stopAllBtn').disabled = false;
    }

    // Event handlers for main buttons
    document.getElementById('startAllBtn').addEventListener('click', () => {
        if (startNextTimer(-1)) {
            document.getElementById('startAllBtn').disabled = true;
            document.getElementById('stopAllBtn').disabled = false;
        }
    });

    document.getElementById('stopAllBtn').addEventListener('click', () => {
        timers.forEach(timer => timer.stop());
        document.getElementById('startAllBtn').disabled = false;
        document.getElementById('stopAllBtn').disabled = true;
    });

    document.getElementById('resetAllBtn').addEventListener('click', () => {
        timers.forEach(timer => timer.reset());
        document.getElementById('startAllBtn').disabled = false;
        document.getElementById('stopAllBtn').disabled = true;
    });

    // Gérer la visibilité de la page pour synchroniser l'affichage
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
            // La page redevient visible, synchroniser les timers
            timers.forEach(timer => {
                if (timer.isRunning && timer.endTime) {
                    const now = Date.now();
                    timer.timeLeft = Math.max(0, Math.ceil((timer.endTime - now) / 1000));
                    timer.updateDisplay();
                    timer.updateProgress();

                    if (timer.timeLeft <= 0) {
                        timer.complete();
                    }
                }
            });
        }
    });
});
