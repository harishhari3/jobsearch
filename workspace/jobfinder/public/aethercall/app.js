// Gemini model used for live AI responses
const GEMINI_MODEL = 'gemini-3.5-flash';

// Global Application State
const state = {
    // Call Status: 'idle' | 'ringing' | 'listening' | 'thinking' | 'speaking' | 'ended'
    status: 'idle',
    isMuted: false,
    duration: 0,
    timerInterval: null,
    
    // Conversation History for Gemini (role, parts)
    history: [],
    
    // Web Speech API Objects
    recognition: null,
    synthesis: window.speechSynthesis,
    activeUtterance: null,
    voices: [],
    
    // Web Audio API objects for calling tones
    audioCtx: null,
    ringingOscillators: [],
    
    // Visualizer Canvas Context
    canvas: null,
    ctx: null,
    animationId: null,
    visualizerPhase: 0,
    
    // Live Mic Audio Analyzer (for Reacting to voice amplitude)
    micStream: null,
    audioSource: null,
    analyserNode: null,
    dataArray: null,
    
    // Configuration Settings
    settings: {
        apiKey: localStorage.getItem('gemini_api_key') || new URLSearchParams(location.search).get('key') || '',
        persona: localStorage.getItem('aether_persona') || 'assistant',
        mode: localStorage.getItem('aether_mode') || 'auto', // 'auto' | 'api' | 'demo'
        language: localStorage.getItem('aether_language') || 'en-US',
        voiceName: localStorage.getItem('aether_voice') || '',
        speed: parseFloat(localStorage.getItem('aether_speed')) || 1.0,
        pitch: parseFloat(localStorage.getItem('aether_pitch')) || 1.0
    }
};

// Restart flag for speech recognition language switches
let isRestarting = false;

// System Personas Configuration
const PERSONAS = {
    assistant: {
        name: "Google Assistant",
        instructions: "You are a helpful, extremely polite, and concise voice assistant. Give very short replies (1 to 2 sentences max). Talk conversationally. Do not use markdown syntax, lists, or bullets."
    },
    coach: {
        name: "Motivational Life Coach",
        instructions: "You are an inspiring, warm, and highly supportive life coach. Ask reflective, positive questions. Encourage the user. Give short replies (2 sentences max). Do not use markdown syntax."
    },
    tutor: {
        name: "English Speaking Coach",
        instructions: "You are an encouraging English Language tutor. Help the user speak better English. If they make spelling or grammar mistakes in the transcript, gently correct them, then reply. Keep sentences clear and short (2 sentences max). Do not use markdown."
    },
    interviewer: {
        name: "Job Interviewer",
        instructions: "You are a professional hiring manager conducting a phone screening interview. Ask one professional question at a time and wait for answers. Provide brief professional remarks on their responses. Do not use markdown."
    },
    geek: {
        name: "Cyber Tech Support Guy",
        instructions: "You are a funny, slightly nerdy, and quirky IT tech support technician. Use mild computer jargon, but keep it entertaining and friendly. Solve problems with simple instructions. Limit to 2 sentences max. Do not use markdown."
    }
};

// Simulated responses for Demo Mode (if no API Key is set)
const DEMO_RESPONSES = {
    assistant: [
        "I'm here to help. How is your day going so far?",
        "That's interesting. Tell me more about what you're working on today.",
        "Sure, I can help you with that. Is there anything else you need to know?",
        "I'm listening. Please continue.",
        "I'm doing great, thank you for asking! What can I do for you?"
    ],
    coach: [
        "That sounds like a challenge, but I know you have the strength to push through it. What is one tiny step you can take today?",
        "Focus on your progress, not perfection. You are doing much better than you give yourself credit for!",
        "Every small victory counts. Keep moving forward, I am rooting for you!",
        "How does that make you feel? Remind yourself of your initial goal.",
        "Believe in yourself. You have unique strengths that can overcome any obstacle."
    ],
    tutor: [
        "Your English sounds very natural. Keep speaking just like that!",
        "Excellent sentence structure! Let's try to elaborate a bit more.",
        "I understood you perfectly. To make it sound even more native, you could say: 'That sounds great.'",
        "Practice makes perfect. What is your favorite hobby to talk about?",
        "That's a very common phrase. Let's practice saying it together: 'It's a piece of cake.'"
    ],
    interviewer: [
        "Thank you for sharing that. Can you give me an example of a time you resolved a conflict in a team setting?",
        "That's a solid answer. Why are you interested in joining our company for this role?",
        "Interesting background. What would you say is your greatest technical strength?",
        "How do you handle working under tight deadlines or high-stress environments?",
        "Excellent. Do you have any questions for me about the role or the team?"
    ],
    geek: [
        "Have you tried turning it off and on again? That resolves 90% of local buffer errors.",
        "Whoops! Sounds like a registry conflict in your central neocortex. Let's debug it together.",
        "My sensors detect optimal network latency. What software module are we trying to compile today?",
        "Be careful not to delete system32! Just kidding. What seems to be the malfunction?",
        "Running diagnostics... Yup, it looks like a user-end operational success! What's next?"
    ]
};

// Initialize the Application
document.addEventListener('DOMContentLoaded', () => {
    initSpeech();
    initDOM();
    initVisualizer();
    loadVoices();
    lucide.createIcons();
    
    // In speech synthesis, voices load asynchronously
    if (state.synthesis.onvoiceschanged !== undefined) {
        state.synthesis.onvoiceschanged = loadVoices;
    }
});

// Initialize Speech Recognition API
function initSpeech() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
        console.error("Web Speech API is not supported in this browser.");
        alert("Your browser does not support Speech Recognition. Please use Google Chrome or Microsoft Edge for the best experience.");
        return;
    }
    
    state.recognition = new SpeechRecognition();
    state.recognition.continuous = true;
    state.recognition.interimResults = true;
    state.recognition.lang = state.settings.language || 'en-US';
    
    // STT Event Handlers
    state.recognition.onstart = () => {
        console.log("Speech recognition started...");
        if (state.status !== 'muted' && state.status !== 'ended' && state.status !== 'idle') {
            updateCallStatus('listening');
        }
    };
    
    state.recognition.onresult = (event) => {
        const resultText = event.results[0][0].transcript;
        console.log("Speech Recognized: ", resultText);
        
        // Hide AI Bubble, show user speech bubble
        showUserSpeechBubble(resultText);
        
        // Add to transcript log
        addTranscriptToLog('user', resultText);
        
        // Transition to thinking state and execute AI
        processUserSpeech(resultText);
    };
    
    state.recognition.onerror = (event) => {
        console.warn("Speech Recognition Error: ", event.error);

        if (event.error === 'network') {
            // Speech service unreachable (no network / sandboxed env).
            // Stop auto-restarting after 2 attempts and let the user type instead.
            state.speechNetworkErrors = (state.speechNetworkErrors || 0) + 1;
            if (state.speechNetworkErrors >= 2) {
                state.speechDisabled = true;
                showToast("Voice recognition isn't reachable here — tap the keyboard button and type your message instead.", 'error');
            }
        } else if (event.error === 'no-speech') {
            // Treat no-speech error gracefully
            if (state.status === 'listening' && !state.synthesis.speaking) {
                restartListeningSafely();
            }
        } else if (event.error === 'not-allowed') {
            alert("Microphone permission was denied. Please allow microphone access and restart the call.");
            hangupCall();
        } else if (event.error === 'language-not-supported') {
            showToast(`${getLanguageName(state.settings.language)} speech input isn't supported on this browser — falling back to English.`, 'error');
            setLanguage('en-US');
        }
    };
    
    state.recognition.onend = () => {
        console.log("Speech recognition ended.");
        if (state.speechDisabled) return;
        // If we are restarting due to language change, apply language and start again
        if (isRestarting) {
            isRestarting = false;
            state.recognition.lang = state.settings.language;
            if (state.status === 'listening' && !state.synthesis.speaking && !state.isMuted) {
                restartListeningSafely();
            }
            return;
        }
        
        // If we are still in listening state and not speaking, restart it
        if (state.status === 'listening' && !state.synthesis.speaking && !state.isMuted) {
            restartListeningSafely();
        }
    };
}

