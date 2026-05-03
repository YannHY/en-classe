/**
 * Classe Timer - Gestion du minuteur avec fonctionnalités de démarrage, pause, arrêt
 */
class Timer {
    constructor() {
        // Éléments DOM
        this.display = document.querySelector('.timer-display');
        this.startBtn = document.getElementById('startBtn');
        this.pauseBtn = document.getElementById('pauseBtn');
        this.stopBtn = document.getElementById('stopBtn');
        this.resetBtn = document.getElementById('resetBtn');
        this.hoursValue = document.getElementById('hours');
        this.minutesValue = document.getElementById('minutes');
        this.secondsValue = document.getElementById('seconds');
        this.alarmSound = document.getElementById('alarmSound');
        
        // État interne
        this.time = 0;
        this.targetTime = 0;
        this.interval = null;
        this.isRunning = false;
        this.initialTime = 0;
        this.isAlarmPlaying = false;
        this.alarmCount = 0;
        this.maxAlarms = 3;
        
        // Initialisation de l'affichage
        this.updateDisplay(0, 0, 0);
        this.display.style.setProperty('--progress', '100%');
        
        this.initializeEventListeners();
    }
    
    initializeEventListeners() {
        // Boutons principaux
        this.startBtn.addEventListener('click', () => this.start());
        this.pauseBtn.addEventListener('click', () => this.pause());
        this.stopBtn.addEventListener('click', () => this.stop());
        this.resetBtn.addEventListener('click', () => this.reset());
        
        // Boutons de modification du temps
        document.querySelectorAll('.time-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const unit = btn.dataset.unit;
                const isPlus = btn.classList.contains('plus');
                this.updateTimeValue(unit, isPlus);
            });
        });

        // Raccourcis clavier
        document.addEventListener('keydown', (e) => {
            const interactiveTarget = e.target.closest(
                'input, textarea, select, button, [contenteditable="true"], [role="button"]'
            );
            if (e.code === 'Space' && !interactiveTarget) {
                e.preventDefault();
                if (this.isRunning) {
                    this.pause();
                } else {
                    this.start();
                }
            }
        });

        // Boutons de formatage du texte
        document.querySelectorAll('.format-btn').forEach(button => {
            button.addEventListener('click', () => {
                const command = button.getAttribute('data-command');
                if (!command) return;
                document.execCommand(command, false, null);

                // Réinitialiser l'état des boutons après un court délai
                setTimeout(() => {
                    document.querySelectorAll('.format-btn').forEach(btn => {
                        btn.classList.remove('active');
                    });
                }, 200);
            });
        });
    }
    
    updateTimeValue(unit, isPlus) {
        if (!this[`${unit}Value`]) return;
        
        const valueElement = this[`${unit}Value`];
        let value = parseInt(valueElement.textContent) || 0;
        
        if (isPlus) {
            if (unit === 'hours' && value < 23) value++;
            if (unit === 'minutes' && value < 59) value++;
            if (unit === 'seconds' && value < 59) value++;
        } else {
            if (value > 0) value--;
        }
        
        valueElement.textContent = String(value).padStart(2, '0');
    }
    
    start() {
        if (!this.isRunning) {
            // Vérifier s'il y a du temps configuré
            const inputTime = this.getInputTime();
            if (inputTime <= 0) {
                alert('Veuillez configurer un temps avant de démarrer le minuteur.');
                return;
            }
            
            if (!this.targetTime) {
                this.initialTime = inputTime;
                this.targetTime = Date.now() + this.initialTime * 1000;
            }
            
            this.isRunning = true;
            this.startBtn.disabled = true;
            this.pauseBtn.disabled = false;
            this.stopBtn.disabled = false;
            this.disableTimeControls(true);
            
            this.interval = setInterval(() => this.update(), 100);
        }
    }
    
    pause() {
        if (this.isRunning) {
            this.isRunning = false;
            this.startBtn.disabled = false;
            this.pauseBtn.disabled = true;
            this.stopBtn.disabled = false;
            this.disableTimeControls(false);
            clearInterval(this.interval);
            this.stopAlarm();
            this.display.classList.remove('alert');
            
            // Désactiver le feu de circulation si nécessaire
            if (window.trafficLight) {
                if (window.trafficLight.redLight.getAttribute('data-state') === 'active') {
                    window.trafficLight.setRedLightActive(false);
                } else if (window.trafficLight.yellowLight.getAttribute('data-state') === 'active') {
                    window.trafficLight.setYellowLightActive(false);
                } else if (window.trafficLight.greenLight.getAttribute('data-state') === 'active') {
                    window.trafficLight.setGreenLightActive(false);
                }
            }
        }
    }
    
    stop() {
        this.stopAlarm();
        this.display.classList.remove('alert');
        this.stopBtn.disabled = true;
    }
    
    reset() {
        // Pause d'abord
        this.isRunning = false;
        clearInterval(this.interval);
        this.stopAlarm();
        
        // Réinitialiser les valeurs et l'interface
        this.targetTime = 0;
        this.updateDisplay(0, 0, 0);
        this.display.style.setProperty('--progress', '100%');
        this.display.classList.remove('alert');
        
        // Réinitialiser les boutons
        this.startBtn.disabled = false;
        this.pauseBtn.disabled = true;
        this.stopBtn.disabled = true;
        this.disableTimeControls(false);
        
        // Réinitialiser les valeurs
        this.hoursValue.textContent = '00';
        this.minutesValue.textContent = '00';
        this.secondsValue.textContent = '00';
        
        // Désactiver tous les feux lors de la réinitialisation
        if (window.trafficLight) {
            window.trafficLight.setRedLightActive(false);
            window.trafficLight.setYellowLightActive(false);
            window.trafficLight.setGreenLightActive(false);
        }
    }
    
    disableTimeControls(disabled) {
        document.querySelectorAll('.time-btn').forEach(btn => {
            btn.disabled = disabled;
        });
    }
    
    getInputTime() {
        const hours = parseInt(this.hoursValue.textContent) || 0;
        const minutes = parseInt(this.minutesValue.textContent) || 0;
        const seconds = parseInt(this.secondsValue.textContent) || 0;
        
        return hours * 3600 + minutes * 60 + seconds;
    }
    
    update() {
        const now = Date.now();
        const remaining = Math.max(0, this.targetTime - now);
        const totalSeconds = Math.floor(remaining / 1000);
        
        if (totalSeconds === 0) {
            this.pause();
            this.updateDisplay(0, 0, 0);
            this.display.style.setProperty('--progress', '0%');
            this.display.classList.add('alert');
            this.playAlarm();
            this.stopBtn.disabled = false;
            
            // Ajout des confettis
            this.launchConfetti();
            return;
        }

        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;

        this.updateDisplay(hours, minutes, seconds);
        
        // Mise à jour de la progression de la bordure
        const progress = (remaining / (this.initialTime * 1000)) * 100;
        this.display.style.setProperty('--progress', `${progress}%`);
    }
    
    updateDisplay(hours, minutes, seconds) {
        this.display.innerHTML = `<span>${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}</span>`;
    }

    playAlarm() {
        if (!this.isAlarmPlaying && this.alarmSound) {
            this.isAlarmPlaying = true;
            try {
                this.alarmSound.loop = true;
                this.alarmSound.play().catch(e => console.error('Erreur de lecture audio:', e));

                // Arrêter l'alerte après 3 secondes
                setTimeout(() => {
                    this.stopAlarm();
                    this.alarmCount = 0;
                }, 3000);
            } catch (e) {
                console.error('Erreur lors de la lecture de l\'alarme:', e);
                this.isAlarmPlaying = false;
            }
        }
    }

    stopAlarm() {
        if (this.isAlarmPlaying && this.alarmSound) {
            this.isAlarmPlaying = false;
            try {
                this.alarmSound.pause();
                this.alarmSound.currentTime = 0;
            } catch (e) {
                console.error('Erreur lors de l\'arrêt de l\'alarme:', e);
            }
            this.display.classList.remove('alert');
        }
    }

    launchConfetti() {
        // Vérifier si la fonction confetti existe
        if (typeof confetti !== 'function') {
            return;
        }
        
        const duration = 3000;
        const end = Date.now() + duration;

        (function frame() {
            confetti({
                particleCount: 12,
                angle: 270,
                spread: 45,
                origin: { 
                    x: Math.random(),
                    y: 0
                },
                gravity: 1,
                ticks: 500,
                colors: ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#4CAF50'],
                scalar: 1.2,
                drift: 0,
                shapes: ['square', 'circle'],
                velocityY: 1
            });

            if (Date.now() < end) {
                requestAnimationFrame(frame);
            }
        }());
    }
}

