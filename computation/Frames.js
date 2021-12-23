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
 
     const mat_11 = omega * -MathUtils.sind(LST);
     const mat_12 = omega * MathUtils.cosd(LST);
     const mat_21 = omega * -MathUtils.cosd(LST);
     const mat_22 = omega * -MathUtils.sind(LST);
 
     const v_ECEF_x = v_rot[0] + mat_11 * osv_CEP.r[0] + mat_12 * osv_CEP.r[1];
     const v_ECEF_y = v_rot[1] + mat_21 * osv_CEP.r[0] + mat_22 * osv_CEP.r[1];
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
 