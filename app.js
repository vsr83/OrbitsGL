"use strict";

var gl = null;
var earthShaders = null;
var lineShaders = null;
var a = 6378.1370;
var b = 6356.75231414;

var distance = 5.0 * a;

function degToRad(d) 
{
    return d * Math.PI / 180;
}

createControls();

// Delta time (ms) from configuration of date and time.
var dateDelta = 0;

var fieldOfViewRadians = degToRad(30);
var rotX = degToRad(90);
var rotY = degToRad(0);
var rotZ = degToRad(0);
var xStart = 0;
var yStart = 0;

var dragX = 0;
var dragY = 0;
var dragXStart = 0;
var dragYStart = 0;

var drawing = false;

// Get the starting time.
var then = 0;

// Get A WebGL context
/** @type {HTMLCanvasElement} */
var canvas = document.querySelector("#canvas");

canvas.addEventListener("mousedown", function(e) {
    xStart = e.clientX;
    yStart = e.clientY;
    dragXStart = dragX;
    dragYStart = dragY;

    console.log("xStart " + xStart);

    canvas.onmousemove = function(m) {
        //console.log(m);
        dragX = dragXStart - (m.clientX - xStart) / 100.0;
        dragY = dragYStart - (m.clientY - yStart) / 100.0;

        rotZ = dragX;
        rotX = 90 - dragY;
    }
});

canvas.addEventListener("mouseup", function(e) {
    canvas.onmousemove = null;
});

canvas.addEventListener("mouseleave", function(e) {
    canvas.onmousemove = null;
});

document.addEventListener("wheel", function(e) {
    distance *= (e.deltaY * 0.0001 + 1);
});

gl = canvas.getContext("webgl2");
if (!gl) 
{
    console.log("Failed to initialize GL.");
}
earthShaders = new PlanetShaders(gl, 50, 50, a, b);
earthShaders.init("textures/8k_earth_daymap.jpg", "textures/8k_earth_nightmap.jpg");

lineShaders = new LineShaders(gl);
lineShaders.init();

requestAnimationFrame(drawScene);
/**
 * Request frame if no drawing is on-going.
 */
 function requestFrame() 
 {
     // If drawing is on-going, skip. This is an attempt to avoid the situation, where 
     // drawing requests accumulate faster than can be processed due to UI callbacks.
     /*if (drawing)
     {
         return;
     }
 
     drawing = true;
     requestAnimationFrame(drawScene);*/
 }
 

