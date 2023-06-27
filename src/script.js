let editing = false;
let activePunkt = null; 
const tooltip = document.createElement('div');
tooltip.classList.add('tooltip');
document.body.appendChild(tooltip);

document.getElementById('edit-btn').addEventListener('click', () => {
  editing = !editing;
  document.getElementById('edit-btn').innerText = editing ? 'Fertig' : 'Bearbeiten';

  if (!editing) {
    for (let punkt of punkte) {
      localStorage.setItem(punkt.id, JSON.stringify({ left: punkt.style.left, top: punkt.style.top }));
    }
  }
});

const punkte = document.getElementsByClassName('punkt');
for (let punkt of punkte) {
  let offset = { x: 0, y: 0 };
  let isDown = false;

  const savedPosition = JSON.parse(localStorage.getItem(punkt.id));
  if (savedPosition) {
    punkt.style.left = savedPosition.left;
    punkt.style.top = savedPosition.top;
  }

  // Generiere einen zufälligen Dezibelwert und setze die Farbe entsprechend
  let dB = Math.floor(Math.random() * 101);
  let hue = 120 - (dB * 1.2); 
  punkt.style.backgroundColor = `hsl(${hue}, 100%, 50%)`;

  setInterval(() => {
    // Generiere einen neuen Dezibelwert, der maximal ±10 vom aktuellen Wert abweicht
    let change = Math.floor(Math.random() * 21) - 10; 
    dB = Math.max(0, Math.min(100, dB + change)); 
    hue = 120 - (dB * 1.2);
    punkt.style.backgroundColor = `hsl(${hue}, 100%, 50%)`;

    // Aktualisiere Tooltip-Text, wenn Tooltip für diesen Punkt angezeigt wird
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
      punkt.style.left = (event.clientX + offset.x) + 'px';
      punkt.style.top = (event.clientY + offset.y) + 'px';
    }
  }, true);
}
