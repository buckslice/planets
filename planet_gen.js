
var radius = 2.0;
var numSubdivisions = 8;

class QuadTree {

    constructor(depth) {
        this.depth = depth;
        this.children = [];
        this.hasChildren = false;
        this.verts = [];
        this.mesh;
    }

    buildMesh() {
        var geometry = new THREE.BufferGeometry();

        var triangles = 2 * Math.pow(4, numSubdivisions);

        var positions = new Float32Array( triangles * 3 * 3 );
        var normals = new Float32Array( triangles * 3 * 3 );
        var colors = new Float32Array( triangles * 3 * 3 );

        var norm = new THREE.Vector3();
        var norm2 = new THREE.Vector3();
        var color = new THREE.Color();
        var color2 = new THREE.Color();

        var grad = [.70,new THREE.Color(1.0,1.0,1.0),   // peaks
                    .60,new THREE.Color(0.4,0.4,0.3),   // mountains
                    .35,new THREE.Color(0.0,1.0,0.0),   // grass
                    .27,new THREE.Color(0.8,0.8,0.5),   // coast
                    .20,new THREE.Color(0.0,0.9,0.9),   // shallows
                    0.0,new THREE.Color(0.0,0.0,1.0),   // ocean
                    -.6,new THREE.Color(0.0,0.0,0.3)];  // deep ocean

        var len = this.verts.length;
        for(var i = 0; i < len; i+=3){
            var v1 = this.verts[i];
            var v2 = this.verts[i+1];
            var v3 = this.verts[i+2];

            // convert to sphere of given radius
            v1 = toSphere(v1, radius);
            v2 = toSphere(v2, radius);
            v3 = toSphere(v3, radius);

            var j = i * 3;
            positions[j] = v1.x;
            positions[j+1] = v1.y;
            positions[j+2] = v1.z;

            positions[j+3] = v2.x;
            positions[j+4] = v2.y;
            positions[j+5] = v2.z;

            positions[j+6] = v3.x;
            positions[j+7] = v3.y;
            positions[j+8] = v3.z;

            // calculate the normal of this triangle
            norm.subVectors(v1,v2);
            norm2.subVectors(v1,v3);
            norm.cross(norm2);
            norm.normalize();

            normals[j] = norm.x;
            normals[j+1] = norm.y;
            normals[j+2] = norm.z;

            normals[j+3] = norm.x;
            normals[j+4] = norm.y;
            normals[j+5] = norm.z;

            normals[j+6] = norm.x;
            normals[j+7] = norm.y;
            normals[j+8] = norm.z;

            // calculate color
            //color.setRGB(Math.random(), Math.random(), Math.random());
            //color.setRGB(id/6, 0.0, 1-id/6);
            //color.setRGB(Math.floor(i / len * 4) / 4, 0, 0);    // how splitting will work
            //color.setRGB(i / len, 0, 0);

            var vecs = [v1,v2,v3];
            for(var k = 0; k < 3; k++){
                var v = vecs[k];
                var n = noise.fractal3(v.x,v.y,v.z, 5, 1);
                // blend color based on noise and grad
                for(var q = 0; q < grad.length; q+=2){
                    if(n > grad[q]){
                        color.set(grad[q+1]);
                        if(q > 0){
                            color2.set(grad[q-1]);
                            color.lerp(color2, noise.cblend(n, grad[q], grad[q-2]));
                        }
                        break;
                    }
                    color.set(grad[grad.length-1]);
                }

                colors[j+k*3] = color.r;
                colors[j+k*3+1] = color.g;
                colors[j+k*3+2] = color.b;
            }
        }

        geometry.addAttribute( 'position', new THREE.BufferAttribute( positions, 3 ) );
        geometry.addAttribute( 'normal', new THREE.BufferAttribute( normals, 3 ) );
        geometry.addAttribute( 'color', new THREE.BufferAttribute( colors, 3 ) );

        geometry.computeBoundingSphere();

        var mesh = new THREE.Mesh(geometry, planetMat);

        scene.add(mesh);
    }


    update() {

    }

    split() {

    }

    merge() {

    }
}

var roots = [];

//http://catlikecoding.com/unity/tutorials/cube-sphere/
function toSphere(v, radius){
    var x2 = v.x*v.x;
    var y2 = v.y*v.y;
    var z2 = v.z*v.z;

    var sx = v.x*Math.sqrt(1-y2/2-z2/2+y2*z2/3);
    var sy = v.y*Math.sqrt(1-x2/2-z2/2+x2*z2/3);
    var sz = v.z*Math.sqrt(1-x2/2-y2/2+x2*y2/3);

    var s = new THREE.Vector3(sx,sy,sz);
    s.multiplyScalar(radius);
    return s;
}

