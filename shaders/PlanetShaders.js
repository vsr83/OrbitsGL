/**
 * Class implementing the shaders for drawing of planets.
 */
class PlanetShaders
{
    /**
     * Constructor.
     * 
     * @param {WebGLRenderingContext} gl
     *      The WebGL rendering context to use.
     * @param {*} nLon
     *      Number of longitude divisions.
     * @param {*} nLat 
     *      Number of latitude divisions.
     * @param {*} a 
     *      Equatorial radius.
     * @param {*} b
     *      Polar radius.
     * @param {*} lonGridStep
     *      Longitude grid step.
     * @param {*} latGridStep
     *      Latitude grid step.
     */
    constructor(gl, nLon, nLat, a, b, lonGridStep, latGridStep)
    {
        this.gl = gl;
        this.a = a;
        this.b = b;
        this.nLat = nLat;
        this.nLon = nLon;
        this.lonGridStep = lonGridStep;
        this.latGridStep = latGridStep;

        this.colorGrid = [80, 80, 80];
        this.colorMap = [80, 80, 127];

        this.vertShaderSphere = `#version 300 es
        // an attribute is an input (in) to a vertex shader.
        // It will receive data from a buffer
        in vec4 a_position;
        in vec2 a_texcoord;
        
        // A matrix to transform the positions by
        uniform mat4 u_matrix;
        
        // a varying to pass the texture coordinates to the fragment shader
        out vec2 v_texcoord;
        
        // all shaders have a main function
        void main() 
        {
            // Multiply the position by the matrix.
            gl_Position = u_matrix * a_position;
        
            // Pass the texcoord to the fragment shader.
            v_texcoord = a_texcoord;
        }
        `;
        
        this.fragShaderSphere = `#version 300 es
        
        precision highp float;
        #define PI 3.1415926538
        #define A 6378137.0
        #define B 6356752.314245
        #define E 0.081819190842965
        #define R_EARTH 6371000.0
        
        // Passed in from the vertex shader.
        in vec2 v_texcoord;
        
        // The texture.
        uniform sampler2D u_imageDay;
        uniform sampler2D u_imageNight;
        uniform bool u_draw_texture;

        // 
        uniform float u_decl;
        uniform float u_rA;
        uniform float u_LST;
        uniform float u_iss_x;
        uniform float u_iss_y;
        uniform float u_iss_z;
        uniform bool u_show_iss;

        // we need to declare an output for the fragment shader
        out vec4 outColor;
        
        float deg2rad(in float deg)
        {
            return 2.0 * PI * deg / 360.0; 
        }

        float rad2deg(in float rad)
        {
            return 360.0 * rad / (2.0 * PI);
        }
        
        void main() 
        {
            if (u_draw_texture)
            {
                float lon = 2.0 * PI * (v_texcoord.x - 0.5);
                float lat = PI * (0.5 - v_texcoord.y);
                float LSTlon = u_LST + lon;
                float h = LSTlon - u_rA;

                // For Intel GPUs, the argument for asin can be outside [-1, 1] unless limited.
                float altitude = asin(clamp(cos(h)*cos(u_decl)*cos(lat) + sin(u_decl)*sin(lat), -1.0, 1.0));
                altitude = rad2deg(altitude);
    
                if (altitude > 0.0)
                {
                    // Day. 
                    outColor = texture(u_imageDay, v_texcoord);
                }
                else if (altitude > -6.0)
                {
                    // Civil twilight.
                    outColor = (0.5*texture(u_imageNight, v_texcoord) + 1.5*texture(u_imageDay, v_texcoord)) * 0.5;
                }
                else if (altitude > -12.0)
                {
                    // Nautical twilight.
                    outColor = (texture(u_imageNight, v_texcoord) + texture(u_imageDay, v_texcoord)) * 0.5;
                }
                else if (altitude > -18.0)
                {
                    // Astronomical twilight.
                    outColor = (1.5*texture(u_imageNight, v_texcoord) + 0.5*texture(u_imageDay, v_texcoord)) * 0.5;
                }
                else
                {
                    // Night.
                    outColor = texture(u_imageNight, v_texcoord);
                }

                if (u_show_iss)
                {
                    float longitude = rad2deg(lon);
                    float latitude  = rad2deg(lat);
            
                    // Surface coordinates.
                    float sinLat = sin(deg2rad(latitude));
                    float N = A / sqrt(1.0 - E*E*sinLat*sinLat);
        
                    float xECEF = N * cos(deg2rad(latitude)) * cos(deg2rad(longitude));
                    float yECEF = N * cos(deg2rad(latitude)) * sin(deg2rad(longitude));
                    float zECEF = (1.0 - E*E) * N * sin(deg2rad(latitude));
                    float normECEF = sqrt(xECEF * xECEF + yECEF * yECEF + zECEF * zECEF); 
        
                    float xDiff = u_iss_x - xECEF;
                    float yDiff = u_iss_y - yECEF;
                    float zDiff = u_iss_z - zECEF;
                    float normDiff = sqrt(xDiff * xDiff + yDiff * yDiff + zDiff * zDiff); 
        
                    float dotProduct = xECEF * xDiff + yECEF * yDiff + zECEF * zDiff;
                    float issAltitude = rad2deg(asin(dotProduct / (normECEF * normDiff)));
    
                    if (issAltitude > 0.0)
                    {
                        outColor = outColor + vec4(0.2, 0.0, 0.0, 0.0);
                    }
                }
            }
            else 
            {
                outColor = vec4(1.0, 1.0, 1.0, 1.0);
            }
        }
        `;

        this.vertShaderGrid = `#version 300 es
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

        this.fragShaderGrid = `#version 300 es
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
    }

