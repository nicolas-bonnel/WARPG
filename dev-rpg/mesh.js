/* Javascript Mesh class
 *
 * Copyright (C) 2010   Nicolas Bonnel (nicolas.bonnel@gmail.com)
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 * Some parts of this program were inspired from this site : http://learningwebgl.com/blog/
 */

function Mesh(type){
	this.vertices = [];
	this.materials = [];
	this.normals = [];
	this.textures = [];
	this.type = type;
}


function getShader(gl, id) {
	var shaderScript = document.getElementById(id);
	if (!shaderScript)
		return null;
	var str = "";
    	var k = shaderScript.firstChild;
    	while (k) {
      		if (k.nodeType == 3)
        		str += k.textContent;
      		k = k.nextSibling;
    	}
	var shader;
    	if (shaderScript.type == "x-shader/x-fragment")
      		shader = gl.createShader(gl.FRAGMENT_SHADER);
    	else if (shaderScript.type == "x-shader/x-vertex")
      		shader = gl.createShader(gl.VERTEX_SHADER);
	else
      		return null;
	gl.shaderSource(shader, str);
	gl.compileShader(shader);
	if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)){
      		error(gl.getShaderInfoLog(shader));
      		return null;
    	}
	return shader;
}

Mesh.prototype.initShaders = function (){
	var fragmentShader = getShader(gl, 'shader-'+this.type+'-fs');
    	var vertexShader = getShader(gl, 'shader-'+this.type+'-vs');
    	this.shaderProgram = gl.createProgram();
    	gl.attachShader(this.shaderProgram, vertexShader);
    	gl.attachShader(this.shaderProgram, fragmentShader);
    	gl.linkProgram(this.shaderProgram);
    	if (!gl.getProgramParameter(this.shaderProgram, gl.LINK_STATUS))
      		error("Could not initialise shaders");
    	gl.useProgram(this.shaderProgram);

	if(this.type != 'particle'){
		this.shaderProgram.ambiantLight = gl.getUniformLocation(this.shaderProgram, "uAmbiantLight");
		this.shaderProgram.directionnalLight = gl.getUniformLocation(this.shaderProgram, "uDirectionnalLight");
	}
	this.shaderProgram.normalsAttribute = gl.getAttribLocation(this.shaderProgram, "aNormals");
	gl.enableVertexAttribArray(this.shaderProgram.normalsAttribute);
	this.shaderProgram.textureCoordAttribute = gl.getAttribLocation(this.shaderProgram, "aTextureCoord");

    	this.shaderProgram.pMatrixUniform = gl.getUniformLocation(this.shaderProgram, "uPMatrix");
    	this.shaderProgram.mvMatrixUniform = gl.getUniformLocation(this.shaderProgram, "uMVMatrix");
	this.shaderProgram.samplerUniform = [];
    	this.shaderProgram.samplerUniform.push(gl.getUniformLocation(this.shaderProgram, "uSampler"));

	if(this.type == 'anim'){
		this.shaderProgram.weight1 = gl.getAttribLocation(this.shaderProgram, "aWeightPosition1");
	    	gl.enableVertexAttribArray(this.shaderProgram.weight1);
		this.shaderProgram.weight2 = gl.getAttribLocation(this.shaderProgram, "aWeightPosition2");
	   	gl.enableVertexAttribArray(this.shaderProgram.weight2);
		this.shaderProgram.weightBlend = gl.getAttribLocation(this.shaderProgram, "weightBlend");
	    	gl.enableVertexAttribArray(this.shaderProgram.weightBlend);

		this.shaderProgram.jointOrient = gl.getUniformLocation(this.shaderProgram, "jointOrient");
		this.shaderProgram.jointPos = gl.getUniformLocation(this.shaderProgram, "jointPos");
		this.shaderProgram.useTexturesUniform = gl.getUniformLocation(this.shaderProgram, "uUseTextures");
		gl.uniform1i(this.shaderProgram.useTexturesUniform, false);
	}else if(this.type == 'static'){
		this.shaderProgram.vertices = gl.getAttribLocation(this.shaderProgram, "aVertexPosition");
	    	gl.enableVertexAttribArray(this.shaderProgram.vertices);
		this.shaderProgram.useTexturesUniform = gl.getUniformLocation(this.shaderProgram, "uUseTextures");
		gl.uniform1i(this.shaderProgram.useTexturesUniform, false);
	}else if(this.type == 'terrain'){
		this.shaderProgram.vertices = gl.getAttribLocation(this.shaderProgram, "aVertexPosition");
	    	gl.enableVertexAttribArray(this.shaderProgram.vertices);
	    	this.shaderProgram.samplerUniform.push(gl.getUniformLocation(this.shaderProgram, "uSampler2"));
	    	this.shaderProgram.samplerUniform.push(gl.getUniformLocation(this.shaderProgram, "uSampler3"));
		this.shaderProgram.samplerUniform.push(gl.getUniformLocation(this.shaderProgram, "uSampler4"));
	}else if(this.type == 'health'){
		this.shaderProgram.vertices = gl.getAttribLocation(this.shaderProgram, "aVertexPosition");
	    	gl.enableVertexAttribArray(this.shaderProgram.vertices);
		this.shaderProgram.lifePercent = gl.getUniformLocation(this.shaderProgram, "lifePercent");
		gl.uniform1f(this.shaderProgram.lifePercent, 1.0);
	}else if(this.type == 'particle'){
		this.shaderProgram.vertices = gl.getAttribLocation(this.shaderProgram, "aVertexPosition");
	    	gl.enableVertexAttribArray(this.shaderProgram.vertices);
		this.shaderProgram.time = gl.getUniformLocation(this.shaderProgram, "time");
		gl.uniform1f(this.shaderProgram.time, 0.0);
	}
}

