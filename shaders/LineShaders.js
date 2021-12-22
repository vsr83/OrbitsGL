/**
 * Class implementing the shaders for drawing of lines.
 */
class LineShaders
{
    /**
     * Constructor.
     * 
     * @param {WebGLRenderingContext} gl
     *      The WebGL rendering context to use.
     */
    constructor(gl)
    {
        this.gl = gl;
        this.colorOrbit = [127, 127, 127];

        this.vertShaderLine = `#version 300 es
            // an attribute is an input (in) to a vertex shader.
            // It will receive data from a buffer
            in vec4 a_position;
            in vec4 a_color;

            // A matrix to transform the positions by
            uniform mat4 u_matrix;

            // a varying the color to the fragment shader
            out vec4 v_color;

            // all shaders have a main function
            void main() 
            {
                // Multiply the position by the matrix.
                gl_Position = u_matrix * a_position;

                // Pass the color to the fragment shader.
                v_color = a_color;
            }
            `;

        this.fragShaderLine = `#version 300 es
            precision highp float;

            // the varied color passed from the vertex shader
            in vec4 v_color;

            // we need to declare an output for the fragment shader
            out vec4 outColor;

            void main() 
            {
                outColor = v_color;
            }
            `;

            this.gridLines = 0;
    }

    /**
     * Initialize shaders and buffers.
     */
    init()
    {
        let gl = this.gl;
        this.program = compileProgram(gl, this.vertShaderLine, this.fragShaderLine);

        this.posAttrLocation = gl.getAttribLocation(this.program, "a_position");
        this.colorAttrLocation = gl.getAttribLocation(this.program, "a_color");
        this.matrixLocation = gl.getUniformLocation(this.program, "u_matrix");

        // Load orbit coordinates.
        this.vertexArray = gl.createVertexArray();
        gl.bindVertexArray(this.vertexArray);

        this.positionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
        gl.enableVertexAttribArray(this.posAttrLocation);
        gl.vertexAttribPointer(this.posAttrLocation, 3, gl.FLOAT, false, 0, 0);
    
        this.colorBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBuffer);
        gl.enableVertexAttribArray(this.colorAttrLocation);
        gl.vertexAttribPointer(this.colorAttrLocation, 3, gl.UNSIGNED_BYTE, true, 0, 0);

        gl.useProgram(this.program);
    }
  
    /**
     * Draw the orbit.
     * 
     * @param {*} viewMatrix 
     *      The view matrix.
     * @param {*} rA
     *      The right ascension of the light source.
     * @param {*} decl
     *      The declination of the light source.
     */
    draw(viewMatrix)
    {
        const gl = this.gl;

        gl.useProgram(this.program);
        gl.bindVertexArray(this.vertexArray);
        gl.uniformMatrix4fv(this.matrixLocation, false, viewMatrix);

        // Draw the grid.
        gl.drawArrays(gl.LINES, 0, this.gridLines * 2);  
    }

    // Fill the current ARRAY_BUFFER buffer with grid.
    setGeometry(points) 
    {
        let gl = this.gl;

        this.gridLines = points.length / 2;

        var positions = new Float32Array(points.length * 3);

        for (let indPoint = 0; indPoint < points.length; indPoint++)
        {
            const index = indPoint * 3; 
            const point = points[indPoint];

            positions[index] = point[0];
            positions[index + 1] = point[1];
            positions[index + 2] = point[2];
        }

        gl.bindVertexArray(this.vertexArray);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
        this.setColors(gl);
    }

    // Fill the current ARRAY_BUFFER buffer with colors for the 'F'.
    setColors()
    {
        let gl = this.gl;
        const colorArray = new Uint8Array(this.gridLines * 6);

        for (let indPoint = 0; indPoint < this.gridLines * 2; indPoint++)
        {
            const startIndex = indPoint * 3;
            colorArray[startIndex] = this.colorOrbit[0];
            colorArray[startIndex + 1] = this.colorOrbit[1];
            colorArray[startIndex + 2] = this.colorOrbit[2];
        }
        gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, colorArray, gl.STATIC_DRAW);
    }
}