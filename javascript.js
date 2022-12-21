
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

// -------------------------- GLOBAL DEFINITIONS -----------------------------


//
var pacedBeatFlag = false;
var ventRefractoryTimer = 9999
var atrialRefractoryTimer = 9999
var afibPSenseTimer = 9999
// Wenkebach
var baseWenkPR = 150
var currentWenkPR = baseWenkPR
var wenkDegree = 3 // # of conducted beats before drop
var wenkCount = 0 // current count of conducted beats
var wenkPRincreaseAmount  = 100 // by how much should PR interval increase?
var intermittentAVblock = false;
var AVBlockRandom = 1 // random factor of AV block
var lastBlocked = false;
var ratioBlockedPs = .20 // 20% of P's will be blocked
// a flutter vars
  var baselineFlutterConductionRatio = 4; // default 4:1 conduction ratio
  var currentFlutterConductionRatio = baselineFlutterConductionRatio; // this one can be varied for irregularity
  var flutterAtrialRate = 300   // most flutters are around 300 atrial rate
  var flutterAtrialMS = 1/(flutterAtrialRate/60000)
  var flutterConductionIrregularity = 1.5    // 0=regular, up to 2=twice as many frequent blocks
  var flutterVentRate = flutterAtrialRate/baselineFlutterConductionRatio
  var flutterVentMS = 1/(flutterVentRate/60000)
  var flutterAtrialTimer = 10000
// geminy vars
  var geminyRatio = 1   //  1=bigeminy (one normal, one PVC), 2=trigeminy (one normal, two PVC)
  var geminyCount = 0
  var PVCtimer = -1
  var drawNormalQRS = false
  var PPtimer=0
//pacing intervals
var lowerRateLimitTimer // the rate of the pacemaker in ms
var maxTrackingRate = 150 // the highest rate pacer will pace V in response to sensed A's
var AVITimer = 200 // the set interval between a sensed/paced A and associated V (artificial PR interval)
var VAItimer = 1000 - 200 // the timer after sensed/paced V and next due A
var AAtimer = 1000
var VVtimer = 1000
var AVtimer = 200 //used by DOO logic (may be able to combine with AVITimer)
var noiseFlag = false;
var pacingFeedback=true;
var VRP // prevent ventricular sensing of immediate post-V noise (OPTIONAL)
//var PVARP // prevent atrial sensing of immediate post-V noise (OPTIONAL)
var rNEW=0
var rOLD=0
var AVExtension=0
var PRInterval;
// pacemaker button related variables
let RAPrate = 250
let RAPrateMin = 80
let RAPrateMax = 800
var pacerLocked = false
var pacerPaused = false;
var currentBottomScreen = "mainmenu"
var bottomRowsArray = []
var currentlySelectedRowNumber = 0;
var maxRowNumber = 8;
var divNode = document.createElement("div")
  divNode.className = "arrow"
  divNode.id = "arrow"
  //divNode.style = "height: 100%; display: flex;"
  var imgNode = document.createElement("img")
  imgNode.src = "assets/arrowEnter.svg"
  imgNode.classList.add('arrowImg')
// a fib
var random = (1-((Math.random()-0.5)/1))
var aFibMS = 1000
var atrialAfibRate = 600;
var conductedAtimer=Math.round((1/(atrialAfibRate/60000))/2)*2
var afibRandomPtime = 1 
//
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
///
var teleCanvas = document.getElementById("tele");
var teleCtx = teleCanvas.getContext("2d");
var HRCanvas = document.getElementById("HRLayer");
var HRctx = HRCanvas.getContext("2d");
var caliperCanvas = document.getElementById("caliperCanvas");
var caliperCtx = caliperCanvas.getContext("2d");
///
let speed = .2 // .2 pixels per data point. speed of the cursor across the screen; affects "squeeze" of waves
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
//
var avgVentRate=0;
var oldTime=performance.now();
var histVentBeats=0;
var pacerate=80

var sensedVentTimes = [];   // each time implies a beat
var vAmplitude = 0.660; // default amplitude of R-wave
var sensedPTimes = [];   // each time implies a beat
var aAmplitude = 0.290; // default amplitude of P-wave
// default pacer parameters
var pacerOn = true;
var pacingRate = 80;
var minPaceRate = 30
var maxPaceRate = 200
var aPacerSensitivity = document.getElementById("aSensitivityBox").value = 4; // default
var aPacerMaxSensitivity = 0.4
var aPacerMinSensitivity = 10
var vPacerSensitivity = document.getElementById("vSensitivityBox").value = 4; // default
var vPacerMaxSensitivity = 0.8
var vPacerMinSensitivity = 20 
var aPacerOutput = document.getElementById("aOutputBox").value = 10;
var vPacerOutput = document.getElementById("vOutputBox").value = 20;
var aPacerMaxOutput = 20
var vPacerMaxOutput = 25
var AVImax = 300
var AVImin = 20
var PVARP = 300
var PVARPmin = 150
var PVARPmax = 500
var upperRateLimit = 110 //prevent atrial tracking of atrial tachyarrythmias
var URLmin = 80
var URLmax = 230

var manAVI, manURL, manPVARP = false;

var HRadjustedAV = Math.round((300 - (1.67 * pacingRate))/2)*2

var autoAV = true

var meanRatePacer = 60

// pacer thresholds
var vCaptureThreshold = 5; // default V capture threshold (mA)
var aCaptureThreshold = 2; // default A capture threshold (mA)
// The sensing threshold is the least sensitive mV setting at which the temporary pacemaker can detect a heartbeat
var aOversenseThreshold = 1 // threhsold below which pacer will oversense (e.g. T wave)
var aUndersenseThreshold = 10 // threshold above which pacer will undersense (e.g. won't see P wave)
var vOversenseThreshold = 2 // threhsold below which pacer will oversense (e.g. T wave)
var vUndersenseThreshold = 10 // threshold above which pacer will undersense (e.g. won't see R wave)


// knob intialization

var knobTurnFactor = 1/36 // how fast does the dial change the value (e.g 1/36 = 36 degrees to 1 bpm, one rotation = 10 bpm)
var dialToRateB
var rotationToHR = dialToRateB = pacingRate


////////////////////////////////////////////////////////////////////////
/////////////// TOP SCREEN METERS //////////////////////////////////////

// RATE METER
const knobElem = document.getElementById('rateMeterDiv');
// Create knob element, 300 x 300 px in size.
const knob = pureknob.createKnob(knobElem.offsetWidth, knobElem.offsetHeight);

// Set properties.
knob.setProperty('angleStart', -0.75 * Math.PI);
knob.setProperty('angleEnd', 0.75 * Math.PI);
knob.setProperty('colorFG', '#000000');
knob.setProperty('colorBG', '#548654');
knob.setProperty('trackWidth', 0.6);
knob.setProperty('valMin', minPaceRate);
knob.setProperty('valMax', maxPaceRate);
knob.setProperty('readonly', true);
knob.setProperty('label', null);
knob.setProperty('fnValueToString', function(value) {return ''});


// Set initial value.
knob.setValue(pacingRate);

// Create element node.
const node = knob.node();

// Add it to the DOM.

//knobElem.appendChild();
knobElem.insertAdjacentElement('afterbegin',node)

//////////////////////// V OUTPUT METER///////////////

const knobElem3 = document.getElementById('vOutputMeterDiv');
// Create knob element, 300 x 300 px in size.
const knob3 = pureknob.createKnob(knobElem3.offsetWidth, knobElem3.offsetHeight);

// Set properties.
knob3.setProperty('angleStart', -0.75 * Math.PI);
knob3.setProperty('angleEnd', 0.75 * Math.PI);
knob3.setProperty('colorFG', '#000000');
knob3.setProperty('colorBG', '#548654');
knob3.setProperty('trackWidth', 0.6);
knob3.setProperty('valMin', 0);
knob3.setProperty('valMax', vPacerMaxOutput);
knob3.setProperty('readonly', true);
knob3.setProperty('label', null);
knob3.setProperty('fnValueToString', function(value) {return ''});


// Set initial value.
knob3.setValue(vPacerOutput);

// Create element node.
const node3 = knob3.node();

// Add it to the DOM.

knobElem3.insertAdjacentElement('afterbegin',node3);

//////////////////////// A OUTPUT METER////////////////////////////
const knobElem2 = document.getElementById('aOutputMeterDiv');
// Create knob element, 300 x 300 px in size.
const knob2 = pureknob.createKnob(knobElem2.offsetWidth, knobElem2.offsetHeight);

// Set properties.
knob2.setProperty('angleStart', -0.75 * Math.PI);
knob2.setProperty('angleEnd', 0.75 * Math.PI);
knob2.setProperty('colorFG', '#000000');
knob2.setProperty('colorBG', '#548654');
knob2.setProperty('trackWidth', 0.6);
knob2.setProperty('valMin', 0);
knob2.setProperty('valMax', aPacerMaxOutput);
knob2.setProperty('readonly', true);
knob2.setProperty('label', null);
knob2.setProperty('fnValueToString', function(value) {return ''});


// Set initial value.
knob2.setValue(aPacerOutput);

// Create element node.
const node2 = knob2.node();

// Add it to the DOM.

knobElem2.insertAdjacentElement('afterbegin',node2);



