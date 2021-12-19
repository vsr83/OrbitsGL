/**
 * Class for the computation of Moon altitude.
 * The computation implements the algorithm in section 47 of 
 *   Meeus - Astronomical Algorithms, 1998.
 */
class MoonAltitude
{
    /**
     * Initialize orbital parameters and orbits.
     */
    constructor()
    {
        // Periodic terms for the longitude and distance of the Moon.
        // The unit is 0.000 001 degree for longitude and 0.001 kilometer for distance.
        // Table 47.A in Meeus - Astronomical algorithms 1998.
        this.lonTerms = [
        //   Multiple of    Coeff.sine Coeff. cosine
        //    D  Ms  Mm   F     
            [ 0,  0,  1,  0,    6288774,  -20905355],
            [ 2,  0, -1,  0,    1274027,   -3699111],
            [ 2,  0,  0,  0,     658314,   -2955968],
            [ 0,  0,  2,  0,     213618,    -569925],
            [ 0,  1,  0,  0,    -185116,      48888],
            [ 0,  0,  0,  2,    -114332,      -3149],
            [ 2,  0, -2,  0,      58793,     246158],
            [ 2, -1, -1,  0,      57066,    -152138],
            [ 2,  0,  1,  0,      53322,    -170733],
            [ 2, -1,  0,  0,      45758,    -204586],
            [ 0,  1, -1,  0,     -40923,    -129620],
            [ 1,  0,  0,  0,     -34720,     108743],
            [ 0,  1,  1,  0,     -30383,     104755],
            [ 2,  0,  0, -2,      15327,      10321],
            [ 0,  0,  1,  2,     -12528,          0],
            [ 0,  0,  1, -2,      10980,      79661],
            [ 4,  0, -1,  0,      10675,     -34782],
            [ 0,  0,  3,  0,      10034,     -23210],
            [ 4,  0, -2,  0,       8548,     -21636],
            [ 2,  1, -1,  0,      -7888,      24208],
            [ 2,  1,  0,  0,      -6766,      30824],
            [ 1,  0, -1,  0,      -5163,      -8379],
            [ 1,  1,  0,  0,       4987,     -16675],
            [ 2, -1,  1,  0,       4036,     -12831],
            [ 2,  0,  2,  0,       3994,     -10445],
            [ 4,  0,  0,  0,       3861,     -11650],
            [ 2,  0, -3,  0,       3665,      14403],
            [ 0,  1, -2,  0,      -2689,      -7003],
            [ 2,  0, -1,  2,      -2602,          0],
            [ 2, -1, -2,  0,       2390,      10056],
            [ 1,  0,  1,  0,      -2348,       6322],
            [ 2, -2,  0,  0,       2236,      -9884],
            [ 0,  1,  2,  0,      -2120,       5751],
            [ 0,  2,  0,  0,      -2069,          0],
            [ 2, -2, -1,  0,       2048,      -4950],
            [ 2,  0,  1, -2,      -1773,       4130],
            [ 2,  0,  0,  2,      -1595,          0],
            [ 4, -1, -1,  0,       1215,      -3958],
            [ 0,  0,  2,  2,      -1110,          0],
            [ 3,  0, -1,  0,       -892,       3258],
            [ 2,  1,  1,  0,       -810,       2616],
            [ 4, -1, -2,  0,        759,      -1897],
            [ 0,  2, -1,  0,       -713,      -2117],
            [ 2,  2, -1,  0,       -700,       2354],
            [ 2,  1, -2,  0,        691,          0],
            [ 2, -1,  0, -2,        596,          0],
            [ 4,  0,  1,  0,        549,      -1423],
            [ 0,  0,  4,  0,        537,      -1117],
            [ 4, -1,  0,  0,        520,      -1571],
            [ 1,  0, -2,  0,       -487,      -1739],
            [ 2,  1,  0, -2,       -399,          0],
            [ 0,  0,  2, -2,       -381,      -4421],
            [ 1,  1,  1,  0,        351,          0],
            [ 3,  0, -2,  0,       -340,          0],
            [ 4,  0, -3,  0,        330,          0],
            [ 2, -1,  2,  0,        327,          0],
            [ 0,  2,  1,  0,       -323,       1165],
            [ 1,  1, -1,  0,        299,          0],
            [ 2,  0,  3,  0,        294,          0],
            [ 2,  0, -1, -2,          0,       8752]
        ];

        // Periodic terms for the latitude of the moon.
        // The unit is 0.000 001 degree for longitude and 0.001 kilometer for distance.
        // Table 47.B in Meeus - Astronomical algorithms 1998.
        this.latTerms = [
          //  Multiple of    Coeff.sine 
          //  D  Ms  Mm   F     
            [ 0,  0,  0,  1,    5128122],
            [ 0,  0,  1,  1,     280602],
            [ 0,  0,  1, -1,     277693],
            [ 2,  0,  0, -1,     173237],
            [ 2,  0, -1,  1,      55413],
            [ 2,  0, -1, -1,      46271],
            [ 2,  0,  0,  1,      32573],
            [ 0,  0,  2,  1,      17198],
            [ 2,  0,  1, -1,       9266],
            [ 0,  0,  2, -1,       8822],
            [ 2, -1,  0, -1,       8216],
            [ 2,  0, -2, -1,       4324],
            [ 2,  0,  1,  1,       4200],
            [ 2,  1,  0, -1,      -3359],
            [ 2, -1, -1,  1,       2463],
            [ 2, -1,  0,  1,       2211],
            [ 2, -1, -1, -1,       2065],
            [ 0,  1, -1, -1,      -1870],
            [ 4,  0, -1, -1,       1828],
            [ 0,  1,  0,  1,      -1794],
            [ 0,  0,  0,  3,      -1749],
            [ 0,  1, -1,  1,      -1565],
            [ 1,  0,  0,  1,      -1491],
            [ 0,  1,  1,  1,      -1475],
            [ 0,  1,  1, -1,      -1410],
            [ 0,  1,  0, -1,      -1344],
            [ 1,  0,  0, -1,      -1335],
            [ 0,  0,  3,  1,       1107],
            [ 4,  0,  0, -1,       1021],
            [ 4,  0, -1,  1,        833],
            [ 0,  0,  1, -3,        777],
            [ 4,  0, -2,  1,        671],
            [ 2,  0,  0, -3,        607],
            [ 2,  0,  2, -1,        596],
            [ 2, -1,  1, -1,        491],
            [ 2,  0, -2,  1,       -451],
            [ 0,  0,  3, -1,        439],
            [ 2,  0,  2,  1,        422],
            [ 2,  0, -3, -1,        421],
            [ 2,  1, -1,  1,       -366],
            [ 2,  1,  0,  1,       -351],
            [ 4,  0,  0,  1,        331],
            [ 2, -1,  1,  1,        315],
            [ 2, -2,  0, -1,        302],
            [ 0,  0,  1,  3,       -283],
            [ 2,  1,  1, -1,       -229],
            [ 1,  1,  0, -1,        223],
            [ 1,  1,  0,  1,        223],
            [ 0,  1, -2, -1,       -220],
            [ 2,  1, -1, -1,       -220],
            [ 1,  0,  1,  1,       -185],
            [ 2, -1, -2, -1,        181],
            [ 0,  1,  2,  1,       -177],
            [ 4,  0, -2, -1,        176],
            [ 4, -1, -1, -1,        166],
            [ 1,  0,  1, -1,       -164],
            [ 4,  0,  1, -1,        132],
            [ 1,  0, -1, -1,       -119],
            [ 4, -1,  0, -1,        115],
            [ 2, -2,  0,  1,        107]
        ];
    }

