// Handling of the mouse dragging.
var xStart = 0;
var yStart = 0;
var dragX = 0;
var dragY = 0;
var dragXStart = 0;
var dragYStart = 0;

var drawing = false;

// Get A WebGL context
var canvas = document.querySelector("#canvas");

canvas.addEventListener("mousedown", function(e) {
    xStart = e.clientX;
    yStart = e.clientY;
    dragXStart = -MathUtils.rad2Deg(rotZ);
    dragYStart = -MathUtils.rad2Deg(rotX) - 90;

    canvas.onmousemove = function(m) {
        //console.log(m);
        dragX = dragXStart - (m.clientX - xStart) / 10.0;
        dragY = dragYStart - (m.clientY - yStart) / 10.0;

        if (dragX > 270.0) dragX -= 360.0;
        if (dragX < -90.0) dragX += 360.0;    
        if (dragY > 180.0) dragY -= 360.0;
        if (dragY < -180.0) dragY += 360.0;

        rotZ = MathUtils.deg2Rad(-dragX);
        rotX = MathUtils.deg2Rad(-90 - dragY);
        
        cameraControls.lon.setValue(rotZToLon(MathUtils.rad2Deg(rotZ)));
        cameraControls.lat.setValue(rotXToLat(MathUtils.rad2Deg(rotX)));
    }
});

canvas.addEventListener("mouseup", function(e) {
    canvas.onmousemove = null;
});

canvas.addEventListener("mouseleave", function(e) {
    canvas.onmousemove = null;
});

document.addEventListener("wheel", function(e) {
    distance *= (e.deltaY * 0.0001 + 1);
    cameraControls.distance.setValue(distance);
});

function touchMove(e)
{
    if (scaling)
    {
        const dist = Math.hypot(e.touches[0].pageX - e.touches[1].pageX, 
        e.touches[0].pageY - e.touches[1].pageY);

        distance = distanceStart * (0.001 * (zoomStart - dist) + 1);
        cameraControls.distance.setValue(distance);
        e.preventDefault();

        return;
    }

    const m = e.touches[0];

    dragX = dragXStart - (m.clientX - xStart) / 10.0;
    dragY = dragYStart - (m.clientY - yStart) / 10.0;

    if (dragX > 270.0) dragX -= 360.0;
    if (dragY > 180.0) dragY -= 360.0;
    if (dragX < -90.0) dragX += 360.0;
    if (dragY < -180.0) dragY += 360.0;

    rotZ = MathUtils.deg2Rad(-dragX);
    rotX = MathUtils.deg2Rad(-90 - dragY);
    
    cameraControls.lon.setValue(rotZToLon(MathUtils.rad2Deg(rotZ)));
    cameraControls.lat.setValue(rotXToLat(MathUtils.rad2Deg(rotX)));
}

var scaling = false;
var zoomStart = 0;
var distanceStart = 0;
document.addEventListener("touchstart", function(e) {
    if (e.touches.length == 1)
    {
        xStart = e.touches[0].clientX;
        yStart = e.touches[0].clientY;
        dragXStart = -MathUtils.rad2Deg(rotZ);
        dragYStart = -MathUtils.rad2Deg(rotX) - 90;

        document.addEventListener("touchmove", touchMove, { passive: false });
    }
    if (e.touches.length == 2)
    {
        distanceStart = distance;
        zoomStart = Math.hypot(e.touches[0].pageX - e.touches[1].pageX, 
            e.touches[0].pageY - e.touches[1].pageY);
        scaling = true;
        e.preventDefault();
    }
}, { passive: false });

document.addEventListener("touchend", function(e) {
    document.removeEventListener("touchmove", touchMove);
    scaling = false;
});