    /**
     * Initialize shaders, buffers and textures.
     * 
     * @param {String} srcTextureDay
     *      URL of the texture for the iluminated part of the sphere. 
     * @param {String} srcTextureNight 
     *      URL of the texture for the non-iluminated part of the sphere.
     */
    init(srcTextureDay, srcTextureNight)
    {
        let gl = this.gl;
        this.program = compileProgram(gl, this.vertShaderSphere, this.fragShaderSphere);
        this.programGrid = compileProgram(gl, this.vertShaderGrid, this.fragShaderGrid);

        // Get attribute and uniform locations.
        this.posAttrLocation = gl.getAttribLocation(this.program, "a_position");
        this.texAttrLocation = gl.getAttribLocation(this.program, "a_texcoord");
        this.matrixLocation = gl.getUniformLocation(this.program, "u_matrix");

        this.posAttrLocationGrid = gl.getAttribLocation(this.programGrid, "a_position");
        this.colorAttrLocationGrid = gl.getAttribLocation(this.programGrid, "a_color");
        this.matrixLocationGrid = gl.getUniformLocation(this.programGrid, "u_matrix");

        this.vertexArrayPlanet = gl.createVertexArray();
        gl.bindVertexArray(this.vertexArrayPlanet);

        // Load planet vertex coordinates into a buffer.
        let positionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        this.setGeometry();
        gl.enableVertexAttribArray(this.posAttrLocation);
        gl.vertexAttribPointer(this.posAttrLocation, 3, gl.FLOAT, false, 0, 0);

        // Load texture vertex coordinates into a buffer.
        const texcoordBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer);
        this.setTexcoords();
        gl.enableVertexAttribArray(this.texAttrLocation);
        gl.vertexAttribPointer(this.texAttrLocation, 2, gl.FLOAT, true, 0, 0);        

        // Load grid coordinates.
        this.vertexArrayGrid = gl.createVertexArray();
        gl.bindVertexArray(this.vertexArrayGrid);