    /**
     * Map angle to the interval [0, 2*pi].
     *  
     * @param {Number} rad 
     *     The angle (in radians).
     * @returns The mapped angle.
     */
    limitAngle(rad)
    {
        const interval = 2 * Math.PI;
        if (rad < 0)
        {
            rad += (1 + Math.floor(-rad / interval)) * interval;
        }
        else
        {
            rad = rad % interval;
        }
        return rad;
    }
      
    /**
     * Compute equitorial coordinates of the Moon.
     * 
     * @param {*} JT 
     *     Julian time.
     * @returns Right ascension and declination.
     */
    computeEquitorial(JT)
    {
        const T = (JT - 2451545.0)/36525.0;
        const T2 = T * T;
        const T3 = T2 * T;
        const T4 = T3 * T;
       
        // Meeus - Astronomical Algorithms 1998 Chapter 47.

        // Mean longitude of the Moon.
        const Lm = 218.3164477 + 481267.88123421 * T - 0.0015786 * T2 + T3 / 538841.0 - T4 / 65194000.0;
        // Mean elongation of the Moon from the Sun.
        const D  = 297.8501921 + 445267.11140340 * T - 0.0018819 * T2 + T3 / 545868.0 - T4 / 113065000.0;
        // Mean anomaly of the Sun (Earth).
        const Ms = 357.5291092 + 35999.050290900 * T - 0.0001536 * T2 + T3 / 24490000.0;
        // Mean anomaly of the Moon:
        const Mm = 134.9633964 + 477198.86750550 * T + 0.0087414 * T2 + T3 / 69699.0 - T4 / 14712000.0;
        // Moon's argument of latitude:
        const F  =  93.2720950 + 483202.01752330 * T - 0.0036539 * T2 - T3 / 3526000.0 + T4 / 863310000.0;

        const A1 = 119.75 + 131.849 * T;
        const A2 =  53.09 + 479264.290 * T;
        const A3 = 313.45 + 481266.484 * T;

        // Compute periodic terms for longitude, latitude and distance.
        const sigmaTerms = this.computeSigmaTerms(D, Ms, Mm, F, T);
        let sigmaL = sigmaTerms.sigmaL;
        const sigmaR = sigmaTerms.sigmaR;
        let sigmaB = sigmaTerms.sigmaB;

        sigmaL +=  3958 * MathUtils.sind(A1) + 1962 * MathUtils.sind(Lm - F) + 318 * MathUtils.sind(A2);
        sigmaB += -2235 * MathUtils.sind(Lm) + 382 * MathUtils.sind(A3) + 175 * MathUtils.sind(A1 - F) 
                  + 175 * MathUtils.sind(A1 + F) + 127 * MathUtils.sind(Lm - Mm) - 115 * MathUtils.sind(Lm + Mm);

        // Ecliptic longitude, latitude and distance.
        let lambda = Lm + sigmaL / 1000000.0;
        const beta   = sigmaB / 1000000.0;
        const Delta  = 385000.56 + sigmaR/1000.0;

        const nutTerms = Nutation.nutationTerms(T);
        const dpsi = nutTerms.dpsi;
        const deps = nutTerms.deps;

        lambda = lambda + dpsi;
        const eps = 23.4392911111 + deps;

        // Apparent Right-Ascension and declination.
        const alpha = MathUtils.atan2d(MathUtils.sind(lambda) * MathUtils.cosd(eps) - MathUtils.tand(beta) * MathUtils.sind(eps), MathUtils.cosd(lambda));
        const delta = MathUtils.asind(MathUtils.sind(beta) * MathUtils.cosd(eps) + MathUtils.cosd(beta) * MathUtils.sind(eps) * MathUtils.sind(lambda));
        
        // Meeus - Astronomical Algorithms 1998 Chapter 47 Example 47.a
        // provides reference result for 1992 April 12, at 0h TD:
        // JDE 2448724.5
        // T = -0.0077221081451
        // Lm = 134.290182 deg
        // D = 113.842304 deg
        // Ms = 97.643514 deg
        // Mm = 5.150833 deg
        // A1 = 109.57 deg.
        // A2 = 123.78 deg.
        // A3 = 229.53 deg.
        // E = 1.000194.
        // Sigma_l = -1 127 527
        // Sigma_b = -3 229126
        // Sigma_r = -16 590 875
        // lambda = 134.290182 deg
        // lambda = 133.167265 after nutation fixes.
        // beta = -3.229126 deg
        // Delta = 368409.7 km.
        // pi = 0.991990 deg
        // eps = 23.440646 deg
        // alpha = 134.688470 deg
        // delta = 13.768368 deg

        //console.log("JT        : " + JT);
        //console.log("T         : " + T);
        //console.log("Lm        : " + Lm % 360.0);
        //console.log("D         : " + D % 360.0);
        //console.log("Ms        : " + Ms % 360.0);
        //console.log("Mm        : " + Mm % 360.0);
        //console.log("F         : " + F % 360.0);
        //console.log("A1        : " + A1 % 360.0);
        //console.log("A2        : " + A2 % 360.0);
        //console.log("A3        : " + A3 % 360.0);
        //console.log("sigmaL    : " + sigmaL );
        //console.log("sigmaB    : " + sigmaB );
        //console.log("sigmaR    : " + sigmaR);

        //console.log("lambda    : " + lambda % 360);
        //console.log("beta      : " + beta % 360);
        //console.log("Delta     : " + Delta);
        //console.log("lambda    : " + lambda % 360);
        //console.log("eps       : " + eps % 360);
        //console.log("alpha     : " + alpha % 360);
        //console.log("delta     : " + delta % 360);

        return {rA : MathUtils.deg2Rad(alpha), decl : MathUtils.deg2Rad(delta)};
    }

