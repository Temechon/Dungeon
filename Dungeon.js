var Dungeon = function(canvas) {
    this.engine         = new BABYLON.Engine(canvas, true);

    // Resize window event
    var _this = this;
    window.addEventListener("resize", function() {
        _this.engine.resize();
    });

    // Load scene
    BABYLON.SceneLoader.Load("assets/", "dungeon.babylon", this.engine, function(scene) {
        _this.scene = scene;
        _this.initScene();


        scene.executeWhenReady(function() {
            _this.engine.runRenderLoop(function () {
                _this.scene.render();
            });
        });

    });
};

Dungeon.prototype.initScene = function() {

    // Camera attached to the canvas
    var camera = this.scene.activeCamera;
    //camera.setTarget(new BABYLON.Vector3(0,0,0));
    camera.attachControl(this.engine.getRenderingCanvas());

    this.initLights();

    this.initTorches();

    this.initShadows();

    this.initCollisions();

    this.initFx();

};

Dungeon.prototype.initLights = function() {

    this.scene.lights.forEach(function(l) {
        l.dispose();
    });

    var randomNumber = function (min, max) {
        if (min === max) {
            return (min);
        }
        var random = Math.random();
        return ((random * (max - min)) + min);
    };

    // Hemispheric light to light the scene
    var h = new BABYLON.HemisphericLight("hemi", new BABYLON.Vector3(0,1,0), this.scene);
    h.intensity = 0.2;

    var torch1 = this.scene.getMeshByName("torch");
    var torch2 = this.scene.getMeshByName("torch01");

    var pl1 = new BABYLON.PointLight("pl1", torch1.position, this.scene);
    var pl2 = new BABYLON.PointLight("pl2", torch2.position, this.scene);
    pl1.intensity = pl2.intensity = 0.5;
    pl1.diffuse = pl2.diffuse = BABYLON.Color3.FromInts(255, 123, 63);
    pl1.range = pl2.range = 30;

    var positive = true;
    var di = randomNumber(0, 0.05);
    setInterval(function() {
       if (positive) {
           di *= -1;
       }  else {
           di = randomNumber(0, 0.05);
       }
        positive = !positive;
        pl1.intensity += di;
        pl2.intensity += di;

    }, 50);
};

Dungeon.prototype.initTorches = function() {
    var particleSystem = new BABYLON.ParticleSystem("particles", 2000, this.scene);

    //Texture of each particle
    particleSystem.particleTexture = new BABYLON.Texture("particles/flame.png", this.scene);

    var torch1 = this.scene.getMeshByName("torch");
    var torch2 = this.scene.getMeshByName("torch01");

    particleSystem.emitter = torch1;
    particleSystem.blendMode = BABYLON.ParticleSystem.BLENDMODE_STANDARD;
    particleSystem.minSize = 0.8;
    particleSystem.maxSize = 1.2;
    particleSystem.minLifeTime = 0.3;
    particleSystem.maxLifeTime = 1.5;
    particleSystem.minEmitBox = new BABYLON.Vector3(-0.1, 0, -0.1); // Starting all from
    particleSystem.maxEmitBox = new BABYLON.Vector3(0.1, 0.1, 0.1); // To...
    particleSystem.emitRate = 75;
    particleSystem.start();

    var ps2 = particleSystem.clone();
    ps2.emitter = torch2;
    ps2.start();

};

Dungeon.prototype.initShadows = function() {

    this.scene.meshes.forEach(function(mesh) {
        if (mesh.name.indexOf("floor") != -1) {
            mesh.receiveShadows = true;
        }
    });

    var dl = new BABYLON.DirectionalLight("light", new BABYLON.Vector3(0, -0.5, -0.3), this.scene);
    dl.intensity = 0.5;
    var generator = new BABYLON.ShadowGenerator(512, dl);

    this.scene.meshes.forEach(function(mesh) {
        if (mesh.name.indexOf("shadow") != -1) {
            generator.getShadowMap().renderList.push(mesh);
        }
    });
    generator.useBlurVarianceShadowMap = true;
    //generator.blurBoxOffset = 0.5;

};

Dungeon.prototype.initCollisions = function() {
    this.scene.gravity = new BABYLON.Vector3(0, -9.81, 0);
    this.scene.collisionsEnabled = true;

    var cam = this.scene.activeCamera;
    cam.applyGravity = true;
    cam.ellipsoid = new BABYLON.Vector3(1, 2, 1);
    cam.checkCollisions = true;

    this.scene.meshes.forEach(function(mesh) {
        if (mesh.name.indexOf("collider") != -1) {
            mesh.isVisible = false;
        }
    });
};

Dungeon.prototype.initFx = function() {
    // STEPS
    var step1 = new BABYLON.Sound("step1", "assets/sounds/step1.wav", this.scene);
    var step2 = new BABYLON.Sound("step2", "assets/sounds/step2.wav", this.scene);
    var step3 = new BABYLON.Sound("step3", "assets/sounds/step3.wav", this.scene);

    var goToStep2 = false;
    var walking = false;

    step1.onended = function() {
        goToStep2 = true;
    };
    step2.onended = function() {
        goToStep2 = false;
    };
    step3.onended = function() {
        goToStep2 = false;
    };

    this.scene.registerBeforeRender(function() {
        if (walking) {
            // If no sound is playing
            if (! step1.isPlaying && !step2.isPlaying && !step3.isPlaying) {
                if (Math.random() < 0.2) {
                    step3.play();
                } else if (!goToStep2) {
                    step1.play();
                } else {
                    step2.play();
                }
            }
        }
    });

    window.addEventListener("keydown", function(evt) {
        if (evt.keyCode >= 38 && evt.keyCode <= 40) {
            walking = true;
        }
    });
    window.addEventListener("keyup", function(evt) {
        if (evt.keyCode >= 38 && evt.keyCode <= 40) {
            walking = false;
        }
    });

    // FIRE
    var fire = new BABYLON.Sound("fire", "assets/sounds/fire1.wav", this.scene,
        null, { loop: true, autoplay: true, spatialSound: true, maxDistance: 20, volume:0.2 });
    var fire2 = new BABYLON.Sound("fire2", "assets/sounds/fire2.wav", this.scene,
        null, { loop: true, autoplay: true, spatialSound: true, maxDistance: 20, volume:0.2 });

    var torch1 = this.scene.getMeshByName("torch");
    var torch2 = this.scene.getMeshByName("torch01");
    fire.setPosition(torch1.position);
    fire2.setPosition(torch2.position);
};