/**
 * Classe TrafficLight - Gestion du feu tricolore pour les niveaux de bruit en classe
 */
class TrafficLight {
    constructor() {
        // Éléments DOM
        this.lights = document.querySelectorAll('.light');
        this.message = document.querySelector('.light-message');
        this.redLight = document.querySelector('.light.red');
        this.yellowLight = document.querySelector('.light.yellow');
        this.greenLight = document.querySelector('.light.green');
        
        // Créer l'élément d'explication s'il n'existe pas
        if (!document.querySelector('.light-explanation')) {
            const explanation = document.createElement('div');
            explanation.className = 'light-explanation';
            if (this.message && this.message.parentNode) {
                this.message.parentNode.insertBefore(explanation, this.message.nextSibling);
            }
        }
        
        this.explanation = document.querySelector('.light-explanation');
        
        // Initialiser l'explication
        if (this.explanation) {
            if (!this.isAnyLightActive()) {
                this.explanation.textContent = "Sélectionnez une lumière pour afficher les instructions";
                this.explanation.className = 'light-explanation';
                this.explanation.style.fontStyle = 'italic';
                this.explanation.style.opacity = '0.7';
            } else {
                this.updateExplanationBasedOnActiveLight();
            }
        }
        
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        if (!this.lights.length) return;
        
        this.lights.forEach(light => {
            light.addEventListener('click', () => this.toggleLight(light));
        });
    }

    toggleLight(clickedLight) {
        // Désactiver toutes les lumières
        this.lights.forEach(light => {
            light.setAttribute('data-state', 'inactive');
        });

        // Activer la lumière cliquée
        clickedLight.setAttribute('data-state', 'active');

        // Mettre à jour le message et l'explication
        if (clickedLight.classList.contains('red')) {
            this.message.textContent = 'Défense de parler';
            this.message.className = 'light-message red';
            this.showExplanation('red', 'Vous devez rester concentré sur votre tâche et travailler en silence. Aucune communication n\'est autorisée, même par gestes. C\'est un moment de travail individuel qui nécessite toute votre concentration.');
        } else if (clickedLight.classList.contains('yellow')) {
            this.message.textContent = 'Chuchotements autorisés';
            this.message.className = 'light-message yellow';
            this.showExplanation('yellow', 'Vous pouvez communiquer avec vos voisins à voix basse. Les échanges doivent être brefs et liés au travail en cours. Veillez à ne pas déranger les autres élèves qui travaillent.');
        } else if (clickedLight.classList.contains('green')) {
            this.message.textContent = 'Discussion autorisée';
            this.message.className = 'light-message green';
            this.showExplanation('green', 'Vous pouvez discuter librement avec vos camarades. Les échanges d\'idées et le travail collaboratif sont encouragés. Maintenez toutefois un volume sonore raisonnable pour le bon déroulement de la classe.');
        }
    }

    showExplanation(type, text) {
        if (!this.explanation) return;
        
        this.explanation.textContent = text;
        this.explanation.className = 'light-explanation ' + type;
        this.explanation.style.display = 'block';
        this.explanation.style.fontStyle = 'normal';
        this.explanation.style.opacity = '1';
        
        // Suppression de tout timer qui pourrait cacher l'explication
        if (this.explanationTimer) {
            clearTimeout(this.explanationTimer);
            this.explanationTimer = null;
        }
    }

