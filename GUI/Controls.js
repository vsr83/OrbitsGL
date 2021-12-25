// DatGUI controls.
var guiControls = null;

// Hold OSV controls.
var osvControls = {};
var timeControls = {};
var cameraControls = {};
var frameControls = {};

/**
 * Create GUI controls.
 */
function createControls()
{
    const initDate = new Date();
 
    guiControls = new function()
    {
        //this.preset = "Start";
        this.enableOrbit = true;
        this.enableGrid = true;
        this.enableMap = true;
        this.enableVisibility = true;
        this.enableTextures = true;
        this.enableSun = true;
        this.enableMoon = true;
        this.enableSubSolar = false;
        this.locationLon = 24.66;
        this.locationLat = 60.21;
        this.gridLonResolution = 30;
        this.gridLatResolution = 30;        
        this.orbitsBefore = 1.0;
        this.orbitsAfter = 1.0;
        this.orbitPoints = 100;
        this.satelliteScale = 1.0;
        this.colorGrid = [80, 80, 80];
        this.colorMap = [80, 80, 120];
        this.colorOrbit = [127, 127, 127];

        //this.enableLocation = false;
        this.displayTwilight = true;
        this.deltaDays = 0;
        this.deltaHours = 0;
        this.deltaMins = 0;
        this.deltaSecs = 0;
        this.showTargetName = true;
        this.showLocal = false;
        this.showUtc = false;
        this.showJulian = false;
        this.showSunRa = false;
        this.showSunDecl = false;
        this.showSunLatitude = false;
        this.showSunLongitude = false;
        this.showMoonRa = false;
        this.showMoonDecl = false;
        this.showMoonLatitude = false;
        this.showMoonLongitude = false;
        this.showTelemetry = true;
        this.showOsvGM2000 = true;
        this.showOsvECEF = true;
        this.showIssLocation = true;
        this.showIssElements = false;
        this.dateYear = initDate.getFullYear();
        this.dateMonth = initDate.getMonth()+1;
        this.dateDay = initDate.getDate();
        this.timeHour = initDate.getHours();
        this.timeMinute = initDate.getMinutes();
        this.timeSecond = initDate.getSeconds();
        this.GitHub = function() {
            window.open("https://github.com/vsr83/OrbitsGL", "_blank").focus();
        };
        this.warpSeconds = 60;
        this.timeWarp = false;
        this.lockLonRot = false;
        this.lockLatRot = false;

        this.lon = 0.0;
        this.lat = 0.0;
        this.distance = a * 5.0;

        this.upLon = 0.0;
        this.upLat = 90.0;
        this.fov = 30;
        
        this.frameJ2000 = false;
        this.frameECEF = true;

        this.enableTelemetry = true;
        this.enableOEM = false;
        this.enableTLE = false;
        this.enableClock = true;
        this.targetName = "ISS (ZARYA)";
        this.osvYear = 2021;
        this.osvMonth = 11;
        this.osvDay = 22;
        this.osvHour = 0;
        this.osvMinute = 43;
        this.osvSecond = 0;
        this.osvX = 0.0;
        this.osvY = 0.0;
        this.osvZ = 0.0;
        this.osvVx = 0.0;
        this.osvVy = 0.0;
        this.osvVz = 0.0;
        this.insertOSV = function() {
            var osvIn = prompt("Orbit State Vector", 
            "2021-12-05T18:10:00.000 5326.946850262350 4182.210271432980 -611.867277305457 -3.37162589413797 3.42675425977118 -5.96208196793267");
            if (osvIn) 
            {
                osvControls.targetName.setValue("Manual OSV");
                osvControls.enableTelemetry.setValue(0);
                osvControls.enableOEM.setValue(0);
                osvControls.enableTLE.setValue(0);

                const terms = osvIn.split(' ');
                const timeStamp = new Date(terms[0] + 'Z');
                const posX = parseFloat(terms[1]);
                const posY = parseFloat(terms[2]);
                const posZ = parseFloat(terms[3]);
                const velX = parseFloat(terms[4]);
                const velY = parseFloat(terms[5]);
                const velZ = parseFloat(terms[6]);

                console.log("Time stamp: " + timeStamp);
                console.log("Position X: " + posX);
                console.log("Position Y: " + posY);
                console.log("Position Z: " + posZ);
                console.log("Velocity X: " + velX);
                console.log("Velocity Y: " + velY);
                console.log("Velocity Z: " + velZ);

                osvControls.osvYear.setValue(timeStamp.getFullYear());
                osvControls.osvMonth.setValue(timeStamp.getMonth()+1);
                osvControls.osvDay.setValue(timeStamp.getDate());
                osvControls.osvHour.setValue(timeStamp.getHours());
                osvControls.osvMinute.setValue(timeStamp.getMinutes());
                osvControls.osvSecond.setValue(timeStamp.getSeconds());
                osvControls.osvX.setValue(posX);
                osvControls.osvY.setValue(posY);
                osvControls.osvZ.setValue(posZ);
                osvControls.osvVx.setValue(velX * 1000);
                osvControls.osvVy.setValue(velY * 1000);
                osvControls.osvVz.setValue(velZ * 1000);
            }
        }
        this.insertTLE = function() {
            const TLEcontainer = document.getElementById('TLEcontainer');
            TLEcontainer.style.visibility = "visible";
            const TLEinput = document.getElementById('TLEinput');
            TLEinput.focus();
        }
    }

    /**
     * Configure time.
     */
    function configureTime()
    {
        const newDate = new Date(guiControls.dateYear, parseInt(guiControls.dateMonth)-1, guiControls.dateDay, 
            guiControls.timeHour, guiControls.timeMinute, guiControls.timeSecond).getTime();

        const today = new Date().getTime();
        dateDelta = newDate - today;
    }

    gui = new dat.GUI();

    osvControls.targetName = gui.add(guiControls, 'targetName');
    osvControls.insertTLE = gui.add(guiControls, 'insertTLE');
    osvControls.insertOSV = gui.add(guiControls, 'insertOSV');

    const framesFolder = gui.addFolder('Frames');
    frameControls.frameJ2000 = framesFolder.add(guiControls, 'frameJ2000').onChange(function(state) 
    {
        if (state)
        {
            frameControls.frameECEF.setValue(0);
        }
        else if (!guiControls.frameECEF)
        {
            frameControls.frameJ2000.setValue(true);
        }
    });
    frameControls.frameECEF = framesFolder.add(guiControls, 'frameECEF').onChange(function(state) 
    {
        if (state)
        {
            frameControls.frameJ2000.setValue(0);
        }
        else if (!guiControls.frameJ2000)
        {
            frameControls.frameECEF.setValue(true);
        }
    });


    const displayFolder = gui.addFolder('Display');
    displayFolder.add(guiControls, 'enableGrid');
    displayFolder.add(guiControls, 'enableMap');
    displayFolder.add(guiControls, 'enableTextures');
    displayFolder.add(guiControls, 'enableVisibility');
    displayFolder.add(guiControls, 'enableSubSolar');
    displayFolder.add(guiControls, 'enableOrbit');
    displayFolder.add(guiControls, 'enableSun');
    displayFolder.add(guiControls, 'enableMoon');
    const lonControl = displayFolder.add(guiControls, 'gridLonResolution', 1, 180, 1)
    .onChange(function()
    {
        earthShaders.updateGrid(guiControls.gridLonResolution, guiControls.gridLatResolution);
    });
    const latControl = displayFolder.add(guiControls, 'gridLatResolution', 1, 180, 1)
    .onChange(function()
    {
        earthShaders.updateGrid(guiControls.gridLonResolution, guiControls.gridLatResolution);
    });
    displayFolder.add(guiControls, 'orbitsBefore', 0, 5, 0.1);
    displayFolder.add(guiControls, 'orbitsAfter', 0, 5, 0.1);
    displayFolder.add(guiControls, 'orbitPoints', 10, 1000, 1);
    displayFolder.add(guiControls, 'satelliteScale', 0.1, 10.0, 0.1);
    displayFolder.addColor(guiControls, 'colorGrid')
    .onChange(function()
    {
        earthShaders.colorGrid = guiControls.colorGrid;
        earthShaders.setColorsGrid();
    });
    displayFolder.addColor(guiControls, 'colorMap')
    .onChange(function()
    {
        earthShaders.colorMap = guiControls.colorMap;
        earthShaders.setColorsMap();
    });
    displayFolder.addColor(guiControls, 'colorOrbit')
    .onChange(function()
    {
        lineShaders.colorOrbit = guiControls.colorOrbit;
    });
 
    const cameraFolder = gui.addFolder('Camera');
    //displayFolder.add(guiControls, 'enableLocation');
    cameraFolder.add(guiControls, 'fov', 1, 180, 1);
    cameraFolder.add(guiControls, 'lockLonRot');
    cameraFolder.add(guiControls, 'lockLatRot');
    cameraControls.lon = cameraFolder.add(guiControls, 'lon', -180, 180, 0.1);
    cameraControls.lat = cameraFolder.add(guiControls, 'lat', -180, 180, 0.1);
    cameraControls.distance = cameraFolder.add(guiControls, 'distance', a*1.01, 1000000, 100);
    cameraFolder.add(guiControls, 'upLon', -180, 180, 1);
    cameraFolder.add(guiControls, 'upLat', -90, 90, 1);
     
    const timeFolder = gui.addFolder('Time');
    timeControls.warpSeconds = timeFolder.add(guiControls, 'warpSeconds', -60, 60, 1).onChange(configureTime); 
    timeFolder.add(guiControls, 'timeWarp');
    timeControls.yearControl = timeFolder.add(guiControls, 'dateYear', 1980, 2040, 1).onChange(configureTime);
    timeControls.monthControl = timeFolder.add(guiControls, 'dateMonth', 1, 12, 1).onChange(configureTime);
    timeControls.dayControl = timeFolder.add(guiControls, 'dateDay', 1, 31, 1).onChange(configureTime);
    timeControls.hourControl = timeFolder.add(guiControls, 'timeHour', 0, 24, 1).onChange(configureTime);
    timeControls.minuteControl = timeFolder.add(guiControls, 'timeMinute', 0, 59, 1).onChange(configureTime);
    timeControls.secondControl = timeFolder.add(guiControls, 'timeSecond', 0, 59, 1).onChange(configureTime);
 
    timeControls.deltaDayControl = timeFolder.add(guiControls, 'deltaDays', -185, 185, 1);
    timeControls.deltaHourControl = timeFolder.add(guiControls, 'deltaHours', -12, 12, 1);
    timeControls.deltaMinuteControl = timeFolder.add(guiControls, 'deltaMins', -30, 30, 1);
    timeControls.deltaSecControl = timeFolder.add(guiControls, 'deltaSecs', -30, 30, 1);
    timeFolder.add({reset:function()
        {
            var resetDate = new Date();
            timeControls.deltaDayControl.setValue(0);
            timeControls.deltaSecControl.setValue(0);
            timeControls.deltaMinuteControl.setValue(0);
            timeControls.deltaHourControl.setValue(0);
            timeControls.yearControl.setValue(resetDate.getFullYear());
            timeControls.monthControl.setValue(resetDate.getMonth()+1);
            timeControls.dayControl.setValue(resetDate.getDate());
            timeControls.hourControl.setValue(resetDate.getHours());
            timeControls.minuteControl.setValue(resetDate.getMinutes());
            timeControls.secondControl.setValue(resetDate.getSeconds());

            dateDelta = 0;
    }}, 'reset');
     
    const textFolder = gui.addFolder('Caption');
    textFolder.add(guiControls, 'showTargetName');
    textFolder.add(guiControls, 'showLocal');
    textFolder.add(guiControls, 'showUtc');
    textFolder.add(guiControls, 'showJulian');
    textFolder.add(guiControls, 'showSunRa');
    textFolder.add(guiControls, 'showSunDecl');
    textFolder.add(guiControls, 'showSunLongitude');
    textFolder.add(guiControls, 'showSunLatitude');
    textFolder.add(guiControls, 'showMoonRa');
    textFolder.add(guiControls, 'showMoonDecl');
    textFolder.add(guiControls, 'showMoonLongitude');
    textFolder.add(guiControls, 'showMoonLatitude');
    textFolder.add(guiControls, 'showTelemetry');
    textFolder.add(guiControls, 'showOsvGM2000');
    textFolder.add(guiControls, 'showOsvECEF');
    textFolder.add(guiControls, 'showIssLocation');
    textFolder.add(guiControls, 'showIssElements');
 


    const dataFolder = gui.addFolder('Source');
    osvControls.enableTelemetry = dataFolder.add(guiControls, 'enableTelemetry').onChange(function(state)
    {
        console.log("enableTelemetry " + state);
        if (state)
        {
            osvControls.enableOEM.setValue(0);
            osvControls.enableTLE.setValue(0);
        }
    });
    osvControls.enableOEM = dataFolder.add(guiControls, 'enableOEM').onChange(function(state) 
    {
        console.log("enableOEM " + state);
        if (state)
        {
            osvControls.enableTelemetry.setValue(0);
            osvControls.enableTLE.setValue(0);
        }
    });
    osvControls.enableTLE = dataFolder.add(guiControls, 'enableTLE').onChange(function(state) 
    {
        console.log("enableTLE " + state);
        if (state)
        {
            osvControls.enableOEM.setValue(0);
            osvControls.enableTelemetry.setValue(0);
        }
    });


    osvControls.enableClock = dataFolder.add(guiControls, 'enableClock');
    osvControls.osvYear = dataFolder.add(guiControls, 'osvYear', 1980, 2040, 1);
    osvControls.osvMonth = dataFolder.add(guiControls, 'osvMonth', 1, 12, 1);
    osvControls.osvDay = dataFolder.add(guiControls, 'osvDay', 1, 31, 1);
    osvControls.osvHour = dataFolder.add(guiControls, 'osvHour', 0, 23, 1);
    osvControls.osvMinute = dataFolder.add(guiControls, 'osvMinute', 0, 59, 1);
    osvControls.osvSecond = dataFolder.add(guiControls, 'osvSecond', 0, 59, 1);
    osvControls.osvX = dataFolder.add(guiControls, 'osvX', -100000, 100000, 0.000001);
    osvControls.osvY = dataFolder.add(guiControls, 'osvY', -100000, 100000, 0.000001);
    osvControls.osvZ = dataFolder.add(guiControls, 'osvZ', -100000, 100000, 0.000001);
    osvControls.osvVx = dataFolder.add(guiControls, 'osvVx', -100000, 100000, 0.000001);
    osvControls.osvVy = dataFolder.add(guiControls, 'osvVy', -100000, 100000, 0.000001);
    osvControls.osvVz = dataFolder.add(guiControls, 'osvVz', -100000, 100000, 0.000001);
 
    timeFolder.add({setClockFromOsv:function()
        {
            timeControls.yearControl.setValue(osvControls.osvYear.getValue());
            timeControls.monthControl.setValue(osvControls.osvMonth.getValue());
            timeControls.dayControl.setValue(osvControls.osvDay.getValue());
            timeControls.hourControl.setValue(osvControls.osvHour.getValue());
            timeControls.minuteControl.setValue(osvControls.osvMinute.getValue());
            timeControls.secondControl.setValue(osvControls.osvSecond.getValue());
        }}, 'setClockFromOsv');
     
    gui.add(guiControls, 'GitHub');
}
 