    /**
     * Compute periodic terms term.
     * 
     * @param {*} D 
     *      Mean elongation of the Moon from the Sun
     * @param {*} Ms 
     *      Mean anomaly of the Sun (Earth).
     * @param {*} Mm 
     *      Mean anomaly of the Moon.
     * @param {*} F 
     *      Moon's argument of latitude.
     * @param {*} T 
     * @returns 
     */
    computeSigmaTerms(D, Ms, Mm, F, T)
    {
        const Ecorr = 1.0 - 0.002516 * T - 0.0000074 * T*T;
        const Ecorr2 = Ecorr * Ecorr;

        let sigmaL = 0.0; 
        let sigmaR = 0.0;
        let sigmaB = 0.0;

        let numTermsLon = this.lonTerms.length;
        for (let indTerm = 0; indTerm < numTermsLon; indTerm++)
        {
            let term = this.lonTerms[indTerm];
            
            let arg = term[0] * D + term[1] * Ms + term[2] * Mm + term[3] * F;

            let coeffSin = term[4];
            let coeffCos = term[5];

            if (term[1] == -1 || term[1] == 1)
            {
                coeffSin *= Ecorr;
                coeffCos *= Ecorr;
            }
            else if (term[1] == -2 || term[1] == 2)
            {
                coeffSin *= Ecorr2;
                coeffCos *= Ecorr2;
            }

            sigmaL += coeffSin * MathUtils.sind(arg);
            sigmaR += coeffCos * MathUtils.cosd(arg);
        }

        let numTermsLat = this.latTerms.length;
        for (let indTerm = 0; indTerm < numTermsLat; indTerm++)
        {
            let term = this.latTerms[indTerm];
            
            let arg = term[0] * D + term[1] * Ms + term[2] * Mm + term[3] * F;

            let coeffSin = term[4];

            if (term[1] == -1 || term[1] == 1)
            {
                coeffSin *= Ecorr;
            }
            else if (term[1] == -2 || term[1] == 2)
            {
                coeffSin *= Ecorr2;
            }

            sigmaB += coeffSin * MathUtils.sind(arg);
        }


        return {sigmaL : sigmaL, sigmaR : sigmaR, sigmaB : sigmaB};
    }
 