    updateExplanationBasedOnActiveLight() {
        if (!this.explanation) return;
        
        if (this.redLight && this.redLight.getAttribute('data-state') === 'active') {
            this.showExplanation('red', 'Vous devez rester concentré sur votre tâche et travailler en silence. Aucune communication n\'est autorisée, même par gestes. C\'est un moment de travail individuel qui nécessite toute votre concentration.');
        } else if (this.yellowLight && this.yellowLight.getAttribute('data-state') === 'active') {
            this.showExplanation('yellow', 'Vous pouvez communiquer avec vos voisins à voix basse. Les échanges doivent être brefs et liés au travail en cours. Veillez à ne pas déranger les autres élèves qui travaillent.');
        } else if (this.greenLight && this.greenLight.getAttribute('data-state') === 'active') {
            this.showExplanation('green', 'Vous pouvez discuter librement avec vos camarades. Les échanges d\'idées et le travail collaboratif sont encouragés. Maintenez toutefois un volume sonore raisonnable pour le bon déroulement de la classe.');
        } else {
            // État par défaut si aucune lumière n'est active
            this.explanation.textContent = "Sélectionnez une lumière pour afficher les instructions";
            this.explanation.className = 'light-explanation';
            this.explanation.style.fontStyle = 'italic';
            this.explanation.style.opacity = '0.7';
        }
    }

    isAnyLightActive() {
        return (this.redLight && this.redLight.getAttribute('data-state') === 'active') ||
               (this.yellowLight && this.yellowLight.getAttribute('data-state') === 'active') ||
               (this.greenLight && this.greenLight.getAttribute('data-state') === 'active');
    }

    setRedLightActive(isActive) {
        if (!this.redLight || !this.message) return;
        
        if (isActive) {
            this.redLight.setAttribute('data-state', 'active');
            this.message.textContent = 'Défense de parler';
            this.message.className = 'light-message red';
            this.showExplanation('red', 'Vous devez rester concentré sur votre tâche et travailler en silence. Aucune communication n\'est autorisée, même par gestes. C\'est un moment de travail individuel qui nécessite toute votre concentration.');
        } else {
            this.redLight.setAttribute('data-state', 'inactive');
            if (this.message.className === 'light-message red') {
                this.message.textContent = 'Cliquez sur une lumière';
                this.message.className = 'light-message';
                this.updateExplanationBasedOnActiveLight();
            }
        }
    }

    setYellowLightActive(isActive) {
        if (!this.yellowLight || !this.message) return;
        
        if (isActive) {
            this.yellowLight.setAttribute('data-state', 'active');
            this.message.textContent = 'Chuchotements autorisés';
            this.message.className = 'light-message yellow';
            this.showExplanation('yellow', 'Vous pouvez communiquer avec vos voisins à voix basse. Les échanges doivent être brefs et liés au travail en cours. Veillez à ne pas déranger les autres élèves qui travaillent.');
        } else {
            this.yellowLight.setAttribute('data-state', 'inactive');
            if (this.message.className === 'light-message yellow') {
                this.message.textContent = 'Cliquez sur une lumière';
                this.message.className = 'light-message';
                this.updateExplanationBasedOnActiveLight();
            }
        }
    }

    setGreenLightActive(isActive) {
        if (!this.greenLight || !this.message) return;
        
        if (isActive) {
            this.greenLight.setAttribute('data-state', 'active');
            this.message.textContent = 'Discussion autorisée';
            this.message.className = 'light-message green';
            this.showExplanation('green', 'Vous pouvez discuter librement avec vos camarades. Les échanges d\'idées et le travail collaboratif sont encouragés. Maintenez toutefois un volume sonore raisonnable pour le bon déroulement de la classe.');
        } else {
            this.greenLight.setAttribute('data-state', 'inactive');
            if (this.message.className === 'light-message green') {
                this.message.textContent = 'Cliquez sur une lumière';
                this.message.className = 'light-message';
                this.updateExplanationBasedOnActiveLight();
            }
        }
    }
}

/**
 * Fonction pour mettre à jour la date du jour
 */
function getSiteLang() {
    return (localStorage.getItem('site_lang') || localStorage.getItem('kanban_lang') || 'fr') === 'en' ? 'en' : 'fr';
}

function getSiteLocale() {
    return getSiteLang() === 'en' ? 'en-US' : 'fr-FR';
}

function i18nLabel(frText, enText) {
    return getSiteLang() === 'en' ? enText : frText;
}

function updateDate() {
    const dateElement = document.querySelector('.current-date span');
    if (!dateElement) return;
    
    const date = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    
    try {
        const dateString = date.toLocaleDateString(getSiteLocale(), options);
        dateElement.textContent = dateString;
    } catch (e) {
        // Fallback si le formatage ne fonctionne pas
        dateElement.textContent = date.toDateString();
    }
}

/**
 * Échappe les caractères HTML pour prévenir les injections XSS.
 */
function escapeHTML(str) {
    const div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
}

/**
 * Convertit un code météo WMO (Open-Meteo) en icône Font Awesome et description française.
 * Référence : https://open-meteo.com/en/docs#weathervariables
 */
function interpretWeatherCode(code, isDay) {
    const night = !isDay;
    if (code === 0) return { icon: night ? 'moon' : 'sun', description: 'Ciel dégagé' };
    if (code <= 2) return { icon: night ? 'cloud-moon' : 'cloud-sun', description: 'Partiellement nuageux' };
    if (code === 3) return { icon: 'cloud', description: 'Ciel couvert' };
    if (code <= 49) return { icon: 'smog', description: 'Brouillard' };
    if (code <= 59) return { icon: 'cloud-drizzle', description: 'Bruine' };
    if (code <= 69) return { icon: 'cloud-rain', description: 'Pluie' };
    if (code <= 79) return { icon: 'snowflake', description: 'Neige' };
    if (code <= 84) return { icon: 'cloud-showers-heavy', description: 'Averses' };
    if (code <= 86) return { icon: 'snowflake', description: 'Averses de neige' };
    if (code <= 99) return { icon: 'bolt', description: 'Orage' };
    return { icon: 'cloud', description: 'Conditions variables' };
}

/**
 * Affiche la météo dans le widget à partir de coordonnées et d'un nom de ville.
 */
