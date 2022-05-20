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
var flatline = true; // set to true for default flatline
var PRInterval;
var HeartRate = 60;


// ------------------------- onload () ---------------------------------------
function onload() {
  // --------------------- LOCAL DEFINITIONS ---------------------------------
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
    speed = 0.3, // speed of the cursor across the screen; affects "squeeze" of waves
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
    j++;
    i++;
    // i=i+parseInt(animateRatio)-1;
    if (dataFeed.length==0)
    {
      py=-(-0.04*1000)/8+canvasBaseline;
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
  if (dataFeed.length==0)
    {
      dataFeed = dataFeed.concat(Pwave);
    }
    else
    {
      for (let j = 0; j < Pwave.length; j++) 
      {
        if (j>=dataFeed.length)
        {
          dataFeed = dataFeed.concat(tempArray); // if flatline, then just throw in the full P wave
          j = Pwave.length; // this exits the loop
        }
        else
        {
        var tempArray=Pwave.slice(); 
        dataFeed[j] = dataFeed[j]+tempArray.shift(); // add the voltages at each point (in case beats overlap)
        }
      }
    }
    flatline=false;
};

function QRSClick() {
  i = 0;
  if (dataFeed.length==0)
    {
      dataFeed = dataFeed.concat(QRST);
    }
    else
    {
      for (let j = 0; j < QRST.length; j++) 
      {
        if (j>=dataFeed.length)
        {
          dataFeed = dataFeed.concat(tempArray); // if flatline, then just throw in the full P wave
          j = QRST.length; // this exits the loop
        }
        else
        {
        var tempArray=QRST.slice(); 
        dataFeed[j] = dataFeed[j]+tempArray.shift(); // add the voltages at each point (in case beats overlap)
        }
      }
    }
    flatline=false;
};

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

