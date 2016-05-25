           
var scene;
var camera;
var renderer;

var planetMat;

var controls;
var clock;
var stats;

function webGLStart(){
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera( 75, window.innerWidth/window.innerHeight, 0.1, 1000 );

    controls = new mouseLook(camera);
    var obj = controls.getObject();
    obj.position.z = 5;
    scene.add(obj);

    renderer = new THREE.WebGLRenderer();
    renderer.setSize( window.innerWidth, window.innerHeight );
    //renderer.setClearColor(0x0000ff);     // setting to blue for testing
    document.body.appendChild( renderer.domElement );

    // add a point light for sun
    var sun = new THREE.PointLight(0xffffff, 0.8, 0);
    sun.position.set(10,10,10);
    scene.add(sun);

    // add ambient light
    scene.add(new THREE.AmbientLight(0x111111));

    clock = new THREE.Clock();
    stats = new Stats();
    document.body.appendChild( stats.dom);

    // global material that all quadtrees will use
    planetMat = new THREE.MeshPhongMaterial( {
        color: 0xaaaaaa, specular: 0xffffff, shininess: 5,
        side: THREE.DoubleSide, vertexColors: THREE.VertexColors,
        //wireframe: true
    } ); 

    initPlanet();

    render();
}

function render() {
    requestAnimationFrame( render );

    renderer.render(scene, camera);

    var delta = clock.getDelta();

    controls.update(delta);

    stats.update();
}