function displayWeather(weatherLine, city, latitude, longitude) {
    return fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weathercode,is_day&timezone=auto`)
        .then(response => {
            if (!response.ok) throw new Error('Erreur Open-Meteo: ' + response.status);
            return response.json();
        })
        .then(data => {
            const current = data.current;
            const temp = Math.round(current.temperature_2m);
            const isDay = current.is_day === 1;
            const { icon, description } = interpretWeatherCode(current.weathercode, isDay);

            const safeCity = escapeHTML(String(city));
            const safeIcon = escapeHTML(String(icon));
            const safeDescription = escapeHTML(String(description));

            weatherLine.innerHTML = `
                <i class="fas fa-${safeIcon}"></i>
                <span>${safeCity}, ${temp}°C</span>
                <small style="display:block;font-size:70%;opacity:0.7">${safeDescription}</small>
            `;

            localStorage.setItem('lastWeather', JSON.stringify({
                city, temp, icon, description, timestamp: Date.now()
            }));
        });
}

/**
 * Obtient le nom de la ville à partir de coordonnées (géocodage inversé OpenStreetMap).
 */
function getCityFromCoordinates(latitude, longitude) {
    return fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10&accept-language=${getSiteLang()}`)
        .then(response => {
            if (!response.ok) throw new Error('Erreur Nominatim: ' + response.status);
            return response.json();
        })
        .then(data => {
            if (data && data.address) {
                return data.address.city ||
                       data.address.town ||
                       data.address.village ||
                       data.address.municipality ||
                       data.address.county ||
                       data.address.state ||
                       'Localisation inconnue';
            }
            return 'Localisation inconnue';
        })
        .catch(() => 'Localisation inconnue');
}

/**
 * Fonction pour obtenir la météo réelle via Open-Meteo.
 */
function getWeather() {
    const weatherLine = document.querySelector('.weather-line');
    if (!weatherLine) return;

    weatherLine.innerHTML = `
        <i class="fas fa-spinner fa-spin"></i>
        <span>Météo en cours...</span>
    `;

    // Géolocalisation du navigateur
    function tryGeolocation() {
        if (!navigator.geolocation) {
            tryIPGeolocation();
            return;
        }

        const geoTimeout = setTimeout(tryIPGeolocation, 8000);

        navigator.geolocation.getCurrentPosition(
            async function(position) {
                clearTimeout(geoTimeout);
                const { latitude, longitude } = position.coords;
                try {
                    const city = await getCityFromCoordinates(latitude, longitude);
                    await displayWeather(weatherLine, city, latitude, longitude);
                    localStorage.setItem('userLocation', JSON.stringify({
                        city, coords: { lat: latitude, lon: longitude },
                        manuallySet: false, source: 'navigator'
                    }));
                } catch (error) {
                    console.error('Erreur météo (géolocalisation):', error);
                    tryIPGeolocation();
                }
            },
            function(error) {
                clearTimeout(geoTimeout);
                console.error('Géolocalisation refusée ou échouée:', error);
                tryIPGeolocation();
            },
            { enableHighAccuracy: false, timeout: 10000, maximumAge: 30 * 60 * 1000 }
        );
    }

    // Fallback : géolocalisation par IP (ipinfo.io)
    function tryIPGeolocation() {
        fetch('https://ipinfo.io/json')
            .then(response => {
                if (!response.ok) throw new Error('Erreur ipinfo: ' + response.status);
                return response.json();
            })
            .then(async data => {
                if (!data.city || !data.loc) throw new Error('Données IP incomplètes');
                const [latitude, longitude] = data.loc.split(',').map(parseFloat);
                await displayWeather(weatherLine, data.city, latitude, longitude);
                localStorage.setItem('userLocation', JSON.stringify({
                    city: data.city, country: data.country,
                    coords: { lat: latitude, lon: longitude },
                    manuallySet: false, source: 'ip'
                }));
            })
            .catch(error => {
                console.error('Erreur géolocalisation IP:', error);
                weatherLine.innerHTML = `<i class="fas fa-triangle-exclamation"></i><span>Météo indisponible</span>`;
            });
    }

    // Vérifier s'il y a une localisation connue avec coordonnées
    const savedLocation = localStorage.getItem('userLocation');
    if (savedLocation) {
        try {
            const loc = JSON.parse(savedLocation);
            if (loc.coords && loc.city) {
                displayWeather(weatherLine, loc.city, loc.coords.lat, loc.coords.lon)
                    .catch(() => tryGeolocation());
                return;
            }
        } catch (e) {
            console.error('Erreur lecture localisation sauvegardée:', e);
        }
    }

    tryGeolocation();
}

/**
 * Fonction pour initialiser la météo
 */
function initWeather() {
    const weatherLine = document.querySelector('.weather-line');
    if (!weatherLine) return;

    // Option clic droit : réinitialiser la localisation (une seule fois à l'init)
    weatherLine.addEventListener('contextmenu', function(e) {
        e.preventDefault();
        if (confirm('Voulez-vous réinitialiser votre localisation ?')) {
            localStorage.removeItem('userLocation');
            localStorage.removeItem('lastWeather');
            window.location.reload();
        }
    });

    // Invalider les localisations sauvegardées sans coordonnées (ancien format)
    const savedLoc = localStorage.getItem('userLocation');
    if (savedLoc) {
        try {
            const loc = JSON.parse(savedLoc);
            if (!loc.coords) localStorage.removeItem('userLocation');
        } catch (e) {
            localStorage.removeItem('userLocation');
        }
    }

    // Vérifier si des données météo récentes sont en cache (moins de 30 min)
    const lastWeather = localStorage.getItem('lastWeather');
    if (lastWeather) {
        try {
            const weatherData = JSON.parse(lastWeather);
            if (Date.now() - weatherData.timestamp < 30 * 60 * 1000) {
                const safeCity = escapeHTML(String(weatherData.city));
                const safeIcon = escapeHTML(String(weatherData.icon));
                const safeDesc = weatherData.description ? escapeHTML(String(weatherData.description)) : '';

                weatherLine.innerHTML = `
                    <i class="fas fa-${safeIcon}"></i>
                    <span>${safeCity}, ${weatherData.temp}°C</span>
                    ${safeDesc ? `<small style="display:block;font-size:70%;opacity:0.7">${safeDesc}</small>` : ''}
                `;
                return;
            }
        } catch (e) {
            console.error('Erreur avec les données météo en cache:', e);
        }
    }
    
    // Charger les données météo
    getWeather();
    
    // Ajouter un événement pour rafraîchir lors d'un clic
    weatherLine.style.cursor = 'pointer';
    weatherLine.addEventListener('click', getWeather);
    
    // Mettre à jour la météo automatiquement toutes les 30 minutes
    setInterval(getWeather, 30 * 60 * 1000);
}

/**
 * Fonction pour initialiser la section horloge
 */
