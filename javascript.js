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
var canvas = document.getElementById("demo");
var ctx = canvas.getContext("2d");
var HRchanged = false;
var paceSpike=false;
var ventPaceCapturing=false;
// ------------------------- onload () ---------------------------------------
onload();
function onload() {
  // --------------------- LOCAL DEFINITIONS ---------------------------------
  dataFeed.length = 1000;
  dataFeed.fill(0,0,1000);
  document.getElementById("demo").width = window.innerWidth;
  PRInterval = document.getElementById("PRbox").value = 200;
  
  var w = demo.width,
    h = demo.height,
    l = 0,
    sec = 0,
    avgRefresh = 1,
    dataHertz = 500, // in Hz (data points per second)
    avgFPS = 144,
    animateRatio = dataHertz / avgFPS,
    dataVoltage = 10, // in mV
    compressHfactor = 20,
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
    py = -parseInt(dataFeed.shift() * 1000) / compressHfactor + canvasBaseline;
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

      if (paceSpike)
        {drawPacingSpike(px,py);}

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

  //window.addEventListener('resize', function(event){
    // do stuff here
    //ctx.save();
   // w = document.getElementById("demo").width = ctx.width = window.innerWidth;
    //ctx.restore();
  //});
input = document.getElementById('avgRateBox');
input.onchange = function(){HeartRate=input.value;HRchanged=true;};
document.getElementById('atrialPacing').onchange = function () 
  {
  if (document.getElementById('atrialPacing').checked)
  {
    atrialPaceCapturing=true;
  }
  else
  {
    atrialPaceCapturing=false;
  }
}
document.getElementById('ventPacing').onchange = function () 
  {
  if (document.getElementById('ventPacing').checked)
  {
    ventPaceCapturing=true;
  }
  else
  {
    ventPaceCapturing=false;
  }
}
}   // --------------------- end onLoad() ------------------------------

atrialPaceCapturing=false;
function PwaveClick() {
  i = 0;
  if (atrialPaceCapturing)
  {
    paceSpike=true;
  }
  var tempArray=smoothP.slice();
   for (let j = 0; j < smoothP.length; j++) 
      {
        dataFeed[j] = dataFeed[j]+tempArray.shift(); // add the voltages at each point (in case beats overlap)
      }
    
}

function QRSClick() {
  i = 0;
  if (ventPaceCapturing)
  {
    paceSpike=true;
  }
  var tempArray=cleanQRS.slice();
      for (let j = 0; j < cleanQRS.length; j++) 
      {
        dataFeed[j] = dataFeed[j]+tempArray.shift(); // add the voltages at each point (in case beats overlap)
      }
}

function TwaveClick() {
  i = 0;
  var tempArray=cleanT.slice();
      for (let j = 0; j < cleanT.length; j++) 
      {
        dataFeed[j] = dataFeed[j]+tempArray.shift(); // add the voltages at each point (in case beats overlap)
      }
}

var avgVentRate=0;
var oldTime=performance.now();
var histVentBeats=0;
var histVentTimes = [];   // each time implies a beat
function QRST() {
  i = 0;
  j = 0;

  histVentTimes.push(performance.now());
  if (histVentTimes.length>10)
  {
  histVentTimes.shift();
  }
  
  if (ventPaceCapturing)
  {
    paceSpike=true;
  }
  var tempArray=cleanQRS.slice();
      for (j = 0; j < cleanQRS.length; j++) 
      {
        dataFeed[j] = dataFeed[j]+tempArray.shift(); // add the voltages at each point (in case beats overlap)
      }
      tempArray=cleanT.slice();
      for (let i = 0; i < cleanT.length; i++) 
      {
        dataFeed[j] = dataFeed[j]+tempArray.shift(); // add the voltages at each point (in case beats overlap)
        j++;
      }
}
  

var currentRhythmID = [0,0];
function NSRhythm() {
	clearRhythms();
	HeartRate = document.getElementById("avgRateBox").value;
  currentRhythmID.push(setInterval(function () 
  {
    if (HRchanged)
    {HRchanged=false;clearRhythms();NSRhythm();paintHR()}
    PwaveClick();
    PRInterval = document.getElementById("PRbox").value;
    
    setTimeout(function () {QRST()},PRInterval);
  
  },(1/(HeartRate/60))*1000));
  
}

function ECGsyn() {
	dataFeed=synthECG.slice();
  
}

function CHB() {
  clearRhythms();
  document.getElementById("ventRateBox").hidden=false;
  document.getElementById("atrialRateBox").hidden=false;
  var ventHeartRate = document.getElementById("ventRateBox").value;
  var atrialHeartRate = document.getElementById("atrialRateBox").value;
  HeartRate = document.getElementById("avgRateBox").value = ventHeartRate;
  currentRhythmID.push(setInterval(function ()
    {
      QRST();
    },(1/(ventHeartRate/60))*1000))

    currentRhythmID.push(setInterval(function ()
  {
    PwaveClick();
  },(1/(atrialHeartRate/60))*1050));
}

function clearRhythms()
{
  dataFeed = [0];
  dataFeed.length = 1000;
  dataFeed.fill(0,0,1000);
  currentRhythmID.forEach((element) => 
  {
    clearInterval(element);
  });
}

function paintHR() {
  canvas1 = document.getElementById("HRLayer");
  ctx1 = canvas1.getContext("2d");
  ctx1.font = "50px Arial";
  ctx1.fillStyle = "#00bd00";
  ctx1.lineWidth = 3;
  ctx1.clearRect(0,00,canvas1.width,canvas1.height); //clears previous HR
    
  // rolling average (weighted)
  // histVentTimes contains absolute timestamps of V beats  
  // weighted average - weight more recent measurements

  let weightedSum=0;
  let weightCount=0;
  for (let i = 0; i < histVentTimes.length; i++) {
    let elapsed = histVentTimes[i]- histVentTimes[i-1];
    if (isNaN(elapsed)) {
      elapsed=0;
    }
    let elapsedWt = elapsed*i
    weightedSum=weightedSum+elapsedWt;
    weightCount = weightCount+i;
  }

  // take into account current wait (time since last beat)
  let currentElapsed = performance.now()-histVentTimes.at(-1);
  let weightedAverageElapsed;
  let weightedAverageHR;
  // if currentElapsed > histVentTimes.at(-1) - histVentTimes.at(-2)
  if (currentElapsed > histVentTimes.at(-1) - histVentTimes.at(-2))
    {
    weightedAverageElapsed = currentElapsed;
    histVentTimes.splice(0,histVentTimes.length-2);
    weightedAverageHR = 1/(weightedAverageElapsed/60000);
    }
    else
    {
      weightedAverageElapsed = (weightedSum)/(weightCount);
      weightedAverageHR = 1/(weightedAverageElapsed/60000);
    }

    let weightedAverageMS = weightedSum/weightCount;
    weightedAverageHR = 1/(weightedAverageMS/60000);

  if(isNaN(weightedAverageHR))
    {weightedAverageHR = null;}

  ctx1.fillText("HR: "+Math.floor(weightedAverageHR), canvas.width-200, 50);
}
paintHR();
setInterval(paintHR,1000);

function drawPacingSpike(px,py) {
  ctx.fillStyle = 'white';
  ctx.fillRect(px,py,2,-75)
  ctx.fillStyle = "#00bd00";
  paceSpike=false;
}
