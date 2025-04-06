let sketch = function (p) {
    //-------------------------------------
    // GLobal Variables
    //-------------------------------------

    // Aegent 
    //---------------------------------------
    let agents = [];
    let num_agents = 5000;

    // Noise Map
    //---------------------------------------
    let isNoiseMapDisplayed = false;
    let noiseScale = 1 / 1000;
    let noiseStrength = .8;
    let noiseOffset = p.createVector(0, 0);

    // Time 
    //---------------------------------------
    let time = 0;
    let timeScale = 0.001;

    //-------------------------------------
    // Setup
    //-------------------------------------
    p.setup = function () {
        p.createCanvas(p.windowWidth, p.windowHeight, p.P2D);
        p.background(225);
        p.frameRate(60);

        function initializeAgents() {
            for (let i = 0; i < num_agents; i++) {
                agents.push(new Agent());
            }
        }
        initializeAgents();
    };


    //-------------------------------------
    // Draw
    //-------------------------------------
    p.draw = function () {
        // p.background(0, 100);


        p.fill(255, 10);
        p.noStroke();
        p.rect(0, 0, p.width, p.height);

        // Update time
        time += timeScale;

        // Update agents
        for (let i = 0; i < agents.length; i++) {
            agents[i].update();
        }

        // Update noise vector map
        if (isNoiseMapDisplayed) {
            drawNoiseMap();
        }

        // Draw frame rate
        // ! Drawing frame rate method is merged with drawHUD
        // p.drawFrameRate();

        // Draw HUD
        p.drawHUD();
    }

    //-------------------------------------
    // Window Resized
    //-------------------------------------
    p.windowResized = function () {
        p.resizeCanvas(p.windowWidth, p.windowHeight);
    }

    //-------------------------------------
    // Frame Rate
    //-------------------------------------
    p.drawFrameRate = function () {
        p.push();
        p.fill(255);
        p.textSize(16);
        p.textAlign(p.RIGHT);
        p.text("fps: " + Math.round(p.frameRate()), p.width - 10, 20);
        p.pop();
    }

    //-------------------------------------
    // Key Pressed
    //-------------------------------------
    p.keyPressed = function () {
        if (p.key === 'n' || p.key === 'N') {
            isNoiseMapDisplayed = !isNoiseMapDisplayed;
            if (!isNoiseMapDisplayed) {
                p.background(225);
            }
        }
        if (p.key === 'r' || p.key === 'R') {
            agents = [];
            p.background(225);
            p.setup();
        }
        if (p.key === '+') {
            num_agents += 1000;
            agents = [];
            p.background(225);
            p.setup();
        }
        else if (p.key === '-') {
            num_agents = Math.max(1000, num_agents - 1000);
            agents = [];
            p.background(225);
            p.setup();
        }
    }

    //-------------------------------------
    // Head Up Display (HUD)
    //-------------------------------------
    p.drawHUD = function () {
        p.push();
        p.fill(5);
        p.rect(16, 16, 320, 120);
        p.pop();

        p.push();
        p.fill(225);
        p.textSize(12);
        p.textAlign(p.LEFT);
        p.text("fps: " + Math.round(p.frameRate()), 24, 36);
        p.text("" + agents.length + " agents", 24, 52);
        p.text("Press ' n ' to toggle noise map", 24, 68);
        p.text("Press ' + ' to increase agents", 24, 84);
        p.text("Press ' - ' to decrease agents", 24, 100);
        p.pop();
    }

    //-------------------------------------
    // Agent Class
    //-------------------------------------
    class Agent {

        /*
         * @param 
         */
        constructor() {
            this.position = p.createVector(p.random(p.width), p.random(p.height));
            this.positionPrev = this.position.copy();
            this.velocity = p.createVector(0, 0);
            this.stepSize = 1;
            this.size = 4;
            this.color = p.color(5, 5, 5, 100);
            this.isActive = true;
        }

        /*
         * @param 
         */
        update() {
            this.velocity = createCurlNoise(this.position);
            this.position.add(this.velocity);

            if (!this.isInsideCanvas()) {
                this.isActive = false;

                this.position = p.createVector(p.random(p.width), p.random(p.height));
                this.positionPrev = this.position.copy();
                this.velocity = p.createVector(0, 0);

                this.isActive = true;
            } else {
                this.display();
                this.positionPrev = this.position.copy();
            }
        }

        /*
         * @param 
         */
        display() {
            p.push();
            p.strokeWeight(this.size * 0.1);
            p.stroke(this.color, 100);
            // p.fill(this.color, 100);
            p.line(this.positionPrev.x, this.positionPrev.y,
                this.position.x, this.position.y);
            p.pop();
        }

        /*
         * @param 
         */
        isInsideCanvas() {
            return this.position.x >= 0 && this.position.x <= p.width &&
                this.position.y >= 0 && this.position.y <= p.height;
        }
    }

    //-------------------------------------
    // Create Noise Map
    //-------------------------------------

    /*
     * @param 
        - position: p5.Vector (The unscaled position)
     * @return
        - curl: p5.Vector
     * @description
        - Generates a curl noise vector based on the given position.
     */
    function createCurlNoise(position) {
        let epsilon = 0.001;

        let n1 = p.noise(
            (position.x + epsilon) * noiseScale + noiseOffset.x,
            position.y * noiseScale + noiseOffset.y,
            time
        );

        let n2 = p.noise(
            (position.x - epsilon) * noiseScale + noiseOffset.x,
            position.y * noiseScale + noiseOffset.y,
            time
        );

        // Apply the centered difference formula
        // to calculate the gradient in the x direction
        let gradientX = (n1 - n2) / (2 * epsilon);

        let n3 = p.noise(
            position.x * noiseScale + noiseOffset.x,
            (position.y + epsilon) * noiseScale + noiseOffset.y,
            time
        );

        let n4 = p.noise(
            position.x * noiseScale + noiseOffset.x,
            (position.y - epsilon) * noiseScale + noiseOffset.y,
            time
        );

        // Apply the centered difference formula
        // to calculate the gradient in the y direction
        let gradientY = (n3 - n4) / (2 * epsilon);

        let curl = p.createVector(
            gradientY,
            -gradientX
        );

        curl.normalize();
        curl.mult(noiseStrength);

        return curl;
    }

    function drawNoiseMap() {
        p.push();

        let gridSize = 25;

        for (let x = 0; x < p.width; x += gridSize) {
            for (let y = 0; y < p.height; y += gridSize) {
                let position = p.createVector(x, y);
                let curl = createCurlNoise(position);
                let angle = p.atan2(curl.y, curl.x);
                let strength = curl.mag();

                let c = p.lerpColor(
                    p.color(50, 50, 200, 80),
                    p.color(200, 50, 50, 80),
                    strength
                );

                p.stroke(c);
                drawArrow(position, angle, strength * 10);
            }
        }
        p.pop();

        function drawArrow(position, angle, length) {
            length = Math.max(length, 5);

            p.push();
            p.translate(position.x, position.y);
            p.rotate(angle);

            p.strokeWeight(1);
            p.line(0, 0, length, 0);

            p.line(length, 0, length - 2, -2);
            p.line(length, 0, length - 2, 2);
            p.pop();
        }
    }
};

new p5(sketch);