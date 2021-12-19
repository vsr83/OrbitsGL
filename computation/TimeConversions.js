/**
 * Static methods for the computation of the Julian and sidereal time.
 */
var TimeConversions = {};

/**
 * Compute Julian day.
 * 
 * @param {int} year
 *     Year. 
 * @param {int} month
 *     Month of the year (1-12). 
 * @param {int} mday 
 *     Day of the month (1-31).
 * @returns The Julian day.
 */
TimeConversions.computeJulianDay = function(year, month, mday)
{
    const A = Math.floor(year / 100);
    const B = Math.floor(A / 4.0);
    const C = Math.floor(2.0 - A + B);
    const E = Math.floor(365.25 * (year + 4716.0));
    const F = Math.floor(30.6001 * (month + 1));
    return C + mday + E + F - 1524.5;
}

/**
 * Compute Julian Time from a given Date object.
 * 
 * @param {Date} d 
 *     Date object. 
 * @returns Julian Time.
 */
TimeConversions.computeJulianTime = function(d)
{
    let year = d.getUTCFullYear();
    let month = d.getUTCMonth() + 1;

    if (month < 3)
    {
        year--;
        month+=12;
    }

    const JD = this.computeJulianDay(year, month, d.getUTCDate());

    const JT = JD + d.getUTCHours()/24.0 + d.getUTCMinutes()/(24.0 * 60.0) + d.getUTCSeconds()/(24.0 * 60.0 * 60.0)
            + d.getUTCMilliseconds()/(24.0 * 60.0 * 60.0 * 1000.0);
    
    return {JT : JT, JD : JD};
}

/**
 * Compute Greenwich Apparent Sidereal Time (GAST).
 * 
 * @param {*} longitude 
 *     Longitude of the observer (in degrees).
 * @param {*} JD 
 *     Julian day.
 * @param {*} JT 
 *     Julian time.
 * @returns Sidereal time (in degrees).
 */
TimeConversions.computeSiderealTime = function(longitude, JD, JT)
{
    // The following implementation is based on the section A.2.5.2 - CEP to ITRF
    // from ESA - GNSS Data Processing Vol. 1.

    // For computation of the UT1 time.
    const JDmin = Math.floor(JT) - 0.5;
    const JDmax = Math.floor(JT) + 0.5;
    let JD0 = 0;

    if (JT > JDmin)
    {
        JD0 = JDmin;
    }
    if (JT > JDmax)
    {
        JD0 = JDmax;
    }

    // Julian time at 2000-01-01 12:00:00 UTC.
    const epochJ2000 = 2451545.0;
    // UT1 time.
    const H = (JT - JD0) * 24.0;
    // Julian centuries of UT1 date (A.36)
    const T = (JD - epochJ2000) / 36525.0;
    
    const UT1 = H * 15.0;
    // GMST at 0h UT1 (A.35)
    const theta_G0 = 100.460618375 + 36000.77005360834 * T + 3.879333333333333e-04 * T*T - 2.583333333333333e-08 *T*T*T;
    // GMST(A.34)
    const GMST = 1.002737909350795 * UT1 + theta_G0;

    // The equinox equation (A.37) for GAST term. 
    const nutTerms = Nutation.nutationTerms(T);        
    const N11 = MathUtils.cosd(nutTerms.dpsi);
    const N12 = -MathUtils.cosd(nutTerms.eps) * MathUtils.sind(nutTerms.dpsi);
    const GAST = (GMST + MathUtils.atand(N12 / N11) + longitude) % 360.0;

    return GAST;
}

/**
 * Convert Lightstreamer ISS timestamp representing the UTC fractional day of the year to a JavaScript date.
 * 
 * @param {Number} ts 
 *      The timestamp.
 * @returns {Date} The Date object.
 */
TimeConversions.timeStampToDate = function(ts)
{
    const ts_day = Math.floor(ts/24);
    const ts_hour = Math.floor(((ts/24)-ts_day)*24);
    const ts_minute = Math.floor((((ts/24)-ts_day)*24-ts_hour)*60);
    const ts_seconds = ((((((ts/24)-ts_day)*24-ts_hour)*60) - ts_minute)*60).toFixed(0);
    const ts_milli = ((((((ts/24)-ts_day)*24-ts_hour)*60) - ts_minute)*60 - ts_seconds);
 
    // TODO: What happens around new year?
    // Get the current year.
    const tmpDate = new Date();
    const year = tmpDate.getFullYear();
 
    // First day of the year.
    const yearStart = new Date(year, 0);
    yearStart.setDate(ts_day);
    // Take into account the fact that the timestamp is in UTC:
    yearStart.setHours(ts_hour, ts_minute - tmpDate.getTimezoneOffset(), ts_seconds);
 
    return new Date(yearStart);
}
 
