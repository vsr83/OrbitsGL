/**
 * Static methods for handling of Coordinate System Transformations.
 */
 var Frames = {};

/**
 * Transformation from J2000 to ECEF coordinates.
 * 
 * @param {*} osv_J2000
 *      OSV in J2000 frame. 
 * @param {*} nutPar
 *      Nutation parameters.
 * @returns OSV in ECEF frame.
 */
Frames.osvJ2000ToECEF = function(osv_J2000, nutPar)
{
    const julian = TimeConversions.computeJulianTime(osv_J2000.ts);

    const osv_CEP = Frames.osvJ2000ToCEP(osv_J2000, nutPar);
    const rCEP = osv_CEP.r;
    const vCEP = osv_CEP.v;

    const osv_ECEF = {};

    const LST = TimeConversions.computeSiderealTime(0, julian.JD, julian.JT, nutPar);

    // Apply the Earth Rotation Matrix (A.32):
    osv_ECEF.r = MathUtils.rotZ(rCEP, -LST);
    osv_ECEF.ts = osv_J2000.ts;

    // Negative rotation with LST, corresponds to:
    // x' =  cosd(LST) * x + sind(LST) * y
    // y' = -sind(LST) * x + cosd(LST) * y
    // z' = z
    // Time derivative is:
    // v_x = (pi/180) * (1/86400) * dLST/dt * (-sind(LST) * x + cosd(LST) * y)
    // v_y = (pi/180) * (1/86400) * dLST/dt * (-cosd(LST) * x  -sind(LST) * y)
    // v_z = 0

    const dLSTdt = 1.00273790935 * 360.0 / 86400.0;
    const v_rot = MathUtils.rotZ(vCEP, -LST);
    const omega = (Math.PI / 180.0) * dLSTdt;

    const mat_11 = MathUtils.cosd(LST);
    const mat_12 = MathUtils.sind(LST);
    const mat_21 = -MathUtils.sind(LST);
    const mat_22 = MathUtils.cosd(LST);

    // Alternative expression for the GMST is \sum_{i=0}^3 k_i MJD^i.
    const k_0 = 100.460618375;
    const k_1 = 360.985647366;
    const k_2 = 2.90788e-13;
    const k_3 = -5.3016e-22;
    const MJD = julian.JT - 2451544.5;

    // Compute time-derivative of the GAST to convert velocities:
    const  dGASTdt = (1/86400.0) * (k_1 + 2*k_2*MJD + 3*k_3*MJD*MJD);
    const dRdt_11 = -dGASTdt * (Math.PI/180.0) * MathUtils.sind(LST);
    const dRdt_12 =  dGASTdt * (Math.PI/180.0) * MathUtils.cosd(LST);
    const dRdt_21 = -dGASTdt * (Math.PI/180.0) * MathUtils.cosd(LST);
    const dRdt_22 = -dGASTdt * (Math.PI/180.0) * MathUtils.sind(LST);
    //console.log(julian.JT + " " + LST);

    const v_ECEF_x = mat_11 * osv_CEP.v[0] + mat_12 * osv_CEP.v[1]
                    + dRdt_11 * osv_ECEF.r[0] + dRdt_12 * osv_ECEF.r[1];
    const v_ECEF_y = mat_21 * osv_CEP.v[0] + mat_22 * osv_CEP.v[1]
                    + dRdt_21 * osv_ECEF.r[0] + dRdt_22 * osv_ECEF.r[1];
    const v_ECEF_z = v_rot[2];

    osv_ECEF.v = [v_ECEF_x, v_ECEF_y, v_ECEF_z];

    // Rotation.
    return osv_ECEF;
}
 
/**
 * Transformation from J2000 to ECEF coordinates.
 * 
 * @param {*} osv_J2000
 *      OSV in J2000 frame. 
 * @param {*} nutPar
 *      Nutation parameters.
 * @returns OSV in ECEF frame.
 */
Frames.osvJ2000ToCEP = function(osv_J2000, nutPar)
{
    const julian = TimeConversions.computeJulianTime(osv_J2000.ts);

    // IAU 1976 Precession Model
    // (ESA GNSS Data Processing Vol.1 - A2.5.1)
    const T = (julian.JT - 2451545.0)/36525.0;

    // (A.23):
    const z    = 0.6406161388 * T + 3.0407777777e-04 * T*T + 5.0563888888e-06 *T*T*T;
    const nu   = 0.5567530277 * T - 1.1851388888e-04 * T*T - 1.1620277777e-05 *T*T*T;
    const zeta = 0.6406161388 * T + 8.3855555555e-05 * T*T + 4.9994444444e-06 *T*T*T;

    // Apply the Precession Matrix (A.22):
    const rMoD = MathUtils.rotZ(MathUtils.rotY(MathUtils.rotZ(osv_J2000.r, zeta), -nu), z);
    const vMoD = MathUtils.rotZ(MathUtils.rotY(MathUtils.rotZ(osv_J2000.v, zeta), -nu), z);

    // Apply the Nutation Matrix (A.24):
    if (nutPar == null)
    {
        nutPar = Nutation.nutationTerms(T);
    }
    const rCEP = MathUtils.rotX(MathUtils.rotZ(MathUtils.rotX(rMoD, -nutPar.eps), nutPar.dpsi), 
            nutPar.eps + nutPar.deps);
    const vCEP = MathUtils.rotX(MathUtils.rotZ(MathUtils.rotX(vMoD, -nutPar.eps), nutPar.dpsi), 
            nutPar.eps + nutPar.deps);
    
    return {r : rCEP, v: vCEP, ts: osv_J2000.ts};
}
  
