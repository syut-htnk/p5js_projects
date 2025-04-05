class Agent {
    constructor() {
        // Adjust for WebGL coordinate system (origin at center)
        this.p = createVector(random(-width / 2, width / 2), random(-height / 2, height / 2));
        this.p_old = createVector(this.p.x, this.p.y);
        this.stepsize = 1;
        this.angle = random(TWO_PI);
        this.color = color(0, 0, 0, agent_alpha);
        this.is_dead = false;
    }

    update() {
        // Adjust noise input for WebGL coordinates
        this.angle = noise((this.p.x + width / 2) / noise_scale, (this.p.y + height / 2) / noise_scale) * noise_strength;

        this.p.x += cos(this.angle) * this.stepsize;
        this.p.y += sin(this.angle) * this.stepsize;

        // Check boundaries in WebGL coordinate system
        if (this.p.x < -width / 2 || this.p.x > width / 2 || this.p.y < -height / 2 || this.p.y > height / 2) {
            this.is_dead = true;
        }

        if (this.is_dead) {
            this.p.x = random(-width / 2, width / 2);
            this.p.y = random(-height / 2, height / 2);
            this.p_old.x = this.p.x;
            this.p_old.y = this.p.y;

            this.is_dead = false;
        }

        // Draw in WebGL mode
        push();
        stroke(this.color);
        strokeWeight(strokeWidth * this.stepsize);
        beginShape(LINES);
        vertex(this.p_old.x, this.p_old.y, 0);
        vertex(this.p.x, this.p.y, 0);
        endShape();
        pop();

        this.p_old.x = this.p.x;
        this.p_old.y = this.p.y;

        this.is_dead = false;
    }
}

let agents = [];
let agents_count = 5000;
let noise_scale = 100;
let noise_strength = 5;
let overlay_alpha = 10;
let agent_alpha = 255;
let strokeWidth = 0.5;
let draw_mode = 1;

function setup() {
    createCanvas(windowWidth, windowHeight, WEBGL);
    background(0);
    smooth();
    cursor('crosshair');
    pixelDensity(2);

    for (let i = 0; i < agents_count; i++) {
        agents[i] = new Agent();
    }
}

function draw() {
    if (draw_mode === 0) {
        background(0, overlay_alpha);
        translate(-width / 2, -height / 2); // Move to top-left for 2D rect drawing
    } else {
        push();
        translate(-width / 2, -height / 2); // Move to top-left for 2D rect drawing
        fill(0, overlay_alpha);
        rect(0, 0, width, height);
        pop();
    }

    for (let i = 0; i < agents.length; i++) {
        agents[i].update();
    }
}