// Draw the scene.
function drawScene(time) 
{
    ISS.osv = ISS.osvIn;

    canvas.width = document.documentElement.clientWidth;
    canvas.height = document.documentElement.clientHeight;

    gl.useProgram(earthShaders.program);

    // Compute Julian time.
    let dateNow = new Date();
    let today = null;

    if (guiControls.timeWarp)
    {
        dateDelta += timeControls.warpSeconds.getValue() * 1000;
        //console.log(dateDelta);
    }

    // If date and time updates are disabled, set date manually from the GUI controls:
    if (!guiControls.enableClock)
    {
        dateNow = new Date(guiControls.dateYear, parseInt(guiControls.dateMonth)-1, guiControls.dateDay, 
            guiControls.timeHour, guiControls.timeMinute, guiControls.timeSecond);

        // Value of dateNow is set from controls above.
        today = new Date(dateNow.getTime()
        + 24 * 3600 * 1000 * guiControls.deltaDays
        + 3600 * 1000 * guiControls.deltaHours
        + 60 * 1000 * guiControls.deltaMins
        + 1000 * guiControls.deltaSecs);
    }
    else
    {
        today = new Date(dateNow.getTime()
        + 24 * 3600 * 1000 * guiControls.deltaDays
        + 3600 * 1000 * guiControls.deltaHours
        + 60 * 1000 * guiControls.deltaMins
        + 1000 * guiControls.deltaSecs
        + dateDelta);
    }

    // Use latest telemetry only if enabled. Then, the telemetry set from the UI controls is not
    // overwritten below.
    if (guiControls.enableTelemetry)
    {
        ISS.osv = ISS.osvIn;

        //osvControls.osvYear.setValue(dateNow.getFullYear());
        osvControls.osvMonth.setValue(ISS.osv.ts.getMonth() + 1);
        osvControls.osvDay.setValue(ISS.osv.ts.getDate());
        osvControls.osvHour.setValue(ISS.osv.ts.getHours());
        osvControls.osvMinute.setValue(ISS.osv.ts.getMinutes());
        osvControls.osvSecond.setValue(ISS.osv.ts.getSeconds());
        osvControls.osvX.setValue(ISS.osv.r[0] * 0.001);
        osvControls.osvY.setValue(ISS.osv.r[1] * 0.001);
        osvControls.osvZ.setValue(ISS.osv.r[2] * 0.001);
        osvControls.osvVx.setValue(ISS.osv.v[0]);
        osvControls.osvVy.setValue(ISS.osv.v[1]);
        osvControls.osvVz.setValue(ISS.osv.v[2]);
    }
    else if (guiControls.enableOEM)
    {
        const osvOem = getClosestOEMOsv(today);
        ISS.osv = osvOem;

        osvControls.osvMonth.setValue(ISS.osv.ts.getMonth() + 1);
        osvControls.osvDay.setValue(ISS.osv.ts.getDate());
        osvControls.osvHour.setValue(ISS.osv.ts.getHours());
        osvControls.osvMinute.setValue(ISS.osv.ts.getMinutes());
        osvControls.osvSecond.setValue(ISS.osv.ts.getSeconds());
        osvControls.osvX.setValue(ISS.osv.r[0] * 0.001);
        osvControls.osvY.setValue(ISS.osv.r[1] * 0.001);
        osvControls.osvZ.setValue(ISS.osv.r[2] * 0.001);
        osvControls.osvVx.setValue(ISS.osv.v[0]);
        osvControls.osvVy.setValue(ISS.osv.v[1]);
        osvControls.osvVz.setValue(ISS.osv.v[2]);
    }
    else
    {
        // Set telemetry from UI controls.
        ISS.osv = {r: [
            osvControls.osvX.getValue() * 1000.0, 
            osvControls.osvY.getValue() * 1000.0, 
            osvControls.osvZ.getValue() * 1000.0], 
                   v: [
            osvControls.osvVx.getValue(), 
            osvControls.osvVy.getValue(), 
            osvControls.osvVz.getValue()], 
                ts: new Date(osvControls.osvYear.getValue(), 
                    parseInt(osvControls.osvMonth.getValue())-1, 
                    osvControls.osvDay.getValue(), 
                    osvControls.osvHour.getValue(), 
                    osvControls.osvMinute.getValue(), 
                    osvControls.osvSecond.getValue())
                };
    }

    const julianTimes = TimeConversions.computeJulianTime(today);
    const JD = julianTimes.JD;
    const JT = julianTimes.JT;
    const JDref = Math.ceil(TimeConversions.computeJulianDay(2000, 1, 1));

    // Compute equitorial coordinates of the Sun.
    const sunAltitude = new SunAltitude();
    const eqCoordsSun = sunAltitude.computeEquitorial(JT, JD);
    const rASun = eqCoordsSun.rA;
    const declSun = -eqCoordsSun.decl;

    // Compute equitorial coordinates of the Moon.
    const moonAltitude = new MoonAltitude();
    const eqCoordsMoon = moonAltitude.computeEquitorial(JT);
    const rAMoon = eqCoordsMoon.rA;
    const declMoon = eqCoordsMoon.decl;

    // Compute sidereal time perform modulo to avoid floating point accuracy issues with 32-bit
    // floats in the shader:
    const LST = MathUtils.deg2Rad(TimeConversions.computeSiderealTime(0, JD, JT)) % 360.0;

    ISS.kepler = Kepler.osvToKepler(ISS.osv.r, ISS.osv.v, ISS.osv.ts);
    ISS.osvProp = Kepler.propagate(ISS.kepler, today);
    let kepler_updated = Kepler.osvToKepler(ISS.osvProp.r, ISS.osvProp.v, ISS.osvProp.ts);
    let osv_ECEF = Frames.osvJ2000ToECEF(ISS.osvProp);
    ISS.r_ECEF = osv_ECEF.r;
    ISS.v_ECEF = osv_ECEF.v;
    let wgs84 = Coordinates.cartToWgs84(ISS.r_ECEF);

    ISS.alt = wgs84.h; 
    ISS.lon = wgs84.lon;
    ISS.lat = wgs84.lat;
    const alt = MathUtils.norm(ISS.r_ECEF);
    let lonlat = sunAltitude.computeSunLonLat(rASun, declSun, JD, JT);
    let lonlatMoon = sunAltitude.computeSunLonLat(rAMoon, declMoon, JD, JT);

    updateCaptions(rASun, declSun, lonlat, rAMoon, declMoon, lonlatMoon, today, JT);

    ISS.x = -alt * 0.001 * MathUtils.cosd(ISS.lat) * MathUtils.cosd(ISS.lon);
    ISS.y =  alt * 0.001 * MathUtils.cosd(ISS.lat) * MathUtils.sind(ISS.lon);
    ISS.z = -alt * 0.001 * MathUtils.sind(ISS.lat);

    // Clear the canvas
    gl.clearColor(0, 0, 0, 255);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // convert to seconds
    time *= 0.001;
    // Subtract the previous time from the current time
    var deltaTime = time - then;
    // Remember the current time for the next frame.
    then = time;

    resizeCanvasToDisplaySize(gl.canvas);

    // Tell WebGL how to convert from clip space to pixels
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);

    // Compute the matrix
    fieldOfViewRadians = MathUtils.deg2Rad(guiControls.fov);
    var aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
    var zNear = (distance - b) / 2;
    var zFar = a * 100.0;
    var projectionMatrix = m4.perspective(fieldOfViewRadians, aspect, zNear, zFar);

    var cameraPosition = [0, 0, distance];
    var up = [0, 1, 0];
    var target = [0, 0, 0];

    // Compute the camera's matrix using look at.
    var cameraMatrix = m4.lookAt(cameraPosition, target, up);

    // Make a view matrix from the camera matrix.
    var viewMatrix = m4.inverse(cameraMatrix);

    var viewProjectionMatrix = m4.multiply(projectionMatrix, viewMatrix);

    if (guiControls.lockLonRot)
    {
        rotZ = MathUtils.deg2Rad(ISS.lon - 90);
    }
    if (guiControls.lockLatRot)
    {
        rotX = MathUtils.deg2Rad(90 + ISS.lat);
    }

    var matrix = m4.xRotate(viewProjectionMatrix, rotX);
    matrix = m4.yRotate(matrix, rotY);
    matrix = m4.zRotate(matrix, rotZ);

    let rECEF = null;
    if (guiControls.enableVisibility)
    {
        rECEF = ISS.r_ECEF;
    }

    earthShaders.draw(matrix, rASun, declSun, LST, guiControls.enableTextures, guiControls.enableGrid, 
        guiControls.enableMap, rECEF);

    // Compute nutation parameters.
    const julian = TimeConversions.computeJulianTime(today);
    const T = (julian.JT - 2451545.0)/36525.0;
    const nutPar = Nutation.nutationTerms(T);

    let p = [];
    const period = Kepler.computePeriod(kepler_updated.a, kepler_updated.mu);

    // Division by 100.0 leads to numerical issues.
    const jdStep = period / 100.01;

    for (let jdDelta = -period; jdDelta <= period; jdDelta += jdStep)
    {
        const deltaDate = new Date(today.getTime() +  1000 * jdDelta);
        const osvProp = Kepler.propagate(kepler_updated, deltaDate);
        const osv_ECEF = Frames.osvJ2000ToECEF(osvProp, nutPar);
        const r_ECEF = osv_ECEF.r;
        const lon = MathUtils.atan2d(r_ECEF[1], r_ECEF[0]);
        const lat = MathUtils.rad2Deg(Math.asin(r_ECEF[2] / MathUtils.norm(r_ECEF)));
        const alt = MathUtils.norm(r_ECEF);

        const x = alt * 0.001 * MathUtils.cosd(lat) * MathUtils.cosd(lon);
        const y = alt * 0.001 * MathUtils.cosd(lat) * MathUtils.sind(lon);
        const z = alt * 0.001 * MathUtils.sind(lat);

        p.push([-x, y, -z]);
        if (jdDelta != -period)
        {
            p.push([-x, y, -z]);
        }
    }
    p.push(p[p.length - 1]);
    p.push(p[p.length - 1]);
    p.push(p[p.length - 1]);
    p.push([ISS.x, ISS.y, ISS.z]);
    p.push([0, 0, 0]);

    if (guiControls.enableOrbit)
    {
        lineShaders.setGeometry(p);
        lineShaders.draw(matrix);

        let issMatrix = m4.translate(matrix, ISS.x, ISS.y, ISS.z);
        issMatrix = m4.scale(issMatrix, 0.01, 0.01, 0.01);
        earthShaders.draw(issMatrix, rASun, declSun, LST, false, false, false, null);
    }
    if (guiControls.enableSun)
    {
        // Angular size of the Sun.
        const delta = 0.5;
        // Distance to the Sun.
        const D = 0.5 * zFar;
        // Diameter of the Sun in order have correct angular size.
        const d = 2.0 * D * MathUtils.tand(delta / 2);

        const scale = (d / 2.0) / a;
        const xSun = D * MathUtils.cosd(lonlat.lat) * MathUtils.cosd(lonlat.lon);
        const ySun = D * MathUtils.cosd(lonlat.lat) * MathUtils.sind(lonlat.lon);
        const zSun = D * MathUtils.sind(lonlat.lat);        

        let sunMatrix = m4.translate(matrix, -xSun, ySun, zSun);
        sunMatrix = m4.scale(sunMatrix, scale, scale, scale);
        earthShaders.draw(sunMatrix, rASun, declSun, LST, false, false, false, null);

        let pSun = [];
        for (let lonDelta = 0; lonDelta < 361.0; lonDelta++)
        {
            const xSun = D * MathUtils.cosd(lonlat.lat) * MathUtils.cosd(lonlat.lon + lonDelta);
            const ySun = D * MathUtils.cosd(lonlat.lat) * MathUtils.sind(lonlat.lon + lonDelta);
            const zSun = D * MathUtils.sind(lonlat.lat);  
            
            pSun.push([-xSun, ySun, zSun]);
            if (lonDelta != 0.0)
            {
                pSun.push([-xSun, ySun, zSun]);
            }
        }
        pSun.push(pSun[pSun.length - 1]);
        //console.log(pSun);
        lineShaders.setGeometry(pSun);
        lineShaders.draw(matrix);
    }

    //earthShaders.draw(matrix, rASun, declSun, LST);
    // Call drawScene again next frame
    requestAnimationFrame(drawScene);

    drawing = false;
}

