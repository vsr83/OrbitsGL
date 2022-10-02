// Handling of TLE input dialog.
const ListEnter = document.getElementById('TLEListEnter');
const ListCancel = document.getElementById('TLEListCancel');
const TLEinput = document.getElementById('TLEListinput');

ListEnter.onclick = function() 
{
    const TLEcontainer = document.getElementById('TLEListcontainer');
    const TLEselectList = document.getElementById('TLESelectlist');
    TLEcontainer.style.visibility = "hidden";
    const tleIn = TLEinput.value;
    const lines = tleIn.split('\n');
    const numElem = (lines.length + 1) / 3;

    satellites = [];
    satelliteNames = [];
    satNameToIndex = [];
    let innerHTML = "";

    autoCompleteTargetList.length = 0;
    for (let indElem = 0; indElem < Math.floor(numElem); indElem++)
    {
        let title = lines[indElem * 3].trim();

        if (satelliteNames.includes(title))
        {
            title = title + "_" + indElem;
        }

        const tleLine1 = lines[indElem * 3 + 1];
        const tleLine2 = lines[indElem * 3 + 2];
        const satrec = satellite.twoline2satrec(tleLine1, tleLine2);

        satellites.push(satrec);
        satLines.push([title, tleLine1, tleLine2]);
        satelliteNames.push(title);
        autoCompleteTargetList.push(title);
        satNameToIndex[title] = indElem;
    }
    satelliteNames.sort();

    for (let indName = 0; indName < satelliteNames.length; indName++)
    {
        const satName = satelliteNames[indName];
        innerHTML += '<option value="' + satName + '">' + satName + "</option>";         
    }

    autoCompleteJS.data.src = satelliteNames;

    // IMPORTANT: For performance, the text area must be cleared.
    TLEinput.value = "";

    //<option value="ISS">ISS</option>

    TLEselectList.innerHTML = innerHTML;
    displayControls.enableList.setValue(true);
}

ListCancel.onclick = function() 
{
    const TLEcontainer = document.getElementById('TLEListcontainer');
    TLEcontainer.style.visibility = "hidden";
}

