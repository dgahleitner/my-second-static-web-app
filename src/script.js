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
document.getElementById('punkt-slider').addEventListener('input', function() {
  punktDiameterRatio = this.value / 1000;
  localStorage.setItem('punktDiameterRatio', punktDiameterRatio.toString());
  updatePunktSize();
});

function toggleEditMode() {
  editing = !editing;
  document.getElementById('edit-btn').innerText = editing ? 'Fertig' : 'Bearbeiten';
  document.getElementById('add-btn').style.display = editing ? 'block' : 'none';
  document.getElementById('delete-btn').style.display = editing ? 'block' : 'none';
  document.getElementById('slider-div').style.display = editing ? 'block' : 'none';

  if (!editing) {
    const punkte = document.getElementsByClassName('punkt');
    for (let punkt of punkte) {
      let relativeLeft = punkt.offsetLeft / document.getElementById('map').offsetWidth;
      let relativeTop = punkt.offsetTop / document.getElementById('map').offsetHeight;
      localStorage.setItem(punkt.id, JSON.stringify({ left: relativeLeft, top: relativeTop }));
    }
    localStorage.setItem('punktCount', punktCount.toString());
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
  initPunkt(punkt);
}

function deletePunkt() {
  if (punktCount > 0) {
    const punkt = document.getElementById('punkt' + punktCount);
    document.getElementById('map').removeChild(punkt);
    localStorage.removeItem(punkt.id);
    punktCount--;
  }
}

function initPunkt(punkt) {
  let offset = { x: 0, y: 0 };
  let isDown = false;

  const savedPosition = JSON.parse(localStorage.getItem(punkt.id));
  if (savedPosition) {
    punkt.style.left = savedPosition.left * 100 + '%';
    punkt.style.top = savedPosition.top * 100 + '%';
  }

  let dB = Math.floor(Math.random() * 101);
  let hue = 120 - (dB * 1.2);
  punkt.style.backgroundColor = `hsl(${hue}, 100%, 50%)`;

  setInterval(() => {
    let change = Math.floor(Math.random() * 21) - 10;
    dB = Math.max(0, Math.min(100, dB + change));
    hue = 120 - (dB * 1.2);
    punkt.style.backgroundColor = `hsl(${hue}, 100%, 50%)`;

    if (activePunkt === punkt) {
      tooltip.innerText = `${dB} dB`;
    }
  }, 1000);

  punkt.addEventListener('mouseover', (event) => {
    if (editing) return;

    activePunkt = punkt;
    tooltip.innerText = `${dB} dB`;
    tooltip.style.display = 'block';
    tooltip.style.left = (event.pageX + 10) + 'px';
    tooltip.style.top = (event.pageY + 10) + 'px';
  }, true);

  punkt.addEventListener('mouseout', () => {
    if (activePunkt === punkt) {
      activePunkt = null;
    }
    tooltip.style.display = 'none';
  }, true);

  punkt.addEventListener('mousedown', (event) => {
    if (!editing) return;

    isDown = true;
    offset = {
      x: punkt.offsetLeft - event.clientX,
      y: punkt.offsetTop - event.clientY
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
      punkt.style.left = ((event.clientX + offset.x) / document.getElementById('map').offsetWidth) * 100 + '%';
      punkt.style.top = ((event.clientY + offset.y) / document.getElementById('map').offsetHeight) * 100 + '%';
    }
  }, true);
}

window.addEventListener('resize', updatePunktSize);

document.getElementById('edit-btn').addEventListener('click', toggleEditMode);
document.getElementById('add-btn').addEventListener('click', createPunkt);
document.getElementById('delete-btn').addEventListener('click', deletePunkt);

for (let i = 0; i < punktCount; i++) {
  const punkt = document.createElement('div');
  punkt.classList.add('punkt');
  punkt.id = 'punkt' + (i + 1);
  document.getElementById('map').appendChild(punkt);
  initPunkt(punkt);
}

updatePunktSize();
