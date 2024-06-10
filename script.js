const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
let startX, startY, endX, endY;
let mode = "";
let shapes = [];

canvas.addEventListener("mousedown", onMouseDown);
canvas.addEventListener("mouseup", onMouseUp);

function setMode(newMode) {
  mode = newMode;
}

function onMouseDown(event) {
  const { x, y } = getMousePos(event);
  startX = x;
  startY = y;
}

function onMouseUp(event) {
  const { x, y } = getMousePos(event);
  endX = x;
  endY = y;

  switch (mode) {
    case "lineDDA":
      shapes.push(new Line(startX, startY, endX, endY, "lineDDA"));
      break;
    case "lineBresenham":
      shapes.push(new Line(startX, startY, endX, endY, "lineBresenham"));
      break;
    case "circleMidpoint":
      const radius = Math.sqrt((endX - startX) ** 2 + (endY - startY) ** 2);
      shapes.push(new Circle(startX, startY, radius));
      break;
    case "ellipseMidpoint":
      const rx = Math.abs(endX - startX);
      const ry = Math.abs(endY - startY);
      shapes.push(new Ellipse(startX, startY, rx, ry));
      break;
  }
  redraw();
}

function getMousePos(event) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top,
  };
}

class Shape {
  constructor(type) {
    this.type = type;
    this.points = [];
  }

  draw() {}
  translate(dx, dy) {}
  rotate(angle, centerX, centerY) {}
  scale(sx, sy) {}
}

class Line extends Shape {
  constructor(x1, y1, x2, y2, algorithm) {
    super("line");
    this.x1 = x1;
    this.y1 = y1;
    this.x2 = x2;
    this.y2 = y2;
    this.algorithm = algorithm;
    this.points = [
      { x: x1, y: y1 },
      { x: x2, y: y2 },
    ];
  }

  draw() {
    if (this.algorithm === "lineDDA") {
      this.drawLineDDA();
    } else if (this.algorithm === "lineBresenham") {
      this.drawLineBresenham();
    }
  }

  drawLineDDA() {
    const dx = this.x2 - this.x1;
    const dy = this.y2 - this.y1;
    const steps = Math.max(Math.abs(dx), Math.abs(dy));
    const xIncrement = dx / steps;
    const yIncrement = dy / steps;
    let x = this.x1;
    let y = this.y1;
    for (let i = 0; i <= steps; i++) {
      ctx.fillRect(Math.round(x), Math.round(y), 1, 1);
      x += xIncrement;
      y += yIncrement;
    }
  }

  drawLineBresenham() {
    let dx = Math.abs(this.x2 - this.x1);
    let dy = Math.abs(this.y2 - this.y1);
    let sx = this.x1 < this.x2 ? 1 : -1;
    let sy = this.y1 < this.y2 ? 1 : -1;
    let err = dx - dy;

    while (true) {
      ctx.fillRect(this.x1, this.y1, 1, 1);
      if (this.x1 === this.x2 && this.y1 === this.y2) break;
      let e2 = 2 * err;
      if (e2 > -dy) {
        err -= dy;
        this.x1 += sx;
      }
      if (e2 < dx) {
        err += dx;
        this.y1 += sy;
      }
    }
  }

  translate(dx, dy) {
    this.x1 += dx;
    this.y1 += dy;
    this.x2 += dx;
    this.y2 += dy;
    this.updatePoints();
  }

  rotate(angle, centerX, centerY) {
    const rad = angle * (Math.PI / 180);
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);

    let x1 = this.x1 - centerX;
    let y1 = this.y1 - centerY;
    let x2 = this.x2 - centerX;
    let y2 = this.y2 - centerY;

    this.x1 = x1 * cos - y1 * sin + centerX;
    this.y1 = x1 * sin + y1 * cos + centerX;
    this.x2 = x2 * cos - y2 * sin + centerY;
    this.y2 = x2 * sin + y2 * cos + centerY;
    this.updatePoints();
  }

  scale(sx, sy) {
    this.x2 = this.x1 + (this.x2 - this.x1) * sx;
    this.y2 = this.y1 + (this.y2 - this.y1) * sy;
    this.updatePoints();
  }

  updatePoints() {
    this.points = [
      { x: this.x1, y: this.y1 },
      { x: this.x2, y: this.y2 },
    ];
  }
}

class Circle extends Shape {
  constructor(cx, cy, radius) {
    super("circle");
    this.cx = cx;
    this.cy = cy;
    this.radius = radius;
    this.points = this.calculatePoints();
  }

  draw() {
    this.drawCircleMidpoint();
  }

  drawCircleMidpoint() {
    let x = 0;
    let y = this.radius;
    let p = 1 - this.radius;
    this.plotCirclePoints(x, y);
    while (x < y) {
      x++;
      if (p < 0) {
        p += 2 * x + 1;
      } else {
        y--;
        p += 2 * (x - y) + 1;
      }
      this.plotCirclePoints(x, y);
    }
  }