// Safely restart Speech Recognition
function restartListeningSafely() {
    if (state.speechDisabled) return;
    if (!state.recognition || state.isMuted || state.status === 'idle' || state.status === 'ended' || state.status === 'ringing') return;
    if (state.synthesis && state.synthesis.speaking) return;
    if (state.recognition && typeof state.recognition.isListening === 'boolean' && state.recognition.isListening) return;

    try {
        state.recognition.lang = state.settings.language || 'en-US';
        state.recognition.start();
    } catch (e) {
        if (e.name !== 'InvalidStateError') {
            console.warn('Could not start speech recognition:', e);
        }
    }
}

// Initialize Web Audio API context for tone synthesis
function initAudioContext() {
    if (!state.audioCtx) {
        state.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (state.audioCtx.state === 'suspended') {
        state.audioCtx.resume();
    }
}

// Synthesis of Ringing Tone (dial-out style)
function playRingingTone() {
    initAudioContext();
    if (!state.audioCtx) return;
    
    // Stop any existing ringing oscillators
    stopRingingTones();
    
    // Create twin oscillators for telephone ringing combination (440Hz + 480Hz)
    const osc1 = state.audioCtx.createOscillator();
    const osc2 = state.audioCtx.createOscillator();
    const gainNode = state.audioCtx.createGain();
    
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(440, state.audioCtx.currentTime);
    
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(480, state.audioCtx.currentTime);
    
    gainNode.gain.setValueAtTime(0, state.audioCtx.currentTime);
    
    // Connect to outputs
    osc1.connect(gainNode);
    osc2.connect(gainNode);
    gainNode.connect(state.audioCtx.destination);
    
    osc1.start();
    osc2.start();
    
    state.ringingOscillators = [osc1, osc2, gainNode];
    
    // Ring cadence loop (2 seconds on, 4 seconds off)
    let isRinging = false;
    const playCadence = () => {
        if (state.status !== 'ringing') {
            stopRingingTones();
            return;
        }
        isRinging = !isRinging;
        if (isRinging) {
            // Fade in
            gainNode.gain.setTargetAtTime(0.06, state.audioCtx.currentTime, 0.05);
            // Ring duration
            setTimeout(playCadence, 2000);
        } else {
            // Fade out
            gainNode.gain.setTargetAtTime(0, state.audioCtx.currentTime, 0.05);
            // Silent duration
            setTimeout(playCadence, 3000);
        }
    };
    
    // Start ring loop
    playCadence();
}

function stopRingingTones() {
    if (state.ringingOscillators.length > 0) {
        try {
            state.ringingOscillators[0].stop();
            state.ringingOscillators[1].stop();
        } catch(e) {}
        state.ringingOscillators = [];
    }
}

// Play single quick beep (Accept Call sound)
function playConnectedTone() {
    initAudioContext();
    if (!state.audioCtx) return;
    
    const osc = state.audioCtx.createOscillator();
    const gain = state.audioCtx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, state.audioCtx.currentTime);
    
    gain.gain.setValueAtTime(0.05, state.audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, state.audioCtx.currentTime + 0.25);
    
    osc.connect(gain);
    gain.connect(state.audioCtx.destination);
    
    osc.start();
    osc.stop(state.audioCtx.currentTime + 0.25);
}

// Play triple short beep (End Call sound)
function playDisconnectTone() {
    initAudioContext();
    if (!state.audioCtx) return;
    
    const playBeep = (time, freq) => {
        const osc = state.audioCtx.createOscillator();
        const gain = state.audioCtx.createGain();
        osc.frequency.setValueAtTime(freq, time);
        gain.gain.setValueAtTime(0.04, time);
        gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.12);
        osc.connect(gain);
        gain.connect(state.audioCtx.destination);
        osc.start(time);
        osc.stop(time + 0.12);
    };
    
    const now = state.audioCtx.currentTime;
    playBeep(now, 580);
    playBeep(now + 0.15, 520);
    playBeep(now + 0.3, 440);
}

// Load system Speech voices
function loadVoices() {
    if (!state.synthesis) return;
    state.voices = state.synthesis.getVoices();
    if (state.voices.length === 0) return; // wait for onvoiceschanged
    
    updateVoiceDropdown(state.settings.language);
}

// Bind DOM Events
function initDOM() {
    const actionCallBtn = document.getElementById('actionCallBtn');
    const muteBtn = document.getElementById('muteBtn');
    const settingsBtn = document.getElementById('settingsBtn');
    const closeSettingsBtn = document.getElementById('closeSettingsBtn');
    const saveSettingsBtn = document.getElementById('saveSettingsBtn');
    const toggleTranscriptBtn = document.getElementById('toggleTranscriptBtn');
    const closeDrawerBtn = document.getElementById('closeDrawerBtn');
    const clearTranscriptBtn = document.getElementById('clearTranscriptBtn');
    
    const keypadBtn = document.getElementById('keypadBtn');
    const closeKeypadBtn = document.getElementById('closeKeypadBtn');
    const sendKeypadBtn = document.getElementById('sendKeypadBtn');
    const keypadTextarea = document.getElementById('keypadTextarea');
    
    // Voice Speed & Pitch visual indicators
    const voiceSpeed = document.getElementById('voiceSpeed');
    const voicePitch = document.getElementById('voicePitch');
    const speedVal = document.getElementById('speedVal');
    const pitchVal = document.getElementById('pitchVal');
    
    voiceSpeed.addEventListener('input', (e) => speedVal.textContent = e.target.value + 'x');
    voicePitch.addEventListener('input', (e) => pitchVal.textContent = e.target.value);
    
    // Toggle Password Visibility
    const togglePasswordBtn = document.getElementById('togglePasswordBtn');
    const apiKeyInput = document.getElementById('apiKeyInput');
    togglePasswordBtn.addEventListener('click', () => {
        const type = apiKeyInput.type === 'password' ? 'text' : 'password';
        apiKeyInput.type = type;
        const icon = togglePasswordBtn.querySelector('i');
        if (type === 'text') {
            icon.setAttribute('data-lucide', 'eye-off');
        } else {
            icon.setAttribute('data-lucide', 'eye');
        }
        lucide.createIcons();
    });

    // Populate current settings in fields
    apiKeyInput.value = state.settings.apiKey;
    document.getElementById('personaSelect').value = state.settings.persona;
    document.getElementById('modeToggle').value = state.settings.mode;
    document.getElementById('settingsLanguageSelect').value = state.settings.language;
    document.getElementById('headerLanguageSelect').value = state.settings.language;
    updateLanguageWarning(state.settings.language);
    voiceSpeed.value = state.settings.speed;
    speedVal.textContent = state.settings.speed + 'x';
    voicePitch.value = state.settings.pitch;
    pitchVal.textContent = state.settings.pitch;
    
    // Event Listeners
    actionCallBtn.addEventListener('click', toggleCall);
    muteBtn.addEventListener('click', toggleMute);
    
    settingsBtn.addEventListener('click', () => toggleModal('settingsModal', true));
    closeSettingsBtn.addEventListener('click', () => toggleModal('settingsModal', false));
    saveSettingsBtn.addEventListener('click', saveSettings);
    
    toggleTranscriptBtn.addEventListener('click', () => toggleDrawer(true));
    closeDrawerBtn.addEventListener('click', () => toggleDrawer(false));
    clearTranscriptBtn.addEventListener('click', clearCallLogs);

    // Sync selects
    document.getElementById('settingsLanguageSelect').addEventListener('change', (e) => {
        setLanguage(e.target.value);
    });
    document.getElementById('headerLanguageSelect').addEventListener('change', (e) => {
        setLanguage(e.target.value);
    });
    
    keypadBtn.addEventListener('click', () => {
        if (state.status === 'idle') {
            alert("Please start the call first to type messages.");
            return;
        }
        toggleModal('keypadModal', true);
        keypadTextarea.value = '';
        setTimeout(() => keypadTextarea.focus(), 150);
    });
    closeKeypadBtn.addEventListener('click', () => toggleModal('keypadModal', false));
    sendKeypadBtn.addEventListener('click', submitKeypadMessage);
}

