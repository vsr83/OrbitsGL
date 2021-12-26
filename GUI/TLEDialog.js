// Handling of TLE input dialog.
const TLEEnter = document.getElementById('TLEEnter');
const TLECancel = document.getElementById('TLECancel');

TLEEnter.onclick = function() 
{
    const TLEcontainer = document.getElementById('TLEcontainer');
    const TLEinput = document.getElementById('TLEinput');
    TLEcontainer.style.visibility = "hidden";

    const tleIn = TLEinput.value;
    const lines = tleIn.split('\n');
    console.log(lines);
    osvControls.targetName.setValue(lines[0]);
    satrec = satellite.twoline2satrec(lines[1], lines[2]);
    osvControls.enableTelemetry.setValue(0);
    osvControls.enableTLE.setValue(true);
}
TLECancel.onclick = function() 
{
    const TLEcontainer = document.getElementById('TLEcontainer');
    TLEcontainer.style.visibility = "hidden";
}
