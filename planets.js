/*
 * Rendering control
 */
function changeResolution(value) {
    var id = parseInt(value, 10);

    var width = 0, height = 0;
    switch ( id ) {
        case 0:
            width = 480; height = 320; break;

        case 1:
            width = 800; height = 600; break;

        case 2:
            width = 1024; height = 768; break;

        default:
            alert("Unknown resolution!");
    }

    if ( width > 0 ) {
        var canvas = $("#canvas0")[0];
        
        canvas.width = width; 
        canvas.height = height;

        gl.viewportWidth = width;
        gl.viewportHeight = height;
    }
}


function changePlanetType(value){
    var id = parseInt(value, 10);

    switch(id){
        case 0:
        break;
        case 1:
        break;
        case 2:
        break;
        default:
            alert("Unknown planet type");
    }
}

function setLightRotating(value){
    rotateLight = value;
}

function setPlanetRotating(value){
    rotatePlanet = value;
}

function updateSliderLight(value){
    value *= 10.0;
    $("#sliderAmountLight").html(value);
    lightRotSpeed = value;
}

function updateSliderPlanet(value){
    value *= 10.0;
    $("#sliderAmountPlanet").html(value);
    planetRotSpeed = value;
}

function changeMode(value) {
    drawMode = parseInt(value, 10);
}

/*
 * Page-load handler
 */
$(function() {
    webGLStart();
});