// Modal controls
function toggleModal(modalId, isVisible) {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    if (isVisible) {
        modal.classList.remove('hidden');
    } else {
        modal.classList.add('hidden');
    }
}

// Drawer controls
function toggleDrawer(isOpen) {
    const drawer = document.getElementById('transcriptDrawer');
    if (!drawer) return;
    if (isOpen) {
        drawer.classList.add('open');
    } else {
        drawer.classList.remove('open');
    }
}

// Save Configuration
function saveSettings() {
    const apiKey = document.getElementById('apiKeyInput').value.trim();
    const persona = document.getElementById('personaSelect').value;
    const mode = document.getElementById('modeToggle').value;
    const language = document.getElementById('settingsLanguageSelect').value;
    const voiceName = document.getElementById('voiceSelect').value;
    const speed = parseFloat(document.getElementById('voiceSpeed').value);
    const pitch = parseFloat(document.getElementById('voicePitch').value);
    
    // Persist per-language voice preference
    if (language !== 'auto') {
        localStorage.setItem('aether_voice_' + language, voiceName);
    }
    
    state.settings = { apiKey, persona, mode, language, voiceName, speed, pitch };
    
    localStorage.setItem('gemini_api_key', apiKey);
    localStorage.setItem('aether_persona', persona);
    localStorage.setItem('aether_mode', mode);
    localStorage.setItem('aether_language', language);
    localStorage.setItem('aether_voice', voiceName);
    localStorage.setItem('aether_speed', speed.toString());
    localStorage.setItem('aether_pitch', pitch.toString());
    
    setLanguage(language);
    
    toggleModal('settingsModal', false);
    
    // If the persona changed during an active call, reset history prompts
    if (state.status !== 'idle' && state.status !== 'ended') {
        speakResponse("I have adjusted my settings. What were we talking about?");
    }
}

// Start or End Call
function toggleCall() {
    if (state.status === 'idle' || state.status === 'ended') {
        startCallSequence();
    } else {
        hangupCall();
    }
}

// Step 1: Start Call Sequence
function startCallSequence() {
    initAudioContext();
    updateCallStatus('ringing');
    playRingingTone();
    
    // Clear dynamic bubble UI
    document.getElementById('userBubble').classList.add('hidden');
    document.getElementById('aiBubble').classList.add('hidden');
    
    // Initialize empty history with base instructions
    const selectedPersona = PERSONAS[state.settings.persona];
    state.history = [];
    
    // Simulate Ringing delay (2.5 seconds) then connect
    setTimeout(() => {
        if (state.status === 'ringing') {
            connectCall();
        }
    }, 2500);
}

// Step 2: Connection established
async function connectCall() {
    stopRingingTones();
    playConnectedTone();
    updateCallStatus('listening');

    // Fresh call: re-enable voice recognition attempts
    state.speechDisabled = false;
    state.speechNetworkErrors = 0;
    
    // Enable mute control
    const muteBtn = document.getElementById('muteBtn');
    muteBtn.classList.remove('disabled');
    muteBtn.removeAttribute('disabled');
    
    // Start stopwatch timer
    startTimer();
    
    // Request microphone access and setup visual analyzer in real-time
    await setupMicrophoneStream();
    
    // Let assistant say the initial greeting based on persona
    const greetingText = getPersonaGreeting();
    
    // Seed conversation history with proper languages
    const greetingHello = getLanguageGreetingHello();
    state.history = [
        { role: 'user', parts: [{ text: greetingHello }] },
        { role: 'model', parts: [{ text: greetingText }] }
    ];
    
    speakResponse(greetingText);
    setTimeout(() => {
        if (!state.isMuted && (state.status === 'listening' || state.status === 'speaking')) {
            restartListeningSafely();
        }
    }, 400);
}

// Step 3: Hang up Call
function hangupCall() {
    // Gather transcript text before clearing context
    if (state.history && state.history.length > 2) {
        const transcriptText = state.history.map(item => {
            const speaker = item.role === 'user' ? 'User' : (PERSONAS[state.settings.persona]?.name || 'Aether AI');
            const text = item.parts && item.parts[0] ? item.parts[0].text : '';
            return `${speaker}: ${text}`;
        }).join('\n');
        
        window.parent.postMessage({
            type: 'aethercall_hangup',
            duration: state.duration,
            persona: state.settings.persona,
            transcriptText: transcriptText
        }, '*');
    }

    stopRingingTones();
    playDisconnectTone();
    updateCallStatus('idle');
    stopTimer();
    
    // Disable mute control
    const muteBtn = document.getElementById('muteBtn');
    muteBtn.classList.add('disabled');
    muteBtn.setAttribute('disabled', 'true');
    muteBtn.classList.remove('active');
    state.isMuted = false;
    
    // Stop recording and voice output
    if (state.recognition) {
        try { state.recognition.stop(); } catch(e) {}
    }
    if (state.synthesis) {
        state.synthesis.cancel();
    }
    
    // Close mic stream
    closeMicrophoneStream();
    
    // Update center button icon
    const actionCallBtn = document.getElementById('actionCallBtn');
    actionCallBtn.className = "control-btn action-btn call-start-btn";
    actionCallBtn.innerHTML = '<i data-lucide="phone"></i>';
    lucide.createIcons();
}

// Get the starting greeting of the assistant
function getPersonaGreeting() {
    const lang = state.settings.language;
    
    if (lang === 'hi-IN') {
        switch(state.settings.persona) {
            case 'coach':
                return "नमस्ते दोस्त! आपसे बात करके बहुत अच्छा लगा। आज आपके दिमाग में क्या चल रहा है?";
            case 'tutor':
                return "नमस्ते! मैं हमारे हिंदी-अंग्रेजी अभ्यास के लिए तैयार हूँ। मुझे अपने दिन के बारे में बताएं, या कोई प्रश्न पूछें।";
            case 'interviewer':
                return "नमस्ते। इस फोन स्क्रीनिंग इंटरव्यू में शामिल होने के लिए धन्यवाद। शुरू करने के लिए, क्या आप कृपया अपना परिचय दे सकते हैं?";
            case 'geek':
                return "एथर टेक सपोर्ट ऑनलाइन, स्थिति ठीक है। आज हम किस कंप्यूटर गड़बड़ी का सामना कर रहे हैं?";
            default:
                return "नमस्ते! मैं एथर हूँ। आज मैं आपकी क्या मदद कर सकता हूँ?";
        }
    } else if (lang === 'te-IN') {
        switch(state.settings.persona) {
            case 'coach':
                return "నమస్తే మిత్రమా! మీతో మాట్లాడటం చాలా సంతోషంగా ఉంది. ఈరోజు మీ మనసులో ఏముంది?";
            case 'tutor':
                return "నమస్తే! నేను మన ఇంగ్లీష్ మాట్లాడే ప్రాక్టీస్ కోసం సిద్ధంగా ఉన్నాను. మీ రోజు గురించి చెప్పండి, లేదా నన్ను ఏదైనా ప్రశ్న అడగండి.";
            case 'interviewer':
                return "నమస్తే. ఈ ఫోన్ స్క్రీనింగ్ ఇంటర్వ్యూలో చేరినందుకు ధన్యవాదాలు. ప్రారంభించడానికి, దయచేసి మీ గురించి పరిచయం చేసుకోగలరా?";
            case 'geek':
                return "ఏథర్ టెక్ సపోర్ట్ ఆన్‌లైన్, నెట్‌వర్క్ బాగుంది. ఈరోజు మనం ఏ కంప్యూటర్ సమస్యను ఎదుర్కొంటున్నాము?";
            default:
                return "నమస్తే! నేను ఏథర్. ఈరోజు నేను మీకు ఎలా సహాయపడగలను?";
        }
    } else {
        switch(state.settings.persona) {
            case 'coach':
                return "Hello friend! It is wonderful to talk to you. What is on your mind today?";
            case 'tutor':
                return "Hello! I am ready for our English practice. Tell me about your day, or ask me any question.";
            case 'interviewer':
                return "Hello. Thank you for joining this phone screening interview. To start off, could you please introduce yourself?";
            case 'geek':
                return "Aether Tech Support online, node status green. What computer glitch are we running into today?";
            default:
                return "Hello! I am Aether. How can I help you today?";
        }
    }
}

