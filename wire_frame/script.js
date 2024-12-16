const canvas = document.querySelector('canvas');
const gl = canvas.getContext('webgl');

if (!gl) {
    console.error("WebGL not supported. Please use a compatible browser.");
    throw new Error("WebGL not supported");
}

// Global variables
let colorData = [];
let slider1Value = 10; // Vertical resolution
let slider2Value = 20; // Horizontal resolution
let currentIndices = [];

// Generate sphere vertex data
let { vertices, indices } = generateSphereWireframe(1, slider1Value, slider2Value);
currentIndices = indices;

// Create and bind buffers
const posBuffer = loadData(vertices);
const indexBuffer = gl.createBuffer();
gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

// WebGL program setup
const program = boilerPlate();
const positionLocation = gl.getAttribLocation(program, `position`);
gl.enableVertexAttribArray(positionLocation);
gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 0, 0);

// Enable WebGL features
gl.useProgram(program);
gl.enable(gl.DEPTH_TEST);
gl.enable(gl.CULL_FACE);
gl.cullFace(gl.BACK);

// Uniform locations
const matrixLocation = gl.getUniformLocation(program, `mvpM`);

// Matrices for transformations
const modelMatrix = mat4.create();
const viewMatrix = mat4.create();
const projectionMatrix = mat4.create();
mat4.perspective(
    projectionMatrix,
    (75 * Math.PI) / 180, // Vertical field-of-view (angle, radians)
    canvas.width / canvas.height, // Aspect ratio
    1e-4, // Near cull distance
    1e4 // Far cull distance
);
const mvMatrix = mat4.create();
const mvpMatrix = mat4.create();

// Initial transformations
mat4.translate(modelMatrix, modelMatrix, [0, 0, -2]);
mat4.invert(viewMatrix, viewMatrix);

// Slider event listeners
document.getElementById('slider1').addEventListener('input', updateSliders);
document.getElementById('slider2').addEventListener('input', updateSliders);

function updateSliders() {
    slider1Value = parseInt(document.getElementById('slider1').value, 10);
    slider2Value = parseInt(document.getElementById('slider2').value, 10);

    // Regenerate sphere geometry
    const { vertices, indices } = generateSphereWireframe(1, slider1Value, slider2Value);
    currentIndices = indices;

    // Update buffers
    gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
}
// Animation loop
function animate() {
    requestAnimationFrame(animate);

    mat4.rotateY(modelMatrix, modelMatrix, Math.PI / 3 / 90);
    
    mat4.multiply(mvMatrix, viewMatrix, modelMatrix);
    mat4.multiply(mvpMatrix, projectionMatrix, mvMatrix);

    gl.uniformMatrix4fv(matrixLocation, false, mvpMatrix);

    draw();
}

animate();

// Draw function
function draw() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.drawElements(gl.POINTS, currentIndices.length, gl.UNSIGNED_SHORT, 0);
}

// Sphere generation
function generateSphereWireframe(radius, verticalVertexCount = 5, horizontalSliceCount = 10) {
    const vertices = [];
    const indices = [];

    for (let alpha = 0; alpha < 360; alpha += 360 / horizontalSliceCount) {
        const alphaRad = alpha * (Math.PI / 180);

        for (let vertex = 0; vertex <= verticalVertexCount; vertex++) {
            const theta = (vertex * Math.PI) / verticalVertexCount;

            const x = radius * Math.sin(theta) * Math.cos(alphaRad);
            const y = radius * Math.sin(theta) * Math.sin(alphaRad);
            const z = radius * Math.cos(theta);

            vertices.push(x, y, z);
        }
    }

    for (let slice = 0; slice < horizontalSliceCount; slice++) {
        for (let vertex = 0; vertex < verticalVertexCount; vertex++) {
            const start = slice * (verticalVertexCount + 1) + vertex;
            const end = start + 1;
            indices.push(start, end);
        }
    }

    for (let slice = 0; slice < horizontalSliceCount; slice++) {
        for (let vertex = 0; vertex <= verticalVertexCount; vertex++) {
            const start = slice * (verticalVertexCount + 1) + vertex;
            const end = ((slice + 1) % horizontalSliceCount) * (verticalVertexCount + 1) + vertex;
            indices.push(start, end);
        }
    }

    return { vertices, indices };
}

// Shader setup
function boilerPlate() {
    const vertexShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vertexShader, `
        attribute vec3 position;
        uniform mat4 mvpM;

        void main() {
            gl_Position = mvpM * vec4(position, 1);
        }
    `);
    gl.compileShader(vertexShader);

    const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fragmentShader, `
        precision highp float;
        void main() {
            gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
        }
    `);
    gl.compileShader(fragmentShader);

    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    return program;
}

// Helper to load data into buffer
function loadData(data) {
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);
    return buffer;
}