// subdivides quadtree by one level
function subdivide(tree){
    var newVerts = [];
    //var map = {};

    for(var i = 0; i < tree.verts.length; i+=6){
        var v0 = tree.verts[i];
        var v1 = tree.verts[i+1];
        var v2 = tree.verts[i+2];
        var v3 = tree.verts[i+4];

        var m01 = new THREE.Vector3();
        var m12 = new THREE.Vector3();
        var m23 = new THREE.Vector3();
        var m30 = new THREE.Vector3();
        var m20 = new THREE.Vector3();

        m01.addVectors(v0,v1).multiplyScalar(0.5);
        m12.addVectors(v1,v2).multiplyScalar(0.5);
        m23.addVectors(v2,v3).multiplyScalar(0.5);
        m30.addVectors(v3,v0).multiplyScalar(0.5);
        m20.addVectors(v2,v0).multiplyScalar(0.5);

        newVerts.push(v0,m01,m20,m20,m30,v0,
                      m01,v1,m12,m12,m20,m01,
                      m20,m12,v2,v2,m23,m20,
                      m30,m20,m23,m23,v3,m30);

    }

    tree.verts = newVerts;
}

function initPlanet() {
    noise.seed(Math.random());

    // 0 -- 3
    // |    |   tl bl br tr
    // 1 -- 2
    // front back left right up down
    startPositions = [];
    startPositions.push([[-1,1,1],[-1,-1,1],[1,-1,1],[1,-1,1],[1,1,1],[-1,1,1]]);
    startPositions.push([[1,1,-1],[1,-1,-1],[-1,-1,-1],[-1,-1,-1],[-1,1,-1],[1,1,-1]]);
    startPositions.push([[-1,1,-1],[-1,-1,-1],[-1,-1,1],[-1,-1,1],[-1,1,1],[-1,1,-1]]);
    startPositions.push([[1,1,1],[1,-1,1],[1,-1,-1],[1,-1,-1],[1,1,-1],[1,1,1]]);
    startPositions.push([[-1,1,-1],[-1,1,1],[1,1,1],[1,1,1],[1,1,-1],[-1,1,-1]]);
    startPositions.push([[-1,-1,1],[-1,-1,-1],[1,-1,-1],[1,-1,-1],[1,-1,1],[-1,-1,1]]);

    for (var i = 0; i < 6; ++i) {
        var qt = new QuadTree(0);
        for(var j = 0; j < 6; ++j){
            var sp = startPositions[i][j];
            qt.verts.push(new THREE.Vector3(sp[0],sp[1],sp[2]));
        }

        for(var j = 0; j < numSubdivisions; ++j){
            subdivide(qt);
        }

        qt.buildMesh();

        roots.push(qt);
    }

    // generate star field
    var numStars = 10000;
    var stargeo = new THREE.BufferGeometry();
    var positions = new Float32Array(numStars*3);
    var colors = new Float32Array(numStars*3);

    var color = new THREE.Color();

    for(var i = 0; i < positions.length; i+=3){
        // get random spherical coordinate
        var theta = Math.random() * Math.PI * 2;
        var phi = Math.acos(2 * Math.random() - 1);
        var r = Math.random() * 500 + 500;
        // convert to cartesian
        var x = r * Math.cos(theta) * Math.sin(phi);
        var y = r * Math.sin(theta) * Math.sin(phi);
        var z = r * Math.cos(phi);

        positions[i] = x;
        positions[i+1] = y;
        positions[i+2] = z;

        // generate random star color
        var r = Math.random()*.2 + .8;
        var b = Math.random()*.2 + .8;
        var g = Math.min(r,b);
        color.setRGB(r,g,b);

        colors[i] = color.r;
        colors[i+1] = color.g;
        colors[i+2] = color.b;
    }

    stargeo.addAttribute('position', new THREE.BufferAttribute(positions, 3));
    stargeo.addAttribute('color', new THREE.BufferAttribute(colors,3));

    stargeo.computeBoundingSphere();

    var starmat = new THREE.PointsMaterial({size:1, vertexColors: THREE.VertexColors});
    var stars = new THREE.Points(stargeo, starmat);

    scene.add(stars);

}