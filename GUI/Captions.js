/**
 * Update captions.
 */
function updateCaptions(rA, decl, lonlat, rAMoon, declMoon, lonlatMoon, today, JT)
{
    const targetText = document.getElementById('targetText');
    targetText.innerHTML = guiControls.targetName;
    if (guiControls.showTargetName)
    {
        targetText.style.visibility = "visible";
    }
    else
    {
        targetText.style.visibility = "hidden";
    }

    const dateText = document.getElementById('dateText');
    const warningText = document.getElementById('warningText');
    const warningContainer = document.getElementById('warningContainer');

    let caption = "";

    let delay = (today - ISS.osv.ts) / 1000;
    if (guiControls.source === "TLE")
    {
        const tleYear = parseInt("20" + guiControls.tleYear);
        let tleDate = new Date(tleYear, 0, 0);
        tleDate = new Date(tleDate.getTime() + guiControls.tleDay * 86400.0 * 1000.0);
        const utcDiffMinutes = tleDate.getTimezoneOffset();
        tleDate = new Date(tleDate.getTime() - utcDiffMinutes * 60.0 * 1000.0);
        let tleDelay = (today - tleDate) / 1000;

        if (Math.abs(tleDelay) > 86400 * 2)
        {
            warningContainer.style.visibility = "visible";
            warningText.style.visibility = "visible";
            warningText.innerHTML = "WARNING: <br> TLE age: " + (Math.abs(tleDelay)/86400.0).toFixed(1) + " days > 2 days";
        }
        else
        {
            warningContainer.style.visibility = "hidden";
            warningText.style.visibility = "hidden";    
        }
    }
    else if (Math.abs(delay) > 1000)
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
            caption = caption + "Lat, Lon (deg): " + ISS.lat.toFixed(2) + " " + ISS.lon.toFixed(2) + "<br>";
            caption = caption + "Altitude (m): " + ISS.alt.toFixed(0) + "<br>";
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