  plotCirclePoints(x, y) {
    ctx.fillRect(this.cx + x, this.cy + y, 1, 1);
    ctx.fillRect(this.cx - x, this.cy + y, 1, 1);
    ctx.fillRect(this.cx + x, this.cy - y, 1, 1);
    ctx.fillRect(this.cx - x, this.cy - y, 1, 1);
    ctx.fillRect(this.cx + y, this.cy + x, 1, 1);
    ctx.fillRect(this.cx - y, this.cy + x, 1, 1);
    ctx.fillRect(this.cx + y, this.cy - x, 1, 1);
    ctx.fillRect(this.cx - y, this.cy - x, 1, 1);
  }

  translate(dx, dy) {
    this.cx += dx;
    this.cy += dy;
    this.points = this.calculatePoints();
  }

  rotate(angle, centerX, centerY) {
    const rad = angle * (Math.PI / 180);
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);

    let cx = this.cx - centerX;
    let cy = this.cy - centerY;

    this.cx = cx * cos - cy * sin + centerX;
    this.cy = cx * sin + cy * cos + centerX;
    this.points = this.calculatePoints();
  }

  scale(s) {
    this.radius *= s;
    this.points = this.calculatePoints();
  }

  calculatePoints() {
    const points = [];
    let x = 0;
    let y = this.radius;
    let p = 1 - this.radius;
    points.push({ x: this.cx + x, y: this.cy + y });
    while (x < y) {
      x++;
      if (p < 0) {
        p += 2 * x + 1;
      } else {
        y--;
        p += 2 * (x - y) + 1;
      }
      points.push({ x: this.cx + x, y: this.cy + y });
      points.push({ x: this.cx - x, y: this.cy + y });
      points.push({ x: this.cx + x, y: this.cy - y });
      points.push({ x: this.cx - x, y: this.cy - y });
      points.push({ x: this.cx + y, y: this.cy + x });
      points.push({ x: this.cx - y, y: this.cy + x });
      points.push({ x: this.cx + y, y: this.cy - x });
      points.push({ x: this.cx - y, y: this.cy - x });
    }
    return points;
  }
}

class Ellipse extends Shape {
  constructor(cx, cy, rx, ry) {
    super("ellipse");
    this.cx = cx;
    this.cy = cy;
    this.rx = rx;
    this.ry = ry;
    this.points = this.calculatePoints();
  }

  draw() {
    this.drawEllipseMidpoint();
  }

  drawEllipseMidpoint() {
    let rxSq = this.rx * this.rx;
    let rySq = this.ry * this.ry;
    let x = 0;
    let y = this.ry;
    let p1 = rySq - rxSq * this.ry + 0.25 * rxSq;
    this.plotEllipsePoints(x, y);

    while (2 * rySq * x <= 2 * rxSq * y) {
      x++;
      if (p1 < 0) {
        p1 += 2 * rySq * x + rySq;
      } else {
        y--;
        p1 += 2 * rySq * x - 2 * rxSq * y + rySq;
      }
      this.plotEllipsePoints(x, y);
    }

    let p2 =
      rySq * ((x + 0.5) * (x + 0.5)) + rxSq * ((y - 1) * (y - 1)) - rxSq * rySq;
    while (y >= 0) {
      this.plotEllipsePoints(x, y);
      if (p2 > 0) {
        y--;
        p2 -= 2 * rxSq * y + rxSq;
      } else {
        y--;
        x++;
        p2 += 2 * rySq * x - 2 * rxSq * y + rxSq;
      }
    }
  }

  plotEllipsePoints(x, y) {
    ctx.fillRect(this.cx + x, this.cy + y, 1, 1);
    ctx.fillRect(this.cx - x, this.cy + y, 1, 1);
    ctx.fillRect(this.cx + x, this.cy - y, 1, 1);
    ctx.fillRect(this.cx - x, this.cy - y, 1, 1);
  }

  translate(dx, dy) {
    this.cx += dx;
    this.cy += dy;
    this.points = this.calculatePoints();
  }

  rotate(angle, centerX, centerY) {
    const rad = angle * (Math.PI / 180);
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);

    let cx = this.cx - centerX;
    let cy = this.cy - centerY;