// Update UI call statuses & themes
function updateCallStatus(newStatus) {
    state.status = newStatus;
    
    const card = document.querySelector('.calling-card');
    const label = document.getElementById('callStateLabel');
    const subLabel = document.getElementById('subStateLabel');
    const actionCallBtn = document.getElementById('actionCallBtn');
    const outerRing = document.getElementById('orbOuterRing');
    
    // Clean old CSS state classes
    card.classList.remove('active-call', 'state-ringing', 'state-listening', 'state-thinking', 'state-speaking');
    outerRing.className = "visualizer-outer-ring";
    
    // Set colors & layout modifiers depending on status
    if (newStatus !== 'idle') {
        card.classList.add('active-call');
    }
    
    switch(newStatus) {
        case 'idle':
            label.textContent = "Click to Start Call";
            subLabel.textContent = "Talk hands-free like a phone call";
            document.documentElement.style.setProperty('--state-glow', 'var(--color-idle)');
            document.documentElement.style.setProperty('--state-glow-soft', 'rgba(71, 85, 105, 0.25)');
            
            actionCallBtn.className = "control-btn action-btn call-start-btn";
            actionCallBtn.innerHTML = '<i data-lucide="phone"></i>';
            updateCenterIcon('phone');
            break;
            
        case 'ringing':
            card.classList.add('state-ringing');
            label.textContent = "Calling Aether AI...";
            subLabel.textContent = "Setting up connection channels";
            document.documentElement.style.setProperty('--state-glow', 'var(--color-ringing)');
            document.documentElement.style.setProperty('--state-glow-soft', 'rgba(37, 99, 235, 0.35)');
            
            actionCallBtn.className = "control-btn action-btn call-end-btn";
            actionCallBtn.innerHTML = '<i data-lucide="phone-off"></i>';
            updateCenterIcon('phone-call');
            break;
            
        case 'listening':
            card.classList.add('state-listening');
            label.textContent = state.isMuted ? "Muted" : "Listening...";
            subLabel.textContent = state.isMuted ? "Tap microphone button to unmute" : "Speak, Aether is listening";
            document.documentElement.style.setProperty('--state-glow', state.isMuted ? 'var(--color-ended)' : 'var(--color-listening)');
            document.documentElement.style.setProperty('--state-glow-soft', state.isMuted ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.35)');
            
            actionCallBtn.className = "control-btn action-btn call-end-btn";
            actionCallBtn.innerHTML = '<i data-lucide="phone-off"></i>';
            updateCenterIcon(state.isMuted ? 'mic-off' : 'mic');
            break;
            
        case 'thinking':
            card.classList.add('state-thinking');
            label.textContent = "Thinking...";
            subLabel.textContent = "Analyzing your words";
            document.documentElement.style.setProperty('--state-glow', 'var(--color-thinking)');
            document.documentElement.style.setProperty('--state-glow-soft', 'rgba(217, 119, 6, 0.35)');
            updateCenterIcon('loader-2');
            break;
            
        case 'speaking':
            card.classList.add('state-speaking');
            label.textContent = "Speaking...";
            subLabel.textContent = "Assistant is responding";
            document.documentElement.style.setProperty('--state-glow', 'var(--color-speaking)');
            document.documentElement.style.setProperty('--state-glow-soft', 'rgba(139, 92, 246, 0.35)');
            updateCenterIcon('volume-2');
            break;
    }
    
    lucide.createIcons();
}

function updateCenterIcon(iconName) {
    const centerIcon = document.getElementById('centerIcon');
    if (centerIcon) {
        centerIcon.setAttribute('data-lucide', iconName);
        if (iconName === 'loader-2') {
            centerIcon.classList.add('spin-animation');
        } else {
            centerIcon.classList.remove('spin-animation');
        }
    }
}

// Timer management
function startTimer() {
    state.duration = 0;
    const timerLabel = document.getElementById('callTimer');
    timerLabel.textContent = "00:00";
    
    state.timerInterval = setInterval(() => {
        state.duration++;
        const minutes = Math.floor(state.duration / 60).toString().padStart(2, '0');
        const seconds = (state.duration % 60).toString().padStart(2, '0');
        timerLabel.textContent = `${minutes}:${seconds}`;
    }, 1000);
}

function stopTimer() {
    if (state.timerInterval) {
        clearInterval(state.timerInterval);
        state.timerInterval = null;
    }
    document.getElementById('callTimer').textContent = "00:00";
}

// Toggle Microphone Mute status
function toggleMute() {
    if (state.status === 'idle' || state.status === 'ringing') return;
    
    state.isMuted = !state.isMuted;
    const muteBtn = document.getElementById('muteBtn');
    
    if (state.isMuted) {
        muteBtn.classList.add('active');
        muteBtn.innerHTML = '<i data-lucide="mic-off"></i>';
        // Stop recognition immediately
        if (state.recognition) {
            try { state.recognition.stop(); } catch(e) {}
        }
        updateCallStatus('listening');
    } else {
        muteBtn.classList.remove('active');
        muteBtn.innerHTML = '<i data-lucide="mic"></i>';
        updateCallStatus('listening');
        // Restart speech recognition loop
        restartListeningSafely();
    }
    lucide.createIcons();
}

// Dynamic display of voice bubbles
function showUserSpeechBubble(text) {
    const bubble = document.getElementById('userBubble');
    const textLabel = document.getElementById('userBubbleText');
    textLabel.textContent = text;
    bubble.classList.remove('hidden');
    
    // Hide AI bubble while user speaks
    document.getElementById('aiBubble').classList.add('hidden');
}

function showAiSpeechBubble(text) {
    const bubble = document.getElementById('aiBubble');
    const textLabel = document.getElementById('aiBubbleText');
    textLabel.textContent = text;
    bubble.classList.remove('hidden');
}

// Live Mic audio analyser stream configuration
async function setupMicrophoneStream() {
    try {
        state.micStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        
        // Setup Web Audio nodes
        initAudioContext();
        if (!state.audioCtx) return;
        
        state.analyserNode = state.audioCtx.createAnalyser();
        state.analyserNode.fftSize = 64; // Small fft for fast reactive calculations
        const bufferLength = state.analyserNode.frequencyBinCount;
        state.dataArray = new Uint8Array(bufferLength);
        
        state.audioSource = state.audioCtx.createMediaStreamSource(state.micStream);
        state.audioSource.connect(state.analyserNode);
        
    } catch(err) {
        console.warn("Could not capture mic audio for visualizer: ", err);
        const isInsecureOrigin = location.protocol === 'file:' || (location.protocol !== 'https:' && !['localhost', '127.0.0.1'].includes(location.hostname));
        const message = isInsecureOrigin
            ? 'Microphone access needs a secure page. Please open the app from http://localhost:8000 or https so voice listening can work.'
            : 'Microphone permission was blocked. Please allow microphone access and try again.';
        showToast(message, 'error');
    }
}

function closeMicrophoneStream() {
    if (state.micStream) {
        state.micStream.getTracks().forEach(track => track.stop());
        state.micStream = null;
    }
    state.analyserNode = null;
    state.dataArray = null;
}

// Canvas Visualizer Orb Loop
function initVisualizer() {
    state.canvas = document.getElementById('visualizerCanvas');
    state.ctx = state.canvas.getContext('2d');
    
    // Resize handler
    const resizeCanvas = () => {
        state.canvas.width = state.canvas.offsetWidth * window.devicePixelRatio;
        state.canvas.height = state.canvas.offsetHeight * window.devicePixelRatio;
        state.ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };
    
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();
    
    // Start drawing loop
    drawVisualizerFrame();
}