/**
 * Convert J2000 position vector to CEP
 * @param {*} JT 
 *     Julian time.
 * @param {*} r 
 *      Position in J2000 coordinates.
 * @param {*} nutPar
 *      Nutation parameters.
 * @returns Position in CEP coordinates.
 */
Frames.posJ2000ToCEP = function(JT, r, nutPar)
{
    // IAU 1976 Precession Model
    // (ESA GNSS Data Processing Vol.1 - A2.5.1)
    const T = (JT - 2451545.0)/36525.0;
    
    // (A.23):
    const z    = 0.6406161388 * T + 3.0407777777e-04 * T*T + 5.0563888888e-06 *T*T*T;
    const nu   = 0.5567530277 * T - 1.1851388888e-04 * T*T - 1.1620277777e-05 *T*T*T;
    const zeta = 0.6406161388 * T + 8.3855555555e-05 * T*T + 4.9994444444e-06 *T*T*T;
    
    const rJ2000 = [r.x, r.y, r.z];

    // Apply the Precession Matrix (A.22):
    const rMOD = MathUtils.rotZ(MathUtils.rotY(MathUtils.rotZ(rJ2000, zeta), -nu), z);
    
    // Apply the Nutation Matrix (A.24):
    if (nutPar == null)
    {
        nutPar = Nutation.nutationTerms(T);
    }
    const rCEP = MathUtils.rotX(MathUtils.rotZ(MathUtils.rotX(rMOD, -nutPar.eps), nutPar.dpsi), 
            nutPar.eps + nutPar.deps);
        
    return {x: rCEP[0], y : rCEP[1], z : rCEP[2]};
}

/**
 * Convert CEP position vector to J2000.
 * 
 * @param {*} JT 
 *     Julian time.
 * @param {*} r 
 *      Position in CEP coordinates.
 * @param {*} nutPar
 *      Nutation parameters.
 * @returns Position in J2000 coordinates.
 */
Frames.posCEPToJ2000 = function(JT, rCEP, nutPar)
{
    // IAU 1976 Precession Model
    // (ESA GNSS Data Processing Vol.1 - A2.5.1)
    const T = (JT - 2451545.0)/36525.0;
    
    // (A.23):
    const z    = 0.6406161388 * T + 3.0407777777e-04 * T*T + 5.0563888888e-06 *T*T*T;
    const nu   = 0.5567530277 * T - 1.1851388888e-04 * T*T - 1.1620277777e-05 *T*T*T;
    const zeta = 0.6406161388 * T + 8.3855555555e-05 * T*T + 4.9994444444e-06 *T*T*T;

    // Apply the Nutation Matrix (A.24):
    if (nutPar == null)
    {
        nutPar = Nutation.nutationTerms(T);
    }
    const rMOD = MathUtils.rotX(MathUtils.rotZ(MathUtils.rotX(rCEP, -(nutPar.eps + nutPar.deps)), -nutPar.dpsi), nutPar.eps);
    
    // Apply the Precession Matrix (A.22):
    const rJ2000 = MathUtils.rotZ(MathUtils.rotY(MathUtils.rotZ(rMOD, -z), nu), -zeta);
        
    return rJ2000;
}
 
 
/**
 * 
 * @param {*} JT 
 * @returns 
 */
Frames.getMODParams = function(JT)
{
    // IAU 1976 Precession Model
    // (ESA GNSS Data Processing Vol.1 - A2.5.1)
    const T = (JT - 2451545.0)/36525.0;
    
    // (A.23):
    const z    = 0.6406161388 * T + 3.0407777777e-04 * T*T + 5.0563888888e-06 *T*T*T;
    const nu   = 0.5567530277 * T - 1.1851388888e-04 * T*T - 1.1620277777e-05 *T*T*T;
    const zeta = 0.6406161388 * T + 8.3855555555e-05 * T*T + 4.9994444444e-06 *T*T*T;

    return {z : z, nu : nu, zeta : zeta};
}

/**
 * Transformation from CEP to ECEF.
 * 
 * @param {*} JT
 *      Julian time.
 * @param {*} JD
 *      Julian date.
 * @param {*} rCEP
 *      Position in CEP coordinates.
 * @returns Position in ECEF frame.
 */
Frames.posCEPToECEF = function(JT, JD, rCEP)
{
    let osv_ECEF = {};
    let LST = TimeConversions.computeSiderealTime(0, JD, JT);
    // Apply the Earth Rotation Matrix (A.32):
    rECEF = MathUtils.rotZ([rCEP.x, rCEP.y, rCEP.z], -LST);

    // console.log(rCEP);
    // console.log(LST);
    // console.log(rECEF);

    return rECEF;
}

/**
 * Transformation from ECEF to CEP.
 * 
 * @param {*} JT
 *      Julian time.
 * @param {*} JD
 *      Julian date.
 * @param {*} rECEF
 *      Position in ECEF coordinates.
 * @param {*} nutPar
 *      Nutation parameters.
 * @returns Position in CEP frame.
 */
Frames.posECEFToCEP = function(JT, JD, rECEF, nutPar)
{
    let osv_ECEF = {};
    let LST = TimeConversions.computeSiderealTime(0, JD, JT, nutPar);
    // Apply the Earth Rotation Matrix (A.32):
    rCEP = MathUtils.rotZ(rECEF, LST);

    return rCEP;
}
 
