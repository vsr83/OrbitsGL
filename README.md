# OrbitsGL
Visualization of elliptic orbits with WebGL.

Simple 3d visualization implemented with WebGL of elliptical orbits of satellites. The computation is mostly based on my earlier project [ISSLive_Sun](https://github.com/vsr83/ISSLive_Sun) but the code supports SGP4 propagation of TLE elements with [satellite.js](https://github.com/shashwatak/satellite-js).

By default, the visualization depicts the orbit of the ISS using the ISSLive Lightstreamer feed. Since the Lightstreamer feed seems to be occasionally unreliable, the position data can be obtained from the [Orbit Ephemeris Message](https://spotthestation.nasa.gov/trajectory_data.cfm). Note that the OEM in the repository will get obsolete, if not manually updated. 

Arbitrary satellite orbits can be handled by either SGP4 propagation of NORAD two-line elements (TLE) or via initialization with an arbitrary OSV given in the J2000 frame. The propagation of OSVs in the latter case is performed assuming ideal Kepler orbits. Initialization of an orbit directly using Keplerian Elements is also supported. Any OSV set manually or computed from a Kepler orbit can be also used to generate a TLE for more accurate propagation with SGP4.

The implementation currently does not store TLEs so they must be downloaded from sources such as [CelesTrak](https://celestrak.com/NORAD/elements/). TLEs must be pasted to the dialog available from the main menu.

Click below to execute in browser.
[![Screenshot.](scrshot.png)](https://vsr83.github.io/OrbitsGL/)

# Initialization of an Orbit for arbitrary satellites.

## Orbit State Vector (OSV)

In order to use an orbit determined by a single Orbit State Vector, click "Insert OSV" from the main menu, and insert a string to the dialog in the format:
```
YYYY-MM-DDTHH:MM:SS.SSS X Y Z VX VY VZ
```
where :
- YYYY-MM-DDTHH:MM:SS.SSS is the UTC time stamp of the OSV,
- X, Y, Z is the position in J2000 frame expressed in kilometers.
- VX, VY, VZ is the velocity in the J2000 frame expressed in kilometers / second.

By default, initialization with an OSV leads the propagation of orbits assuming Keplerian orbits. Somewhat more accurate propagation can be achieved with SGP4 via generation of a TLE from the OSV. To do this, select "Fill from OSV" and "Export TLE" from the "Two-Line Element" folder. The generated TLE assumes zero drag term as well as zero derivatives for the mean motion. This will impact the accuracy of the SGP4 propagation.

## Two-Line Element (TLE)

Orbit can be initialized from TLEs via "Insert TLE" from the main menu. The orbit will be propagated using the SGP4 propagator. TLEs for unclassified satellites can be downloaded from [CelesTrak](https://celestrak.com/NORAD/elements/).

## Two-Line Element (TLE) Lists

Arbitrary number of satellites can be visualized as points simultaneously via specification of a list of TLEs using "Insert TLE List" from the main menu. Thereafter, the active TLE can be selected via "Select TLE".

## Keplerian Elements

Orbit can be initialized from Keplerian Elements from the "Keplerian Elements" folder via selection of the Override checkbox. This will generate the current OSV. The OSV can be converted to a TLE as described above.