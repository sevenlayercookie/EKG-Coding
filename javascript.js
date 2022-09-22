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

PHYSIOLOGY POINTS
 - in typical conduction scenarios, SA node is NOT affected by ectopic impulses, including those coming from the ventricle.
    - it can however sometimes be reset by ectopic impulses (non-compensatory pause)
        - for simplicity, might just ignore this and do only compensatory pauses (consistent P clock throughout)
    - so, any PVCs should NOT disturb the timing of the SA node
    - this doesn't mean we will always see a P wave though (the SA can fire, but not cause atrial contraction if the surrounding tissue is refractory)
    - so after a PVC/PJC/PAC, maybe no P wave, but the next P will be right on time with original P-P interval (compensatory pause)
    - program relevance: there needs to be an absolute sinus interval/clock (P-P interval) that is not affected by ectopy (PVCs, pacing, etc.)



*/

// -------------------------- GLOABL DEFINITIONS -----------------------------
var PRInterval;
var timeSincePGlobal=1;
var timeSinceVGlobal=1;
var timeSinceSensedPGlobal=1;
var timeSinceSensedVGlobal=1;
var HRadjustedPR=120;
var ventHeartRate = 40;
var atrialHeartRate = 80;
var conductionIntact = true;
var avgProcessSpeed = 2;
var goalMS=1000;
var dataCount=0;
var dataClock=0;
var testClock=0;
var setHR = 60;
var CHB = false;
var dataFeedLength=500;
var teleCanvas = document.getElementById("tele");
var teleCtx = teleCanvas.getContext("2d");
var HRCanvas = document.getElementById("HRLayer");
var HRctx = HRCanvas.getContext("2d");
var HRchanged = false;
var paceSpike=false;
var ventPacingChecked=false;
var px=0;
h = tele.height
var processingSpeed = 570;
var realtimeProcessSpeed = 2;
var adjustRatio = 1;
var lastBrowserTime = Date.now();
dataHertz = 500, // in Hz (data points per second)
canvasBaseline = tele.height/2+25,
py = canvasBaseline;
var y = dataHertz/144;

var aPacerSensitivity = document.getElementById("aSensitivityBox").value; // default 
var vPacerSensitivity = document.getElementById("vSensitivityBox").value; // default 
var aPacerOutput = document.getElementById("aOutputBox").value;
var vPacerOutput = document.getElementById("vOutputBox").value;
var vCaptureThreshold = 5; // default V capture threshold (mA)
var aCaptureThreshold = 2; // default A capture threshold (mA)