// ------------------------- onload () ---------------------------------------
onload();
drawMainMenu();
function onload() {
  // --------------------- LOCAL DEFINITIONS ---------------------------------
  dataFeed.length = 1000;
  dataFeed.fill(0,0,1000);
  document.getElementById("tele").width = window.innerWidth;
  document.getElementById("HRLayer").width = window.innerWidth;
  document.getElementById("caliperCanvas").width = window.innerWidth;
  PRInterval = parseInt(document.getElementById("PRbox").value)
  var w = tele.width,
    
    l = 0,
    sec = 0,
    avgRefresh = 1,
    avgFPS = 144,
    animateRatio = dataHertz / avgFPS,
    dataVoltage = 10, // in mV
    compressHfactor = 20,
    
    opx = 0,
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
    avgFPS = l - lold;
    processingSpeed = j - jold;
    lold = l;
    jold = j;
  }

  function parseData() {
    py = -parseInt(dataFeed.shift() * 1000) / compressHfactor + canvasBaseline;
    if (dataFeed.length < 1000) {
      dataFeed.push(0);
      if (noiseFlag)
      {noiseFunction()}
    }
    j++;
    i++;
    dataCount++;
    dataClock = dataClock + (1/dataHertz)*1000;  // clock for the project

    if (i%100==0) // every 100 data points (200 ms), calc realtime Hz
    {
      randomizeThresholds();
      if (vPacerSensitivity < vOversenseThreshold) // is pacer oversensing?
      {
        senseV()
      }
      if (aPacerSensitivity < aOversenseThreshold)
      {
        senseP()   // add occasional sensed P's if pacer oversensing
      }
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
    
    tickTimers()  // advance all timers
    masterRhythmFunction()
    if (pacerOn)
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
  }

  function paint() {
    teleCtx.stroke();
    isPainted = true;
    paintCount++;
    startAnimating();
  }

input = document.getElementById('avgRateBox');
input.onchange = function(){setHR=input.value;HRchanged=true;};
pacerate = document.getElementById('pacingRate');
pacerate.onchange = function()
{
  //pacingRate=pacerate.value
  document.getElementById("pacingBoxRate").innerText=pacerate.value;
};


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

function senseP(inhibitSenseLight) // if inhibitSenseLight = 'inhibitSenseLight', don't sense the beat
{
  let testvar = typeof inhibitSenseLight
  if (typeof inhibitSenseLight == undefined || inhibitSenseLight != 'inhibitSenseLight')
  {
    inhibitSenseLight = false; // sense light should turn on
  }
  else if (inhibitSenseLight=='inhibitSenseLight')
  {
    inhibitSenseLight = true; // sense light should NOT turn on (e.g. a paced beat)
  }

  sensedPTimes.push(dataClock); // add to record of all sensed P activity

  if (pacerOn && !inhibitSenseLight) // if sense light should turn on
  {
  document.getElementById("aSenseLight").src = "assets/senseLightOn.svg" // turn sense light on
    setTimeout(function(){document.getElementById("aSenseLight").src = "assets/senseLightOff.svg"},"250") // turn light off after time period
  }
 }

function senseV(inhibitSenseLight)
{
  if (pacerOn)
  {
    if (typeof inhibitSenseLight == undefined || inhibitSenseLight != 'inhibitSenseLight')
    {
      inhibitSenseLight = false; // sense light should turn on
    }
    else if (inhibitSenseLight=='inhibitSenseLight')
    {
      inhibitSenseLight = true; // sense light should NOT turn on (e.g. a paced beat)
    }
    
    sensedVentTimes.push(dataClock); // add to record of all sensed V activity
    calcMeanHR()

    if (!inhibitSenseLight)
    {
    document.getElementById("vSenseLight").src = "assets/senseLightOn.svg" // turn sense light on
      setTimeout(function(){document.getElementById("vSenseLight").src = "assets/senseLightOff.svg"},"250") // turn light off after time period
    }
  }
}

function calcMeanHR()
{
  // calculate mean rate from pacer perspective (includes paced and sensed V's)
  meanRatePacer = 0
  var i = 0

  if (sensedVentTimes.length>1)
  {
   for (i = 0; i < sensedVentTimes.length-1; i++) {
    const element = sensedVentTimes[i];
    let lastInterval = sensedVentTimes[i+1] - sensedVentTimes[i]
    meanRatePacer += 1/(lastInterval/60000)
    
   }
   meanRatePacer=Math.round(meanRatePacer/i)
  }

  while (sensedVentTimes.length>10) // trim old senses
  {
    sensedVentTimes.shift()
  }

}

function drawPWave(morphOnly,width,height,invert) { // morphOnly='morphOnly' or not,   width:2x,3x etc. (integer only),  height:1.5x, 2.8xm etc, (floatOK),   invert:true or false
  if (typeof width == 'undefined') {width = 0} // 0 means normal width
  if (typeof height == 'undefined') {height = 1} // 1 means normal height
  if (typeof invert == 'undefined') {invert = 0} // 1 means normal height

  if (atrialRefractoryTimer > 100) // when atrium is depolarized, should be completely refractory for 100 ms (need to adjust?)
  {
    atrialRefractoryTimer = 0 // make atrium refractory

    // RECORD KEEPING
    if (morphOnly!='morphOnly') // not morphology only, so normal behaviour
    {
      histPTimes.push(dataClock);  // add to absolute record of all P activity
      if (histPTimes.length>10)
      {
        histPTimes.shift();
      }
      
      if (pacerOn && aPacerSensitivity <= aUndersenseThreshold || pacedBeatFlag) // not undersensed OR if a known paced  beat
      {
          if (pacedBeatFlag)
          {
            senseP('inhibitSenseLight'); // add to record of all sensed P activity
          }
          else
          {
            senseP(); // add to record of all sensed P activity
          }
        
      }
    }
    // MORPHOLOGY PORTION of draw function
    i = 0;
    var tempArray = widenWave(shortP80.slice(),width) // width 0 = normal, width 1 = double
    var ogLength = tempArray.length
    for (let j = 0; j < ogLength; j++)
    {
      if (invert==false)
      {
      dataFeed[j] = dataFeed[j]+tempArray.shift()*height; // add the voltages at each point (in case beats overlap)
      }
      if (invert==true)
      {
        dataFeed[j] = dataFeed[j]-tempArray.shift()*height; // add the voltages at each point (in case beats overlap)
      }
    }
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






function drawQRST(width, invertT, invertQRS) {   // width: 0=normal, 1=double, 2=triple, etc.)  invertT: 0=upright, 1=invert)  invertQRS: 0=upright, 1=invert
  if (typeof width == 'undefined')
  {width=0;}
  if (typeof invertT == 'undefined')
  {invertT=0;}
  if (typeof invertQRS == 'undefined')
  {invertQRS=0;}

  i = 0;
  j = 0;
  if (ventRefractoryTimer > 100) // when vent is depolarized, should be completely refractory for 100 ms (need to adjust?)
  {
    ventRefractoryTimer = 0 // make ventricle refractory

    // mark event according to data clock
    histVentTimes.push(dataClock);
    if (histVentTimes.length>10)
    {
    histVentTimes.shift();
    }

    if (vPacerSensitivity <= vUndersenseThreshold || pacedBeatFlag) // not undersensing OR known paced beat-> mark real V
    {
      if (pacedBeatFlag)
      {
        senseV('inhibitSenseLight')
      }
      else 
      {
      senseV(); //mark sensed V
      }
    }
    
    
    var tempArray=widenWave(cleanQRS,width).slice(); // widen the QRS with a factor of 1 (double the width)
    /*
    else
    {
      var tempArray=cleanQRS.slice();
    }
    */
    var ogLength = tempArray.length

    for (j = 0; j < ogLength; j++) 
    {
      if (invertQRS==0)
      {
      dataFeed[j] = dataFeed[j]+tempArray.shift(); // add the voltages at each point (in case beats overlap)
      }
      else if (invertQRS>0)
      {
        dataFeed[j] = dataFeed[j]-tempArray.shift(); // invert QRS
      }
    }
    tempArray=cleanT.slice();
    for (let i = 0; i < cleanT.length; i++) 
    {
      if (invertT==0)
      {
      dataFeed[j] = dataFeed[j]+tempArray.shift(); // add the voltages at each point (in case beats overlap)
      }
      else if (invertT>0)
      {
        dataFeed[j] = dataFeed[j]-tempArray.shift(); // invert T wave if widened QRS
      }
      j++;
    }
    
  }
}
 
var currentRhythm = "NSR";
var drawQRS=false;
var PRtimer=-1;
function masterRhythmFunction()
{
 
    if(dataClock%100 == 0)
    {
      PRInterval = parseInt(document.getElementById("PRbox").value)  // native PR interval
      setHR = document.getElementById("avgRateBox").value;
      HRadjustedPR = PRInterval - 0.5*setHR + 30;   // PR should decrease with increasing heart rates
      if (HRadjustedPR<5){HRadjustedPR=5}
      
      goalMS = (1/setHR)*60000
      adjustRatio = realtimeProcessSpeed/((1/dataHertz)*1000);
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

        //let timeSinceV = timeSinceLastV();
        let timeSinceP = timeSinceLastP();
        let timeSinceV = timeSinceLastV();

        if (!CHB) // not CHB, so normal behaviour
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
            PRtimer=0; // start P-R timer (QRS should follow a P wave, whether P is intrinsic or paced)
            drawQRS=true;
          }
          if (PRtimer>=0)
          {
            PRtimer+=2;
          }
        
        // if (drawQRS && timeSinceLastV()>=goalMS && timeSinceLastP()>=HRadjustedPR && !CHB) // QRS should respond to any P's after a PR interval (unless CHB)
        if (drawQRS && PRtimer >= HRadjustedPR && !CHB && timeSinceLastV() > 150)  // !!! THIS PART CAUSING DOUBLE V-PACING -- built in minimum V-refractory 150 ms
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
      /*
    if (CHB) // complete heart block code
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
            drawQRST(1,1);  //wide QRS due to idioventricular escape rhythm
          }
        }
        */
      }


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
      ventHeartRate = document.getElementById("avgRateBox").value;
      let goalVentMs = 1/(ventHeartRate/60000)
      if (timeSinceLastV() >= goalVentMs)
      {
        // *** insert wide QRS code here ***
        if (ventHeartRate<120)
        {
          drawQRST(1,1); // draw wide QRS, inverted T
        }
        else (ventHeartRate >= 120) // v-tach
        {
        drawQRST(1,0); // draw wide QRS, upright T (looks more like true V-tach)
        }
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
    
    //   -----------    ATRIAL FIBRILLATION ---------------
    if (currentRhythm == "aFib")    
    {
      aCaptureThreshold=10000 // pacer should never be able to capture atrium in atrial fib
      let timeSinceV = timeSinceLastV()
      var afibVarianceFactor = 1; // the smaller the more varied
      var morphoAtrialAfibRate = 800;
      var ratioSensedPs = .50  // 50% of P's will be sensed by pacemaker
      let afibPsensing = true;

      goalMS = Math.round((1/(setHR/60000))/2)*2

      if (timeSinceLastV() >= aFibMS)
      {
        drawQRST(); // this works, but maybe should allow for physiologic occasional V's capturing or being sensed
        histPTimes.push(dataClock-AVInterval); // let a P "conduct" and be sensed
          if (histPTimes.length>10)
          {
            histPTimes.shift();
          }
        random = (1-((Math.random()-0.5)/afibVarianceFactor))
        aFibMS = (goalMS)*random
      }
      if (dataClock%goalMS==0)
      {
        random = (1-((Math.random()-0.5)/afibVarianceFactor))
        aFibMS = (goalMS)*random
      }

      // throw in some sensed A's for the pacemaker to fuck with
      if (afibPsensing && aPacerSensitivity < aOversenseThreshold*2) // raise the pacer oversense threshold while in afib
      {
        let senseMS = goalMS*ratioSensedPs*random
        if (afibPSenseTimer > senseMS)
        {
          senseP()
          afibPSenseTimer = 0;
        }
        afibPSenseTimer += 2;
      }

      // draw p-wave at varying rate with varying amplitude
      let morphoMSbaseline = 1/(morphoAtrialAfibRate/60000)
      if (dataClock%parseInt((morphoMSbaseline/afibRandomPtime))==0)
      {
        drawPWave('morphOnly',1,(Math.random()*1.10))
        afibRandomPtime = Math.random()/2+1
        let testMS = morphoMSbaseline/afibRandomPtime
        let testRate  = (1/testMS)*60000
        let blank = 0;

      }
      
      // noiseFlag=true;

      // document.getElementById('noise').checked=true;
    }

    if (currentRhythm != "aFlutter") {document.getElementById("flutterStuff").hidden=true;}
    if (currentRhythm == "aFlutter")    
    {
      // show flutter options on page
      document.getElementById("flutterStuff").hidden=false;
      flutterAtrialRate = document.getElementById("flutterAtrialRate").value;
      baselineFlutterConductionRatio = parseInt(document.getElementById("flutterConductionRatio").value);
      let flutterVariableAV = document.getElementById("flutterVariableAV").checked;
      let timeSinceV = timeSinceLastV()
      //goalMS = Math.round((1/(setHR/60000))/2)*2
      flutterAtrialMS = 1/(flutterAtrialRate/60000)
      flutterVentMS=flutterAtrialMS*currentFlutterConductionRatio
      
      if (timeSinceLastV() >= flutterVentMS)
      {
        drawQRST(); // this works, but maybe should allow for physiologic occasional V's capturing or being sensed
        //random = (1-((Math.random()-0.5)/afibVarianceFactor))
        let random = 0;
        if (flutterVariableAV)
        {
         random = Math.random()*flutterConductionIrregularity
        }
        currentFlutterConductionRatio = baselineFlutterConductionRatio + Math.round(random)
      }

      if (flutterAtrialTimer >= flutterAtrialMS)
      {
        drawPWave('no',1,1,false) // not morphonly, width, height, no invert
        flutterAtrialTimer=0;
      }
      flutterAtrialTimer +=2;
    }

    //  ------------------ WENKEBACH ------------------
    // Four key elements of Wenkebach rhythm 
    // (if I want to be perfectly accurate, I should incororate this stuff)
    // [ ] incorporate the principles below to make more realistic (pretty insignificant though)
    //
    // 1. Progressive lengthening of each successive PR interval.
    // 2. The pause produced by the non-conducted P wave is equal to the increment between the last PR interval (preceding the pause) and the first PR interval following the pause (shortest) subtracted from twice the PP interval.
    //    = 2(PP) - (PR4-PR1)
    // 3. The RR interval between the first and second conducted beats is the largest and between the last conducted beats, the shortest.
    // 4. There is progressive shortening of the RR intervals.

    if (currentRhythm!='2ndtypeI' || currentRhythm!='2ndtypeII') 
    {
      document.getElementById("wenckStuff").hidden=true
      //document.getElementById("CHBbox").disabled=false
    }
    if (currentRhythm=='2ndtypeI') // Wenckebach/Wenkebach
    {
        // show wenck options
        document.getElementById("wenckStuff").hidden=false
        wenkDegree = parseInt(document.getElementById("wenckeDegreeBox").value - 1) // if wenkDegree is 2, then there are 2 P waves per 1 QRS. if wenkDegree is 5, then there are 5 Ps per QRS
        // update AV block label
        document.getElementById("AVblockLabel").innerText = (wenkDegree+1).toString() + ":" + (wenkDegree).toString()
        // turn off CHB options
        //document.getElementById("CHBbox").disabled=true
        //document.getElementById("CHBbox").checked=false
        //let timeSinceV = timeSinceLastV();
        let timeSinceP = timeSinceLastP();
        let timeSinceV = timeSinceLastV();
        
        if (wenkCount == 0)
        {
          currentWenkPR = PRInterval
        }
        

          if (timeSinceP >= goalMS && timeSinceV >= goalMS - currentWenkPR && timeSinceLastV() > 200 )
          {
            if (wenkCount < wenkDegree)
              {
                currentWenkPR+=wenkPRincreaseAmount
              }
            drawPWave();
            timeSinceP=timeSinceLastP();
            if (wenkCount < wenkDegree)
            {
              drawQRS = true; // flag that QRS should come follow sinus P
              wenkCount++
            }
            else
            {
             //drawQRS=false;
             currentWenkPR = PRInterval
             wenkCount=0
            }
          }

          testClock = dataClock;
          timeSinceP=timeSinceLastP()
          timeSinceV=timeSinceLastV()

          if (timeSinceP==0 || timeSinceP == 2)
          {
            PRtimer=0; // start P-R timer (QRS should follow a P wave, whether P is intrinsic or paced)
            drawQRS=true;
          }
          if (PRtimer>=0)
          {
            PRtimer+=2;
          }
        
        // if (drawQRS && timeSinceLastV()>=goalMS && timeSinceLastP()>=HRadjustedPR && !CHB) // QRS should respond to any P's after a PR interval (unless CHB)
        if (drawQRS && PRtimer >= currentWenkPR && timeSinceLastV() > 150 && wenkCount < wenkDegree)  // !!! THIS PART CAUSING DOUBLE V-PACING -- built in minimum V-refractory 150 ms
        {
            drawQRST();
            drawQRS=false;
            PRtimer=-1; // stop PRtimer
        }
        else if (drawQRS && PRtimer >= currentWenkPR) // if above never runs, then clear QRS and PR timer
        {
          drawQRS=false;
          PRtimer=-1;
        }
        
    }

    if (currentRhythm=='highDegreeBlock') // high degree AV block (fixed ratios )

    // fixed ratio blocks (anything 3:1 or higher is "high degree")
    // 2:1 could possibly be a Wenkbach
    // rated as P:QRS degree block (e.g. 2:1, 3:1, 4:1, etc.)
    // initially presents as just occasional dropped QRS (intermittent 2:1)
    {
        // show wenck options
        document.getElementById("wenckStuff").hidden=false
        wenkDegree = parseInt(document.getElementById("wenckeDegreeBox").value)
        // update AV block label
        document.getElementById("AVblockLabel").innerText = (wenkDegree).toString() + ":" + 1
        // turn off CHB options
        //document.getElementById("CHBbox").disabled=true
        //document.getElementById("CHBbox").checked=false
        //let timeSinceV = timeSinceLastV();
        let timeSinceP = timeSinceLastP();
        let timeSinceV = timeSinceLastV();
        wenkDegree = parseInt(document.getElementById("wenckeDegreeBox").value)
        // intermittent block

        if (wenkCount == 0)
        {
          currentWenkPR = PRInterval
        }
        

          if (timeSinceP >= goalMS && timeSinceV >= goalMS - currentWenkPR && timeSinceLastV() > 200 )
          {
            drawPWave();
            timeSinceP=timeSinceLastP();
            if (wenkCount < wenkDegree)
            {
              drawQRS = true; // flag that QRS should come follow sinus P
              wenkCount++
            }
            else
            {
             //drawQRS=false;
             currentWenkPR = PRInterval
             wenkCount=0
            }

            
          }

          testClock = dataClock;
          timeSinceP=timeSinceLastP()
          timeSinceV=timeSinceLastV()

          if (timeSinceP==0 || timeSinceP == 2)
          {
            PRtimer=0; // start P-R timer (QRS should follow a P wave, whether P is intrinsic or paced)
            drawQRS=true;
          }
          if (PRtimer>=0)
          {
            PRtimer+=2;
          }
        
        // if (drawQRS && timeSinceLastV()>=goalMS && timeSinceLastP()>=HRadjustedPR && !CHB) // QRS should respond to any P's after a PR interval (unless CHB)
        if (drawQRS && PRtimer >= currentWenkPR && timeSinceLastV() > 150 && wenkCount == wenkDegree)  // !!! THIS PART CAUSING DOUBLE V-PACING -- built in minimum V-refractory 150 ms
        {
          
            drawQRST();
            drawQRS=false;
            PRtimer=-1; // stop PRtimer
            wenkCount=0
        }
        else if (drawQRS && PRtimer >= currentWenkPR) // if above never runs, then clear QRS and PR timer
        {
          drawQRS=false;
          PRtimer=-1;
        }
        
    }

    if (currentRhythm!='intermAVBlock')
    {
      document.getElementById("intermAVBlockStuff").hidden=true
    }
    if (currentRhythm=='intermAVBlock') // Mobitz II

    // 1 or more sequential P waves do not conduct
    // rated as P:QRS degree block (e.g. 2:1, 3:1, 4:1, etc.)
    // initially presents as just occasional dropped QRS (intermittent 2:1)
    {
        // show intermittent block options
        document.getElementById("intermAVBlockStuff").hidden=false
        ratioBlockedPs = parseFloat(document.getElementById("blockFreqBox").value)
        document.getElementById("blockedRatioLabel").innerText = (ratioBlockedPs*100).toString() + "% blocked P's"
        // turn off CHB options
        //document.getElementById("CHBbox").disabled=true
        //document.getElementById("CHBbox").checked=false
        
  //let timeSinceV = timeSinceLastV();
  let timeSinceP = timeSinceLastP();
  let timeSinceV = timeSinceLastV();

  
    //if (timeSinceP >= goalMS && timeSinceV >= goalMS - HRadjustedPR)   // this working 9/27
    if (timeSinceP >= goalMS && timeSinceV >= goalMS - HRadjustedPR && timeSinceLastV() > 200 )
    {
      drawPWave();
      timeSinceP=timeSinceLastP();
      drawQRS = true; // flag that QRS should come follow sinus P
      if (lastBlocked) // if last P was blocked
      {
        AVBlockRandom = 1 // force next P to conduct
        lastBlocked = false
      }
      else // if it wasn't blocked, keep generating new
      {
      AVBlockRandom = Math.random();
      }

    }
    testClock = dataClock;
    timeSinceP=timeSinceLastP()
    timeSinceV=timeSinceLastV()

    if (timeSinceP==0 || timeSinceP == 2)
    {
      PRtimer=0; // start P-R timer (QRS should follow a P wave, whether P is intrinsic or paced)
      drawQRS=true;
    }
    if (PRtimer>=0)
    {
      PRtimer+=2;
    }
  
    // if (drawQRS && timeSinceLastV()>=goalMS && timeSinceLastP()>=HRadjustedPR && !CHB) // QRS should respond to any P's after a PR interval (unless CHB)
    if (drawQRS && PRtimer >= HRadjustedPR && !CHB && timeSinceLastV() > 150)  // !!! THIS PART CAUSING DOUBLE V-PACING -- built in minimum V-refractory 150 ms
    {
      if (AVBlockRandom > ratioBlockedPs) // 20% of time, drop a QRS
      {
      drawQRST();
      drawQRS=false;
      lastBlocked=false
      }
      else
      {
        lastBlocked=true
      }
      
        PRtimer=-1; // stop PRtimer
    }
    else if (drawQRS && PRtimer >= HRadjustedPR && !CHB) // if above never runs, then clear QRS and PR timer
    {
      drawQRS=false;
      PRtimer=-1;
    }
  }

  if (currentRhythm!="copmleteBlock")
  {
    document.getElementById("CHBstuff").hidden=true;
    CHB=false;
  }
  if (currentRhythm=="completeBlock") // complete heart block
  {
    let timeSinceP = timeSinceLastP()
    let timeSinceV = timeSinceLastV()
   // document.getElementById("CHBbox").checked = true;
    
    
  //  CHB = true;
    document.getElementById("CHBstuff").hidden=false;
    ventHeartRate = document.getElementById("ventRateBox").value;
    atrialHeartRate = document.getElementById("atrialRateBox").value;
    let goalVentMs = 1/(ventHeartRate/60000)
    let goalAtrialMs = 1/(atrialHeartRate/60000)
    if (timeSinceLastP() >= goalAtrialMs)
    {
      drawPWave();
    }

    if (timeSinceLastV() >= goalVentMs)
    {
      drawQRST(1,1);  //wide QRS due to idioventricular escape rhythm
    }
  }

  if (currentRhythm!='geminies')
  {
    document.getElementById("geminiStuff").hidden=true
  }
  if (currentRhythm=='geminies') // bigeminy, trigeminy, of PVCs
    {
        let timeSinceP = timeSinceLastP();
        let timeSinceV = timeSinceLastV();     
      document.getElementById("geminiStuff").hidden=false
        
        geminyRatio = parseInt(document.getElementById("geminiRatioBox").value)

          if (timeSinceP >= goalMS && timeSinceV >= goalMS - HRadjustedPR && timeSinceLastV() > 200 && geminyCount<geminyRatio && PPtimer%goalMS==0)
          {
            drawPWave();
            PPtimer = 0
            timeSinceP=timeSinceLastP();
      
            drawNormalQRS = true; // flag that QRS should come follow sinus P
            PVCtimer = 0
             //drawNormalQRS=false;
          }

          if (geminyCount==geminyRatio && PVCtimer > goalMS/1.5)
          {
            drawQRST(1,1) // wide QRS, inverted T (a PVC)
            PVCtimer=0
            geminyCount = 0
          }

          if (geminyCount>geminyRatio)
          {
            PVCtimer = -1 // disable timer
            geminyCount = 0
          }

          if (PVCtimer >= 0)
          {
            PVCtimer += 2 // increment timer
          }

          if (PPtimer >= 0)
          {
            PPtimer += 2
          }

          testClock = dataClock;
          timeSinceP=timeSinceLastP()
          timeSinceV=timeSinceLastV()

          if (timeSinceP==0 || timeSinceP == 2)
          {
            PRtimer=0; // start P-R timer (QRS should follow a P wave, whether P is intrinsic or paced)
            drawNormalQRS=true;
          }
          if (PRtimer>=0)
          {
            PRtimer+=2;
          }
        
        // QRS should respond to any P's (intrinsic or paced) after a PR interval
        if (drawNormalQRS && PRtimer >= HRadjustedPR && timeSinceLastV() > 150)
        {
          
            drawQRST();
            drawNormalQRS=false;
            PRtimer=-1; // stop PRtimer
            geminyCount++
        }
        else if (drawNormalQRS && PRtimer >= HRadjustedPR) // if above never runs, then clear QRS and PR timer
        {
          drawNormalQRS=false;
          PRtimer=-1;
        }
/*
        if (timeSinceV>goalMS+HRadjustedPR+30)  // backup reset
        {
          geminyCount = 0
        }
        */
    }


}



var currentRhythmID = [0,0];
function NSRhythm() 
{
  PRInterval = parseInt(document.getElementById("PRbox").value)
	clearRhythms();
  currentRhythm = 'NSR';
  CHB = false;
  //document.getElementById("CHBbox").checked = false;
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
//    [x] pacing spike should inhibit if intrinsic P's or V's present (if paced rate exceeds intrinsic)    
// [ ] pacing controls
//    [x] rate
//    [x] AAI, VVI, DDI (dropdown box?)
//    [ ]
*/

const atrium = "atrium";
const vent = "vent";

function paceIt(target) // target : atrium, or vent
{
  // VISUAL PACING INDICATOR PACER BOX
  if (target==atrium)
  {
    document.getElementById("aPaceLight").src = "assets/paceLightOn.svg" // turn pace light on
    setTimeout(function(){document.getElementById("aPaceLight").src = "assets/paceLightOff.svg"},"250") // turn light off after time period
  }
  else if (target==vent)
  { 
    document.getElementById("vPaceLight").src = "assets/paceLightOn.svg" // turn pace light on
    setTimeout(function(){document.getElementById("vPaceLight").src = "assets/paceLightOff.svg"},"250") // turn light off after time period
  }
  pacedBeatFlag=true;
  if (pacerCapturing(target))
  {
    drawPacingSpike();  // draw pacing spike
    if (target==atrium)
      {
        drawPWave();
      }
      else if (target==vent)
      {
        drawQRST(1,0,1); // wide QRS, upright T, invert QRS
      }
  }
  else // if not capturing
  {
    drawPacingSpike();
    if (target==atrium)
      {
        senseP('inhibitSenseLight')
      }
      else if (target==vent)
      {
        senseV('inhibitSenseLight')
      }
    
  }

pacedBeatFlag=false;
}

function DOObuttonClick(DOObutton) {
  pacingRate = 80

  let element = document.getElementById("pacingMode")
  document.getElementById("pacingBoxMode").innerText= "DOO"
  element.selectedIndex = 2;
  aPacerOutput = document.getElementById("aOutputBox").value = 20;
  document.getElementById("pacingBoxAOutput").innerText=aPacerOutput;
  vPacerOutput = document.getElementById("vOutputBox").value = 25;
  document.getElementById("pacingBoxVOutput").innerText=vPacerOutput;
  //aPacerSensitivity = document.getElementById("aSensitivityBox").value = 10;
  //vPacerSensitivity = document.getElementById("vSensitivityBox").value = 20;
  pacingModeBoxChange();
  updateAllGUIValues()
  animateButton(DOObutton)
}

function paceButtonClick() {
  let paceButton = document.getElementById("paceButton");
  if (paceButton.innerText == "Start Pacing")
  {
    startPacing();
    document.getElementById('topScreenHide').hidden=false;
    document.getElementById('bottomScreenHide').hidden=false;
    paceButton.innerText = "Stop Pacing";
  }
  else
  {
    stopPacing();
    document.getElementById('topScreenHide').hidden=true;
    document.getElementById('bottomScreenHide').hidden=true;

    paceButton.innerText = "Start Pacing";
  }
}
var aPacerInterval;
var vPacerInterval;
var pacerInterval;


var atrialRefactoryPeriod = 0;
var ventBlankingPeriod = 0;
function startPacing() {
	
	pacingRate = parseInt(document.getElementById("pacingRate").value);
  
  pacerOn = true;  
}

function pacingModeBoxChange()
{
  let element = document.getElementById("pacingMode")
  pacerMode = document.getElementById("pacingBoxMode").innerText=element.options[element.selectedIndex].text;
  if (element.options[element.selectedIndex].text == "DDD")
  {
    document.getElementById("URLdiv").hidden=false
  }
  if (element.options[element.selectedIndex].text != "DDD")
  {
    document.getElementById("URLdiv").hidden=true
  }
  //onParameterChange()
}

var AVInterval = 120; // pacemaker interval between atrial and v pace
var manAVInterval = 120;
let captureOverride = false;
var sensing = 0; // 0: sensing appropriate, -1: undersensing, +1: oversensing


function pacingFunction()
{
  if (!pacerPaused)
  {
  AVInterval = parseInt(document.getElementById("AVInterval").value); // delay between atrial and vent pace
  
  let timeSinceP = timeSinceLastSensedP();
  let timeSinceV = timeSinceLastSensedV();
  let goalPacerMs = Math.round(((1/pacingRate)*60000)/2)*2; // goal how many ms between R waves
  let element = document.getElementById("pacingMode")
  //pacerMode = element.options[element.selectedIndex].text;
  document.getElementById("pacingBoxRate").innerText=pacerate.value;
   
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
    // DDI is like combining AAI and VVI modes
    // 
    // -- FROM THE MANUAL --
    // 
    // if no intrinsic P, pace V after V-A interval which is equal to the programmed base RATE minus the programmed A-V INTERVAL. 
    // if no intrinsic V, pace V after programmed A-V interval
    // if no paced P, no AV synchrony, and V only paces if R-waves less than set rate

    // When A. Tracking is off (DDI pacing mode), an atrial sense will inhibit an atrial pace, but it
    // does not trigger an A-V Interval (see Figure 45). The ventricle is paced at the selected
    // RATE.

    // from another website
    // -----------------
    // The DDI pacing mode uses a ventricular timing base. It breaks the pacing interval 
    // into two parts: the atrial pacing interval and the ventricular pacing interval, which are spaced by the 
    // atrioventricular delay. For example, if the basic rate is set to 60 and the AV delay to 200 ms, 
    // the atrial pacing interval VA is equal to 1 000 ms - 200 ms = 800 ms, 
    // the ventricular pacing VV interval is equal to 1000 ms.
    // If no spontaneous activity is sensed, it paces the atria and ventricles at the basic rate or 
    // sensor indicated rate, respecting the programmed AV delay (first 2 cycles). If atrial activity is sensed, 
    // it inhibits atrial pacing, without changing the ventricular pacing rate (cycles 3, 4 and 5). 
    // If spontaneous activity is sensed in the ventricle, it inhibits both stimuli (subsequent cycles).



  // shared DDD and DDI settings
 
  if (pacerMode == 'DDI' || pacerMode == 'DDD')
  {
    
    if (!manPVARP)
    {
      let rate
      if (pacingRate >= meanRatePacer) {rate = pacingRate}
      else {rate = meanRatePacer}
      if (rate < 100) {PVARP = 300}
      else if (rate < 150) {PVARP = 250}
      else if (rate < 180) {PVARP = 230}
      else if (rate >= 180) {PVARP = 200}
    }
  }


  if (pacerMode == 'DDI')  // sensing fixed
  {
    //autoAV = AVIntervalHRAdjustBox.checked;
    HRadjustedAV = Math.round((300 - (1.67 * pacingRate))/2)*2
    
    if (HRadjustedAV < 50) {HRadjustedAV = 50}
    if (HRadjustedAV > 250) {HRadjustedAV = 250}
    var usedAVinterval = HRadjustedAV

    if (autoAV)
    {
      usedAVinterval = HRadjustedAV // auto AV 
    }
    else
    {
      usedAVinterval = manAVInterval // use whatever is in the box
    }
    var debug = timeSinceLastSensedV()
    if (timeSinceLastSensedV() == 2)
    {
      VAItimer=goalPacerMs - usedAVinterval
      VVtimer=goalPacerMs
      VAITimerFlag=true;
    }

    if (timeSinceLastSensedP() == 2)
    {
      AAtimer=goalPacerMs
      VAITimerFlag=false;
    }

    if (VVtimer == 0)
    {
      paceIt(vent);
        
      VVtimer = goalPacerMs
      VAItimer = goalPacerMs - usedAVinterval
    }

    if (VAItimer==0)
    {
      
        paceIt(atrium);
       
      VAITimerFlag=false;
      VAItimer=goalPacerMs-usedAVinterval
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
     VVtimer -= 2;
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

    if (pacerMode == 'DDD') // sensing fixed
    {
      // vars
      timeSinceV=timeSinceLastSensedV();
      timeSinceP=timeSinceLastSensedP();
      maxTrackingRate = document.getElementById('URLbox').value;
      //autoAV = AVIntervalHRAdjustBox.checked;
      let lowerRateLimit = VAItimer + AVInterval
      let VAinterval = goalPacerMs - AVInterval
      HRadjustedAV = Math.round((300 - (1.67 * pacingRate))/2)*2
      
      if (HRadjustedAV < 50) {HRadjustedAV = 50}
      if (HRadjustedAV > 250) {HRadjustedAV = 250}
      var usedAVinterval = HRadjustedAV

      if (autoAV)
      {
        usedAVinterval = HRadjustedAV // auto AV 
      }
      else
      {
        usedAVinterval = manAVInterval // use whatever is in the box
      }

      // once pacer is turned on, timers should start immediately regardless of sensing or anything else
      

      if (timeSinceLastSensedV() == 2) // The first is the interval from a ventricular sensed or paced event to an atrial paced event and is known as the AEI, or VAI.
      {
        VVtimer = 0;
        rOLD = rNEW
        rNEW = dataClock
        if (autoAV)
        {
        VAItimer = goalPacerMs - usedAVinterval + AVExtension // start the VAI/AEI timer (interval from vent to next P)
        // AVExtension attempts to modify the VAI interval with goal of more closely achieving goal heart rate
        }
        else
        {
        VAItimer = goalPacerMs - usedAVinterval // start the VAI/AEI timer (interval from vent to next P)
        }
        AVITimer = usedAVinterval; // set timers
        VAITimerFlag = true;  // turn on V-A timer
        AVITimerFlag = false; // turn off A-V timer
      }
      if (goalPacerMs - (rNEW - rOLD) > 0 && goalPacerMs - (rNEW - rOLD) <= usedAVinterval)
      {
      AVExtension = goalPacerMs - (rNEW - rOLD) // how far off was last effect pacing rate from goal rate?
      }
      else {AVExtension = 0}
      
      timeSinceP = timeSinceLastSensedP()
      if (timeSinceLastSensedP() == 2)  // The second interval begins with an atrial sensed or paced event and extends to a ventricular event. This interval may be defined by a paced AV, PR, AR, or PV interval.
      {
        //VAItimer = goalPacerMs - AVInterval // start the VAI/AEI timer (interval from vent to next P)
        AVITimer = usedAVinterval // set timers
        VAITimerFlag = false; // turn off V-A timer
        AVITimerFlag = true; // turn on A-V timer
        
      }


      if (VAItimer <= 0 && VAITimerFlag)  // if vent to atri timer runs out, pace atrium
      {
        //if (pacerCapturing(atrium))
        //{
        
        paceIt(atrium);
        //}
        /*
        else if (!pacerCapturing(atrium)) // if not capturing, just draw a pacing spike and do nothing else
        {
          drawPacingSpike();
        }
        */
        VAITimerFlag = false; // turn off the VA timer
      }
      // backup reset timers if timers fail for some reason (undersensing?)
      if (timeSinceLastSensedP() > goalPacerMs+50)    // backup to pace P if timers fail
      {
        VAITimerFlag=true
      }
      

      // ventricular pacing (after timers expire)
      //if ((AVITimer <= 0 && AVITimerFlag) || VVtimer >= goalPacerMs) // if atrium-to-vent timer runs out, pace vent (VVtimer shouldn't be necessary?)
      var maxTrackingMS = 1/(maxTrackingRate/60000)
      if ((AVITimer <= 0 && AVITimerFlag && VVtimer > maxTrackingMS)) // if atrium-to-vent timer runs out, pace vent
      {
        //if (pacerCapturing(vent))
        //{
        paceIt(vent);
        //}
        /*
        else if (!pacerCapturing(vent)) // if not capturing, just draw a pacing spike and do nothing else
        {
          drawPacingSpike();
        }
        */
        AVITimerFlag=false; // turn off the AV timer
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
        VVtimer+=2;
      
  }



  // AOO (asynchronous A pacing = no sensing)

  if (pacerMode=='AOO')
  {
    
    
    if (AAtimer == 0) // when AAtimer runs out, pace
    {
      
          if (pacerCapturing(atrium)) // is output high enough?
          {
            if (!CHB) // is conduction intact?
            {
              drawQRS = true; // signal that QRS should be drawn next
            }
          paceIt(atrium);
          AAtimer=goalPacerMs;
          }
          else if (!pacerCapturing(atrium)) // if not capturing, just draw a pacing spike and do nothing else
          {
            drawPacingSpike();
          }
    }
    if (AAtimer<0)
    {
      AAtimer=goalPacerMs;
    }
    AAtimer -= 2; // run timer
   
  }

 // VOO (asynchronous V pacing = no sensing)
  
  if (pacerMode == 'VOO')
  {
    if (VVtimer == 0 || VVtimer == 1) // when VVtimer runs out, pace
    {
          if (pacerCapturing(vent))
          {
          paceIt(vent);
          }
          else if (!pacerCapturing(vent)) // if not capturing, just draw a pacing spike and do nothing else
          {
            drawPacingSpike();
          }
          VVtimer=goalPacerMs
    }
    if (VVtimer<0)
    {
      VVtimer=goalPacerMs
    }
    VVtimer-=2;
  }

    // DOO (asynchronous A and V pacing; no sensing)
    // A timer drives, followed by AV timer and V pace
    if (pacerMode=='DOO')
    {
           
      if (AAtimer == 0) // when AAtimer runs out, pace
      {
            if (pacerCapturing(atrium)) // is output high enough?
            {
            paceIt(atrium);
            AAtimer=goalPacerMs;
            }
            else if (!pacerCapturing(atrium)) // if not capturing, just draw a pacing spike and do nothing else
            {
              drawPacingSpike();
            }
            AVtimer=AVInterval
      }
      if (AAtimer<0)
      {
        AAtimer=goalPacerMs;
      }
      AAtimer -= 2; // run timer
     
      // vent logic; pace V after AV timer runs out
      if (AVtimer == 0 || AVtimer == 1) // when VVtimer runs out, pace
    {
          if (pacerCapturing(vent))
          {
          paceIt(vent);
          }
          else if (!pacerCapturing(vent)) // if not capturing, just draw a pacing spike and do nothing else
          {
            drawPacingSpike();
          }
          AVtimer=goalPacerMs
    }

    AVtimer-=2;
    
  }
  if (pacingFeedback) // is learning feedback mode enabled?
  {
    if (dataClock%100 == 0)
    {
      feedbackFunction();
    }
  }

// every x amount of time, refresh pacer GUI
if (dataClock%500==0)
{
  //updateAllGUIValues()
}

  }
}
var AVITimerFlag=false;
var VAITimerFlag=false;


var pacerMode = 'DDD';
var pacedFlag=false;

function stopPacing() {
  pacerOn=false;
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
  //drawPacemaker();

  //resize meters

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
  
    aPacerOutput = document.getElementById("aOutputBox").value;
    document.getElementById("pacingBoxAOutput").innerText=aPacerOutput;
    vPacerOutput = document.getElementById("vOutputBox").value;
    document.getElementById("pacingBoxVOutput").innerText=vPacerOutput;
    document.getElementById("pacingBoxMode").innerText=pacerMode;
}

function onParameterChange() {
  //aPacerSensitivity = document.getElementById("aSensitivityBox").value;
  //vPacerSensitivity = document.getElementById("vSensitivityBox").value;
  AVInterval = parseInt(document.getElementById("AVInterval").value);

  // update pacer display
  //document.getElementById("aSenseMeter").value = -10.4167*aPacerSensitivity + 104.17
  //document.getElementById("vSenseMeter").value = -5.2083*vPacerSensitivity + 104.17
  document.getElementById("boxAsenseValue").innerText = aPacerSensitivity + " mV"
  document.getElementById("boxVsenseValue").innerText = vPacerSensitivity + " mV"
  document.getElementById("boxAVInterval").innerText = AVInterval + " ms"
  //document.getElementById("AVMeter").value = AVInterval
  pacingRate = parseInt(document.getElementById('pacingBoxRate').innerText)
  updateAllGUIValues()
}

function calculateMeter(value,min,max)
{ // y = mx + b
  // slope = dy/dx
  // b = y - mx   // in my case, always equal to the min value
  let y1 = 100
  let y2 = 0
  let x1 = max
  let x2 = min
  let slope = (y2 - y1) / (x2 - x1)
  let intercept = y2 - slope*x2
  let result = value*slope + intercept
  return parseFloat(result)
}

function updateAllGUIValues()
{
  if (pacerLocked)
  {
    document.getElementById('mainScreen').style.display='none'
    document.getElementById('modeScreen').style.display='none'
    document.getElementById('lockScreen').style.display=''
    document.getElementById('RAPscreen').style.display='none'
  }
  else if (pacerPaused)
  {
    document.getElementById('mainScreen').style.display='none'
    document.getElementById('modeScreen').style.display='none'
    document.getElementById('lockScreen').style.display='none'
    document.getElementById('pauseScreen').style.display=''
    document.getElementById('RAPscreen').style.display='none'
  }
  else
  {
    document.getElementById('lockScreen').style.display='none'
    document.getElementById('pauseScreen').style.display='none'
    if (currentBottomScreen=='mainmenu')
    {
      document.getElementById('mainScreen').style.display=''
      document.getElementById('modeScreen').style.display='none'
      document.getElementById('RAPscreen').style.display='none'
    }
    else if (currentBottomScreen=="modeScreen")
    {
      document.getElementById('mainScreen').style.display='none'
      document.getElementById('modeScreen').style.display=''
      document.getElementById('RAPscreen').style.display='none'
    }
    else if (currentBottomScreen=='RAPscreen')
    {
      document.getElementById('mainScreen').style.display='none'
      document.getElementById('modeScreen').style.display='none'
      document.getElementById('RAPscreen').style.display=''
    }
  }

  // pacemaker GUI
      // meters
      document.getElementById("aSenseMeter").value = 100-calculateMeter(aPacerSensitivity,aPacerMaxSensitivity,aPacerMinSensitivity)
      document.getElementById("vSenseMeter").value = 100-calculateMeter(vPacerSensitivity,vPacerMaxSensitivity,vPacerMinSensitivity)
      document.getElementById("PVARPMeter").value = calculateMeter(PVARP,PVARPmin,PVARPmax)
      if (autoAV) {document.getElementById("AVMeter").value = calculateMeter(HRadjustedAV,AVImin,AVImax)}
      else        {document.getElementById("AVMeter").value = calculateMeter(AVInterval,AVImin,AVImax)}
      document.getElementById("URLMeter").value = calculateMeter(upperRateLimit,URLmin,URLmax)
      document.getElementById("RAPrateMeter").value = calculateMeter(RAPrate,RAPrateMin,RAPrateMax)
      
      // pureknob update
      /*
      knob._width = knobElem.offsetWidth
      knob._height = knobElem.offsetHeight
      knob.redraw()
      

      knob2._width = knobElem2.offsetWidth
      knob2._height = knobElem2.offsetHeight
      knob2.redraw()

      knob3._width = knobElem3.offsetWidth
      knob3._height = knobElem3.offsetHeight
      knob3.redraw()

      */
      // update visual rate indicator top screen
      knob.setValue(pacingRate);
      knob2.setValue(aPacerOutput);
      knob3.setValue(vPacerOutput);
  
  
    document.getElementById("boxAsenseValue").innerText = aPacerSensitivity.toFixed(1) + " mV"
  document.getElementById("boxVsenseValue").innerText = vPacerSensitivity.toFixed(1) + " mV"
  document.getElementById("boxAVInterval").innerText = AVInterval.toFixed(0) + " ms"
  document.getElementById("boxPVARPValue").innerText = PVARP.toFixed(0) + " ms"    
  document.getElementById("boxURL").innerText = upperRateLimit.toFixed(0) + " ppm"
  document.getElementById("RAPrateValue").innerText = RAPrate.toFixed(0)  + " ppm"  
  
  HRadjustedAV = Math.round((300 - (1.67 * pacingRate))/2)*2
  if (HRadjustedAV < 50) {HRadjustedAV = 50}
  if (HRadjustedAV > 250) {HRadjustedAV = 250}

      
      // upper screen
  document.getElementById("pacingBoxRate").innerText = pacingRate
  document.getElementById("pacingBoxVOutput").innerText = vPacerOutput
  document.getElementById("pacingBoxAOutput").innerText = aPacerOutput
  
  // icons
  if (pacerLocked)
  {
    document.getElementById('lockIndicator').style.visibility = '';
  }
  else
  {
    document.getElementById('lockIndicator').style.visibility = 'hidden';
  }

  // text boxes left side
  document.getElementById("aOutputBox").value = aPacerOutput
  document.getElementById("vOutputBox").value = vPacerOutput
  document.getElementById("aSensitivityBox").value = aPacerSensitivity.toFixed(1)
  document.getElementById("vSensitivityBox").value = vPacerSensitivity.toFixed(1)
  document.getElementById("pacingRate").value = pacingRate
  document.getElementById("AVInterval").value = AVInterval.toFixed(0)
  document.getElementById("URLbox").value = upperRateLimit.toFixed(0)
  document.getElementById("paceButton").innerHTML = 'Stop Pacing'

  // show or hide appropriate elements
  if (pacerMode == 'DDD')
  {
    document.getElementById('aOutputRow').style.visibility = '';
    document.getElementById('vOutputRow').style.visibility = '';
    document.getElementById('AsenseRow').style.display = '';
    document.getElementById('VsenseRow').style.display = '';
    document.getElementById('AVIrow').style.display = '';
    document.getElementById('PVARProw').style.display = '';
    document.getElementById('aTracking').style.display = '';
    document.getElementById('URLrow').style.display = '';
    document.getElementById('settings').style.display = '';
  }
  if (pacerMode == 'DDI')
  {
    document.getElementById('aOutputRow').style.visibility = '';
    document.getElementById('vOutputRow').style.visibility = '';
    document.getElementById('AsenseRow').style.display = '';
    document.getElementById('VsenseRow').style.display = '';
    document.getElementById('AVIrow').style.display = '';
    document.getElementById('PVARProw').style.display = '';
    document.getElementById('aTracking').style.display = '';
    document.getElementById('URLrow').style.display = 'none';
    document.getElementById('settings').style.display = '';
  }
  if (pacerMode == 'DOO')
  {
    document.getElementById('aOutputRow').style.visibility = '';
    document.getElementById('vOutputRow').style.visibility = '';
    document.getElementById('AsenseRow').style.display = 'none';
    document.getElementById('VsenseRow').style.display = 'none';
    document.getElementById('AVIrow').style.display = '';
    document.getElementById('PVARProw').style.display = 'none';
    document.getElementById('aTracking').style.display = 'none';
    document.getElementById('URLrow').style.display = 'none';
    document.getElementById('settings').style.display = '';
  }
  if (pacerMode == 'AAI')
  {
    document.getElementById('aOutputRow').style.visibility = '';
    document.getElementById('vOutputRow').style.visibility = 'hidden';
    document.getElementById('AsenseRow').style.display = '';
    document.getElementById('VsenseRow').style.display = 'none';
    document.getElementById('AVIrow').style.display = 'none';
    document.getElementById('PVARProw').style.display = 'none';
    document.getElementById('aTracking').style.display = 'none';
    document.getElementById('URLrow').style.display = 'none';
    document.getElementById('settings').style.display = '';
  }
  if (pacerMode == 'AOO')
  {
    document.getElementById('aOutputRow').style.visibility = '';
    document.getElementById('vOutputRow').style.visibility = 'hidden';
    document.getElementById('AsenseRow').style.display = 'none';
    document.getElementById('VsenseRow').style.display = 'none';
    document.getElementById('AVIrow').style.display = 'none';
    document.getElementById('PVARProw').style.display = 'none';
    document.getElementById('aTracking').style.display = 'none';
    document.getElementById('URLrow').style.display = 'none';
    document.getElementById('settings').style.display = 'none';
  }
  if (pacerMode == 'VVI')
  {
    document.getElementById('aOutputRow').style.visibility = 'hidden';
    document.getElementById('vOutputRow').style.visibility = '';
    document.getElementById('AsenseRow').style.display = 'none';
    document.getElementById('VsenseRow').style.display = '';
    document.getElementById('AVIrow').style.display = 'none';
    document.getElementById('PVARProw').style.display = 'none';
    document.getElementById('aTracking').style.display = 'none';
    document.getElementById('URLrow').style.display = 'none';
    document.getElementById('settings').style.display = '';
  }
  if (pacerMode == 'VOO')
  {
    document.getElementById('aOutputRow').style.visibility = 'hidden';
    document.getElementById('vOutputRow').style.visibility = '';
    document.getElementById('AsenseRow').style.display = 'none';
    document.getElementById('VsenseRow').style.display = 'none';
    document.getElementById('AVIrow').style.display = 'none';
    document.getElementById('PVARProw').style.display = 'none';
    document.getElementById('aTracking').style.display = 'none';
    document.getElementById('URLrow').style.display = 'none';
    document.getElementById('settings').style.display = 'none';
  }
  if (pacerMode == 'OOO')
  {
    document.getElementById('aOutputRow').style.visibility = 'hidden';
    document.getElementById('vOutputRow').style.visibility = 'hidden';
    document.getElementById('AsenseRow').style.display = 'none';
    document.getElementById('VsenseRow').style.display = 'none';
    document.getElementById('AVIrow').style.display = 'none';
    document.getElementById('PVARProw').style.display = 'none';
    document.getElementById('aTracking').style.display = 'none';
    document.getElementById('URLrow').style.display = 'none';
    document.getElementById('settings').style.display = 'none';
  }

  // update manual asterisks *
  if (manAVI)
  {
    document.getElementById("boxAVInterval").innerText = "*"+AVInterval.toFixed(0) + " ms"
    autoAV = false
  }
  else
  {
    document.getElementById("boxAVInterval").innerText = HRadjustedAV.toFixed(0) + " ms"
    autoAV = true
  }

  if (manURL)
  {
    document.getElementById("boxURL").innerText = "*"+upperRateLimit.toFixed(0) + " ppm"
  }
  else
  {
    upperRateLimit = pacingRate + 30
    if (upperRateLimit < 110) {upperRateLimit=110}
    document.getElementById("boxURL").innerText = upperRateLimit.toFixed(0) + " ppm"
  }

  if (manPVARP)
  {
    document.getElementById("boxPVARPValue").innerText = "*"+PVARP.toFixed(0) + " ms"  
  }
  else
  {
    document.getElementById("boxPVARPValue").innerText = PVARP.toFixed(0) + " ms"
    //if (pacingRate)
  }

  if (manAVI || manURL || manPVARP)
  {
    document.getElementById("settingsValue").innerText = 'Manual(*)'
  }
  else
  {
    document.getElementById("settingsValue").innerText = 'Automatic'
  }

}
updateAllGUIValues()

function updateVariablesFromGUI()
{

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
/*
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
*/

function noiseToggle()
{noiseFlag=!noiseFlag}

function noiseFunction()
{
  //dataFeed[0] = dataFeed[0]*1.05 // 5% wander
  if (dataClock%20==0)
  {
  dataFeed[0] = dataFeed[0]+(Math.random()-0.5)/5
  }
}

function feedbackFunction() // provides feedback on settings
{
  if (currentRhythm != 'aFib' && currentRhythm != 'aFlutter')
  {
    if (aPacerSensitivity < aUndersenseThreshold && aPacerSensitivity > aOversenseThreshold && vPacerSensitivity < vUndersenseThreshold && vPacerSensitivity > vOversenseThreshold && aPacerOutput > aCaptureThreshold && vPacerOutput > vCaptureThreshold) // sensitivity settings
    {
      
        settingsCorrect=true;
        document.getElementById("feedbackBox").innerText = "sensing/output: CORRECT"
        document.getElementById("feedbackBox").style.backgroundColor = ""
      
    }
    else
      {
        settingsCorrect=false;
        document.getElementById("feedbackBox").innerText = "sensing/output: INCORRECT"
        document.getElementById("feedbackBox").style.backgroundColor = "red"
      }
  }
  else if (currentRhythm == 'aFib' || currentRhythm == 'aFlutter')
  {
    
    if (aPacerSensitivity < aUndersenseThreshold && aPacerSensitivity > aOversenseThreshold && vPacerSensitivity < vUndersenseThreshold && vPacerSensitivity > vOversenseThreshold && vPacerOutput > vCaptureThreshold) // sensitivity settings
    {
        settingsCorrect=true;
        document.getElementById("feedbackBox").innerText = "sensing/output: CORRECT"
        document.getElementById("feedbackBox").style.backgroundColor = ""
    }
    else
      {
        settingsCorrect=false;
        document.getElementById("feedbackBox").innerText = "sensing/output: INCORRECT"
        document.getElementById("feedbackBox").style.backgroundColor = "red"
      }
    if (pacerMode=='DDD')
      {
        document.getElementById("feedbackBox").innerText = document.getElementById("feedbackBox").innerText.concat("\nBe careful of A-tracking supraventricular arrhythmias while in DDD mode")
        document.getElementById("feedbackBox").style.backgroundColor = "yellow"
      }
    if (pacerMode == 'AAI')
    {
      document.getElementById("feedbackBox").innerText = document.getElementById("feedbackBox").innerText.concat("\nMode: Atrial capture is not possible with atrial fib/flutter.")

        document.getElementById("feedbackBox").innerText = document.getElementById("feedbackBox").innerText.concat('\nMode: Atrial sensing is not reliable/useful with atrial fib/flutter')
  
      document.getElementById("feedbackBox").style.backgroundColor = "red"
    }
  }
}


function tickTimers() // advance all timers every time dataClock is advanced
{
  ventRefractoryTimer += 2 
  atrialRefractoryTimer += 2 
}


function widenWave(inputWave,factor)
{
  if (factor==0) {return inputWave}

  let widenedArray = [];
  for (let i = 0; i < factor; i++)
  {
    widenedArray = []
    for (let j = 0; j < inputWave.length; j++) 
    {
      
      widenedArray.push(inputWave[j])
      if (j == inputWave.length)
      {}
      else
      {
      widenedArray.push((inputWave[j+1]+inputWave[j])/2)
      }
    }
    inputWave=widenedArray.slice()
  }

  return widenedArray;
}

function animateButton(clickedButton)
{
  
  clickedButton.style.transform = 'scale(85%)';
  setTimeout(function(){clickedButton.style.transform = 'scale(100%)';},"150");
}

let pauseButtonDepressed = false
function pauseButton(event)
{ 
  let pauseButton = event.target
  let startTime = Date.now()
  pauseButton.style.transform = 'scale(85%)';
  if (event.type=='mousedown' || event.type=='touchstart')
    {
    pacerPaused = !pacerPaused
    updateAllGUIValues() 

    document.getElementById('pauseButton').addEventListener('mouseup', unpause)
    }
  if (event.type=='touchstartXXX')
  {
    pauseButtonDepressed=!pauseButtonDepressed
    if (pauseButtonDepressed == true)
    {
      pauseButtonDepressed = false
      pauseButton.style.transform = 'scale(100%)';
      pacerPaused = false

    }
    if (pauseButtonDepressed == false)
    {
      pauseButtonDepressed = true
      pauseButton.style.transform = 'scale(85%)';
      pacerPaused = true
    }
    updateAllGUIValues()
  }

  function unpause(event)
  {
    let elapsedTime = Date.now() - startTime
    pacerPaused = !pacerPaused

    pauseButton.style.transform = 'scale(100%)';
    pauseButton.removeEventListener('mouseup', unpause)
    updateAllGUIValues()
  }


}

document.getElementById('pauseButton').addEventListener('mousedown', pauseButton)
document.getElementById('pauseButton').addEventListener('touchstart', pauseButton)

function lockButtonClick()
{
  pacerLocked=!pacerLocked
  updateAllGUIValues()
}

function RAPclick()
{
  currentBottomScreen='RAPscreen'
  selectableRows = getSelectableRows()
  reassignRowNumbers()
  maxRowNumber = selectableRows.length-1
  currentlySelectedRowNumber = 0;
  
  //document.getElementById('RAPscreen').display=''
  drawBordersAndArrow()
  updateAllGUIValues()
}

document.getElementById('enterButton').addEventListener('touchstart', enterClick)
document.getElementById('enterButton').addEventListener('mousedown', enterClick)
let testvar = 0

function deliverRAP(event)
{
  keyDown = true;
  let enterButton = document.getElementById('enterButton')
  enterButton.style.transform = 'scale(85%)';
  // remember pacemaker settings
  let priorMode = pacerMode
  let priorRate = pacingRate
  let priorAOutput = aPacerOutput

  pacerMode = 'AOO'
  pacingRate = RAPrate

  document.getElementById("enterButton").addEventListener("mouseup",endRAP)
  document.getElementById("enterButton").addEventListener("touchend",endRAP)

testvar+=1
  updateAllGUIValues()
  let RAPscreen = document.getElementById("RAPscreen")
  
  RAPscreen.classList.add("RAPscreenDark")

  let RAPtextSection = document.getElementById('RAPtext')
  let priorText = RAPtextSection.innerHTML

  RAPtextSection.innerHTML = "DELIVERING<br>Rapid Atrial Pacing"


  document.getElementById("bottomRowsSectionRAP").style.visibility = 'hidden'

  document.onkeyup = function (e) {
    e = e || window.event;

    if (e.key == 'Enter')
    {
      endRAP()
    }
  };


  function endRAP(event)
  {
    let enterButton = document.getElementById('enterButton')
    pacerMode = priorMode
    pacingRate = priorRate
    RAPtextSection.innerHTML = priorText

    document.getElementById("RAPscreen").classList.remove("RAPscreenDark")
    document.getElementById("bottomRowsSectionRAP").style.visibility = ''

    enterButton.style.transform = 'scale(100%)';
    if (event != undefined)
    {
    event.preventDefault()
    }

    document.getElementById("enterButton").removeEventListener("mouseup",endRAP)
    document.getElementById("enterButton").removeEventListener("touchend",endRAP)

    document.onkeyup = null
    keyDown = false;
    // call function that determines if patient converts from flutter
    updateAllGUIValues()
  }

  document.getElementById("enterButton").removeEventListener("mousedown",endRAP)
  document.getElementById("enterButton").removeEventListener("touchstart",endRAP)
  
}

var knobArray = []

function saveKnobState(knob,rowID)
{
  if (knob.cumulativeDegrees != undefined)
  {
  knobArray[rowID] = knob.cumulativeDegrees
  }
}

function loadKnobState(rowID)
{
  if(knobArray[rowID] == undefined)
  {
    return 1;
  }
  else
  {
  document.getElementById("bottomKnobImg").cumulativeDegrees = knobArray[rowID]
  return 0;
  }
  
}

function getSelectableRows()
{
  var selectableRowsArray = []
  if (currentBottomScreen=='mainmenu')
  {var ancestor = document.getElementById('mainScreen');}
  else if (currentBottomScreen=='modeScreen')
  {var ancestor = document.getElementById('modeScreen');}
  else if (currentBottomScreen=='RAPscreen')
  {var ancestor = document.getElementById('RAPscreen');}

  var descendents = ancestor.getElementsByTagName('*');
    // gets all rows

    var i, e, d;
    for (i = 0; i < descendents.length; ++i) 
    {
    e = descendents[i];
      if ((e.classList.contains("barRow") || e.classList.contains("bottomRows") || e.id == "radio") && e.style.display != 'none')
      {
        e.selectable = true
        selectableRowsArray.push(e)
        if (e.classList.contains("rowSelected"))
        {
          e.selected = true;
        }
        else
        {
          e.selected = false;
        }
      }
      else
      {
        e.selectable = false
      }
    }
    return (selectableRowsArray)
}

function reassignRowNumbers()
{
  let i = 0
  for (i = 0; i < selectableRows.length; i++) {
    const element = selectableRows[i];

    selectableRows[i].dataset.rownum = i
    
  }
  return i
}

var selectedRow
var selectableRows = []
function downArrowClick()
{
  selectableRows = getSelectableRows()
  reassignRowNumbers()
  maxRowNumber = selectableRows.length-1

  if (currentBottomScreen=='mainmenu')
  {
  saveKnobState(document.getElementById("bottomKnobImg"),selectedRow.id)
  }

  if (currentlySelectedRowNumber < maxRowNumber)
  {
    currentlySelectedRowNumber+=1;
  }
  else
  {
    currentlySelectedRowNumber=0;
  }
  drawBordersAndArrow()
  if (currentBottomScreen=='mainmenu')
  {
    loadKnobState(selectedRow.id)
  }
  //drawBordersAndArrow()
  getBottomDialParameters()
  // resetBottomKnob()
}



function upArrowClick()
{
  selectableRows = getSelectableRows()

  reassignRowNumbers()
  maxRowNumber = selectableRows.length-1
  
  if (currentBottomScreen=='mainmenu')
  {
  saveKnobState(document.getElementById("bottomKnobImg"),selectedRow.id)
  }

  if (currentlySelectedRowNumber > 0)
  {
  currentlySelectedRowNumber-=1;
  }
  else
  {
    currentlySelectedRowNumber=maxRowNumber
  }
  drawBordersAndArrow()
  if (currentBottomScreen=='mainmenu')
  {
    loadKnobState(selectedRow.id)
  }
  //drawBordersAndArrow()
  getBottomDialParameters()
  // resetBottomKnob()

}


var selectedOption // bottom screen, which item is selected?
function drawBordersAndArrow()
{
  if (currentBottomScreen=='mainmenu')
  {var ancestor = document.getElementById('mainScreen');}
  else if (currentBottomScreen=='modeScreen')
  {var ancestor = document.getElementById('modeScreen');}
  else if (currentBottomScreen=='RAPscreen')
  {var ancestor = document.getElementById('RAPscreen');}

  var descendents = ancestor.getElementsByTagName('*');
    // gets all rows

    var i, e, d;
    for (i = 0; i < descendents.length; ++i) 
    {
    e = descendents[i];
      if ((e.className == "barRow" || e.className == "bottomRows" || e.id == "radio") && e.style.display != 'none')
      {
        e.selectable = true
      }
      else {e.selectable = false}
      
      if (e.selectable == true)
      {
        if (e.className == "barRow" || e.className == "bottomRows")
        {
          var found = false;
          bottomRowsArray.forEach(element => {
            if (element.id == e.id)
            {
              found = true;
            }
          });
          if (!found)
            {
              bottomRowsArray.push(e)
            }
        }
        if (e.style.display == 'none')
        {
          currentlySelectedRowNumber++
          if (e.classList.contains('rowSelected'))
          {
            e.classList.remove('rowSelected')

          }
        }
        else if (e.dataset.rownum == currentlySelectedRowNumber)
        {
          selectedRow = e
          if (e.id=="radio" || e.className == "bottomRows")
          {

            divNode.appendChild(imgNode)
            e.appendChild(divNode)
          }
          else
          {
            divNode.remove();
          }
          e.classList.add('rowSelected')
          selectedOption = e.id
        }
        else if (e.classList.contains('rowSelected'))
        {
          e.classList.remove('rowSelected')

        }
      }
      else 
        {
          if (e.classList.contains('rowSelected'))
          {
          e.classList.remove('rowSelected')
          }
          
        }
  }
}

function getSelectedRow ()
{
  getSelectableRows()
  reassignRowNumbers()
  
  if (currentBottomScreen=='mainmenu')
  {var ancestor = document.getElementById('mainScreen');}
  else if (currentBottomScreen=='modeScreen')
  {var ancestor = document.getElementById('modeScreen');}
  else if (currentBottomScreen=='RAPscreen')
  {var ancestor = document.getElementById('RAPscreen');}
  
  var descendents = ancestor.getElementsByTagName('*');
    // gets all rows

    var i, e, d;
    for (i = 0; i < descendents.length; ++i) 
    {
      e = descendents[i];
      if (e.dataset.rownum == currentlySelectedRowNumber)
      {
        return e;
      }
    }
}

function enterClick(event)
{

  let enterButton = document.getElementById('enterButton')
  if (currentBottomScreen=='mainmenu')
  {var ancestor = document.getElementById('mainScreen');}
  else if (currentBottomScreen=='modeScreen')
  {var ancestor = document.getElementById('modeScreen');}
  else if (currentBottomScreen=='RAPscreen')
  {var ancestor = document.getElementById('RAPscreen');}
  
  var descendents = ancestor.getElementsByTagName('*');
    // gets all rows

    var i, e, d;
    for (i = 0; i < descendents.length; ++i) 
    {
      e = descendents[i];
      if (e.dataset.rownum == currentlySelectedRowNumber)
      {
        if (e.id != "RAPrateRow" && e.id != "pauseButton")
        {
          animateButton(enterButton)
        }
        if (e.id == "radio")
        {
        e.firstElementChild.firstElementChild.src = "assets/radio-circle-marked.svg"
        pacerMode = e.firstElementChild.nextElementSibling.innerText
        document.getElementById("pacingBoxMode").innerText = pacerMode
        let element = document.getElementById("pacingMode")
        element.selectedIndex = currentlySelectedRowNumber
        updateAllGUIValues()
        
        }
        else if (e.id == "backOption")
        {
        backClick()
        break
        }
        else if (e.id == "modeSelection")
        {
        modeSelectionClick()
        break
        }
        else if (e.id == "aTracking")
        {
          if (e.lastElementChild.lastElementChild.innerHTML == "On")
          {
            e.lastElementChild.lastElementChild.innerHTML = 'Off'
            let element = document.getElementById("pacingMode")
            element.selectedIndex = 1;
            pacerMode = document.getElementById("pacingBoxMode").innerText = 'DDI'
          }
          else if (e.lastElementChild.lastElementChild.innerHTML == "Off")
          {
            e.lastElementChild.lastElementChild.innerHTML = 'On'
            let element = document.getElementById("pacingMode")
            element.selectedIndex = 0;
            pacerMode = document.getElementById("pacingBoxMode").innerText = 'DDD'
          }
        break
        }
        else if (e.id == "settings")
        {
          if (e.lastElementChild.lastElementChild.innerHTML == "Automatic")
          {
            e.lastElementChild.lastElementChild.innerHTML = 'Manual(*)'  // set all rate-dependent settings to manual
            manAVI = manURL = manPVARP = true;
          }
          else if (e.lastElementChild.lastElementChild.innerHTML == "Manual(*)")
          {
            e.lastElementChild.lastElementChild.innerHTML = 'Automatic'
            manAVI = manURL = manPVARP = false;
            AVInterval = HRadjustedAV
            upperRateLimit = 110
            PVARP = 300
          }
        break
        }
        else if (e.id == "RAP")
        {
          RAPclick()
          break
        }
        else if (e.id == "RAPrateRow")
        {
          deliverRAP(event)
          //deliverRAP()
          break
        }
      }
      else if (e.dataset.rownum != undefined && e.id == "radio")
      {
        e.firstElementChild.firstElementChild.src = "assets/radio-circle.svg"
        
      }
  
    }
    updateAllGUIValues()
    if (event!=undefined)
    {
    event.preventDefault()
    }

    if (e.id != "RAPrateRow")
    {
      keyDown=false
    }

}

function backClick()
{
  // write new HTML
  currentBottomScreen = "mainmenu"
  drawMainMenu()  
  getBottomDialParameters()
  updateAllGUIValues()
  loadKnobState(selectedRow.id)
}

function drawMainMenu()
{
  selectableRows = getSelectableRows()
  reassignRowNumbers()
  maxRowNumber = selectableRows.length-1
  currentlySelectedRowNumber = 0;
  
  document.getElementById("modeScreen").style.display = "none"
  document.getElementById("mainScreen").style.display = ""
  
 drawBordersAndArrow()
}

function modeSelectionClick()
{
  currentBottomScreen = "modeScreen"
  selectableRows = getSelectableRows()
  reassignRowNumbers()
  maxRowNumber = selectableRows.length-1

  currentlySelectedRowNumber = 0;

  document.getElementById("mainScreen").style.display = "none"
  document.getElementById("modeScreen").style.display = ""

  drawBordersAndArrow()

  // select current mode

    // gets all selectable rows
    
    var i, e, found=false;
    for (i = 0; i < selectableRows.length; ++i) 
    {
      e = selectableRows[i];
      var descendents = e.getElementsByClassName("modeName")
      for (let j = 0; j < descendents.length; j++) {
        const element = descendents[j];
        if (element.innerText == pacerMode)
        {
          e.firstElementChild.firstElementChild.src = "assets/radio-circle-marked.svg"
        }
        else if (e.id == "radio")
        {
          e.firstElementChild.firstElementChild.src = "assets/radio-circle.svg"
          
        }
  
    }
  }
}

function calcKnobParams(knobImage)
{
  knobImage.minLock = false
  knobImage.maxLock = false

  
  // calculate minDegree and maxDegree for the knob clicked
  if (knobImage.reverseKnob)
  {
  knobImage.maxDegree = -(knobImage.minValue - knobImage.startValue)/knobImage.turnFactor
  knobImage.minDegree = -(knobImage.maxValue - knobImage.startValue)/knobImage.turnFactor
  }
  else
  {
    knobImage.minDegree = (knobImage.minValue - knobImage.startValue)/knobImage.turnFactor
    knobImage.maxDegree = (knobImage.maxValue - knobImage.startValue)/knobImage.turnFactor
  }

  
  if (isNaN(knobImage.cumulativeDegrees)) {knobImage.cumulativeDegrees=0}
  if (isNaN(knobImage.revolutions)) {knobImage.revolutions=0}
  //if (isNaN(knobImage.lastDeg)) {knobImage.lastDeg=0}
  

}

// Harrison Knob
function knobClick (clickEvent)
{
  
  getBottomDialParameters()
  var clickTarget = clickEvent.target

  document.getElementById('mainDiv').classList.add('grabbed')
  clickTarget.classList.add('grabbed')

  clickTarget.moveSteps = 0

  // calcute center of knob
  clickTarget.knobRect = clickTarget.getBoundingClientRect()
  clickTarget.centerPos = [clickTarget.knobRect.left + (clickTarget.knobRect.width / 2), clickTarget.knobRect.top + (clickTarget.knobRect.height / 2)]
  //if (isNaN(clickTarget.lastDeg))
  //{clickTarget.lastDeg = 0}

  calcKnobParams(clickTarget)

  if (isNaN(clickTarget.lastDeg)) // if it's undefined, then it must be the first run
  {
    if (isNaN(clickTarget.deg))
    {
      clickTarget.deg = clickTarget.lastDeg = 0
    }
    else
    {
      clickTarget.lastDeg = clickTarget.deg
    }

  }

  //clickTarget.cumulativeDegrees = clickTarget.turnFactor

  function mousemove(dragEvent)
  {
    clickTarget.moveSteps += 1
    // calculate position of mouse relative to center of knob
    if (dragEvent.type=='touchmove')
    {
      clickTarget.mouseRelativetoKnobCenter = [dragEvent.touches[0].pageX - clickTarget.centerPos[0], clickTarget.centerPos[1]- dragEvent.touches[0].pageY]
    }
    else
    {
    clickTarget.mouseRelativetoKnobCenter = [dragEvent.pageX - clickTarget.centerPos[0], clickTarget.centerPos[1]- dragEvent.pageY]
    }

    // convert coordinates to angle in degrees
    clickTarget.deg = Math.round(Math.atan2(clickTarget.mouseRelativetoKnobCenter[0], clickTarget.mouseRelativetoKnobCenter[1]) * (180/Math.PI)); // x,y -> rad -> degree
    if (clickTarget.deg<0){clickTarget.deg+=360}

    
    if (isNaN(clickTarget.lastDeg)) // if it's undefined, then it must be the first run
    {
      clickTarget.lastDeg = clickTarget.deg
    }

 
    
   // console.log('degree: ' + clickTarget.deg)
    //rotateKnobImage(clickTarget, clickTarget.deg)
    knobAngleToResult(clickEvent, clickTarget) // (event, knob image)

    // rotate the knob
 
    //rotateKnobImage(clickTarget, clickTarget.deg)

/*
if (!pacerLocked)
{
//////////////////
 // manage knob limits
let newRev = false

clickTarget.revolutions = Math.floor(clickTarget.cumulativeDegrees / 360)

let revolution = 0;

if (clickTarget.lastDeg-clickTarget.deg > 300 ) // if number passes through 0/360, add or subtract a rotation
{
  if (!clickTarget.maxLock)
  {
  revolution = 360
  }
  newRev = true
}
if (clickTarget.lastDeg-clickTarget.deg < -300)
{
  if (!clickTarget.minLock)
  {
  revolution = -360
  }
  newRev = true
}
    
    let testCumulative = clickTarget.cumulativeDegrees + (clickTarget.deg - clickTarget.lastDeg) + revolution
    let testValue = Math.round(clickTarget.startValue+clickTarget.cumulativeDegrees*clickTarget.turnFactor)
    
    //console.log(testCumulative)
    if (testCumulative >= clickTarget.maxDegree)
    {
      clickTarget.maxLock = true;
    }

    if (testCumulative <= clickTarget.minDegree)
    {
      clickTarget.minLock = true;
    }

    if (clickTarget.maxLock)
    {
      if (testCumulative < clickTarget.maxDegree && !newRev && clickTarget.lastDeg - clickTarget.deg > 0) // break the max lock?
      {
        clickTarget.maxLock = false
      }
      else // if can't break lock..
      {
        clickTarget.cumulativeDegrees = clickTarget.maxDegree
      }
    }

    if (clickTarget.minLock)
    {
      if (testCumulative > clickTarget.minDegree && !newRev && clickTarget.lastDeg - clickTarget.deg < 0) // break the min lock?
      {
        clickTarget.minLock = false
      }
      else // if can't break lock..
      {
        clickTarget.cumulativeDegrees = clickTarget.minDegree
      }
    }

    if (!clickTarget.minLock && !clickTarget.maxLock)
    {
      clickTarget.cumulativeDegrees = testCumulative
    }


///////////////////
      clickTarget.lastDeg = clickTarget.deg
   

let result = clickTarget.startValue + (clickTarget.cumulativeDegrees * clickTarget.turnFactor)
let negresult = clickTarget.startValue + (-clickTarget.cumulativeDegrees * clickTarget.turnFactor)

if (clickTarget.reverseKnob)
{clickTarget.currentValue = result = negresult}
else
{clickTarget.currentValue = result}


      if (clickTarget.id=="rateDialImg")
      {
        pacingRate = Math.round(result)
      }

      if (clickTarget.id=="vOutputDialImg")
      {
        vPacerOutput = Math.round(result)
      }

      if (clickTarget.id=="aOutputDialImg")
      {
        aPacerOutput = Math.round(result) 
      }

      if (clickTarget.id=="bottomKnobImg")
      {
        bottomKnobFunction(result)
      }
      // onParameterChange()
      updateAllGUIValues()
    }
    */

    dragEvent.preventDefault()
  }

  function knobOff(event){
    document.getElementById('mainDiv').classList.remove('grabbed')
  clickTarget.classList.remove('grabbed')

    window.removeEventListener('mousemove',mousemove)
    window.removeEventListener('touchmove',mousemove)

    window.removeEventListener('touchend',knobOff)
    window.removeEventListener('mouseup',knobOff)

    clickTarget.lastDeg = undefined;
    event.preventDefault()
  }

  window.addEventListener('mousemove', mousemove);
  window.addEventListener('touchmove', mousemove);
  window.addEventListener('mouseup', knobOff);
  window.addEventListener('touchend', knobOff);

  clickEvent.preventDefault()
 
}


function knobAngleToResult(event, knobImage)  // working here ***
{
  
  //let knobImage = event.target

  if (isNaN(knobImage.deg) || knobImage.deg == undefined)
  {knobImage.deg = 0}

  if (event.key=='ArrowLeft')
  {
    knobImage.deg -= 10
  }
  if (event.key=='ArrowRight')
  {
    knobImage.deg += 10
  }

  if (knobImage.deg > 360)
  {
    knobImage.deg = knobImage.deg - 360
  }
  else if (knobImage.deg < 0)
  {
    knobImage.deg = knobImage.deg + 360
  }

  knobImage.setAttribute('style', 'transform: rotate(' + knobImage.deg + 'deg)');

  calcKnobParams(knobImage)

  if (isNaN(knobImage.lastDeg))
  {
    knobImage.lastDeg = knobImage.deg
  }
  if (!pacerLocked) // let knob spin but do nothing else if pacer is locked
{
//////////////////
 // manage knob limits
let newRev = false

//knobImage.revolutions = Math.floor(knobImage.cumulativeDegrees / 360)

let revolution = 0;

if (knobImage.moveSteps == 1)
{
  knobImage.lastDeg = knobImage.deg 
}

knobImage.deltaDeg = knobImage.lastDeg-knobImage.deg 

if (Math.abs(knobImage.deltaDeg) > 50)
{
  let test = 'Breakpoint because deltaDeg should only be greater than '
}
if (knobImage.lastDeg-knobImage.deg > 300 ) // if number passes through 0/360, add or subtract a rotation
{
  if (!knobImage.maxLock)
  {
  revolution = 360
  }
  newRev = true
}
if (knobImage.lastDeg-knobImage.deg < -300)
{
  if (!knobImage.minLock)
  {
  revolution = -360
  }
  newRev = true
}
    
    let testCumulative = knobImage.cumulativeDegrees + (knobImage.deg - knobImage.lastDeg) + revolution
    let testValue = Math.round(knobImage.startValue+knobImage.cumulativeDegrees*knobImage.turnFactor)
    
    //console.log(testCumulative)
    if (testCumulative >= knobImage.maxDegree)
    {
      knobImage.maxLock = true;
    }

    if (testCumulative <= knobImage.minDegree)
    {
      knobImage.minLock = true;
    }

    if (knobImage.maxLock)
    {
      if (testCumulative < knobImage.maxDegree && !newRev && knobImage.lastDeg - knobImage.deg > 0) // break the max lock?
      {
        knobImage.maxLock = false
      }
      else // if can't break lock..
      {
        knobImage.cumulativeDegrees = knobImage.maxDegree
      }
    }

    if (knobImage.minLock)
    {
      if (testCumulative > knobImage.minDegree && !newRev && knobImage.lastDeg - knobImage.deg < 0) // break the min lock?
      {
        knobImage.minLock = false
      }
      else // if can't break lock..
      {
        knobImage.cumulativeDegrees = knobImage.minDegree
      }
    }

    if (!knobImage.minLock && !knobImage.maxLock)
    {
      knobImage.cumulativeDegrees = testCumulative
    }


///////////////////
      knobImage.lastDeg = knobImage.deg
   

let result = knobImage.startValue + (knobImage.cumulativeDegrees * knobImage.turnFactor)
let negresult = knobImage.startValue + (-knobImage.cumulativeDegrees * knobImage.turnFactor)

if (knobImage.reverseKnob)
{knobImage.currentValue = result = negresult}
else
{knobImage.currentValue = result}


      if (knobImage.id=="rateDialImg")
      {
        pacingRate = Math.round(result)
      }

      if (knobImage.id=="vOutputDialImg")
      {
        vPacerOutput = Math.round(result)
      }

      if (knobImage.id=="aOutputDialImg")
      {
        aPacerOutput = Math.round(result) 
      }

      if (knobImage.id=="bottomKnobImg")
      {
        bottomKnobFunction(result)
      }
      // onParameterChange()
      updateAllGUIValues()
    }
}

// initialze knob parameters
var elem

// set rateDial parameters
elem = document.getElementById('rateDialImg')
elem.minValue = minPaceRate
elem.startValue = pacingRate
elem.maxValue = maxPaceRate
elem.turnFactor = knobTurnFactor


// set vOutputDial parameters
elem = document.getElementById('vOutputDialImg')
elem.minValue = 0
elem.startValue = vPacerOutput
elem.maxValue = vPacerMaxOutput
elem.turnFactor = knobTurnFactor


// set aOutputDial parameters
elem = document.getElementById('aOutputDialImg')
elem.minValue = 0
elem.startValue = aPacerOutput
elem.maxValue = aPacerMaxOutput
elem.turnFactor = knobTurnFactor


// add listeners
document.getElementById('rateDialImg').addEventListener('mousedown', knobClick);
document.getElementById('rateDialImg').addEventListener('touchstart', knobClick);
document.getElementById('vOutputDialImg').addEventListener('mousedown', knobClick);
document.getElementById('vOutputDialImg').addEventListener('touchstart', knobClick);
document.getElementById('aOutputDialImg').addEventListener('mousedown', knobClick);
document.getElementById('aOutputDialImg').addEventListener('touchstart', knobClick);
document.getElementById('bottomKnobImg').addEventListener('mousedown', knobClick);
document.getElementById('bottomKnobImg').addEventListener('touchstart', knobClick);


function getBottomDialParameters()
{
  if (selectedOption=="AsenseRow")
  {
    var elem = document.getElementById('bottomKnobImg')
    elem.minValue = aPacerMaxSensitivity
    elem.startValue = 4
    elem.maxValue = aPacerMinSensitivity
    elem.turnFactor = knobTurnFactor/3
    elem.reverseKnob = true
    elem.currentValue = aPacerSensitivity
    elem.maxLock = false;
    elem.minLock = false;
  }

  if (selectedOption=="VsenseRow")
  {
    var elem = document.getElementById('bottomKnobImg')
    elem.minValue = vPacerMaxSensitivity
    elem.startValue = 4
    elem.maxValue = vPacerMinSensitivity
    elem.turnFactor = knobTurnFactor/2
    elem.reverseKnob = true
    elem.currentValue = vPacerSensitivity
    elem.maxLock = false;
    elem.minLock = false;
  }

  if (selectedOption=="AVIrow")
  {
    var elem = document.getElementById('bottomKnobImg')
    elem.minValue = AVImin
    elem.startValue = 120
    elem.maxValue = AVImax
    elem.turnFactor = knobTurnFactor*3
    elem.reverseKnob = false
    elem.currentValue = AVInterval
    elem.maxLock = false;
    elem.minLock = false;
  }

  if (selectedOption=="PVARProw")
  {
    var elem = document.getElementById('bottomKnobImg')
    elem.minValue = PVARPmin
    elem.startValue = 300
    elem.maxValue = PVARPmax
    elem.turnFactor = knobTurnFactor*3
    elem.reverseKnob = false
    elem.currentValue = PVARP
    elem.maxLock = false;
    elem.minLock = false;
  }

  if (selectedOption=="URLrow")
  {
    var elem = document.getElementById('bottomKnobImg')
    elem.minValue = URLmin
    elem.startValue = 110
    elem.maxValue = URLmax
    elem.turnFactor = knobTurnFactor*3
    elem.reverseKnob = false
    elem.currentValue = upperRateLimit
    elem.maxLock = false;
    elem.minLock = false;
  }

  if (selectedOption=="RAPrateRow")
  {
    var elem = document.getElementById('bottomKnobImg')
    elem.minValue = RAPrateMin
    elem.startValue = 250
    elem.maxValue = RAPrateMax
    elem.turnFactor = knobTurnFactor*3
    elem.reverseKnob = false
    elem.currentValue = RAPrate
    elem.maxLock = false;
    elem.minLock = false;
  }
}
getBottomDialParameters()

function resetBottomKnob()
{
  var elem = document.getElementById('bottomKnobImg')
  elem.cumulativeDegrees = 0
  elem.deg = 0
  elem.lastDeg = 0
}


function bottomKnobFunction(knobResult)
{
  if (currentBottomScreen == "modeScreen")
  {return 1}


  if (selectedOption=="AsenseRow")
  {
     aPacerSensitivity = knobResult
  }

  if (selectedOption=="VsenseRow")
  {
    
     vPacerSensitivity = knobResult
  }

  if (selectedOption=="AVIrow")
  {
     AVInterval = knobResult
     manAVI = true
  }

  if (selectedOption=="PVARProw")
  {
    
    PVARP = knobResult
    manPVARP = true
  }

  if (selectedOption=="URLrow")
  {
    
    upperRateLimit = knobResult
    manURL = true
  }

  if (selectedOption=="RAPrateRow")
  {
    RAPrate = parseInt(knobResult)
  }
  

  

  updateAllGUIValues()
}

/*
function rescaleFonts () 
{
  const pacemakerGraphic = document.getElementsByClassName("pacemakerGraphic")[0]
  let currentPacemakerHeight = pacemakerGraphic.offsetHeight // add padding into calculation?
  
  const fontSizeToPacemakerHeightRatioMainScreen = 0.02168
  let mainScreen = document.getElementsByClassName("mainScreen");

  const fontSizeToPacemakerHeightRatioModeScreen = 0.02627
  let modeScreen = document.getElementsByClassName("modeScreen");

  const fontSizeToPacemakerHeightRatioNumMeter = 0.07005
  let numMeter = document.getElementsByClassName("numMeter");

  for(var i = 0; i < mainScreen.length; i++)
  {
      let mainScreenElement = mainScreen.item(i)
      let newfont = (currentPacemakerHeight*fontSizeToPacemakerHeightRatioMainScreen).toFixed(1) + 'px'
      mainScreenElement.style.fontSize = newfont
      let temp =0
  }



  for(var i = 0; i < modeScreen.length; i++)
  {
      let element = modeScreen.item(i)
      let newfont = (currentPacemakerHeight*fontSizeToPacemakerHeightRatioModeScreen).toFixed(1) + 'px'
      element.style.fontSize = newfont
      let temp =0
  }

  for(var i = 0; i < numMeter.length; i++)
  {
      let element = numMeter.item(i)
      let newfont = (currentPacemakerHeight*fontSizeToPacemakerHeightRatioNumMeter).toFixed(1) + 'px'
      element.style.fontSize = newfont
      let temp =0
  }


  const fontSizeToPacemakerHeightRatioRightLabel = 0.07005
  let rightLabel = document.getElementsByClassName("rightLabel");

  for(var i = 0; i < rightLabel.length; i++)
  {
      let element = rightLabel.item(i)
      let newfont = (currentPacemakerHeight*fontSizeToPacemakerHeightRatioRightLabel).toFixed(1) + 'px'
      element.style.fontSize = newfont
      let temp =0
  }


 // rightLabel

}
*/

function adjustPacemakerGraphic() {
  // Get the current width and height of the window
  const windowWidth = window.innerWidth;
  const windowHeight = window.innerHeight;

  // Get the element to adjust
  const pacemakerGraphic = document.querySelector('.pacemakerGraphic');

  // Calculate the aspect ratio of the element
  const aspectRatio = pacemakerGraphic.offsetWidth / pacemakerGraphic.offsetHeight;

  // If the aspect ratio is less than 3:7, adjust the element to achieve a 3:7 aspect ratio
  if (aspectRatio < 3 / 7) {
    // Calculate the new width and height of the element
    let newWidth = windowHeight * 3 / 7;
    let newHeight = windowHeight;

    // If the new width is greater than the window width, adjust the width and height again
    if (newWidth > windowWidth) {
      newWidth = windowWidth;
      newHeight = windowWidth * 7 / 3;
    }

    // Set the width and height of the element
    pacemakerGraphic.style.width = newWidth + 'px';
    pacemakerGraphic.style.height = newHeight + 'px';
  }
}

// Call the function when the window is resized
//window.addEventListener('resize', adjustPacemakerGraphic);


function rescaleFonts () 
{
  const pacemakerGraphic = document.getElementsByClassName("pacemakerGraphic")[0]
  let currentPacemakerHeight = pacemakerGraphic.offsetHeight // add padding into calculation?
  let ratio = 0.022767
  let newfont = (currentPacemakerHeight*ratio).toFixed(1) + 'px'
  pacemakerGraphic.style.fontSize = newfont
  let temp =0

  knob._width = knobElem.offsetWidth
  knob._height = knobElem.offsetHeight
  knob.redraw()
  

  knob2._width = knobElem2.offsetWidth
  knob2._height = knobElem2.offsetHeight
  knob2.redraw()

  knob3._width = knobElem3.offsetWidth
  knob3._height = knobElem3.offsetHeight
  knob3.redraw()
adjustPacemakerGraphic()
}

new ResizeObserver(rescaleFonts).observe(document.getElementById('pacemakerGraphic'))
let keyDown = false;

document.onkeydown = function (e) {
  e = e || window.event;


  if (e.key == 'ArrowUp')
  {
    upArrowClick()
  }
  if (e.key == 'ArrowDown')
  {
    downArrowClick()
  }
  if (e.key == 'Enter')
  {
    if (keyDown == false)
    {
    enterClick()
    }
  }

  if (e.key == 'ArrowLeft' || e.key == 'ArrowRight')
  {
    arrowClick(e)
  }
};

function arrowClick(event)
{
  let currentlySelectedRow = getSelectedRow()
  let aSenseRow = document.getElementById("AsenseRow")
  let vSenseRow = document.getElementById("VsenseRow")
  let AVIrow = document.getElementById("AVIrow")
  let PVARProw = document.getElementById("PVARProw")
  let URLrow = document.getElementById("URLrow")

  let bottomKnobImg = document.getElementById('bottomKnobImg')
  getBottomDialParameters()

  knobAngleToResult(event,bottomKnobImg)

}
let wasDragged=true
function drawCaliper(clickEvent)
{
  
  let clickTarget = document.getElementById('caliperCanvas')
  clickTarget.rect = clickTarget.getBoundingClientRect()
  // [clickTarget.knobRect.left + (clickTarget.knobRect.width / 2), clickTarget.knobRect.top + (clickTarget.knobRect.height / 2)]


  
  let fromX = clickEvent.pageX - clickTarget.rect.left 
  let fromY = clickEvent.pageY - clickTarget.rect.top

  let startingY = fromY
  let startingX = fromX

  caliperCtx.strokeStyle = "#a1a2ff";
  caliperCtx.lineWidth = 2;

  caliperCtx.font = "18px Arial";
  caliperCtx.fillStyle = "#a1a2ff";
  caliperCtx.textAlign = "center";

  if (wasDragged == false)
  {
    clearCaliper()
  }
  else
  {
  wasDragged = false

  // draw starting vertical boundary
  clearCaliper()
  caliperCtx.beginPath()
  clearCaliper()
  drawVerticalLine(startingX)
  }
  
  function clearCaliper()
  {
    caliperCtx.clearRect(0,0,caliperCanvas.width,caliperCanvas.height)
    caliperCtx.beginPath()
  }

  function drawVerticalLine(posX)
  {
    caliperCtx.moveTo(posX,0)
    caliperCtx.lineTo(posX,clickTarget.rect.bottom)
    caliperCtx.stroke();
  }

  function mousemove(dragEvent)
  {
    wasDragged=true
    clearCaliper()
    drawVerticalLine(startingX)
    toX = dragEvent.pageX - clickTarget.rect.left 
    toY = dragEvent.pageY - clickTarget.rect.top 
    caliperCtx.moveTo(startingX,toY)
    caliperCtx.lineTo(toX,toY)
    caliperCtx.stroke()
    drawVerticalLine(toX)

    // draw label   
    let pixels = Math.abs(toX-startingX)  // # of pixels between the markers
    let ms = Math.abs(((pixels/dataHertz)/speed)*1000)
    let bpm = Math.abs(1/(ms/60000))

    let label1 = ''
    let label2

    labelMode = 'ms/bpm'    // pixels, ms, bpm
    
    if (labelMode == 'pixels') {label1 = pixels.toFixed(0) + " px"}
    if (labelMode == 'ms') {label1 = ms.toFixed(0) + " ms"}
    if (labelMode == 'bpm') {label1 = bpm.toFixed(0) + " bpm"}
    if (labelMode == 'ms/bpm') 
    {
      label1 = ms.toFixed(0) + " ms"
      label2 = bpm.toFixed(0) + " bpm"
    }


    caliperCtx.fillText(label1, startingX+(toX-startingX)/2,(toY-10))
    if (label2!=undefined)
    {
    caliperCtx.fillText(label2, startingX+(toX-startingX)/2,(toY+20))
    }

    fromX=toX
    fromY=toY
  }

  function endClick(touchevent)
  {
    document.getElementById('caliperCanvas').removeEventListener('mousemove',mousemove)
    document.getElementById('caliperCanvas').removeEventListener('mouseup',endClick)
  }

  document.getElementById('caliperCanvas').addEventListener('mousemove',mousemove)
  document.getElementById('caliperCanvas').addEventListener('mouseup',endClick)
  
}

document.getElementById('caliperCanvas').addEventListener('mousedown',drawCaliper)