/* Javascript Object3D class
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
 */

function Object3D(x,y,orient,modelName){
	this.x = x;
	this.y = y;
	this.z = 0;
	this.orient = orient;	
	this.modelName = modelName;
	if(modelName){
		this.z = world.getH(this.x,this.y);
		this.scale = models[modelName].scale;
		if (models[modelName].sizeRange)
			this.scale += this.scale*(1-2*rand())*models[modelName].sizeRange;
		if (models[modelName].orient)
			this.orient += models[modelName].orient;
		if(models[modelName].collision)
			if(models[modelName].collision.type=='circle')
				this.collision = new CircleCollision(this,models[modelName].collision.radius*this.scale);
			else if(models[modelName].collision.type=='rect')
				this.collision = new RectCollision(this,models[modelName].collision.collisionW*this.scale,models[modelName].collision.collisionH*this.scale);
	}
}

Object3D.prototype.moveTo = function (x,y){
	this.x = x;
	this.y = y;
	this.z = world.getH(this.x,this.y);
}

Object3D.prototype.draw = function (){
	mvPushMatrix();
	mat4.translate(mvMatrix,[this.x, this.y,this.z]);
	mat4.rotate(mvMatrix, degToRad(this.orient), [0, 0, 1]);
	if (this.axisAngle)
		mat4.rotate(mvMatrix, degToRad(this.axisAngle.angle), [this.axisAngle.x, this.axisAngle.y, this.axisAngle.z]);
	if(this.parentModif){
		//debug("modif");
		if(this.parentModif.trans)
			mat4.translate(mvMatrix,[this.parentModif.trans.x, this.parentModif.trans.y,this.parentModif.trans.z]);
		if(this.parentModif.axisAngle)
			mat4.rotate(mvMatrix, degToRad(this.parentModif.axisAngle.angle), [this.parentModif.axisAngle.x, this.parentModif.axisAngle.y, this.parentModif.axisAngle.z]);
	}
	if(this.scale)
		mat4.scale(mvMatrix,[this.scale,this.scale,this.scale]);
	if(this.mesh){
		if (this.mesh.type =='health'){
			gl.useProgram(this.mesh.shaderProgram);
			gl.uniform1f(this.mesh.shaderProgram.lifePercent, this.parent.currentHp/this.parent.maxHp);
		}
		this.mesh.draw();
	}else if(models[this.modelName].mesh){
		this.mesh = models[this.modelName].mesh;
	}
	mvPopMatrix();	
}

