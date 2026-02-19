document.addEventListener('DOMContentLoaded', () => {
    // --- Theme Logic ---
    const themeBtn = document.getElementById('theme-toggle');
    const themeIcon = themeBtn.querySelector('.theme-icon');

    // Check local storage or system preference
    const savedTheme = localStorage.getItem('theme');
    const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    if (savedTheme === 'dark' || (!savedTheme && systemDark)) {
        document.body.classList.add('dark-mode');
        themeIcon.textContent = '☀️';
    }

    themeBtn.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        const isDark = document.body.classList.contains('dark-mode');
        themeIcon.textContent = isDark ? '☀️' : '🌙';
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
    });

    // --- Timer Logic ---
    let timeLeft = 10 * 60; // default 10m
    let timerInterval = null;
    let isRunning = false;

    const timeDisplay = document.getElementById('time-display');
    const startBtn = document.getElementById('start-btn');
    const resetBtn = document.getElementById('reset-btn');
    const durationBtns = document.querySelectorAll('.duration-btn');

    function formatTime(seconds) {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    }

    function updateDisplay() {
        timeDisplay.textContent = formatTime(timeLeft);
    }

    function playChime() {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.connect(gain);
        gain.connect(ctx.destination);

        // Soft Bell Tone
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
        osc.frequency.exponentialRampToValueAtTime(523.25, ctx.currentTime + 0.1);

        // Envelope
        gain.gain.setValueAtTime(0, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.1); // Attack
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 3); // Long Decay

        osc.start();
        osc.stop(ctx.currentTime + 3);
    }

    function fadeOutSound() {
        if (currentSound) {
            const sound = currentSound;
            // Remove UI active state immediately
            document.querySelector('.sound-btn.playing')?.classList.remove('playing');
            currentSound = null; // Detach global reference logic

            const fadeInterval = setInterval(() => {
                if (sound.volume > 0.05) {
                    sound.volume -= 0.05;
                } else {
                    sound.volume = 0;
                    sound.pause();
                    sound.currentTime = 0;
                    sound.volume = 0.5; // Reset volume for next time
                    clearInterval(fadeInterval);
                }
            }, 200); // Approx 2 seconds fade out
        }
    }

    function toggleTimer() {
        if (isRunning) {
            clearInterval(timerInterval);
            startBtn.textContent = 'Start';
            isRunning = false;
        } else {
            timerInterval = setInterval(() => {
                if (timeLeft > 0) {
                    timeLeft--;
                    updateDisplay();
                } else {
                    clearInterval(timerInterval);
                    startBtn.textContent = 'Start';
                    isRunning = false;
                    playChime(); // Play soft sound
                    fadeOutSound(); // Fade out ambient noise
                }
            }, 1000);
            startBtn.textContent = 'Pause';
            isRunning = true;
        }
    }

    function resetTimer() {
        clearInterval(timerInterval);
        isRunning = false;
        startBtn.textContent = 'Start';
        // Get active duration
        const activeBtn = document.querySelector('.duration-btn.active');
        const initialMinutes = activeBtn ? parseInt(activeBtn.dataset.time) : 10;
        timeLeft = initialMinutes * 60;
        updateDisplay();
    }

    startBtn.addEventListener('click', toggleTimer);
    resetBtn.addEventListener('click', resetTimer);

    durationBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Clear custom input value
            customInput.value = '';

            // Remove active class from all
            durationBtns.forEach(b => b.classList.remove('active'));
            // Add to clicked
            btn.classList.add('active');

            // Initializing new time
            const mins = parseInt(btn.dataset.time);
            timeLeft = mins * 60;

            // If running, stop and update; if not just update
            if (isRunning) {
                clearInterval(timerInterval);
                isRunning = false;
                startBtn.textContent = 'Start';
            }
            updateDisplay();
        });
    });

    // --- Custom Time Input Logic ---
    const customInput = document.getElementById('custom-time');

    customInput.addEventListener('input', () => {
        const val = parseInt(customInput.value);
        if (val && val > 0) {
            // Remove active class from buttons
            durationBtns.forEach(b => b.classList.remove('active'));

            timeLeft = val * 60;
            updateDisplay();

            if (isRunning) {
                clearInterval(timerInterval);
                isRunning = false;
                startBtn.textContent = 'Start';
            }
        }
    });

    customInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            const val = parseInt(customInput.value);
            if (val && val > 0 && !isRunning) {
                toggleTimer();
            }
            customInput.blur(); // Remove focus
        }
    });

    // --- Breathing Animation Logic ---
    // (Text removed per user request, keeping visual circle only)
    const breathingText = document.querySelector('.breathing-text');
    // The CSS animation is 8s long (4s in, 4s out approximately)

    function updateBreathingText() {
        // Simple Interval sync to match CSS animation
        // 0-4s: Inhale, 4-8s: Exhale
        let inhaling = true;
        // Set initial state
        breathingText.textContent = 'Inhale';

        setInterval(() => {
            inhaling = !inhaling;
            breathingText.textContent = inhaling ? 'Inhale' : 'Exhale';
            // Optional: Add subtle fade for smoothness if desired, but keeping it simple for sync
        }, 4000);
    }

    // Slight delay to align with CSS animation start
    setTimeout(updateBreathingText, 0);


    // --- Audio File Logic ---
    // User providing: rain.wav, forest.wav, waves.wav
    const soundBtns = document.querySelectorAll('.sound-btn');

    const sounds = {
        rain: new Audio('rain.wav'),
        forest: new Audio('forest.wav'),
        waves: new Audio('waves.mp3')
    };

    // Configure loops
    Object.values(sounds).forEach(sound => {
        sound.loop = true;
        sound.volume = 0.5; // Default volume
    });

    let currentSound = null;

    soundBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const soundType = btn.dataset.sound;
            const sound = sounds[soundType];

            // If clicking the active button
            if (btn.classList.contains('playing')) {
                btn.classList.remove('playing');
                sound.pause();
                sound.currentTime = 0; // Reset
                currentSound = null;
            } else {
                // Stop any currently playing sound
                if (currentSound) {
                    currentSound.pause();
                    currentSound.currentTime = 0;
                    document.querySelector('.sound-btn.playing')?.classList.remove('playing');
                }

                // Play new sound
                btn.classList.add('playing');
                sound.play().catch(e => console.log("Audio play failed (interaction required):", e));
                currentSound = sound;
            }
        });
    });
});