function drawVisualizerFrame() {
    state.animationId = requestAnimationFrame(drawVisualizerFrame);
    
    const ctx = state.ctx;
    const width = state.canvas.width / window.devicePixelRatio;
    const height = state.canvas.height / window.devicePixelRatio;
    const centerX = width / 2;
    const centerY = height / 2;
    
    ctx.clearRect(0, 0, width, height);
    state.visualizerPhase += 0.05;
    
    // Renders visual designs based on Call State
    switch(state.status) {
        case 'idle':
            drawIdleVisual(ctx, centerX, centerY);
            break;
        case 'ringing':
            drawRingingVisual(ctx, centerX, centerY);
            break;
        case 'listening':
            if (state.isMuted) {
                drawMutedVisual(ctx, centerX, centerY);
            } else {
                drawListeningVisual(ctx, centerX, centerY);
            }
            break;
        case 'thinking':
            drawThinkingVisual(ctx, centerX, centerY);
            break;
        case 'speaking':
            drawSpeakingVisual(ctx, centerX, centerY);
            break;
    }
}

// Flat breathing center-line visualizer for standby
function drawIdleVisual(ctx, cx, cy) {
    ctx.beginPath();
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = 'rgba(71, 85, 105, 0.4)';
    
    const lineLength = 110;
    ctx.moveTo(cx - lineLength / 2, cy);
    
    // Slight breathing wave offset
    const breatheOffset = Math.sin(state.visualizerPhase) * 2;
    ctx.quadraticCurveTo(cx, cy + breatheOffset, cx + lineLength / 2, cy);
    ctx.stroke();
}

// Concentric ring ripple visualizer for Ringing
function drawRingingVisual(ctx, cx, cy) {
    const pulseCount = 3;
    ctx.lineWidth = 1.5;
    
    for (let i = 0; i < pulseCount; i++) {
        // Stagger radii based on speed
        const t = (state.visualizerPhase * 0.4 + i / pulseCount) % 1;
        const radius = 25 + t * 50;
        const opacity = 1 - t;
        
        ctx.beginPath();
        ctx.strokeStyle = `rgba(37, 99, 235, ${opacity * 0.6})`;
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.stroke();
    }
}

// Red line for mute
function drawMutedVisual(ctx, cx, cy) {
    ctx.beginPath();
    ctx.lineWidth = 3;
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.6)';
    const lineLength = 110;
    ctx.moveTo(cx - lineLength / 2, cy);
    ctx.lineTo(cx + lineLength / 2, cy);
    ctx.stroke();
}

// Dynamic sound waveform that reacts to microphone input amplitudes
function drawListeningVisual(ctx, cx, cy) {
    let volume = 0;
    
    // Pull audio analysis details
    if (state.analyserNode && state.dataArray) {
        state.analyserNode.getByteFrequencyData(state.dataArray);
        let sum = 0;
        for (let i = 0; i < state.dataArray.length; i++) {
            sum += state.dataArray[i];
        }
        volume = sum / state.dataArray.length; // Average frequency amplitude
    } else {
        // Simulate volume variation if microphone stream analyzer fails
        volume = 12 + Math.abs(Math.sin(state.visualizerPhase * 2)) * 18;
    }
    
    // Scale amplitude safely
    const amp = Math.min(volume * 0.7, 50);
    const waveCount = 3;
    
    for (let w = 0; w < waveCount; w++) {
        ctx.beginPath();
        // Stagger styles and speeds
        ctx.lineWidth = 1.5 + (w * 0.5);
        ctx.strokeStyle = `rgba(16, 185, 129, ${0.7 - w * 0.2})`;
        
        const length = 120;
        const startX = cx - length / 2;
        
        ctx.moveTo(startX, cy);
        
        // Multi-curve sine wave calculation
        for (let x = 0; x <= length; x += 10) {
            const currentX = startX + x;
            const phaseShift = state.visualizerPhase * (1.8 + w * 0.4);
            const freq = (x / length) * Math.PI * 2 * (1.5 + w * 0.5);
            // Envelope damping at ends
            const envelope = Math.sin((x / length) * Math.PI);
            const currentY = cy + Math.sin(freq - phaseShift) * amp * envelope;
            
            ctx.lineTo(currentX, currentY);
        }
        ctx.stroke();
    }
}

// Swirling particle starburst visual for Thinking
function drawThinkingVisual(ctx, cx, cy) {
    const rayCount = 12;
    const baseRadius = 38;
    
    ctx.lineWidth = 2.5;
    for (let i = 0; i < rayCount; i++) {
        const angle = (i / rayCount) * Math.PI * 2 + state.visualizerPhase * 0.6;
        
        // Swell size dynamically
        const swell = Math.sin(state.visualizerPhase * 3 + i) * 8;
        const startRad = baseRadius;
        const endRad = baseRadius + 12 + swell;
        
        const startX = cx + Math.cos(angle) * startRad;
        const startY = cy + Math.sin(angle) * startRad;
        const endX = cx + Math.cos(angle) * endRad;
        const endY = cy + Math.sin(angle) * endRad;
        
        ctx.beginPath();
        ctx.strokeStyle = `rgba(217, 119, 6, ${0.45 + (swell / 16)})`;
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.stroke();
    }
}

// Premium organic multi-wave visualization for assistant Speech synthesis output
function drawSpeakingVisual(ctx, cx, cy) {
    const waveCount = 4;
    
    for (let w = 0; w < waveCount; w++) {
        ctx.beginPath();
        // Purple violet color spectrum mapping
        ctx.lineWidth = 1.5 + (w * 0.8);
        ctx.strokeStyle = `rgba(139, 92, 246, ${0.8 - w * 0.18})`;
        
        const length = 130;
        const startX = cx - length / 2;
        ctx.moveTo(startX, cy);
        
        // Create voice-like organic sine movements
        const speedMultiplier = 1.5 + w * 0.5;
        const amp = 15 + Math.sin(state.visualizerPhase * speedMultiplier) * 12;
        
        for (let x = 0; x <= length; x += 8) {
            const currentX = startX + x;
            const phaseShift = state.visualizerPhase * (2.2 - w * 0.3);
            const freq = (x / length) * Math.PI * 2 * (1.8 + w * 0.3);
            const envelope = Math.sin((x / length) * Math.PI); // Pin the ends
            const currentY = cy + Math.sin(freq + phaseShift) * amp * envelope;
            
            ctx.lineTo(currentX, currentY);
        }
        ctx.stroke();
    }
}

// Voice synthesis speaker execution
function speakResponse(text) {
    if (!state.synthesis) return;
    
    // Stop speech recognition while speaking to avoid feedback loops
    if (state.recognition) {
        try { state.recognition.stop(); } catch(e) {}
    }
    
    // Cancel existing speaker queues
    state.synthesis.cancel();
    
    updateCallStatus('speaking');
    showAiSpeechBubble(text);
    addTranscriptToLog('ai', text);
    
    state.activeUtterance = new SpeechSynthesisUtterance(text);
    
    // Resolve output language
    const userSelectedLang = state.settings.language;
    let resolvedLang = userSelectedLang;
    
    if (userSelectedLang === 'auto') {
        resolvedLang = detectLanguage(text);
    } else {
        const detected = detectLanguage(text);
        if (detected !== 'en-US' && detected !== userSelectedLang) {
            resolvedLang = detected;
        }
    }
    
    state.activeUtterance.lang = resolvedLang;
    
    // Select Voice Name configuration
    let voiceObj = null;
    if (state.settings.voiceName) {
        const currentVoice = state.voices.find(v => v.name === state.settings.voiceName);
        if (currentVoice && currentVoice.lang.split('-')[0] === resolvedLang.split('-')[0]) {
            voiceObj = currentVoice;
        }
    }
    
    if (!voiceObj) {
        voiceObj = findBestVoice(resolvedLang);
    }
    
    if (voiceObj) {
        state.activeUtterance.voice = voiceObj;
    }
    
    state.activeUtterance.rate = state.settings.speed;
    state.activeUtterance.pitch = state.settings.pitch;
    
    // Web Speech Events
    state.activeUtterance.onend = () => {
        state.activeUtterance = null;
        console.log("Speaker finished playing.");
        
        // Resume Listening continuously if call remains connected
        if (state.status === 'speaking') {
            updateCallStatus('listening');
            if (!state.isMuted) {
                restartListeningSafely();
            }
        }
    };
    
    state.activeUtterance.onerror = (e) => {
        console.warn("Speech Synthesis Error: ", e);
        if (state.status === 'speaking') {
            updateCallStatus('listening');
            if (!state.isMuted) {
                restartListeningSafely();
            }
        }
    };
    
    state.synthesis.speak(state.activeUtterance);
}