function initClockSection() {
    const clockSection = document.querySelector('.clock-section');
    const clockContent = document.getElementById('clockContent');
    const clockToggleBtn = document.getElementById('clockToggleBtn');
    const clockDisplay = document.getElementById('clockDisplay');
    const clockAnalog = document.getElementById('clockAnalog');
    const clockTicks = document.getElementById('clockTicks');
    const clockNumbers = document.getElementById('clockNumbers');
    const clockHourHand = document.getElementById('clockHourHand');
    const clockMinuteHand = document.getElementById('clockMinuteHand');
    const clockSecondHand = document.getElementById('clockSecondHand');
    if (!clockDisplay) return;

    function buildClockFace() {
        if (!clockTicks || !clockNumbers) return;
        if (clockTicks.childElementCount || clockNumbers.childElementCount) return;

        for (let i = 0; i < 60; i++) {
            const angle = (i * 6) - 90;
            const rad = angle * Math.PI / 180;
            const x = 50 + Math.cos(rad) * 47.5;
            const y = 50 + Math.sin(rad) * 47.5;

            const tick = document.createElement('span');
            tick.className = i % 5 === 0 ? 'clock-tick hour' : 'clock-tick';
            tick.style.left = `${x}%`;
            tick.style.top = `${y}%`;
            tick.style.transform = `translate(-50%, -50%) rotate(${angle + 90}deg)`;
            clockTicks.appendChild(tick);
        }

        for (let i = 1; i <= 12; i++) {
            const angle = (i * 30) - 90;
            const rad = angle * Math.PI / 180;
            const x = 50 + Math.cos(rad) * 39.5;
            const y = 50 + Math.sin(rad) * 39.5;

            const number = document.createElement('span');
            number.className = 'clock-number';
            number.textContent = i;
            number.style.left = `${x}%`;
            number.style.top = `${y}%`;
            clockNumbers.appendChild(number);
        }
    }

    function updateClock() {
        const now = new Date();
        const hours = now.getHours();
        const minutes = now.getMinutes();
        const seconds = now.getSeconds();
        const formattedTime = now.toLocaleTimeString(getSiteLocale(), {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
        const usesMeridiem = /\b(?:AM|PM)\b/i.test(formattedTime);

        clockDisplay.textContent = formattedTime;
        clockDisplay.classList.toggle('clock-display-compact', usesMeridiem);

        if (clockHourHand && clockMinuteHand && clockSecondHand) {
            const hourDeg = ((hours % 12) + minutes / 60 + seconds / 3600) * 30;
            const minuteDeg = (minutes + seconds / 60) * 6;
            const secondDeg = seconds * 6;

            clockHourHand.style.transform = `translateX(-50%) rotate(${hourDeg}deg)`;
            clockMinuteHand.style.transform = `translateX(-50%) rotate(${minuteDeg}deg)`;
            clockSecondHand.style.transform = `translateX(-50%) rotate(${secondDeg}deg)`;
        }
    }

    function setClockMode(mode) {
        if (!clockContent) return;
        const showAnalog = mode === 'analog';
        clockContent.classList.toggle('is-analog', showAnalog);
    }

    function setClockCollapsed(collapsed) {
        if (!clockSection || !clockContent || !clockToggleBtn) return;

        const icon = clockToggleBtn.querySelector('i');
        clockSection.classList.toggle('is-collapsed', collapsed);
        clockContent.hidden = collapsed;
        clockToggleBtn.setAttribute('aria-expanded', String(!collapsed));

        const label = collapsed
            ? i18nLabel("Déplier l'horloge", 'Expand clock')
            : i18nLabel("Replier l'horloge", 'Collapse clock');
        clockToggleBtn.setAttribute('aria-label', label);
        clockToggleBtn.setAttribute('title', label);

        if (icon) {
            icon.classList.toggle('fa-chevron-down', collapsed);
            icon.classList.toggle('fa-chevron-up', !collapsed);
        }
    }

    if (clockToggleBtn) {
        clockToggleBtn.addEventListener('click', () => {
            const isCollapsed = clockSection && clockSection.classList.contains('is-collapsed');
            setClockCollapsed(!isCollapsed);
        });
    }

    if (clockDisplay && clockAnalog) {
        const switchToAnalog = () => setClockMode('analog');
        const switchToDigital = () => setClockMode('digital');

        clockDisplay.addEventListener('click', switchToAnalog);
        clockAnalog.addEventListener('click', switchToDigital);

        clockDisplay.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                switchToAnalog();
            }
        });

        clockAnalog.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                switchToDigital();
            }
        });
    }

    setClockCollapsed(false);
    setClockMode('digital');
    buildClockFace();
    updateClock();
    setInterval(updateClock, 1000);

    document.addEventListener('siteLanguageChanged', () => {
        updateClock();
        const isCollapsed = clockSection && clockSection.classList.contains('is-collapsed');
        setClockCollapsed(Boolean(isCollapsed));
    });
}

/**
 * Fonction pour initialiser la sauvegarde des notes
 */
function initNotesArea() {
    const notesSection = document.querySelector('.notes-section');
    const notesContent = document.getElementById('notesContent');
    const notesToggleBtn = document.getElementById('notesToggleBtn');
    const notesArea = document.querySelector('.notes-area');
    const saveIndicator = document.querySelector('.save-indicator');

    function setNotesCollapsed(collapsed) {
        if (!notesSection || !notesContent || !notesToggleBtn) return;

        const icon = notesToggleBtn.querySelector('i');
        notesSection.classList.toggle('is-collapsed', collapsed);
        notesContent.hidden = collapsed;
        notesToggleBtn.setAttribute('aria-expanded', String(!collapsed));

        const label = collapsed
            ? i18nLabel('Déplier les notes', 'Expand notes')
            : i18nLabel('Replier les notes', 'Collapse notes');
        notesToggleBtn.setAttribute('aria-label', label);
        notesToggleBtn.setAttribute('title', label);

        if (icon) {
            icon.classList.toggle('fa-chevron-down', collapsed);
            icon.classList.toggle('fa-chevron-up', !collapsed);
        }
    }

    if (notesToggleBtn) {
        notesToggleBtn.addEventListener('click', () => {
            const isCollapsed = notesSection && notesSection.classList.contains('is-collapsed');
            setNotesCollapsed(!isCollapsed);
        });
    }

    setNotesCollapsed(false);
    if (!notesArea) return;

    document.addEventListener('siteLanguageChanged', () => {
        const isCollapsed = notesSection && notesSection.classList.contains('is-collapsed');
        setNotesCollapsed(Boolean(isCollapsed));
    });
    
    let saveTimeout;
    
    // Événement pour sauvegarder automatiquement les notes
    notesArea.addEventListener('input', function() {
        clearTimeout(saveTimeout);
        
        if (saveIndicator) saveIndicator.classList.add('visible');
        
        saveTimeout = setTimeout(() => {
            localStorage.setItem('dashboardNotes', notesArea.innerHTML);
            
            if (saveIndicator) {
                setTimeout(() => {
                    saveIndicator.classList.remove('visible');
                }, 2000);
            }
        }, 1000);
    });
    
    // Charger les notes sauvegardées
    const savedNotes = localStorage.getItem('dashboardNotes');
    if (savedNotes) {
        notesArea.innerHTML = savedNotes;
    }
}

