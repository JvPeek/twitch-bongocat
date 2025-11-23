let midiAccess = null;
let midiOutput = null;

function getMidiChannel(key) {

  if (key === undefined || key === null) { return "0"; }
  const s = String(key).toLowerCase().trim();
  // enthält Ziffern 1-7 -> Kanal 1
  if (/[1-7]/.test(s)) { return "0"; }

  // enthält q, w, e, r, t, z oder u -> Kanal 2
  if (/[qwertyu]/.test(s)) { return "1"; }

  // enthält xcbn -> Kanal 10
  if (/[asdfgxcbn]/.test(s)) { return "9"; }

  // sonst Kanal 2
  return "2"; s
}

function getMidiNote(Key) {
  if (Key === undefined || Key === null) { return null; }
  const s = String(Key).trim();
  let halftone = 0;

  // finde erste Ziffer 1-7
  const m = s.match(/[1-7]/);
  if (m) {
    const map = { '1': '60', '2': '62', '3': '64', '4': '65', '5': '67', '6': '69', '7': '71' };
    if (s.match(/#/)) {
      halftone = 1;
    }
    if (s.match(/V/)) {
      return Number(map[m[0]]) - 12 + halftone;
    }
    if (s.match(/\^/)) {
      return Number(map[m[0]]) + 12 + halftone;
    }
    return map[m[0]];
  }
  // find first letter in QWERTZU 
  const n = s.match(/[QWERTYU]/);
  if (n) {
    const map = { 'Q': '60', 'W': '62', 'E': '64', 'R': '65', 'T': '67', 'Y': '69', 'U': '71' };
    if (s.match(/#/)) {
      halftone = 1;
    }
    if (s.match(/V/)) {
      return Number(map[n[0]]) - 12 + halftone;
    }
    if (s.match(/\^/)) {
      return Number(map[n[0]]) + 12 + halftone;
    }
    return map[n[0]];
  }
  // find first letter in XCBN
  const b = s.match(/[ASDFGXCBN]/);
  if (b) {
    const map = { 'A': '50', 'S': '45', 'D': '56', 'F': '49', 'G': '54', 'X': '36', 'C': '40', 'B': '42', 'N': '46' };
    return map[b[0]];
  }
  return null;
}

function initMidi() {
  if (!navigator.requestMIDIAccess) {
    console.warn("Web MIDI API wird von diesem Browser nicht unterstützt.");
    return;
  }
  if (midiAccess) { return; }

  navigator.requestMIDIAccess({ sysex: false })
    .then(access => {
      midiAccess = access;
      updateMidiOutput();
      midiAccess.onstatechange = () => {
        updateMidiOutput();
      };
    })
    .catch(err => {
      console.warn("Fehler beim Initialisieren von WebMIDI:", err);
    });
}

function updateMidiOutput() {
  if (!midiAccess) { return; }
  const outputs = Array.from(midiAccess.outputs.values());
  if (outputs.length > 0) {
    midiOutput = outputs[0];
    console.log("MIDI output selected:", midiOutput.name || midiOutput.id);
  }
  else {
    midiOutput = null;
    console.log("Kein MIDI-Output verfügbar.");
  }
}

/**
 * Spielt eine MIDI-Note über Web MIDI.
 * note kann Zahl oder string sein; channel optional (default 0).
 * Anmerkung: NoteOff wird ~750ms nach NoteOn gesendet (wie vorher).
 */
function playMidi(note)
{
    
  const n = Number(getMidiNote(note));
  const ch = Number(getMidiChannel(note));
  //const ch = (typeof channel === "number" && !isNaN(channel)) ? (channel & 0x0f) : 0;
  if (isNaN(n)) {
    return;
  }

  if (!midiAccess) {
    initMidi();
  }

  if (!midiOutput) {
    // Falls noch kein Output bekannt ist, versuchen wir kurz später erneut
    // (initialisierung asynchron). Keine Fehlerausgabe jedes Mal, nur einmal.
    console.warn("Kein MIDI-Output bereit, versuche Initialisierung.");
    return;
  }

  const now = window.performance.now();
  const noteOn = 0x90 | ch;
  const noteOff = 0x80 | ch;
  const velocity = 127;

  try {
    // send(message, timestamp) - timestamp in DOMHighResTimeStamp (ms)
    midiOutput.send([noteOn, n & 0x7f, velocity], now);
    midiOutput.send([noteOff, n & 0x7f, 0], now + 750); // 0.75s wie vorher
    console.log(`MIDI NoteOn gesendet: Note ${n}, Kanal ${ch}`);

  }

  catch (err) {
    console.warn("Fehler beim Senden von MIDI-Nachrichten:", err);
  }
}

export {playMidi};