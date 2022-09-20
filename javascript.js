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
var timeSincePGlobal=10000;
var timeSinceVGlobal=10000;
var HRadjustedPR=120;
var ventHeartRate = 40;
var atrialHeartRate = 80;
var conductionIntact = true;
var avgProcessSpeed = 2;
var PRtimer = 0;
var goalMS=1000;
var dataCount=0;
var dataClock=0;
var setHR = 60;
var dataFeedLength=500;
var canvas = document.getElementById("demo");
var ctx = canvas.getContext("2d");
var HRchanged = false;
var paceSpike=false;
var ventPacingChecked=false;
var px=0;
h = demo.height
var processingSpeed = 570;
var realtimeProcessSpeed = 2;
var adjustRatio = 1;
var lastBrowserTime = Date.now();
dataHertz = 500, // in Hz (data points per second)

py = h * 1;
var y = dataHertz/144;
// ------------------------- onload () ---------------------------------------
onload();
function onload() {
  // --------------------- LOCAL DEFINITIONS ---------------------------------
  dataFeed.length = 1000;
  dataFeed.fill(0,0,1000);
  document.getElementById("demo").width = window.innerWidth;
  PRInterval = document.getElementById("PRbox").value;
  var w = demo.width,
    
    l = 0,
    sec = 0,
    avgRefresh = 1,
    avgFPS = 144,
    animateRatio = dataHertz / avgFPS,
    dataVoltage = 10, // in mV
    compressHfactor = 20,
    canvasBaseline = demo.height/2,
    opx = 0,
    speed = 0.2, // speed of the cursor across the screen; affects "squeeze" of waves
    isPainted = true;
    timestamp = performance.now();
    paintCount = 1;
    (opy = py), (scanBarWidth = 40), (PVCflag = 0);
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
    dataCount++;
    dataClock = dataClock + (1/dataHertz)*1000;  // clock for the project

    if (i%100==0) // every 100 data points, calc realtime Hz
    {
    avgProcessSpeed = calcRealtimeProcessingSpeed();
      if (avgProcessSpeed<2)
      {
        y-=1;
      }
      if (avgProcessSpeed>2)
      {
        y+=1;
      }
    }

    masterRhythmFunction()
    if (pacingState)
    {
      pacingFunction();
    }
    // i=i+parseInt(animateRatio)-1;
    if (dataFeed.length==0)
    {
      py=-(0*1000)/8+canvasBaseline;
      i = 0;
    } 
  }

  function calcRealtimeProcessingSpeed() {
    let browserTimeElapsed = Date.now()-lastBrowserTime;
  

    lastBrowserTime=Date.now();
    return browserTimeElapsed/100;
  }

  function loop() {
    //ctx.canvas.width  = window.innerWidth; // working on screen resizing
    l++; //count # of times through loop
    ctx.beginPath();
    //for (let z = 0; z < dataHertz / avgFPS; z++)
    // let y = dataHertz/avgFPS
    
    for (let z = 0; z < y; z++)  
    {
      parseData();
      px += speed; // horizontal pixels per data point

      //if (paceSpike)
        //{drawPacingSpike();}

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
input.onchange = function(){setHR=input.value;HRchanged=true;};
pacerate = document.getElementById('pacingRate');
pacerate.onchange = function(){pacingRate=pacerate.value};

document.getElementById('atrialPacing').onchange = function () 
  {
  if (document.getElementById('atrialPacing').checked)
  {
    atrialPacingChecked=true;
    
  }
  else
  {
    atrialPacingChecked=false;
  }
}
document.getElementById('ventPacing').onchange = function () 
  {
  if (document.getElementById('ventPacing').checked)
  {
    ventPacingChecked=true;
  }
  else
  {
    ventPacingChecked=false;
  }
}
document.getElementById('capturing').onchange = function () 
  {
    if (document.getElementById('capturing').checked)
  {
      pacerCapturing=true;
  }
    else
    {
      pacerCapturing=false;
    }

  
}   
}

// --------------------- end onLoad() ------------------------------

atrialPacingChecked=false;
var histPTimes=[];

function drawPWave() {
  i = 0;
  histPTimes.push(dataClock);
  if (histPTimes.length>10)
  {
    histPTimes.shift();
  }
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
function drawQRST() {
  i = 0;
  j = 0;
    // mark event according to data clock
  histVentTimes.push(dataClock);
  if (histVentTimes.length>10)
  {
  histVentTimes.shift();
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
 
var currentRhythm = "flatline";
var drawQRS=false;

function masterRhythmFunction()
{
  if (currentRhythm=='flatline')
  {
    if (conductionIntact && timeSinceLastP() >= PRInterval && drawQRS)
    {
      drawQRST();
      drawQRS=false;
    }
  }


  if (currentRhythm=='NSR')
    {
      if(dataClock%100 == 0)
      {
        PRInterval = document.getElementById("PRbox").value;
        setHR = document.getElementById("avgRateBox").value;
        HRadjustedPR = PRInterval - 0.5*setHR + 50;
        goalMS = (1/setHR)*60000
        adjustRatio = realtimeProcessSpeed/((1/dataHertz)*1000);
      }
        //let timeSinceV = timeSinceLastV();
        let timeSinceP = timeSinceLastP();
        let timeSinceV = timeSinceLastV();
        
        if (timeSinceP >= goalMS && timeSinceV >= goalMS - PRInterval)
        {
          drawPWave();
          timeSinceP=timeSinceLastP();
          PRtimer = 1;
          drawQRS = true;

        }
        //if (PRtimer>=HRadjustedPR && timeSinceV>=goalMS)
        if (drawQRS && timeSinceLastP()>=HRadjustedPR)
        {
          drawQRST();
          drawQRS=false;
          //PRtimer=0;
        }
        //if (PRtimer>0)
        //{PRtimer+=2;}
      }

    if (currentRhythm=='CHB')
    {
      let timeSinceP = timeSinceLastP()
      let timeSinceV = timeSinceLastV()
      if (timeSinceLastP() >= 1/(atrialHeartRate/60000))
      {
        drawPWave();
      }

      if (timeSinceLastV() >= 1/(ventHeartRate/60000))
      {
        drawQRST();
      }
    }
      
}



var currentRhythmID = [0,0];
function NSRhythm() 
{
  PRInterval = document.getElementById("PRbox").value;
	clearRhythms();
  currentRhythm = 'NSR';
	setHR = document.getElementById("avgRateBox").value;

  goalMS = (1/setHR)*60000

}

function ECGsyn() {
  clearRhythms();
	dataFeed=synthECG.slice();
  
}

function CHB() {
  clearRhythms();
  currentRhythm = 'CHB';
  document.getElementById("CHBstuff").hidden=false;
  ventHeartRate = document.getElementById("ventRateBox").value;
  atrialHeartRate = document.getElementById("atrialRateBox").value;
  setHR = document.getElementById("avgRateBox").value = ventHeartRate;

  /*
  currentRhythmID.push(setInterval(function ()
    {
      QRST();
    },(1/(ventHeartRate/60))*1000))

    currentRhythmID.push(setInterval(function ()
  {
    drawPWave();
  },(1/(atrialHeartRate/60))*1050));
  */

}

function clearRhythms()
{
  currentRhythm='flatline';
  dataFeed = [0];
  dataFeed.length = 1000;
  dataFeed.fill(0,0,1000);
  currentRhythmID.forEach((element) => 
  {
    clearInterval(element);
  });
  currentRhythmID = [];
}

var currentHeartRate=0;

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
  let currentElapsed = dataClock-histVentTimes.at(-1);
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
    currentHeartRate=Math.floor(weightedAverageHR*(processingSpeed/dataHertz));
  ctx1.fillText("HR: "+currentHeartRate, canvas.width-200, 50);
}
paintHR();
setInterval(paintHR,1000);

function drawPacingSpike() {
  ctx.fillStyle = 'white';
  ctx.fillRect(px,py,2,-75)
  ctx.fillStyle = "#00bd00";
  paceSpike=false;
}

/*
// ----------- PACEMAKER ABSTRACTION -------------
// I.   Controls          
// II.  Display on Feed   
// III. Logic             
// IV.  Pretty GUI        

// ----- LOGIC -----
//  I.  MODE (AAI,VVI,etc.)
//    a. SENSING
//    b. PACING
//    c. RESPONSE (pace,inhibit) - will just work on inhibit for now
//    d. RATE CONTROL   - only if I'm really wanting to hurt myself
//
//  II. SENSING
//      - should be able to 'sense' user-set threshold (e.g. 5 mV)
//      - if undersensing:  will pace 1:1 regardless of underlying rhythm
//      - if oversensing:   will not pace at all
//      - user should modify sensing threshold to cause appropriate pacing
//  III.  CAPTURE
//      - pacing spike should initiate a P wave or a QRS wave (depending if A or V lead)
//      - there is an arbitrary pacing threshold, where if not met, capture doens't occur
//      - failure to capture happens if output voltage is too low, or leads are off/corrupt
//      - user should increase voltage until capture occurs

// ------------- TO DO -------------
// [X] pacing capture algorithm
//    [ ] pacing spike should inhibit if intrinsic P's or V's present (if paced rate exceeds intrinsic)    
// [ ] pacing controls
//    [x] rate
//    [ ] AAI, VVI, DDI (dropdown box?)
//    [ ]
*/

const atrium = "atrium";
const vent = "vent";

function paceIt(target) // target : atrium = 1, vent = 2
{
  if (pacerCapturing)
  {
    drawPacingSpike();  // draw pacing spike
    if (target==atrium)
      {
        drawPWave();
      }
      else if (target==vent)
      {
        drawQRST();
      }
  }
  else // if not capturing
  {
    drawPacingSpike();
  }


}

function paceButtonClick() {
  let paceButton = document.getElementById("paceButton");
  if (paceButton.innerText == "Start Pacing")
  {
    startPacing();
    paceButton.innerText = "Stop Pacing";
  }
  else
  {
    stopPacing();
    paceButton.innerText = "Start Pacing";
  }
}
var aPacerInterval;
var vPacerInterval;
var pacerInterval;
var pacingState = false;
var pacingRate = 60;
var atrialPaceTimeout = 0;
var ventPaceTimeout = 0;
function startPacing() {
	
	pacingRate = document.getElementById("pacingRate").value;
  
  pacingState = true;  
}

let AVInterval = 120; // should link to form later
let pacerCapturing = true;
let sensing = 0; // 0: sensing appropriate, -1: undersensing, +1: oversensing

function pacingFunction()
{
  AVInterval = document.getElementById("AVInterval").value;
  let timeSinceP = timeSinceLastP();
  let timeSinceV = timeSinceLastV();
  let goalPacerMs = (1/pacingRate)*60000; // goal how many ms between R waves
    
    // AAI (A pace, A sense (ignore V) )

    if (atrialPacingChecked && !ventPacingChecked)
    {
      if (timeSinceLastP() > goalPacerMs)
      {
      if (atrialPaceTimeout <= 0) // if pacer fires, should have a timeout period
      {
        if (pacerCapturing)
        {
          if (conductionIntact)
          {
            drawQRS = true;
          }
        paceIt(atrium);
        }
        else if (!pacerCapturing) // if not capturing, just draw a pacing spike and do nothing else
        {
          drawPacingSpike();
        }
        atrialPaceTimeout = goalPacerMs; // with capture or not, start pacertimeout
      }
     
    }
    if (atrialPaceTimeout>0)  // augment pacer timer if running
    {
      atrialPaceTimeout -= 2;
    }
  }
    // VVI (V pace only, V sense, ignore A completely)
    
    if (ventPacingChecked && !atrialPacingChecked)
    {
      if (timeSinceLastV() > goalPacerMs)
      {

    
      if (ventPaceTimeout <= 0) // if pacer fires, should have a timeout period
      {
        if (pacerCapturing)
        {
        paceIt(vent);
        }
        else if (!pacerCapturing) // if not capturing, just draw a pacing spike and do nothing else
        {
          drawPacingSpike();
        }
        ventPaceTimeout = goalPacerMs; // with capture or not, start pacertimeout
      }
    }
    if (ventPaceTimeout>0)  // augment pacer timer if running
    {
      ventPaceTimeout -= 2;
    }
  }
            
    // DDD (pace A and V)
    if (atrialPacingChecked && ventPacingChecked)
    {
      timeSinceV=timeSinceLastV();
      timeSinceP=timeSinceLastP();
      
      // Atrial logic
      if (timeSinceLastP() > goalPacerMs && timeSinceLastV() > goalPacerMs - AVInterval)
      {
        if (atrialPaceTimeout <= 0) // if pacer fires, should have a timeout period
      {
        if (pacerCapturing)
        {
          paceIt(atrium);
          timeSinceP=timeSinceLastP();
        }
        if (!pacerCapturing)
        {
          drawPacingSpike();
        }
        atrialPaceTimeout = goalPacerMs; // with capture or not, start pacertimeout
      }
    }
    if (atrialPaceTimeout>0)  // augment pacer timer if running
    {
      atrialPaceTimeout -= 2;
    }

    // vent logic
    if (timeSinceLastV() > goalPacerMs && timeSinceLastP() > AVInterval)
    {
      if (ventPaceTimeout <= 0) // if pacer fires, should have a timeout period
      {
        if (pacerCapturing)
        {
        paceIt(vent);
        }
        else if (!pacerCapturing) // if not capturing, just draw a pacing spike and do nothing else
        {
          drawPacingSpike();
        }
        ventPaceTimeout = goalPacerMs; // with capture or not, start pacertimeout
      }
    }
    if (ventPaceTimeout>0)  // augment pacer timer if running
    {
      ventPaceTimeout -= 2;
    }
  }
}

function pacerLoop() {

}

function stopPacing() {
  pacingState=false;
}

/*
function timeSinceLastP() {
  if (isNaN(histPTimes.at(-1))) {return 100000;}
  let timeee = (performance.now()-histPTimes.at(-1))
  
  return timeee;
}

function timeSinceLastV() {
  if (isNaN(histVentTimes.at(-1))) {return 100000;}
  let timeee = (performance.now()-histVentTimes.at(-1))
  return timeee;
}
*/


function timeSinceLastP() {
  if (isNaN(histPTimes.at(-1))) {return 100000;}
  //let timeee = (dataClock - histPTimes.at(-1))*(processingSpeed/dataHertz);
  let timeee = (dataClock - histPTimes.at(-1));
  timeSincePGlobal=timeee;
  return timeee;
}

function timeSinceLastV() {
  if (isNaN(histVentTimes.at(-1))) {return 100000;}
  //let timeee = (dataClock - histVentTimes.at(-1))*(processingSpeed/dataHertz);
  let timeee = (dataClock - histVentTimes.at(-1));
  timeSinceVGlobal=timeee;
  return timeee ;
}
