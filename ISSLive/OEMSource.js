/**
 * Methods for parsing trajectory data from Orbit Ephemeris Message (OEM)
 * obtained from:
 * https://nasa-public-data.s3.amazonaws.com/iss-coords/current/ISS_OEM/ISS.OEM_J2K_EPH.txt
 */

var osvArray = [];

var xmlHTTP = new XMLHttpRequest();
xmlHTTP.onreadystatechange = function()
{
    console.log("readyState: " + this.readyState);
    console.log("status:     " + this.status);

    if (this.readyState == 4 && this.status == 200)
    {
        // Parse OEM file.
        const lines = this.responseText.split("\n");

        let started = false;
        for (let indLine = 0; indLine < lines.length; indLine++)
        {
            const line = lines[indLine];
            
            if (started)
            {
                const terms = line.split(' ');
                const timeStamp = new Date(terms[0] + 'Z');
                const posX = parseFloat(terms[1]) * 1000.0;
                const posY = parseFloat(terms[2]) * 1000.0;
                const posZ = parseFloat(terms[3]) * 1000.0;
                const velX = parseFloat(terms[4]) * 1000.0;
                const velY = parseFloat(terms[5]) * 1000.0;
                const velZ = parseFloat(terms[6]) * 1000.0;

                let osv = {};
                osv.ts = timeStamp;
                osv.r = [posX, posY, posZ];
                osv.v = [velX, velY, velZ];
                osvArray.push(osv);
            }
            else if (!started && line.startsWith("COMMENT End sequence of events"))
            {
                started = true;
            }            
        }
        console.log(osvArray.length + " OSVs loaded.");
    }
}
xmlHTTP.open("GET", "ISSLive/ISS.OEM_J2K_EPH.txt", true);
xmlHTTP.send();


function getClosestOEMOsv(ts)
{
    let minDelay = 0;
    let closestOsv = null;

    for (let indOsv = 0; indOsv < osvArray.length; indOsv++)
    {
        const osv = osvArray[indOsv];
        const delay = Math.abs(osv.ts - ts);
        
        if (indOsv == 0 || delay < minDelay)
        {
            minDelay = delay;
            closestOsv = osv;
        }
    }
    return closestOsv;
}