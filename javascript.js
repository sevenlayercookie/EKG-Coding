/*  ABSTRACTION
      Data Description:
        - 500 Hz EKG data
        - so should data be drawn at 500 fps? can device handle that?
      Two parts:
        I.  Data processor - cycles through EKG data
        II. Painter - paints the canvas
    - painter should run at browser framerate (max for device) for smoothness
    - data processor should run as fast as possible, but 

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
    animatefps = 30,
    animateRatio = dataHertz / animatefps,
    dataVoltage = 10, // in mV
    compressHfactor = 1,
    heartrate = 60,
    HRmode = 0,
    verticalPositionFactor = 100,
    flatline = 0,
    px = 0,
    opx = 0,
    speed = 1, // speed of the cursor across the screen; affects spacing of data
    processSpeed = 2; //skips data points to "speed" the drawing; less resolution
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

  function parseData() {
    py = -parseInt(data[i] * 1000) / 8 + verticalPositionFactor;
    j++;
    i++;
    // i=i+parseInt(animateRatio)-1;
    if (i >= data.length) i = 0;
  }

  // initiate animation (is only run once)
  function startAnimating() {
    ctx.beginPath();
    for (let i = 0; i < 1400; i++) {
      setInterval(loop(), 2);
    }
  }

  setInterval(updateHertz, 1000);
  startAnimating();

  var lold = 0;
  function updateHertz() {
    sec++;
    avgRefresh = document.getElementById("demoTEXT").innerText = l - lold;
    lold = l;
  }

  function loop() {
    // request another frame
    parseData()
    l++; //count # of times through loop
    px += speed; // horizontal pixels per data point
    //ctx.clearRect(px, 0, scanBarWidth, h);
    ctx.beginPath();
    ctx.moveTo(opx, opy);
    ctx.lineTo(px, py);
    if (i%10==0)
    {
    requestAnimationFrame(paint)
    }
    
    opx = px;
    opy = py;

    if (opx > w) {
      px = opx = 0; //-speed;
    }
    //document.getElementById('demoTEXT').innerText = PVCflag;
    document.getElementById("demoTEXT2").innerText = i;
  }

  function paint()
  {
    ctx.stroke();
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