    this.cx = cx * cos - cy * sin + centerX;
    this.cy = cx * sin + cy * cos + centerX;
    this.points = this.calculatePoints();
  }

  scale(sx, sy) {
    this.rx *= sx;
    this.ry *= sy;
    this.points = this.calculatePoints();
  }

  calculatePoints() {
    const points = [];
    let rxSq = this.rx * this.rx;
    let rySq = this.ry * this.ry;
    let x = 0;
    let y = this.ry;
    let p1 = rySq - rxSq * this.ry + 0.25 * rxSq;
    points.push({ x: this.cx + x, y: this.cy + y });

    while (2 * rySq * x <= 2 * rxSq * y) {
      x++;
      if (p1 < 0) {
        p1 += 2 * rySq * x + rySq;
      } else {
        y--;
        p1 += 2 * rySq * x - 2 * rxSq * y + rySq;
      }
      points.push({ x: this.cx + x, y: this.cy + y });
      points.push({ x: this.cx - x, y: this.cy + y });
      points.push({ x: this.cx + x, y: this.cy - y });
      points.push({ x: this.cx - x, y: this.cy - y });
    }

    let p2 =
      rySq * ((x + 0.5) * (x + 0.5)) + rxSq * ((y - 1) * (y - 1)) - rxSq * rySq;
    while (y >= 0) {
      points.push({ x: this.cx + x, y: this.cy + y });
      if (p2 > 0) {
        y--;
        p2 -= 2 * rxSq * y + rxSq;
      } else {
        y--;
        x++;
        p2 += 2 * rySq * x - 2 * rxSq * y + rxSq;
      }
      points.push({ x: this.cx - x, y: this.cy + y });
      points.push({ x: this.cx + x, y: this.cy - y });
      points.push({ x: this.cx - x, y: this.cy - y });
    }
    return points;
  }
}

function redraw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  shapes.forEach((shape) => shape.draw());
}

function showTransformDialog() {
  const transformDialog = document.getElementById("transformDialog");
  transformDialog.style.display = "block";
}

function hideTransformDialog() {
  const transformDialog = document.getElementById("transformDialog");
  transformDialog.style.display = "none";
}

function applyTransformation() {
  const transformType = document.getElementById("transformType").value;
  const dx = parseInt(document.getElementById("dx").value) || 0;
  const dy = parseInt(document.getElementById("dy").value) || 0;
  const angle = parseInt(document.getElementById("angle").value) || 0;
  const sx = parseFloat(document.getElementById("sx").value) || 1;
  const sy = parseFloat(document.getElementById("sy").value) || 1;
  const axis = document.getElementById("axis").value;

  shapes.forEach((shape) => {
    switch (transformType) {
      case "translate":
        shape.translate(dx, dy);
        break;
      case "rotate":
        shape.rotate(angle, canvas.width / 2, canvas.height / 2);
        break;
      case "scale":
        shape.scale(sx, sy);
        break;
      case "reflect":
        reflectShape(shape, axis);
        break;
    }
  });

  redraw();
  hideTransformDialog();
}

document
  .getElementById("applyTransform")
  .addEventListener("click", applyTransformation);
document
  .getElementById("cancelTransform")
  .addEventListener("click", hideTransformDialog);

document
  .getElementById("showTransformDialog")
  .addEventListener("click", showTransformDialog);

document.getElementById("transformType").addEventListener("change", (event) => {
  document.querySelectorAll(".transformFields").forEach((field) => {
    field.style.display = "none";
  });

  const selectedTransform = event.target.value;
  document.getElementById(`${selectedTransform}Fields`).style.display = "block";
});

function clearCanvas() {
  shapes = [];
  redraw();
}

function downloadCanvas() {
  const link = document.createElement("a");
  link.href = canvas.toDataURL("image/png");
  link.download = "canvas.png";
  link.click();
}

function reflectShape(shape, axis) {
  const center = findCenter(shape.points);
  if (axis === "x") {
    shape.points.forEach((point) => {
      point.y = 2 * center.y - point.y;
    });
  } else {
    shape.points.forEach((point) => {
      point.x = 2 * center.x - point.x;
    });
  }
  shape.updateFromPoints();
}

function findCenter(points) {
  let xSum = 0;
  let ySum = 0;
  points.forEach((point) => {
    xSum += point.x;
    ySum += point.y;
  });
  return {
    x: xSum / points.length,
    y: ySum / points.length,
  };
}

Shape.prototype.updateFromPoints = function () {
  if (this.type === "line") {
    this.x1 = this.points[0].x;
    this.y1 = this.points[0].y;
    this.x2 = this.points[1].x;
    this.y2 = this.points[1].y;
  } else if (this.type === "circle") {
    this.cx = this.points[0].x;
    this.cy = this.points[0].y;
    this.radius = Math.sqrt(
      (this.points[1].x - this.cx) ** 2 + (this.points[1].y - this.cy) ** 2
    );
  } else if (this.type === "ellipse") {
    this.cx = this.points[0].x;
    this.cy = this.points[0].y;
    this.rx = Math.abs(this.points[1].x - this.cx);
    this.ry = Math.abs(this.points[1].y - this.cy);
  }
};
