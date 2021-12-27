"use strict";

var gl = null;
var earthShaders = null;
var lineShaders = null;

// SGP4 test:
var tleLine1 = '1 25544U 98067A   21356.70730882  .00006423  00000+0  12443-3 0  9993',
    tleLine2 = '2 25544  51.6431 130.5342 0004540 343.5826 107.2903 15.49048054317816';
// Initialize a satellite record
var satrec = satellite.twoline2satrec(tleLine1, tleLine2);
    
// Semi-major and semi-minor axes of the WGS84 ellipsoid.
var a = 6378.1370;
var b = 6356.75231414;

// Sidereal angle.
var LST = 0;

// Camera distance from Earth.
var distance = 5.0 * a;
const zFar = 1000000;

createControls();

// Delta time (ms) from configuration of date and time.
var dateDelta = 0;

// Field of view.
var fieldOfViewRadians = MathUtils.deg2Rad(30);

let rotZToLon = (rotZ) => {return (-90 - rotZ);}
let rotXToLat = (rotX) => {return (90 + rotX);}

// Rotation.
var rotX = MathUtils.deg2Rad(-90);
var rotY = MathUtils.deg2Rad(0);
var rotZ = MathUtils.deg2Rad(0);


gl = canvas.getContext("webgl2");
if (!gl) 
{
    console.log("Failed to initialize GL.");
}
earthShaders = new PlanetShaders(gl, 50, 50, a, b, 15, 15);
earthShaders.init("textures/8k_earth_daymap.jpg", "textures/8k_earth_nightmap.jpg");

lineShaders = new LineShaders(gl);
lineShaders.init();

requestAnimationFrame(drawScene);
 

// Draw the scene.
function drawScene(time) 
{
    if (earthShaders.numTextures < 2)
    {
        requestAnimationFrame(drawScene);
        return;
    }

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

        timeControls.yearControl.setValue(today.getFullYear());
        timeControls.monthControl.setValue(today.getMonth() + 1);
        timeControls.dayControl.setValue(today.getDate());
        timeControls.hourControl.setValue(today.getHours());
        timeControls.minuteControl.setValue(today.getMinutes());
        timeControls.secondControl.setValue(today.getSeconds());
    }

    // Use latest telemetry only if enabled. Then, the telemetry set from the UI controls is not
    // overwritten below.
    ISS.osv = createOsv(today);

    // Compute Julian date and time:
    const julianTimes = TimeConversions.computeJulianTime(today);
    const JD = julianTimes.JD;
    const JT = julianTimes.JT;
    const T = (JT - 2451545.0)/36525.0;
    // Compute nutation parameters.
    const nutPar = Nutation.nutationTerms(T);

    // Compute equitorial coordinates of the Sun.
    const sunAltitude = new SunAltitude();
    const eqCoordsSun = sunAltitude.computeEquitorial(JT, JD);
    const rASun = eqCoordsSun.rA;
    const declSun = eqCoordsSun.decl;

    // Compute equitorial coordinates of the Moon.
    const moonAltitude = new MoonAltitude();
    const eqCoordsMoon = moonAltitude.computeEquitorial(JT);
    const rAMoon = eqCoordsMoon.rA;
    const declMoon = eqCoordsMoon.decl;

    // Compute sidereal time perform modulo to avoid floating point accuracy issues with 32-bit
    // floats in the shader:
    LST = MathUtils.deg2Rad(TimeConversions.computeSiderealTime(0, JD, JT)) % 360.0;

    // Convert OSV to Osculating Keplerian elements.
    ISS.kepler = Kepler.osvToKepler(ISS.osv.r, ISS.osv.v, ISS.osv.ts);

    // Propagate OSV only if SGP4 is not used.
    if (guiControls.source === "TLE")
    {
        ISS.osvProp = ISS.osv;
    }
    else 
    {
        // Propagate OSV using Osculating Keplerian elements.
        ISS.osvProp = Kepler.propagate(ISS.kepler, today);
    }

    // Compute updated keplerian elements from the propagated OSV.
    let kepler_updated = ISS.kepler;// Kepler.osvToKepler(ISS.osvProp.r, ISS.osvProp.v, ISS.osvProp.ts);

    // Convert propagated OSV from J2000 to ECEF frame.
    let osv_ECEF = Frames.osvJ2000ToECEF(ISS.osvProp);
    ISS.r_ECEF = osv_ECEF.r;
    ISS.v_ECEF = osv_ECEF.v;
    ISS.r_J2000 = ISS.osvProp.r;
    ISS.v_J2000 = ISS.osvProp.v;

    // Extract the coordinates on the WGS84 ellipsoid.
    let wgs84 = Coordinates.cartToWgs84(ISS.r_ECEF);
    ISS.alt = wgs84.h; 
    ISS.lon = wgs84.lon;
    ISS.lat = wgs84.lat;

    // Distance from the origin in ECEF frame.
    const alt = MathUtils.norm(ISS.r_ECEF);

    // Compute longitude and latitude of the Sun and the Moon.
    let lonlat = sunAltitude.computeSunLonLat(rASun, declSun, JD, JT);
    let lonlatMoon = moonAltitude.computeMoonLonLat(rAMoon, declMoon, JD, JT);

    // Update captions.
    updateCaptions(rASun, declSun, lonlat, rAMoon, declMoon, lonlatMoon, today, JT);

    // Clear the canvas
    gl.clearColor(0, 0, 0, 255);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Handle screen size updates.
    resizeCanvasToDisplaySize(gl.canvas);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);

    const matrix = createViewMatrix();
    drawEarth(matrix, rASun, declSun, LST, JT, nutPar);
    if (guiControls.enableOrbit)
    {
        drawOrbit(today, matrix, kepler_updated, nutPar);
    }

    if (guiControls.enableSun)
    {
        drawSun(lonlat, JT, JD, rASun, declSun, matrix, nutPar);
    }

    // Call drawScene again next frame
    requestAnimationFrame(drawScene);

    drawing = false;
}