        this.positionBufferGrid = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBufferGrid);
        this.setGeometryGrid();
        gl.enableVertexAttribArray(this.posAttrLocationGrid);
        gl.vertexAttribPointer(this.posAttrLocationGrid, 3, gl.FLOAT, false, 0, 0);
      
        this.colorBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBuffer);
        this.setColorsGrid();
        gl.enableVertexAttribArray(this.colorAttrLocationGrid);
        gl.vertexAttribPointer(this.colorAttrLocationGrid, 3, gl.UNSIGNED_BYTE, true, 0, 0);

        // Initialize buffer for map coordinates.
        this.vertexArrayMap = gl.createVertexArray();
        gl.bindVertexArray(this.vertexArrayMap);

        this.positionBufferMap = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBufferMap);
        gl.enableVertexAttribArray(this.posAttrLocationGrid);
        gl.vertexAttribPointer(this.posAttrLocationGrid, 3, gl.FLOAT, false, 0, 0);
      
        this.colorBufferMap = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBufferMap);
        gl.enableVertexAttribArray(this.colorAttrLocationGrid);
        gl.vertexAttribPointer(this.colorAttrLocationGrid, 3, gl.UNSIGNED_BYTE, true, 0, 0);


        // Load textures:
        const imageDay = new Image();
        imageDay.src = srcTextureDay;
        const imageLocationDay = gl.getUniformLocation(this.program, "u_imageDay");
        
        const imageNight = new Image();
        imageNight.src = srcTextureNight;
        const imageLocationNight = gl.getUniformLocation(this.program, "u_imageNight");
        
        this.numTextures = 0;
        let instance = this;
        imageDay.addEventListener('load', function() {
            instance.loadTexture(0, imageDay, imageLocationDay);
        });
        imageNight.addEventListener('load', function() {
            instance.loadTexture(1, imageNight, imageLocationNight);
        });
            
        gl.useProgram(this.program);

        this.loadMaps();
    }

    /**
     * Load texture.
     * 
     * @param {Number} index 
     *      Index of the texture.
     * @param {Image} image 
     *      The image to be loaded.
     * @param {WebGLUniformLocation} imageLocation 
     *      Uniform location for the texture.
     */
    loadTexture(index, image, imageLocation)
    {
        let gl = this.gl;

        gl.useProgram(this.program);
        // Create a texture.
        var texture = gl.createTexture();

        // use texture unit 0
        gl.activeTexture(gl.TEXTURE0 + index);

        // bind to the TEXTURE_2D bind point of texture unit 0
        gl.bindTexture(gl.TEXTURE_2D, texture);

        // Fill the texture with a 1x1 blue pixel.
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
            new Uint8Array([0, 0, 255, 255]));
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
        gl.generateMipmap(gl.TEXTURE_2D);
        gl.uniform1i(imageLocation, index);
        this.numTextures = this.numTextures + 1;
    }

    /**
     * Insert array of numbers into Float32Array;
     * 
     * @param {*} buffer 
     *      Target buffer.
     * @param {*} index 
     *      Start index.
     * @param {*} arrayIn 
     *      Array to be inserted.
     */
    insertBufferFloat32(buffer, index, arrayIn)
    {
        for (let indArray = 0; indArray < arrayIn.length; indArray++)
        {
            buffer[index + indArray] = arrayIn[indArray]; 
        }
    }

    /**
     * Insert square segment of a sphere into a Float32Buffer.
     * 
     * @param {*} buffer 
     *      The target buffer.
     * @param {*} indRect 
     *      The index of the rectangle.
     * @param {*} lonStart 
     *      Longitude start of the rectangle.
     * @param {*} lonEnd 
     *      Longitude end of the rectangle.
     * @param {*} latStart 
     *      Latitude start of the rectangle.
     * @param {*} latEnd 
     *      Latitude end of the rectangle.
     */
    insertRectGeo(buffer, indRect, lonStart, lonEnd, latStart, latEnd)
    {
        const indStart = indRect * 3 * 6;

        const x1 = this.a * Math.cos(latStart) * Math.cos(lonStart);
        const y1 = this.a * Math.cos(latStart) * Math.sin(lonStart);
        const z1 = this.b * Math.sin(latStart);
        const x2 = this.a * Math.cos(latStart) * Math.cos(lonEnd);
        const y2 = this.a * Math.cos(latStart) * Math.sin(lonEnd);
        const z2 = this.b * Math.sin(latStart);
        const x3 = this.a * Math.cos(latEnd) * Math.cos(lonEnd);
        const y3 = this.a * Math.cos(latEnd) * Math.sin(lonEnd);
        const z3 = this.b * Math.sin(latEnd);
        const x4 = this.a * Math.cos(latEnd) * Math.cos(lonStart);
        const y4 = this.a * Math.cos(latEnd) * Math.sin(lonStart);
        const z4 = this.b * Math.sin(latEnd);

        this.insertBufferFloat32(buffer, indStart, [x1,y1,z1, x2,y2,z2, x3,y3,z3, 
            x1,y1,z1, x3,y3,z3, x4,y4,z4]);
    }

    /**
     * Fill vertex buffer for sphere triangles.
     */
    setGeometry() 
    {
        const gl = this.gl;
        const nTri = this.nLon * this.nLat * 2;
        const nPoints = nTri * 3;
        const positions = new Float32Array(nPoints * 3);

        for (let lonStep = 0; lonStep < this.nLon; lonStep++)
        {
            const lon = 2 * Math.PI * (lonStep / this.nLon - 0.5);
            const lonNext = 2 * Math.PI * ((lonStep + 1) / this.nLon - 0.5);

            for (let latStep = 0; latStep <= this.nLat-1; latStep++)
            {
                const lat =  Math.PI * (latStep / this.nLat - 0.5);
                const latNext = Math.PI * ((latStep + 1) / this.nLat - 0.5);
                const indTri = latStep + lonStep * this.nLat;
                this.insertRectGeo(positions, indTri, lon, lonNext, lat, latNext, 1);
            }  
        }
        gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
    }
    
    /**
     * Insert a texture coordinates for a square segment.
     * 
     * @param {*} buffer
     *      Target buffer. 
     * @param {*} indRect 
     *      Index of the rectangle.
     * @param {*} lonStart 
     *      Longitude start (radians).
     * @param {*} lonEnd 
     *      Longitude end (radians).
     * @param {*} latStart
     *      Latitude start (radians). 
     * @param {*} latEnd 
     *      Latitude end (radians).
     */
    insertRectTex(buffer, indRect, lonStart, lonEnd, latStart, latEnd)
    {
        const indStart  = indRect * 2 * 6;
        const uLonStart = (lonStart / (2 * Math.PI)) + 0.5;
        const uLonEnd   = (lonEnd / (2 * Math.PI)) + 0.5;
        const uLatStart = -(latStart) / Math.PI + 0.5;
        const uLatEnd   = -(latEnd) / Math.PI + 0.5;

        this.insertBufferFloat32(buffer, indStart, 
            [uLonStart, uLatStart, uLonEnd, uLatStart, uLonEnd,   uLatEnd,
             uLonStart, uLatStart, uLonEnd, uLatEnd,   uLonStart, uLatEnd]);
    }

    /**
     * Fill vertex buffer for textures
     */
    setTexcoords() 
    {
        const gl = this.gl;
        const nTri = this.nLon * this.nLat * 2;
        const nPoints = nTri * 3;
        const positions = new Float32Array(nPoints * 2);

        for (let lonStep = 0; lonStep <= this.nLon; lonStep++)
        {
            const lon = 2 * Math.PI * (lonStep / this.nLon - 0.5);
            const lonNext = 2 * Math.PI * ((lonStep + 1) / this.nLon - 0.5);

            for (let latStep = 0; latStep <= this.nLat; latStep++)
            {
                const lat =  Math.PI * (latStep / this.nLat - 0.5);
                const latNext = Math.PI * ((latStep + 1) / this.nLat - 0.5);
                const indTri = latStep + lonStep * this.nLat;

                this.insertRectTex(positions, indTri, lon, lonNext, lat, latNext);
            }  
        }
        gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
    }

    /**
     * Draw the planet.
     * 
     * @param {*} viewMatrix 
     *      The view matrix.
     * @param {*} rA
     *      The right ascension of the light source.
     * @param {*} decl
     *      The declination of the light source.
     * @param {*} drawTexture
     *      Whether to draw the texture.
     * @param {*} drawGrid
     *      Whether to draw the grid.
     * @param {*} drawMap 
     *      Whether to draw the map.
     * @param {*} rECEF
     *      ECEF coordinates of the satellite. Null if the drawing of visibility is skipped.
     */
    draw(viewMatrix, rA, decl, LST, drawTexture, drawGrid, drawMap, rECEF)
    {
        if (this.numTextures < 2)
        {
            return;
        }
        const gl = this.gl;

        gl.useProgram(this.program);
        gl.uniformMatrix4fv(this.matrixLocation, false, viewMatrix);

        const raLocation = gl.getUniformLocation(this.program, "u_rA");
        const declLocation = gl.getUniformLocation(this.program, "u_decl");
        const lstLocation = gl.getUniformLocation(this.program, "u_LST");
        const drawTextureLocation = gl.getUniformLocation(this.program, "u_draw_texture");

        const issXLocation = gl.getUniformLocation(this.program, "u_iss_x");
        const issYLocation = gl.getUniformLocation(this.program, "u_iss_y");
        const issZLocation = gl.getUniformLocation(this.program, "u_iss_z");
        const showIssLocation = gl.getUniformLocation(this.program, "u_show_iss");

        gl.uniform1f(raLocation, rA);
        gl.uniform1f(declLocation, decl);
        gl.uniform1f(lstLocation, LST);

        if (drawTexture)
        {
            gl.uniform1f(drawTextureLocation, 1);
        }
        else
        {
            gl.uniform1f(drawTextureLocation, 0);            
        }

        if (rECEF != null)
        {
            gl.uniform1f(showIssLocation, 1);
            gl.uniform1f(issXLocation, rECEF[0]);
            gl.uniform1f(issYLocation, rECEF[1]);
            gl.uniform1f(issZLocation, rECEF[2]);
            }
        else
        {
            gl.uniform1f(showIssLocation, 0);            
        }


        // Draw the sphere.
        gl.bindVertexArray(this.vertexArrayPlanet);
        const nTri = this.nLon * this.nLat * 2;
        const count = nTri * 3;
        gl.drawArrays(gl.TRIANGLES, 0, count);

        gl.useProgram(this.programGrid);
        gl.bindVertexArray(this.vertexArrayGrid);
        gl.uniformMatrix4fv(this.matrixLocationGrid, false, viewMatrix);

        // Draw the grid.
        if (drawGrid)
        {
            gl.drawArrays(gl.LINES, 0, this.gridLines * 2);
        }
        
        if (drawMap)
        {
            gl.bindVertexArray(this.vertexArrayMap);
            gl.drawArrays(gl.LINES, 0, this.gridLinesMap * 2);
        }
    }

    // Fill the current ARRAY_BUFFER buffer with grid.
    setGeometryGrid() 
    {
        let gl = this.gl;
        const points = [];
        let lonStep = 2.0;
        let latStep = this.latGridStep;
        let nLines = 0;

        let gridCoeff = 1.002;
        const nStepLat = Math.floor(90.0 / latStep);

        for (let lat = -nStepLat * latStep; lat <= nStepLat * latStep; lat += latStep)
        {
            for (let lon = -180.0; lon < 180.0; lon += lonStep)
            {
                const xStart = gridCoeff * this.a * MathUtils.cosd(lat) * MathUtils.cosd(lon);
                const yStart = gridCoeff * this.a * MathUtils.cosd(lat) * MathUtils.sind(lon);
                const zStart = gridCoeff * this.b * MathUtils.sind(lat);
                const xEnd = gridCoeff * this.a * MathUtils.cosd(lat) * MathUtils.cosd(lon + lonStep);
                const yEnd = gridCoeff * this.a * MathUtils.cosd(lat) * MathUtils.sind(lon + lonStep);
                const zEnd = gridCoeff * this.b * MathUtils.sind(lat);
                points.push([xStart, yStart, zStart]);
                points.push([xEnd, yEnd, zEnd]);
                nLines++;
            }
        }
        latStep = 2.0;
        lonStep = this.lonGridStep;
        const nStepLon = Math.floor(180.0 / lonStep);

        for (let lon = -nStepLon * lonStep; lon <= nStepLon * lonStep; lon += lonStep)
        {
            for (let lat = -90.0; lat < 90.0; lat += latStep)
            {
                const xStart = gridCoeff * this.a * MathUtils.cosd(lat) * MathUtils.cosd(lon);
                const yStart = gridCoeff * this.a * MathUtils.cosd(lat) * MathUtils.sind(lon);
                const zStart = gridCoeff * this.b * MathUtils.sind(lat);
                const xEnd = gridCoeff * this.a * MathUtils.cosd(lat + latStep) * MathUtils.cosd(lon);
                const yEnd = gridCoeff * this.a * MathUtils.cosd(lat + latStep) * MathUtils.sind(lon);
                const zEnd = gridCoeff * this.b * MathUtils.sind(lat + latStep);
                points.push([xStart, yStart, zStart]);
                points.push([xEnd, yEnd, zEnd]);
                nLines++;
            }
        }

        this.gridLines = nLines;
        var positions = new Float32Array(this.gridLines * 6);

        for (let indPoint = 0; indPoint < points.length; indPoint++)
        {
            let point = points[indPoint];
            let indStart = indPoint * 3;
            positions[indStart] = point[0];
            positions[indStart + 1] = point[1];
            positions[indStart + 2] = point[2];
        }
        gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
    }

    /**
     * Update grid resolution.
     * 
     * @param {*} lonRes
     *      Longitude resolution in degrees. 
     * @param {*} latRes 
     *      Latitude resolution in degrees.
     */
    updateGrid(lonRes, latRes)
    {
        this.lonGridStep = lonRes;
        this.latGridStep = latRes;

        gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBufferGrid);
        this.setGeometryGrid();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBuffer);
        this.setColorsGrid();
    }

    // Fill the current ARRAY_BUFFER buffer with colors for the 'F'.
    setColorsMap() 
    {
        let gl = this.gl;
        const colorArray = new Uint8Array(this.gridLinesMap * 6);

        for (let indPoint = 0; indPoint < this.gridLinesMap * 2; indPoint++)
        {
            const startIndex = indPoint * 3;
            colorArray[startIndex] = this.colorMap[0];
            colorArray[startIndex + 1] = this.colorMap[1];
            colorArray[startIndex + 2] = this.colorMap[2];
        }
        gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBufferMap);
        gl.bufferData(gl.ARRAY_BUFFER, colorArray, gl.STATIC_DRAW);
    }
  
    // Fill the current ARRAY_BUFFER buffer with colors for the 'F'.
    setColorsGrid() 
    {
        let gl = this.gl;
        const colorArray = new Uint8Array(this.gridLines * 6);

        for (let indPoint = 0; indPoint < this.gridLines * 2; indPoint++)
        {
            const startIndex = indPoint * 3;
            colorArray[startIndex] = this.colorGrid[0];
            colorArray[startIndex + 1] = this.colorGrid[1];
            colorArray[startIndex + 2] = this.colorGrid[2];
        }
        gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, colorArray, gl.STATIC_DRAW);
    }

    loadMapPolygons()
    {
        const points = [];
        let nLines = 0;
        let gl = this.gl;

        let gridCoeff = 1.002;

        for (let indPoly = 0; indPoly < this.polygons.length; indPoly++)
        {
            const poly = this.polygons[indPoly];

            for (let indPoint = 0; indPoint < poly.lon.length - 1; indPoint++)
            {
                const lonStart = poly.lon[indPoint];
                const latStart = poly.lat[indPoint];
                const lonEnd   = poly.lon[indPoint + 1];
                const latEnd   = poly.lat[indPoint + 1];

                const xStart = gridCoeff * this.a * MathUtils.cosd(latStart) * MathUtils.cosd(lonStart);
                const yStart = gridCoeff * this.a * MathUtils.cosd(latStart) * MathUtils.sind(lonStart);
                const zStart = gridCoeff * this.b * MathUtils.sind(latStart);
                const xEnd = gridCoeff * this.a * MathUtils.cosd(latEnd) * MathUtils.cosd(lonEnd);
                const yEnd = gridCoeff * this.a * MathUtils.cosd(latEnd) * MathUtils.sind(lonEnd);
                const zEnd = gridCoeff * this.b * MathUtils.sind(latEnd);

                points.push([xStart, yStart, zStart]);
                points.push([xEnd, yEnd, zEnd]);
                nLines++;
            }
        }

        this.gridLinesMap = nLines;
        const positions = new Float32Array(this.gridLinesMap * 6);

        for (let indPoint = 0; indPoint < points.length; indPoint++)
        {
            let point = points[indPoint];
            let indStart = indPoint * 3;
            positions[indStart] = point[0];
            positions[indStart + 1] = point[1];
            positions[indStart + 2] = point[2];
        }
        gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBufferMap);
        gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

        this.setColorsMap();

    }

    loadMaps()
    {
        let polygons = [];
        /**
         * Add polygon to the polygon list.
         * The method transforms the polygon from a list of lon-lat pairs to arrays
         * of lat and lon coordinates.
         * 
         * @param {*} polygon 
         *     Polygon as a list of lon-lat pairs.
         * @returns The number of points in the polygon.
         */
        let addPolygon = function(polygon)
        {
            var numPoints = polygon.length;
            var pointsLon = [];
            var pointsLat = [];

            for (var indPoint = 0; indPoint < numPoints; indPoint++)
            {
                pointsLon.push(polygon[indPoint][0]);
                pointsLat.push(polygon[indPoint][1]);
            }

            polygons.push({lon : pointsLon, lat : pointsLat});

            return numPoints;
        }

        this.polygons = [];
        const instance = this;

        var xmlHTTP = new XMLHttpRequest();
        xmlHTTP.onreadystatechange = function()
        {
            console.log("readyState: " + this.readyState);
            console.log("status:     " + this.status);
        
            if (this.readyState == 4 && this.status == 200)
            {
                // Parse JSON and initialize World map.
                let dataJSON = JSON.parse(this.responseText);
                console.log(dataJSON);

                var features = dataJSON.features;
                var numPointsTotal = 0;
        
                for (var index = 0; index < features.length; index++)
                {
                    // Read polygons and multi-polygons.
                    var feature = features[index];
                    var geometry = feature.geometry;
                    // TBD:
                    //var properties = feature.properties;
                    
                    if (geometry.type === "Polygon")
                    {
                        var coordinates = geometry.coordinates[0];
                        var numPoints = geometry.coordinates[0].length;
                        numPointsTotal += addPolygon(coordinates);
                    }
                    if (geometry.type === "MultiPolygon")
                    {
                        var numPolygons = geometry.coordinates.length;
        
                        for (var indPolygon = 0; indPolygon < numPolygons; indPolygon++)
                        {
                            var coordinates = geometry.coordinates[indPolygon][0];
                            numPointsTotal += addPolygon(coordinates);
                        }
                    }
                }
                console.log("Added " + numPointsTotal + " points");
                instance.polygons = polygons;
                console.log(instance.polygons);
                instance.loadMapPolygons();
            }
        }
        xmlHTTP.open("GET", "json/worldmap.json", true);
        xmlHTTP.send();
                
    }
}