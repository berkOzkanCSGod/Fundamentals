const canvas = document.querySelector('canvas')
const gl = canvas.getContext('webgl')




let colorData = [];
for (let face = 0; face < 6; face++) {
    let faceColor = randomColor();
    for (let vertex = 0; vertex < 6; vertex++) {
        colorData.push(...faceColor)
    }
}

// F/Ba/T/B/R/L
const cubeVertices = [
    // Front face
    -1.0, -1.0,  1.0,
     1.0, -1.0,  1.0,
     1.0,  1.0,  1.0,
    -1.0, -1.0,  1.0,
     1.0,  1.0,  1.0,
    -1.0,  1.0,  1.0,

    // Back face
    -1.0, -1.0, -1.0,
    -1.0,  1.0, -1.0,
     1.0,  1.0, -1.0,
    -1.0, -1.0, -1.0,
     1.0,  1.0, -1.0,
     1.0, -1.0, -1.0,

    // Top face
    -1.0,  1.0, -1.0,
    -1.0,  1.0,  1.0,
     1.0,  1.0,  1.0,
    -1.0,  1.0, -1.0,
     1.0,  1.0,  1.0,
     1.0,  1.0, -1.0,

    // Bottom face
    -1.0, -1.0, -1.0,
     1.0, -1.0, -1.0,
     1.0, -1.0,  1.0,
    -1.0, -1.0, -1.0,
     1.0, -1.0,  1.0,
    -1.0, -1.0,  1.0,

    // Right face
     1.0, -1.0, -1.0,
     1.0,  1.0, -1.0,
     1.0,  1.0,  1.0,
     1.0, -1.0, -1.0,
     1.0,  1.0,  1.0,
     1.0, -1.0,  1.0,

    // Left face
    -1.0, -1.0, -1.0,
    -1.0, -1.0,  1.0,
    -1.0,  1.0,  1.0,
    -1.0, -1.0, -1.0,
    -1.0,  1.0,  1.0,
    -1.0,  1.0, -1.0,
];
const vertexNormals = [
    ...repeat(6, [0,0,1]),
    ...repeat(6, [0,0,-1]),
    ...repeat(6, [0,1,0]),
    ...repeat(6, [0,-1,0]),
    ...repeat(6, [1,0,0]),
    ...repeat(6, [-1,0,0]),
]

posBuffer = loadData(cubeVertices);
colorBuffer = loadData(colorData);
normalBuffer = loadData(vertexNormals)

const program = boilerPlate()

const positionLocation = gl.getAttribLocation(program, `position`);
gl.enableVertexAttribArray(positionLocation);
gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer)
gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 0, 0);

const normalLocation = gl.getAttribLocation(program, `normal`)
gl.enableVertexAttribArray(normalLocation)
gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer)
gl.vertexAttribPointer(normalLocation, 3, gl.FLOAT, false, 0, 0)


gl.useProgram(program);
gl.enable(gl.DEPTH_TEST)
gl.enable(gl.CULL_FACE);
gl.cullFace(gl.BACK);






// matrix
const matrixLocation = gl.getUniformLocation(program, `mvpM`)
const normalMatrixLocation = gl.getUniformLocation(program, `normalMatrix`)

const modelMatrix = mat4.create()
const viewMatrix = mat4.create()
const projectionMatrix = mat4.create();
mat4.perspective(projectionMatrix, 
    75 * Math.PI/180, // vertical field-of-view (angle, radians)
    canvas.width/canvas.height, // aspect W/H
    1e-4, // near cull distance
    1e4 // far cull distance
);

const mvMatrix = mat4.create()
const mvpMatrix = mat4.create()

const wMatrix = mat4.create()

mat4.translate(modelMatrix, modelMatrix, [0, 0, -5])
mat4.translate(viewMatrix, viewMatrix, [0, 0, 0])
mat4.invert(viewMatrix, viewMatrix);

// mat4.rotateY(modelMatrix, modelMatrix, Math.PI/(3));
// mat4.rotateX(modelMatrix, modelMatrix, -3*Math.PI/4);
const normalMatrix = mat4.create();
mat4.invert(normalMatrix, mvMatrix);
mat4.transpose(normalMatrix, normalMatrix);








animate();

function animate() {
    requestAnimationFrame(animate);

    mat4.rotateY(modelMatrix, modelMatrix, Math.PI/3/70);

    mat4.multiply(mvMatrix, viewMatrix, modelMatrix);
    mat4.multiply(mvpMatrix, projectionMatrix, mvMatrix);


    mat4.invert(normalMatrix, mvMatrix);
    mat4.transpose(normalMatrix, normalMatrix);


    gl.uniformMatrix4fv(normalMatrixLocation, false, normalMatrix)
    gl.uniformMatrix4fv(matrixLocation, false, mvpMatrix)

    draw()
}

function boilerPlate() {

    const vertexShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vertexShader, `        
        attribute vec3 position;
        attribute vec3 normal;
        uniform mat4 mvpM;

        uniform mat4 normalMatrix;
        varying highp vec3 vLighting;
        
        void main() {
            gl_Position = mvpM * vec4(position, 1);


            highp vec3 ambientLight = vec3(0.3, 0.3, 0.3);
            highp vec3 directionalLightColor = vec3(1, 1, 1);
            highp vec3 directionalVector = normalize(vec3(0.85, 0.8, 0.75));
            highp vec4 transformedNormal = normalMatrix * vec4(position, 1.0);
            highp float directional = max(dot(transformedNormal.xyz, directionalVector), 0.0);
            vLighting = ambientLight + (directionalLightColor * directional);
        }
    
    `);
    
    gl.compileShader(vertexShader);
    
    const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER)
    gl.shaderSource(fragmentShader, `
        precision highp float;
        varying highp vec3 vLighting;
        vec3 color = vec3(0.9, 0.7, 0.4);

        void main() {
            // gl_FragColor = vec4(1.0 * vLighting, 0.5 * vLighting, 1.0 * vLighting, 1.0);
        
            gl_FragColor = vec4(color * vLighting, 1.0);
        }
    
    `);
    gl.compileShader(fragmentShader);
    
    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    return program;

}

function repeat(n, pattern) {
    return [...Array(n)].reduce(sum => sum.concat(pattern), [])
}

function randomColor() {
    return [Math.random(), Math.random(), Math.random()];
}

function normalize(vec) {
    const [x, y, z] = vec;
    const magnitude = Math.sqrt(x * x + y * y + z * z);
    return [x / magnitude, y / magnitude, z / magnitude];
}

function loadData(data) {
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);
    return buffer;
}

function draw() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, cubeVertices.length/3);
}
