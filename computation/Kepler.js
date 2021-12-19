/**
 * Static methods for handling of Keplerian orbits.
 */
var Kepler = {};

/**
 * Compute natural anomaly.
 * 
 * @param {*} ecc_norm 
 *      The eccentricity.
 * @param {*} E 
 *      The eccentric anomaly.
 * @returns 
 */
Kepler.computeNaturalAnomaly = function(ecc_norm, E)
{
    let xu = (MathUtils.cosd(E) - ecc_norm) / (1.0 - ecc_norm * MathUtils.cosd(E));
    let yu = Math.sqrt(1 - ecc_norm * ecc_norm) * MathUtils.sind(E) / (1.0 - ecc_norm * MathUtils.cosd(E));

    return MathUtils.atan2d(yu, xu);
}

/**
 * Compute period in seconds.
 * 
 * @param {*} a 
 *      The semi-major axis.
 * @param {*} mu 
 *      The standard gravitational parameter of the central body.
 * @returns The period.
 */
Kepler.computePeriod = function(a, mu)
{
    return 2 * Math.PI * Math.sqrt(a * a * a / mu);
}

/**
 * Solve eccentric anomaly using Newton-Raphson.
 * 
 * @param {*} M 
 *     The mean anomaly (in degrees).
 * @param {*} e 
 *     The eccentricity.
 * @param {*} tolerance 
 *     The tolerance for the Newton-Raphson iteration.
 * @param {*} maxIterations 
 *     The maximum number of iterations.
 * @returns The eccentric anomaly (in degrees).
 */
Kepler.solveEccentricAnomaly = function(M, e, tolerance, maxIterations)
{
    let iterationCount = 0;
    let error = this.nrTolerance + 1.0;

    // Eccentric anomaly.
    let eA = MathUtils.deg2Rad(M);

    while (error > this.nrTolerance)
    {
        iterationCount++;

        if (iterationCount > maxIterations)
        {
            // TODO: throw exception
        }

        eA -= (eA - e * Math.sin(eA) - M) / (1 - e * Math.cos(eA));
        error = Math.abs(eA - e * Math.sin(eA) - M);
    }

    // Iteration successful.
    return MathUtils.rad2Deg(eA);
}

/**
 * Compute Osculating Keplerian elements from Orbit State Vector (OSV).
 * 
 * @param {*} r 
 *      The position as a three-dimensional vector.
 * @param {*} v 
 *      The velocity as a three-dimensional vector.
 * @param {Date} ts
 *      The time stamp associated to the mean anomaly.
 */
