let editing = false;
let activePunkt = null;
let punktCount = Number(localStorage.getItem('punktCount') || '0');
let punktDiameterRatio = Number(localStorage.getItem('punktDiameterRatio') || '0.01');
let punktDiameterPx;

const tooltip = document.createElement('div');
tooltip.classList.add('tooltip');
document.body.appendChild(tooltip);

function updatePunktSize() {
  punktDiameterPx = document.getElementById('map').offsetWidth * punktDiameterRatio;

  const punkte = document.getElementsByClassName('punkt');
  for (let punkt of punkte) {
    punkt.style.width = punktDiameterPx + 'px';
    punkt.style.height = punktDiameterPx + 'px';
  }
}

document.getElementById('punkt-slider').value = punktDiameterRatio * 1000;
document.getElementById('punkt-slider').addEventListener('input', function () {
  punktDiameterRatio = this.value / 1000;
  localStorage.setItem('punktDiameterRatio', punktDiameterRatio.toString());
  updatePunktSize();
});

function toggleEditMode() {
  editing = !editing;
  document.getElementById('edit-btn').innerText = editing ? 'Fertig' : 'Bearbeiten';
  document.getElementById('add-btn').style.display = editing ? 'block' : 'none';
  document.getElementById('delete-btn').style.display = editing ? 'block' : 'none';
  document.getElementById('add-polygon-btn').style.display = editing ? 'block' : 'none';
  document.getElementById('delete-polygon-btn').style.display = editing ? 'block' : 'none';
  document.getElementById('slider-div').style.display = editing ? 'block' : 'none';

  circles.forEach(circle => editing ? circle.show() : circle.hide());

  if (!editing) {
    savePunktPositions();
  }
}

function createPunkt() {
  const punkt = document.createElement('div');
  punkt.classList.add('punkt');
  punkt.id = 'punkt' + (punktCount + 1);
  document.getElementById('map').appendChild(punkt);
  punkt.style.left = '50%';
  punkt.style.top = '50%';
  punktCount++;
  initElement(punkt, true);
}

function deletePunkt() {
  if (punktCount > 0) {
    const punkt = document.getElementById('punkt' + punktCount);
    document.getElementById('map').removeChild(punkt);
    localStorage.removeItem(punkt.id);
    punktCount--;
  }
}

function initElement(element, isPunkt) {
  let offset = { x: 0, y: 0 };
  let isDown = false;

  const savedPosition = JSON.parse(localStorage.getItem(element.id));
  if (savedPosition) {
    element.style.left = savedPosition.left * 100 + '%';
    element.style.top = savedPosition.top * 100 + '%';
  }

  let dB = Math.floor(Math.random() * 101);
  let hue = 120 - (dB * 1.2);
  element.style.backgroundColor = `hsla(${hue}, 100%, 50%, 0.5)`;

  setInterval(() => {
    let change = Math.floor(Math.random() * 21) - 10;
    dB = Math.max(0, Math.min(100, dB + change));
    hue = 120 - (dB * 1.2);
    element.style.backgroundColor = `hsla(${hue}, 100%, 50%, 0.5)`;

    if (activePunkt === element) {
      tooltip.innerText = `${dB} dB`;
    }
  }, 1000);

  element.addEventListener('mouseover', (event) => {
    if (editing) return;

    activePunkt = element;
    tooltip.innerText = `${dB} dB`;
    tooltip.style.display = 'block';
    tooltip.style.left = (event.pageX + 10) + 'px';
    tooltip.style.top = (event.pageY + 10) + 'px';
  }, true);

  element.addEventListener('mouseout', () => {
    if (activePunkt === element) {
      activePunkt = null;
    }
    tooltip.style.display = 'none';
  }, true);

  element.addEventListener('mousedown', (event) => {
    if (!editing) return;

    isDown = true;
    offset = {
      x: element.offsetLeft - event.clientX,
      y: element.offsetTop - event.clientY
    };
  }, true);

  document.addEventListener('mouseup', () => {
    if (!editing) return;
    isDown = false;
  }, true);

  document.addEventListener('mousemove', (event) => {
    if (!editing) return;

    event.preventDefault();
    if (isDown) {
      element.style.left = ((event.clientX + offset.x) / document.getElementById('map').offsetWidth) * 100 + '%';
      element.style.top = ((event.clientY + offset.y) / document.getElementById('map').offsetHeight) * 100 + '%';

      if (isPunkt) {
        let relativeLeft = element.offsetLeft / document.getElementById('map').offsetWidth;
        let relativeTop = element.offsetTop / document.getElementById('map').offsetHeight;
        localStorage.setItem(element.id, JSON.stringify({ left: relativeLeft, top: relativeTop }));
      } else {
        let x = (event.clientX - imageRect.left) / imageRect.width;
        let y = (event.clientY - imageRect.top) / imageRect.height;
        let index = circles.indexOf(element);
        pointsArray[index] = [x, y];
        polygon.plot(pointsArray.map(point => [point[0] * containerRect.width, point[1] * containerRect.height]));

        localStorage.setItem('pointsArray', JSON.stringify(pointsArray));
      }
    }
  }, true);
}

window.addEventListener('resize', function() {
  updatePunktSize();
  updatePolygonSize();
});

document.getElementById('edit-btn').addEventListener('click', toggleEditMode);
document.getElementById('add-btn').addEventListener('click', createPunkt);
document.getElementById('delete-btn').addEventListener('click', deletePunkt);


let polygonCount = Number(localStorage.getItem('polygonCount') || '0');
let polygons = [];

function createPolygon() {
  let polygonId = 'polygon' + (polygonCount + 1);
  createInteractivePolygon(polygonId);
  polygonCount++;
  localStorage.setItem('polygonCount', polygonCount.toString());
  toggleEditMode();
  toggleEditMode();
}

