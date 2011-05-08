/* Javascript Projectile class
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

function Projectile(parent,projectiles,skill,i){
	var orientation = (parent.parent.orient+90)*pi/180;
	this.orient = parent.parent.orient;
	var cast = parent.parent.cast.level;
	var numProjs = Math.ceil(eval(skill.numProjs));
	this.parent = parent;
	this.lifeDraw = [];
	this.finishDraw = [];
	this.x = eval(projectiles.startX)+parent.x;
	this.y = eval(projectiles.startY)+parent.y;
	this.h = eval(projectiles.startZ)+parent.z;
	this.vx = eval(projectiles.speedX);
	this.vy = eval(projectiles.speedY);
	this.vz = eval(projectiles.speedZ);
	this.radius = eval(projectiles.radius);
	this.duration = projectiles.duration;
	this.dead = false;
	if (projectiles.loop){
		this.loop = eval(projectiles.loop);
		this.lastHit = 0.0;
	}else
		this.loop = false;
	if (projectiles.range)
		this.range = projectiles.range;
	if (projectiles.damageInterval)
		this.damageInterval = eval(projectiles.damageInterval);
	else
		this.damageInterval = -1;
	for (var i=0;i<projectiles.lifeDraw.length;i++)
		if(projectiles.lifeDraw[i].particle) 
			this.lifeDraw.push(new ParticleEmitter(this,projectiles.lifeDraw[i].particle));
	for (var i=0;i<projectiles.finishDraw.length;i++)
		if(projectiles.finishDraw[i].particle) 
			this.finishDraw.push(new ParticleEmitter(this,projectiles.finishDraw[i].particle));
	if (projectiles.collisionEffect == 'hit')
		this.collisionEffect = new ProjectileHit(parent.parent,this,skill);
	else if (projectiles.collisionEffect == 'line')
		this.collisionEffect = new LineHit(parent.parent,this,skill);
	else if (projectiles.collisionEffect == 'random')
		this.collisionEffect = new RandomHit(parent.parent,this,skill,projectiles.randomDraw);
	else if (projectiles.collisionEffect == 'nova')
		this.collisionEffect = new Nova(parent.parent,this,skill);
}

Projectile.prototype.update = function(elapsed,h){
	this.x += this.vx*elapsed;
	this.y += this.vy*elapsed;
	this.z = world.getH(this.x,this.y) + this.vz*elapsed;
	//debug(this.dead);
	if (this.loop)
		this.lastHit += elapsed;
	if (!this.loop || this.lastHit>this.damageInterval){
		this.collisionEffect.process(elapsed);
		this.lastHit = 0.0;
	}
	return this.dead;
}

/*
Projectile.prototype.collision = function(){
	var objs = world.getObjNear(this.x,this.y,1);
	for (var i=0;i<objs.length;i++)
		if (objs[i] != this.parent && objs[i] != this.parent.parent && objs[i].collision && objs[i].collision.collide(this.x,this.y,this.radius))
			return true;
	return false;
}*/

function Projectiles(parent,projectiles,skill){
	this.parent = parent;
	this.currentTime = 0.0;
	this.duration = projectiles.duration;
	this.x = parent.x;
	this.y = parent.y;
	this.z = parent.z;
	this.projs = [];
	var cast = parent.cast.level;
	for (var i=0;i<eval(skill.numProjs);i++){
		var proj = new Projectile(this,projectiles,skill,i);
		this.projs.push(proj);
	}
}

Projectiles.prototype.process=function(){
	//debug('adding projectile into world');
	world.addObj(this);
	for (var i=0;i<this.projs.length;i++)
		for (var j=0;j<this.projs[i].lifeDraw.length;j++)
			world.particles.push(this.projs[i].lifeDraw[j]);
}

Projectiles.prototype.draw=function(){
	
}


Projectiles.prototype.animate=function(elapsed){
	this.currentTime += elapsed;
	var newProjs = [];
	for (var i=0;i<this.projs.length;i++)
		if(!this.projs[i].update(elapsed))
			newProjs.push(this.projs[i]);
		else{
			for (var j=0;j<this.projs[i].lifeDraw.length;j++)
				this.projs[i].lifeDraw[j].alive = false;
			for (var j=0;j<this.projs[i].finishDraw.length;j++)
				world.particles.push(this.projs[i].finishDraw[j]);
		}
	this.projs = newProjs;
	if (this.currentTime>this.duration){
		world.removeObjectFromGrid(this);
		for (var i=0;i<this.projs.length;i++){
			this.projs[i].collisionEffect.process(elapsed);
			for (var j=0;j<this.projs[i].lifeDraw.length;j++)
				this.projs[i].lifeDraw[j].alive = false;
			for (var j=0;j<this.projs[i].finishDraw.length;j++)
				world.particles.push(this.projs[i].finishDraw[j]);
		}
	}
}