// Step 4: Process Speech with Gemini or Simulated Fallback
async function processUserSpeech(speechText) {
    updateCallStatus('thinking');
    
    const isApiKeyConfigured = state.settings.apiKey !== '';
    const activeMode = state.settings.mode;
    
    // Determine whether to execute live API or run local demo responses
    const runLiveAPI = (activeMode === 'api') || (activeMode === 'auto' && isApiKeyConfigured);
    
    if (runLiveAPI) {
        try {
            await queryGeminiAPI(speechText);
        } catch (err) {
            console.error("Gemini Query Failed: ", err);
            speakResponse(getGeminiErrorMessage(err));
        }
    } else {
        // Run Simulated Demo response
        const personaKey = state.settings.persona;
        const lang = state.settings.language;
        let choices = DEMO_RESPONSES[personaKey] || DEMO_RESPONSES.assistant;
        
        if (lang === 'hi-IN' || lang === 'te-IN') {
            const langChoices = LOCALIZED_DEMO_RESPONSES[lang];
            if (langChoices) {
                choices = langChoices[personaKey] || langChoices.assistant;
            }
        }
        
        // Pick random response
        const randIndex = Math.floor(Math.random() * choices.length);
        const reply = choices[randIndex];
        
        // Add latency simulations so it feels like thinking
        setTimeout(() => {
            if (state.status === 'thinking') {
                speakResponse(reply);
            }
        }, 1200 + Math.random() * 800);
    }
}

// Fetch analysis from Gemini API
function getGeminiErrorMessage(err) {
    const message = err?.message || '';
    
    if (message.includes('API key not valid') || message.includes('API_KEY_INVALID')) {
        return "Your Gemini API key appears to be invalid. Open Settings and paste a key from Google AI Studio.";
    }
    if (message.includes('not found') || message.includes('no longer available')) {
        return "The AI model is outdated or unavailable. Please refresh the page and try again.";
    }
    if (message.includes('Failed to fetch') || message.includes('NetworkError')) {
        return "I could not reach the AI server. Please check your internet connection and try again.";
    }
    
    return "I apologize. Something went wrong while connecting to the AI server. Please check your API key in Settings and try again.";
}

