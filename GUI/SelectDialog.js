// Handling of TLE input dialog.
const SelectEnter = document.getElementById('TLESelectEnter');
const SelectCancel = document.getElementById('TLESelectCancel');
const SelectContainer = document.getElementById('TLESelectcontainer');
const SelectList = document.getElementById('TLESelectlist');

SelectEnter.onclick = function() 
{
    if (satellites.length > 0)
    {
        console.log(SelectList.value); 
        const targetName = SelectList.value;
        const satIndex = satNameToIndex[targetName];
        const lines = satLines[satIndex];
        const satellite = satellites[satIndex];

        osvControls.targetName.setValue(targetName);
        satrec = satellites[satIndex];
        osvControls.source.setValue('TLE');
        updateTLEControls(targetName, lines[1], lines[2]);
    }

    SelectContainer.style.visibility = "hidden";
}

SelectCancel.onclick = function() 
{
    SelectContainer.style.visibility = "hidden";
}

