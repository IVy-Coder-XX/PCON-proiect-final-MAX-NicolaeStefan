const Max = require("max-api");
const dgram = require("dgram");

const udp = dgram.createSocket("udp4");

// -------------------- CONFIG --------------------
let ip = "192.168.1.205";
let port = 4048;
let leds = 60;

// -------------------- STATE --------------------
let r = 0;
let g = 0;
let b = 0;

const MAX = 255;

// -------------------- SEND DDP --------------------
function send() {
    const packet = Buffer.alloc(10 + leds * 3);

    packet[0] = 0x41; // version + push
    packet[1] = 0;
    packet[2] = 0xFF; // raw RGB
    packet[3] = 1;

    packet.writeUInt32BE(0, 4);
    packet.writeUInt16BE(leds * 3, 8);

    for (let i = 0; i < leds; i++) {
        const o = 10 + i * 3;
        packet[o] = r;
        packet[o + 1] = g;
        packet[o + 2] = b;
    }

    udp.send(packet, port, ip);
}

// -------------------- KICK --------------------

Max.addHandler("kick", (vel = 100) => {
    const intensity = Math.min(255, vel * 2);

    r = Math.min(MAX, r + intensity);
    g = 0;
    b = 0;

    send();
    Max.outlet("kick", r);
});

// -------------------- SNARE --------------------

Max.addHandler("snare", (vel = 127) => {
    const brightness = Math.min(255, 150 + vel);

    r = brightness;
    g = brightness;
    b = brightness;

    send();

    // fast white burst decay
    setTimeout(() => {
        g = 0;
        b = 0;
        send();
    }, 70);

    Max.outlet("snare");
});

// -------------------- GLOBAL DECAY LOOP --------------------
setInterval(() => {
    
    r = Math.max(0, r - 4);

    
    g = 0;
    b = 0;

    send();
}, 40);

// -------------------- CONFIG MESSAGES --------------------
Max.addHandler("ip", v => ip = String(v));
Max.addHandler("port", v => port = Number(v));
Max.addHandler("leds", v => leds = Number(v));

// -------------------- RESET --------------------
Max.addHandler("reset", () => {
    r = g = b = 0;
    send();
});

// -------------------- READY --------------------
Max.post("WLED kick/snare visual engine ready");
Max.outlet("ready");