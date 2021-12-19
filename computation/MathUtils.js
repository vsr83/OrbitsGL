/**
 * Static methods for vectors and trigonometry.
 */
var MathUtils = {};

MathUtils.cross = function(u, v)
{
    return [u[1]*v[2] - u[2]*v[1], 
            u[2]*v[0] - u[0]*v[2], 
            u[0]*v[1] - u[1]*v[0]];
}

MathUtils.norm = function(u)
{
    return Math.sqrt(u[0]*u[0] + u[1]*u[1] + u[2]*u[2]);
}

MathUtils.deg2Rad = function(deg)
{
    return 2.0 * Math.PI * deg / 360.0;
}

MathUtils.rad2Deg = function(rad)
{
    return 360.0 * rad / (2 * Math.PI);
}

MathUtils.sind = function(deg)
{
    return Math.sin(this.deg2Rad(deg));
}

MathUtils.cosd = function(deg)
{
    return Math.cos(this.deg2Rad(deg));
}

MathUtils.tand = function(deg)
{
    return Math.tan(this.deg2Rad(deg));
}

MathUtils.asind = function(val)
{
    return this.rad2Deg(Math.asin(val));
}

MathUtils.acosd = function(val)
{
    return this.rad2Deg(Math.acos(val));
}

MathUtils.atan2d = function(y, x)
{
    return this.rad2Deg(Math.atan2(y, x));
}

MathUtils.atand = function(val)
{
    return this.rad2Deg(Math.atan(val));
}

MathUtils.rotX = function(r, deg)
{
    let x = r[0];
    let y = this.cosd(deg) * r[1] - this.sind(deg) * r[2];
    let z = this.sind(deg) * r[1] + this.cosd(deg) * r[2];

    return [x, y, z];
}

MathUtils.rotY = function(r, deg)
{
    let x = this.cosd(deg) * r[0] + this.sind(deg) * r[2];
    let y = r[1];
    let z = -this.sind(deg) * r[0] + this.cosd(deg) * r[2];

    return [x, y, z];
}

MathUtils.rotZ = function(r, deg)
{
    let x = this.cosd(deg) * r[0] - this.sind(deg) * r[1];
    let y = this.sind(deg) * r[0] + this.cosd(deg) * r[1];
    let z = r[2];

    return [x, y, z];
}

MathUtils.vecmul = function(r, s)
{
    return [r[0] * s,  r[1] * s,  r[2] * s];
}

MathUtils.vecsum = function(u, v)
{
    return [u[0] + v[0], u[1] + v[1], u[2] + v[2]];
}

MathUtils.vecsub = function(u, v)
{
    return [u[0] - v[0], u[1] - v[1], u[2] - v[2]];
}
