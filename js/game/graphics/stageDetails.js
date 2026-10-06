/** Deterministic geometry: no allocations of textures and no random flicker. */
export function drawStageDepth(c, s, time, camera, fx) {
    c.save();
    c.translate(-camera * .12, 0);
    c.fillStyle = s.sky[0];
    for (let i = -1; i < 18; i++) {
        const x = i * 86, top = 270 + ((i * 43 + 311) % 130);
        c.fillRect(x, top, 66, 620 - top);
        c.fillStyle = s.accent + '65';
        for (let row = 0; row < 3; row++)
            c.fillRect(x + 20, top + 30 + row * 45, 9, 18);
        c.fillStyle = s.sky[0];
    }
    c.restore();
    if (!fx)
        return;
    c.save();
    for (let i = 0; i < 4; i++) {
        const x = 160 + i * 310 - camera * .22;
        const glow = c.createLinearGradient(x, 150, x + 140, 600);
        glow.addColorStop(0, s.haze + '28');
        glow.addColorStop(1, s.haze + '00');
        c.fillStyle = glow;
        c.beginPath();
        c.moveTo(x, 120);
        c.lineTo(x + 190, 620);
        c.lineTo(x + 40, 620);
        c.closePath();
        c.fill();
    }
    for (let i = 0; i < 18; i++) {
        const x = ((i * 79 + Math.sin(time * .17 + i) * 32) % 1400) - 40;
        const y = 570 - ((i * 37 + time * (8 + i % 3)) % 360);
        c.fillStyle = s.haze + '80';
        c.fillRect(x, y, 2, 2);
    }
    c.restore();
}
export function drawStageTrim(c, s, time, fx) {
    c.save();
    // Masonry and rivets establish scale behind the fighters.
    c.strokeStyle = s.accent + '90';
    c.lineWidth = 1;
    for (const x of [180, 1040]) {
        for (let y = 225; y < 590; y += 42) {
            c.beginPath();
            c.moveTo(x, y);
            c.lineTo(x + 54, y);
            c.stroke();
            c.fillStyle = s.accent;
            c.fillRect(x + 6, y + 10, 3, 3);
            c.fillRect(x + 46, y + 10, 3, 3);
        }
    }
    for (let i = 0; i < 16; i++) {
        const x = i * 91 - 40, y = 640 + (i * 13 % 49);
        c.fillStyle = s.accent + '65';
        c.beginPath();
        c.moveTo(x, y);
        c.lineTo(x + 24, y - 3);
        c.lineTo(x + 41, y + 7);
        c.lineTo(x + 5, y + 9);
        c.closePath();
        c.fill();
    }
    if (fx) {
        for (const x of [130, 1150]) {
            const flicker = .8 + Math.sin(time * 7 + x) * .12;
            const g = c.createRadialGradient(x, 440, 2, x, 440, 90);
            g.addColorStop(0, s.haze + '90');
            g.addColorStop(1, s.haze + '00');
            c.fillStyle = g;
            c.fillRect(x - 90, 350, 180, 180);
            c.fillStyle = '#171018';
            c.fillRect(x - 6, 446, 12, 126);
            c.fillStyle = s.id === 'forest' ? '#85b985' : '#f7a568';
            c.beginPath();
            c.ellipse(x, 436, 6 * flicker, 17 * flicker, 0, 0, Math.PI * 2);
            c.fill();
        }
        c.fillStyle = s.haze + '18';
        for (let i = 0; i < 5; i++) {
            const x = ((time * 12 + i * 240) % 1500) - 80;
            c.beginPath();
            c.ellipse(x, 520 + Math.sin(time * 0.6 + i) * 8, 90, 18, 0, 0, Math.PI * 2);
            c.fill();
        }
    }
    c.restore();
}
/** Foreground silhouettes/ambient motion. Draw after fighters so the arena has real depth. */
export function drawStageForeground(c, s, time, camera, fx) {
    c.save();
    c.translate(-camera * 0.06, 0);
    // Dark near-camera masonry/terrain anchors the characters into the scene.
    c.fillStyle = '#050407aa';
    c.beginPath();
    c.moveTo(-80, 682);
    for (let x = -80; x <= 1360; x += 96) {
        const y = 674 + ((x * 17) % 19);
        c.lineTo(x, y);
    }
    c.lineTo(1360, 760);
    c.lineTo(-80, 760);
    c.closePath();
    c.fill();
    if (fx) {
        if (s.props === 'industrial' || s.props === 'fortress') {
            for (let i = 0; i < 8; i++) {
                const phase = (time * (120 + i * 7) + i * 173) % 900;
                const x = 90 + i * 165;
                const y = 610 - phase * 0.12;
                if (y < 450)
                    continue;
                c.fillStyle = i % 2 ? '#ffb15cbb' : '#e65b35aa';
                c.fillRect(x, y, 2 + (i % 2), 5 + (i % 3));
            }
        }
        else if (s.props === 'forest') {
            for (let i = 0; i < 7; i++) {
                const x = ((time * (16 + i) + i * 211) % 1500) - 80;
                const y = 560 + Math.sin(time * .8 + i) * 35;
                c.save();
                c.translate(x, y);
                c.rotate(time * .4 + i);
                c.fillStyle = i % 2 ? '#283a24aa' : '#172617bb';
                c.fillRect(-5, -2, 10, 4);
                c.restore();
            }
        }
        else if (s.props === 'prison') {
            c.strokeStyle = '#6ba1b055';
            c.lineWidth = 1;
            for (let i = 0; i < 6; i++) {
                const x = 130 + i * 215;
                const len = 24 + ((i * 13) % 28);
                const y = 570 + ((time * (18 + i * 2) + i * 91) % 80);
                c.beginPath();
                c.moveTo(x, y);
                c.lineTo(x, Math.min(690, y + len));
                c.stroke();
            }
        }
        else if (s.props === 'city') {
            for (let i = 0; i < 7; i++) {
                const x = ((time * (22 + i * 2) + i * 187) % 1450) - 40;
                const y = 650 - ((time * (32 + i * 4) + i * 61) % 120);
                c.fillStyle = i % 2 ? '#d76b44aa' : '#8f3529aa';
                c.fillRect(x, y, 2, 2);
            }
        }
        else {
            // Temple/cathedral/ruins: near-camera drifting ash/dust.
            for (let i = 0; i < 6; i++) {
                const x = ((time * (8 + i) + i * 233) % 1500) - 80;
                const y = 625 - ((time * (7 + i) + i * 49) % 120);
                c.fillStyle = s.haze + '45';
                c.beginPath();
                c.arc(x, y, 1.5 + (i % 2), 0, Math.PI * 2);
                c.fill();
            }
        }
    }
    // Foreground posts at the extreme edges add parallax without obscuring combat.
    c.fillStyle = '#070509dd';
    c.fillRect(-38, 430, 54, 310);
    c.fillRect(1264, 430, 54, 310);
    c.fillStyle = s.accent + '70';
    c.fillRect(-26, 446, 6, 210);
    c.fillRect(1296, 446, 6, 210);
    c.restore();
}
