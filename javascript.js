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

// -------------------------- GLOABL DEFINITIONS -----------------------------
var PRInterval;
var HeartRate = 60;
var dataFeedLength=500;


// ------------------------- onload () ---------------------------------------
function onload() {
  // --------------------- LOCAL DEFINITIONS ---------------------------------
  dataFeed.length = 1000;
  dataFeed.fill(0,0,1000);
  document.getElementById("demo").width = window.innerWidth;
  var canvas = document.getElementById("demo");
  PRInterval = document.getElementById("PRbox").value = 200;
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
    canvasBaseline = demo.height/2,
    
    px = 0,
    opx = 0,
    speed = 0.2, // speed of the cursor across the screen; affects "squeeze" of waves
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
    py = -parseInt(dataFeed.shift() * 1000) / 8 + canvasBaseline;
    if (dataFeed.length < 1000) {
      dataFeed.push(0);
    }
    j++;
    i++;
    // i=i+parseInt(animateRatio)-1;
    if (dataFeed.length==0)
    {
      py=-(0*1000)/8+canvasBaseline;
      i = 0;
    } 
  }

  function loop() {
    //ctx.canvas.width  = window.innerWidth; // working on screen resizing
    l++; //count # of times through loop
    ctx.beginPath();
    for (let z = 0; z < dataHertz / avgFPS; z++) {
      parseData();
      
      px += speed; // horizontal pixels per data point
      ctx.moveTo(opx, opy);
      ctx.lineTo(px, py);
      opx = px;
      opy = py;

      if (opx > canvas.width) {
        px = opx = 0; //-speed;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
    isPainted = false;
    requestAnimationFrame(paint);
    document.getElementById("demoTEXT2").innerText = i;
  }

  function paint() {
    ctx.stroke();
    isPainted = true;
    paintCount++;
    startAnimating();
  }

  document.getElementById("demoTEXT").onkeydown = function () {
    i = 0;
    PVCflag = 1;
  };

//  window.addEventListener('resize', function(event){
//    // do stuff here
//    w = document.getElementById("demo").width = window.innerWidth;
//    ctx.beginPath();
//  });

}   // --------------------- end onLoad() ------------------------------


function PwaveClick() {
  i = 0;
  var tempArray=smoothP.slice();
   for (let j = 0; j < smoothP.length; j++) 
      {
        dataFeed[j] = dataFeed[j]+tempArray.shift(); // add the voltages at each point (in case beats overlap)
      }
    
}

function QRSClick() {
  i = 0;
  var tempArray=cleanQRS.slice();
      for (let j = 0; j < cleanQRS.length; j++) 
      {
        dataFeed[j] = dataFeed[j]+tempArray.shift(); // add the voltages at each point (in case beats overlap)
      }
}

var currentRhythmID;
function NSRhythm() {
	clearInterval(currentRhythmID);
	HeartRate = document.getElementById("RateBox").value;
  currentRhythmID = setInterval(function () 
  {
    PwaveClick();
    PRInterval = document.getElementById("PRbox").value;
    
    setTimeout(QRSClick,PRInterval);
  
  },(1/(HeartRate/60))*1000);
  
}

function ECGsyn() {
	dataFeed=synthECG.slice();
  
}

function CHB() {
  clearInterval(currentRhythmID);
  var ventHeartRate = 40;
  var atrialHeartRate = HeartRate;
  currentRhythmID = [setInterval(function ()
    {
      QRSClick();
    },(1/(ventHeartRate/60))*1000)],
    
    setInterval(function ()
  {
    PwaveClick();
  },(1/(atrialHeartRate/60))*1050);
}