async function queryGeminiAPI(userQuery) {
    const key = state.settings.apiKey;
    const persona = state.settings.persona;
    const personaConfig = PERSONAS[persona] || PERSONAS.assistant;
    
    // Format Conversation Context History
    // First, verify history structures, seed first if empty
    if (state.history.length === 0) {
        const greetingHello = getLanguageGreetingHello();
        const greetingText = getPersonaGreeting();
        state.history.push({
            role: 'user',
            parts: [{ text: greetingHello }]
        });
        state.history.push({
            role: 'model',
            parts: [{ text: greetingText }]
        });
    }
    
    // Append current user utterance to context history
    state.history.push({
        role: 'user',
        parts: [{ text: userQuery }]
    });
    
    // Restrict history sizing to avoid model token bloat
    if (state.history.length > 20) {
        // Keep initial guidelines and slice older contexts
        const instructions = state.history.slice(0, 2);
        const activeSegment = state.history.slice(state.history.length - 12);
        state.history = [...instructions, ...activeSegment];
    }
    
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${key}`;
    
    // Build system instruction and language directive
    const selectedLanguage = state.settings.language;
    let languageDirective = "";
    
    if (selectedLanguage === 'hi-IN') {
        languageDirective = "\nThe user has selected Hindi as the conversation language. Respond entirely in Hindi, using native Devanagari script (not romanized/transliterated text). Do not mix languages within a single response unless the user explicitly code-switches first.";
    } else if (selectedLanguage === 'te-IN') {
        languageDirective = "\nThe user has selected Telugu as the conversation language. Respond entirely in Telugu, using native Telugu script (not romanized/transliterated text). Do not mix languages within a single response unless the user explicitly code-switches first.";
    } else if (selectedLanguage === 'en-US' || selectedLanguage === 'en-IN') {
        languageDirective = "\nThe user has selected English as the conversation language. Respond entirely in English.";
    } else {
        languageDirective = "\nRespond in the same language and native script the user speaks in (English, Hindi, or Telugu). Do not mix scripts or transliterate.";
    }
    
    const systemInstructionsText = `${personaConfig.instructions}${languageDirective}`;
    
    const requestBody = {
        contents: state.history,
        systemInstruction: {
            parts: [{ text: systemInstructionsText }]
        },
        generationConfig: {
            maxOutputTokens: 120, // Keep responses short for speech
            temperature: 0.7
        }
    };
    
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
    });
    
    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
    }
    
    const data = await response.json();
    let replyText = "";
    
    try {
        replyText = data.candidates[0].content.parts[0].text.trim();
    } catch(e) {
        console.error("Failed to parse Gemini response payload.", data);
        replyText = "Sorry, I had trouble parsing that instruction. Could you repeat it?";
    }
    
    // Append model reply to history
    state.history.push({
        role: 'model',
        parts: [{ text: replyText }]
    });
    
    // Execute voice output
    speakResponse(replyText);
}

// Manual Text Keypad response sending
function submitKeypadMessage() {
    const textarea = document.getElementById('keypadTextarea');
    const text = textarea.value.trim();
    if (!text) return;
    
    toggleModal('keypadModal', false);
    
    // Insert into user speech flow immediately
    showUserSpeechBubble(text);
    addTranscriptToLog('user', text);
    
    // Trigger response processing
    processUserSpeech(text);
}

// Append conversation transcript lines to Drawer history logs
function addTranscriptToLog(sender, text) {
    const container = document.getElementById('transcriptContainer');
    if (!container) return;
    
    // Remove empty drawer indicator if present
    const emptyMsg = container.querySelector('.empty-transcript-message');
    if (emptyMsg) {
        container.removeChild(emptyMsg);
    }
    
    const logItem = document.createElement('div');
    logItem.className = `chat-log-item ${sender}`;
    
    const nameLabel = sender === 'user' ? 'You' : (PERSONAS[state.settings.persona]?.name || 'Aether AI');
    
    logItem.innerHTML = `
        <span class="chat-log-sender">${nameLabel}</span>
        <p class="chat-log-text">${text}</p>
    `;
    
    container.appendChild(logItem);
    
    // Scroll container to bottom
    container.scrollTop = container.scrollHeight;
}

// Clear all active logs
function clearCallLogs() {
    const container = document.getElementById('transcriptContainer');
    if (!container) return;
    
    container.innerHTML = `
        <div class="empty-transcript-message">
            <i data-lucide="message-square-dashed"></i>
            <p>No call history yet. Start a call to begin speaking.</p>
        </div>
    `;
    lucide.createIcons();
    
    // Also reset active call history context
    state.history = [];
}

// Multilingual Helper Functions

// Set conversation language and update DOM / Recognition / Voices
function setLanguage(lang) {
    state.settings.language = lang;
    localStorage.setItem('aether_language', lang);
    
    const headerSelect = document.getElementById('headerLanguageSelect');
    const settingsSelect = document.getElementById('settingsLanguageSelect');
    if (headerSelect) headerSelect.value = lang;
    if (settingsSelect) settingsSelect.value = lang;
    
    // Update browser compatibility warning
    updateLanguageWarning(lang);
    
    // Look up saved voice for this language
    const savedVoice = localStorage.getItem('aether_voice_' + lang);
    if (savedVoice) {
        state.settings.voiceName = savedVoice;
        localStorage.setItem('aether_voice', savedVoice);
    } else {
        state.settings.voiceName = '';
        localStorage.setItem('aether_voice', '');
    }
    
    updateRecognitionLanguage(lang);
    loadVoices();
}

// Check browser language support
function isLanguageSupported(lang) {
    if (lang === 'en-US' || lang === 'en-IN' || lang === 'auto') return true;
    
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    const isFirefox = navigator.userAgent.toLowerCase().includes('firefox');
    
    if (isSafari || isFirefox) {
        return false;
    }
    
    return true;
}

// Update UI warning badge visibility
function updateLanguageWarning(lang) {
    const warnIcon = document.getElementById('langUnsupportedWarn');
    if (!warnIcon) return;
    
    if (!isLanguageSupported(lang)) {
        warnIcon.classList.remove('hidden');
    } else {
        warnIcon.classList.add('hidden');
    }
}

// Map language codes to names
function getLanguageName(lang) {
    switch (lang) {
        case 'en-US': return 'English (US)';
        case 'en-IN': return 'English (India)';
        case 'hi-IN': return 'Hindi';
        case 'te-IN': return 'Telugu';
        case 'ta-IN': return 'Tamil';
        case 'bn-IN': return 'Bengali';
        case 'es-ES': return 'Spanish';
        case 'fr-FR': return 'French';
        case 'de-DE': return 'German';
        case 'it-IT': return 'Italian';
        case 'pt-BR': return 'Portuguese';
        case 'ja-JP': return 'Japanese';
        case 'zh-CN': return 'Chinese';
        case 'ko-KR': return 'Korean';
        case 'ar-SA': return 'Arabic';
        case 'ru-RU': return 'Russian';
        case 'nl-NL': return 'Dutch';
        case 'tr-TR': return 'Turkish';
        case 'auto': return 'Auto-detect';
        default: return lang;
    }
}

// Get the user's initial greeting phrase in their chosen language
function getLanguageGreetingHello() {
    const lang = state.settings.language;
    if (lang === 'hi-IN') return "नमस्ते";
    if (lang === 'te-IN') return "నమస్తే";
    if (lang === 'ta-IN') return "வணக்கம்";
    if (lang === 'bn-IN') return "নমস্কার";
    if (lang === 'es-ES') return "Hola";
    if (lang === 'fr-FR') return "Bonjour";
    if (lang === 'de-DE') return "Hallo";
    if (lang === 'it-IT') return "Ciao";
    if (lang === 'pt-BR') return "Olá";
    if (lang === 'ja-JP') return "こんにちは";
    if (lang === 'zh-CN') return "你好";
    if (lang === 'ko-KR') return "안녕하세요";
    if (lang === 'ar-SA') return "مرحبًا";
    if (lang === 'ru-RU') return "Здравствуйте";
    if (lang === 'nl-NL') return "Hallo";
    if (lang === 'tr-TR') return "Merhaba";
    return "Hello";
}

// Detect language of text using script proportional thresholds
function detectLanguage(text) {
    if (!text) return 'en-US';
    const devanagari = (text.match(/[\u0900-\u097F]/g) || []).length;
    const telugu = (text.match(/[\u0C00-\u0C7F]/g) || []).length;
    const tamil = (text.match(/[\u0B80-\u0BFF]/g) || []).length;
    const bengali = (text.match(/[\u0980-\u09FF]/g) || []).length;
    const hangul = (text.match(/[\uAC00-\uD7AF\u1100-\u11FF]/g) || []).length;
    const hiraganaKatakana = (text.match(/[\u3040-\u30FF]/g) || []).length;
    const hanzi = (text.match(/[\u4E00-\u9FFF]/g) || []).length;
    const arabic = (text.match(/[\u0600-\u06FF]/g) || []).length;
    const cyrillic = (text.match(/[\u0400-\u04FF]/g) || []).length;
    const total = text.replace(/\s/g, '').length || 1;
    if (devanagari / total > 0.15) return 'hi-IN';
    if (telugu / total > 0.15) return 'te-IN';
    if (tamil / total > 0.15) return 'ta-IN';
    if (bengali / total > 0.15) return 'bn-IN';
    if (hangul / total > 0.15) return 'ko-KR';
    if (hiraganaKatakana / total > 0.1) return 'ja-JP';
    if (hanzi / total > 0.15) return 'zh-CN';
    if (arabic / total > 0.15) return 'ar-SA';
    if (cyrillic / total > 0.15) return 'ru-RU';
    return 'en-US';
}

// Find best speech voice using a ranked fallback chain
function findBestVoice(langCode) {
    const base = langCode.split('-')[0]; // 'hi', 'te', 'en'
    
    // 1. Try local voices matching exact langCode
    let voice = state.voices.find(v => v.lang === langCode && v.localService === true) ||
                state.voices.find(v => v.lang === langCode);
                
    // 2. Try local voices starting with base prefix
    if (!voice) {
        voice = state.voices.find(v => v.lang.startsWith(base) && v.localService === true) ||
                state.voices.find(v => v.lang.startsWith(base));
    }
    
    // 3. Try any voice with base prefix in name
    if (!voice) {
        voice = state.voices.find(v => v.name.toLowerCase().includes(base));
    }
    
    // 4. Try browser default voice
    if (!voice) {
        voice = state.voices.find(v => v.default);
    }
    
    // 5. Fallback to first available voice
    if (!voice && state.voices.length > 0) {
        voice = state.voices[0];
    }
    
    // If no matching voice exists at all, display info toast
    const hasLangPrefix = state.voices.some(v => v.lang.startsWith(base) || v.name.toLowerCase().includes(base));
    if (!hasLangPrefix && langCode !== 'en-US') {
        const langName = getLanguageName(langCode);
        console.warn(`No voice matches language code ${langCode}`);
        showToast(`No speech synthesis voice found for ${langName} on your system. Using default voice.`, 'info');
    }
    
    return voice;
}

// Update voice select dropdown content
function updateVoiceDropdown(lang) {
    const voiceSelect = document.getElementById('voiceSelect');
    if (!voiceSelect) return;
    
    voiceSelect.innerHTML = '';
    
    const base = lang.split('-')[0];
    let displayList = state.voices.filter(v => v.lang.startsWith(base) || v.lang.toLowerCase().includes(base));
    
    if (displayList.length === 0) {
        displayList = state.voices;
    }
    
    displayList.forEach(voice => {
        const option = document.createElement('option');
        option.value = voice.name;
        option.textContent = `${voice.name} (${voice.lang})`;
        if (voice.name === state.settings.voiceName) {
            option.selected = true;
        }
        voiceSelect.appendChild(option);
    });
    
    const currentVoice = displayList.find(v => v.name === state.settings.voiceName);
    if (!currentVoice && displayList.length > 0) {
        const preferredVoice = displayList.find(v => v.name.includes('Google') || v.name.includes('Natural') || v.localService) || displayList[0];
        state.settings.voiceName = preferredVoice.name;
        localStorage.setItem('aether_voice', preferredVoice.name);
        if (lang !== 'auto') {
            localStorage.setItem('aether_voice_' + lang, preferredVoice.name);
        }
        voiceSelect.value = preferredVoice.name;
    }
}

// Update Speech Recognition language safely
function updateRecognitionLanguage(lang) {
    if (state.recognition) {
        if (state.status === 'listening') {
            isRestarting = true;
            state.recognition.stop();
        } else {
            state.recognition.lang = lang;
        }
    }
}

// Render dynamic glassmorphic toast alerts inside the card
function showToast(message, type = 'error') {
    let container = document.querySelector('.toast-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'toast-container';
        document.querySelector('.calling-card').appendChild(container);
    }
    
    const toast = document.createElement('div');
    toast.className = `toast-message ${type}`;
    
    const iconName = type === 'error' ? 'alert-triangle' : 'info';
    toast.innerHTML = `
        <i data-lucide="${iconName}"></i>
        <span>${message}</span>
    `;
    container.appendChild(toast);
    lucide.createIcons();
    
    // Remove after 4 seconds
    setTimeout(() => {
        toast.style.animation = 'toastFadeOut 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards';
        setTimeout(() => {
            toast.remove();
            if (container.children.length === 0) {
                container.remove();
            }
        }, 400);
    }, 4000);
}

// Localized Simulated responses for Demo mode
const LOCALIZED_DEMO_RESPONSES = {
    'hi-IN': {
        assistant: [
            "मैं यहाँ आपकी सहायता के लिए हूँ। आपका दिन कैसा चल रहा है?",
            "यह दिलचस्प है। मुझे इसके बारे में और बताएं।",
            "बेशक, मैं इसमें आपकी मदद कर सकता हूँ। क्या आपको कुछ और जानना है?",
            "मैं सुन रहा हूँ। कृपया जारी रखें।",
            "मैं बहुत अच्छा कर रहा हूँ, पूछने के लिए धन्यवाद! मैं आपके लिए क्या कर सकता हूँ?"
        ],
        coach: [
            "यह एक चुनौती जैसा लगता है, लेकिन मुझे पता है कि आपके पास इसे पार करने की ताकत है। आज आप क्या छोटा कदम उठा सकते हैं?",
            "अपनी प्रगति पर ध्यान दें, पूर्णता पर नहीं। आप बहुत अच्छा कर रहे हैं!",
            "हर छोटी जीत मायने रखती है। आगे बढ़ते रहें, मैं आपके साथ हूँ!",
            "यह आपको कैसा महसूस कराता है? खुद को अपने मूल लक्ष्य की याद दिलाएं।",
            "अपने आप पर विश्वास रखें। आपके पास अद्वितीय ताकत है।"
        ],
        tutor: [
            "आपकी भाषा बहुत स्वाभाविक लग रही है। बस ऐसे ही बोलते रहें!",
            "उत्कृष्ट वाक्य संरचना! चलिए थोड़ा और विस्तार से बोलने का प्रयास करते हैं।",
            "मैं आपको पूरी तरह से समझ गया। अभ्यास करते रहें!",
            "अभ्यास ही परिपूर्ण बनाता है। बात करने के लिए आपका पसंदीदा विषय क्या है?",
            "यह बहुत आम बात है। चलिए साथ में अभ्यास करते हैं।"
        ],
        interviewer: [
            "उसे साझा करने के लिए धन्यवाद। क्या आप मुझे एक उदाहरण दे सकते हैं जब आपने टीम में किसी विवाद को सुलझाया था?",
            "यह एक ठोस जवाब है। आप हमारी कंपनी में इस भूमिका के लिए क्यों रुचि रखते हैं?",
            "दिलचस्प पृष्ठभूमि। आप अपनी सबसे बड़ी तकनीकी ताकत क्या कहेंगे?",
            "आप काम के दबाव या कठिन समय-सीमा को कैसे संभालते हैं?",
            "उत्कृष्ट। क्या आपके पास मेरे लिए इस भूमिका या टीम के बारे में कोई प्रश्न हैं?"
        ],
        geek: [
            "क्या आपने इसे बंद करके फिर से चालू करने का प्रयास किया है? यह अधिकांश त्रुटियों को ठीक करता है।",
            "अरे बाप रे! ऐसा लगता है कि आपके सिस्टम में कोई समस्या है। चलिए इसे मिलकर ठीक करते हैं।",
            "मेरे सेंसर इष्टतम नेटवर्क गति का पता लगाते हैं। आज हम किस सॉफ़्टवेयर पर काम कर रहे हैं?",
            "सावधान रहें! बस मज़ाक कर रहा हूँ। क्या खराबी लग रही है?",
            "जांच चल रही है... हाँ, सब कुछ ठीक लग रहा है! आगे क्या?"
        ]
    },
    'te-IN': {
        assistant: [
            "నేను మీకు సహాయం చేయడానికి ఇక్కడ ఉన్నాను. ఈరోజు మీ రోజు ఎలా సాగుతోంది?",
            "అది ఆసక్తికరంగా ఉంది. ఈరోజు మీరు దేనిపై పని చేస్తున్నారో నాకు మరింత చెప్పండి.",
            "ఖచ్చితంగా, నేను మీకు సహాయం చేయగలను. మీరు తెలుసుకోవలసినది ఇంకేదైనా ఉందా?",
            "నేను వింటున్నాను. దయచేసి కొనసాగించండి.",
            "నేను చాలా బాగున్నాను, అడిగినందుకు ధన్యవాదాలు! నేను మీ కోసం ఏమి చేయగలను?"
        ],
        coach: [
            "అది ఒక సవాలుగా అనిపిస్తుంది, కానీ దానిని అధిగమించగల శక్తి మీకు ఉందని నాకు తెలుసు. ఈరోజు మీరు తీసుకోగల చిన్న అడుగు ఏమిటి?",
            "మీ పురోగతిపై దృష్టి పెట్టండి, పరిపూర్ణతపై కాదు. మీరు చాలా బాగా చేస్తున్నారు!",
            "ప్రతి చిన్న విజయం ముఖ్యమే. ముందుకు సాగండి, నేను మీకు మద్దతుగా ఉన్నాను!",
            "అది మీకు ఎలా అనిపిస్తుంది? మీ అసలు లక్ష్యాన్ని గుర్తుంచుకోండి.",
            "మిమ్మల్ని మీరు నమ్మండి. ఏదైనా అడ్డంకిని అధిగమించగల ప్రత్యేక బలాలు మీ వద్ద ఉన్నాయి."
        ],
        tutor: [
            "మీ ఇంగ్లీష్ చాలా సహజంగా ఉంది. ఇలాగే మాట్లాడటం కొనసాగించండి!",
            "అద్భుతమైన వాక్య నిర్మాణం! ఇంకా కాస్త వివరంగా మాట్లాడటానికి ప్రయత్నిద్దాం.",
            "నేను మిమ్మల్ని సంపూర్ణంగా అర్థం చేసుకున్నాను. మరింత ప్రాక్టీస్ చేద్దాం.",
            "సాధనతోనే పరిపూర్ణత లభిస్తుంది. మాట్లాడటానికి మీ ఇష్టమైన అలవాటు ఏమిటి?",
            "అది చాలా సాధారణమైన పదం. కలిసి ప్రాక్టీస్ చేద్దాం."
        ],
        interviewer: [
            "అది పంచుకున్నందుకు ధన్యవాదాలు. మీరు టీమ్‌లో వివాదాన్ని పరిష్కరించిన సమయానికి ఒక ఉదాహరణ ఇవ్వగలరా?",
            "అది సరైన సమాధానం. ఈ పాత్ర కోసం మా కంపెనీలో చేరడానికి మీకు ఎందుకు ఆసక్తి ఉంది?",
            "ఆసక్తికరమైన నేపథ్యం. మీ అతిపెద్ద సాంకేతిక బలం ఏమిటి?",
            "సమయ పరిమితులు లేదా ఒత్తిడితో కూడిన వాతావరణంలో పని చేయడాన్ని మీరు ఎలా హ్యాండిల్ చేస్తారు?",
            "అద్భుతం. ఈ పాత్ర లేదా బృందం గురించి నన్ను అడగడానికి మీకు ఏవైనా ప్రశ్నలు ఉన్నాయా?"
        ],
        geek: [
            "మీరు దీన్ని ఆఫ్ చేసి మళ్లీ ఆన్ చేయడానికి ప్రయత్నించారా? అది 90% సమస్యలను పరిష్కరిస్తుంది.",
            "అయ్యో! మీ సిస్టమ్‌లో ఏదో సమస్య ఉన్నట్లుంది. కలిసి దాన్ని పరిష్కరిద్దాం.",
            "నా సెన్సార్లు సరైన నెట్‌వర్క్ వేగాన్ని గుర్తిస్తున్నాయి. ఈరోజు మనం ఏ సాఫ్ట్‌వేర్ ప్లాన్ చేస్తున్నాము?",
            "జాగ్రత్త! ఊరికే అన్నాను. సమస్య ఏమిటి?",
            "సమస్యను తనిఖీ చేస్తున్నాను... అవును, అంతా బాగుంది! తదుపరి ఏమిటి?"
        ]
    }
};
