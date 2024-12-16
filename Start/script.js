const canvas = document.querySelector('canvas')
const gl = canvas.getContext('webgl')




const vertexData = [
    //  x, y, z
        0, 1, 0,
        1, -1, 0,
        -1, -1, 0,
];
const colorData = [
        1, 0, 0,
        0, 1, 0,
        0, 0, 1,
];



posBuffer = loadData(vertexData);
colorBuffer = loadData(colorData);

const program = boilerPlate()


const positionLocation = gl.getAttribLocation(program, `position`);
gl.enableVertexAttribArray(positionLocation);
gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer)
gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 0, 0);

const colorLocation = gl.getAttribLocation(program, `color`);
gl.enableVertexAttribArray(colorLocation);
gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer)
gl.vertexAttribPointer(colorLocation, 3, gl.FLOAT, false, 0, 0);



gl.useProgram(program);

const uniformLocations = {
    posM: gl.getUniformLocation(program, `posM`),
}

const posM = mat4.create()
mat4.scale(posM, posM, [.5,.5,.5])


animate();

function draw() {
    gl.drawArrays(gl.TRIANGLES, 0, 3);
}
function animate() {
    requestAnimationFrame(animate);
    mat4.rotateZ(posM, posM, Math.PI/2/70)
    // mat4.scale(posM, posM, [.99,.99,.99])
    gl.uniformMatrix4fv(uniformLocations.posM, false, posM)
    draw();
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
        attribute vec3 color;
        varying vec3 vColor;
        uniform mat4 posM;

        void main() {
            vColor = color;
            gl_Position = posM * vec4(position, 1);
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

