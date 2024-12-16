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
const worldMatrixLocation = gl.getUniformLocation(program, `worldMatrix`)
const cameraMatrixLocation = gl.getUniformLocation(program, `worldCameraPosition`)

const worldM = mat4.create();
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
mat4.translate(worldM, worldM, [0, 0, -5])
mat4.translate(viewMatrix, viewMatrix, [0, 0, 0])
mat4.translate(cameraMatrixLocation, cameraMatrixLocation, [0, 0, 0])
mat4.invert(viewMatrix, viewMatrix);

// mat4.rotateY(modelMatrix, modelMatrix, Math.PI/(3));
// mat4.rotateX(modelMatrix, modelMatrix, -3*Math.PI/4);
const normalMatrix = mat4.create();
mat4.invert(normalMatrix, mvMatrix);
mat4.transpose(normalMatrix, normalMatrix);

// Assume shader program is linked and stored in `program`
const lightColorLocation = gl.getUniformLocation(program, 'lightColor');
const ambientLightLocation = gl.getUniformLocation(program, 'ambientLight');
const shininessLocation = gl.getUniformLocation(program, 'shininess');
const lightPositionLocation = gl.getUniformLocation(program, 'worldLightPosition');

const lightPosition = [1.0, 0.0, 0.0];
const normalizedLightPosition = normalize(lightPosition);




animate();

function animate() {
    requestAnimationFrame(animate);

    mat4.rotateY(modelMatrix, modelMatrix, Math.PI/3/70);
    mat4.rotateY(worldM, worldM, Math.PI/3/70);

    mat4.multiply(mvMatrix, viewMatrix, modelMatrix);
    mat4.multiply(mvpMatrix, projectionMatrix, mvMatrix);


    mat4.invert(normalMatrix, mvMatrix);
    mat4.transpose(normalMatrix, normalMatrix);


    gl.uniformMatrix4fv(normalMatrixLocation, false, normalMatrix)
    gl.uniformMatrix4fv(matrixLocation, false, mvpMatrix)
    gl.uniformMatrix4fv(worldMatrixLocation, false, worldM)
    gl.uniform3f(lightColorLocation, 1.0, 0.0, 0.0);  // Set to white light
    gl.uniform3f(ambientLightLocation, 0.3, 0.3, 0.3);  // Set to soft gray ambient light
    gl.uniform1f(shininessLocation, 0.3);  // Set to default shininess
    gl.uniform3f(lightPositionLocation, ...normalizedLightPosition);
    
    draw()
}

function boilerPlate() {

    const vertexShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vertexShader, `        
        attribute vec3 position;   // Vertex position in model space
        attribute vec3 normal;     // Normal vector in model space

        uniform mat4 mvpM;         // Model-View-Projection matrix
        uniform mat4 worldMatrix;  // World matrix for transforming positions
        uniform mat4 normalMatrix; // Normal matrix (inverse transpose of the world matrix)
        uniform vec3 worldLightPosition; // Light position in world space
        uniform vec3 worldCameraPosition; // Camera position in world space (for specular)

        varying vec3 vSurfaceToLight;   // Surface-to-light vector (world space)
        varying vec3 vSurfaceToView;    // Surface-to-view vector (world space)
        varying vec3 vNormal;           // Normal vector (world space)

        void main() {
            // Transform position to clip space
            gl_Position = mvpM * vec4(position, 1.0);

            // Compute surface world position
            vec3 surfaceWorldPosition = (worldMatrix * vec4(position, 1.0)).xyz;

            // Surface-to-light vector
            vSurfaceToLight = normalize(worldLightPosition - surfaceWorldPosition);

            // Surface-to-view vector
            vSurfaceToView = normalize(worldCameraPosition - surfaceWorldPosition);

            // Transform normal to world space
            vNormal = normalize((normalMatrix * vec4(normal, 0.0)).xyz);
        }

    `);
    
    gl.compileShader(vertexShader);
    
    const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER)
    gl.shaderSource(fragmentShader, `
        precision highp float;

        // Inputs from the vertex shader
        varying vec3 vSurfaceToLight;
        varying vec3 vSurfaceToView;
        varying vec3 vNormal;

        uniform vec3 lightColor;  // Light color (e.g., vec3(1.0, 1.0, 1.0))
        uniform vec3 ambientLight; // Ambient light color (e.g., vec3(0.3, 0.3, 0.3))
        uniform float shininess;   // Specular shininess factor

        void main() {
            // Normalize the interpolated normal
            vec3 normal = normalize(vNormal);

            // Diffuse lighting
            float diffuseStrength = max(dot(normal, vSurfaceToLight), 0.0);
            vec3 diffuse = lightColor * diffuseStrength;

            // Specular lighting
            vec3 reflection = reflect(-vSurfaceToLight, normal);
            float specularStrength = pow(max(dot(reflection, vSurfaceToView), 0.0), shininess);
            vec3 specular = lightColor * specularStrength;

            // Combine lighting components
            vec3 color = vec3(0.9, 0.7, 0.4); // Object's base color
            vec3 phongLighting = ambientLight + diffuse + specular;
            vec3 finalColor = color * phongLighting;

            gl_FragColor = vec4(finalColor, 1.0);
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
