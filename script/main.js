const points = [
    { x: -1, y: -1, z: -1 },
    { x: +1, y: -1, z: -1 },
    { x: +1, y: -1, z: +1 },
    { x: -1, y: -1, z: +1 },
    { x: -1, y: +1, z: -1 },
    { x: +1, y: +1, z: -1 },
    { x: +1, y: +1, z: +1 },
    { x: -1, y: +1, z: +1 }
];

const triangles = [
    { a: 1, b: 0, c: 2 },
    { a: 3, b: 2, c: 0 },
    { a: 4, b: 5, c: 6 },
    { a: 6, b: 7, c: 4 },
    { a: 0, b: 1, c: 4 },
    { a: 4, b: 1, c: 5 },
    { a: 1, b: 2, c: 5 },
    { a: 5, b: 2, c: 6 },
    { a: 2, b: 3, c: 6 },
    { a: 6, b: 3, c: 7 },
    { a: 3, b: 0, c: 7 },
    { a: 7, b: 0, c: 4 }
];

let taken = null;

const resize = () => {
    const clientWidth = document.documentElement.clientWidth;
    const clientHeight = document.documentElement.clientHeight;

    const canvasRatio = window.canvas.width / window.canvas.height;
    const clientRatio = clientWidth / clientHeight;

    if (canvasRatio > clientRatio) {
        window.canvas.style.width = '100%';
        window.canvas.style.height = clientWidth / canvasRatio + 'px';
    } else {
        window.canvas.style.width = 'auto';
        window.canvas.style.height = '100%';
    }
};

window.addEventListener('resize', resize);

const clockwise = (ax, bx, cx, ay, by, cy) => (bx - ax) * (cy - ay) - (by - ay) * (cx - ax) < 0;

const mat3product = (m1, m2) => {
    const result = [];

    for (let i = 0; i < 9; i += 3)
        for (let j = 0; j < 3; j++)
            result.push(m1[i] * m2[j] + m1[i + 1] * m2[j + 3] + m1[i + 2] * m2[j + 6]);

    return result;
};

const normal = (a, b, c) => {
    const v1 = {
        x: b.x - a.x,
        y: b.y - a.y,
        z: b.z - a.z
    };

    const v2 = {
        x: c.x - b.x,
        y: c.y - b.y,
        z: c.z - b.z
    };

    // Векторное произведение этих векторов даст направление
    const cross = {
        x: v1.y * v2.z - v1.z * v2.y,
        y: v1.z * v2.x - v1.x * v2.z,
        z: v1.x * v2.y - v1.y * v2.x
    };

    const length = Math.sqrt(cross.x * cross.x + cross.y * cross.y + cross.z * cross.z);

    // Нормаль - это нормализованное направление
    return {
        x: cross.x / length,
        y: cross.y / length,
        z: cross.z / length
    };
};

const colorize = factor => {
    const color = { r: 255, g: 100, b: 100 };

    const r = Math.round(color.r * factor).toString(16);
    const g = Math.round(color.g * factor).toString(16);
    const b = Math.round(color.b * factor).toString(16);

    let result = '#';

    result += (r.length == 1) ? '0' + r : r;
    result += (g.length == 1) ? '0' + g : g;
    result += (b.length == 1) ? '0' + b : b;

    return result;
};

document.addEventListener('DOMContentLoaded', () => {
    resize();

    const context = window.canvas.getContext('2d');

    const width = window.canvas.width;
    const height = window.canvas.height;
    const step = 350;

    let angle = { x: 0, y: 0 };
    let distance = 4;

    const updatePoint = (point, mat) => {
        return {
            x: point.x * mat[0] + point.y * mat[1] + point.z * mat[2],
            y: point.x * mat[3] + point.y * mat[4] + point.z * mat[5],
            z: point.x * mat[6] + point.y * mat[7] + point.z * mat[8] + distance
        };
    };

    const draw = () => {
        const sinX = Math.sin(angle.x);
        const cosX = Math.cos(angle.x);

        const sinY = Math.sin(angle.y);
        const cosY = Math.cos(angle.y);

        const matX = [
            cosX, 0, sinX,
            0, 1, 0,
           -sinX, 0, cosX
        ];

        const matY = [
            1, 0, 0,
            0, cosY, -sinY,
            0, sinY, cosY
        ];

        const mat = mat3product(matX, matY);

        context.clearRect(0, 0, width, height);

        triangles.forEach(triangle => {
            const a = updatePoint(points[triangle.a], mat);
            const b = updatePoint(points[triangle.b], mat);
            const c = updatePoint(points[triangle.c], mat);

            // step'ы только на этой стадии, чтобы не сбивать нормали
            const ax = width / 2 + step * a.x / a.z;
            const bx = width / 2 + step * b.x / b.z;
            const cx = width / 2 + step * c.x / c.z;

            const ay = height / 2 + step * a.y / a.z;
            const by = height / 2 + step * b.y / b.z;
            const cy = height / 2 + step * c.y / c.z;

            if (clockwise(ax, bx, cx, ay, by, cy)) return;

            const n = normal(a, b, c);

            const standard = { x: 0, y: 0, z: 1 };

            const dot = n.x * standard.x + n.y * standard.y + n.z * standard.z;

            const color = colorize(dot);

            context.fillStyle = color;
            context.strokeStyle = color;

            context.beginPath();

            context.moveTo(ax, ay);
            context.lineTo(bx, by);
            context.lineTo(cx, cy);
            context.closePath();

            context.stroke();
            context.fill();
        });

        requestAnimationFrame(draw);
    };

    document.addEventListener('wheel', event => {
        const offset = event.deltaY / 1000;

        if (distance - offset < 3) distance = 3;
        else if (distance - offset > 10) distance = 10;
        else distance -= offset;
    });

    document.addEventListener('mousedown', event => {
        taken = { x: event.clientX, y: event.clientY };
    });

    document.addEventListener('mousemove', event => {
        if ( ! taken) return;

        angle.x += (taken.x - event.clientX) / (window.innerWidth / 3);
        angle.y += (event.clientY - taken.y) / (window.innerHeight / 3);

        taken.x = event.clientX;
        taken.y = event.clientY;
    });

    document.addEventListener('mouseup', () => taken = null);

    draw();
});
