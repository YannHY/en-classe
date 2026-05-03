"use strict";

// Sound Emoji trigger
const funSoundTrigger = document.getElementById('fun-sound-trigger');
const clickSound = document.getElementById('click-sound');

if (funSoundTrigger && clickSound) {
    const playClickSound = () => clickSound.play();

    funSoundTrigger.addEventListener('click', playClickSound);
    funSoundTrigger.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            playClickSound();
        }
    });
}

// Sounds & Counts
document.addEventListener('DOMContentLoaded', function () {
    const images = document.querySelectorAll('img[data-audio]');
    images.forEach(img => {
        img.addEventListener('click', function () {
            const audioId = this.getAttribute('data-audio');
            const audio = document.getElementById(audioId);

            // Generate the counterId by replacing 'audio' with 'counter' in the audioId
            const counterId = audioId.replace('audio', 'counter');
            const counter = document.getElementById(counterId);

            // Stop all other audios
            document.querySelectorAll('audio').forEach(el => {
                if (el.id !== audioId) {
                    el.pause();
                    el.currentTime = 0;
                }
            });

            // Check if the audio is paused before playing it
            if (audio.paused) {
                audio.play();
                // Increment and update the counter only when audio starts playing
                counter.textContent = parseInt(counter.textContent) + 1;
            } else {
                audio.pause();
                audio.currentTime = 0;
            }
        });
    });
});