/**
 * Collect OSV from selected source and update controls.
 * 
 * @param today 
 *      Date of the OSV for OEM and TLE sources.
 * @returns OSV.
 */
function createOsv(today)
{
    let osvOut = null;

    // Use latest telemetry only if enabled. Then, the telemetry set from the UI controls is not
    // overwritten below.
    if (guiControls.source === "Telemetry")
    {
        osvOut = ISS.osvIn;

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
    else if (guiControls.source === "OEM")
    {
        const osvOem = getClosestOEMOsv(today);
        osvOut = osvOem;

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
    else if (guiControls.source === "TLE")
    {
        const positionAndVelocity = satellite.propagate(satrec, today);
        // The position_velocity result is a key-value pair of ECI coordinates.
        // These are the base results from which all other coordinates are derived.
        const positionEci = positionAndVelocity.position;
        const velocityEci = positionAndVelocity.velocity;

        osvControls.osvX.setValue(positionEci.x);
        osvControls.osvY.setValue(positionEci.y);
        osvControls.osvZ.setValue(positionEci.z);
        osvControls.osvVx.setValue(velocityEci.x * 1000.0);
        osvControls.osvVy.setValue(velocityEci.y * 1000.0);
        osvControls.osvVz.setValue(velocityEci.z * 1000.0);

        osvOut = {r: [
            positionEci.x * 1000.0, 
            positionEci.y * 1000.0, 
            positionEci.z * 1000.0], 
                   v: [
            velocityEci.x * 1000.0, 
            velocityEci.y * 1000.0, 
            velocityEci.z * 1000.0], 
                ts: today
                };
       // osvControls.osvYear.setValue(today.getYear());
        osvControls.osvMonth.setValue(today.getMonth() + 1);
        osvControls.osvDay.setValue(today.getDate());
        osvControls.osvHour.setValue(today.getHours());
        osvControls.osvMinute.setValue(today.getMinutes());
        osvControls.osvSecond.setValue(today.getSeconds());
    }
    else if (guiControls.source === "OSV")
    {
        // Set telemetry from UI controls.
        osvOut = {r: [
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

    return osvOut;
}

/**
 * Create view matrix taking into account the rotation.
 * 
 * @returns The view matrix.
 */
function createViewMatrix()
{
    // Compute the projection matrix.
    const fieldOfViewRadians = MathUtils.deg2Rad(guiControls.fov);
    const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
    const zNear = (distance - b) / 2;
    const projectionMatrix = m4.perspective(fieldOfViewRadians, aspect, zNear, zFar);

    distance = cameraControls.distance.getValue();
    // Camera position in the clip space.
    const cameraPosition = [0, 0, distance];
    const up = [0, 1, 0];
    up[0] = MathUtils.cosd(guiControls.upLat) * MathUtils.cosd(guiControls.upLon);
    up[2] = MathUtils.cosd(guiControls.upLat) * MathUtils.sind(guiControls.upLon);
    up[1] = MathUtils.sind(guiControls.upLat);

    const target = [0, 0, 0];

    // Compute the camera's matrix using look at.
    const cameraMatrix = m4.lookAt(cameraPosition, target, up);

    // Make a view matrix from the camera matrix.
    const viewMatrix = m4.inverse(cameraMatrix);
    const viewProjectionMatrix = m4.multiply(projectionMatrix, viewMatrix);

    // Handle longitude locking.
    // TODO: Longitude has inconsistent value in J2000.
    if (guiControls.lockLonRot)
    {
        rotZ = MathUtils.deg2Rad(-90 - ISS.lon);

        if (guiControls.frame === 'J2000')
        {
            rotZ = MathUtils.deg2Rad(-90 - ISS.lon - MathUtils.rad2Deg(LST));
        }

        cameraControls.lon.setValue(ISS.lon);
    }
    else if (canvas.onmousemove == null)
    {        
        rotZ = MathUtils.deg2Rad(-90 - guiControls.lon);
    }

    // Handle latitude locking.
    // TODO: Latitude has inconsistent value in J2000.
    if (guiControls.lockLatRot)
    {
        rotX = MathUtils.deg2Rad(-90 + ISS.lat);
        cameraControls.lat.setValue(ISS.lat);
    }
    else if (canvas.onmousemove == null)
    {
        rotX = MathUtils.deg2Rad(-90 + guiControls.lat);
    }

    // Rotate view projection matrix to take into account rotation to target coordinates.
    var matrix = m4.xRotate(viewProjectionMatrix, rotX);
    matrix = m4.yRotate(matrix, rotY);
    matrix = m4.zRotate(matrix, rotZ);

    return matrix;
}

/**
 * Draw Earth.
 * 
 * @param {*} matrix 
 *      View matrix.
 * @param {*} rASun 
 *      Right-ascension of the Sun.
 * @param {*} declSun 
 *      Declination of the Sun.
 * @param {*} LST 
 *      Sidereal time.
 * @param {*} JT
 *      Julian time.
 * @param {*} nutPar 
 *      Nutation parameters.
 */
function drawEarth(matrix, rASun, declSun, LST, JT, nutPar)
{
    let rECEF = null;
    if (guiControls.enableVisibility)
    {
        rECEF = ISS.r_ECEF;
    }

    let earthMatrix = matrix;
    if (guiControls.frame === 'J2000')
    {
        const modPar = Frames.getMODParams(JT);
        earthMatrix = m4.zRotate(earthMatrix, LST);
        earthMatrix = m4.xRotate(earthMatrix, -MathUtils.deg2Rad(nutPar.eps + nutPar.deps));
        earthMatrix = m4.zRotate(earthMatrix, -MathUtils.deg2Rad(nutPar.dpsi));
        earthMatrix = m4.xRotate(earthMatrix,  MathUtils.deg2Rad(nutPar.eps));
        earthMatrix = m4.zRotate(earthMatrix, -MathUtils.deg2Rad(modPar.z));
        earthMatrix = m4.yRotate(earthMatrix,  MathUtils.deg2Rad(modPar.nu));
        earthMatrix = m4.zRotate(earthMatrix, -MathUtils.deg2Rad(modPar.zeta));
    }

    earthShaders.draw(earthMatrix, rASun, declSun, LST, guiControls.enableTextures, guiControls.enableGrid, 
        guiControls.enableMap, rECEF);
}

/**
 * Draw orbit.
 * 
 * @param {*} today
 *      Date.
 * @param {*} matrix
 *      View matrix.
 * @param {*} kepler_updated
 *      Kepler parameters
 * @param {*} JD 
 *      Julian date.
 */
function drawOrbit(today, matrix, kepler_updated, nutPar)
{
    let p = [];
    const period = Kepler.computePeriod(kepler_updated.a, kepler_updated.mu);

    // Division by 100.0 leads to numerical issues.
    const jdStep = period / (guiControls.orbitPoints + 0.01);

    for (let jdDelta = -period * guiControls.orbitsBefore; jdDelta <= period * guiControls.orbitsAfter; 
        jdDelta += jdStep)
    {
        const deltaDate = new Date(today.getTime() +  1000 * jdDelta);

        let x = 0;
        let y = 0;
        let z = 0;
        if (guiControls.source === "TLE")
        {
            const osvProp = satellite.propagate(satrec, deltaDate);
            const posEci = osvProp.position;
            const velEci = osvProp.velocity;
            const osvPropJ2000 = {r : [posEci.x * 1000.0, posEci.y* 1000.0, posEci.z* 1000.0],
                       v : [velEci.x, velEci.y, velEci.z], 
                       ts : deltaDate};

            if (guiControls.frame === 'ECEF')
            {
                const osvEcef = Frames.osvJ2000ToECEF(osvPropJ2000, nutPar);
                [x, y, z] = MathUtils.vecmul(osvEcef.r, 0.001);
            }
            else if (guiControls.frame === 'J2000')
            {
                [x, y, z] = [posEci.x, posEci.y, posEci.z];
            }
        }
        else
        {
            const osvProp = Kepler.propagate(kepler_updated, deltaDate);

            if (guiControls.frame === 'ECEF')
            {
                const osv_ECEF = Frames.osvJ2000ToECEF(osvProp, nutPar);
                [x, y, z] = MathUtils.vecmul(osv_ECEF.r, 0.001);
            }
            else if (guiControls.frame === 'J2000')
            {
                [x, y, z] = MathUtils.vecmul(osvProp.r, 0.001);
            }
        }

        p.push([x, y, z]);
        if (p.length != 1)
        {
            p.push([x, y, z]);
        }
    }
    p.push(p[p.length - 1]);
    if (guiControls.frame === 'ECEF')
    {
        [ISS.x, ISS.y, ISS.z] = MathUtils.vecmul(ISS.r_ECEF,  0.001);
    }
    else if (guiControls.frame === 'J2000')
    {
        [ISS.x, ISS.y, ISS.z] = MathUtils.vecmul(ISS.r_J2000,  0.001);
    }
    p.push([ISS.x, ISS.y, ISS.z]);
    p.push([0, 0, 0]);

    lineShaders.setGeometry(p);
    lineShaders.draw(matrix);

    // The satellite is replaced with a smaller sphere without textures, map nor grid.
    let issMatrix = m4.translate(matrix, ISS.x, ISS.y, ISS.z);
    const factor = 0.01 * guiControls.satelliteScale;
    issMatrix = m4.scale(issMatrix, factor, factor, factor);
    earthShaders.draw(issMatrix, 0, 0, LST, false, false, false, null);
}

/**
 * Draw Sun.
 * 
 * @param {*} lonlat 
 *      Longitude and latitude.
 * @param {*} JT 
 *      Julian time.
 * @param {*} JD 
 *      Julian date.
 * @param {*} rASun
 *      Right Ascension of the Sun.
 * @param {*} declSun
 *      Declination of the Sun.
 * @param {*} matrix 
 *      View matrix.
 * @param {*} nutPar
 *      Nutation parameters. 
 */
function drawSun(lonlat, JT, JD, rASun, declSun, matrix, nutPar)
{
    // Angular size of the Sun.
    const delta = 0.5;
    // Distance to the Sun.
    const D = 0.5 * zFar;
    // Diameter of the Sun in order have correct angular size.
    const d = 2.0 * D * MathUtils.tand(delta / 2);

    const scale = (d / 2.0) / a;

    let sunPos = Coordinates.wgs84ToCart(lonlat.lat, lonlat.lon, D * 1000);

    if (guiControls.frame === 'J2000')
    {
        sunPos = Frames.posECEFToCEP(JT, JD, sunPos);
        sunPos = Frames.posCEPToJ2000(JT, sunPos, nutPar);
    }
    let sunMatrix = m4.translate(matrix, sunPos[0] * 0.001, sunPos[1] * 0.001, sunPos[2] * 0.001);
    sunMatrix = m4.scale(sunMatrix, scale, scale, scale);
    earthShaders.draw(sunMatrix, rASun, declSun, LST, false, false, false, null);

    let pSun = [];
    if (guiControls.enableSubSolar)
    {
        for (let lonDelta = 0; lonDelta <= 360.0; lonDelta++)
        {
            let rSubSolarDelta = Coordinates.wgs84ToCart(lonlat.lat, lonlat.lon + lonDelta, 0);

            if (guiControls.frame === 'J2000')
            {
                rSubSolarDelta = Frames.posECEFToCEP(JT, JD, rSubSolarDelta);
                rSubSolarDelta = Frames.posCEPToJ2000(JT, rSubSolarDelta, nutPar);
            }

            if (lonDelta != 0.0)
            {
                pSun.push(MathUtils.vecmul(rSubSolarDelta, 0.001));
            }
            pSun.push(MathUtils.vecmul(rSubSolarDelta, 0.001));
        }
        let rSubSolar = Coordinates.wgs84ToCart(lonlat.lat, lonlat.lon, 0);
        if (guiControls.frame === 'J2000')
        {
            rSubSolar = Frames.posECEFToCEP(JT, JD, rSubSolar);
            rSubSolar = Frames.posCEPToJ2000(JT, rSubSolar, nutPar);
        }
        pSun.push(pSun[pSun.length - 1]);
        pSun.push(MathUtils.vecmul(rSubSolar, 0.001));
    }
    for (let lonDelta = 0; lonDelta < 361.0; lonDelta++)
    {
        let rSubSolarDelta = Coordinates.wgs84ToCart(lonlat.lat, lonlat.lon + lonDelta, D*1000);

        if (guiControls.frame === 'J2000')
        {
            rSubSolarDelta = Frames.posECEFToCEP(JT, JD, rSubSolarDelta);
            rSubSolarDelta = Frames.posCEPToJ2000(JT, rSubSolarDelta, nutPar);
        }
    
        pSun.push(MathUtils.vecmul(rSubSolarDelta, 0.001));
        if (lonDelta != 0.0 || guiControls.enableSubSolar)
        {
            pSun.push(MathUtils.vecmul(rSubSolarDelta, 0.001));
        }
    }
    pSun.push(pSun[pSun.length - 1]);

    lineShaders.setGeometry(pSun);
    lineShaders.draw(matrix);
}