Konva.showWarnings = false;

const MAX_POINTS = 500;

const infoText = "Maximum points covered: ";
const manualInfoText = "Manually covered points: ";

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
})

const selectionRectangle = new Konva.Rect({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    fill: 'rgba(255, 0, 0, 0.3)',
    visible: false,
});

const manualDragDisc = new Konva.Circle({
    x: 0,
    y: 0,
    radius: 0,
    fill: 'rgba(0, 0, 255, 0.3)',
    visible: false,

})

class Painters {
    points = [];
    distances = new Array(MAX_POINTS).fill(0).map(() => new Array(MAX_POINTS).fill(0));
    temporaryDisc = null; /// TODO: For algorithm animations
    discRadius = 50;
    discX = -100;
    discY = -100;

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

        document.getElementById("score").innerHTML = infoText + '?';

        layer.draw();
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

function isPointInsideManualDisc(point) {
    const dx = point.x - manualDragDisc.x();
    const dy = point.y - manualDragDisc.y();
    return (dx * dx + dy * dy) <= (manualDragDisc.radius() * manualDragDisc.radius());
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
    document.getElementById("score").innerHTML = infoText + '?';
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
    document.getElementById("score").innerHTML = infoText + '?';
})

stage.on('click', function () {
    if (document.getElementById("insert-points-manual").checked) {
        const {x, y} = stage.getPointerPosition();
        master.points.push(new Point(x, y));
        master.masterDraw();
    }
});

let x1, y1, x2, y2;
let removeManual = document.getElementById('remove-points-manual');

stage.on('mousedown', (position) => {
    if (position.target === stage && removeManual.checked) {
        x1 = stage.getPointerPosition().x;
        y1 = stage.getPointerPosition().y;

        selectionRectangle.visible(true);

        selectionRectangle.width(0);
        selectionRectangle.height(0);
        selectionRectangle.position({x: x1, y: y1});

        layer.add(selectionRectangle);
        layer.draw();
    }
});


stage.on('mousemove', (e) => {
    let dragManual = document.getElementById('drag-disc-manual');

    if (dragManual.checked) {
        const {x, y} = stage.getPointerPosition();

        manualDragDisc.setAttrs({
            x: x,
            y: y,
            radius: master.discRadius,
        })
        manualDragDisc.visible(true);

        let count = 0;
        master.points.forEach((point) => {
            if (isPointInsideManualDisc(point))
                count++;
        });

        document.getElementById('manual-score').innerHTML = manualInfoText + count;

        layer.add(manualDragDisc);
        layer.batchDraw();
    } else {

        manualDragDisc.visible(false);

        if (!selectionRectangle.visible() || !removeManual.checked) return;

        x2 = stage.getPointerPosition().x;
        y2 = stage.getPointerPosition().y;

        selectionRectangle.setAttrs({
            x: Math.min(x1, x2),
            y: Math.min(y1, y2),
            width: Math.abs(x2 - x1),
            height: Math.abs(y2 - y1),
        });

        layer.batchDraw();
    }
});

stage.on('mouseup', () => {
    if (!selectionRectangle.visible() || !removeManual.checked) return;

    const selectionBox = selectionRectangle.getClientRect();

    master.points = master.points.filter((point) => {
        const isInside =
            point.x >= selectionBox.x &&
            point.x <= selectionBox.x + selectionBox.width &&
            point.y >= selectionBox.y &&
            point.y <= selectionBox.y + selectionBox.height;

        master.masterCount = 0;

        document.getElementById('score').innerHTML = infoText + '?';

        return !isInside;
    });

    selectionRectangle.visible(false);
    master.masterDraw();
});


master.masterDraw();