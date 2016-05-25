

mouseLook = function ( camera ) {
    var scope = this;
    this.enabled = false;

    var leftDown = false;
    var rightDown = false;

    camera.rotation.set( 0, 0, 0 );
    camera.position.set( 0, 0, 0 );

    var yawObject = new THREE.Object3D();
    yawObject.add( camera );

    var PI_2 = Math.PI / 2;

    var blocker = document.getElementById( 'blocker' );
    var instructions = document.getElementById( 'instructions' );

    // http://www.html5rocks.com/en/tutorials/pointerlock/intro/
    var havePointerLock = 'pointerLockElement' in document || 'mozPointerLockElement' in document || 'webkitPointerLockElement' in document;
    if ( havePointerLock ) {
        var element = document.body;
        var pointerlockchange = function ( event ) {
            if ( document.pointerLockElement === element || document.mozPointerLockElement === element || document.webkitPointerLockElement === element ) {
                scope.enabled = true;
                blocker.style.display = 'none';
            } else {
                scope.enabled = false;
                blocker.style.display = '-webkit-box';
                blocker.style.display = '-moz-box';
                blocker.style.display = 'box';
                instructions.style.display = '';
            }
        };
        var pointerlockerror = function ( event ) {
            instructions.style.display = '';
        };
        // Hook pointer lock state change events
        document.addEventListener( 'pointerlockchange', pointerlockchange, false );
        document.addEventListener( 'mozpointerlockchange', pointerlockchange, false );
        document.addEventListener( 'webkitpointerlockchange', pointerlockchange, false );
        document.addEventListener( 'pointerlockerror', pointerlockerror, false );
        document.addEventListener( 'mozpointerlockerror', pointerlockerror, false );
        document.addEventListener( 'webkitpointerlockerror', pointerlockerror, false );
        instructions.addEventListener( 'click', function ( event ) {
            instructions.style.display = 'none';
            // Ask the browser to lock the pointer
            element.requestPointerLock = element.requestPointerLock || element.mozRequestPointerLock || element.webkitRequestPointerLock;
            if ( /Firefox/i.test( navigator.userAgent ) ) {
                var fullscreenchange = function ( event ) {
                    if ( document.fullscreenElement === element || document.mozFullscreenElement === element || document.mozFullScreenElement === element ) {
                        document.removeEventListener( 'fullscreenchange', fullscreenchange );
                        document.removeEventListener( 'mozfullscreenchange', fullscreenchange );
                        element.requestPointerLock();
                    }
                };
                document.addEventListener( 'fullscreenchange', fullscreenchange, false );
                document.addEventListener( 'mozfullscreenchange', fullscreenchange, false );
                element.requestFullscreen = element.requestFullscreen || element.mozRequestFullscreen || element.mozRequestFullScreen || element.webkitRequestFullscreen;
                element.requestFullscreen();
            } else {
                element.requestPointerLock();
            }
        }, false );
    } else {
        instructions.innerHTML = 'Your browser doesn\'t seem to support Pointer Lock API';
    }

    var onMouseMove = function ( event ) {

        if ( scope.enabled === false ) return;

        var movementX = event.movementX || event.mozMovementX || event.webkitMovementX || 0;
        var movementY = event.movementY || event.mozMovementY || event.webkitMovementY || 0;

        camera.rotation.x -= movementY * 0.002;
        camera.rotation.x = Math.max( - PI_2, Math.min( PI_2, camera.rotation.x ) );

        yawObject.rotation.y -= movementX * 0.002;

    };

    var onMouseDown = function (event){
        if(scope.enabled == false) return;
        scope.enabled = true;
        switch(event.button){
            case 0: leftDown = true; break;
            case 2: rightDown = true; break;
        }
    }

    var onMouseUp = function (event){
        switch(event.button){
            case 0: leftDown = false; break;
            case 2: rightDown = false; break;
        }
    }

    this.dispose = function() {
        document.removeEventListener( 'mousemove', onMouseMove, false );
        document.removeEventListener( 'mousedown', onMouseDown, false);
        document.removeEventListener( 'mouseup', onMouseUp, false);
    };
    document.addEventListener( 'mousemove', onMouseMove, false );
    document.addEventListener( 'mousedown', onMouseDown, false);
    document.addEventListener( 'mouseup', onMouseUp, false);

    this.getObject = function () {
        return yawObject;
    };

    this.update = function(delta){
        var mouseClick = 0;
        if(leftDown) mouseClick++;
        if(rightDown) mouseClick--;
        var dir = new THREE.Vector3(0,0,-mouseClick*delta);
        dir.applyQuaternion(camera.getWorldQuaternion());
        yawObject.position.add(dir);
    }

};
