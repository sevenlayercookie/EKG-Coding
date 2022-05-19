function onload()
{
var canvas = document.getElementById('demo');
var ctx = canvas.getContext('2d'),
    w = demo.width,
    h = demo.height,
    l = 0,
    sec = 0,
    avgRefresh = 1,
    dataHertz=500, // in Hz (data points per second)
    animatefps=30,
    animateRatio=dataHertz/animatefps,
    dataVoltage=10, // in mV
    compressHfactor = 1,
    heartrate = 60,
    HRmode = 0,
    verticalPositionFactor = 100,
    flatline=0,
    px = 0, opx = 0, 
    speed = 1, // speed of the cursor across the screen; affects spacing of data
    processSpeed = 2 //skips data points to "speed" the drawing; less resolution
    py = h * 1,
    opy = py,
    scanBarWidth = 40,
		PVCflag = 0;
    k=0;
ctx.strokeStyle = '#00bd00';
ctx.lineWidth = 3;

// framelimiter code
var fpsInterval, startTime, now, then, elapsed;

// initialize the timer variables and start the animation



var data = [-0.04,-0.045,-0.045,-0.05,-0.05,-0.055,-0.06,-0.06,-0.065,-0.065,-0.065,-0.07,-0.07,-0.075,-0.08,-0.08,-0.085,-0.085,-0.085,-0.085,-0.08,-0.08,-0.07,-0.07,-0.065,-0.06,-0.065,-0.065,-0.07,-0.075,-0.08,-0.08,-0.08,-0.08,-0.075,-0.065,-0.06,-0.055,-0.05,-0.045,-0.04,-0.04,-0.045,-0.045,-0.045,-0.045,-0.05,-0.05,-0.05,-0.05,-0.055,-0.055,-0.055,-0.05,-0.05,-0.045,-0.04,-0.03,-0.025,-0.025,-0.02,-0.015,-0.015,-0.015,-0.015,-0.015,-0.01,-0.01,-0.01,-0.01,-0.015,-0.015,-0.02,-0.03,-0.035,-0.04,-0.045,-0.05,-0.055,-0.055,-0.055,-0.06,-0.06,-0.065,-0.065,-0.07,-0.07,-0.07,-0.07,-0.065,-0.065,-0.065,-0.06,-0.065,-0.065,-0.07,-0.075,-0.08,-0.085,-0.09,-0.09,-0.095,-0.095,-0.095,-0.095,-0.095,-0.095,-0.095,-0.095,-0.09,-0.09,-0.085,-0.085,-0.08,-0.08,-0.08,-0.08,-0.08,-0.085,-0.09,-0.1,-0.105,-0.11,-0.115,-0.115,-0.105,-0.09,-0.06,-0.025,0.03,0.1,0.18,0.27,0.365,0.455,0.54,0.61,0.65,0.665,0.645,0.59,0.51,0.405,0.29,0.17,0.06,-0.035,-0.105,-0.155,-0.175,-0.175,-0.165,-0.14,-0.115,-0.09,-0.07,-0.06,-0.05,-0.05,-0.05,-0.05,-0.055,-0.055,-0.06,-0.06,-0.06,-0.06,-0.055,-0.055,-0.05,-0.05,-0.045,-0.04,-0.035,-0.03,-0.025,-0.025,-0.025,-0.025,-0.025,-0.03,-0.03,-0.03,-0.03,-0.03,-0.03,-0.03,-0.03,-0.03,-0.03,-0.03,-0.03,-0.03,-0.03,-0.025,-0.015,-0.01,-0.005,0.005,0.005,0.01,0.005,0,-0.005,-0.005,-0.01,-0.005,0,0.005,0.015,0.03,0.04,0.045,0.05,0.05,0.05,0.05,0.05,0.05,0.05,0.055,0.055,0.065,0.07,0.075,0.08,0.08,0.085,0.09,0.095,0.105,0.115,0.125,0.135,0.145,0.155,0.165,0.17,0.175,0.175,0.18,0.185,0.19,0.195,0.2,0.21,0.215,0.22,0.225,0.225,0.23,0.23,0.23,0.23,0.23,0.23,0.23,0.225,0.22,0.215,0.205,0.19,0.18,0.165,0.155,0.14,0.13,0.115,0.105,0.095,0.085,0.075,0.07,0.06,0.055,0.05,0.045,0.035,0.03,0.02,0.015,0.005,0,-0.01,-0.015,-0.02,-0.025,-0.03,-0.03,-0.035,-0.04,-0.04,-0.04,-0.045,-0.045,-0.045,-0.045,-0.05,-0.05,-0.055,-0.055,-0.06,-0.06,-0.06,-0.06,-0.055,-0.055,-0.05,-0.05,-0.045,-0.05,-0.05,-0.055,-0.06,-0.06,-0.065,-0.065,-0.065,-0.06,-0.055,-0.05,-0.045,-0.04,-0.035,-0.035,-0.03,-0.035,-0.035,-0.035,-0.035,-0.04,-0.04,-0.045,-0.045,-0.05,-0.05,-0.05,-0.05,-0.045,-0.045,-0.04,-0.035,-0.035,-0.035,-0.035,-0.04,-0.045,-0.05,-0.055,-0.06,-0.06,-0.055,-0.05,-0.045,-0.035,-0.025,-0.02,-0.015,-0.015,-0.02,-0.025,-0.03,-0.035,-0.045,-0.05,-0.055,-0.055,-0.055,-0.055,-0.055,-0.055,-0.055,-0.05,-0.05,-0.045,-0.045,-0.045,-0.05,-0.05,-0.055,-0.06,-0.065,-0.07,-0.07,-0.07,-0.065,-0.065,-0.06,-0.055,-0.055,-0.055,-0.06,-0.06,-0.065,-0.07,-0.07,-0.075,-0.075,-0.075,-0.075,-0.075,-0.075,-0.075,-0.075,-0.075,-0.075,-0.07,-0.07,-0.07,-0.065,-0.065,-0.065,-0.07,-0.07,-0.07,-0.065,-0.065,-0.06,-0.05,-0.045,-0.04,-0.035,-0.035,-0.035,-0.035,-0.04,-0.045,-0.05,-0.055,-0.055,-0.05,-0.05,-0.045,-0.04,-0.035,-0.03,-0.02,-0.015,-0.01,-0.005,0,0.005,0.005,0.005,0,-0.005,-0.015,-0.03,-0.04,-0.045,-0.055,-0.06,-0.06,-0.06,-0.06,-0.06,-0.06,-0.065,-0.07,-0.075,-0.08,-0.085,-0.09,-0.09,-0.09,-0.09,-0.085,-0.085,-0.085,-0.085,-0.085,-0.085,-0.085,-0.085,-0.085,-0.085,-0.09,-0.09,-0.09,-0.095,-0.095,-0.09,-0.09,-0.09,-0.085,-0.085,-0.085,-0.085,-0.085,-0.09,-0.095,-0.095,-0.1,-0.1,-0.105,-0.11,-0.115,-0.12,-0.125,-0.13,-0.125,-0.105,-0.08,-0.03,0.03,0.11,0.2,0.3,0.395,0.49,0.57,0.63,0.66,0.66,0.63,0.565,0.48,0.37,0.25,0.135,0.025,-0.07,-0.135,-0.18,-0.195,-0.19,-0.17,-0.14,-0.105,-0.08,-0.06,-0.045,-0.045,-0.05,-0.055,-0.065,-0.07,-0.075,-0.075,-0.07,-0.065,-0.06,-0.055,-0.05,-0.05,-0.05,-0.05,-0.05,-0.05,-0.05,-0.05,-0.05,-0.045,-0.045,-0.045,-0.04,-0.04,-0.04,-0.035,-0.035,-0.03,-0.03,-0.025,-0.02,-0.02,-0.015,-0.015,-0.015,-0.015,-0.02,-0.02,-0.025,-0.025,-0.025,-0.025,-0.025,-0.02,-0.015,-0.015,-0.01,-0.005,-0.005,0,0,0.005,0.005,0.01,0.01,0.015,0.02,0.025,0.035,0.04,0.045,0.055,0.06,0.065,0.07,0.07,0.075,0.075,0.08,0.08,0.085,0.09,0.1,0.105,0.115,0.125,0.135,0.145,0.155,0.165,0.175,0.18,0.19,0.19,0.195,0.195,0.2,0.2,0.205,0.21,0.215,0.22,0.225,0.225,0.225,0.22,0.215,0.205,0.2,0.19,0.185,0.18,0.175,0.17,0.165,0.155,0.15,0.135,0.12,0.1,0.08,0.065,0.05,0.04,0.03,0.025,0.025,0.025,0.025,0.025,0.02,0.01,0,-0.01,-0.025,-0.035,-0.045,-0.055,-0.065,-0.07,-0.07,-0.075,-0.075,-0.075,-0.075,-0.08,-0.08,-0.08,-0.085,-0.085,-0.08,-0.08,-0.075,-0.07,-0.065,-0.06,-0.055,-0.055,-0.055,-0.055,-0.06,-0.065,-0.065,-0.07,-0.07,-0.07,-0.07,-0.065,-0.06,-0.055,-0.05,-0.05,-0.045,-0.05,-0.05,-0.055,-0.06,-0.06,-0.06,-0.06,-0.06,-0.055,-0.05,-0.045,-0.045,-0.04,-0.035,-0.035,-0.03,-0.03,-0.03,-0.025,-0.025,-0.025,-0.025,-0.03,-0.03,-0.035,-0.035,-0.04,-0.04,-0.04,-0.045,-0.045,-0.045,-0.045,-0.045,-0.045,-0.045,-0.045,-0.045,-0.045,-0.045,-0.045,-0.05,-0.05,-0.05,-0.055,-0.055,-0.055,-0.055,-0.055,-0.055,-0.055,-0.05,-0.05,-0.05,-0.05,-0.055,-0.055,-0.065,-0.07,-0.075,-0.08,-0.08,-0.08,-0.075,-0.07,-0.06,-0.055,-0.045,-0.04,-0.035,-0.03,-0.03,-0.03,-0.035,-0.035,-0.04,-0.045,-0.055,-0.06,-0.065,-0.065,-0.065,-0.065,-0.065,-0.06,-0.055,-0.055,-0.055,-0.055,-0.055,-0.06,-0.065,-0.07,-0.07,-0.07,-0.07,-0.065,-0.065,-0.06,-0.055,-0.055,-0.055,-0.05,-0.05,-0.05,-0.045,-0.045,-0.04,-0.035,-0.03,-0.03,-0.03,-0.03,-0.035,-0.04,-0.045,-0.05,-0.055,-0.055,-0.055,-0.05,-0.045,-0.035,-0.025,-0.02,-0.015,-0.01,-0.01,-0.005,-0.005,-0.005,-0.005,-0.005,-0.005,-0.005,-0.01,-0.015,-0.025,-0.03,-0.04,-0.045,-0.05,-0.055,-0.055,-0.055,-0.055,-0.055,-0.055,-0.06,-0.065,-0.07,-0.075,-0.08,-0.08,-0.08,-0.08,-0.08,-0.075,-0.075,-0.075,-0.075,-0.08,-0.085,-0.085,-0.09,-0.09,-0.085,-0.085,-0.08,-0.075,-0.075,-0.075,-0.075,-0.08,-0.085,-0.09,-0.095,-0.095,-0.095,-0.09,-0.09,-0.085,-0.085,-0.09,-0.095,-0.1,-0.105,-0.1,-0.09,-0.06,-0.02,0.035,0.1,0.18,0.26,0.35,0.435,0.51,0.575,0.625,0.655,0.655,0.63,0.57,0.49,0.385,0.27,0.15,0.04,-0.045,-0.11,-0.145,-0.15,-0.135,-0.1,-0.065,-0.035,-0.01,0,-0.005,-0.015,-0.03,-0.045,-0.05,-0.055,-0.055,-0.045,-0.04,-0.035,-0.03,-0.03,-0.035,-0.04,-0.045,-0.045,-0.045,-0.045,-0.04,-0.04,-0.035,-0.035,-0.035,-0.03,-0.03,-0.03,-0.025,-0.02,-0.02,-0.015,-0.015,-0.015,-0.015,-0.02,-0.025,-0.025,-0.025,-0.025,-0.02,-0.015,-0.01,0,0.005,0.01,0.015,0.02,0.02,0.025,0.025,0.025,0.025,0.025,0.025,0.025,0.02,0.02,0.025,0.025,0.03,0.04,0.045,0.055,0.06,0.065,0.07,0.075,0.075,0.08,0.085,0.09,0.095,0.105,0.11,0.12,0.125,0.13,0.14,0.145,0.15,0.155,0.165,0.17,0.18,0.19,0.2,0.205,0.21,0.215,0.215,0.22,0.22,0.22,0.22,0.22,0.22,0.22,0.22,0.22,0.215,0.215,0.21,0.205,0.2,0.19,0.185,0.175,0.17,0.16,0.15,0.14,0.125,0.115,0.105,0.095,0.08,0.07,0.06,0.05,0.04,0.03,0.025,0.02,0.015,0.01,0.005,0.005,0,-0.01,-0.015,-0.025,-0.035,-0.04,-0.05,-0.055,-0.055,-0.055,-0.055,-0.055,-0.055,-0.055,-0.055,-0.055,-0.055,-0.055,-0.06,-0.06,-0.065,-0.065,-0.07,-0.07,-0.075,-0.075,-0.075,-0.075,-0.075,-0.07,-0.07,-0.07,-0.07,-0.07,-0.07,-0.075,-0.075,-0.08,-0.08,-0.08,-0.08,-0.08,-0.075,-0.075,-0.07,-0.065,-0.065,-0.065,-0.065,-0.065,-0.065,-0.065,-0.065,-0.065,-0.065,-0.06,-0.06,-0.055,-0.055,-0.055,-0.06,-0.06,-0.06,-0.06,-0.06,-0.06,-0.06,-0.06,-0.06,-0.06,-0.065,-0.065,-0.07,-0.07,-0.07,-0.07,-0.07,-0.065,-0.06,-0.055,-0.05,-0.05,-0.045,-0.05,-0.05,-0.055,-0.055,-0.06,-0.06,-0.065,-0.065,-0.07,-0.07,-0.075,-0.075,-0.075,-0.08,-0.075,-0.075,-0.07,-0.07,-0.065,-0.06,-0.06,-0.06,-0.06,-0.06,-0.06,-0.06,-0.06,-0.06,-0.055,-0.055,-0.05,-0.055,-0.055,-0.06,-0.065,-0.07,-0.08,-0.08,-0.085,-0.085,-0.085,-0.08,-0.075,-0.075,-0.07,-0.07,-0.07,-0.07,-0.075,-0.075,-0.075,-0.075,-0.075,-0.07,-0.07,-0.065,-0.06,-0.055,-0.05,-0.05,-0.045,-0.045,-0.045,-0.045,-0.04,-0.04,-0.035,-0.03,-0.025,-0.02,-0.02,-0.02,-0.02,-0.02,-0.02,-0.025,-0.02,-0.02,-0.015,-0.01,0,0.005,0.005,0.005,-0.005,-0.015,-0.025,-0.04,-0.055,-0.065,-0.075,-0.08,-0.08,-0.08,-0.075,-0.07,-0.065,-0.06,-0.06,-0.065,-0.07,-0.075,-0.085,-0.09,-0.095,-0.1,-0.1,-0.1,-0.095,-0.09,-0.09,-0.085,-0.085,-0.085,-0.09,-0.095,-0.1,-0.105,-0.105,-0.105,-0.105,-0.1,-0.09,-0.085,-0.08,-0.08,-0.08,-0.085,-0.09,-0.1,-0.11,-0.115,-0.12,-0.125,-0.12,-0.115,-0.105,-0.085,-0.055,-0.02,0.035,0.1,0.175,0.265,0.36,0.455,0.545,0.615,0.665,0.685,0.67,0.625,0.545,0.445,0.335,0.215,0.1,0.005,-0.07,-0.12,-0.145,-0.15,-0.135,-0.115,-0.09,-0.07,-0.05,-0.04,-0.04,-0.04,-0.04,-0.045,-0.05,-0.05,-0.05,-0.05,-0.045,-0.045,-0.045,-0.045,-0.045,-0.045,-0.045,-0.04,-0.04,-0.035,-0.035,-0.035,-0.035,-0.035,-0.035,-0.035,-0.035,-0.04,-0.035,-0.035,-0.035,-0.03,-0.025,-0.025,-0.02,-0.02,-0.02,-0.025,-0.025,-0.025,-0.025,-0.02,-0.02,-0.015,-0.015,-0.01,-0.005,-0.005,0,0.005,0.01,0.01,0.015,0.015,0.02,0.02,0.02,-0.04,-0.04,-0.04,-0.04,-0.04,-0.04,-0.04,-0.04,-0.04,-0.04,-0.04,-0.04,-0.04,-0.04,-0.04,-0.04,-0.04,-0.04,-0.04,-0.04,-0.04,-0.04,-0.04,-0.04,-0.04,-0.04,-0.04,-0.04,-0.04,-0.04,-0.04,-0.04,-0.04,-0.04,-0.04,-0.04,-0.04,-0.04,-0.04,-0.04,-0.04,-0.04,-0.04,-0.04,-0.04,-0.04,-0.04,-0.04,-0.04,-0.04,-0.04,-0.04,-0.04,-0.04,-0.04,-0.04,-0.04,-0.04,-0.04,-0.04,-0.04,-0.04,-0.04,-0.04,-0.04,-0.04,-0.04,-0.04,-0.04,-0.04,-0.04,-0.04,-0.04,-0.04,-0.04,-0.04,-0.04,-0.04,-0.04,-0.04,-0.04,-0.04,-0.04,-0.04,-0.04,-0.04,-0.04,-0.04,-0.04,-0.04,-0.04,-0.04,-0.04,-0.04,-0.04,-0.04,-0.04,-0.04,-0.04,-0.04,-0.04,-0.04,-0.04,-0.04,-0.04,-0.04,-0.04,-0.04,-0.04,-0.04,-0.04,-0.04,-0.04,-0.04,-0.04,-0.04,-0.04,-0.04,-0.04,-0.04,-0.04,-0.04,-0.04,-0.04,-0.04,-0.04,-0.04,-0.04]

var Pwave = [-0.04,-0.045,-0.045,-0.05,-0.05,-0.055,-0.06,-0.06,-0.065,-0.065,-0.065,-0.07,-0.07,-0.075,-0.08,-0.08,-0.085,-0.085,-0.085,-0.085,-0.08,-0.08,-0.07,-0.07,-0.065,-0.06,-0.065,-0.065,-0.07,-0.075,-0.08,-0.08,-0.08,-0.08,-0.075,-0.065,-0.06,-0.055,-0.05,-0.045,-0.04,-0.04,-0.045,-0.045,-0.045,-0.045,-0.05,-0.05,-0.05,-0.05,-0.055,-0.055,-0.055,-0.05,-0.05,-0.045,-0.04,-0.03,-0.025,-0.025,-0.02,-0.015,-0.015,-0.015,-0.015,-0.015,-0.01,-0.01,-0.01,-0.01,-0.015,-0.015,-0.02,-0.03,-0.035,-0.04,-0.045,-0.05,-0.055,-0.055,-0.055,-0.06,-0.06,-0.065,-0.065,-0.07,-0.07,-0.07,-0.07,-0.065,-0.065,-0.065,-0.06,-0.065,-0.065,-0.07,-0.075,-0.08,-0.085,-0.09,-0.09,-0.095,-0.095,-0.095,-0.095,-0.095,-0.095,-0.095,-0.095,-0.09,-0.09,-0.085,-0.085,-0.08,-0.08,-0.08,-0.08,-0.08,-0.085,-0.09,-0.1,-0.105,-0.11,-0.115,-0.115,-0.105,-0.09,-0.06,-0.025];

var QRS = [-0.085,-0.09,-0.1,-0.105,-0.11,-0.115,-0.115,-0.105,-0.09,-0.06,-0.025,0.03,0.1,0.18,0.27,0.365,0.455,0.54,0.61,0.65,0.665,0.645,0.59,0.51,0.405,0.29,0.17,0.06,-0.035,-0.105,-0.155,-0.175,-0.175,-0.165,-0.14,-0.115,-0.09,-0.07,-0.06,-0.05];
var p=0;
var i=0;
var j=0;    

function randomPYval(){
    
  py = -(parseInt(data[i]*1000))/8+verticalPositionFactor;
  j++;
  i++;
  // i=i+parseInt(animateRatio)-1;
  if(i>=data.length)
    i=0;
}

function startAnimating() {
    fpsInterval = 1000 / animatefps;
    then = Date.now();
    startTime = then;
    loop();
}

setInterval(updateHertz, 1000);
startAnimating();

var lold=0;
function updateHertz() {

sec++;
avgRefresh = document.getElementById('demoTEXT').innerText = (l-lold);
lold=l;
}

function loop() {
 // request another frame
    requestAnimationFrame(loop);
    
  l++; //count # of times through loop
  if (HRmode == 0)
  {
      
    if (p==0)
    {
      ctx.beginPath();
    }
    p++;
  	randomPYval();
    px += speed; // horizontal pixels per data point
    
    
    ctx.moveTo(opx, opy);
    ctx.lineTo(px, py);

    // calc elapsed time since last loop
    now = Date.now();
    elapsed = now - then;
    // if enough time has elapsed, draw the next frame
    if (elapsed > fpsInterval) 
    {
        // Get ready for next frame by setting then=now, but also adjust for your
        // specified fpsInterval not being a multiple of RAF's interval (16.7ms)
        then = now - (elapsed % fpsInterval);
        drawit();
        document.getElementById('demoTEXT3').innerText
        1/elapsed;
    }
    opx = px;
    opy = py;

    if (opx > w) {
        px = opx = 0; //-speed;
    }
    //document.getElementById('demoTEXT').innerText = PVCflag;
    document.getElementById('demoTEXT2').innerText = i;
  }
}

function drawit()
{
  
  ctx.clearRect(px,0, scanBarWidth, h);
  ctx.stroke();
  p=0;

}


document.getElementById("demoTEXT").onkeydown = function() {
i=0;
PVCflag = 1;
}

document.onkeydown = function(){
i=0;
PVCflag = 1;
}
}

