const canvas = document.querySelector('canvas')
const gl = canvas.getContext('webgl')



function pointCloud(pCount) {
    let points = [];
    for (let i = 0; i < pCount; i++) {
        const r = () => Math.random() - .5;
        const inputP = [r(), r(), r()];

        const oPoint = vec3.normalize(vec3.create(), inputP)

        points.push(...oPoint);
    }
    return points;
}

vertexData = pointCloud(1e5);
console.log(vertexData)
posBuffer = loadData(vertexData);
const program = boilerPlate()


const positionLocation = gl.getAttribLocation(program, `position`);
gl.enableVertexAttribArray(positionLocation);
gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer)
gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 0, 0);

gl.useProgram(program);
gl.enable(gl.DEPTH_TEST)


const uniformLocations = {
    mvpM: gl.getUniformLocation(program, `mvpM`),
}

const modelMatrix = mat4.create();
const viewMatrix = mat4.create();
const projectionMatrix = mat4.create();
mat4.perspective(projectionMatrix, 
    75 * Math.PI/180, // vertical field-of-view (angle, radians)
    canvas.width/canvas.height, // aspect W/H
    1e-4, // near cull distance
    1e4 // far cull distance
);

const mvMatrix = mat4.create();
const mvpMatrix = mat4.create();


mat4.translate(modelMatrix, modelMatrix, [0, 0, 0]);
mat4.translate(viewMatrix, viewMatrix, [0, 0, 2]);

mat4.invert(viewMatrix, viewMatrix);


animate();

function draw() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.drawArrays(gl.POINTS, 0, vertexData.length/3);
}

function animate() {
    requestAnimationFrame(animate);

    mat4.rotateY(modelMatrix, modelMatrix, Math.PI/3/60);
    mat4.multiply(mvMatrix, viewMatrix, modelMatrix);
    mat4.multiply(mvpMatrix, projectionMatrix, mvMatrix);
    gl.uniformMatrix4fv(uniformLocations.mvpM, false, mvpMatrix);
    draw()
}



function randomColor() {
    return [Math.random(), Math.random(), Math.random()];
}

function loadData(data) {
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);
    return buffer;
}

function boilerPlate() {

    const vertexShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vertexShader, `        
        attribute vec3 position;
        varying vec3 vColor;
        uniform mat4 mvpM;

        void main() {
            vColor = vec3(position.xy, 1);
            gl_Position = mvpM * vec4(position, 1);
        }
    
    `);
    
    gl.compileShader(vertexShader);
    
    const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER)
    gl.shaderSource(fragmentShader, `
        precision highp float;

        varying vec3 vColor;
    
        void main() {
            gl_FragColor = vec4(vColor, 1);
        }
    
    `);
    gl.compileShader(fragmentShader);
    
    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    return program;

}

