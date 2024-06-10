const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
let startX, startY, endX, endY;
let mode = "";
let selectedShape = null;
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
  }

  draw() {}
  translate(dx, dy) {}
  rotate(angle) {}
  scale(sx, sy) {}
  reflect(axis) {}
}

class Line extends Shape {
  constructor(x1, y1, x2, y2, algorithm) {
    super("line");
    this.x1 = x1;
    this.y1 = y1;
    this.x2 = x2;
    this.y2 = y2;
    this.algorithm = algorithm;
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
  }

  rotate(angle) {
    const rad = angle * (Math.PI / 180);
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    const nx1 = this.x1 * cos - this.y1 * sin;
    const ny1 = this.x1 * sin + this.y1 * cos;
    const nx2 = this.x2 * cos - this.y2 * sin;
    const ny2 = this.x2 * sin + this.y2 * cos;
    this.x1 = nx1;
    this.y1 = ny1;
    this.x2 = nx2;
    this.y2 = ny2;
  }

  scale(sx, sy) {
    this.x2 = this.x1 + (this.x2 - this.x1) * sx;
    this.y2 = this.y1 + (this.y2 - this.y1) * sy;
  }

  reflect(axis) {
    if (axis === "x") {
      this.y1 = -this.y1;
      this.y2 = -this.y2;
    } else {
      this.x1 = -this.x1;
      this.x2 = -this.x2;
    }
  }
}

class Circle extends Shape {
  constructor(cx, cy, radius) {
    super("circle");
    this.cx = cx;
    this.cy = cy;
    this.radius = radius;
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
  }

  rotate(angle) {
    // Rotation doesn't change the circle.
  }

  scale(s) {
    this.radius *= s;
  }

  reflect(axis) {
    if (axis === "x") {
      this.cy = -this.cy;
    } else {
      this.cx = -this.cx;
    }
  }
}

class Ellipse extends Shape {
  constructor(cx, cy, rx, ry) {
    super("ellipse");
    this.cx = cx;
    this.cy = cy;
    this.rx = rx;
    this.ry = ry;
  }

  draw() {
    this.drawEllipseMidpoint();
  }

  drawEllipseMidpoint() {
    let x = 0;
    let y = this.ry;
    let rxSq = this.rx * this.rx;
    let rySq = this.ry * this.ry;
    let p1 = rySq - rxSq * this.ry + 0.25 * rxSq;
    while (2 * rySq * x <= 2 * rxSq * y) {
      this.plotEllipsePoints(x, y);
      if (p1 < 0) {
        x++;
        p1 += 2 * rySq * x + rySq;
      } else {
        x++;
        y--;
        p1 += 2 * rySq * x - 2 * rxSq * y + rySq;
      }
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
  }

  rotate(angle) {
    const rad = angle * (Math.PI / 180);
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    const ncx = this.cx * cos - this.cy * sin;
    const ncy = this.cx * sin + this.cy * cos;
    this.cx = ncx;
    this.cy = ncy;
  }

  scale(sx, sy) {
    this.rx *= sx;
    this.ry *= sy;
  }

  reflect(axis) {
    if (axis === "x") {
      this.cy = -this.cy;
    } else {
      this.cx = -this.cx;
    }
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
        shape.rotate(angle);
        break;
      case "scale":
        shape.scale(sx, sy);
        break;
      case "reflect":
        shape.reflect(axis);
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