// ------------------------- onload () ---------------------------------------
onload();
function onload() {
  // --------------------- LOCAL DEFINITIONS ---------------------------------
  dataFeed.length = 1000;
  dataFeed.fill(0,0,1000);
  document.getElementById("tele").width = window.innerWidth;
  document.getElementById("HRLayer").width = window.innerWidth;
  PRInterval = document.getElementById("PRbox").value;
  var w = tele.width,
    
    l = 0,
    sec = 0,
    avgRefresh = 1,
    avgFPS = 144,
    animateRatio = dataHertz / avgFPS,
    dataVoltage = 10, // in mV
    compressHfactor = 20,
    
    opx = 0,
    speed = .2, // speed of the cursor across the screen; affects "squeeze" of waves
    isPainted = true;
    timestamp = performance.now();
    paintCount = 1;
    (opy = py), (scanBarWidth = 1), (PVCflag = 0);
    k = 0;
  teleCtx.strokeStyle = "#00bd00";
  teleCtx.lineWidth = 3;

  // framelimiter code
  var fpsInterval, startTime, now, then, elapsed;

  // initialize the timer variables and start the animation

  var p = 0;
  var i = 0;
  var j = 0;
  var jold = 0;

  // initiate animation (is looped)
  function startAnimating() {
    teleCtx.beginPath();
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

    if (i%100==0) // every 100 data points (200 ms), calc realtime Hz
    {
      randomizeThresholds();
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
    teleCtx.beginPath();
    //for (let z = 0; z < dataHertz / avgFPS; z++)
    // let y = dataHertz/avgFPS
    
    for (let z = 0; z < y; z++)  
    {
      parseData();
      px += speed; // horizontal pixels per data point

      //if (paceSpike)
        //{drawPacingSpike();}

      teleCtx.moveTo(opx, opy);
      teleCtx.lineTo(px, py);
      opx = px;
      opy = py;

      teleCtx.clearRect(px+10, 0, scanBarWidth, h); 
      
      if (opx > teleCanvas.width || opx > document.getElementById("canvasesdiv").offsetWidth) {
        px = opx = 0; //-speed;
        teleCtx.clearRect(px, 0, 10, h); 
      }
      
    }
    
    isPainted = false;
    requestAnimationFrame(paint);
    document.getElementById("demoTEXT2").innerText = i;
  }

  function paint() {
    teleCtx.stroke();
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
    captureOverride=true;
  }
    else
    {
      captureOverride=false;
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

  if (aPacerSensitivity <= aUndersenseThreshold) // not undersensed
  {
    sensedPTimes.push(dataClock); // mark sensed A
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

var sensedVentTimes = [];   // each time implies a beat
var vAmplitude = 0.660; // default amplitude of R-wave
var sensedPTimes = [];   // each time implies a beat
var aAmplitude = 0.290; // default amplitude of P-wave

var aOversenseThreshold = 1.5 // threhsold below which pacer will oversense (e.g. T wave)
var aUndersenseThreshold = 10 // threshold above which pacer will undersense (e.g. won't see P wave)
                              // The sensing threshold is the least sensitive mV setting at which the temporary pacemaker can detect a heartbeat

var vOversenseThreshold = 1.5 // threhsold below which pacer will oversense (e.g. T wave)
var vUndersenseThreshold = 10 // threshold above which pacer will undersense (e.g. won't see R wave)


function drawQRST() {
  i = 0;
  j = 0;
    // mark event according to data clock
  histVentTimes.push(dataClock);
  if (histVentTimes.length>10)
  {
  histVentTimes.shift();
  }

  if (vPacerSensitivity <= vUndersenseThreshold) // not undersensing -> mark real V
  {
    sensedVentTimes.push(dataClock); //mark sensed V
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
 
var currentRhythm = "NSR";
var drawQRS=false;

function masterRhythmFunction()
{
  if (currentRhythm=='flatline')
  {
    if (!CHB && timeSinceLastP() >= PRInterval && drawQRS)
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
          if (!CHB)
          {
          drawQRS = true; // flag that QRS should come
          }

        }
        testClock = dataClock;
        timeSinceP=timeSinceLastP()
        timeSinceV=timeSinceLastV()


      // if (drawQRS && timeSinceLastV()>=goalMS && timeSinceLastP()>=HRadjustedPR && !CHB) // QRS should respond to any P's after a PR interval (unless CHB)
      if (drawQRS && timeSinceLastP()>=HRadjustedPR && !CHB)  // !!! THIS PART CAUSING DOUBLE V-PACING
      {
          drawQRST();
          drawQRS=false;
          
        }

        if (CHB)
          {
            ventHeartRate = document.getElementById("ventRateBox").value;
            let timeeeeee = timeSinceLastV()
            if (timeeeeee >= 1/(ventHeartRate/60000))
            {
              drawQRST();
            }
          }
        
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
  CHB = false;
  document.getElementById("CHBbox").checked = false;
  document.getElementById("CHBstuff").hidden = true;
	setHR = document.getElementById("avgRateBox").value;

  goalMS = (1/setHR)*60000

}

function ECGsyn() {
  clearRhythms();
	dataFeed=synthECG.slice();
  
}

function showCHB() {
  document.getElementById("CHBbox").checked = true;
  clearRhythms();
  currentRhythm = 'CHB';
  CHB = true;
  document.getElementById("CHBstuff").hidden=false;
  ventHeartRate = document.getElementById("ventRateBox").value;
  atrialHeartRate = document.getElementById("atrialRateBox").value;
  // setHR = document.getElementById("avgRateBox").value = ventHeartRate;

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

  HRctx.font = "50px Arial";
  HRctx.fillStyle = "#00bd00";
  HRctx.lineWidth = 3;
  HRctx.clearRect(0,0,HRCanvas.width,HRCanvas.height); //clears previous HR 
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
  
    if (teleCanvas.width < document.getElementById("canvasesdiv").offsetWidth)
      {
      HRctx.fillText("HR: "+currentHeartRate, teleCanvas.width-200, 50); //actual paint command
      }
    else
      {
        HRctx.fillText("HR: "+currentHeartRate, document.getElementById("canvasesdiv").offsetWidth-190, 50); //actual paint command
      }
  }
paintHR();
setInterval(paintHR,1000);

function drawPacingSpike() {
  teleCtx.fillStyle = 'white';
  teleCtx.fillRect(px,py,2,-75)
  teleCtx.fillStyle = "#00bd00";
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
//      - if undersensing:  will pace asynchrohnously regardless of underlying rhythm
//      - if oversensing:   will not pace at all
//           - crosstalk = leads in different chambers interact (e.g. A-lead interprets V-pace stimulus as a native P wave)
//           - T-wave = T is sensed as an R wave
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
  if (pacerCapturing(target))
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
var atrialRefactoryPeriod = 0;
var ventBlankingPeriod = 0;
function startPacing() {
	
	pacingRate = document.getElementById("pacingRate").value;
  
  pacingState = true;  
}

let AVInterval = 120; // should link to form later
let captureOverride = false;
let sensing = 0; // 0: sensing appropriate, -1: undersensing, +1: oversensing

/* GOOD PACING FUNCTION BACKUP
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
        if (pacerCapturing(atrium))
        {
          if (conductionIntact)
          {
            drawQRS = true;
          }
        paceIt(atrium);
        }
        else if (!pacerCapturing(atrium)) // if not capturing, just draw a pacing spike and do nothing else
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
        if (pacerCapturing(vent))
        {
        paceIt(vent);
        }
        else if (!pacerCapturing(vent)) // if not capturing, just draw a pacing spike and do nothing else
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
        if (pacerCapturing(atrium))
        {
          paceIt(atrium);
          timeSinceP=timeSinceLastP();
        }
        if (!pacerCapturing(atrium))
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
        if (pacerCapturing(vent))
        {
        paceIt(vent);
        }
        else if (!pacerCapturing(vent)) // if not capturing, just draw a pacing spike and do nothing else
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

*/

function pacingFunction()
{
  AVInterval = document.getElementById("AVInterval").value;
  let timeSinceP = timeSinceLastSensedP();
  let timeSinceV = timeSinceLastSensedV();
  let goalPacerMs = (1/pacingRate)*60000; // goal how many ms between R waves
  
  //randomizeThresholds();

    // AAI (A pace, A sense (ignore V) )

    if (atrialPacingChecked && !ventPacingChecked)
    {
      if (timeSinceLastSensedP() > goalPacerMs) // has it been long enough since last P?
      {
        
        if (aPacerSensitivity >= aOversenseThreshold) // is pacer not oversensing?
        {
          if (atrialRefactoryPeriod <= 0) // if pacer fires, should have a 'refractory period' where it will not pace again
          {
            if (pacerCapturing(atrium)) // is output high enough?
            {
              if (!CHB) // is conduction intact?
              {
                drawQRS = true; // signal that QRS should be drawn next
              }
            paceIt(atrium);
            }
            else if (!pacerCapturing(atrium)) // if not capturing, just draw a pacing spike and do nothing else
            {
              drawPacingSpike();
            }
            atrialRefactoryPeriod = goalPacerMs; // with capture or not, start pacertimeout
          }
     
    }
  }
    if (atrialRefactoryPeriod>0)  // augment pacer timer if running
    {
      atrialRefactoryPeriod -= 2;
    }
  }
    // VVI (V pace only, V sense, ignore A completely)
    
    if (ventPacingChecked && !atrialPacingChecked)
    {
      if (timeSinceLastSensedV() > goalPacerMs)
      {
        
        if (vPacerSensitivity >= vOversenseThreshold) // is pacer not oversensing?
        {
    
          if (ventBlankingPeriod <= 0) // if pacer fires, should have a timeout period
          {
            if (pacerCapturing(vent))
            {
            paceIt(vent);
            }
            else if (!pacerCapturing(vent)) // if not capturing, just draw a pacing spike and do nothing else
            {
              drawPacingSpike();
            }
            ventBlankingPeriod = goalPacerMs; // with capture or not, start pacertimeout
          }
    }
  }
    if (ventBlankingPeriod>0)  // augment pacer timer if running
    {
      ventBlankingPeriod -= 2;
    }
  }
            
    // DDD (pace A and V)
    // DDD vs DDI
    // DDD: can track the atrium and pace ventricle accordingly (not good for tachyarrhythmias)
    //      so if senses intrinsic P -> paces V at intrinsic P rate ("atrial tracking")
    // DDI: only inhibits (so senses P -> inhibits P; senses V -> inhibits V)
    // "atrial tracking: ON" means DDD. "atrial tracking: OFF" means DDI.
    //
    // -- FROM THE MANUAL --
    // 
    // if no intrinsic P, pace V after V-A interval which is equal to the programmed base RATE minus the programmed A-V INTERVAL. 
    // if no intrinsic V, pace V after programmed A-V interval
    //
    // 
    //
    //
    //
    if (atrialPacingChecked && ventPacingChecked)
    {
      timeSinceV=timeSinceLastSensedV();
      timeSinceP=timeSinceLastSensedP();
      
      // Atrial logic
      if (timeSinceLastSensedP() >= goalPacerMs && timeSinceLastSensedV() >= goalPacerMs - AVInterval)
      { 
        
        if (aPacerSensitivity >= aOversenseThreshold) // is pacer not oversensing?
        {
          
        if (atrialRefactoryPeriod <= 0) // if pacer fires, should have a timeout period (refractory period)
      {
        if (pacerCapturing(atrium))
        {
          paceIt(atrium);
          if (!CHB) // is conduction intact?
              {
                drawQRS = true; // signal that QRS should be drawn next
              }
          timeSinceP=timeSinceLastSensedP();
        }
        if (!pacerCapturing(atrium))
        {
          drawPacingSpike();
        }
        atrialRefactoryPeriod = goalPacerMs; // with capture or not, start pacertimeout
      }
          }
    }
    if (atrialRefactoryPeriod>0)  // augment pacer timer if running
    {
      atrialRefactoryPeriod -= 2;
    }

    // vent logic
    timeSinceV=timeSinceLastSensedV();
    timeSinceP=timeSinceLastSensedP();
    if (timeSinceLastSensedV() >= goalPacerMs && timeSinceLastSensedP() >= AVInterval)
    {
   
      if (vPacerSensitivity >= vOversenseThreshold) // is pacer not oversensing?
        {
      if (ventBlankingPeriod <= 0) // if pacer fires, should have a timeout period
      {
        if (pacerCapturing(vent))
        {
        paceIt(vent);
        }
        else if (!pacerCapturing(vent)) // if not capturing, just draw a pacing spike and do nothing else
        {
          drawPacingSpike();
        }
        ventBlankingPeriod = goalPacerMs; // with capture or not, start pacertimeout
      }
    }
  }
    if (ventBlankingPeriod>0)  // augment pacer timer if running
    {
      ventBlankingPeriod -= 2;
    }
  }
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

function timeSinceLastSensedP() {
  if (isNaN(sensedPTimes.at(-1))) {return 100000;}
  //let timeee = (dataClock - histPTimes.at(-1))*(processingSpeed/dataHertz);
  let timeee = (dataClock - sensedPTimes.at(-1));
  timeSinceSensedPGlobal=timeee;
  return timeee;
}

function timeSinceLastV() {
  if (isNaN(histVentTimes.at(-1))) {return 100000;}
  //let timeee = (dataClock - histVentTimes.at(-1))*(processingSpeed/dataHertz);
  let timeee = (dataClock - histVentTimes.at(-1));
  timeSinceVGlobal=timeee;
  return timeee ;
}

function timeSinceLastSensedV() {
  if (isNaN(sensedVentTimes.at(-1))) {return 100000;}
  //let timeee = (dataClock - histVentTimes.at(-1))*(processingSpeed/dataHertz);
  let timeee = (dataClock - sensedVentTimes.at(-1));
  timeSinceSensedVGlobal=timeee;
  return timeee;
}

function windowSizeChange() {
  // run code to match canvas to current window size
  // should probably change both canvas sizes (canvas, canvas1), clear both canvases, realign drawing point to left side of screen, and move HR indicator

  //canvas.width = window.innerWidth;
  HRCanvas.width = window.innerWidth;
  //ctx.width = window.innerWidth;
  //ctx1.width = window.innerWidth;
  //px = opx = 0;
  teleCtx.clearRect(px, 0, scanBarWidth, h); 
  paintHR();
  //ctx1.clearRect(0,0,canvas1.width,canvas1.height); //clears previous HR 
  

}

window.addEventListener('resize',windowSizeChange);

function pacerCapturing(chamber) {
  if (captureOverride)
  {return true;}
  else
  {
    if (chamber == atrium && aPacerOutput >= aCaptureThreshold)
    {
      return true;
    }
    if (chamber == vent && vPacerOutput >= vCaptureThreshold)
    {
      return true;
    }
    else {return false;}
  } 
}

function onOutputChange(chamber) {
  if (chamber == "atrium")
  {
    aPacerOutput = document.getElementById("aOutputBox").value;
  }
  if (chamber == "ventricle")
  {
    vPacerOutput = document.getElementById("vOutputBox").value;
  }
}

function onSensitivityChange(chamber) {
  if (chamber == "atrium")
  {
    aPacerSensitivity = document.getElementById("aSensitivityBox").value;
  }
  if (chamber == "ventricle")
  {
    vPacerSensitivity = document.getElementById("vSensitivityBox").value;
  }
}

function clickCHB() {
  if (document.getElementById("CHBbox").checked)
  {
    CHB=true;
    document.getElementById("CHBstuff").hidden=false;
    ventHeartRate = document.getElementById("ventRateBox").value;
    atrialHeartRate = document.getElementById("atrialRateBox").value;
  }
  else
  {
    CHB=false;
    document.getElementById("CHBstuff").hidden=true;
    ventHeartRate = document.getElementById("ventRateBox").value;
    atrialHeartRate = document.getElementById("atrialRateBox").value;
  }
}

function randomizeThresholds() // randomize a bit capture, oversense, undersense thresholds
{
  // capture thresholds (default A=2, V=5)
  vCaptureThreshold = 5 + (Math.random() - 0.5)*2 //      +/- 1
  aCaptureThreshold = 2 + (Math.random() - 0.5)*2 //      +/- 1

  // sensitivity Thresholds (default A=1.5, 10   and V=1.5, 10)
  aOversenseThreshold = 1.5 + (Math.random() - 0.5)*2 //      +/- 1
  aUndersenseThreshold = 10 + (Math.random() - 0.5)*2 //      +/- 1
  vOversenseThreshold = 1.5 + (Math.random() - 0.5)*2 //      +/- 1
  vUndersenseThreshold = 10 + (Math.random() - 0.5)*2 //      +/- 1
  
}