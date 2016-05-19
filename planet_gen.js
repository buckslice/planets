class Vertex {
    constructor(pos, norm, color) {
        this.pos = vec3.create(pos);
        this.norm = vec3.create(norm);
        this.color = vec3.create(color);
    }
}

class QuadTree {

    constructor(depth) {
        this.depth = depth;
        this.children = [];
        this.hasChildren = false;
        this.verts = [];
        this.tris = [];
        this.vertexBuffer = -1;
        this.indexBuffer = -1;
    }

    buildMesh() {
        if(this.vertexBuffer >= 0){
            console.log("Already built mesh for this QuadTree!");
            return;
        }
        // create buffers
        this.vertexBuffer = gl.createBuffer();
        this.indexBuffer = gl.createBuffer();

        // turn verts list into list of straight floats
        var vFloats = [];
        for (var i = 0; i < this.verts.length; ++i) {
            var v = this.verts[i];
            vFloats.push(v.pos[0], v.pos[1], v.pos[2], 
                         v.norm[0], v.norm[1], v.norm[2],
                         v.color[0], v.color[1], v.color[2]);
        }

        // upload vertices as array of floats
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, Float32Array.from(vFloats), gl.STATIC_DRAW);

        // upload indices as array of ints
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, Uint16Array.from(this.tris), gl.STATIC_DRAW);
    }

    draw() {
        // stride is 36 bytes long (length of one vertex)
        // for some reason you need set these attributes every frame
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, 3, gl.FLOAT, false, 36, 0);
        gl.vertexAttribPointer(shaderProgram.vertexNormalAttribute, 3, gl.FLOAT, false, 36, 12); 
        gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, 3, gl.FLOAT, false, 36, 24); 

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
        gl.drawElements(gl.TRIANGLES, this.tris.length, gl.UNSIGNED_SHORT, 0);
    }

    update() {

    }

    split() {

    }

    merge() {

    }
}


var roots = [];

function drawPlanet() {
    for (var i = 0; i < roots.length; ++i) {
        roots[i].draw();
    }
}

//http://catlikecoding.com/unity/tutorials/cube-sphere/
function toSphere(v, radius){
    var x2 = v[0]*v[0];
    var y2 = v[1]*v[1];
    var z2 = v[2]*v[2];

    var sx = v[0]*Math.sqrt(1-y2/2-z2/2+y2*z2/3);
    var sy = v[1]*Math.sqrt(1-x2/2-z2/2+x2*z2/3);
    var sz = v[2]*Math.sqrt(1-x2/2-y2/2+x2*y2/3);

    return vec3.scale(vec3.create([sx,sy,sz]),radius);
}

// converts trees verts list to be Vertexs instead of just vec3 positions
// normal and color are added for each triangle in this process
function convertVertices(tree, id){
    var newVerts = [];
    var len = tree.tris.length;

    var radius = 2.0;

    for(var i = 0; i < len; i+=3){
        var v1 = tree.verts[tree.tris[i]];
        var v2 = tree.verts[tree.tris[i+1]];
        var v3 = tree.verts[tree.tris[i+2]];

        // convert to sphere of given radius
        v1 = toSphere(v1, radius);
        v2 = toSphere(v2, radius);
        v3 = toSphere(v3, radius);

        // calculate normal of this triangle
        var e1 = vec3.subtract(vec3.create(v1), v2);
        var e2 = vec3.subtract(vec3.create(v1), v3);
        var n1 = vec3.normalize(vec3.cross(e1,e2));

        // calculate color
        var c = vec3.create([Math.random(), Math.random(), Math.random()]); // random
        //var c = vec3.create([id / 6, 0.0, 1 - id / 6]);                     // visualize by cube face
        //var c = vec3.create([Math.floor(i / len * 4.0) / 4.0, 0.0, 0.0]);   // visualizes how easy splitting will be
        //var c = vec3.create([i / tree.tris.length, 0.0, 0.0]);
        //var c = vec3.create([0.0, 1.0, 0.0]); // green

        newVerts.push(new Vertex(v1, n1, c));
        newVerts.push(new Vertex(v2, n1, c));
        newVerts.push(new Vertex(v3, n1, c));
    }
    tree.verts = newVerts;
}

// subdivides quadtree by one level
function subdivide(tree){
    var newVerts = [];
    var newTris = [];

    //var map = {};

    var t = 0;

    for(var i = 0; i < tree.tris.length; i+=6){
        var v0 = tree.verts[tree.tris[i]];
        var v1 = tree.verts[tree.tris[i+1]];
        var v2 = tree.verts[tree.tris[i+2]];
        var v3 = tree.verts[tree.tris[i+4]];

        var m01 = vec3.scale(vec3.add(vec3.create(v0),v1), 0.5);
        var m12 = vec3.scale(vec3.add(vec3.create(v1),v2), 0.5);
        var m23 = vec3.scale(vec3.add(vec3.create(v2),v3), 0.5);
        var m30 = vec3.scale(vec3.add(vec3.create(v3),v0), 0.5);
        var m20 = vec3.scale(vec3.add(vec3.create(v2),v0), 0.5);

        newVerts.push(v0,m01,m20,m20,m30,v0,
                      m01,v1,m12,m12,m20,m01,
                      m20,m12,v2,v2,m23,m20,
                      m30,m20,m23,m23,v3,m30);

        for(var j = 0; j < 24; ++j){
            newTris.push(t++);
        }
    }

    tree.verts = newVerts;
    tree.tris = newTris;
}

function initPlanet() {
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
            qt.verts.push(vec3.create(startPositions[i][j]));
        }
        qt.tris.push(0,1,2,3,4,5);

        for(var j = 0; j < 4; ++j){
            subdivide(qt);
        }

        convertVertices(qt, i);

        qt.buildMesh();

        roots.push(qt);
    }

}