// Setting global variables
var audioCtx;
var analyser;
var canvas;
var canvasContext;
var oscType = 'sine';
var globalGain;
const maxOverallGain = 0.8;
var activeOscillators = {}
const startButton = document.querySelector('#startButton')
const sineButton = document.querySelector('#sineButton')
const sawtoothButton = document.querySelector('#sawtoothButton')

// Hard-coding ADSR envelope 
var attackTime = 0.2;
var decayTime = 0.3;
var sustainTime = 0.3;
var releaseTime = 0.05;

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

const keyboardColorMap = {
    '90': 'red',     // Z - C
    '83': 'orange',  // S - C#
    '88': 'yellow',  // X - D
    '68': 'green',   // D - D#
    '67': 'blue',    // C - E
    '86': 'indigo',  // V - F
    '71': 'violet',  // G - F#
    '66': 'brown',   // B - G
    '72': 'pink',    // H - G#
    '78': 'purple',  // N - A
    '74': 'cyan',    // J - A#
    '77': 'teal',    // M - B
    '81': 'lime',    // Q - C
    '50': 'magenta', // 2 - C#
    '87': 'olive',   // W - D
    '51': 'coral',   // 3 - D#
    '69': 'silver',  // E - E
    '82': 'gold',    // R - F
    '53': 'orchid',  // 5 - F#
    '84': 'skyblue', // T - G
    '54': 'tomato',  // 6 - G#
    '89': 'navy',    // Y - A
    '55': 'salmon',  // 7 - A#
    '85': 'steelblue',// U - B
};

window.addEventListener('keydown', keyDown, false);
window.addEventListener('keyup', keyUp, false);

// Initializing audio context and oscillator waveform
startButton.addEventListener("click", initializeAudioContext); 
sineButton.addEventListener("click", () => setOscillatorWaveform('sine'));
sawtoothButton.addEventListener("click", () => setOscillatorWaveform('sawtooth'));

function initializeAudioContext() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }

    globalGain = audioCtx.createGain(); //this will control the volume of all notes
    globalGain.gain.setValueAtTime(0.8, audioCtx.currentTime)
    globalGain.connect(audioCtx.destination);

    analyser = audioCtx.createAnalyser();
    analyser.fftSize = 2048;
    // analyser.connect(audioCtx.destination);
    canvas = document.getElementById('waveformCanvas');
    canvasContext = canvas.getContext('2d');

    drawWaveform();
}

function setOscillatorWaveform(waveform) {
    oscType = waveform;
}

function keyDown(event) {
    const key = (event.detail || event.which).toString();
    if (keyboardFrequencyMap[key] && !activeOscillators[key]) {
      playNote(key);
      changeBackgroundColor(key);
    }
}

function keyUp(event) {
    const key = (event.detail || event.which).toString();
    if (keyboardFrequencyMap[key] && activeOscillators[key]) {
        const { osc, gainNode } = activeOscillators[key];
        gainNode.gain.cancelScheduledValues(audioCtx.currentTime);
        gainNode.gain.setTargetAtTime(0, audioCtx.currentTime, releaseTime);
        delete activeOscillators[key];
        canvasContext.clearRect(0, 0, canvas.width, canvas.height);
        canvasContext.lineWidth = 2;
        canvasContext.strokeStyle = 'rgb(0, 0, 0)';
        canvasContext.beginPath();
    }
    
}

function playNote(key) {
    const osc = audioCtx.createOscillator();
    osc.frequency.setValueAtTime(keyboardFrequencyMap[key], audioCtx.currentTime)
    osc.type = oscType; //choose your favorite waveform

    const gainNode = audioCtx.createGain();
    gainNode.gain.exponentialRampToValueAtTime(0.4, audioCtx.currentTime + attackTime); // Attack
    gainNode.gain.setTargetAtTime(0.2, audioCtx.currentTime + attackTime, decayTime); // Decay
    osc.connect(gainNode).connect(globalGain)
    osc.connect(analyser);
    osc.start();
    activeOscillators[key] = { osc, gainNode };

    updateGlobalGain();
}

function updateGlobalGain() {
    var gainSum = 0;
    for (const key in activeOscillators) {
        gainSum += activeOscillators[key].gainNode.gain.value;
    }
    const newGlobalGain = maxOverallGain / Math.max(1, gainSum);
    globalGain.gain.setValueAtTime(newGlobalGain, audioCtx.currentTime);
}

function changeBackgroundColor(key) {
    const color = keyboardColorMap[key];
    if (color) {
        document.body.style.backgroundColor = color;
    }
}

function drawWaveform() {
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyser.getByteTimeDomainData(dataArray);

    canvasContext.clearRect(0, 0, canvas.width, canvas.height);
    canvasContext.lineWidth = 2;
    canvasContext.strokeStyle = 'rgb(0, 0, 0)';
    canvasContext.beginPath();

    const sliceWidth = (canvas.width * 1.0) / bufferLength;
    let x = 0;

    for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = (v * canvas.height) / 2;

        if (i === 0) {
            canvasContext.moveTo(x, y);
        } else {
            canvasContext.lineTo(x, y);
        }

        x += sliceWidth;
    }

    canvasContext.lineTo(canvas.width, canvas.height / 2);
    canvasContext.stroke();

    requestAnimationFrame(drawWaveform);
}