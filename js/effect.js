/* Javascript Effect class
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

function MeleeHit(parent,skill,finishEffects){
	this.parent = parent;
	this.finishEffects = finishEffects;
	this.skill = skill;
	this.damages = [];
	setAptitudeVars(parent);
	if(skill.damages)
		for (var type in skill.damages){
			var dam = new Object();
			dam.type = type;
			dam.value = eval(skill.damages[type].value)*(1-skill.damages[type].range);
			this.damages.push(dam);
		}
	for (var type in skill.damagesModifier){
		var dam = new Object();
		dam.type = type;
		dam.value = ranDamage(parent.damages[type])*eval(skill.damagesModifier[type]);	
		this.damages.push(dam);
	}
}

//TODO update damages
MeleeHit.prototype.process=function(elapsed){
	if (models[this.parent.modelName].orient)
		var orient = this.parent.orient+models[this.parent.modelName].orient;
	else
		var orient = this.parent.orient;
	var theta = orient*Math.PI/180.0;
	if (this.parent.collision && this.parent.collision.radius)
		var range = this.parent.collision.radius*1.2;
	else
		var range = 1.0;
	range += this.parent.range;
	var cx = this.parent.x+Math.sin(theta)*range;
	var cy = this.parent.y-Math.cos(theta)*range;
	var objsHit = this.parent.getCollisions(cx,cy);
	var precision = eval(this.skill.precision);
	//debug(objsHit.length+','+this.parent.faction);
	for (var i=0;i<objsHit.length;i++)
		if (this.skill.target == 'ennemy' && objsHit[i].faction && objsHit[i].faction != this.parent.faction && objsHit[i].currentHp>0){
			if(Math.random()<precision/(precision+objsHit[i]['dexterity'].level)){
				objsHit[i].damage(this.damages);
				for (var j=0;j<this.finishEffects.length;j++)
					world.particles.push(new ParticleEmitter(objsHit[i],this.finishEffects[j]));
			}else{
				objsHit[i].xpAptitude('dexterity',1);
				world.particles.push(new ParticleEmitter(objsHit[i],'miss'));
			}
		}
}

function LineHit(parent,projectile,skill){
	this.parent = parent;
	this.projectile = projectile;
	this.skill = skill;
	this.damages = [];
	setAptitudeVars(parent);
	for (var i=0;i<skill.damages.length;i++){
		var dam = new Object();
		dam.type = skill.damages[i].type;
		dam.value = eval(skill.damages[i].value);
		if (skill.damages[i].range)
			dam.value = dam.value + dam.value*(1.0-2.0*rand())*eval(skill.damages[i].range);	
		this.damages.push(dam)
	}
}

LineHit.prototype.process=function(elapsed){
	var objs = world.getObjNear(this.parent.x,this.parent.y,1);
	if (models[this.parent.modelName] && models[this.parent.modelName].orient)
		var orient = this.parent.orient+models[this.parent.modelName].orient;
	else
		var orient = this.parent.orient;
	var theta = orient*Math.PI/180.0;
	var cx = Math.sin(theta);
	var cy = -Math.cos(theta);
	for (var i=0;i<objs.length;i++){
		var crossProd = Math.abs(cx*(this.parent.y-objs[i].y)-cy*(this.parent.x-objs[i].x));
		if (objs[i].collision && objs[i].collision.radius && crossProd<Math.max(this.projectile.radius,objs[i].collision.radius) && this.skill.target == 'ennemy' && objs[i].faction && objs[i].faction != this.parent.faction && objs[i].currentHp>0 && dist(objs[i],this.parent)<this.projectile.range){
			objs[i].damage(this.damages);
			this.projectile.dead = true;
		}
		
	}
}


function ProjectileHit(parent,projectile,skill){
	this.parent = parent;
	this.projectile = projectile;
	this.skill = skill;
	this.damages = [];
	setAptitudeVars(parent);
	for (var i=0;i<skill.damages.length;i++){
		var dam = new Object();
		dam.type = skill.damages[i].type;
		dam.value = eval(skill.damages[i].value);
		if (skill.damages[i].range)
			dam.value = dam.value + dam.value*(1.0-2.0*rand())*eval(skill.damages[i].range);	
		this.damages.push(dam)
	}
}

ProjectileHit.prototype.process=function(elapsed){
	var objsHit = world.getCollisions(this.projectile.x,this.projectile.y,this.projectile.radius);
	for (var i=0;i<objsHit.length;i++){
		if (this.skill.target == 'ennemy' && objsHit[i].faction && objsHit[i].faction != this.parent.faction && objsHit[i].currentHp>0){
			objsHit[i].damage(this.damages);
			this.projectile.dead = true;
		}else if (objsHit[i] != this.parent)
			this.projectile.dead = true;
	}
}

function Nova(parent,projectile,skill){
	this.parent = parent;
	this.projectile = projectile;
	this.skill = skill;
	this.damages = [];
	setAptitudeVars(parent);
	this.lifeTime = 0.0;
	for (var i=0;i<skill.damages.length;i++){
		var dam = new Object();
		dam.type = skill.damages[i].type;
		dam.value = eval(skill.damages[i].value);
		if (skill.damages[i].range)
			dam.value = dam.value + dam.value*(1.0-2.0*rand())*eval(skill.damages[i].range);	
		this.damages.push(dam)
	}
	this.objsHit = [];
}

Nova.prototype.process=function(elapsed){
	this.lifeTime +=elapsed;
	var objs = world.getCollisions(this.projectile.x,this.projectile.y,this.lifeTime*this.projectile.radius/this.projectile.duration);
	//debug(this.lifeTime);
	//debug(this.projectile.duration);
	for (var i=0;i<objs.length;i++)
		if (this.skill.target == 'ennemy' && objs[i].faction && objs[i].faction != this.parent.faction && objs[i].currentHp>0 && !contains(this.objsHit,objs[i])){
			this.objsHit.push(objs[i]);
			objs[i].damage(this.damages);
		}
}

function RandomHit(parent,projectile,skill,finishEffects){
	this.parent = parent;
	this.projectile = projectile;
	this.finishEffects = finishEffects;
	this.skill = skill;
	this.damages = [];
	setAptitudeVars(parent);
	for (var i=0;i<skill.damages.length;i++){
		var dam = new Object();
		dam.type = skill.damages[i].type;
		dam.value = eval(skill.damages[i].value);
		if (skill.damages[i].range)
			dam.value = dam.value + dam.value*(1.0-2.0*rand())*eval(skill.damages[i].range);	
		this.damages.push(dam)
	}
}

RandomHit.prototype.process=function(elapsed){
	var objsHit = world.getCollisions(this.projectile.x,this.projectile.y,this.projectile.radius);
	var objs = []
	for (var i=0;i<objsHit.length;i++)
		if (this.skill.target == 'ennemy' && objsHit[i].faction && objsHit[i].faction != this.parent.faction && objsHit[i].currentHp>0)
			objs.push(objsHit[i]);
	if (objs.length>0){
		var ind = Math.floor(rand()*objs.length);
		objs[ind].damage(this.damages);
		for (var j=0;j<this.finishEffects.length;j++)
			world.particles.push(new ParticleEmitter(objs[ind],this.finishEffects[j].particle));
	}
}

function createNumber(obj,num){
	if(num==0)
		var numNum = 1;
	else
		var numNum = Math.floor(Math.log(num) / Math.log(10))+1;
	var numb = num;
	for (var i=0;i<numNum;i++){
		var spell = new Object();
		if (models[obj.modelName].orient)
			var theta = obj.orient+models[obj.modelName].orient;
		else
			var theta = obj.orient;
		if(obj==world.player)
			theta += 180;
		theta = theta*Math.PI/180.0;

		spell.x = obj.x+Math.cos(theta)*(numNum/2.0-i-0.5)*0.4;
		spell.y = obj.y+Math.sin(theta)*(numNum/2.0-i-0.5)*0.4;
		spell.z = obj.z;
		part = new ParticleEmitter(spell,'num'+(numb%10));
		numb = Math.floor(numb / 10);
		world.particles.push(part);
	}
}


function Disapear(parent){
	this.parent = parent;
	this.duration = 0.0;
}

Disapear.prototype.process=function(elapsed){
	this.duration += elapsed;
	if(this.duration>4.0)
		this.parent.z -= this.duration/10.0-0.4;
	if(this.duration>10.0){
		if(this.parent == world.player){
			this.parent.currentHp = 1;
			this.parent.currentAction = new Action(this.parent,skills['idle']);
			this.parent.nextAction = this.parent.currentAction;
			var modifs = models[creatures['Player'].modelName];
			var startPoint = world.areas[0];
			do{
				var ox = (1-rand()*2)*startPoint.radius;
				var oy = (1-rand()*2)*startPoint.radius;
				var collid = world.getCollisions(startPoint.x+ox,startPoint.y+oy,modifs.collision.radius);
			}while(ox*ox+oy*oy>startPoint.radius*startPoint.radius || collid.length>0);
			this.parent.x = startPoint.x+ox;
			this.parent.y = startPoint.y+oy;
		}else
			world.removeObjectFromGrid(this.parent);
		
	}
}

/*
function WeaponEffect(parent){
	this.parent = parent;
	this.nextParti = 0;
}

WeaponEffect.prototype.process=function(elapsed){
	this.nextParti += elapsed;
	while (this.nextParti>0.4){
		var spell = new Object();
		spell.modelName = this.parent.weapon.modelName;
		if (modif[this.parent.modelName] && modif[this.parent.modelName].orient)
			spell.orient = this.parent.orient+modif[this.parent.modelName].orient;
		else
			spell.orient = this.parent.orient;
		var theta = spell.orient*Math.PI/180.0;
		if (this.parent.weapon.axisAngle)
			spell.orient += this.parent.weapon.axisAngle.angle;
		spell.x = this.parent.x+Math.cos(theta)*this.parent.weapon.x-Math.sin(theta)*this.parent.weapon.y;
		spell.y = this.parent.y+Math.sin(theta)*this.parent.weapon.x+Math.cos(theta)*this.parent.weapon.y;
		spell.z = this.parent.z+this.parent.weapon.z;
		var part = new ParticleEmiter(spell);
		part.createFlame(world.meshes[this.parent.weapon.modelName].vertices);
		world.particles.push(part);
		this.nextParti -= 0.4;
	}
}
*/
