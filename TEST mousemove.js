let isTouchEvent = false; // **** NEW CODE ****

function mousemove(dragEvent) {
  if (isTouchEvent && dragEvent.type !== 'touchmove') { // **** NEW CODE ****
    return; // Skip mousemove if a touch event is active // **** NEW CODE ****
  }

  clickTarget.moveSteps += 1;
  // Calculate position of mouse relative to center of knob
  if (dragEvent.type == 'touchmove') {
    clickTarget.mouseRelativetoKnobCenter = [dragEvent.touches[0].pageX - clickTarget.centerPos[0], clickTarget.centerPos[1] - dragEvent.touches[0].pageY];
  } else {
    clickTarget.mouseRelativetoKnobCenter = [dragEvent.pageX - clickTarget.centerPos[0], clickTarget.centerPos[1] - dragEvent.pageY];
  }

  // Convert coordinates to angle in degrees
  clickTarget.deg = Math.round(Math.atan2(clickTarget.mouseRelativetoKnobCenter[0], clickTarget.mouseRelativetoKnobCenter[1]) * (180 / Math.PI));
  if (clickTarget.deg < 0) {
    clickTarget.deg += 360;
  }

  if (isNaN(clickTarget.lastDeg)) {
    clickTarget.lastDeg = clickTarget.deg;
  }

  knobAngleToResult(dragEvent, clickTarget);
  dragEvent.preventDefault();
}

function knobOff(event) {
  document.getElementById('mainDiv').classList.remove('grabbed');
  clickTarget.classList.remove('grabbed');

  window.removeEventListener('mousemove', mousemove);
  window.removeEventListener('touchmove', mousemove);

  window.removeEventListener('touchend', knobOff);
  window.removeEventListener('mouseup', knobOff);

  isTouchEvent = false; // **** NEW CODE ****
  clickTarget.lastDeg = undefined;
  event.preventDefault();
}

function knobClick(clickEvent) {
  getBottomDialParameters();
  var clickTarget = clickEvent.target;

  document.getElementById('mainDiv').classList.add('grabbed');
  clickTarget.classList.add('grabbed');

  clickTarget.moveSteps = 0;

  // Calculate center of knob
  clickTarget.knobRect = clickTarget.getBoundingClientRect();
  clickTarget.centerPos = [clickTarget.knobRect.left + (clickTarget.knobRect.width / 2), clickTarget.knobRect.top + (clickTarget.knobRect.height / 2)];

  calcKnobParams(clickTarget);

  if (isNaN(clickTarget.lastDeg)) {
    clickTarget.lastDeg = clickTarget.deg || 0;
  }

  window.addEventListener('mousemove', mousemove);
  window.addEventListener('touchmove', mousemove);

  window.addEventListener('mouseup', knobOff);
  window.addEventListener('touchend', knobOff);

  isTouchEvent = clickEvent.type === 'touchstart'; // **** NEW CODE ****
  clickEvent.preventDefault();
}

// Attach initial event listeners
document.getElementById('rateDialImg').addEventListener('mousedown', knobClick);
document.getElementById('rateDialImg').addEventListener('touchstart', knobClick);
document.getElementById('vOutputDialImg').addEventListener('mousedown', knobClick);
document.getElementById('vOutputDialImg').addEventListener('touchstart', knobClick);
document.getElementById('aOutputDialImg').addEventListener('mousedown', knobClick);
document.getElementById('aOutputDialImg').addEventListener('touchstart', knobClick);
document.getElementById('bottomKnobImg').addEventListener('mousedown', knobClick);
document.getElementById('bottomKnobImg').addEventListener('touchstart', knobClick);