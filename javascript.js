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

//pacing intervals
var lowerRateLimitTimer // the rate of the pacemaker in ms
var AVITimer = 200 // the set interval between a sensed/paced A and associated V (artificial PR interval)
var VAItimer = 1000 - 200 // the timer after sensed/paced V and next due A
var VRP // prevent ventricular sensing of immediate post-V noise (OPTIONAL)
var PVARP // prevent atrial sensing of immediate post-V noise (OPTIONAL)
var upperRateLimit //prevent atrial tracking of atrial tachyarrythmias (OPTIONAL)
var rNEW=0
var rOLD=0
var AVExtension=0
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
var histPTimes=[0];
var histVentTimes = [0];   // each time implies a beat
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

document.getElementById("rhythmList").onchange = function() {
 
  const value = document.getElementById("rhythmList").value; 

  if (value) {
    currentRhythm=value;
  } else {
    currentRhythm='NSR';
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

  /*
  var tempArray=smoothP.slice();
   for (let j = 0; j < smoothP.length; j++) */
      var tempArray=shortP80.slice();
      for (let j = 0; j < shortP80.length; j++)
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
var PRtimer=-1;
function masterRhythmFunction()
{
  if (document.getElementById("CHBbox").checked==true)
    {
      //currentRhythm='CHB'
      CHB=true;
    }
  if (document.getElementById("CHBbox").checked==false)
    {
      //currentRhythm='NSR'
    CHB=false;
    }

  if (currentRhythm=='flatline')
  {
    if (!CHB && timeSinceLastP() >= PRInterval && drawQRS)
    {
      drawQRST();
      drawQRS=false;
    }
  }
 
if (currentRhythm=='NSR') // with this version, will incorporate a PR timer so that a V follows every P (paced or not) (unless CHB)
    {
      if(dataClock%100 == 0)
      {
        PRInterval = document.getElementById("PRbox").value;  // native PR interval
        setHR = document.getElementById("avgRateBox").value;
        HRadjustedPR = PRInterval - 0.5*setHR + 30;   // PR should decrease with increasing heart rates
        if (HRadjustedPR<5){HRadjustedPR=5}
        
        goalMS = (1/setHR)*60000
        adjustRatio = realtimeProcessSpeed/((1/dataHertz)*1000);
      }
        //let timeSinceV = timeSinceLastV();
        let timeSinceP = timeSinceLastP();
        let timeSinceV = timeSinceLastV();

        if (!CHB)
        {
        //if (timeSinceP >= goalMS && timeSinceV >= goalMS - HRadjustedPR)   // this working 9/27
        if (timeSinceP >= goalMS && timeSinceV >= goalMS - HRadjustedPR && timeSinceLastV() > 200 )
        {
          drawPWave();
          timeSinceP=timeSinceLastP();
          if (!CHB)
          {
            drawQRS = true; // flag that QRS should come follow sinus P
          }

        }
        testClock = dataClock;
        timeSinceP=timeSinceLastP()
        timeSinceV=timeSinceLastV()

        if (timeSinceP==0 || timeSinceP == 2)
        {
          PRtimer=0; //start timer
          drawQRS=true;
        }
        if (PRtimer>=0)
        {
          PRtimer+=2;
        }
 
      // if (drawQRS && timeSinceLastV()>=goalMS && timeSinceLastP()>=HRadjustedPR && !CHB) // QRS should respond to any P's after a PR interval (unless CHB)
      if (drawQRS && PRtimer >= HRadjustedPR && !CHB && timeSinceLastSensedV() > 150)  // !!! THIS PART CAUSING DOUBLE V-PACING -- built in minimum V-refractory 150 ms
      {
          drawQRST();
          drawQRS=false;
          PRtimer=-1; // stop PRtimer
      }
      else if (drawQRS && PRtimer >= HRadjustedPR && !CHB) // if above never runs, then clear QRS and PR timer
      {
        drawQRS=false;
        PRtimer=-1;
      }
    }
      if (CHB)
        {
          let timeSinceP = timeSinceLastP()
          let timeSinceV = timeSinceLastV()
          ventHeartRate = document.getElementById("ventRateBox").value;
          atrialHeartRate = document.getElementById("atrialRateBox").value;
          let goalVentMs = 1/(ventHeartRate/60000)
          let goalAtrialMs = 1/(atrialHeartRate/60000)
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
/*
    if (currentRhythm=='CHB')
    {
      let timeSinceP = timeSinceLastP()
      let timeSinceV = timeSinceLastV()
      ventHeartRate = document.getElementById("ventRateBox").value;
      atrialHeartRate = document.getElementById("atrialRateBox").value;
      let goalVentMs = 1/(ventHeartRate/60000)
      let goalAtrialMs = 1/(atrialHeartRate/60000)
      if (timeSinceLastP() >= 1/(atrialHeartRate/60000))
      {
        drawPWave();
      }

      if (timeSinceLastV() >= 1/(ventHeartRate/60000))
      {
        drawQRST();
      }
    }
    */

    if (currentRhythm == "junctional")
    {
      // narrow QRS
      let timeSinceV = timeSinceLastV()
      ventHeartRate = document.getElementById("ventRateBox").value;
      let goalVentMs = 1/(ventHeartRate/60000)
      if (timeSinceLastV() >= 1/(ventHeartRate/60000))
      {
        drawQRST();
      }

      // if paced P appears, then QRS should follow (no block)

      if (timeSinceLastP()==0 || timeSinceLastP() == 2)
      {
        PRtimer=0; //start timer
        drawQRS=true;
      }
      if (PRtimer>=0)
      {
        PRtimer+=2;
      }

     
      if (drawQRS && PRtimer >= HRadjustedPR && !CHB && timeSinceLastSensedV() > 150)  // !!! THIS PART CAUSING DOUBLE V-PACING -- built in minimum V-refractory 150 ms
      {
          drawQRST();
          drawQRS=false;
          PRtimer=-1; // stop PRtimer
      }
      else if (drawQRS && PRtimer >= HRadjustedPR && !CHB) // if above never runs, then clear QRS and PR timer
      {
        drawQRS=false;
        PRtimer=-1;
      }
    }

    if (currentRhythm == "ventEscape")    // escape rhythm means sinus node is too slow or has stopped, but conduction still present (e.g. paced P should make a qrs)
    {
      // wide QRS (ventricular origin)
      

      let timeSinceV = timeSinceLastV()
      ventHeartRate = document.getElementById("ventRateBox").value;
      let goalVentMs = 1/(ventHeartRate/60000)
      if (timeSinceLastV() >= 1/(ventHeartRate/60000))
      {
        // *** insert wide QRS code here ***
        drawQRST();
      }

      // if paced P appears, then *NARROW* QRS should follow (no block, should follow normal conduction)

      if (timeSinceLastP()==0 || timeSinceLastP() == 2)
      {
        PRtimer=0; //start timer
        drawQRS=true;
      }
      if (PRtimer>=0)
      {
        PRtimer+=2;
      }

     
      if (drawQRS && PRtimer >= HRadjustedPR && !CHB && timeSinceLastSensedV() > 150)  // !!! THIS PART CAUSING DOUBLE V-PACING -- built in minimum V-refractory 150 ms
      {
          // *** insert *NARROW* QRS code here ***
          drawQRST();
          drawQRS=false;
          PRtimer=-1; // stop PRtimer
      }
      else if (drawQRS && PRtimer >= HRadjustedPR && !CHB) // if above never runs, then clear QRS and PR timer
      {
        drawQRS=false;
        PRtimer=-1;
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
/*
function ECGsyn() {
  clearRhythms();
	dataFeed=synthECG.slice();
  
}
*/
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
   // currentHeartRate=Math.round(weightedAverageHR*(processingSpeed/dataHertz));  // depends on realtime browser time measurements
      currentHeartRate=Math.ceil(weightedAverageHR); // unaffected by realtime browser time measurements
  
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

var AVInterval = 120; // pacemaker interval between atrial and v pace
let captureOverride = false;
var sensing = 0; // 0: sensing appropriate, -1: undersensing, +1: oversensing


function pacingFunction()
{
  AVInterval = document.getElementById("AVInterval").value; // delay between atrial and vent pace
  
  let timeSinceP = timeSinceLastSensedP();
  let timeSinceV = timeSinceLastSensedV();
  let goalPacerMs = (1/pacingRate)*60000; // goal how many ms between R waves
  let element = document.getElementById("pacingMode")
  pacerMode = element.options[element.selectedIndex].text;
  
 
    // AAI (A pace, A sense (ignore V) )

    if (pacerMode=='AAI')
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
    // Figure 6.3. The VVI timing cycle consists of a defined LRL and a VRP (shaded triangles).
    // When the LRL timer is complete, a pacing artifact is delivered in the absence of a sensed
    // intrinsic ventricular event. If an intrinsic QRS occurs, the LRL timer is started from that
    // point. A VRP begins with any sensed or paced ventricular activity   
    
    if (pacerMode == 'VVI')
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
            PRtimer=-1; // stop PRtimer
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
            
    // DDI (pace A and V; don't track A)
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

    
    if (pacerMode == 'DDI') 
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
    if (timeSinceLastSensedV() > goalPacerMs && timeSinceLastSensedP() >= AVInterval)
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

  // DDD (pace A and V; track A (if native A rate > pacer rate, pace V at native A rate))
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
    // 5.3.3 A. Tracking
    // A. Tracking (atrial tracking) is only accessible or applicable when the temporary pacemaker
    // is set to sense and pace in both chambers. When A. Tracking is turned On, the temporary
    // pacemaker paces the ventricle in synchrony with intrinsic atrial depolarizations.
    //
    // When A. Tracking is turned on (DDD pacing mode), each sensed event on the atrial lead not
    // only inhibits the scheduled atrial pacing pulse, but also triggers an A-V Interval.
    // Warning: If a patient is prone to atrial arrhythmias, atrial tracking could lead to the
    // development of ventricular arrhythmias (see Section 1.5).
    //
    // When A. Tracking is off (DDI pacing mode), an atrial sense will inhibit an atrial pace, but it
    // does not trigger an A-V Interval (see Figure 45). The ventricle is paced at the selected
    // RATE.

    // ---------- DDD TIMING CYCLE ------------
    // The timing cycle in DDD consists of an LRL, an AVI, a VRP, a PVARP, and a URL. There are four variations 
    // of the DDD timing cycle. If intrinsic atrial and ventricular activity occur before the LRL times out, 
    // both channels are inhibited and no pacing occurs (first panel). 
    // 
    // If a P wave is sensed before the VAI is 
    // completed (the LRL minus the AVI), output from the atrial channel is inhibited. The AVI is initiated, 
    // and if no ventricular activity is sensed before the AVI terminates, a ventricular pacing artifact is delivered, 
    // that is, P-synchronous pacing (second panel). 
    //
    // If no atrial activity is sensed before the VAI is completed, 
    // an atrial pacing artifact is delivered, which initiates the AVI. 
    // If intrinsic ventricular activity occurs before the termination of the AVI, ventricular output from the pacemaker is inhibited, that is, 
    // atrial pacing (third panel). 
    // 
    // If no intrinsic ventricular activity occurs before the termination of the AVI, 
    // a ventricular pacing artifact is delivered, that is, AV sequential pacing (fourth panel).
    //
    // The basic timing circuit associated with LRL DDD pacing is divided into two sections.The first is the interval 
    // from a ventricular sensed or paced event to an atrial paced event and is known as the AEI, or VAI. 
    // The second interval begins with an atrial sensed or paced event and extends to a ventricular event. 
    // This interval may be defined by a paced AV, PR, AR, or PV interval.
    //
    // var lowerRateLimit // the rate of the pacemaker in ms
    // var AVI // the set interval between a sensed/paced A and associated V (artificial PR interval)
    // var VRP // prevent ventricular sensing of immediate post-V noise (OPTIONAL)
    // var PVARP // prevent atrial sensing of immediate post-V noise (OPTIONAL)
    // var upperRateLimit //prevent atrial tracking of atrial tachyarrythmias (OPTIONAL)
    //
    // LRL = VAI + AVI
    // 
    // If there is intact conduction through the AV node after an atrial pacing stimulus such that the AR interval
    // (atrial stimulus to sensed R wave) is shorter than the programmed AVI, the resulting paced rate accelerates 
    // by a small amount. This response is demonstrated in Figure 6.12 (top).
    //
    // The addition of an RRAVD to a ventricular-based timing system minimizes the increase in the 
    // paced atrial rate above the programmed sensor-indicated rate.
    //
    // Another option is extending the VAI as needed to control the AA pacing rate according to the programmed MSR 
    // (Fig. 6.44). This extension results in adaptive-rate pacing, regardless of AV conduction status, which is 
    // equal to, but does not exceed, the desired MSR.
    //  -- Basically, extend the VA interval based on sensed AR interval to ensure R-R equals goalMS

    
    if (pacerMode == 'DDD')
    {
      timeSinceV=timeSinceLastSensedV();
      timeSinceP=timeSinceLastSensedP();
      var autoAV = AVIntervalHRAdjustBox.checked;
      let lowerRateLimit = VAItimer + AVInterval
      let VAinterval = goalPacerMs - AVInterval
      let HRadjustedAV = 300 - (1.67 * pacingRate)
      var usedAVinterval = HRadjustedAV
      if (HRadjustedAV < 50) {HRadjustedAV = 50}
      if (HRadjustedAV > 250) {HRadjustedAV = 250}

      if (autoAV)
      {
        usedAVinterval = HRadjustedAV // auto AV 
      }
      else
      {
        usedAVinterval = AVInterval // use whatever is in the box
      }

      if (timeSinceLastSensedV() == 2) // The first is the interval from a ventricular sensed or paced event to an atrial paced event and is known as the AEI, or VAI.
      {
        rOLD = rNEW
        rNEW = dataClock
        if (autoAV)
        {
        VAItimer = goalPacerMs - usedAVinterval + AVExtension // start the VAI/AEI timer (interval from vent to next P)
        }
        else
        {
        VAItimer = goalPacerMs - usedAVinterval // start the VAI/AEI timer (interval from vent to next P)
        }
        AVITimer = usedAVinterval; // set timers
        VAITimerFlag = true;  // turn on V-A timer
        AVITimerFlag = false; // turn off A-V timer
      }
      if (goalPacerMs - (rNEW - rOLD) > 0 )
      {
      AVExtension = goalPacerMs - (rNEW - rOLD) // how far off was last effect pacing rate from goal rate?
      }
      else {AVExtension =0}
      
      if (timeSinceLastSensedP() == 2)  // The second interval begins with an atrial sensed or paced event and extends to a ventricular event. This interval may be defined by a paced AV, PR, AR, or PV interval.
      {
        //VAItimer = goalPacerMs - AVInterval // start the VAI/AEI timer (interval from vent to next P)
        AVITimer = usedAVinterval // set timers
        VAITimerFlag = false; // turn off V-A timer
        AVITimerFlag = true; // turn on A-V timer
        
      }

      if (VAItimer <= 0 && VAITimerFlag)  // if vent to atri timer runs out, pace atrium
      {
        if (pacerCapturing(atrium))
        {
        paceIt(atrium);
        }
        else if (!pacerCapturing(atrium)) // if not capturing, just draw a pacing spike and do nothing else
        {
          drawPacingSpike();
        }
      }

      if (AVITimer <= 0 && AVITimerFlag) // if atrium to vent timer runs out, pace vent
      {
        if (pacerCapturing(vent))
        {
        paceIt(vent);
        }
        else if (!pacerCapturing(vent)) // if not capturing, just draw a pacing spike and do nothing else
        {
          drawPacingSpike();
        }
      }
        // tick the timers down
        if (AVITimerFlag)
        {
          AVITimer -= 2; 
        }
        if (VAITimerFlag)
        {
          VAItimer -= 2;
        }
        
      
  }

}
var AVITimerFlag=false;
var VAITimerFlag=false;


var pacerMode = 'DDD';
var pacedFlag=false;

function stopPacing() {
  pacingState=false;
}


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
  drawPacemaker();

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


// ------- PACEMAKER CANVAS ---------
var pacemakerCanvas = document.getElementById("pacemakerCanvas");
var pacemakerHeight = pacemakerCanvas.height = document.getElementById("pacemakerDiv").offsetHeight
var pacemakerWidth = pacemakerCanvas.width = document.getElementById("pacemakerDiv").offsetWidth

var pacemakerCtx = pacemakerCanvas.getContext("2d");
var pacemakerImg = new Image();
pacemakerImg.src = "assets/pacemaker.svg";
pacemakerImg.onload = function() {
  drawPacemaker()
};

function drawPacemaker()
{
  pacemakerHeight = pacemakerCanvas.height = document.getElementById("pacemakerDiv").offsetHeight
  pacemakerWidth = pacemakerCanvas.width = document.getElementById("pacemakerDiv").offsetWidth
  pacemakerCtx.drawImage(pacemakerImg,0,0);
}