function deletePolygon() {
  if (polygonCount > 0) {
    let polygonId = 'polygon' + polygonCount;
    let index = polygons.findIndex(p => p.polygonId === polygonId);
    if (index !== -1) {
      polygons[index].polygon.remove();
      
      let pointsArray = polygons[index].pointsArray;
      for (let i = 0; i < pointsArray.length; i++) {
        circles[index * pointsArray.length + i].remove();
      }

      circles.splice(index * pointsArray.length, pointsArray.length);

      polygons.splice(index, 1);
      localStorage.removeItem(polygonId);
      localStorage.removeItem('pointsArray' + polygonId);

      polygonCount--;
      localStorage.setItem('polygonCount', polygonCount.toString());
    }
  }
}


let circles = [];
let imageRect = document.querySelector("#map img").getBoundingClientRect();
let polygon;
let pointsArray;
let svgContainer = SVG().addTo('#svg-container').size('100%', '100%');


function createInteractivePolygon(polygonId) {
  let draw = svgContainer;
  let containerRect = document.getElementById('svg-container').getBoundingClientRect();
  let polygonHovered = false;

  pointsArray = JSON.parse(localStorage.getItem('pointsArray' + polygonId)) ||
    [[100 / containerRect.width, 100 / containerRect.height],
    [150 / containerRect.width, 150 / containerRect.height],
    [100 / containerRect.width, 200 / containerRect.height],
    [50 / containerRect.width, 150 / containerRect.height]];

  let dB = Math.floor(Math.random() * 101);
  let hue = 120 - (dB * 1.2);

  polygon = draw.polygon(pointsArray.map(point => [point[0] * containerRect.width, point[1] * containerRect.height])).fill(`hsla(${hue}, 100%, 50%, 0.5)`).stroke({ width: 1, color: '#000' }).opacity(0.5);

  polygons.push({ polygonId: polygonId, polygon: polygon, pointsArray: pointsArray });

  pointsArray.forEach(function (point, i) {
    let circle = draw.circle(10).center(point[0] * imageRect.width, point[1] * imageRect.height).fill('#c00');
    circle.hide();
    circles.push(circle);

    circle.node.addEventListener('mousedown', startDrag);
    circle.node.addEventListener('mousemove', drag);
    circle.node.addEventListener('mouseup', endDrag);
    circle.node.addEventListener('mouseleave', endDrag);

    function startDrag(event) {
      if (editing) {
        circle.node.dragging = true;
        circle.node.dragOffset = {
          x: event.clientX / imageRect.width - circle.cx() / imageRect.width,
          y: event.clientY / imageRect.height - circle.cy() / imageRect.height
        };
      }
    }

    function drag(event) {
      if (editing && circle.node.dragging) {
        let x = (event.clientX - imageRect.left) / imageRect.width;
        let y = (event.clientY - imageRect.top) / imageRect.height;
        circle.center(x * containerRect.width, y * containerRect.height);
        pointsArray[i] = [x, y];
        polygon.plot(pointsArray.map(point => [point[0] * containerRect.width, point[1] * containerRect.height]));

        localStorage.setItem('pointsArray' + polygonId, JSON.stringify(pointsArray));
      }
    }

    function endDrag() {
      if (editing) {
        circle.node.dragging = false;
      }
    }

    polygon.node.addEventListener('mouseover', (event) => {
      if (editing) return;

      polygonHovered = true;
      tooltip.style.display = 'block';
      tooltip.style.left = (event.pageX + 10) + 'px';
      tooltip.style.top = (event.pageY + 10) + 'px';
    }, true);

    polygon.node.addEventListener('mouseout', () => {
      polygonHovered = false;
      tooltip.style.display = 'none';
    }, true);

    setInterval(() => {
      let change = Math.floor(Math.random() * 21) - 10;
      dB = Math.max(0, Math.min(100, dB + change));
      hue = 120 - (dB * 1.2);
      polygon.fill(`hsla(${hue}, 100%, 50%, 0.5)`);

      if (polygonHovered) {
        tooltip.innerText = `${dB} dB`;
      }
    }, 1000);
  });
}

function updatePolygonSize() {
  imageRect = document.querySelector("#map img").getBoundingClientRect();

  circles.forEach((circle, i) => {
    circle.center(pointsArray[i][0] * imageRect.width, pointsArray[i][1] * imageRect.height);
  });
  polygon.plot(pointsArray.map(point => [point[0] * imageRect.width, point[1] * imageRect.height]));
}

function savePunktPositions() {
  const punkte = document.getElementsByClassName('punkt');
  for (let punkt of punkte) {
    let relativeLeft = punkt.offsetLeft / document.getElementById('map').offsetWidth;
    let relativeTop = punkt.offsetTop / document.getElementById('map').offsetHeight;
    localStorage.setItem(punkt.id, JSON.stringify({ left: relativeLeft, top: relativeTop }));
  }
  localStorage.setItem('punktCount', punktCount.toString());
}

document.getElementById('add-polygon-btn').addEventListener('click', createPolygon);
document.getElementById('delete-polygon-btn').addEventListener('click', deletePolygon);

window.addEventListener('DOMContentLoaded', (event) => {
  for (let i = 0; i < polygonCount; i++) {
    const polygonId = 'polygon' + (i + 1);
    createInteractivePolygon(polygonId);
  }

  for (let i = 0; i < punktCount; i++) {
    const punkt = document.createElement('div');
    punkt.classList.add('punkt');
    punkt.id = 'punkt' + (i + 1);
    document.getElementById('map').appendChild(punkt);
    initElement(punkt, true);
  }

  updatePunktSize();
});
