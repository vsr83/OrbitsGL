var Coordinates = {};

// Simple methods for sum ,differences and rotations of vectors in Cartesian coordinates.
Coordinates.sumCart = (p, dp) => {return {x : p.x + dp.x, y : p.y + dp.y, z : p.z + dp.z};};
Coordinates.diffCart = (p, dp) => {return {x : p.x - dp.x, y : p.y - dp.y, z : p.z - dp.z};};
Coordinates.rotateCartX = (p, angle) => {return {x : p.x, 
                                                 y : Math.cos(angle) * p.y - Math.sin(angle) * p.z,
                                                 z : Math.sin(angle) * p.y + Math.cos(angle) * p.z};};
Coordinates.rotateCartY = (p, angle) => {return {x : Math.cos(angle) * p.x + Math.sin(angle) * p.z, 
                                                 y : p.y,
                                                 z : -Math.sin(angle) * p.x + Math.cos(angle) * p.z};};
Coordinates.rotateCartZ = (p, angle) => {return {x : Math.cos(angle) * p.x - Math.sin(angle) * p.y, 
                                                 y : Math.sin(angle) * p.x + Math.cos(angle) * p.y,
                                                 z : p.z};};

// Conversions between Cartesian and spherical coordinates.
toNonNegative = (angle) => {return angle < 0 ? angle + 2 * Math.PI : angle;};
Coordinates.cartToSpherical = (p) => {return {theta : (Math.atan2(p.y, p.x)),
                                              phi : (Math.atan(p.z / Math.sqrt(p.y*p.y + p.x*p.x))),
                                              r : Math.sqrt(p.x*p.x + p.y*p.y + p.z*p.z)}};

// Conversion between radians and degrees.
Coordinates.rad2Deg = (rad) => {return 360.0 * rad / (2*Math.PI)};
Coordinates.deg2Rad = (deg) => {return 2 * Math.PI * deg / 360.0};
                                              
/**
 * Convert from equitorial to horizontal coordinate systems.
 * 
 * @param {*} h     
 *     Hour angle.
 * @param {*} delta 
 *     Declination.
 * @param {*} phi   
 *     Latitude.
 * @returns The elevation and azimuth.
 */
Coordinates.equitorialToHorizontal = (h, delta, phi) => { 
    return {
     a : Math.asin(Math.cos(h)*Math.cos(delta)*Math.cos(phi) + Math.sin(delta)*Math.sin(phi)),
     A : Math.PI + Math.atan2(Math.sin(h)*Math.cos(delta), Math.cos(h)*Math.cos(delta)*Math.sin(phi) - Math.sin(delta)*Math.cos(phi))};};

/**
 * Convert from horizontal to equitorial coordinate systems.
 * 
 * @param {*} a 
 *     Altitude.
 * @param {*} A 
 *     Azimuth.
 * @param {*} phi
 *     Latitude. 
 * @returns The declination and hour angle.
 */
Coordinates.horizontalToEquitorial = (a, A, phi) => {
    delta = Math.asin(-Math.cos(A)*Math.cos(a)*Math.cos(phi) + Math.sin(a)*Math.sin(phi));
    return {
     delta : delta,
     h : Math.atan2(Math.sin(A) * Math.cos(a) / Math.cos(delta) , 
                   (Math.cos(A) * Math.cos(a) * Math.sin(phi) + Math.sin(a) * Math.cos(phi)) / Math.cos(delta))
    }
}

/**
 * Convert value in degrees to hours, minutes and seconds.
 * 
 * @param {*} deg 
 *     The value in degrees.
 * @returns The value in hours, minutes and seconds.
 */
Coordinates.deg2Time = (deg) => {
    if (deg < 0)
    {
        deg += 360;
    }
    h = Math.floor(24.0 * deg / 360.0);
    deg -= h * 360.0 / 24.0;
    m = Math.floor(24.0 * 60.0 * deg / 360.0);
    deg -= m * 360.0 / (24.0 * 60.0);
    s = Math.floor(24.0 * 60.0 * 60.0 * deg / 360.0);
    deg -= s * 360.0 / (24.0 * 60.0 * 60.0);

    return {h:h, m:m, s:s}
}

Coordinates.wgs84ToCart = (lat, lon, h) => {
    const a = 6378137.0;
    const b = 6356752.314245;
    const e = Math.sqrt((a*a - b*b) / (a*a));

    const sinLat = Math.sin(Coordinates.deg2Rad(lat));
    const N = a / Math.sqrt(1 - e * e * sinLat * sinLat);
    
    const x = (N + h) * Math.cos(Coordinates.deg2Rad(lat)) * Math.cos(Coordinates.deg2Rad(lon));
    const y = (N + h) * Math.cos(Coordinates.deg2Rad(lat)) * Math.sin(Coordinates.deg2Rad(lon));
    const z = ((1 - e*e) * N + h) * Math.sin(Coordinates.deg2Rad(lat));

    return [x, y, z];
}

/**
 * Convert from Cartesian to WGS 84 spherical coordinates.
 * 
 * @param {*} r 
 *      Cartesian coordinate vector in ECEF frame.
 * @returns The latitude and longitude.
 */
Coordinates.cartToWgs84 = (r) => {
    const lon = Coordinates.rad2Deg(Math.atan2(r[1], r[0]));

    const p = Math.sqrt(r[0]*r[0] + r[1]*r[1]);
    const a = 6378137.0;
    const b = 6356752.314245;
    const e = Math.sqrt((a*a - b*b) / (a*a));
    
    let lat = Coordinates.rad2Deg(Math.atan(r[2]/((1 - e*e)*p)));
    let h = 0;

    for (let iter = 0; iter < 5; iter++)
    {
        let sinPrev = Math.sin(Coordinates.deg2Rad(lat));
        let cosPrev = Math.cos(Coordinates.deg2Rad(lat));

        const N = a / Math.sqrt(1 - e*e*sinPrev*sinPrev);
        h = p / cosPrev - N;

        const d = (1 - e*e*N/(N + h)) * p;
        lat = Coordinates.rad2Deg(Math.atan(r[2] / d));
    }

    return {lat : lat, lon : lon, h : h};
}