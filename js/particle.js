/* Javascript Particle system class
 *
 * Copyright (C) 2011   Nicolas Bonnel (nicolas.bonnel@gmail.com)
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
 */

/*
 Create a number particle, used for damages.
 @ num the number to be displayed in the range [O;9]
*/
function NumberParticule(num){
	this.loop = false;
	this.duration = 1.0;
	this.mesh = new Mesh('particle');
	this.mesh.materials.push(new Object());
	this.mesh.materials[0].textures = [];
	this.mesh.materials[0].textures.push(initTexture('data/text/particle/numbers/'+num+'.png'));
	this.mesh.vertices.push(0.0);
	this.mesh.vertices.push(0.0);
	this.mesh.vertices.push(3.0);
	this.mesh.normals.push(0.0);
	this.mesh.normals.push(0.0);
	this.mesh.normals.push(1.0);
	this.mesh.textures.push(-0.5);
	this.mesh.textures.push(0.7);
	this.mesh.textures.push(3.0);
	this.mesh.initShaders();
	this.mesh.initBuffers();
}

/*
 Used to create tree particle systems such as lightnings.
 @ px,py,pz : coordinate of previous particle in the tree.
 @ mesh : the mesh of the particle system that will be sent to the graphic card.
 @ num : number of remaining particle to create
 @ jsonPart : a string describing a particle in json format
*/
function recPart(px,py,pz,mesh,num,jsonParts){
	var x = px + eval(jsonParts.speedX);
	var y = py + eval(jsonParts.speedY);
	var z = pz + eval(jsonParts.speedZ);
	mesh.vertices.push(px);
	mesh.vertices.push(py);
	mesh.vertices.push(pz);
	mesh.normals.push(px-x);
	mesh.normals.push(py-y);
	mesh.normals.push(pz-z);
	mesh.textures.push(eval(jsonParts.timeOffset));
	mesh.textures.push(eval(jsonParts.amplitude));
	mesh.textures.push(eval(jsonParts.imgSize));
	if(num>0)
		recPart(x,y,z,mesh,num-1,jsonParts);
}

/*
 Particle constructor
 @ jsonParts : a string describing a particle in json format
*/
function Particles(jsonParts){
	this.loop = jsonParts.loop;
	this.duration = jsonParts.duration;
	this.mesh = new Mesh('particle');
	this.mesh.materials.push(new Object());
	this.mesh.materials[0].textures = [];
	this.mesh.materials[0].textures.push(initTexture('data/text/particle/'+jsonParts.img));
	var numParts = jsonParts.numParts;
	if (jsonParts.type && jsonParts.type =='tree')
		recPart(eval(jsonParts.startX),eval(jsonParts.startY),eval(jsonParts.startZ),this.mesh,numParts,jsonParts);
	else
		for (var i=0;i<numParts;i++){
			if(jsonParts.startXY){
				var pos = eval(jsonParts.startXY);
				this.mesh.vertices.push(pos.x);
				this.mesh.vertices.push(pos.y);
			}else{
				this.mesh.vertices.push(eval(jsonParts.startX));
				this.mesh.vertices.push(eval(jsonParts.startY));
			}
			this.mesh.vertices.push(eval(jsonParts.startZ));
			this.mesh.normals.push(eval(jsonParts.speedX));
			this.mesh.normals.push(eval(jsonParts.speedY));
			this.mesh.normals.push(eval(jsonParts.speedZ));
			this.mesh.textures.push(eval(jsonParts.timeOffset));
			this.mesh.textures.push(eval(jsonParts.amplitude));
			this.mesh.textures.push(eval(jsonParts.imgSize));
		}
	this.mesh.initShaders();
	this.mesh.initBuffers();
}

/*
 Create a particle emitter.
 @ parent : an object with coordinates (x,y,z). Particles will be drawn on this object position. 
 @ particle : a string which is the particle's name.
*/
function ParticleEmitter(parent,particle){
	this.parent = parent;
	this.currentTime = 0.0;
	this.alive = true;
	this.parts = particles[particle];
}

/*
 Compute particles position according to elapsed time.
 @ elapsed : elapsed time since last frame in seconds.
*/
ParticleEmitter.prototype.process = function(elapsed){
	gl.useProgram(this.parts.mesh.shaderProgram);
	this.currentTime += elapsed;
	if (this.currentTime>this.parts.duration)
		if(this.parts.loop)
			while(this.currentTime>this.parts.duration)
				this.currentTime -= this.parts.duration;
		else{
			this.currentTime = this.parts.duration;
			this.alive = false;
		}
	gl.uniform1f(this.parts.mesh.shaderProgram.time, this.currentTime/this.parts.duration);
}

/*
 Used to terminate particles, or stop looping particle.
*/
ParticleEmitter.prototype.finalize= function(){
	this.alive = false;
}

/*
 Particles drawing function. Draw the particles according to parent position and orientation.
*/
ParticleEmitter.prototype.draw = function(){
	mvPushMatrix();
	mat4.translate(mvMatrix,[this.parent.x,this.parent.y,this.parent.z]);
	if(this.parent.orient)
		mat4.rotate(mvMatrix, degToRad(this.parent.orient), [0, 0, 1]);
	this.parts.mesh.draw();
	mvPopMatrix();	
}
