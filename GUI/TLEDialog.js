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
            updateTLEControls(targetName, line1, line2);
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

/**
 * Update TLE controls with a TLE.
 * 
 * @param {*} targetName 
 *      Target name.
 * @param {*} line1 
 *      The first line.
 * @param {*} line2 
 *      The second line.
 */
function updateTLEControls(targetName, line1, line2)
{
    tleControls.tleSatName.setValue(targetName);
    tleControls.tleLaunchYear.setValue(line1.substring(9, 11).replace(/ /g, '_'));
    tleControls.tleLaunchNumber.setValue(line1.substring(11, 14).replace(/ /g, '_'));
    tleControls.tlePiece.setValue(line1.substring(14, 17).replace(/ /g, '_'));
    tleControls.tleYear.setValue(line1.substring(18, 20).replace(/ /g, ''));
    tleControls.tleDay.setValue(line1.substring(20, 32).replace(/ /g, ''));
    tleControls.tleBalDer.setValue(line1.substring(33, 43).replace(/ /g, ''));
    //tleControls.tleSecDer.setValue(line1.substring(44, 52).replace(/ /g, ''));
    tleControls.tleDragTerm.setValue(line1.substring(53, 61).replace(/ /g, '_'));    
    tleControls.tleElemSetNumber.setValue(line1.substring(64, 68).replace(/ /g, '_'));

    tleControls.tleCatalogNo.setValue(line2.substring(2, 7).replace(/ /g, ''));
    tleControls.tleInclination.setValue(line2.substring(8, 16).replace(/ /g, ''));
    tleControls.tleRA.setValue(line2.substring(17, 25).replace(/ /g, ''));
    tleControls.tleEccentricity.setValue('0.' + line2.substring(26, 33).replace(/ /g, ''));
    tleControls.tleArgPerigee.setValue(line2.substring(34, 42).replace(/ /g, ''));
    tleControls.tleMeanAnomaly.setValue(line2.substring(43, 51).replace(/ /g, ''));
    tleControls.tleMeanMotion.setValue(line2.substring(52, 63).replace(/ /g, ''));
    tleControls.tleRev.setValue(line2.substring(63, 68).replace(/ /g, '_'));
}

/**
 * Compute a checmsum for a TLE line.
 * 
 * @param {*} line 
 *     The line.
 * @returns The checksum.
 */
function checksumTLE(line) 
{
    console.log('computing checksum for ');
    console.log(line);

    let checksum = 0; 
    for (let ind = 0; ind < line.length; ind++)
    {
        const char = line[ind];

        if ('0123456789'.indexOf(char) > -1)
        {
            checksum += parseInt(char);
        }
        else if (char == '-')
        {
            checksum++;
        }
        console.log(char + " " + checksum);
    }
    return checksum % 10;
}

/**
 * Convert floating point with value below 1000 into string with configurable number of 
 * decimals.
 * 
 * @param {*} value 
 *      The value.
 * @param {*} decimals 
 *      The number of decimals.
 * @returns  The string.
 */
function createTLEFloat34(value, decimals)
{
    let padding = '';
    if (value < 100.0 && value >= 10.0)
    {
        padding = ' ';
    }
    else if (value < 10.0)
    {
        padding = '  ';
    }

    return padding + value.toFixed(decimals);
}

/**
 * Convert floating point value to a string with 8 decimals and value below 100.
 * 
 * @param {*} value 
 *      The floating point value.
 * @returns The string.
 */
function createTLEFloat28(value)
{
    let padding = '';
    if (value < 10.0)
    {
        padding = ' ';
    }

    return padding + value.toFixed(8);
}

/**
 * Create TLE from controls.
 * 
 * @returns TLE as a string.
 */