/**
 * Update captions.
 */
function updateCaptions(rA, decl, lonlat, rAMoon, declMoon, lonlatMoon, today, JT)
{
    const dateText = document.getElementById('dateText');
    const warningText = document.getElementById('warningText');
    const warningContainer = document.getElementById('warningContainer');

    let caption = "";
    let delay = (today - ISS.osv.ts) / 1000;
    if (Math.abs(delay) > 1000)
    {
        warningContainer.style.visibility = "visible";
        warningText.style.visibility = "visible";
        warningText.innerHTML = "WARNING: <br> OSV age: " + Math.floor(Math.abs(delay)) + "s > 1000s";
    }
    else 
    {
        warningContainer.style.visibility = "hidden";
        warningText.style.visibility = "hidden";
    }

    if (guiControls.showLocal)
    {
        caption = caption + "Local: " + today.toString() + "<br>";
    }
    if (guiControls.showUtc)
    {
        caption = caption + "UTC: " + today.toUTCString() + "<br>";
    } 
    if (guiControls.showJulian)
    {
        caption = caption + "Julian: " + JT.toString() + "<br>";
    }
    if (guiControls.showSunRa)
    {
        let raTime = Coordinates.deg2Time(Coordinates.rad2Deg(rA));
        caption = caption + "Sun RA: " + raTime.h + "h " + raTime.m + "m " + raTime.s + "s (" +
                Coordinates.rad2Deg(rA).toFixed(5) + "&deg;) <br>";
    }
    if (guiControls.showSunDecl)
    {
        caption = caption + "Sun Declination: " + Coordinates.rad2Deg(decl).toFixed(5) + "&deg; <br>";
    }
    if (guiControls.showSunLongitude)
    {
        caption = caption + "Sun Longitude: " + lonlat.lon.toFixed(5) + "&deg; <br>";
    }
    if (guiControls.showSunLatitude)
    {
        caption = caption + "Sun Latitude: " + lonlat.lat.toFixed(5) + "&deg; <br>";
    }

    if (guiControls.showMoonRa)
    {
        let raTime = Coordinates.deg2Time(Coordinates.rad2Deg(rAMoon));
        caption = caption + "Moon RA: " + raTime.h + "h " + raTime.m + "m " + raTime.s + "s (" +
                Coordinates.rad2Deg(rAMoon).toFixed(5) + "&deg;) <br>";
    }
    if (guiControls.showMoonDecl)
    {
        caption = caption + "Moon Declination: " + Coordinates.rad2Deg(declMoon).toFixed(5) + "&deg; <br>";
    }
    if (guiControls.showMoonLongitude)
    {
        caption = caption + "Moon Longitude: " + lonlatMoon.lon.toFixed(5) + "&deg; <br>";
    }
    if (guiControls.showMoonLatitude)
    {
        caption = caption + "Moon Latitude: " + lonlatMoon.lat.toFixed(5) + "&deg; <br>";
    }

    if (guiControls.enableOrbit)
    {
        if (guiControls.showTelemetry)
        {
            caption = caption + "OSV Timestamp: " + ISS.osv.ts + "<br>";
            caption = caption + "OSV Position (m, J2000) [" 
            + ISS.osv.r[0].toFixed(5) + " " + ISS.osv.r[1].toFixed(5) + " " + ISS.osv.r[2].toFixed(5)
            + "]<br>";
            caption = caption + "OSV Velocity (m, J2000) [" 
            + ISS.osv.v[0].toFixed(5) + " " + ISS.osv.v[1].toFixed(5) + " " + ISS.osv.v[2].toFixed(5)
            + "]<br>";
        }
        
        if (guiControls.showOsvGM2000)
        {
            caption = caption + "Propagated: " + ISS.osvProp.ts + "<br>";
            caption = caption + "Position (m, J2000) [" 
            + ISS.osvProp.r[0].toFixed(5) + " " + ISS.osvProp.r[1].toFixed(5) + " " + ISS.osvProp.r[2].toFixed(5)
            + "]<br>";
            caption = caption + "Velocity (m/s, J2000) [" 
            + ISS.osvProp.v[0].toFixed(5) + " " + ISS.osvProp.v[1].toFixed(5) + " " + ISS.osvProp.v[2].toFixed(5)
            + "]<br>";
        }

        if (guiControls.showOsvECEF)
        {
            caption = caption + "Position (m, ECEF) [" 
            + ISS.r_ECEF[0].toFixed(5) + " " + ISS.r_ECEF[1].toFixed(5) + " " + ISS.r_ECEF[2].toFixed(5)
            + "]<br>";
            caption = caption + "Velocity (m/s, ECEF) [" 
            + ISS.v_ECEF[0].toFixed(5) + " " + ISS.v_ECEF[1].toFixed(5) + " " + ISS.v_ECEF[2].toFixed(5)
            + "]<br>";
        }

        if (guiControls.showIssLocation)
        {
            caption = caption + "Lat, Lon (deg): " + ISS.lat.toFixed(5) + " " + ISS.lon.toFixed(5) + "<br>";
            caption = caption + "Altitude (m): " + ISS.alt + "<br>";
        }

        if (ISS.kepler.a != 0 && guiControls.showIssElements)
        {
            caption = caption + "Semi-major axis        (deg): " + ISS.kepler.a + "<br>";
            caption = caption + "Eccentricity                : " + ISS.kepler.ecc_norm + "<br>";
            caption = caption + "Inclination            (deg): " + ISS.kepler.incl + "<br>";
            caption = caption + "Longitude of Asc. Node (deg): " + ISS.kepler.Omega + "<br>";
            caption = caption + "Argument of Periapsis  (deg): " + ISS.kepler.omega + "<br>";
            caption = caption + "Mean Anomaly           (deg): " + ISS.kepler.M + "<br>";
        }
    }

    dateText.innerHTML = "<p>" + caption + "</p>";
}