    /**
     * Compute altitude of the Moon.
     * 
     * @param {*} rA 
     *     Right-ascension of the Moon (in radians).
     * @param {*} decl 
     *     Declination of the Moon (in radians).
     * @param {*} JD 
     *     Julian day.
     * @param {*} JT 
     *     Julian time.
     * @param {*} longitude
     *     Longitude of the observer (in degrees).
     * @param {*} latitude 
     *     Latitude of the observer (in degrees).
     * @returns The altitude of the Moon.
     */
    computeAltitude(rA, decl, JD, JT, longitude, latitude)
    {
         // Compute hour angle of the Moon in equitorial coordinates.
         const ST0 = TimeConversions.computeSiderealTime(longitude, JD, JT);
         const h = Coordinates.deg2Rad(ST0) - rA;
 
         // Transform to horizontal coordinates and return altitude.
        const rHoriz = Coordinates.equitorialToHorizontal(h, decl, Coordinates.deg2Rad(latitude));            
        const altitude = Coordinates.rad2Deg(rHoriz.a);

        return altitude;
    }
 
    /**
     * Compute the longitude and latitude of the location, where Moon is at Zenith.
     * 
     * @param {*} rA 
     *     Right-ascension of the Moon (in radians).
     * @param {*} decl 
     *     Declination of the Moon (in radians).
     * @param {*} JD 
     *     Julian day.
     * @param {*} JT 
     *     Julian time.
     * @returns The longitude and latitude.
     */
    computeMoonLonLat(rA, decl, JD, JT)
    {
        const ST0 = TimeConversions.computeSiderealTime(0, JD, JT);
        const lon = Coordinates.rad2Deg(this.limitAngle(Math.PI + rA - Coordinates.deg2Rad(ST0))) - 180.0;
        let lat = Coordinates.rad2Deg(decl);
 
        if (lat > 90.0) 
        {
            lat -= 360.0;
        }

        //console.log("Longitude : " + lon % 360);
        //console.log("Latitude  : " + lat % 360);
 
        return {lon : lon, lat : lat};
    }
}