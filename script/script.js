console.log(Konva);

const MAX_POINTS = 500;

const infoText = "Covered points: ";

const stage = new Konva.Stage({
    container: 'simulator-stage',
    width: 800,
    height: 600,
});

const border = new Konva.Rect({
    x: 0,
    y: 0,
    width: stage.width(),
    height: stage.height(),
    stroke: 'black',
    strokeWidth: 2,
    listening: false,
})

class Painters {
    points = [];
    distances = new Array(MAX_POINTS).fill(0).map(() => new Array(MAX_POINTS).fill(0));
    temporaryDisc = null; /// TODO: For algorithm animations
    discRadius = 50;
    discX = -100;
    discY = -100;
    manualDisc = null; /// TODO: For manual drag-and-dropping over the points

    masterCount = 0;

    masterDraw() {
        layer.destroyChildren();

        this.points.forEach((point) => {
            const circle = new Konva.Circle({
                x: point.x,
                y: point.y,
                radius: 5,
                fill: 'black',
            });
            layer.add(circle);
        });

        layer.add(new Konva.Circle({
            x: this.discX,
            y: this.discY,
            radius: this.discRadius,
            fill: "rgba(0, 255, 0, 0.3)"
        }))

        //layer.add(this.finalDisc);
        layer.add(border);

        document.getElementById("score").innerHTML = infoText + master.masterCount;

        layer.draw();
        console.log("MASTER DRAW");
    }

    drawTemporary(x, y) {
        layer.destroyChildren();
        this.points.forEach((point) => {
            const circle = new Konva.Circle({
                x: point.x,
                y: point.y,
                radius: 5,
                fill: 'black',
            });
            layer.add(circle);
        });

        layer.add(new Konva.Circle({
            x: x,
            y: y,
            radius: this.discRadius,
            fill: "rgba(0, 0, 255, 0.3)"
        }))

        //layer.add(this.finalDisc);

        layer.draw();
    }
}

class Point {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
    subtract(other) {
        return new Point(this.x - other.x, this.y - other.y);
    }
    magnitude() {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }
    arg() {
        return Math.atan2(this.y, this.x);
    }
}

function customCompare(A, B) {
    if (A[0] < B[0])
        return -1;
    else if (A[0] > B[0])
        return 1;
    else
        return A.second === 1 ? -1 : 1;
}

let master = new Painters();

const layer = new Konva.Layer();
stage.add(layer);

function getRandomInt(max) {
    return Math.floor(Math.random() * max);
}

function scatterPoints(numberOfPoints) {
    master.points = [];

    for (let i = 0; i < numberOfPoints; i++) {
        const x_coordinate = getRandomInt(stage.width());
        const y_coordinate = getRandomInt(stage.height());
        const newPoint = new Point(x_coordinate, y_coordinate);
        master.points.push(newPoint);
    }

    master.points.forEach((point) => {
        const circle = new Konva.Circle({
            x: point.x,
            y: point.y,
            radius: 5,
            fill: 'black',
        });
        layer.add(circle);
        console.log("added point");
    });

    master.masterCount = 0;
    document.getElementById("score").innerHTML = infoText + master.masterCount;
    master.masterDraw();
}

function getPointsInside(i, r, n) {
    let angles = [];
    const currX = master.points[i].x;
    const currY = master.points[i].y;

    for (let j = 0; j < n; j++) {
        if (i !== j && master.distances[i][j] <= 2 * r) {
            let B = Math.acos(master.distances[i][j] / (2 * r));
            let A = master.points[j].subtract(master.points[i]).arg();
            let alpha = A - B;
            let beta = A + B;
            angles.push([alpha, true]);
            angles.push([beta, false]);
        }
    }

    angles.sort(customCompare);

    let count = 1;
    let idx = 0;

    function animateStep() {
        if (idx >= angles.length) {
            //console.log("Completed processing for this point.");
            return;
        }

        const angle = angles[idx][0];
        const tmpX = currX + master.discRadius * Math.cos(angle);
        const tmpY = currY + master.discRadius * Math.sin(angle);

        if (angles[idx][1]) count++;
        else count--;

        if (count > master.masterCount) {
            master.masterCount = count;
            master.discX = tmpX;
            master.discY = tmpY;
        }

        //master.drawTemporary(tmpX, tmpY);
        master.masterDraw();
        document.getElementById("score").innerHTML = infoText + master.masterCount;

        idx++;
        setTimeout(animateStep, 500);
    }

    animateStep();
}


function maxPoints(n, r) {
    for (let i = 0; i < n - 1; i++) {
        for (let j = i + 1; j < n; j++) {
            master.distances[i][j] = master.distances[j][i] = master.points[i].subtract(master.points[j]).magnitude();
        }
    }

    for (let i = 0; i < n; i++) {
        getPointsInside(i, r, n);
    }

    master.masterDraw();
}

document.getElementById('optimize-button').addEventListener('click', () => {
    maxPoints(master.points.length, master.discRadius);
    console.log("RESULT:" + master.masterCount);
    master.masterDraw();
});

document.getElementById("scatter-points").addEventListener('click', () => {
    const input_num = document.getElementById('num-points').value;
    scatterPoints(input_num);
});

document.getElementById("clear-points").addEventListener('click', () => {
    layer.destroyChildren();
    master.points = [];
    master.masterCount = 0;
    master.masterDraw();
    document.getElementById("score").innerHTML = infoText + master.masterCount;
})

master.masterDraw();