// Setting global variables
var audioCtx;
var oscType = 'sine';
var globalGain;
const maxOverallGain = 0.8;
var activeOscillators = {}
const playButton = document.querySelector('#playButton')
const sineButton = document.querySelector('#sineButton')
const sawtoothButton = document.querySelector('#sawtoothButton')

// Hard-coding ADSR envelope 
var attackTime = 0.1;
var decayTime = 0.3;
var sustainTime = 0.5;
var releaseTime = 0.4;

const keyboardFrequencyMap = {
    '90': 261.625565300598634,  //Z - C
    '83': 277.182630976872096, //S - C#
    '88': 293.664767917407560,  //X - D
    '68': 311.126983722080910, //D - D#
    '67': 329.627556912869929,  //C - E
    '86': 349.228231433003884,  //V - F
    '71': 369.994422711634398, //G - F#
    '66': 391.995435981749294,  //B - G
    '72': 415.304697579945138, //H - G#
    '78': 440.000000000000000,  //N - A
    '74': 466.163761518089916, //J - A#
    '77': 493.883301256124111,  //M - B
    '81': 523.251130601197269,  //Q - C
    '50': 554.365261953744192, //2 - C#
    '87': 587.329535834815120,  //W - D
    '51': 622.253967444161821, //3 - D#
    '69': 659.255113825739859,  //E - E
    '82': 698.456462866007768,  //R - F
    '53': 739.988845423268797, //5 - F#
    '84': 783.990871963498588,  //T - G
    '54': 830.609395159890277, //6 - G#
    '89': 880.000000000000000,  //Y - A
    '55': 932.327523036179832, //7 - A#
    '85': 987.766602512248223,  //U - B
}

window.addEventListener('keydown', keyDown, false);
window.addEventListener('keyup', keyUp, false);

// Initializing audio context and oscillator waveform
playButton.addEventListener("click", initializeAudioContext); 
sineButton.addEventListener("click", () => setOscillatorWaveform('sine'));
sawtoothButton.addEventListener("click", () => setOscillatorWaveform('sawtooth'));

function initializeAudioContext() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    globalGain = audioCtx.createGain(); //this will control the volume of all notes
    globalGain.gain.setValueAtTime(0.8, audioCtx.currentTime)
    globalGain.connect(audioCtx.destination);
}

function setOscillatorWaveform(waveform) {
    oscType = waveform;
}

function keyDown(event) {
    const key = (event.detail || event.which).toString();
    if (keyboardFrequencyMap[key] && !activeOscillators[key]) {
      playNote(key);
    }
}

function keyUp(event) {
    const key = (event.detail || event.which).toString();
    if (keyboardFrequencyMap[key] && activeOscillators[key]) {
        const { osc, gainNode } = activeOscillators[key];
        gainNode.gain.setTargetAtTime(0, audioCtx.currentTime, releaseTime);
        osc.stop();
        delete activeOscillators[key];
        updateGlobalGain();
    }
}

function playNote(key) {
    const osc = audioCtx.createOscillator();
    osc.frequency.setValueAtTime(keyboardFrequencyMap[key], audioCtx.currentTime)
    osc.type = oscType; //choose your favorite waveform

    const gainNode = audioCtx.createGain();
    gainNode.gain.exponentialRampToValueAtTime(0.4, audioCtx.currentTime + attackTime);
    gainNode.gain.setTargetAtTime(0.2, audioCtx.currentTime + attackTime, decayTime);
    gainNode.gain.setTargetAtTime(0, audioCtx.currentTime + attackTime + decayTime + sustainTime, releaseTime);

    osc.connect(gainNode).connect(globalGain)
    osc.start();
    activeOscillators[key] = { osc, gainNode };

    updateGlobalGain()   
}

function updateGlobalGain() {
    var gainSum = 0;
    for (const key in activeOscillators) {
        gainSum += activeOscillators[key].gainNode.gain.value;
    }
    const newGlobalGain = maxOverallGain / Math.max(1, gainSum);
    globalGain.gain.setValueAtTime(newGlobalGain, audioCtx.currentTime);
    console.log(gainSum, newGlobalGain);
}