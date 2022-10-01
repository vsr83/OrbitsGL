function setTarget(targetName)
{
    const satIndex = satNameToIndex[targetName];
    const lines = satLines[satIndex];
    const satellite = satellites[satIndex];

    osvControls.targetName.setValue(targetName);
    satrec = satellites[satIndex];
    osvControls.source.setValue('TLE');
    updateTLEControls(targetName, lines[1], lines[2]);
}

const autoCompleteTargetList = [];

// Initialize autocomplete.
const autoCompleteJS = new autoComplete({
    placeHolder: "Search for a target",
    data: {
        src: autoCompleteTargetList, 
        cache: true,
    },
    resultItem: {
        highlight: true
    },
    resultsList:{
        tabSelect: true,
        noResults: true
    },
    events: {
        input: {
            selection: (event) => {
                const selection = event.detail.selection.value;
                autoCompleteJS.input.value = selection;
                setTarget(selection);
            }
        }
    }
});
