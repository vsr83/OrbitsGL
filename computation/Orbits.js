/**
 * Class used for the computation of the positions of planets in Heliocentric Ecliptic
 * coordinates using.
 */
class Orbit
{
    /**
     * Constructor.
     * Initialize orbit and Newton-Raphson parameters.
     * 
     * @param {*} name 
     *     The orbit name.
     * @param {*} params
     *     The orbital parameters in terms of coefficients for affine approximation. 
     * @param {*} nrTolerance 
     *     The tolerance for Newton-Raphson.
     * @param {*} nrIterations 
     *     The maximum number of Newton-Raphson iterations.
     */
    constructor(name, params, nrTolerance, nrIterations)
    {
        this.name = name
        this.nrIterations = nrIterations;
        this.nrTolerance = nrTolerance;

        this.a = params.a;           // Semi-major axis.
        this.e = params.e;           // Eccentricity.
        this.i = params.i;           // Inclination.
        this.Omega = params.Omega;   // Longitude of the ascending node.
        this.lP = params.lP;         // Longitude of periapsis.
        this.mL = params.mL;         // Mean longitude.
    }

    /**
     * Map angle to the interval [0, 2*pi].
     *  
     * @param {*} rad 
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
    solveEccentricAnomaly(M, e, tolerance, maxIterations)
    {
        let iterationCount = 0;
        let error = this.nrTolerance + 1.0;

        // Eccentric anomaly.
        let eA = M;

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
        return this.limitAngle(eA);
    }

    /**
     * Compute natural anomaly.
     * 
     * @param {*} eA 
     *     The eccentric anomaly (in degrees).
     * @param {*} e 
     *     The eccentricity.
     * @returns Natural anomaly (in degrees).
     */
    computeNaturalAnomaly(eA, e)
    {
        const xu = (Math.cos(eA) - e)/(1 - e*Math.cos(eA));
        const yu = Math.sqrt(1 - e * e) * Math.sin(eA) / (1 - e * Math.cos(eA));
        
        return this.limitAngle(Math.atan2(yu, xu));
    }

    /**
     * Convert degrees to radians.
     * 
     * @param {*} deg 
     *     The value in degrees.
     * @returns The value in radians.
     */
    deg2rad(deg)
    {
        return 2 * Math.PI * deg / 360.0; 
    }

    /**
     * Compute affine approximation for the orbital parameters using Julian time.
     * 
     * @param {*} JT 
     *     The Julian time.
     * @returns The parameters.
     */
    computeParameters(JT)
    {
        const refJT = 2451545.0;
        const dT = (JT - refJT) / 36525.0;

        const params = {};
        params.a = this.a[0] + dT * this.a[1];
        params.e = this.e[0] + dT * this.e[1];
        params.i = this.deg2rad(this.i[0] + dT * this.i[1]);
        params.Omega = this.deg2rad(this.Omega[0] + dT * this.Omega[1]);
        params.lP = this.deg2rad(this.lP[0] + dT * this.lP[1]);
        params.mL = this.deg2rad(this.mL[0] + 36525.0 * dT * this.mL[1]);

        return params;  
    }

    /**
     * Compute position in Heliocentric Ecliptic coordinates.
     * 
     * @param {*} params 
     *     The orbital parameters.
     * @returns The anomalies and the position in Heliocentric Ecliptic coordinates.
     */
    computePosition(params)
    {
        // Compute Mean, Eccentric and Natural aAomaly:
        const M = this.limitAngle(params.mL - params.lP);
        const E = this.solveEccentricAnomaly(M, params.e, this.nrTolerance, 
            this.nrIterations);
        const f = this.computeNaturalAnomaly(E, params.e);

        // Argument of Perihelion.
        const omega = params.lP - params.Omega;

        // Distance between the sun and the planet.
        const distance = params.a * (1.0 - params.e * Math.cos(E));

        const coordEc = Coordinates.rotateCartZ(
            Coordinates.rotateCartX(
                Coordinates.rotateCartZ({x : distance, y : 0, z : 0}, omega + f), 
            params.i), 
        params.Omega);

        const spherical = Coordinates.cartToSpherical(coordEc);
        
        return {M : M, E : E, f : f, omega : omega,
                x : coordEc.x, y : coordEc.y, z : coordEc.z,
                lon : spherical.theta, lat : spherical.phi, r : spherical.r};
    }
    
    /**
     * Print orbit and location parameters.
     * 
     * @param {*} params 
     *     The parameters.
     * @param {*} position 
     *     The position.
     */
    printParams(params, position)
    {
        const radDegStr = (rad) => {return rad + " rad " + Coordinates.rad2Deg(rad) + " deg";};

        console.log("Name: " + this.name);
        console.log(" Arg. of Perih.    (o): " + radDegStr(position.omega));
        console.log(" Mean Anomaly      (M): " + radDegStr(position.M));
        console.log(" Eccentric Anomaly (E): " + radDegStr(position.E));
        console.log(" Natural Anomaly   (f): " + radDegStr(position.f)) ;
        console.log("");
        console.log(" x (Ecliptic)         : " + position.x);
        console.log(" y (Ecliptic)         : " + position.y);
        console.log(" z (Ecliptic)         : " + position.z);
        console.log(" Longitude (Ecliptic) : " + radDegStr(position.lon));
        console.log(" Latitude (Ecliptic)  : " + radDegStr(position.lat));
        console.log("");
    }
}