/**
 * Fonction pour initialiser la section rappels
 */
function initReminders() {
    const remindersSection = document.querySelector('.reminders-section');
    const remindersContent = document.getElementById('remindersContent');
    const remindersToggleBtn = document.getElementById('remindersToggleBtn');
    const reminderForm = document.getElementById('reminderForm');
    const reminderInput = document.getElementById('reminderInput');
    const remindersList = document.getElementById('remindersList');
    const reminderTimers = new Map();

    function setRemindersCollapsed(collapsed) {
        if (!remindersSection || !remindersContent || !remindersToggleBtn) return;

        const icon = remindersToggleBtn.querySelector('i');
        remindersSection.classList.toggle('is-collapsed', collapsed);
        remindersContent.hidden = collapsed;
        remindersToggleBtn.setAttribute('aria-expanded', String(!collapsed));

        const label = collapsed
            ? i18nLabel('Déplier les rappels', 'Expand reminders')
            : i18nLabel('Replier les rappels', 'Collapse reminders');
        remindersToggleBtn.setAttribute('aria-label', label);
        remindersToggleBtn.setAttribute('title', label);

        if (icon) {
            icon.classList.toggle('fa-chevron-down', collapsed);
            icon.classList.toggle('fa-chevron-up', !collapsed);
        }
    }

    if (remindersToggleBtn) {
        remindersToggleBtn.addEventListener('click', () => {
            const isCollapsed = remindersSection && remindersSection.classList.contains('is-collapsed');
            setRemindersCollapsed(!isCollapsed);
        });
    }

    setRemindersCollapsed(false);
    if (!reminderForm || !reminderInput || !remindersList) return;

    document.addEventListener('siteLanguageChanged', () => {
        const isCollapsed = remindersSection && remindersSection.classList.contains('is-collapsed');
        setRemindersCollapsed(Boolean(isCollapsed));
    });

    const storageKey = 'dashboardReminders';
    let reminders = loadReminders();
    const toastHost = createReminderToastHost();
    const reminderDialog = createReminderDialog();
    const reminderChimeSrc = 'boutons-sons/bell.mp3';

    function createReminderToastHost() {
        const host = document.createElement('div');
        host.className = 'reminder-toast-host';
        host.setAttribute('aria-live', 'assertive');
        host.setAttribute('aria-atomic', 'true');
        document.body.appendChild(host);
        return host;
    }

    function createReminderDialog() {
        const backdrop = document.createElement('div');
        backdrop.className = 'reminder-dialog-backdrop';
        backdrop.hidden = true;

        const dialog = document.createElement('div');
        dialog.className = 'reminder-dialog';
        dialog.setAttribute('role', 'dialog');
        dialog.setAttribute('aria-modal', 'true');
        dialog.setAttribute('aria-labelledby', 'reminderDialogTitle');

        const closeBtn = document.createElement('button');
        closeBtn.type = 'button';
        closeBtn.className = 'reminder-dialog-close';
        closeBtn.setAttribute('aria-label', i18nLabel('Fermer', 'Close'));
        closeBtn.title = i18nLabel('Fermer', 'Close');
        closeBtn.innerHTML = '<i class="fas fa-xmark" aria-hidden="true"></i>';

        const header = document.createElement('div');
        header.className = 'reminder-dialog-header';

        const title = document.createElement('h3');
        title.id = 'reminderDialogTitle';
        title.textContent = i18nLabel('Rappel', 'Reminder');

        const text = document.createElement('p');
        text.className = 'reminder-dialog-text';

        header.appendChild(title);
        header.appendChild(text);

        const form = document.createElement('form');
        form.className = 'reminder-dialog-form';

        const label = document.createElement('label');
        label.className = 'reminder-dialog-label';
        label.setAttribute('for', 'reminderDelaySelect');
        label.textContent = i18nLabel('Dans', 'In');

        const select = document.createElement('select');
        select.id = 'reminderDelaySelect';
        select.className = 'reminder-dialog-select';

        const delayOptions = [1, 2, 5, 10, 15, 20, 30, 45, 60, 90];
        delayOptions.forEach((minutes) => {
            const option = document.createElement('option');
            option.value = String(minutes);
            option.textContent = i18nLabel(
                minutes === 1 ? '1 minute' : `${minutes} minutes`,
                minutes === 1 ? '1 minute' : `${minutes} minutes`
            );
            select.appendChild(option);
        });

        const actions = document.createElement('div');
        actions.className = 'reminder-dialog-actions';

        const cancelBtn = document.createElement('button');
        cancelBtn.type = 'button';
        cancelBtn.className = 'reminder-dialog-btn reminder-dialog-btn-secondary';
        cancelBtn.textContent = i18nLabel('Annuler', 'Cancel');

        const saveBtn = document.createElement('button');
        saveBtn.type = 'submit';
        saveBtn.className = 'reminder-dialog-btn reminder-dialog-btn-primary';
        saveBtn.textContent = i18nLabel('Valider', 'Save');

        actions.appendChild(cancelBtn);
        actions.appendChild(saveBtn);
        form.appendChild(label);
        form.appendChild(select);
        form.appendChild(actions);

        dialog.appendChild(closeBtn);
        dialog.appendChild(header);
        dialog.appendChild(form);
        backdrop.appendChild(dialog);

        document.body.appendChild(backdrop);

        const api = {
            backdrop,
            dialog,
            form,
            text,
            select,
            closeBtn,
            cancelBtn,
            reminderId: null
        };

        const hideDialog = () => {
            api.backdrop.classList.remove('is-visible');
            window.setTimeout(() => {
                api.backdrop.hidden = true;
                api.reminderId = null;
            }, 180);
        };

        api.hide = hideDialog;

        closeBtn.addEventListener('click', hideDialog);
        cancelBtn.addEventListener('click', hideDialog);
        backdrop.addEventListener('click', (event) => {
            if (event.target === backdrop) {
                hideDialog();
            }
        });
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && !backdrop.hidden) {
                hideDialog();
            }
        });

        return api;
    }

    function loadReminders() {
        const raw = localStorage.getItem(storageKey);
        if (!raw) return [];

        try {
            const parsed = JSON.parse(raw);
            if (!Array.isArray(parsed)) return [];

            return parsed
                .filter(item => item && typeof item.text === 'string' && item.text.trim())
                .map(item => ({
                    id: String(item.id || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`),
                    text: item.text.trim(),
                    done: Boolean(item.done),
                    alertAt: Number.isFinite(Number(item.alertAt)) ? Number(item.alertAt) : null,
                    alertTriggered: Boolean(item.alertTriggered)
                }));
        } catch (e) {
            console.error('Erreur lecture rappels:', e);
            return [];
        }
    }

    function saveReminders() {
        localStorage.setItem(storageKey, JSON.stringify(reminders));
    }

    function clearReminderTimer(reminderId) {
        const timerId = reminderTimers.get(reminderId);
        if (timerId) {
            window.clearTimeout(timerId);
            reminderTimers.delete(reminderId);
        }
    }

    function playReminderChime() {
        try {
            const chime = new Audio(reminderChimeSrc);
            chime.loop = false;
            chime.preload = 'auto';
            chime.volume = 0.35;
            chime.play().catch(() => {});
            window.setTimeout(() => {
                try {
                    chime.pause();
                    chime.currentTime = 0;
                } catch (e) {
                    console.error('Erreur arrêt son rappel:', e);
                }
            }, 2400);
        } catch (e) {
            console.error('Erreur lecture son rappel:', e);
        }
    }

    function showReminderToast(reminderText) {
        toastHost.innerHTML = '';

        const toast = document.createElement('div');
        toast.className = 'reminder-toast';

        const icon = document.createElement('i');
        icon.className = 'fas fa-bell reminder-toast-icon';
        icon.setAttribute('aria-hidden', 'true');

        const copy = document.createElement('div');
        copy.className = 'reminder-toast-copy';

        const title = document.createElement('strong');
        title.textContent = i18nLabel('Rappel', 'Reminder');

        const message = document.createElement('p');
        message.textContent = reminderText;

        const closeBtn = document.createElement('button');
        closeBtn.type = 'button';
        closeBtn.className = 'reminder-toast-close';
        closeBtn.setAttribute('aria-label', i18nLabel('Fermer le rappel', 'Dismiss reminder'));
        closeBtn.title = i18nLabel('Fermer', 'Dismiss');
        closeBtn.innerHTML = '<i class="fas fa-xmark" aria-hidden="true"></i>';

        copy.appendChild(title);
        copy.appendChild(message);
        toast.appendChild(icon);
        toast.appendChild(copy);
        toast.appendChild(closeBtn);
        toastHost.appendChild(toast);

        const dismiss = () => {
            toast.classList.remove('is-visible');
            window.setTimeout(() => {
                if (toast.parentNode) {
                    toast.remove();
                }
            }, 220);
        };

        closeBtn.addEventListener('click', dismiss);
        window.setTimeout(() => toast.classList.add('is-visible'), 10);
        window.setTimeout(dismiss, 14000);
    }

    function formatAlertTime(alertAt) {
        if (!alertAt || alertAt <= Date.now()) {
            return i18nLabel('Maintenant', 'Now');
        }

        const deltaMinutes = Math.max(1, Math.round((alertAt - Date.now()) / 60000));
        if (deltaMinutes < 60) {
            return i18nLabel(`Dans ${deltaMinutes} min`, `In ${deltaMinutes} min`);
        }

        try {
            return new Date(alertAt).toLocaleTimeString(getSiteLocale(), {
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (e) {
            return i18nLabel('Plus tard', 'Later');
        }
    }

    function triggerReminderAlarm(reminderId) {
        clearReminderTimer(reminderId);

        const reminder = reminders.find(item => item.id === reminderId);
        if (!reminder || reminder.done) return;

        reminder.alertTriggered = true;
        reminder.alertAt = null;
        saveReminders();
        renderReminders();
        playReminderChime();
        showReminderToast(i18nLabel(`Pense à : ${reminder.text}`, `Remember to: ${reminder.text}`));
    }

    function scheduleReminderAlarm(reminder) {
        clearReminderTimer(reminder.id);

        if (!reminder.alertAt || reminder.done || reminder.alertTriggered) return;

        const delay = reminder.alertAt - Date.now();
        if (delay <= 0) {
            triggerReminderAlarm(reminder.id);
            return;
        }

        const timerId = window.setTimeout(() => triggerReminderAlarm(reminder.id), delay);
        reminderTimers.set(reminder.id, timerId);
    }

    function syncReminderAlarms() {
        const validIds = new Set(reminders.map(reminder => reminder.id));

        [...reminderTimers.keys()].forEach(id => {
            if (!validIds.has(id)) {
                clearReminderTimer(id);
            }
        });

        reminders.forEach(scheduleReminderAlarm);
    }

    function openReminderDelayDialog(reminder) {
        const presetValues = [1, 2, 5, 10, 15, 20, 30, 45, 60, 90];
        const currentDelay = reminder.alertAt && reminder.alertAt > Date.now()
            ? Math.max(1, Math.round((reminder.alertAt - Date.now()) / 60000))
            : 5;
        const nearestDelay = presetValues.reduce((closest, value) => {
            return Math.abs(value - currentDelay) < Math.abs(closest - currentDelay) ? value : closest;
        }, presetValues[0]);

        reminderDialog.reminderId = reminder.id;
        reminderDialog.text.textContent = '';
        reminderDialog.select.value = String(nearestDelay);
        reminderDialog.backdrop.hidden = false;

        requestAnimationFrame(() => {
            reminderDialog.backdrop.classList.add('is-visible');
            reminderDialog.select.focus();
        });
    }

    function renderReminders() {
        remindersList.innerHTML = '';

        if (!reminders.length) {
            const emptyItem = document.createElement('li');
            emptyItem.className = 'reminders-empty';
            emptyItem.textContent = 'Aucun rappel pour le moment.';
            remindersList.appendChild(emptyItem);
            return;
        }

        reminders.forEach(reminder => {
            const item = document.createElement('li');
            item.className = 'reminder-item';
            if (reminder.done) item.classList.add('done');
            item.dataset.id = reminder.id;

            const label = document.createElement('label');
            label.className = 'reminder-label';

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.className = 'reminder-checkbox';
            checkbox.dataset.id = reminder.id;
            checkbox.checked = reminder.done;

            const text = document.createElement('span');
            text.className = 'reminder-text';
            text.textContent = reminder.text;

            const actions = document.createElement('div');
            actions.className = 'reminder-actions';

            const alertBtn = document.createElement('button');
            alertBtn.type = 'button';
            alertBtn.className = 'reminder-alert-btn';
            alertBtn.dataset.id = reminder.id;
            alertBtn.title = reminder.alertAt
                ? i18nLabel('Annuler le rappel programmé', 'Cancel scheduled reminder')
                : i18nLabel('Programmer un rappel', 'Schedule a reminder');
            alertBtn.setAttribute('aria-label', alertBtn.title);
            if (reminder.alertAt) {
                alertBtn.classList.add('is-active');
            }
            alertBtn.innerHTML = '<i class="fas fa-bell" aria-hidden="true"></i>';

            const deleteBtn = document.createElement('button');
            deleteBtn.type = 'button';
            deleteBtn.className = 'reminder-delete-btn';
            deleteBtn.dataset.id = reminder.id;
            deleteBtn.setAttribute('aria-label', `Supprimer le rappel: ${reminder.text}`);
            deleteBtn.title = 'Supprimer';
            deleteBtn.innerHTML = '<i class="fas fa-trash" aria-hidden="true"></i>';

            actions.appendChild(alertBtn);
            actions.appendChild(deleteBtn);
            label.appendChild(checkbox);
            label.appendChild(text);
            item.appendChild(label);
            item.appendChild(actions);

            if (reminder.alertAt && !reminder.done) {
                const meta = document.createElement('span');
                meta.className = 'reminder-alert-meta';
                meta.textContent = i18nLabel(
                    `Rappel ${formatAlertTime(reminder.alertAt).toLowerCase()}`,
                    `Reminder ${formatAlertTime(reminder.alertAt).toLowerCase()}`
                );
                item.appendChild(meta);
            }

            remindersList.appendChild(item);
        });
    }

    reminderForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const text = reminderInput.value.trim().replace(/\s+/g, ' ');
        if (!text) return;

        reminders.unshift({
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            text,
            done: false,
            alertAt: null,
            alertTriggered: false
        });

        saveReminders();
        renderReminders();
        reminderInput.value = '';
        reminderInput.focus();
    });

    remindersList.addEventListener('change', function(e) {
        const checkbox = e.target.closest('.reminder-checkbox');
        if (!checkbox) return;

        reminders = reminders.map(reminder => {
            if (reminder.id !== checkbox.dataset.id) return reminder;
            if (checkbox.checked) {
                clearReminderTimer(reminder.id);
            }
            return {
                ...reminder,
                done: checkbox.checked,
                alertAt: checkbox.checked ? null : reminder.alertAt,
                alertTriggered: checkbox.checked ? false : reminder.alertTriggered
            };
        });

        saveReminders();
        renderReminders();
        syncReminderAlarms();
    });

    remindersList.addEventListener('click', function(e) {
        const alertBtn = e.target.closest('.reminder-alert-btn');
        if (alertBtn) {
            const reminder = reminders.find(item => item.id === alertBtn.dataset.id);
            if (!reminder) return;

            if (reminder.alertAt) {
                clearReminderTimer(reminder.id);
                reminders = reminders.map(item => item.id === reminder.id
                    ? { ...item, alertAt: null, alertTriggered: false }
                    : item
                );
                saveReminders();
                renderReminders();
                return;
            }

            openReminderDelayDialog(reminder);
            return;
        }

        const deleteBtn = e.target.closest('.reminder-delete-btn');
        if (!deleteBtn) return;

        clearReminderTimer(deleteBtn.dataset.id);
        reminders = reminders.filter(reminder => reminder.id !== deleteBtn.dataset.id);
        saveReminders();
        renderReminders();
    });

    if (reminderDialog && reminderDialog.form) {
        reminderDialog.form.addEventListener('submit', (event) => {
        event.preventDefault();

        const reminderId = reminderDialog.reminderId;
        if (!reminderId) {
            reminderDialog.hide();
            return;
        }

        const minutes = Number.parseInt(reminderDialog.select.value, 10);
        if (!Number.isFinite(minutes) || minutes <= 0) {
            return;
        }

        reminders = reminders.map(item => item.id === reminderId
            ? {
                ...item,
                alertAt: Date.now() + minutes * 60 * 1000,
                alertTriggered: false
            }
            : item
        );

        saveReminders();
        renderReminders();
        syncReminderAlarms();
        reminderDialog.hide();
        });
    }

    renderReminders();
    syncReminderAlarms();
}

/**
 * Fonction d'initialisation principale
 */
function initDashboard() {
    // Mettre à jour la date
    updateDate();
    document.addEventListener('siteLanguageChanged', updateDate);

    // Initialiser l'horloge repliable
    initClockSection();
    
    // Initialiser la météo
    initWeather();
    
    // Initialiser la zone de notes
    initNotesArea();

    // Initialiser les rappels
    initReminders();
    
    // Mettre à jour l'année dans le pied de page (si élément existe)
    const anneeEl = document.querySelector(".annee");
    if (anneeEl) {
        anneeEl.textContent = new Date().getFullYear();
    }
    
    // Créer les instances des classes principales
    window.timer = new Timer();
    window.trafficLight = new TrafficLight();
}

// Exécuter l'initialisation au chargement du DOM
document.addEventListener('DOMContentLoaded', initDashboard);
