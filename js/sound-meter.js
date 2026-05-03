class SoundMeter {
    constructor() {
        this.audioContext = null;
        this.meter = null;
        this.mediaStream = null;
        this.isRunning = false;
        this.volumeBarEl = null;
        this.volumeIconEl = null;
        this.volumeHistory = [];
        this.historySize = 10;
        this.hasPermission = false;
        this.permissionDenied = false;
        this.isInitialized = false;

        // Vérifier si Font Awesome est déjà chargé, sinon le charger
        this.loadFontAwesome();

        // Créer les éléments d'interface
        this.createElements();

        // Gérer les changements de visibilité
        document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this));

        // Vérifier l'état de la permission puis attendre une interaction utilisateur
        this.checkPermissionAndInit();
    }
    
    loadFontAwesome() {
        // Vérifier si Font Awesome 6.5.1 est déjà chargé par la page hôte
        if (!document.querySelector('link[href*="font-awesome/6.5.1"]')) {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css';
            link.integrity = 'sha512-DTOQO9RWCH3ppGqcWaEA1BIZOC6xxalwEsw9c2QQeAIftl+Vegovlnee1c9QX4TctnWMn13TZye+giMm8e2LwA==';
            link.crossOrigin = 'anonymous';
            link.referrerPolicy = 'no-referrer';
            document.head.appendChild(link);
        }
    }
    
    /**
     * Vérifie l'état de la permission micro puis attend une interaction utilisateur.
     * - Si permission déjà accordée : démarre dès le premier clic (pour l'AudioContext).
     * - Si permission « prompt » : demande l'accès au premier clic.
     * - Si permission refusée : affiche l'animation inactive.
     * - Sur Safari (pas de permissions.query pour micro) : tente au premier clic.
     */
    checkPermissionAndInit() {
        // Si la permission est déjà accordée, un clic n'importe où suffit
        // (pas de popup, il faut juste débloquer l'AudioContext).
        // Sinon, limiter au clic sur le sonomètre pour éviter une popup
        // intempestive quand on clique sur un lien.
        const waitForClick = (alreadyGranted) => {
            if (alreadyGranted) {
                document.addEventListener('click', () => {
                    if (!this.isInitialized) {
                        this.isInitialized = true;
                        this.initAudio();
                    }
                }, { once: true });
            } else {
                const meterEl = document.getElementById('sound-meter');
                if (!meterEl) return;
                const target = meterEl.parentElement || meterEl;
                target.style.cursor = 'pointer';
                target.title = 'Cliquez pour activer le sonomètre';
                target.addEventListener('click', () => {
                    if (!this.isInitialized) {
                        this.isInitialized = true;
                        target.style.cursor = '';
                        target.title = '';
                        this.initAudio();
                    }
                }, { once: true });
            }
        };

        if (navigator.permissions && navigator.permissions.query) {
            navigator.permissions.query({ name: 'microphone' })
                .then(permissionStatus => {
                    if (permissionStatus.state === 'granted') {
                        this.hasPermission = true;
                    } else if (permissionStatus.state === 'denied') {
                        this.permissionDenied = true;
                        this.applyInactiveAnimation();
                    }

                    // Écouter les futurs changements de permission
                    permissionStatus.onchange = () => {
                        if (permissionStatus.state === 'granted') {
                            this.hasPermission = true;
                            this.permissionDenied = false;
                            if (this.isInitialized && !this.isRunning) {
                                this.initAudio();
                            }
                        } else if (permissionStatus.state === 'denied') {
                            this.hasPermission = false;
                            this.permissionDenied = true;
                            this.stopMeter();
                            this.applyInactiveAnimation();
                        }
                    };

                    // Toujours attendre un clic pour créer l'AudioContext
                    if (!this.permissionDenied) {
                        waitForClick(this.hasPermission);
                    }
                })
                .catch(() => {
                    // permissions.query non supporté pour 'microphone' (ex. Safari)
                    waitForClick(false);
                });
        } else {
            // Navigateur sans permissions.query (ancien Safari, etc.)
            waitForClick(false);
        }
    }

    handleVisibilityChange() {
        if (document.hidden) {
            this.pauseMeter();
        } else if (!this.isRunning && this.hasPermission) {
            this.resumeMeter();
        }
    }
    
    createElements() {
        // Vérifier si l'élément existe déjà
        if (document.getElementById('sound-meter')) return;
        
        // Trouver l'élément après lequel insérer
        const titleEl = document.querySelector('h1, .main-title, #main-title, .title');
        if (!titleEl) return;
        
        // Créer le conteneur avec wrapper pour centrage
        const wrapper = document.createElement('div');
        wrapper.style.width = '100%';
        wrapper.style.display = 'flex';
        wrapper.style.justifyContent = 'center';
        wrapper.style.alignItems = 'center'; // Pour aligner l'icône verticalement
        wrapper.style.marginTop = '0px'; // Réduit l'espace entre le titre et la barre
        wrapper.style.marginBottom = '3rem'; // Augmente l'espace sous la barre
        
        // Créer le conteneur de la barre
        const container = document.createElement('div');
        container.id = 'sound-meter';
        container.style.width = '300px'; // Largeur de 300 pixels
        container.style.maxWidth = '80%'; // Pour la responsivité sur petits écrans
        container.style.height = '3px';
        container.style.backgroundColor = '#f0f0f0';
        container.style.borderRadius = '1px';
        container.style.overflow = 'hidden';
        container.style.position = 'relative';
        
        // Créer la barre de volume
        const volumeBar = document.createElement('div');
        volumeBar.className = 'volume-bar';
        volumeBar.style.height = '100%';
        volumeBar.style.width = '0%';
        volumeBar.style.backgroundColor = '#4CAF50';
        volumeBar.style.position = 'absolute';
        volumeBar.style.left = '0';
        volumeBar.style.top = '0';
        volumeBar.style.transition = 'width 0.1s ease-out, background-color 0.5s ease';
        
        // Créer l'icône de volume élevé
        const volumeIcon = document.createElement('i');
        volumeIcon.className = 'fas fa-volume-xmark'; // Icône de volume avec X
        volumeIcon.style.marginLeft = '2rem';
        volumeIcon.style.color = '#F44336'; // Rouge
        volumeIcon.style.fontSize = '16px';
        volumeIcon.style.display = 'none'; // Masquée par défaut
        volumeIcon.style.position = 'relative'; // Position relative
        volumeIcon.style.top = '-5px'; // Légèrement décalé pour un meilleur alignement vertical
        volumeIcon.setAttribute('aria-hidden', 'true');
        volumeIcon.setAttribute('title', 'Niveau sonore élevé - Merci de faire silence');
        
        // Assembler les éléments
        container.appendChild(volumeBar);
        wrapper.appendChild(container);
        wrapper.appendChild(volumeIcon);
        
        // Insérer après le titre
        titleEl.parentNode.insertBefore(wrapper, titleEl.nextSibling);
        
        // Stocker les références
        this.volumeBarEl = volumeBar;
        this.volumeIconEl = volumeIcon;
    }
    
    initAudio() {
        if (this.isRunning || this.permissionDenied) return;

        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            console.error('L\'API getUserMedia n\'est pas prise en charge par ce navigateur.');
            this.applyInactiveAnimation();
            return;
        }

        try {
            // Créer ou reprendre l'AudioContext
            if (!this.audioContext || this.audioContext.state === 'closed') {
                window.AudioContext = window.AudioContext || window.webkitAudioContext;
                this.audioContext = new AudioContext();
            } else if (this.audioContext.state === 'suspended') {
                this.audioContext.resume();
            }

            const constraints = {
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                },
                video: false
            };

            // Demander l'accès au microphone
            // Si la permission est déjà accordée, le navigateur ne réaffiche pas la popup
            navigator.mediaDevices.getUserMedia(constraints)
                .then(stream => {
                    this.hasPermission = true;
                    this.permissionDenied = false;
                    this.setupAudioNodes(stream);
                })
                .catch(err => {
                    console.error('Erreur lors de l\'accès au microphone:', err);
                    this.permissionDenied = true;
                    this.applyInactiveAnimation();
                });
        } catch (e) {
            console.error('Erreur lors de l\'initialisation de l\'audio:', e);
            this.applyInactiveAnimation();
        }
    }
    
    pauseMeter() {
        // Mettre en pause sans fermer le flux
        this.isRunning = false;

        // Suspendre le contexte audio mais garder le flux
        if (this.audioContext && this.audioContext.state === 'running') {
            this.audioContext.suspend().catch(e => {
                console.error('Erreur lors de la suspension du contexte audio:', e);
            });
        }
    }

    resumeMeter() {
        // Reprendre avec le flux existant si possible
        if (!this.isRunning && this.hasPermission) {
            // Si on a encore le flux et le contexte, on reprend simplement
            if (this.mediaStream && this.audioContext && this.audioContext.state === 'suspended') {
                this.audioContext.resume().then(() => {
                    this.isRunning = true;
                    this.updateVolume();
                }).catch(e => {
                    console.error('Erreur lors de la reprise du contexte audio:', e);
                });
            } else if (this.mediaStream && this.audioContext && this.audioContext.state === 'running') {
                // Le contexte est déjà actif, juste redémarrer l'analyse
                this.isRunning = true;
                this.updateVolume();
            } else {
                // Sinon, on doit réinitialiser (mais seulement si nécessaire)
                this.initAudio();
            }
        }
    }
    
    applyInactiveAnimation() {
        // Seulement si l'élément existe
        if (this.volumeBarEl) {
            // Animation subtile de pulsation pour indiquer que la barre n'est pas active
            this.volumeBarEl.style.animation = 'pulse-inactive 2s infinite';
            this.volumeBarEl.style.width = '20%';
            this.volumeBarEl.style.opacity = '0.5';
            this.volumeBarEl.style.backgroundColor = '#999';
            
            // Ajouter la définition de l'animation si elle n'existe pas
            if (!document.getElementById('sound-meter-styles')) {
                const style = document.createElement('style');
                style.id = 'sound-meter-styles';
                style.textContent = `
                    @keyframes pulse-inactive {
                        0% { opacity: 0.3; }
                        50% { opacity: 0.5; }
                        100% { opacity: 0.3; }
                    }
                `;
                document.head.appendChild(style);
            }
        }
        
        // Masquer l'icône si elle existe
        if (this.volumeIconEl) {
            this.volumeIconEl.style.display = 'none';
        }
    }
    
    setupAudioNodes(stream) {
        // Arrêter l'ancien flux s'il existe
        if (this.mediaStream) {
            this.mediaStream.getTracks().forEach(track => track.stop());
        }
        
        // Conserver le nouveau flux
        this.mediaStream = stream;
        
        // Créer une source audio à partir du flux
        const source = this.audioContext.createMediaStreamSource(stream);
        
        // Créer un analyseur pour mesurer le volume
        const analyser = this.audioContext.createAnalyser();
        analyser.fftSize = 256;
        analyser.smoothingTimeConstant = 0.8;
        
        // Connecter la source à l'analyseur (pas à la destination pour éviter l'écho)
        source.connect(analyser);
        
        // Stocker l'analyseur
        this.meter = analyser;
        
        // Vider l'historique des volumes
        this.volumeHistory = [];
        
        // Démarrer la surveillance
        this.isRunning = true;
        
        // Réinitialiser les styles d'animation inactive si présents
        if (this.volumeBarEl) {
            this.volumeBarEl.style.animation = 'none';
            this.volumeBarEl.style.opacity = '1';
        }
        
        // Commencer l'analyse
        this.updateVolume();
    }
    
    updateVolume() {
        if (!this.isRunning || !this.meter || !this.volumeBarEl) {
            return;
        }
        
        try {
            // Créer un tableau pour recevoir les données
            const dataArray = new Uint8Array(this.meter.frequencyBinCount);
            
            // Obtenir les données de fréquence
            this.meter.getByteFrequencyData(dataArray);
            
            // Calculer le volume moyen
            let sum = 0;
            for (let i = 0; i < dataArray.length; i++) {
                sum += dataArray[i];
            }
            let avg = sum / dataArray.length;
            
            // Normaliser entre 0 et 100
            let volume = Math.min(100, Math.max(0, avg * 1.2)); // Facteur d'amplification de 1.2
            
            // Ajouter à l'historique pour lissage
            this.volumeHistory.push(volume);
            if (this.volumeHistory.length > this.historySize) {
                this.volumeHistory.shift();
            }
            
            // Calculer la moyenne mobile
            const smoothedVolume = this.volumeHistory.reduce((a, b) => a + b, 0) / this.volumeHistory.length;
            
            // Mettre à jour la largeur de la barre
            this.volumeBarEl.style.width = smoothedVolume + '%';
            
            // Changer la couleur en fonction du niveau
            if (smoothedVolume < 30) {
                this.volumeBarEl.style.backgroundColor = '#4CAF50'; // Vert
                // Masquer l'icône
                if (this.volumeIconEl) {
                    this.volumeIconEl.style.display = 'none';
                }
            } else if (smoothedVolume < 60) {
                this.volumeBarEl.style.backgroundColor = '#FFC107'; // Jaune
                // Masquer l'icône
                if (this.volumeIconEl) {
                    this.volumeIconEl.style.display = 'none';
                }
            } else {
                this.volumeBarEl.style.backgroundColor = '#F44336'; // Rouge
                // Afficher l'icône
                if (this.volumeIconEl) {
                    this.volumeIconEl.style.display = 'inline-block';
                    
                    // Animation optionnelle pour attirer l'attention
                    if (!this.volumeIconEl.classList.contains('pulsating')) {
                        this.volumeIconEl.classList.add('pulsating');
                        
                        // Ajouter l'animation de pulsation si elle n'existe pas
                        if (!document.getElementById('sound-icon-styles')) {
                            const style = document.createElement('style');
                            style.id = 'sound-icon-styles';
                            style.textContent = `
                                @keyframes pulse-icon {
                                    0% { transform: scale(1); }
                                    50% { transform: scale(1.2); }
                                    100% { transform: scale(1); }
                                }
                                .pulsating {
                                    animation: pulse-icon 1s infinite;
                                }
                            `;
                            document.head.appendChild(style);
                        }
                    }
                }
            }
            
            // Mettre à jour en continu
            requestAnimationFrame(() => this.updateVolume());
        } catch (e) {
            console.error('Erreur lors de l\'analyse du volume:', e);
            // En cas d'erreur, on met en pause et on essaie de reprendre
            this.pauseMeter();
            setTimeout(() => this.resumeMeter(), 1000);
        }
    }
    
    stopMeter() {
        this.isRunning = false;

        // Arrêter les pistes audio
        if (this.mediaStream) {
            this.mediaStream.getTracks().forEach(track => track.stop());
            this.mediaStream = null;
        }
        
        // Réinitialiser les mesures
        this.meter = null;
        this.volumeHistory = [];
        
        // Masquer l'icône
        if (this.volumeIconEl) {
            this.volumeIconEl.style.display = 'none';
            this.volumeIconEl.classList.remove('pulsating');
        }
        
        // Suspendre le contexte audio
        if (this.audioContext && this.audioContext.state === 'running') {
            this.audioContext.suspend().catch(e => {
                console.error('Erreur lors de la suspension du contexte audio:', e);
            });
        }
    }
}

// Initialiser le compteur de bruit au chargement de la page
document.addEventListener('DOMContentLoaded', () => {
    window.soundMeter = new SoundMeter();
});