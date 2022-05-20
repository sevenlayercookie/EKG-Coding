/*  ABSTRACTION
      Data Description:
        - 500 Hz EKG data
        - so should data be drawn at 500 fps? can device handle that?
      Two parts:
        I.  Data processor - cycles through EKG data
        II. Painter - paints the canvas
    - painter should run at browser framerate (max for device) for smoothness
    - data processor should run as fast as possible, but 

    width = 1000 pixels

    60  bpm = 1 beat / 1000 msec

    R-R should take one second to paint
      - # data points per R-R = 500 Hz * 1 second = 500 data points

    so 500 data points should be processed every second
    paint will paint at Max Browser Framerate. So data processing should be 500/Max Browse Frame Rate and then paint 

*/

function onload() {
  var canvas = document.getElementById("demo");
  var ctx = canvas.getContext("2d"),
    w = demo.width,
    h = demo.height,
    l = 0,
    sec = 0,
    avgRefresh = 1,
    dataHertz = 500, // in Hz (data points per second)
    avgFPS = 144,
    animateRatio = dataHertz / avgFPS,
    dataVoltage = 10, // in mV
    compressHfactor = 1,
    heartrate = 60,
    HRmode = 0,
    verticalPositionFactor = 100,
    flatline = 0,
    px = 0,
    opx = 0,
    speed = 0.3, // speed of the cursor across the screen; affects spacing of data
    processSpeed = 2; //skips data points to "speed" the drawing; less resolution
  isPainted = true;
  timestamp = performance.now();
  paintCount = 1;
  (py = h * 1), (opy = py), (scanBarWidth = 40), (PVCflag = 0);
  k = 0;
  ctx.strokeStyle = "#00bd00";
  ctx.lineWidth = 3;

  // framelimiter code
  var fpsInterval, startTime, now, then, elapsed;

  // initialize the timer variables and start the animation

  var p = 0;
  var i = 0;
  var j = 0;
  var jold = 0;

  // initiate animation (is looped)
  function startAnimating() {
    ctx.beginPath();
    for (let i = 0; i < 1200 && isPainted; i++) {
      loop();
    }
  }

  setInterval(updateHertz, 1000);
  startAnimating();

  var lold = 0;
  function updateHertz() {
    sec++;
    avgFPS = document.getElementById("demoTEXT").innerText = l - lold;
    document.getElementById("demoTEXT3").innerText = processingSpeed = j - jold;
    lold = l;
    jold = j;
  }

  function parseData() {
    py = -parseInt(data[i] * 1000) / 8 + verticalPositionFactor;
    j++;
    i++;
    // i=i+parseInt(animateRatio)-1;
    if (i >= data.length) i = 0;
  }

  function loop() {
    l++; //count # of times through loop
    ctx.beginPath();
    for (let z = 0; z < dataHertz / avgFPS; z++) {
      parseData();
      px += speed; // horizontal pixels per data point
      ctx.moveTo(opx, opy);
      ctx.lineTo(px, py);
      opx = px;
      opy = py;

      if (opx > w) {
        px = opx = 0; //-speed;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
    isPainted = false;
    requestAnimationFrame(paint);
    //document.getElementById('demoTEXT').innerText = PVCflag;
    document.getElementById("demoTEXT2").innerText = i;
  }

  function paint() {
    ctx.stroke();
    isPainted = true;
    startAnimating();
    paintCount++;
  }

  document.getElementById("demoTEXT").onkeydown = function () {
    i = 0;
    PVCflag = 1;
  };

  document.onkeydown = function () {
    i = 0;
    PVCflag = 1;
  };
}