Mesh.prototype.initBuffers = function () {
	if (this.normals.length>0){
		this.normalsBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, this.normalsBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.normals), gl.STATIC_DRAW);
	    	this.normalsBuffer.itemSize = 3;
	}
	if (this.textures.length>0){
		this.vertexTextureCoordBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexTextureCoordBuffer);
		gl.useProgram(this.shaderProgram);
		gl.enableVertexAttribArray(this.shaderProgram.textureCoordAttribute);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.textures), gl.STATIC_DRAW);
		if(this.type == 'particle' || this.type == 'terrain')
	   		this.vertexTextureCoordBuffer.itemSize = 3;
		else
			this.vertexTextureCoordBuffer.itemSize = 2;
	}
	for (var i=0;i<this.materials.length;i++){
		if (this.materials[i].faces){
			this.materials[i].elementBuffer = gl.createBuffer();
			gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.materials[i].elementBuffer);
			gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.materials[i].faces), gl.STATIC_DRAW);
		    	this.materials[i].elementBuffer.itemSize = 1;
		    	this.materials[i].elementBuffer.numItems = (this.materials[i].faces.length);
		}
	}
	
	if(this.type == 'anim'){
		this.weight1Buffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, this.weight1Buffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.weight1), gl.STATIC_DRAW);
	    	this.weight1Buffer.itemSize = 4;

		this.weight2Buffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, this.weight2Buffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.weight2), gl.STATIC_DRAW);
	    	this.weight2Buffer.itemSize = 4;

		this.weightBlendBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, this.weightBlendBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.weightBlend), gl.STATIC_DRAW);
	    	this.weightBlendBuffer.itemSize = 2;
	}else {
		this.verticesBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, this.verticesBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.vertices), gl.STATIC_DRAW);
	    	this.verticesBuffer.itemSize = 3;
	    	this.verticesBuffer.numItems = (this.vertices.length)/3;
	}
}

Mesh.prototype.draw = function () {
	gl.useProgram(this.shaderProgram);
	//debug(this);
	//debug(this.shaderProgram);
	if (this.type!='particle'){
		gl.uniform3f(this.shaderProgram.ambiantLight,0.2,0.2,0.2);
		gl.uniform3f(this.shaderProgram.directionnalLight,0.8,0.8,0.8);
	}

	setMatrixUniforms(this.shaderProgram);
	
	gl.bindBuffer(gl.ARRAY_BUFFER,this.normalsBuffer);
    	gl.vertexAttribPointer(this.shaderProgram.normalsAttribute, this.normalsBuffer.itemSize, gl.FLOAT, false, 0, 0);	

	if (this.type=='anim'){
		gl.bindBuffer(gl.ARRAY_BUFFER,this.weight1Buffer);
	    	gl.vertexAttribPointer(this.shaderProgram.weight1, this.weight1Buffer.itemSize, gl.FLOAT, false, 0, 0);
		gl.bindBuffer(gl.ARRAY_BUFFER,this.weight2Buffer);
	    	gl.vertexAttribPointer(this.shaderProgram.weight2, this.weight2Buffer.itemSize, gl.FLOAT, false, 0, 0);
		gl.bindBuffer(gl.ARRAY_BUFFER,this.weightBlendBuffer);
	    	gl.vertexAttribPointer(this.shaderProgram.weightBlend, this.weightBlendBuffer.itemSize, gl.FLOAT, false, 0, 0);
	}else{
		gl.bindBuffer(gl.ARRAY_BUFFER,this.verticesBuffer);
		gl.vertexAttribPointer(this.shaderProgram.vertices, this.verticesBuffer.itemSize, gl.FLOAT, false, 0, 0);
	}
	if (this.textures.length>0){
		gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexTextureCoordBuffer);
		gl.enableVertexAttribArray(this.shaderProgram.textureCoordAttribute);
		gl.vertexAttribPointer(this.shaderProgram.textureCoordAttribute, this.vertexTextureCoordBuffer.itemSize, gl.FLOAT, false, 0, 0);
	}

	//debug(this.materials.length);
	for (var i=0;i<this.materials.length;i++){
		for(var j=0;j<this.materials[i].textures.length;j++){
			gl.activeTexture(gl.TEXTURE0+j);
			gl.bindTexture(gl.TEXTURE_2D, this.materials[i].textures[j]);
			gl.uniform1i(this.shaderProgram.samplerUniform[j], j);
		}
		if (this.type!='particle'){
	    		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.materials[i].elementBuffer);
	    		gl.drawElements(gl.TRIANGLES,this.materials[i].elementBuffer.numItems, gl.UNSIGNED_SHORT, 0);
		}else
			gl.drawArrays(gl.POINTS, 0, this.verticesBuffer.numItems);
	}

}

Mesh.prototype.deleteBuffers = function (){
	if (this.normals.length>0)
		gl.deleteBuffer(this.normalsBuffer);
	if (this.textures.length>0)
		gl.deleteBuffer(this.vertexTextureCoordBuffer);
	for (var i=0;i<this.materials.length;i++)
		if (this.materials[i].faces)
			gl.deleteBuffer(this.materials[i].elementBuffer);	
	if(this.type == 'anim'){
		gl.deleteBuffer(this.weight1Buffer);
		gl.deleteBuffer(this.weight2Buffer);
		gl.deleteBuffer(this.weightBlendBuffer);
	}else
		gl.deleteBuffer(this.verticesBuffer);
}