function createTLE()
{
    // TODO: The following does not do practically any verification of the use input.

    const line0 = guiControls.tleSatName;
    // Satellite catalog number + classification.
    const catalogNumber = guiControls.tleCatalogNo.replace(/_/g, ' ') + 'U';
    // International Designator consists of three parts.
    const intDesign = guiControls.tleLaunchYear + guiControls.tleLaunchNumber + guiControls.tlePiece.replace(/_/g, ' ');
    // Epoch year + Epoch day.
    const epoch = guiControls.tleYear + createTLEFloat34(parseFloat(guiControls.tleDay), 8).replace(/ /g, '0');
    // First derivative of mean motion.
    let balDer = parseFloat(guiControls.tleBalDer.replace(/_/g, ''));
    balDer = balDer.toFixed(8);
    if (balDer >= 0.0)
    {
        balDer = ' ' + balDer.substring(1, 10);
    }
    else
    {
        balDer = '-' + balDer.substring(2, 11);
    }
    // Second derivative of mean motion.
    const secDer = ' 00000+0';

    // Drag term.
    let dragTerm = guiControls.tleDragTerm.replace(/_/g, ' ');
    // Element set number
    const elemSetNumber = guiControls.tleElemSetNumber.replace(/_/g, ' ');

    let line1 = '1 ' + catalogNumber + ' ' + intDesign + ' ' + epoch + ' ' + balDer + ' ' + secDer 
                + ' ' + dragTerm + ' 0 ' + elemSetNumber;

    const inclination = createTLEFloat34(parseFloat(guiControls.tleInclination), 4);
    const RA = createTLEFloat34(parseFloat(guiControls.tleRA), 4);
    const eccentricity = parseFloat(guiControls.tleEccentricity).toFixed(7).substring(2, 10);
    const argPerigee = createTLEFloat34(parseFloat(guiControls.tleArgPerigee), 4);
    const meanAnomaly = createTLEFloat34(parseFloat(guiControls.tleMeanAnomaly), 4);
    const meanMotion = createTLEFloat28(parseFloat(guiControls.tleMeanMotion));
    const revolution = guiControls.tleRev.replace('_', ' ');

    let line2 = '2 ' + catalogNumber.substring(0, 5) + ' ' + inclination + ' ' + RA + ' ' + eccentricity + ' ' 
              + argPerigee + ' ' + meanAnomaly + ' ' + meanMotion + revolution;

    line1 = line1 + checksumTLE(line1);
    line2 = line2 + checksumTLE(line2);

    return line0 + '\n' + line1 + '\n' + line2;
}

/**
 * Create TLE from OSV.
 */
function createTLEOSV()
{
    function toNonNegative(angle) 
    {
        if (angle < 0)
        {
            return angle + 360;
        }
        else
        {
            return angle;
        }
    }

    console.log('createTLEOSV');
    const osvProp = ISS.osvProp;
    const ts = osvProp.ts;

    console.log(osvProp);

    const kepler = Kepler.osvToKepler(osvProp.r, osvProp.v, ts);
    console.log(kepler);

    const utcDiffMinutes = ts.getTimezoneOffset();
    const epochYear = ts.getUTCFullYear();
    const yearStart = new Date(epochYear, 0, 0);
    let diff = ts - yearStart;
    diff += 1000 * 60 * utcDiffMinutes;
    const msPerDay = 86400.0 * 1000.0;
    const epochDay = diff / msPerDay;

    console.log('Computing TLE:');
    console.log('Epoch Year: ' + epochYear);
    console.log('Epoch Day: ' + epochDay);
    tleControls.tleLaunchYear.setValue('00');
    tleControls.tleLaunchNumber.setValue('000');
    tleControls.tlePiece.setValue('A__');
    tleControls.tleYear.setValue(epochYear.toString().substring(2, 4));
    tleControls.tleDay.setValue(epochDay);
    tleControls.tleBalDer.setValue('_.00000000');
    tleControls.tleDragTerm.setValue('_00000-1');
    tleControls.tleElemSetNumber.setValue('_999');
    tleControls.tleCatalogNo.setValue('00000');
    tleControls.tleInclination.setValue(kepler.incl);
    tleControls.tleRA.setValue(toNonNegative(kepler.Omega));
    tleControls.tleEccentricity.setValue(kepler.ecc_norm);
    tleControls.tleArgPerigee.setValue(toNonNegative(kepler.omega));
    tleControls.tleMeanAnomaly.setValue(toNonNegative(kepler.M));

    const period = Kepler.computePeriod(kepler.a, kepler.mu);
    const meanMotion = 86400.0 / period;
    tleControls.tleMeanMotion.setValue(meanMotion);

    tleControls.tleRev.setValue('00000');
}