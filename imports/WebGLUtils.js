/**
 * Compile the WebGL program.
 * 
 * @param {WebGLRenderingContext} gl
 *      The WebGL rendering context to use.
 * @param {String} vertexShaderSource
 *       Source of the vertex shader.
 * @param {String} fragmentShaderSource
 *       Source of the fragment shader.
 * @returns The compiled program.
 */
function compileProgram(gl, vertexShaderSource, fragmentShaderSource)
{
    const vertexShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vertexShader, vertexShaderSource);
    gl.compileShader(vertexShader);

    const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fragmentShader, fragmentShaderSource);
    gl.compileShader(fragmentShader);

    if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS))
    {
        console.log("compile");
    }

    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    
    gl.linkProgram(program);
    // Check the link status
    const linked = gl.getProgramParameter(program, gl.LINK_STATUS);
    if (!linked) 
    {
        // error.
        gl.deleteProgram(program);
    }

    return program;
}
 
/**
 * Resize a canvas to match the size its displayed.
 * 
 * @param {HTMLCanvasElement} canvas The canvas to resize.
 */
function resizeCanvasToDisplaySize(canvas) 
{
    const width  = canvas.clientWidth;
    const height = canvas.clientHeight;
    
    if (canvas.width !== width ||  canvas.height !== height) 
    {
        canvas.width  = width;
        canvas.height = height;
    }
}
