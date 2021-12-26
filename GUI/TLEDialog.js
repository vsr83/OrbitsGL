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

    if (lines.length >= 3)
    {
        const targetName = lines[0];
        const line1 = lines[1];
        const line2 = lines[2];

        if (line1.startsWith('1') && line2.startsWith('2'))
        {
            osvControls.targetName.setValue(targetName);
            satrec = satellite.twoline2satrec(lines[1], lines[2]);
            osvControls.source.setValue('TLE');
        }
        else
        {
            window.alert('Invalid TLE.');
        }
    }
    else
    {
        window.alert('Not enough lines.');
    }
}
TLECancel.onclick = function() 
{
    const TLEcontainer = document.getElementById('TLEcontainer');
    TLEcontainer.style.visibility = "hidden";
}
