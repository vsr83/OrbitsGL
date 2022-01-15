// Handling of TLE input dialog.
const ListEnter = document.getElementById('TLEListEnter');
const ListCancel = document.getElementById('TLEListCancel');

ListEnter.onclick = function() 
{
    const TLEcontainer = document.getElementById('TLEListcontainer');
    const TLEinput = document.getElementById('TLEListinput');
    TLEcontainer.style.visibility = "hidden";

    const tleIn = TLEinput.value;
    const lines = tleIn.split('\n');
    const numElem = (lines.length + 1) / 3;

    satellites = [];
    for (let indElem = 0; indElem < Math.floor(numElem); indElem++)
    {
        const title = lines[indElem * 3];
        const tleLine1 = lines[indElem * 3 + 1];
        const tleLine2 = lines[indElem * 3 + 2];
        const satrec = satellite.twoline2satrec(tleLine1, tleLine2);

        satellites.push(satrec);
    }
}

ListCancel.onclick = function() 
{
    const TLEcontainer = document.getElementById('TLEListcontainer');
    TLEcontainer.style.visibility = "hidden";
}