Kepler.osvToKepler = function(r, v, ts)
{
    const kepler = {};

    kepler.ts = ts;

    const incl_min = 1e-7;
    // Standard gravitational parameter for Earth (m^3/s^2)
    const mu = 3.986004418e14;

    kepler.mu = mu;

    // Angular momentum per unit mass:
    kepler.k = MathUtils.cross(r, v);

    // Eccentricity vector.
    kepler.ecc = MathUtils.vecsub(MathUtils.vecmul(MathUtils.cross(v, kepler.k), 1.0 / mu), 
        MathUtils.vecmul(r, 1.0 / MathUtils.norm(r)));
    kepler.ecc_norm = MathUtils.norm(kepler.ecc);

    // Inclination:
    kepler.incl = MathUtils.acosd(kepler.k[2] / MathUtils.norm(kepler.k));

    // Energy integral.
    kepler.h = 0.5 * MathUtils.norm(v) * MathUtils.norm(v) - mu / MathUtils.norm(r);

    // Semi-major axis.
    kepler.a = -mu / (2.0 * kepler.h);
    // Semi-minor axis.
    kepler.b = kepler.a * Math.sqrt(1 - kepler.ecc_norm * kepler.ecc_norm);

    // Longitude of ascending node.
    kepler.Omega = MathUtils.atan2d(kepler.k[0], -kepler.k[1]);

    // Argument of periapsis.
    kepler.omega = 0;
    if (kepler.incl < incl_min)
    {
        kepler.omega = MathUtils.atan2d(kepler.ecc[1], kepler.ecc[0]) - kepler.Omega;
    }
    else
    {
        // We wish to avoid division by zero and thus use the formula, which has larger
        // absolute value for the denominator:
        if (Math.abs(MathUtils.sind(kepler.Omega)) < Math.abs(MathUtils.cosd(kepler.Omega)))
        {
            const asc_y = kepler.ecc[2] / MathUtils.sind(kepler.incl);
            const asc_x = (1 / MathUtils.cosd(kepler.Omega)) * (kepler.ecc[0] + 
                MathUtils.sind(kepler.Omega) * MathUtils.cosd(kepler.incl) * kepler.ecc[2] / 
                MathUtils.sind(kepler.incl));

            kepler.omega = MathUtils.atan2d(asc_y, asc_x);
        }
        else
        {
            const asc_y = kepler.ecc[2] / MathUtils.sind(kepler.incl);
            const asc_x = (1 / MathUtils.sind(kepler.Omega)) * (kepler.ecc[1] - 
                MathUtils.cosd(kepler.Omega) * MathUtils.cosd(kepler.incl) * kepler.ecc[2] / 
                MathUtils.sind(kepler.incl));

            kepler.omega = MathUtils.atan2d(asc_y, asc_x);
        }
    }

    // Eccentric anomaly.
    kepler.r_orbital = MathUtils.rotZ(MathUtils.rotX(MathUtils.rotZ(r, -kepler.Omega), -kepler.incl), -kepler.omega);
    kepler.E = MathUtils.atan2d(kepler.r_orbital[1] / kepler.b, kepler.r_orbital[0] / kepler.a + kepler.ecc_norm);

    // Mean anomaly.
    kepler.M = kepler.E - kepler.ecc_norm * MathUtils.sind(kepler.E);

    // Natural anomaly.
    /*let xu = (MathUtils.cosd(kepler.E) - kepler.ecc_norm) / 
        (1.0 - kepler.ecc_norm * MathUtils.cosd(kepler.E));
    let yu = Math.sqrt(1 - kepler.ecc_norm * kepler.ecc_norm) * MathUtils.sind(kepler.E) / 
        (1.0 - kepler.ecc_norm * MathUtils.cosd(kepler.E));
    kepler.f = MathUtils.atan2d(yu, xu);

    // Longitude of periapsis.
    kepler.l = kepler.Omega + kepler.omega;

    // Mean longitude.
    kepler.L = kepler.l + kepler.M;

    // The period.
    kepler.T = 2 * Math.PI * Math.sqrt(kepler.a * kepler.a * kepler.a / mu);
    */

    return kepler;
}

/**
 * Estimate OSV at a given date from Keplerian elements.
 * 
 * @param {*} kepler 
 *      The Keplerian elements.
 * @param {*} dateIn 
 *      The date.
 * @returns OSV
 */
Kepler.propagate = function(kepler, dateIn)
{
    if (kepler.a == 0)
    {
        return;
    }

    // Compute difference between target time and the time stamp associated to the Keplerian elements.
    const diff = dateIn.getTime() - kepler.ts.getTime();

    // Propagate mean anomaly according to the computed difference and solve natural anoamaly.
    const Mext = kepler.M + 360.0 * diff / (Kepler.computePeriod(kepler.a, kepler.mu) * 1000.0);
    const Eext = this.solveEccentricAnomaly(Mext, kepler.ecc_norm, 1e-7, 10);
    const fext = this.computeNaturalAnomaly(kepler.ecc_norm, Eext);

    const r_orbital = [kepler.a * (MathUtils.cosd(Eext) - kepler.ecc_norm), kepler.b * MathUtils.sind(Eext), 0];

    const dEdt = (Math.sqrt(kepler.mu) / (Math.pow(kepler.a, 1.5))) / (1.0 - kepler.ecc_norm * MathUtils.cosd(Eext));
    const v_orbital = [-kepler.a * dEdt * MathUtils.sind(Eext), kepler.b * dEdt * MathUtils.cosd(Eext), 0];

    const r_ext = MathUtils.rotZ(MathUtils.rotX(MathUtils.rotZ(r_orbital, kepler.omega), kepler.incl), kepler.Omega);
    const v_ext = MathUtils.rotZ(MathUtils.rotX(MathUtils.rotZ(v_orbital, kepler.omega), kepler.incl), kepler.Omega);

    return {r: r_ext, v: v_ext, ts: dateIn};
}
