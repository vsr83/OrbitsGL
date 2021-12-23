# OrbitsGL
Visualization of elliptic orbits with WebGL.

Simple 3d visualization implemented with WebGL of elliptical orbits of satellites. The computation is mostly based on my earlier project [ISSLive_Sun](https://github.com/vsr83/ISSLive_Sun) but the code supports SGP4 propagation of TLE elements with [satellite.js](https://github.com/shashwatak/satellite-js).

By default, the visualization depicts the orbit of the ISS using the ISSLive Lightstreamer feed. Since the Lightstreamer feed seems to be occasionally unreliable, the position data can be obtained from the [Orbit Ephemeris Message](https://spotthestation.nasa.gov/trajectory_data.cfm). Note that the OEM in the repository will get obsolete, if not manually updated. 

Arbitrary satellite orbits can be handled by either SGP4 propagation of NORAD two-line elements (TLE) or via initialization with an arbitrary OSV given in the J2000 frame. The propagation of OSVs in the latter case is performed assuming ideal Kepler orbits.

The implementation currently does not store TLEs so they must be downloaded from sources such as [CelesTrak](https://celestrak.com/NORAD/elements/). TLEs must be pasted to the dialog available from the main menu.

Click below to execute in browser.
[![Screenshot.](scrshot.png)](https://vsr83.github.io/OrbitsGL/)
