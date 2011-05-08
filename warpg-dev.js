/* Javascript Object3D utility functions
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

var rand = Math.random;
var cosinus = Math.cos;
var sinus = Math.sin;
var pi = Math.PI;

var xpInc = 2;
var aptiNames = ['constitution','strength','intelligence','dexterity','melee','ranged','cast','run','block','enchant','hex','traps','stealth',
			'slash','pierce','blunt','shield','fire','water','earth','air','light','dark','aoe','dot'];

var damageNames = ['slash','pierce','blunt','fire','water','earth','air'];

var equipSlots = ['weapon','shield','helmet','pauldrons','gloves','pants','boots','armor'];

var melee, constitution, strength, intelligence, dexterity, melee, ranged, cast, run, block, enchant, hex, traps, stealth, slash, pierce, blunt, 		shield, fire, water, earth, air, light, dark, aoe, dot;
var weapon;

var items = {};
var models = {};
var animations = {};
var projectiles = {};
var particles = {};
var skills = {};
var areas = {};
var creatures = {};
var powers = {};

var mvMatrix = mat4.create();
var mvMatrixStack = [];
var pMatrix = mat4.create();

var mouseX;
var mouseY;

var DEBUG = true;

function mvPushMatrix() {
	var copy = mat4.create();
	mat4.set(mvMatrix, copy);
	mvMatrixStack.push(copy);
}

function mvPopMatrix() {
	if (mvMatrixStack.length == 0) 
		throw "Invalid popMatrix!";
	mvMatrix = mvMatrixStack.pop();
}


function setMatrixUniforms(shaderProgram) {
	gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, false, pMatrix);
	gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, mvMatrix);
}


function degToRad(degrees) {
	return degrees * Math.PI / 180;
}

function setAptitudeVars(creature){
	for (var i in aptiNames)
		eval(aptiNames[i]+'=creature.'+aptiNames[i]+'.level');
	weapon = creature.equipment['weapon'].item;
}

function minDamage(dmgList){
	var minD = 0.0;
	for (var i in dmgList)
		minD += dmgList[i].value*(1-dmgList[i].range);
	return Math.round(10*minD)/10;
}

function maxDamage(dmgList){
	var maxD = 0.0;
	for (var i in dmgList)
		maxD += dmgList[i].value*(1+dmgList[i].range);
	return Math.round(10*maxD)/10;
}

function ranDamage(dmgList){
	var ranD = 0.0;
	for (var i in dmgList)
		ranD += dmgList[i].value*(1+(1.0-2.0*rand())*dmgList[i].range);
	return ranD;
}

function randomPosInRect(w,h){
	var ret = new Object();
	ret.x = w*(1.0-2*rand());
	ret.y = h*(1.0-2*rand());
	return ret;
}

function randomPosInCircle(r){
	var ret = new Object();
	do{
		ret.x = r*(1.0-2*rand());
		ret.y = r*(1.0-2*rand());
	}while(ret.x*ret.x+ret.y*ret.y>r*r);
	return ret;
}

function closeTab(tabName){
	document.getElementById(tabName).style.visibility = 'hidden';
}

function dist(o1,o2){
	return Math.sqrt((o1.x-o2.x)*(o1.x-o2.x)+(o1.y-o2.y)*(o1.y-o2.y));
}

function contains(arr,elem){
	for(var i=0; i<arr.length; i++)
		if(arr[i] == elem)
			return true;
	return false;
}

function faceNorm(vertices,s1,s2,s3){
	var v1 = new Object();
	var v2 = new Object();
	v1.x = vertices[3*s1]-vertices[3*s2];
	v1.y = vertices[3*s1+1]-vertices[3*s2+1];
	v1.z = vertices[3*s1+2]-vertices[3*s2+2];
	v2.x = vertices[3*s1]-vertices[3*s3]
	v2.y = vertices[3*s1+1]-vertices[3*s3+1]
	v2.z = vertices[3*s1+2]-vertices[3*s3+2]
	var n = new Object();
	n.x = v1.y*v2.z-v1.z*v2.y;
	n.y = v1.z*v2.x-v1.x*v2.z;
	n.z = v1.x*v2.y-v1.y*v2.x;
	var norm = Math.sqrt(n.x*n.x+n.y*n.y+n.z*n.z);
	n.x = n.x / norm;
	n.y = n.y / norm;
	n.z = n.z / norm;
	return n;
}

function handleLoadedTexture(texture) {
	gl.bindTexture(gl.TEXTURE_2D, texture);
	gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, texture.image);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
	if (texture.image.width==texture.image.height){
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
   		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
	}else{
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
	}

	gl.bindTexture(gl.TEXTURE_2D, null);
}

function initTexture (fileName) {
	var texture = gl.createTexture();
	texture.image = new Image();
	texture.image.src =  fileName;
	texture.image.onload = function() {
		handleLoadedTexture(texture);
		//debug('Init texture '+fileName+', size : '+texture.image.width+" x "+texture.image.height);
	}
	return texture;
}

function loadMd5Mesh (modelName){
	var reqMesh = new XMLHttpRequest();
	reqMesh.open('GET', 'data/md5/'+modelName+'.mesh', true);
	reqMesh.onreadystatechange = function() { 
		if(reqMesh.readyState == 4)
			if (reqMesh.responseText.length>0){
				models[modelName].mesh = parseMesh(reqMesh.responseText);
			}
	}
	reqMesh.send(null);
}

function loadMd5Anim (modelName){
	var reqAnim = new XMLHttpRequest();
	reqAnim.open('GET', 'data/md5/'+modelName+'.anim', true);
	reqAnim.onreadystatechange = function() { 
		if(reqAnim.readyState == 4)
			if (reqAnim.responseText.length>0){
				animations[modelName].anim = parseAnim(reqAnim.responseText,modelName);
			}
	}
	reqAnim.send(null);
}

function loadObj (modelName,recenter){
	var reqMesh = new XMLHttpRequest();
	reqMesh.open('GET', 'data/obj/'+modelName+'/'+modelName+'.obj', true);
	reqMesh.onreadystatechange = function() { 
		if(reqMesh.readyState == 4)
			if (reqMesh.responseText.length>0){
				models[modelName].mesh = parseObj(reqMesh.responseText, 'data/obj/'+modelName+'/',recenter);
			}
	}
	reqMesh.send(null);
}

function clearConsole(){
	console = document.getElementById("console");
	while(console.hasChildNodes())
		console.removeChild(console.firstChild);
}

function info(msg){
	var m = document.createElement("div");
	m.innerHTML = "[INFO] " +msg;
	document.getElementById("console").appendChild(m);
}

function debug(msg){
	if(DEBUG){
		var m = document.createElement("div");
		m.innerHTML = "[DEBUG] " +msg;
		document.getElementById("console").appendChild(m);
	}
}

function warning(msg){
	var m = document.createElement("div");
	m.innerHTML = "[WARNING] " +msg;
	document.getElementById("console").appendChild(m);
}

function error(msg){
	var m = document.createElement("div");
	m.innerHTML = "[ERROR] " +msg;
	document.getElementById("console").appendChild(m);
}
/* WebGL 3D Area class
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
 * Some parts of this program were inspired from this site : http://learningwebgl.com/blog/
 *
 */

function createArea(areaName,ax,ay,level){
	var ar = areas[areaName];
	if(!ar.numCreated)
		ar.numCreated = 1;
	else
		ar.numCreated +=1;
	var newArea = new Object();
	if(ar.shape.type=='circle'){
		newArea.radius = eval(ar.shape.radius);
		var surface = pi*newArea.radius*newArea.radius;
		newArea.level = level;
		newArea.x = ax;
		newArea.y = ay;
		var orient = Math.random()*360;
		//debug(areaName+', loc :'+newArea.x+','+newArea.y);
		for (var i=0;i<ar.staticElements.length;i++)
			for(var j=0;j<eval(ar.staticElements[i].count);j++){
				if(!ar.disposition)
					orient = Math.random()*360;
				var ox = (1-rand()*2)*newArea.radius;
				var oy = (1-rand()*2)*newArea.radius;
				var obj = new Object3D(newArea.x+ox,newArea.y+oy,orient,ar.staticElements[i].model);
				if (obj.collision)
					var collid = world.getCollisions(ax+ox,ay+oy,obj.collision.radius);
				else
					var collid = world.getCollisions(ax+ox,ay+oy,0);
				while(ox*ox+oy*oy>newArea.radius*newArea.radius || world.paths[Math.round((ox+ax)/10)*world.map.w+Math.round((oy+ay)/10)]>0 || collid.length>0){
					ox = (1-rand()*2)*newArea.radius;
					oy = (1-rand()*2)*newArea.radius;
					if (obj.collision)
						collid = world.getCollisions(ax+ox,ay+oy,obj.collision.radius);
					else
						collid = world.getCollisions(ax+ox,ay+oy,0);
				}
				obj.moveTo(ax+ox,ay+oy);				
				world.addObj(obj);
			}
		for (var i=0;i<ar.creatures.length;i++)
			for(var j=0;j<eval(ar.creatures[i].count);j++){
				var modifs = models[creatures[ar.creatures[i].creature].modelName];
				do{
					var ox = (1-rand()*2)*newArea.radius;
					var oy = (1-rand()*2)*newArea.radius;
					var collid = world.getCollisions(ox,oy,modifs.collision.radius);
				}while(ox*ox+oy*oy>newArea.radius*newArea.radius || collid.length>0);
				var obj = new Character(creatures[ar.creatures[i].creature],newArea.x+ox,newArea.y+oy,newArea.level);
				if (!creatures[ar.creatures[i].creature].activation){
					obj.circleHealth = new Object3D(0,0,0,'circleHealth');
					obj.circleHealth.z = 0.1;
					obj.circleHealth.parent = obj;
				}
				if (obj.faction=='evil')
					obj.ai = new AI(obj);
				world.addObj(obj);
			}
	}
	return newArea;
}
/* Javascript Character class
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

function Character(jsonFile,x,y,level){
	for (var i in aptiNames){
		this[aptiNames[i]] = {};
		this[aptiNames[i]].level = 1;
		this[aptiNames[i]].xp = 0;
	}
	this.effects = [];
	if (jsonFile.particle){
		var eff = new ParticleEmitter(this,jsonFile.particle);
		world.particles.push(eff);
		this.effects.push(eff);
	}
	this.properties = jsonFile;
	this.level = level;
	this.levelXP = 10;
	for (var i=0;i<jsonFile.aptitudes.length;i++)
		this[jsonFile.aptitudes[i].aptitude].level = eval(jsonFile.aptitudes[i].level);
	this.scale = eval(jsonFile.scale);
	this.modelName = jsonFile.modelName;
	this.x = x;
	this.y = y;
	this.z = world.getH(this.x,this.y);
	this.orient = Math.random()*360;
	this.maxHp = eval(jsonFile.hpspmp[0]);
	this.maxMp = eval(jsonFile.hpspmp[1]);
	this.maxSp = eval(jsonFile.hpspmp[2]);
	this.currentHp = this.maxHp;
	this.currentMp = this.maxMp;
	this.currentSp = this.maxSp;
	this.faction = jsonFile.faction;

	if(models[this.modelName].collision.type=='circle')
		this.collision = new CircleCollision(this,models[this.modelName].collision.radius*this.scale);
	else if(models[this.modelName].collision.type=='rect')
		this.collision = new RectCollision(this,models[this.modelName].collision.collisionW*this.scale,models[this.modelName].collision.collisionH*this.scale);
		
	// damages and resists
	this.damages = {};
	this.resists = {};
	for (var i in damageNames){
		this.damages[damageNames[i]] = [];
		this.resists[damageNames[i]] = 0.0;
	}
	if (jsonFile.damages){
		for (var i in jsonFile.damages){
			var dam = {};
			dam.value = eval(jsonFile.damages[i].value);
			dam.range = jsonFile.damages[i].range;
			dam.id = 'base';
			this.damages[jsonFile.damages[i].type].push(dam);
		}
	}
	this.range = jsonFile.range;
	for (var res in jsonFile.resists)
		this.resists[res] = eval(jsonFile.resists[res]);

	// inventory and equipment
	this.inventory = {};
	this.equipment = {};
	for(var i in equipSlots)
		this.equipment[equipSlots[i]] = {};
	if(jsonFile.equipmentModif)
		for (var i=0;i<jsonFile.equipmentModif.length;i++)
			this.equipment[jsonFile.equipmentModif[i].type] = jsonFile.equipmentModif[i];
	for(var i=0;i<jsonFile.gear.length;i++)
		if(jsonFile.gear[i].weapon){
			var it = new Item(items[jsonFile.gear[i].weapon],'normal',level);
			this.addEquipment(it);
			if (jsonFile.name=='Player'){
				this.inventory[it.id]=it;
				$('#leftgear div').eq(3).append(getIcon(it));
			}
		}else if(jsonFile.gear[i].shield){
			var it = new Item(items[jsonFile.gear[i].shield],'normal',level);
			this.addEquipment(it);
			if (jsonFile.name=='Player'){
				this.inventory[it.id]=it;
				$('#rightgear div').eq(3).append(getIcon(it));
			}
		}

	// Actions and animation
	this.currentAction = new Action(this,skills['idle']);
	this.currentAction.isInterruptible = true;
	this.nextAction = this.currentAction;
	this.currentFrame = animations[this.modelName][this.currentAction.type].firstFrame;
	this.nextFrame = animations[this.modelName][this.currentAction.type].firstFrame+1;
	this.posFrame = 0.0;
}

/*
 Give back health, stamina, and mana. Used for potions and healing spells.
 @ hp : amount of health restored
 @ sp : amount of stamina restored
 @ mp : amount of mana restored
*/
Character.prototype.recover = function(hp,sp,mp){
	this.currentHp = Math.min(this.currentHp+hp,this.maxHp);
	this.currentSp = Math.min(this.currentSp+sp,this.maxSp);
	this.currentMp = Math.min(this.currentMp+mp,this.maxMp);
}

/*
 Update this character status according to elapsed time. Regenerate, move, process ai and effects.
 @ elapsed : amount of time elapsed in seconds since last update.
*/
Character.prototype.update = function(elapsed){
	if (this.currentHp<this.maxHp && this.currentHp>0.0){
		var inc = (this.constitution.level+4)*(elapsed/25.0);
		this.currentHp += inc;
		this.currentHp = Math.min(this.currentHp,this.maxHp);
		this.xpAptitude('constitution',elapsed/3.0);
	}
	if (this.currentMp<this.maxMp && this.currentHp>0.0){
		var inc = (this.intelligence.level+4)*(elapsed/25.0);
		this.currentMp += inc;
		this.currentMp = Math.min(this.currentMp,this.maxMp);
		this.xpAptitude('intelligence',elapsed/3.0);
	}
	if (this.currentSp<this.maxSp && this.currentHp>0.0){
		var inc = (this.strength.level+4)*(elapsed/25.0);
		this.currentSp += inc;
		this.currentSp = Math.min(this.currentSp,this.maxSp);
		this.xpAptitude('strength',elapsed/3.0);
	}
	if(this.currentHp<=0.0){
		this.currentHp = 0;
		this.setAction(skills['die']);
		if(this != world.player)
			this.collision = null;
		this.circleHealth = null;
	}
	this.z =  world.getH(this.x,this.y);
	if(this.ai)
		this.ai.process();
	if (this.currentAction.type.substring(0,4)=='walk')
		this.move(elapsed);
	for (var i=0;i<this.currentAction.lifeEffects.length;i++)
		if(!this.currentAction.lifeEffects[i].parts)
			this.currentAction.lifeEffects[i].process(elapsed);
}

/*
 Draw this character and its child elements (items, health)
*/
Character.prototype.draw = function (){
	mvPushMatrix();
	mat4.translate(mvMatrix,[this.x, this.y,this.z]);
	if (models[this.modelName].orient)
		mat4.rotate(mvMatrix, degToRad(models[this.modelName].orient+this.orient), [0, 0, 1]);
	else
		mat4.rotate(mvMatrix, degToRad(this.orient), [0, 0, 1]);
	if(this.scale)
		mat4.scale(mvMatrix,[this.scale,this.scale,this.scale]);
	for (var i in this.equipment)
		if (this.equipment[i].bone && this.equipment[i].item)
			this.equipment[i].item.draw();
	if(this.circleHealth)
		this.circleHealth.draw();
	if(this.mesh)
		this.mesh.draw();
	else if(models[this.modelName].mesh)
		this.mesh = models[this.modelName].mesh;
	mvPopMatrix();	
}

/*
 Give experience to aptitudes used by the player.
 @ apti : the name of the aptitude to give exterience to
 @ xp : the amount of experience to give
*/
Character.prototype.xpAptitude=function(apti,xp){
	if(this == world.player){
		this[apti].xp += xp;
		if(this[apti].xp>=this.levelXP){
			this[apti].xp -= this.levelXP;
			this[apti].level += 1;
			this.levelXP += xpInc;
			this.level += 0.1;
			document.getElementById(apti+'LVL').innerHTML = this[apti].level;
			document.getElementById('playerLevel').innerHTML = Math.floor(this.level);
			document.getElementById('playerLevelXP').innerHTML = this.levelXP;
			if(apti=='constitution')
				this.maxHp += 2;
			else if (apti=='strength')
				this.maxSp += 2;
			else if (apti=='intelligence')
				this.maxMp += 2;
		}
		document.getElementById(apti+'XP').innerHTML = Math.floor(this[apti].xp);
	}
}

/*
 Damage this character. If the character takes more than 10% of its maximum amount of health points, it enters in recovery mode (cancels current action).
 @ dmgs : an array of damage objects (value, type)
*/
Character.prototype.damage = function(dmgs){
	var damages = 0.0;
	for (var j=0;j<dmgs.length;j++){
		damages += dmgs[j].value*(1-this.resists[dmgs[j].type]/100.0);
	}
	this.currentHp -= damages;
	if(this.currentHp<=0.0){
		world.events.push(['dead',this]);
		this.currentHp = 0;
		this.currentAction.isInterruptible = true;
		this.setAction(skills['die']);
		if(this != world.player){
			this.collision = null;
			this.circleHealth = null;
			for (var i in this.effects)
				this.effects[i].finalize();
		}
	}else if (damages>this.maxHp/10.0){
		this.currentAction.isInterruptible = true;
		this.setAction(skills['hit']);
	}
	world.particles.push(new ParticleEmitter(this,'blood'));
	createNumber(this,Math.floor(damages));
}


Character.prototype.addEquipment = function(item){
	if(this.equipment[item.type].item)
		this.removeEquipment(item.type);
	this.equipment[item.type].item = item;
	item.parentModif = this.equipment[item.type];
	if(item.type=='weapon'){
		var dam = {};
		dam.value = item.damages;
		dam.range = item.damageRange;
		dam.id = item.id;
		this.damages[item.damageType].push(dam);
		this.range = item.range;
		if (this == world.player)
			$('#'+item.damageType+'Dmg').html(minDamage(this.damages[item.damageType])+' - '+maxDamage(this.damages[item.damageType]));
	}
	if(item.resists)
		for (var x in item.resists){
			this.resists[x] += item.resists[x];
			if (this == world.player)
				$('#'+x+'Res').html(this.resists[x]+' %');
		}
	for (var x in item.powers){
		if (item.powers[x].effect.type == 'damage'){
			var type = item.powers[x].effect.damageType;
			var dam = {};
			dam.value = item.powers[x].effect.value;
			dam.range = 0;
			dam.id = item.id;
			this.damages[type].push(dam);
			if (this == world.player)
				$('#'+type+'Dmg').html(minDamage(this.damages[type])+' - '+maxDamage(this.damages[type]));
		}else if (item.powers[x].effect.type == 'bonus'){
			if (item.powers[x].effect.aptitude == 'hp')
				this.maxHp += item.powers[x].effect.value;
			else if (item.powers[x].effect.aptitude == 'sp')
				this.maxSp += item.powers[x].effect.value;
			else if (item.powers[x].effect.aptitude == 'mp')
				this.maxMp += item.powers[x].effect.value;
		}
	}
}

Character.prototype.removeEquipment = function(type){
	var item = this.equipment[type].item;
	for (var x in item.powers){
		if (item.powers[x].effect.type == 'damage'){
			var typeD = item.powers[x].effect.damageType;
			for(var i in this.damages[typeD])
				if(this.damages[typeD][i].id == item.id) {
					this.damages[typeD].splice(i, 1);
					break;
				}
			if (this == world.player)
				$('#'+typeD+'Dmg').html(minDamage(this.damages[typeD])+' - '+maxDamage(this.damages[typeD]));
		}else if (item.powers[x].effect.type == 'bonus'){
			if (item.powers[x].effect.aptitude == 'hp'){
				this.maxHp -= item.powers[x].effect.value;
				this.currentHp = Math.min(this.currentHp,this.maxHp);
			}else if (item.powers[x].effect.aptitude == 'sp'){
				this.maxSp -= item.powers[x].effect.value;
				this.currentSp = Math.min(this.currentSp,this.maxSp);
			}else if (item.powers[x].effect.aptitude == 'mp'){
				this.maxMp -= item.powers[x].effect.value;
				this.currentMp = Math.min(this.currentMp,this.maxMp);
			}
		}
	}
	this.equipment[type].item = null;
	if(type=='weapon'){
		for(var i in this.damages[item.damageType])
			if(this.damages[item.damageType][i].id == item.id) {
				this.damages[item.damageType].splice(i, 1);
			}
		if (this == world.player)
			$('#'+item.damageType+'Dmg').html(minDamage(this.damages[item.damageType])+' - '+maxDamage(this.damages[item.damageType]));
		this.range = this.properties.range;
	}
	if(item.resists)
		for (var x in item.resists){
			this.resists[x] -= item.resists[x];
			if (this == world.player)
				$('#'+x+'Res').html(this.resists[x]+' %');
		}
}


Character.prototype.setAction = function(skill){
	if(this.nextAction.type != skill.action && this.nextAction.type != 'die' && this.nextAction.type != 'opened' && this.nextAction.type != 'disapear' && this.nextAction.type != 'hit'){
		setAptitudeVars(this);
		if(this != world.player || !skill.requirement || eval(skill.requirement)){
		//debug(this.nextAction.type+','+skill.action);
			if(eval(skill.cost[1])<=this.currentSp && eval(skill.cost[2])<=this.currentMp)		
				this.nextAction = new Action(this,skill);
			if(this.nextAction.type=='idle' || this.nextAction.type== 'walkF'|| this.nextAction.type== 'walkB')
				this.nextAction.isInterruptible = true;
		}else
			debug('Cannot use skill : '+skill.name);
	}
}

Character.prototype.move= function(elapsed){
	if (!this.moveAngle)
		this.moveAngle = 0;
	var theta = (models[this.modelName].orient+this.orient+this.moveAngle)*Math.PI/180.0;
	var dx = this.x+this.speed*Math.sin(theta)*elapsed;
	var dy = this.y-this.speed*Math.cos(theta)*elapsed;
	var objs = this.getCollisions(dx,dy);
	var moveOk = true;
	var moveOk2 = true;
	for (var i=0;i<objs.length && moveOk;i++){
		if(!objs[i].status || objs[i].status.currentHp>0){
			moveOk = false;
			if (objs[i].collision.tangent){
				var tangent = objs[i].collision.tangent(this.x,this.y);
				var s = tangent.x*(dx-this.x)+tangent.y*(dy-this.y);
				if (s<0){
					tangent.x = -tangent.x;
					tangent.y = -tangent.y;
					s = -s;
				}
				dx = this.x + tangent.x*s;
				dy = this.y + tangent.y*s;
				var objs2 = this.getCollisions(dx,dy);
				for (var j=0;j<objs2.length && moveOk2;j++)
					moveOk2 = moveOk2 && (objs2[j].status && objs2[j].status.currentHp<=0);
				if (moveOk2){
					if(this.ai){
						var xInd = Math.floor(this.x/(world.tileSize*world.gridSize));
						var yInd = Math.floor(this.y/(world.tileSize*world.gridSize));
						var dxInd = Math.floor(dx/(world.tileSize*world.gridSize));
						var dyInd = Math.floor(dy/(world.tileSize*world.gridSize));
						if(xInd != dxInd || yInd != dyInd){
							world.removeObjectFromGrid(this);
							world.grid[dxInd][dyInd].push(this);
						}
					}
					this.x += tangent.x*s;
					this.y += tangent.y*s;
				}
			}
		}
	}
	if(moveOk && moveOk2 && dx && dy){
		if(this.ai){
			var xInd = Math.floor(this.x/(world.tileSize*world.gridSize));
			var yInd = Math.floor(this.y/(world.tileSize*world.gridSize));
			var dxInd = Math.floor(dx/(world.tileSize*world.gridSize));
			var dyInd = Math.floor(dy/(world.tileSize*world.gridSize));
			if(xInd != dxInd || yInd != dyInd){
				world.removeObjectFromGrid(this);
				world.grid[dxInd][dyInd].push(this);
			}
		}
		this.x = dx;
		this.y = dy;
	}
}

Character.prototype.animate = function(elapsed){
	this.update(elapsed);
	if (animations[this.modelName][this.currentAction.type] && this.currentAction.type != 'disapear')
		this.posFrame += animations[this.modelName][this.currentAction.type].speed*elapsed;
	while(this.posFrame>=1.0){
		this.posFrame -= 1.0;
		this.currentFrame = this.nextFrame;
		if(this.currentFrame >= animations[this.modelName][this.currentAction.type].lastFrame){
			for (var i=0;i<this.currentAction.finishEffects.length;i++)
				this.currentAction.finishEffects[i].process(elapsed);
			if(this.currentAction.aptitudes)
				for (var i=0;i<this.currentAction.aptitudes.length;i++)
					this.xpAptitude(this.currentAction.aptitudes[i],1);
			if (this.currentAction.type =='die'){
				this.nextAction = new Action(this,skills['disapear']);
				if(this != world.player && rand()<0.5){
					var drop = loot(this.level,rand());
					drop.x = this.x;
					drop.y = this.y;
					drop.z = this.z;
					world.addObj(drop);
				}
			}else if(this.currentAction.type =='open'){
				this.nextAction = new Action(this,skills['opened']);
				for (var i=0;i<10;i++){
					var drop = loot(this.level+1,rand()/5.0);
					//debug(this.level+1);
					var theta = (models[this.modelName].orient+this.orient)*Math.PI/180.0;
					drop.x = this.x+Math.sin(theta);
					drop.y = this.y-Math.cos(theta);
					drop.z = this.z;
					world.addObj(drop);
				}
			}
			else if (this.currentAction.type =='hit'){
				this.nextAction = new Action(this,skills['idle']);
				this.nextAction.isInterruptible = true;
			}
			for (var i=0;i<this.currentAction.lifeEffects.length;i++)
				this.currentAction.lifeEffects[i].finalize();
			this.currentAction = this.nextAction;
			for (var i=0;i<this.currentAction.lifeEffects.length;i++)
				if(this.currentAction.lifeEffects[i].alive)
					world.particles.push(this.currentAction.lifeEffects[i]);
			this.setAction(skills['idle']);
			this.currentHp -= this.currentAction.hpCost;
			this.currentSp -= this.currentAction.spCost;
			this.currentMp -= this.currentAction.mpCost;
			this.nextFrame = animations[this.modelName][this.currentAction.type].firstFrame;
		}else if(this.currentAction.isInterruptible && this.currentAction.type != this.nextAction.type){
			for (var i=0;i<this.currentAction.lifeEffects.length;i++)
				this.currentAction.lifeEffects[i].finalize();
			this.currentAction = this.nextAction;
			for (var i=0;i<this.currentAction.lifeEffects.length;i++)
				if(this.currentAction.lifeEffects[i].alive)
					world.particles.push(this.currentAction.lifeEffects[i]);
			this.setAction(skills['idle']);
			this.currentHp -= this.currentAction.hpCost;
			this.currentSp -= this.currentAction.spCost;
			this.currentMp -= this.currentAction.mpCost;
			this.nextFrame = animations[this.modelName][this.currentAction.type].firstFrame;	
		}else
			this.nextFrame += 1;
	}
	if (this.currentAction.type == 'walk')
		this.setAction(skills['idle']);

	if(this.boneAnim){
		var boneOrient = [];
		var bonePos = [];
		var p1 = this.boneAnim[this.currentFrame].bonePos;
		var p2 = this.boneAnim[this.nextFrame].bonePos;
		var o1 = this.boneAnim[this.currentFrame].boneOrient;
		var o2 = this.boneAnim[this.nextFrame].boneOrient;
		for (var i=0;i<this.mesh.bones.length;i++){
			for (var j=0;j<3;j++)
				bonePos.push(p1[i*3+j]*(1-this.posFrame)+p2[i*3+j]*this.posFrame);
			var q1 = new Quat(o1[i*4],o1[i*4+1],o1[i*4+2]);
			q1.w = o1[i*4+3];
			var q2 = new Quat(o2[i*4],o2[i*4+1],o2[i*4+2]);
			q2.w = o2[i*4+3];
			var q3 = q1.slerp(q2,this.posFrame);
			boneOrient.push(q3.x);
			boneOrient.push(q3.y);
			boneOrient.push(q3.z);
			boneOrient.push(q3.w);
			for (equip in this.equipment)
				if (this.equipment[equip].bone && this.equipment[equip].item && this.equipment[equip].bone== i){
					this.equipment[equip].item.axisAngle = q3.axisAngle();
					this.equipment[equip].item.x = bonePos[3*this.equipment[equip].bone];
					this.equipment[equip].item.y = bonePos[3*this.equipment[equip].bone+1];
					this.equipment[equip].item.z = bonePos[3*this.equipment[equip].bone+2];
				}
		}
		gl.useProgram(this.mesh.shaderProgram);
		gl.uniform4fv(this.mesh.shaderProgram.jointOrient,boneOrient);
		gl.uniform3fv(this.mesh.shaderProgram.jointPos,bonePos);
	}else if(this.mesh && animations[this.modelName] && animations[this.modelName].anim)
		this.boneAnim = animations[this.modelName].anim;
	//else
		//debug(this.modelName+', '+animations[this.modelName].anim);
}


Character.prototype.bindPose = function (){
	var boneOrient = [];
	var bonePos = [];
	for (var i=0;i<this.mesh.bones.length;i++){
		boneOrient.push(this.mesh.bones[i].orient.x);
		boneOrient.push(this.mesh.bones[i].orient.y);
		boneOrient.push(this.mesh.bones[i].orient.z);
		boneOrient.push(this.mesh.bones[i].orient.w);
		bonePos.push(this.mesh.bones[i].x);
		bonePos.push(this.mesh.bones[i].y);
		bonePos.push(this.mesh.bones[i].z);
	}
	if(this.weapon){
		var q3 = new Quat(boneOrient[4*this.weaponBone],boneOrient[4*this.weaponBone+1],boneOrient[4*this.weaponBone+2]);
		q3.w = boneOrient[4*this.weaponBone+3];
		this.weapon.axisAngle = q3.axisAngle();
		var cq = q3.rot(this.weapon.offx,this.weapon.offy,this.weapon.offz);
		this.weapon.x = bonePos[3*this.weaponBone];
		this.weapon.y = bonePos[3*this.weaponBone+1];
		this.weapon.z = bonePos[3*this.weaponBone+2];
	}	
	gl.useProgram(this.mesh.shaderProgram);
	gl.uniform4fv(this.mesh.shaderProgram.jointOrient,boneOrient);
	gl.uniform3fv(this.mesh.shaderProgram.jointPos,bonePos);
}

Character.prototype.getCollisions = function(x,y){
	var objs = world.getObjNear(x,y,1);
	var colList = [];
	for (var i=0;i<objs.length;i++)
		if (objs[i] != this && objs[i].collision && this.collision && objs[i].collision.collide(x,y,this.collision.radius))
			colList.push(objs[i]);
	return colList;
}
/* Javascript Collision class
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

function CircleCollision(parent,radius){
	this.radius = radius;
	this.parent = parent;
}

CircleCollision.prototype.collide = function(x,y,radius){
	var rad = Math.max(radius,this.radius);
	return Math.sqrt((this.parent.x-x)*(this.parent.x-x)+(this.parent.y-y)*(this.parent.y-y))<rad;
}

CircleCollision.prototype.tangent = function(x,y){
	var tang = new Object();
	if (x == this.parent.x){
		tang.x = 1.0;
		tang.y = 0.0;
	}else if(y == this.parent.y){
		tang.x = 0.0;
		tang.y = 1.0;
	}else{
		var n = Math.sqrt(1.0+Math.pow((this.parent.x-x)/(y-this.parent.y),2));
		tang.x = 1.0/n;
		tang.y = (this.parent.x-x)/((y-this.parent.y)*n);
	}
	//debug(tang.x+','+tang.y);
	return tang;
}

function RectCollision(parent,w,h){
	this.w = w;
	this.h = h;
	this.parent = parent;
	this.radius = Math.sqrt(w*w+h*h);
}

RectCollision.prototype.collide = function(x,y,radius){
	var d = Math.sqrt((this.parent.x-x)*(this.parent.x-x)+(this.parent.y-y)*(this.parent.y-y));
	var theta = -this.parent.orient*Math.PI/180.0;
	var rx = Math.cos(theta)*(x-this.parent.x)-Math.sin(theta)*(y-this.parent.y);
	var ry = Math.sin(theta)*(x-this.parent.x)+Math.cos(theta)*(y-this.parent.y);
	return (Math.abs(rx)<this.w && Math.abs(ry)<this.h);
}

RectCollision.prototype.tangent = function(x,y){
	var d = Math.sqrt((this.parent.x-x)*(this.parent.x-x)+(this.parent.y-y)*(this.parent.y-y));
	var theta = -this.parent.orient*Math.PI/180.0;
	var rx = Math.cos(theta)*(x-this.parent.x)-Math.sin(theta)*(y-this.parent.y);
	var ry = Math.sin(theta)*(x-this.parent.x)+Math.cos(theta)*(y-this.parent.y);
	var tang = new Object();
	if(Math.abs(rx)>this.w){
		tang.x = -Math.sin(this.parent.orient*Math.PI/180.0);
		tang.y = Math.cos(this.parent.orient*Math.PI/180.0);
	}else{
		tang.x = Math.cos(this.parent.orient*Math.PI/180.0);
		tang.y = Math.sin(this.parent.orient*Math.PI/180.0);
	}
	var n = Math.sqrt(tang.x*tang.x+tang.y*tang.y);
	tang.x /=n;
	tang.y /=n;
	return tang;
}
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
			dam.value = eval(skill.damages[type].value)*(1+(1-2*rand())*skill.damages[type].range);
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
	if(skill.damages)
		for (var type in skill.damages){
			var dam = new Object();
			dam.type = type;
			dam.value = eval(skill.damages[type].value)*(1+(1-2*rand())*skill.damages[type].range);
			this.damages.push(dam);
		}
	for (var type in skill.damagesModifier){
		var dam = new Object();
		dam.type = type;
		dam.value = ranDamage(parent.damages[type])*eval(skill.damagesModifier[type]);	
		this.damages.push(dam);
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
	if(skill.damages)
		for (var type in skill.damages){
			var dam = new Object();
			dam.type = type;
			dam.value = eval(skill.damages[type].value)*(1+(1-2*rand())*skill.damages[type].range);
			this.damages.push(dam);
		}
	for (var type in skill.damagesModifier){
		var dam = new Object();
		dam.type = type;
		dam.value = ranDamage(parent.damages[type])*eval(skill.damagesModifier[type]);	
		this.damages.push(dam);
	}
}

ProjectileHit.prototype.process=function(elapsed){
	var objsHit = world.getCollisions(this.projectile.x,this.projectile.y,this.projectile.radius);
	for (var i=0;i<objsHit.length;i++){
		if (this.skill.target == 'ennemy' && objsHit[i].faction && objsHit[i].faction != this.parent.faction && objsHit[i].currentHp>0){
			objsHit[i].damage(this.damages);
			this.projectile.dead = !this.projectile.loop;
		}else if (objsHit[i] != this.parent)
			this.projectile.dead = !this.projectile.loop;
	}
}

function Nova(parent,projectile,skill){
	this.parent = parent;
	this.projectile = projectile;
	this.skill = skill;
	this.damages = [];
	setAptitudeVars(parent);
	this.lifeTime = 0.0;
	if(skill.damages)
		for (var type in skill.damages){
			var dam = new Object();
			dam.type = type;
			dam.value = eval(skill.damages[type].value)*(1+(1-2*rand())*skill.damages[type].range);
			this.damages.push(dam);
		}
	for (var type in skill.damagesModifier){
		var dam = new Object();
		dam.type = type;
		dam.value = ranDamage(parent.damages[type])*eval(skill.damagesModifier[type]);	
		this.damages.push(dam);
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
	if(skill.damages)
		for (var type in skill.damages){
			var dam = new Object();
			dam.type = type;
			dam.value = eval(skill.damages[type].value)*(1+(1-2*rand())*skill.damages[type].range);
			this.damages.push(dam);
		}
	for (var type in skill.damagesModifier){
		var dam = new Object();
		dam.type = type;
		dam.value = ranDamage(parent.damages[type])*eval(skill.damagesModifier[type]);	
		this.damages.push(dam);
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
/* Javascript artificial intelligence class
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

function AI(parent){
	this.parent= parent;
}

AI.prototype.process = function(){
	//if(this.parent.currentHp<=0)
		//debug(this.parent.currentAction.type+','+this.parent.nextAction.type);
	var d = dist(world.player,this.parent);
	if (d<30.0){
		var theta = -this.parent.orient*Math.PI/180.0;
		var rx = Math.cos(theta)*(world.player.x-this.parent.x)-Math.sin(theta)*(world.player.y-this.parent.y) ;
		var ry = Math.sin(theta)*(world.player.x-this.parent.x)+Math.cos(theta)*(world.player.y-this.parent.y) ;
		if(this.parent.currentHp>0){		
			if (ry<=0 || Math.abs(Math.atan(rx/ry))>0.1){
				if (rx<0)
					this.parent.orient +=180*elapsed;
				else
					this.parent.orient -=180*elapsed;
				this.parent.speed = 0;
				this.parent.setAction(skills['idle']);
			}else if (d>Math.max(this.parent.collision.radius*1.1,world.player.collision.radius*1.1)){
				if (rx<0)
					this.parent.orient +=90*elapsed;
				else
					this.parent.orient -=90*elapsed;
				this.parent.speed = 6.0;
				this.parent.setAction(skills['walkF']);
			}else{
				this.parent.speed = 0;
				if(world.player.currentHp>0)
					this.parent.setAction(skills[this.parent.properties.skills[0]]); // random here ?
				else
					this.parent.setAction(skills['idle']);
			}
		}
	}
}
/* Javascript Item class
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

var numPower = {};
numPower['normal'] = "0";
numPower['magic'] = "1+Math.floor(rand()*2)";
numPower['rare'] = "3+Math.floor(rand()*2)";
numPower['epic'] = "5+Math.floor(rand()*2)";

var priceModif = {};
priceModif['normal'] = 1;
priceModif['magic'] = 2;
priceModif['rare'] = 4;
priceModif['epic'] = 8;

function Item(jsonItem,quality,itemLevel){
	if(jsonItem.modelName){
		//debug(jsonItem.modelName);
		var item = new Object3D(0,0,0,jsonItem.modelName);
	}else
		var item = new Object3D(0,0,0,null);
	item.name = jsonItem.name;
	item.type = jsonItem.type;
	item.requirements = jsonItem.requirements;
	if(jsonItem.resists)
		item.resists = jsonItem.resists;
	if(item.type=='weapon'){
		item.damageType = jsonItem.damageType;
		item.damages = jsonItem.damages;
		item.damageRange = jsonItem.damageRange;
		item.range = jsonItem.range;
	}
	if(jsonItem.goldCost){
		item.goldCost = jsonItem.goldCost*priceModif[quality];
		item.description = jsonItem.description;
		item.icon = jsonItem.icon;
	}else
		item.goldCost = 0;
	if(jsonItem.stackable)
		item.stackable = jsonItem.stackable;
	item.id = rand()+item.name+rand();
	if(item.type == 'consumable'){
		item.quality = 'normal';
	}else{
		item.quality = quality;
	}
	item.level = jsonItem.level;
	//debug(item.name+' : '+item.level);
	item.powers = {};
	for (var i=0;i<eval(numPower[item.quality]);i++){
		var tmpPow = powers.list[Math.floor(rand()*powers.list.length)];
		if(item.powers[tmpPow.name]){
			//debug(tmpPow.name+' : '+item.powers[tmpPow.name].effect.value);
			item.powers[tmpPow.name].effect.value = Math.round(10*(eval(tmpPow.effect['value'])+item.powers[tmpPow.name].effect.value))/10;
		}else{
			var power = {};
			power.effect = {};
			for (var x in tmpPow.effect){
				if (x=='value')
					power.effect[x] = Math.round(10*eval(tmpPow.effect[x]))/10;
				else
					power.effect[x] = tmpPow.effect[x];
			}
			item.powers[tmpPow.name] = power;
		}
	}
	return item;
}

function getIcon(item){
	var ret = $('<div></div>').attr({'class':'item','id':item.id,'name':item.name,'style':'width:32;height:32;background-image:url(data/icons/'+item.icon+')'}).draggable({revert:'invalid',appendTo: 'body',helper: 'clone',start:function(){src = $(this).parent();}});
	ret.mouseover(function() {
	    $('#canvas3D').append(itemDescription(world.player.inventory[$(this).attr('id')]));
	  }).mouseout(function(){
	    $('.description').remove();
	  });
	if(item.stackable){
		ret.append('1');
		ret.attr({'count':1});
	}
	ret.addClass(item.type);
	if(items[item.name].type && items[item.name].type=='consumable'){
		ret.click(function(){
			var effect = items[$(this).attr('name')].effect;
			if(effect.recover)
				world.player.recover(effect.recover[0],effect.recover[1],effect.recover[2]);
			$(this).attr('count',eval($(this).attr('count'))-1);
			$(this).empty();
			$(this).append($(this).attr('count'));
			if($(this).attr('count')=='0'){
				$(this).remove();
				delete world.player.inventory[$(this).attr('id')];
			}
		});
	}
	return ret;
}

function itemDescription(item){
	setAptitudeVars(world.player);
	var descrip ='<div class="description" style=left:'+mouseX+';top:'+mouseY+';><font color="#';
	if(item.quality=='normal')
		descrip += 'FFFFFF';
	else if(item.quality=='magic')
		descrip += 'AAAAFF';
	else if(item.quality=='rare')
		descrip += 'AAFFAA';
	else if(item.quality=='epic')
		descrip += 'FFDDAA';
	descrip +='">'+ item.name+' ('+item.type+')</font><br>'+item.description+'<br>';
	if(item.type=='weapon')
		descrip += 'Damages ('+item.damageType+') : '+(item.damages-item.damages*item.damageRange)+'-'+(item.damages+item.damages*item.damageRange)+', range : '+item.range+'<br>';
	for (var x in item.powers){
		descrip += '+ '+item.powers[x].effect.value+' ';
		if (item.powers[x].effect.type == 'damage')
			descrip += item.powers[x].effect.damageType+ ' damage<br>';
		else if (item.powers[x].effect.type == 'bonus')
			descrip += item.powers[x].effect.aptitude+'<br>';
	}
	if(item.resists){
		descrip += 'Resists : ';
		for (var x in item.resists)
			descrip += x+' : '+item.resists[x]+' %, ';
		descrip = descrip.substring(0,descrip.length-2)+'<br>';
	}
	if (item.goldCost>0)
		descrip += '<font color="#EEEEAA">Price: '+item.goldCost+' gold.</font>';
	descrip += '</div>';
	return descrip;
}

function loot(level,qual){
	var itemNames = [];
	for (x in items)
		if (items[x].droppable && (!items[x].level || items[x].level <= level))
			itemNames.push(items[x].name);
	var quality;
	if (qual<0.01)
		quality = 'epic';
	else if (qual<0.05)
		quality = 'rare';
	else if (qual<0.2)
		quality = 'magic';
	else
		quality = 'normal';
	var it = new Item(items[itemNames[Math.floor(rand()*itemNames.length)]],quality,level);
	it.pickable = new ParticleEmitter(it,'itemdrop');
	world.particles.push(it.pickable);
	return it;
}
/* Javascript md5 loader
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

function parseMesh(data){
	//alert("Parsing file");
	//debug("Parsing md5 file");
	var pos = data.indexOf('numJoints');
	var numJoints = parseInt(data.substring(pos+10,data.indexOf('\n',pos)));
	pos = data.indexOf('numMeshes',pos);
	var numMeshes = parseInt(data.substring(pos+10,data.indexOf('\n',pos)));
	//debug('Number of joints : '+numJoints+', number of meshes : '+numMeshes);
	
	var joints = data.substring(data.indexOf('joints',pos),data.indexOf('}',pos)).split('\n');
	var bones = [];
	for (var i=0;i<numJoints;i++){
		var line = joints[i+1];
		var bone = new Object();
		bone.nam = line.substring(line.indexOf('"')+1,line.lastIndexOf('"'));
		bone.parent = bones[parseInt(line.substring(line.lastIndexOf('"')+1,line.indexOf('(')-1))];
		var pos = line.substring(line.indexOf('(')+2,line.indexOf(')')).split(' ');
		bone.x = parseFloat(pos[0]);
		bone.y = parseFloat(pos[1]);
		bone.z = parseFloat(pos[2]);
		var orient = line.substring(line.lastIndexOf('(')+2,line.lastIndexOf(')')).split(' ');
		bone.orient = new Quat(parseFloat(orient[0]),parseFloat(orient[1]),parseFloat(orient[2]));
		bones.push(bone);
	}
	
	var mesh = new Mesh('anim');
	mesh.bones = bones;
	var vOffset = 0;
	for (var k=0;k<numMeshes;k++){
		pos = data.indexOf('shader',pos)+8;
		var textName = data.substring(pos,data.indexOf('"',pos));

		pos = data.indexOf('numverts',pos);
		var numVert = parseInt(data.substring(pos+9,data.indexOf('\n',pos)));
		var verts = data.substring(data.indexOf('vert 0',pos),data.indexOf('numtris',pos)).split('\n');

		pos = data.indexOf('numtris',pos);
		var numTri = parseInt(data.substring(pos+8,data.indexOf('\n',pos)));
		var tris = data.substring(data.indexOf('tri 0',pos),data.indexOf('numweights',pos)).split('\n');
	
		pos = data.indexOf('numweights',pos);
		var numWeight = parseInt(data.substring(pos+11,data.indexOf('\n',pos)));
		var weights = data.substring(data.indexOf('weight 0',pos)).split('\n');

		mesh.materials.push(new Object());
		mesh.materials[k].faces = [];
		mesh.materials[k].textures = [];
		if (textName.length>3)
			mesh.materials[k].textures.push(initTexture('data/text/'+textName));


		mesh.weight1 = [];
		mesh.weight2 = [];
		mesh.weightBlend = [];	
		var normals = [];
		for (var i=0;i<numVert;i++){
			var wCount = verts[i].substring(verts[i].indexOf('(')+2).split(' ');
			var wInd = parseInt(wCount[3]);
			mesh.textures.push(parseFloat(wCount[0]));
			mesh.textures.push(parseFloat(wCount[1]));
			wCount = parseInt(wCount[4]);
			var x = 0.0;
			var y = 0.0;
			var z = 0.0;
			for (var j=wInd;j<wInd+wCount;j++){
				var spli = weights[j].split(' ');
				var bone = bones[parseInt(spli[2])];
				var bias = parseFloat(spli[3]);
				var q = bone.orient.rot(parseFloat(spli[5]),parseFloat(spli[6]),parseFloat(spli[7]));
				x += (bone.x+q.x)*bias;
				y += (bone.y+q.y)*bias;
				z += (bone.z+q.z)*bias;
			}
			var spli = weights[wInd].split(' ');
			mesh.weight1.push(parseFloat(spli[5]));
			mesh.weight1.push(parseFloat(spli[6]));
			mesh.weight1.push(parseFloat(spli[7]));
			mesh.weight1.push(parseFloat(spli[2]));
			mesh.weightBlend.push(parseFloat(spli[3]));
			if(wCount>1){
				spli = weights[wInd+1].split(' ');
				mesh.weight2.push(parseFloat(spli[5]));
				mesh.weight2.push(parseFloat(spli[6]));
				mesh.weight2.push(parseFloat(spli[7]));
				mesh.weight2.push(parseFloat(spli[2]));
				mesh.weightBlend.push(1.0-mesh.weightBlend[mesh.weightBlend.length-1]);
			}else{
				mesh.weight2.push(0.0);
				mesh.weight2.push(0.0);
				mesh.weight2.push(0.0);
				mesh.weight2.push(0.0);
				mesh.weightBlend.push(0.0);
			}
			mesh.vertices.push(x);
			mesh.vertices.push(y);
			mesh.vertices.push(z);
			normals.push([]);
		}
		for (var i=0;i<numTri;i++){
			//debug(i);
			var spli = tris[i].split(' ');
			var s1 = parseInt(spli[2])+vOffset;
			var s2 = parseInt(spli[3])+vOffset;
			var s3 = parseInt(spli[4])+vOffset;
			mesh.materials[k].faces.push(s1);
			mesh.materials[k].faces.push(s2);
			mesh.materials[k].faces.push(s3);
			var v1 = new Object();
			var v2 = new Object();
			v1.x = mesh.vertices[s1*3]-mesh.vertices[s2*3];
			v1.y = mesh.vertices[s1*3+1]-mesh.vertices[s2*3+1];
			v1.z = mesh.vertices[s1*3+2]-mesh.vertices[s2*3+2];
			v2.x = mesh.vertices[s1*3]-mesh.vertices[s3*3];
			v2.y = mesh.vertices[s1*3+1]-mesh.vertices[s3*3+1];
			v2.z = mesh.vertices[s1*3+2]-mesh.vertices[s3*3+2];

			var n = new Object();
			n.x = v1.y*v2.z-v1.z*v2.y;
			n.y = v1.z*v2.x-v1.x*v2.z;
			n.z = v1.x*v2.y-v1.y*v2.x;
			var norm = Math.sqrt(n.x*n.x+n.y*n.y+n.z*n.z);
			n.x /= norm;
			n.y /= norm;
			n.z /= norm;
			normals[s1-vOffset].push(n);
			normals[s2-vOffset].push(n);
			normals[s3-vOffset].push(n);
		}
		for (var i=0;i<numVert;i++){
			var nx = 0.0;
			var ny = 0.0;
			var nz = 0.0;
			for (j=0;j<normals[i].length;j++){
				nx += normals[i][j].x;
				ny += normals[i][j].y;
				nz += normals[i][j].z;
			}
			var norm = Math.sqrt(nx*nx+ny*ny+nz*nz);
			nx /= norm;
			ny /= norm;
			nz /= norm;
			mesh.normals.push(nx);
			mesh.normals.push(ny);
			mesh.normals.push(nz);
		}
		vOffset += numVert;
	}
	mesh.initShaders();
	mesh.initBuffers();
	if (mesh.materials[0].textures.length>0)
		gl.uniform1i(mesh.shaderProgram.useTexturesUniform, true);
	return mesh;
};


function parseAnim(data,fileName){
	//debug('Parsing animation');
	var pos = data.indexOf('numFrames');
	var numFrames = parseInt(data.substring(pos+10,data.indexOf('\n',pos)));
	pos = data.indexOf('numJoints',pos);
	var numJoints = parseInt(data.substring(pos+10,data.indexOf('\n',pos)));
	pos = data.indexOf('frameRate');
	var frameRate = parseInt(data.substring(pos+10,data.indexOf('\n',pos)));
	pos = data.indexOf('numAnimatedComponents',pos);
	var numAnimatedComponents = parseInt(data.substring(pos+22,data.indexOf('\n',pos)));
	//debug('Number of frames : '+numFrames+', number of joints : '+numJoints+', framerate : '+frameRate+', number of animated compopnents : '+numAnimatedComponents);
	
	var joints = data.substring(data.indexOf('hierarchy',pos),data.indexOf('}',pos)).split('\n');
	var bones = [];
	for (var i=0;i<numJoints;i++){
		var line = joints[i+1];
		var bone = new Object();
		bone.nam = line.substring(line.indexOf('"')+1,line.lastIndexOf('"'));
		var spli = line.split('\t');
		spli = spli[2].split(' ');		
		bone.parentNum = parseInt(spli[0]);
		bone.parent = bones[bone.parentNum];
		bone.flag = parseInt(spli[1]);
		bone.startIndex = parseInt(spli[2]);
		bones.push(bone);
	}
	/*var idem = (bones.length == object.mesh.bones.length);
	for (i=0;idem && i<numJoints;i++){
		idem = idem && (bones[i].nam == object.mesh.bones[i].nam);
		if (bones[i].parent && object.mesh.bones[i].parent)
			idem = idem && (bones[i].parent.nam == object.mesh.bones[i].parent.nam);
	}
	debug('Animation OK with skeleton ? '+idem);*/
	var boneAnim = [];
	for (var i=0;i<numFrames;i++){
		var frame = new Object();
		frame.bonePos = [];
		frame.boneOrient = [];
		pos = data.indexOf('frame '+i,pos);
		var lines = data.substring(pos,data.indexOf('}',pos)).split('\n');
		for (var j=0;j<numJoints;j++){
			var spli = lines[j+1].split(' ');
			var x = parseFloat(spli[0]);
			var y = parseFloat(spli[1]);
			var z = parseFloat(spli[2]);
			var q = new Quat(parseFloat(spli[3]),parseFloat(spli[4]),parseFloat(spli[5]));
			if (bones[j].parentNum>=0){
				var pq = new Quat(frame.boneOrient[bones[j].parentNum*4],frame.boneOrient[bones[j].parentNum*4+1],frame.boneOrient[bones[j].parentNum*4+2]);
				pq.w = frame.boneOrient[bones[j].parentNum*4+3];
				var cq = pq.rot(x,y,z);
				x = cq.x+frame.bonePos[bones[j].parentNum*3];
				y = cq.y+frame.bonePos[bones[j].parentNum*3+1];
				z = cq.z+frame.bonePos[bones[j].parentNum*3+2];
				q = pq.mul(q);
				q.normalize();
			}
			frame.bonePos.push(x);
			frame.bonePos.push(y);
			frame.bonePos.push(z);
			frame.boneOrient.push(q.x);
			frame.boneOrient.push(q.y);
			frame.boneOrient.push(q.z);				
			frame.boneOrient.push(q.w);
		}
		boneAnim.push(frame);
	}
	//debug(boneAnim.length +' frames');
	if(animations[fileName]['walkF'])
		for(var i=animations[fileName]['walkF'].lastFrame;i>=animations[fileName]['walkF'].firstFrame;i--)
			boneAnim.push(boneAnim[i]);
	return boneAnim; 
};

function createMap(w,h,map,tileSize,paths){
	var mesh = new Mesh('terrain');
	mesh.materials.push(new Object());
	mesh.materials[0].faces = [];
	mesh.materials[0].textures = [];
	var normals = [];	
	for (var i=0;i<w;i++)
		for (var j=0;j<h;j++){
			mesh.vertices.push(i*tileSize);
			mesh.vertices.push(j*tileSize);
			//var hei = Math.random()*2-2;
			/*if (i==0 || j==0 || i == w-1 || j == h-1)
				hei = 3.0;*/
			//map.push();
			mesh.vertices.push(map[i*h+j]);
			mesh.textures.push(i*1.0);
			mesh.textures.push(j*1.0);
			mesh.textures.push(paths[i*h+j]);
			normals.push([]);
		}

	
	for (var i=0;i<w-1;i++)
		for (var j=0;j<h-1;j++){
			mesh.materials[0].faces.push(j*h+i);
			mesh.materials[0].faces.push(j*h+i+1);
			mesh.materials[0].faces.push((j+1)*h+i);
			var n = faceNorm(mesh.vertices,j*h+i,j*h+i+1,(j+1)*h+i);
			normals[j*h+i].push(n);
			normals[j*h+i+1].push(n);
			normals[(j+1)*h+i].push(n);

			mesh.materials[0].faces.push(j*h+i+1);
			mesh.materials[0].faces.push((j+1)*h+i);
			mesh.materials[0].faces.push((j+1)*h+i+1);
			n = faceNorm(mesh.vertices,j*h+i,j*h+i+1,(j+1)*h+i);
			normals[j*h+i+1].push(n);
			normals[(j+1)*h+i].push(n);
			normals[(j+1)*h+i+1].push(n);
		}
	for (var i=0;i<w;i++)
		for (var j=0;j<h;j++){
			var n = new Object();
			n.x = 0.0;
			n.y = 0.0;
			n.z = 0.0;
			for (k=0;k<normals[i*h+j].length;k++){
				n.x += normals[i*h+j][k].x;
				n.y += normals[i*h+j][k].y;
				n.z += normals[i*h+j][k].z;
			}
			n.x /= normals[i*h+j].length;
			n.y /= normals[i*h+j].length;
			n.z /= normals[i*h+j].length;
			var norm = Math.sqrt(n.x*n.x+n.y*n.y+n.z*n.z);
			mesh.normals.push(n.x / norm);
			mesh.normals.push(n.y / norm);
			mesh.normals.push(n.z / norm);
		}
			
	mesh.initShaders();
	mesh.initBuffers();
	gl.uniform1i(mesh.shaderProgram.useTexturesUniform, true);
	return mesh;
}



function loadTextures(mesh,data,dir){
	spli = data.split('\n');
	var textDic = {};
	var matName;
	for (var i=0;i<spli.length;i++){
		var line = spli[i].split(' ');
		if (line[0]=='newmtl')
			matName = line[1];
		if(line[0]=='map_Kd'&& !textDic[matName]){
			textDic[matName] = initTexture(dir+line[1]);
		}
	}
	mats = [];
	for (var i=0;i<mesh.materials.length;i++)
		if(textDic[mesh.materials[i].matName]){
			mesh.materials[i].textures.push(textDic[mesh.materials[i].matName]);
			mats.push(mesh.materials[i]);
		}
	mesh.materials = mats;
	//debug(data);

}

function parseObj(data,dir,recenter){
	//debug('Parsing obj file in '+dir);
	var spli = data.split('\n');
	var mesh = new Mesh('static');
	var normals = [];
	var vertices = [];
	var vertDic = {};
	var textures = [];
	var maxX = -100000;
	var maxY = -100000;
	var minX = 100000;
	var minY = 100000;
	var minZ = 10000000.0;
	var reqMat = new XMLHttpRequest();
	reqMat.onreadystatechange = function() { 
		if(reqMat.readyState == 4){
			if (reqMat.responseText.length>0){
				loadTextures(mesh,reqMat.responseText,dir);
			} 
		}
	}
	for (var i=0;i<spli.length;i++){
		var toks = spli[i].split(' ');
		if (toks[0]=='v'){
			var val = parseFloat(toks[1]);
			vertices.push(val);
			minX=Math.min(minX,val);
			maxX=Math.max(maxX,val);
			val = parseFloat(toks[3]);
			vertices.push(val);
			minY=Math.min(minY,val);
			maxY=Math.max(maxY,val);
			val = parseFloat(toks[2]);
			vertices.push(val);
			minZ = Math.min(val,minZ);
		}else if(toks[0]=='vt'){
			textures.push(parseFloat(toks[1]));
			textures.push(parseFloat(toks[2]));
		}else if(toks[0]=='f'){
			for (j=1;j<4;j++){
				if (!(toks[j] in vertDic)){
					var toks2 = toks[j].split('/');
					mesh.vertices.push(vertices[3*parseInt(toks2[0])-3]);
					mesh.vertices.push(vertices[3*parseInt(toks2[0])-2]);
					mesh.vertices.push(vertices[3*parseInt(toks2[0])-1]);
					normals.push([]);
					for (k=0;k<2;k++)
						mesh.textures.push(textures[2*parseInt(toks2[1])+k-2]);
					vertDic[toks[j]] = mesh.vertices.length/3-1;
				}
				mesh.materials[mesh.materials.length-1].faces.push(vertDic[toks[j]]);
				// TODO compute normals here
			}
		}else if (toks[0]=='mtllib'){
			reqMat.open('GET', dir+toks[1], true);
		}else if (toks[0]=='usemtl'){
			mesh.materials.push(new Object());
			var mat = mesh.materials[mesh.materials.length-1];
			mat.textures = [];
			mat.faces = [];
			mat.matName = toks[1];
		}
	}
	if (recenter){
		//debug('recentering : '+(minX+maxX)/2.0+','+(minY+maxY)/2.0);
		for (var i=0;i<mesh.vertices.length/3;i++){
			mesh.vertices[3*i] -= (minX+maxX)/2.0;
			mesh.vertices[3*i+1] -= (minY+maxY)/2.0;
			mesh.vertices[3*i+2] -= minZ;
		}
	}
	reqMat.send(null);
	/*debug(vertices.length/3+' vertices found');
	debug(mesh.vertices.length/3+' vertices loaded');
	debug(textures.length/2+' textures found');
	debug(mesh.textures.length/2+' textures loaded');
	debug(mesh.materials.length+' materials loaded');*/
	for (var k=0;k<mesh.materials.length;k++){
		//debug(mesh.materials[k].faces.length/3+' faces in this material');
		for (var i=0;i<mesh.materials[k].faces.length/3;i++){
			//for (j=0;j<3;j++){
				var v1 = new Object();
				var v2 = new Object();
				var s1 = mesh.materials[k].faces[i*3];
				var s2 = mesh.materials[k].faces[i*3+1];
				var s3 = mesh.materials[k].faces[i*3+2];
				v1.x = mesh.vertices[s1*3]-mesh.vertices[s2*3];
				v1.y = mesh.vertices[s1*3+1]-mesh.vertices[s2*3+1];
				v1.z = mesh.vertices[s1*3+2]-mesh.vertices[s2*3+2];
				v2.x = mesh.vertices[s1*3]-mesh.vertices[s3*3];
				v2.y = mesh.vertices[s1*3+1]-mesh.vertices[s3*3+1];
				v2.z = mesh.vertices[s1*3+2]-mesh.vertices[s3*3+2];
				//debug(v1.x+','+v1.y+','+v1.z+'/'+v2.x+','+v2.y+','+v2.z);
				var n = new Object();
				n.x = v1.y*v2.z-v1.z*v2.y;
				n.y = v1.z*v2.x-v1.x*v2.z;
				n.z = v1.x*v2.y-v1.y*v2.x;
				var norm = Math.sqrt(n.x*n.x+n.y*n.y+n.z*n.z);
				n.x /= norm;
				n.y /= norm;
				n.z /= norm;
				normals[s1].push(n);
				normals[s2].push(n);
				normals[s3].push(n);
				//debug(s1+','+s2+','+s3+'/'+n.x+','+n.y+','+n.z);
			//}
		}
	}
	for (var i=0;i<mesh.vertices.length/3;i++){
		var nx = 0.0;
		var ny = 0.0;
		var nz = 0.0;
		for (var j=0;j<normals[i].length;j++){
			nx += normals[i][j].x;
			ny += normals[i][j].y;
			nz += normals[i][j].z;
		}
		var norm = Math.sqrt(nx*nx+ny*ny+nz*nz);
		nx /= norm;
		ny /= norm;
		nz /= norm;
		mesh.normals.push(nx);
		mesh.normals.push(ny);
		mesh.normals.push(nz);
	}
	//debug(mesh.normals.length/3+' normals loaded');
	mesh.initShaders();
	mesh.initBuffers();
	gl.uniform1i(mesh.shaderProgram.useTexturesUniform, true);
	return mesh;
}

function createSky(){
	var sky = new Mesh('static');
	for (var i=0;i<4;i++){
		sky.materials.push(new Object());
		sky.materials[i].textures = [];
		sky.materials[i].faces = [4*i+0,4*i+1,4*i+2,4*i+1,4*i+2,4*i+3];
	}
	sky.materials[0].textures.push(initTexture('data/text/clouds1_north.jpg'));
	sky.materials[1].textures.push(initTexture('data/text/clouds1_south.jpg'));
	sky.materials[2].textures.push(initTexture('data/text/clouds1_east.jpg'));
	sky.materials[3].textures.push(initTexture('data/text/clouds1_west.jpg'));
	var s = 50.0;
	sky.vertices = [s,s,s,  -s, s,s,  s,s,-s, -s,s,-s, // north
			s,-s,s,  -s, -s,s,  s,-s,-s, -s,-s,-s, // south
			s,s,s,  s, -s,s,  s,s,-s, s,-s,-s, // east
			-s,s,s,  -s, -s,s,  -s,s,-s, -s,-s,-s]; //west
	sky.textures = [1.0,1.0,0.0,1.0,1.0,0.0,0.0,0.0,
			0.0,1.0,1.0,1.0,0.0,0.0,1.0,0.0,
			0.0,1.0,1.0,1.0,0.0,0.0,1.0,0.0,
			1.0,1.0,0.0,1.0,1.0,0.0,0.0,0.0];
	sky.normals = [0.0,0.0,-1.0,0.0,0.0,-1.0,0.0,0.0,-1.0,0.0,0.0,-1.0,0.0,
			0.0,-1.0,0.0,0.0,-1.0,0.0,0.0,-1.0,0.0,0.0,-1.0,0.0,
			0.0,-1.0,0.0,0.0,-1.0,0.0,0.0,-1.0,0.0,0.0,-1.0,0.0,
			0.0,-1.0,0.0,0.0,-1.0,0.0,0.0,-1.0,0.0,0.0,-1.0];
	sky.materials[0].faces = [0,1,2,1,2,3];
	sky.initShaders();
	sky.initBuffers();
	gl.uniform1i(sky.shaderProgram.useTexturesUniform, true);
	return sky;
}

function createHealthCircle(){
	var hc = new Mesh('health');
	hc.materials.push(new Object());
	hc.materials[0].textures = [];
	hc.materials[0].textures.push(initTexture('data/text/circleHealth.png'));
	hc.vertices = [-1.0,-1.0,0.1,-1.0,1.0,0.1,1.0,-1.0,0.1,1.0,1.0,0.1];
	hc.textures = [0.0,0.0,0.0,1.0,1.0,0.0,1.0,1.0];
	hc.normals = [0.0,0.0,-1.0,0.0,0.0,-1.0,0.0,0.0,-1.0,0.0,0.0,-1.0];
	hc.materials[0].faces = [0,1,2,1,2,3];
	hc.initShaders();
	hc.initBuffers();
	gl.uniform1i(hc.shaderProgram.useTexturesUniform, true);
	return hc;
}
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
/* Javascript quaternion library
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

function Quat(x,y,z){
	this.x = x;
	this.y = y;
	this.z = z;
	var t = 1.0 - x*x - y*y - z*z;
	if (t < 0.0) this.w = 0.0;
	else this.w = -Math.sqrt(t);
	//this.normalize();
}

Quat.prototype.conj = function(){
	var r = new Quat(-this.x,-this.y,-this.z);
	r.w = this.w;
	return r;
}

Quat.prototype.mul = function(q){
	var r = new Quat((this.x * q.w) + (this.w * q.x) + (this.y * q.z) - (this.z * q.y),
			(this.y * q.w) + (this.w * q.y) + (this.z * q.x) - (this.x * q.z),
			(this.z * q.w) + (this.w * q.z) + (this.x * q.y) - (this.y * q.x));
	r.w = (this.w * q.w) - (this.x * q.x) - (this.y * q.y) - (this.z * q.z);
	//r.normalize();
	return r;
}

Quat.prototype.rot = function(x,y,z){
	var r = new Quat(x,y,z);
	r.w = 0.0;
	r = this.mul(r);
	r = r.mul(this.conj());
	return r;
}

Quat.prototype.toString = function(){
	return 'w: '+this.w+' x: '+this.x+' y: '+this.y+' z: '+this.z;
}

Quat.prototype.norm = function(){
	return Math.sqrt(this.w*this.w + this.x*this.x + this.y*this.y +this.z*this.z);
}

Quat.prototype.normalize = function(){
	var norm = this.norm();
	if(norm>0){
		this.w /= norm;
		this.x /= norm;
		this.y /= norm;
		this.z /= norm;
	}else
		debug('Problem with computing quat norm : '+this);
}

Quat.prototype.dot = function(q){
	return this.w*q.w + this.x*q.x + this.y*q.y +this.z*q.z;
}

Quat.prototype.slerp = function(q,t){
	var r = new Quat(0,0,0);
	var w1,w2;
	var cosT = this.dot(q);
	if(cosT<0){
		this.x = -this.x;
		this.y = -this.y;
		this.z = -this.z;
		this.w = -this.w;
		cosT = -cosT;
	}
	var theta = Math.acos(cosT);
	if(Math.sin(theta)>0.001){
		w1 = Math.sin((1.0-t)*theta) / Math.sin(theta);
		w2 = Math.sin(t*theta) / Math.sin(theta);
	}else{
		w1 = 1.0 - t;
		w2 = t;
	}
	r.x = w1*this.x + w2*q.x;
	r.y = w1*this.y + w2*q.y;
	r.z = w1*this.z + w2*q.z;
	r.w = w1*this.w + w2*q.w;
	r.normalize();
	return r;
}

Quat.prototype.nlerp = function(q,t){
	var r = new Quat(0,0,0);
	var w1 = 1.0 - t;
	var w2 = t;
	r.x = w1*this.x + w2*q.x;
	r.y = w1*this.y + w2*q.y;
	r.z = w1*this.z + w2*q.z;
	r.w = w1*this.w + w2*q.w;
	r.normalize();
	return r;
}

Quat.prototype.axisAngle = function(){
	var s = Math.sqrt(1-this.w*this.w);
	var aa = new Object();
	aa.angle = 2 * Math.acos(this.w)*180.0/Math.PI;
	if (s < 0.0001) {
	     	aa.x = this.x;
	     	aa.y = this.y;
	     	aa.z = this.z;
	} else {
		aa.x = this.x / s; 
		aa.y = this.y / s;
		aa.z = this.z / s;
	}
	return aa;
}
/* WebGL 3D Quests class
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
 * along with this program.  If not, see (http://www.gnu.org/licenses/).
 *
 * Some parts of this program were inspired from this site : http://learningwebgl.com/blog/
 *
 */

/*
Triggers :
 - kill monster
 - collect item
 - talk to someone

*/

var questGrammar = {};

questGrammar['(quest)'] = ['(knowledge)','(comfort)','(reputation)','(serenity)','(protection)','(conquest)','(wealth)','(ability)','(equipment)'];
questGrammar['(knowledge)'] = ['(get) (goto) give',/*'(spy)',*/'(goto) listen (goto) report','(get) (goto) use (goto) give'];
questGrammar['(comfort)'] = ['(get) (goto) give'/*,'(goto) damage (goto) report'*/];
questGrammar['(reputation)'] = ['(get) (goto) give', '(goto) (kill) (goto) report','(goto) (goto) report'];
questGrammar['(serenity)'] = [/*'(goto) damage',*/'(get) (goto) use (goto) give',/*'(get) (goto) use capture (goto) give',*/'(goto) listen (goto) report','(goto) take (goto) give','(get) (goto) give'/*,'(goto) damage escort (goto) report'*/];
questGrammar['(protection)'] = [/*'(goto) damage (goto) report',*/'(get) (goto) use',/*'(goto) repair',*/'(get) (goto) use'/*,'(goto) damage','(goto) repair','(goto) defend'*/];
questGrammar['(conquest)'] = [/*'(goto) damage',*/'(goto) (steal) (goto) give'];
questGrammar['(wealth)'] = ['(goto) (get)','(goto) (steal)','repair'];
questGrammar['(ability)'] = ['repair use','(get) use','use',/*'damage',*/'use','(get) use','(get) experiment'];
questGrammar['(equipment)'] = ['repair','(get) (goto) give','(steal)','(goto) exchange'];


questGrammar['(subquest)'] = ['(goto)','(goto) (quest) (goto)'];
questGrammar['(goto)'] = ['','explore','(learn) goto'];
questGrammar['(learn)'] = ['','(goto) (subquest) listen','(goto) (get) read','(get) (subquest) give listen'];
questGrammar['(get)'] = ['','(steal)','(goto) gather','(goto) (get) (goto) (subquest) exchange'];
questGrammar['(steal)'] = [/*'(goto) stealth take',*/'(goto) (kill) take'];
//questGrammar['(spy)'] = ['(goto) spy (goto) report'];
//questGrammar['(capture)'] = ['(get) (goto) capture'];
questGrammar['(kill)'] = ['(goto) kill'];

function expandQuest(quest){
	var newQuest = '';
	var spli = quest.split(' ');
	for (var i=0;i<spli.length;i++){
		var rule = questGrammar[spli[i]];
		var ru;
		if(rule)
			ru = rule[Math.floor(rand()*rule.length)];
		else
			ru = spli[i];
		newQuest += ru
		if(i<spli.length-1 && ru.length>0)
			newQuest += ' ';
	}
	return newQuest;
}
/*
function State(goal,target){
	this.goal = goal;
	this.target = target;
}

State.prototype.process = funtion(goal, target){
	if (this.goal==goal)
		if (this.goal=='talk'){
			return (this.target==target);
		}else if (this.goal=='kill'){
			if (this.target.currentHp(=0.0)
				return true;
		}else if(this.goal=='collect'){
			this.target.name==target.name)
		}
	return false;
}

function Quest(states){
	this.currentState = 0;
	this.states = states;	

}*/
/* WebGL 3D models renderer
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
 *
 */

var world ;
var gl;
var lastTime = 0;
var elapsed ;
var viewDist = -10;
var currentlyPressedKeys = Object();
var pause = false;
var keyMap = {}
keyMap['pause'] = 80; // p 
keyMap['aptitude'] = 76; // l
keyMap['quests'] = 75; // k
keyMap['settings'] = 79; // o
keyMap['inventory'] = 73; // i
keyMap['pick'] = 81; // q
keyMap['activate'] = 65; // a
keyMap['forward'] = 69; // e
keyMap['strafeLeft'] = 90; // z
keyMap['strafeRight'] = 82; // r
keyMap['backward'] = 68; // d
keyMap['turnLeft'] = 83; // s
keyMap['turnRight'] = 70; // f
keyMap['attack'] = 84; // t

function initGL(canvas) {
	try {
		gl = canvas.getContext('experimental-webgl');
		gl.viewportWidth = canvas.width;
		gl.viewportHeight = canvas.height;
	} catch(e) {
	}
	if (!gl) 
		error("Could not initialise WebGL, sorry :-(");
}


function drawScene() {
    	gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
    	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    	mat4.perspective(45, gl.viewportWidth / gl.viewportHeight, 0.1, 1000.0,pMatrix);
    	mat4.identity(mvMatrix);
	mat4.translate(mvMatrix,[0.0, 0.0, viewDist]);
	if (world)
		world.draw(elapsed);
  }



function animate() {
	var timeNow = new Date().getTime();
	if (lastTime != 0) {
		elapsed = (timeNow - lastTime)/1000.0;
		document.getElementById("frameRate").innerHTML = 'FPS : '+Math.round(1/elapsed);
	}
	lastTime = timeNow;
}


function handleKeyDown(event) {
	currentlyPressedKeys[event.keyCode] = true;
}


function handleKeyUp(event) {
	currentlyPressedKeys[event.keyCode] = false;
}

function handleKeys() {
	world.player.speed = 0.0;
	if (currentlyPressedKeys[keyMap['forward']] && currentlyPressedKeys[keyMap['strafeLeft']]){ // e z
		world.player.speed = 6.0;
		world.player.setAction(skills['walkF']);
		animations[world.player.modelName]['walkF'].speed = world.player.speed*2;
		world.player.moveAngle = 45;
	}else if (currentlyPressedKeys[keyMap['forward']] && currentlyPressedKeys[keyMap['strafeRight']]){ // e r
     		world.player.speed = 6.0;
		world.player.setAction(skills['walkF']);
		animations[world.player.modelName]['walkF'].speed = world.player.speed*2;
		world.player.moveAngle = 315;
	}else if (currentlyPressedKeys[keyMap['backward']] && currentlyPressedKeys[keyMap['strafeLeft']]){ // d z
     		world.player.speed = 4.0;
		world.player.setAction(skills['walkB']);
		animations[world.player.modelName]['walkB'].speed = world.player.speed*2;
		world.player.moveAngle = 135;
	}else if (currentlyPressedKeys[keyMap['backward']] && currentlyPressedKeys[keyMap['strafeRight']]){ // d r
     		world.player.speed = 4.0;
		world.player.setAction(skills['walkB']);
		animations[world.player.modelName]['walkB'].speed = world.player.speed*2;
		world.player.moveAngle = 225;
	}else if (currentlyPressedKeys[keyMap['forward']]){
		world.player.speed = 8.0;
		world.player.setAction(skills['walkF']);
		animations[world.player.modelName]['walkF'].speed = world.player.speed*2;
		world.player.moveAngle = 0;
	}else if (currentlyPressedKeys[keyMap['backward']]){
     		world.player.speed = 4.0;
		world.player.setAction(skills['walkB']);
		animations[world.player.modelName]['walkB'].speed = world.player.speed*2;
		world.player.moveAngle = 180;
	}else if (currentlyPressedKeys[keyMap['strafeLeft']]){
     		world.player.speed = 4.0;
		world.player.setAction(skills['walkF']);
		animations[world.player.modelName]['walkF'].speed = world.player.speed*2;
		world.player.moveAngle = 90;
	}else if (currentlyPressedKeys[keyMap['strafeRight']]){
     		world.player.speed = 4.0;
		world.player.setAction(skills['walkF']);
		animations[world.player.modelName]['walkF'].speed = world.player.speed*2;
		world.player.moveAngle = 270;
	}
	if (currentlyPressedKeys[keyMap['turnLeft']])
		world.player.orient +=90*elapsed;
	else if (currentlyPressedKeys[keyMap['turnRight']])
     		world.player.orient -=90*elapsed;

	if (currentlyPressedKeys[keyMap['attack']])
		if (!world.player.equipment['weapon'].item)
			world.player.setAction(skills['Punch']);//attack
		else if (world.player.equipment['weapon'].item.damageType=='slash')
			world.player.setAction(skills['Slashing attack']);//attack
		else if (world.player.equipment['weapon'].item.damageType=='pierce')
			world.player.setAction(skills['Piercing attack']);//attack
		else if (world.player.equipment['weapon'].item.damageType=='blunt')
			world.player.setAction(skills['Blunt attack']);//attack

	if (currentlyPressedKeys[keyMap['aptitude']])
  		showTab('aptitude');
	if (currentlyPressedKeys[keyMap['quests']])
  		showTab('quests');
	if (currentlyPressedKeys[keyMap['settings']])
  		showTab('settings');
	if (currentlyPressedKeys[keyMap['inventory']])
  		showTab('inventory');

	if (currentlyPressedKeys[keyMap['pick']]) {
		var objs = world.getObjNear(world.player.x,world.player.y,1);
		var pickables = [];
		for (var i=0;i<objs.length;i++)
			if(objs[i].pickable && dist(objs[i],world.player)<2.0)
				pickables.push(objs[i]);
		var firstEmptyCell = $('#inventoryTable td:empty:eq(0)');
		if(pickables.length>0 && firstEmptyCell.length>0){
			var picked = pickables[Math.floor(rand()*pickables.length)];
			world.removeObjectFromGrid(picked);
			world.events.push(['picked',picked]);
			picked.pickable.alive = false;
			if(picked.stackable && $('div[name="'+picked.name+'"]').length>0){
				var it = $('div[name="'+picked.name+'"]').first();
				it.attr('count',eval(it.attr('count'))+1);
				it.empty();
				it.append(it.attr('count'));
			}else{
				world.player.inventory[picked.id]=picked;
				firstEmptyCell.append(getIcon(picked));
			}
		}
	}
	if (currentlyPressedKeys[keyMap['activate']]) {
		var objs = world.getObjNear(world.player.x,world.player.y,1);
		for (var i=0;i<objs.length;i++)
			if(objs[i].properties && objs[i].properties.activation && dist(objs[i],world.player)<2.0 && objs[i].currentAction.type=='idle'){
				if (objs[i].properties.activation.type == 'loot')
					objs[i].currentAction = new  Action(objs[i],skills['open']);
				else if (objs[i].properties.activation.type == 'trade'){
					document.getElementById('vendorTab').style.visibility = 'visible';
				}
			}
	}
}

function showTab(tab){
	currentlyPressedKeys[keyMap[tab]] = false;
	if (document.getElementById(tab+'Tab').style.visibility == 'hidden')
		document.getElementById(tab+'Tab').style.visibility = 'visible';
	else
		document.getElementById(tab+'Tab').style.visibility = 'hidden';
}

function tick() {
	if (currentlyPressedKeys[keyMap['pause']]) { // p
  		showTab('pause');
		pause = !pause;
		lastTime = (new Date()).getTime();
	}
	if(!pause){
		if (world && world.player)
			handleKeys();
		animate();
		drawScene();
		if(world)
			world.processEvents();
	}
}


function webGLStart() {
	var canvas = document.getElementById("3d viewer");
	initGL(canvas);
    	gl.clearColor(0.0, 0.0, 0.0, 1.0);
    	gl.clearDepth(1.0);
   	gl.enable(gl.DEPTH_TEST);
    	gl.depthFunc(gl.LEQUAL);
	setInterval(tick, 20);
	document.onkeydown = handleKeyDown;
	document.onkeyup = handleKeyUp;
	initFromJSON();
	world = new World();
	var quest = '(quest)';
	for (var i=0;i<3;i++){
		quest = expandQuest(quest);
		debug(quest);
	}
}

function allLoaded(){
	return models.loaded && animations.loaded && items.loaded && projectiles.loaded && skills.loaded && particles.loaded && areas.loaded && creatures.loaded && powers.loaded;
}

function initJqueryFunc(){
	$('#canvas3D').mousemove(function(e){mouseX = e.pageX - this.offsetLeft;mouseY = e.pageY - this.offsetTop;});
	$('#shortcutTable td').droppable({
		accept:'.skill,.item.consumable',
		drop:function( event, ui ) {
			//debug(src.droppable('option','accept'));
			if(src.attr('class')=='ui-droppable' && $(this).children(src.droppable('option','accept')).length>0)
				src.append($(this).children(src.droppable('option','accept')));
			else if($(this).children('.skill').length>0){
				$(this).children().remove();
				//src.append(ui.draggable.clone());
			}
			if($(this).children('.item').length==0)
				$(this).append( ui.draggable );
		}
	});
	$('#inventoryTable td').droppable({
		accept:'.item',
		drop:function( event, ui ) {
			if($(this).children(src.droppable('option','accept')).length>0)
				src.append($(this).children());
			if($(this).children('.item').length==0)
				$(this).append( ui.draggable );
			var str = src.droppable('option','accept');
			if(str.length>6)
				if(src.children().length>0)
					world.player.addEquipment(world.player.inventory[src.children().first().attr('id')]);
				else
					world.player.removeEquipment(str.substring(6,str.length));
		}
	});
	$('#leftgear div').eq(0).droppable({
		accept:'.item.helmet',
		drop:function( event, ui ) {
			src.append($(this).children());
			$(this).append( ui.draggable );
			world.player.addEquipment(world.player.inventory[$(this).children().first().attr('id')]);
		}
	});
	$('#leftgear div').eq(1).droppable({
		accept:'.item.pauldrons',
		drop:function( event, ui ) {
			src.append($(this).children());
			$(this).append( ui.draggable );
			world.player.addEquipment(world.player.inventory[$(this).children().first().attr('id')]);
		}
	});
	$('#leftgear div').eq(2).droppable({
		accept:'.item.gloves',
		drop:function( event, ui ) {
			src.append($(this).children());
			$(this).append( ui.draggable );
			world.player.addEquipment(world.player.inventory[$(this).children().first().attr('id')]);
		}
	});
	$('#leftgear div').eq(3).droppable({
		accept:'.item.weapon',
		drop:function( event, ui ) {
			src.append($(this).children());
			$(this).append( ui.draggable );
			world.player.addEquipment(world.player.inventory[$(this).children().first().attr('id')]);
		}
	});
	$('#leftgear div').eq(4).droppable({
		accept:'.item.pants',
		drop:function( event, ui ) {
			src.append($(this).children());
			$(this).append( ui.draggable );
			world.player.addEquipment(world.player.inventory[$(this).children().first().attr('id')]);
		}
	});
	$('#leftgear div').eq(5).droppable({
		accept:'.item.boots',
		drop:function( event, ui ) {
			src.append($(this).children());
			$(this).append( ui.draggable );
			world.player.addEquipment(world.player.inventory[$(this).children().first().attr('id')]);
		}
	});
	$('#rightgear div').eq(1).droppable({
		accept:'.item.armor',
		drop:function( event, ui ) {
			src.append($(this).children());
			$(this).append( ui.draggable );
			world.player.addEquipment(world.player.inventory[$(this).children().first().attr('id')]);
		}
	});
	$('#rightgear div').eq(3).droppable({
		accept:'.item.shield',
		drop:function( event, ui ) {
			src.append($(this).children());
			$(this).append( ui.draggable );
			world.player.addEquipment(world.player.inventory[$(this).children().first().attr('id')]);
		}
	});
	$('#trash').droppable({
		accept:'.item',
		drop:function( event, ui ) {
			delete world.player.inventory[src.children().first().attr('id')];
			src.children().remove();
			var str = src.droppable('option','accept');
			if(str.length>6)
				world.player.removeEquipment(str.substring(6,str.length));
		}
	});
	$('#vendorTab').droppable({
		accept:'.item',
		drop:function( event, ui ) {
			world.player.gold += world.player.inventory[src.children().first().attr('id')].goldCost;
			$('#gold').html(world.player.gold+' gold');
			delete world.player.inventory[src.children().first().attr('id')];
			src.children().remove();
			var str = src.droppable('option','accept');
			if(str.length>6)
				world.player.removeEquipment(str.substring(6,str.length));
		}
	});
}

function initWorld(collec){
	collec.loaded = true;
	if(allLoaded()){
		initJqueryFunc();
		var graph = world.graph;
		var startPoint = createArea('start',graph[0].x,graph[0].y,graph[0].areaLevel);		
		world.areas.push(startPoint);
		var areasArray = [];
		for (x in areas)
			if(x!='start' && x!='loaded')
				areasArray.push(x);
		for (var k=1;k<graph.length;k++){
			var inclMax = 0;
			for (var i=0;i<20;i++){
				do{
					var ox = (1-rand()*2)*30;
					var oy = (1-rand()*2)*30;
				}while(ox*ox+oy*oy>1000);
				inclMax = Math.max(inclMax,1.0-Math.abs(world.getNorm(graph[k].x+ox,graph[k].y+oy).z));
			}
			var altitude = world.getH(graph[k].x,graph[k].y);
			do{
				var areaInd = Math.floor(rand()*areasArray.length);
				var ok = true;
				for (var i=0;i<areas[areasArray[areaInd]].constrains.length;i++)
					ok = ok && eval(areas[areasArray[areaInd]].constrains[i]);
				
			}while(!ok);
			createArea(areasArray[areaInd],graph[k].x,graph[k].y,graph[k].areaLevel);
		}
		for (var i=0;i<areasArray.length;i++)
			debug(areas[areasArray[i]].numCreated+' '+areasArray[i]);
		var modifs = models[creatures['Player'].modelName];
		do{
			var ox = (1-rand()*2)*startPoint.radius;
			var oy = (1-rand()*2)*startPoint.radius;
			var collid = world.getCollisions(startPoint.x+ox,startPoint.y+oy,modifs.collision.radius);
		}while(ox*ox+oy*oy>startPoint.radius*startPoint.radius || collid.length>0);
		world.player = new Character(creatures['Player'],startPoint.x+ox,startPoint.y+oy,1);
		world.player.gold = 0;
	}
}

function initFromJSON(){
	var reqModels = new XMLHttpRequest();
	reqModels.open('GET', 'json/models.json', true);
	reqModels.onreadystatechange = function() { 
		if(reqModels.readyState == 4)
			if (reqModels.responseText.length>0){
				var jsonModelsArr = eval('('+reqModels.responseText+')');
				for (var k=0;k<jsonModelsArr.length;k++){
					models[jsonModelsArr[k].modelName] = jsonModelsArr[k];
					if(models[jsonModelsArr[k].modelName].type=='md5')
						loadMd5Mesh(jsonModelsArr[k].modelName);
					else if(models[jsonModelsArr[k].modelName].type=='obj')
						loadObj(jsonModelsArr[k].modelName,jsonModelsArr[k].recenter);
					else if(models[jsonModelsArr[k].modelName].type=='health')
						models[jsonModelsArr[k].modelName].mesh = createHealthCircle();
				}
				initWorld(models);
			}
	}
	var reqAnims = new XMLHttpRequest();
	reqAnims.open('GET', 'json/animations.json', true);
	reqAnims.onreadystatechange = function() { 
		if(reqAnims.readyState == 4)
			if (reqAnims.responseText.length>0){
				var jsonAnimsArr = eval('('+reqAnims.responseText+')');
				for (var k=0;k<jsonAnimsArr.length;k++){
					animations[jsonAnimsArr[k].modelName] = jsonAnimsArr[k];
					loadMd5Anim(jsonAnimsArr[k].modelName);
				}
				initWorld(animations);
			}
	}
	var reqItems = new XMLHttpRequest();
	reqItems.open('GET', 'json/items.json', true);
	reqItems.onreadystatechange = function() { 
		if(reqItems.readyState == 4)
			if (reqItems.responseText.length>0){
				var jsonItemArr = eval('('+reqItems.responseText+')');
				for (var k=0;k<jsonItemArr.length;k++){
					items[jsonItemArr[k]['name']] = jsonItemArr[k];
				}
				initWorld(items);
			}
	}
	var reqPowers = new XMLHttpRequest();
	reqPowers.open('GET', 'json/powers.json', true);
	reqPowers.onreadystatechange = function() { 
		if(reqPowers.readyState == 4)
			if (reqPowers.responseText.length>0){
				powers.list = eval('('+reqPowers.responseText+')');
				initWorld(powers);
			}
	}
	var reqAreas = new XMLHttpRequest();
	reqAreas.open('GET', 'json/areas.json', true);
	reqAreas.onreadystatechange = function() { 
		if(reqAreas.readyState == 4)
			if (reqAreas.responseText.length>0){
				var jsonAreasArr = eval('('+reqAreas.responseText+')');
				for (var k=0;k<jsonAreasArr.length;k++){
					areas[jsonAreasArr[k]['name']] = jsonAreasArr[k];
				}
				initWorld(areas);
			}
	}
	var reqProjs = new XMLHttpRequest();
	reqProjs.open('GET', 'json/projectiles.json', true);
	reqProjs.onreadystatechange = function() { 
		if(reqProjs.readyState == 4)
			if (reqProjs.responseText.length>0){
				var jsonProjArr = eval('('+reqProjs.responseText+')');
				for (var k=0;k<jsonProjArr.length;k++){
					projectiles[jsonProjArr[k]['name']] = jsonProjArr[k];
				}
				initWorld(projectiles);
			}
	}
	var reqSkills = new XMLHttpRequest();
	reqSkills.open('GET', 'json/skills.json', true);
	reqSkills.onreadystatechange = function() { 
		if(reqSkills.readyState == 4)
			if (reqSkills.responseText.length>0){
				var jsonSkillArr = eval('('+reqSkills.responseText+')');
				for (var k=0;k<jsonSkillArr.length;k++){
					skills[jsonSkillArr[k]['name']] = jsonSkillArr[k];
				}
				initWorld(skills);
			}
	}
	var reqCreatures = new XMLHttpRequest();
	reqCreatures.open('GET', 'json/creatures.json', true);
	reqCreatures.onreadystatechange = function() { 
		if(reqCreatures.readyState == 4)
			if (reqCreatures.responseText.length>0){
				var jsonCreaArr = eval('('+reqCreatures.responseText+')');
				for (var k=0;k<jsonCreaArr.length;k++){
					creatures[jsonCreaArr[k]['name']] = jsonCreaArr[k];
				}
				initWorld(creatures);
			}
	}
	var reqParts = new XMLHttpRequest();
	reqParts.open('GET', 'json/particles.json', true);
	reqParts.onreadystatechange = function() { 
		if(reqParts.readyState == 4)
			if (reqParts.responseText.length>0){
				var jsonPartsArr = eval('('+reqParts.responseText+')');
				for (var k=0;k<jsonPartsArr.length;k++){
					var part = new Particles(jsonPartsArr[k]);
					particles[jsonPartsArr[k]['name']] = part;
				}
				initWorld(particles);
			}
	}
	reqAnims.send(null);
	reqItems.send(null);
	reqPowers.send(null);
	reqAreas.send(null);
	reqProjs.send(null);
	reqSkills.send(null);
	reqCreatures.send(null);
	reqParts.send(null);
	reqModels.send(null);
	for (var i=0;i<10;i++)
		particles['num'+i] = new  NumberParticule(i);
}

/** This is high-level function.
 * It must react to delta being more/less than zero.
 */
function handle(delta) {
	if(!pause)
		if (delta < 0){
			if(viewDist>-20)
				viewDist -=1;
		}else
			if(viewDist<1)
				viewDist +=1;
}

/** Event handler for mouse wheel event.
 */
function wheel(event){
        var delta = 0;
        if (!event) /* For IE. */
                event = window.event;
        if (event.wheelDelta) { /* IE/Opera. */
                delta = event.wheelDelta/120;
                /** In Opera 9, delta differs in sign as compared to IE.
                 */
                if (window.opera)
                        delta = -delta;
        } else if (event.detail) { /** Mozilla case. */
                /** In Mozilla, sign of delta is different than in IE.
                 * Also, delta is multiple of 3.
                 */
                delta = -event.detail/3;
        }
        /** If delta is nonzero, handle it.
         * Basically, delta is now positive if wheel was scrolled up,
         * and negative, if wheel was scrolled down.
         */
        if (delta)
                handle(delta);
        /** Prevent default actions caused by mouse wheel.
         * That might be ugly, but we handle scrolls somehow
         * anyway, so don't bother here..
         */
        if (event.preventDefault)
                event.preventDefault();
	event.returnValue = false;
}

/** Initialization code. 
 * If you use your own event management code, change it as required.
 */
if (window.addEventListener)
        /** DOMMouseScroll is for mozilla. */
        window.addEventListener('DOMMouseScroll', wheel, false);
/** IE/Opera. */
window.onmousewheel = document.onmousewheel = wheel;

/* Javascript Object3D skills definitions
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

skills['idle'] = JSON.parse('{"name":"idle","cost": ["0","0","0"],"damages": [],"action": "idle","lifeEffects": [],"finishEffects": []}');
skills['walkF'] = JSON.parse('{"name":"walkF","cost": ["0","0","0"],"damages": [],"action": "walkF","lifeEffects": [],"finishEffects": []}');
skills['walkB'] = JSON.parse('{"name":"walkB","cost": ["0","0","0"],"damages": [],"action": "walkB","lifeEffects": [],"finishEffects": []}');
skills['hit'] = JSON.parse('{"name":"hit","cost": ["0","0","0"],"damages": [],"action": "hit","lifeEffects": [],"finishEffects": []}');
skills['die'] = JSON.parse('{"name":"die","cost": ["0","0","0"],"damages": [],"action": "die","lifeEffects": [],"finishEffects": []}');
skills['disapear'] = JSON.parse('{"name":"disapear","cost": ["0","0","0"],"damages": [],"action": "disapear","lifeEffects": ["disapear"],"finishEffects": []}');
skills['open'] = JSON.parse('{"name":"open","cost": ["0","0","0"],"damages": [],"action": "open","lifeEffects": [],"finishEffects": []}');
skills['opened'] = JSON.parse('{"name":"opened","cost": ["0","0","0"],"damages": [],"action": "opened","lifeEffects": [],"finishEffects": []}');

function Action(parent,skill){
	if(parent == world.player)
		setAptitudeVars(parent);
	this.hpCost = eval(skill.cost[0]);
	this.spCost = eval(skill.cost[1]);
	this.mpCost = eval(skill.cost[2]);
	this.type = skill.action;
	this.isInterruptible = false; //play next action if different from current
	this.lifeEffects = [];
	this.finishEffects = [];
	this.aptitudes = skill.aptitudes;
	for (var i=0;i<skill.lifeEffects.length;i++){
		if(skill.lifeEffects[i]=='disapear')
			this.lifeEffects.push(new Disapear(parent));
		else if(skill.lifeEffects[i].particle)
			this.lifeEffects.push(new ParticleEmitter(parent,skill.lifeEffects[i].particle));
	}
	for (var i=0;i<skill.finishEffects.length;i++){
		if(skill.finishEffects[i].MeleeHit)
			this.finishEffects.push(new MeleeHit(parent,skill,skill.finishEffects[i].MeleeHit));
		else if(skill.finishEffects[i].projectiles)
			this.finishEffects.push(new Projectiles(parent,projectiles[skill.finishEffects[i].projectiles],skill));
	}
	
}

function skillDescription(sk){
	setAptitudeVars(world.player);
	var descrip ='<div class="description" style=left:'+(mouseX+2)+';top:'+(mouseY+2)+';><font color="#AAFFAA">'+ skills[sk].name +'</font><br>'+skills[sk].description+'<br>Cost:';
	if(eval(skills[sk].cost[0])>0)
		descrip += ' <font color="#FF7777">'+eval(skills[sk].cost[0])+' HP</font>';
	if(eval(skills[sk].cost[1])>0)
		descrip += ' <font color="#FFFF77">'+eval(skills[sk].cost[1])+' SP</font>';
	if(eval(skills[sk].cost[2])>0)
		descrip += ' <font color="#7777FF">'+eval(skills[sk].cost[2])+' MP</font>';
	if ((!skills[sk].requirement || eval(skills[sk].requirement) )&& (skills[sk].damages || skills[sk].damagesModifier)){
		descrip += '<br>Damages :<br>';
		var damages = {};
		if(skills[sk].damages)
			for (var type in skills[sk].damages){
				var dam = new Object();
				dam.minValue = eval(skills[sk].damages[type].value)*(1-skills[sk].damages[type].range);
				dam.maxValue = eval(skills[sk].damages[type].value)*(1+skills[sk].damages[type].range);
				damages[type] = dam;
			}
		for (var type in skills[sk].damagesModifier){
			if (damages[type] == null){
				damages[type] = new Object();
				damages[type].minValue = 0;
				damages[type].maxValue = 0;
			}
			var dam = damages[type];
			dam.minValue += minDamage(world.player.damages[type])*eval(skills[sk].damagesModifier[type]);
			dam.maxValue += maxDamage(world.player.damages[type])*eval(skills[sk].damagesModifier[type]);	
		}
		for (type in damages)
			if(damages[type].minValue>0)
				descrip += type+' : '+Math.round(damages[type].minValue*10)/10+' - '+Math.round(damages[type].maxValue*10)/10+'<br>';
	}

	//if (minDmg>0)
		//descrip += ' Damages: '+Math.round(minDmg*100)/100+'-'+Math.round(maxDmg*100)/100;
	descrip += '</div>';
	return descrip;
}

function aptitudeButton(aptitude){
	var cell = document.getElementById("skillTable");
	if (cell.hasChildNodes())
		while (cell.childNodes.length >= 1)
			cell.removeChild(cell.firstChild);       

	for (var sk in skills){
		var hasApti = false;
		var level = 0;
		if(skills[sk].aptitudes)
			for (var i=0;i<skills[sk].aptitudes.length;i++){
				hasApti = hasApti || skills[sk].aptitudes[i]==aptitude;
				level += world.player[skills[sk].aptitudes[i]].level;
			}
		if (skills[sk].icon && hasApti && level >= skills[sk].level){
			var button = $('<div></div>').attr({'class':'skill','skill':sk,'id':skills[sk].name,'style':'width:32;height:32;background-image:url(data/icons/'+skills[sk].icon+')'}).draggable({revert:'invalid',appendTo: 'body',helper: 'clone',start:function(){src = $(this).parent();}});
			button.mouseover(function() {
			    $('#canvas3D').append(skillDescription($(this).attr('skill')));
			  }).mouseout(function(){
			    $('.description').remove();
			  });


			var tr = $('<tr></tr>').append($('<td></td>').append(button));		
			button.click(function(){world.player.setAction(skills[$(this).attr('skill')]);});
			
			tr.append($('<td></td>').append(sk));
			$('#skillTable').append(tr);
		}
	}
	document.getElementById('skillTab').style.visibility = 'visible';
}
/* WebGL 3D world class
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
 *
 */

World = function(){
	this.player = null;
	this.grid = [];
	this.areas = [];
	this.objectsWithAlpha = [];
	this.particles = [];
	this.tileSize = 10.0;
	this.gridSize = 10.0;
	this.events = [];
	this.graph = this.generateTerrain(7);
}


function diamond(xMin,xMax,yMin,yMax,data,w,noise){
	var x = (xMin+xMax)/2;
	var y = (yMin+yMax)/2;
	var avg = (data[yMin*w+xMin]+data[yMin*w+xMax]+data[yMax*w+xMin]+data[yMax*w+xMax])/4.0;
	data[y*w+x] = avg + (1-2*rand())*noise;
	
}

function square(x,y,size,data,w,h,noise){
	var avg = 0.0;
	if(x+size>=w) avg += data[y*w+x-size];
	else avg += data[y*w+x+size];
	if(x-size<0) avg += data[y*w+x+size];
	else avg += data[y*w+x-size];
	if(y+size>=h) avg += data[(y-size)*w+x];
	else avg += data[(y+size)*w+x];
	if(y-size<0) avg += data[(y+size)*w+x];
	else avg += data[(y-size)*w+x];
	avg /= 4.0;
	data[y*w+x] = avg + (1-2*rand())*noise;
}


function paintPath(o1,o2,w,paths){
	var x1 = Math.round(o1.x/10);
	var x2 = Math.round(o2.x/10);
	var y1 = Math.round(o1.y/10);
	var y2 = Math.round(o2.y/10);
	var dx = x2 - x1; var sx = 1;
	var dy = y2 - y1; var sy = 1;
	if (dx < 0){
		sx = -1;
		dx = -dx;
	}
	if (dy < 0){
		sy = -1;
		dy = -dy;
	}
	dx = dx << 1;
	dy = dy << 1;
	paths[x1*w+y1] = 2.0;
	if (dy < dx){    
       		var fraction = dy - (dx>>1);
        	while (x1 != x2){
			if (fraction >= 0){
				y1 += sy;
				fraction -= dx;
				paths[x1*w+y1] = 2.0;
			}
			fraction += dy;
			x1 += sx;
			paths[x1*w+y1] = 2.0;
		}
	}else{
		var fraction = dx - (dy>>1);        
		while (y1 != y2){
			if (fraction >= 0){
				x1 += sx;
				fraction -= dy;
				paths[x1*w+y1] = 2.0;
			}
			fraction += dx;
			y1 += sy;
			paths[x1*w+y1] = 2.0;
		}
	}
}

World.prototype.generateTerrain= function(numRec){
	this.map = new Object3D(0,0,0,null);
	this.map.w = Math.pow(2,numRec)+1;
	this.map.h = Math.pow(2,numRec)+1;
	for(var i=0;i<this.map.w/this.gridSize;i++){
		this.grid.push([]);
		for(var j=0;j<this.map.h/this.gridSize;j++){
			this.grid[i].push([]);
		}
	}
	var data = [];
	for(var i=0;i<this.map.w*this.map.h;i++)
		data.push(0.0);
	for(var i=0;i<3;i++)
		for(var j=0;j<2;j++)
			data[(j*(this.map.h-1)/2)*this.map.w+i*(this.map.w-1)/2] = rand()*140;
	
	var noise = 80;
	for (var k=1;k<numRec;k++){
		for(var i=0;i<Math.pow(2,k);i++)
			for(var j=0;j<Math.pow(2,k);j++){
				var size = Math.pow(2,numRec-k);
				diamond(i*size,(i+1)*size,j*size,(j+1)*size,data,this.map.w,noise);
				square(i*size,j*size+size/2,size/2,data,this.map.w,this.map.h,noise);
				square(i*size+size/2,j*size,size/2,data,this.map.w,this.map.h,noise);
				square((i+1)*size,j*size+size/2,size/2,data,this.map.w,this.map.h,noise);
				square(i*size+size/2,(j+1)*size,size/2,data,this.map.w,this.map.h,noise);	
			}
		noise /= 2;
	}
	
	for (var k=0;k<10;k++)
	for(var i=1;i<this.map.w-1;i++)
		for(var j=1;j<this.map.h-1;j++)
			data[j*this.map.w+i] = (data[(j-1)*this.map.w+i-1]+data[(j-1)*this.map.w+i]+data[(j-1)*this.map.w+i+1]+data[j*this.map.w+i-1]+data[j*this.map.w+i]+data[j*this.map.w+i+1]+data[(j+1)*this.map.w+i-1]+data[(j+1)*this.map.w+i]+data[(j+1)*this.map.w+i+1])/9.0;
	
	var graph = [];
	for (var i=0;i<30;i++){
		var obj = new Object();
		do{
			obj.x = 150+Math.random()*(this.map.w*this.tileSize-300);
			obj.y = 150+Math.random()*(this.map.h*this.tileSize-300);
			var minDist = this.map.w*this.map.h;
			for (var j=0;j<graph.length;j++)
				minDist = Math.min(minDist,dist(obj,graph[j]));
		}while(minDist<150);
		obj.nei = [];
		for (var j=0;j<graph.length;j++)
			if(dist(obj,graph[j])<220){
				obj.nei.push(graph[j]);
				graph[j].nei.push(obj);
			}
		graph.push(obj);
	}
	this.paths = [];
	for(var i=0;i<this.map.w*this.map.h;i++)
		this.paths.push(0.0);
	for (var i=0;i<graph.length;i++){
		for (var j=0;j<graph[i].nei.length;j++)
			paintPath(graph[i],graph[i].nei[j],this.map.w,this.paths);
	}
	
	var explored = [];
	var toExplore = [graph[0]];
	//graph[0].areaLevel = 0;
	var lev = 0;
	while (toExplore.length>0){
		var newExplo = [];
		for(var i=0;i<toExplore.length;i++){
			if(!contains(explored,toExplore[i])){
			explored.push(toExplore[i]);
				if(!toExplore[i].areaLevel)
					toExplore[i].areaLevel = lev;
				for (var j=0;j<toExplore[i].nei.length;j++){
					//if(!toExplore[i].nei[j].areaLevel)
					//	toExplore[i].nei[j].areaLevel = toExplore[i].areaLevel+1;
					if(!contains(explored,toExplore[i].nei[j])&&!contains(newExplo,toExplore[i].nei[j]))
						newExplo.push(toExplore[i].nei[j]);
				}
			}	
			
		}
		lev+=1;
		toExplore = newExplo;
		//debug(toExplore.length);
	}
	for (var i=1;i<graph.length;i++)
		if(!graph[i].areaLevel)
			graph[i].areaLevel = Math.ceil(10*rand());
	debug(explored.length +'nodes visited');
	this.map.mesh = createMap(this.map.w,this.map.h,data,this.tileSize,this.paths);
	var grass = initTexture('data/text/grassC.jpg');
	var rock = initTexture('data/text/rockC.jpg');
	var snow = initTexture('data/text/snowC.jpg')
	var dirt = initTexture('data/text/dirtC.jpg')
	this.map.mesh.materials[0].textures.push(grass);
	this.map.mesh.materials[0].textures.push(rock);
	this.map.mesh.materials[0].textures.push(snow);
	this.map.mesh.materials[0].textures.push(dirt);
	this.map.sky = new Object3D(0,0,0,null);
	this.map.sky.mesh = createSky();
	return graph;
}

World.prototype.addObj = function(obj){
	this.grid[Math.floor(obj.x/(this.tileSize*this.gridSize))][Math.floor(obj.y/(this.tileSize*this.gridSize))].push(obj); 
}	

World.prototype.getH = function(x,y){
	if(this.map && x/this.tileSize<this.map.w && y/this.tileSize<this.map.h){
		var entX = Math.floor(x/this.tileSize);
		var entY = Math.floor(y/this.tileSize);
		var n;
		var h = this.map.h;
		var vertices = this.map.mesh.vertices;
		if (1.0-x/this.tileSize+entX > y/this.tileSize-entY)
			n = faceNorm(vertices,entX*h+entY,(entX+1)*h+entY,entX*h+entY+1);
		else
			n = faceNorm(vertices,(entX+1)*h+entY,entX*h+entY+1,(entX+1)*h+entY+1);
		var d = -n.x*vertices[3*(entX*h+entY+1)]-n.y*vertices[3*(entX*h+entY+1)+1]-n.z*vertices[3*(entX*h+entY+1)+2];
		//debug('d :'+d);
		var z = (-n.x*x-n.y*y-d)/n.z;
		return z;
	}else{
		//debug(x+','+y+' not in map');
		return 0.0;
	}
}

World.prototype.getNorm = function(x,y){
	if(this.map && x/this.tileSize<this.map.w && y/this.tileSize<this.map.h){
		var entX = Math.floor(x/this.tileSize);
		var entY = Math.floor(y/this.tileSize);
		var n;
		var h = this.map.h;
		var vertices = this.map.mesh.vertices;
		if (1.0-x/this.tileSize+entX > y/this.tileSize-entY)
			n = faceNorm(vertices,entX*h+entY,(entX+1)*h+entY,entX*h+entY+1);
		else
			n = faceNorm(vertices,(entX+1)*h+entY,entX*h+entY+1,(entX+1)*h+entY+1);
		return n;
	}else
		debug(x+','+y+' not in map');
}

World.prototype.removeObjectFromGrid = function(obj) {
	var xInd = Math.floor(obj.x/(this.tileSize*this.gridSize));
	var yInd = Math.floor(obj.y/(this.tileSize*this.gridSize));
	for(var i=0; i<this.grid[xInd][yInd].length; i++) {
		if(this.grid[xInd][yInd][i] == obj) {
			this.grid[xInd][yInd].splice(i, 1);
			break;
		}
	}
}

World.prototype.getObjNear = function(x,y,radius){
	var objs = [];
	var xInd = Math.floor(x/(this.tileSize*this.gridSize));
	var yInd = Math.floor(y/(this.tileSize*this.gridSize));
	for (var i=Math.max(0,xInd-radius);i<=Math.min(this.grid.length-1,xInd+radius);i++)
		for (var j=Math.max(0,yInd-radius);j<=Math.min(this.grid[i].length-1,yInd+radius);j++)
			for (var k=0;k<this.grid[i][j].length;k++)
				objs.push(this.grid[i][j][k]);
	if(world.player)	
		objs.push(world.player);
	return objs;
}

World.prototype.getCollisions = function(x,y,radius){
	var objs = this.getObjNear(x,y,1);
	var colList = [];
	for (var i=0;i<objs.length;i++)
		if (objs[i].collision && objs[i].collision.collide(x,y,radius))
			colList.push(objs[i]);
	return colList;
}

World.prototype.sortZ = function(){
	var newTab = [];
	while(this.objectsWithAlpha.length>0){
		var maxD = -1;
		var maxInd = -1;
		for (var i=0;i<this.objectsWithAlpha.length;i++){
			var d = dist(this.objectsWithAlpha[i],this.player);
			if (d>maxD){
				maxD = d;
				maxInd = i;
			}
		}
		newTab.push(this.objectsWithAlpha[maxInd]);
		this.objectsWithAlpha.splice(maxInd, 1);
	}
	this.objectsWithAlpha = newTab;
}

World.prototype.processEvents = function(){
	for (var i=0;i<this.events.length;i++){
		//if(this.events[i][0]=='dead')
			debug(this.events[i][1].modelName+' '+this.events[i][0]);
	}
	this.events = [];
}

World.prototype.draw = function(elapsed){
	if(this.player){
		mat4.rotate(mvMatrix, degToRad(-70), [1, 0, 0]);
		mat4.rotate(mvMatrix, degToRad(-this.player.orient), [0, 0, 1]);
		mat4.translate(mvMatrix,[-this.player.x, -this.player.y,  -this.player.z-2.0]);
	}
	if (this.map.sky && this.player){
		this.map.sky.x = this.player.x;
		this.map.sky.y = this.player.y;
		this.map.sky.z = this.getH(this.map.sky.x,this.map.sky.y);
		this.map.sky.draw();
		gl.clear(gl.DEPTH_BUFFER_BIT);
	}
	if (this.map.mesh)
		this.map.draw();
	if (!elapsed)
		elapsed = 0;
	if (this.player){
		if(this.player.currentHp>=0){
			$('#hp').html('HP : '+Math.ceil(10*this.player.currentHp)/10+'/'+Math.round(10*this.player.maxHp)/10);
			$('#sp').html('SP : '+Math.floor(10*this.player.currentSp)/10+'/'+Math.round(10*this.player.maxSp)/10);
			$('#mp').html('MP : '+Math.floor(10*this.player.currentMp)/10+'/'+Math.round(10*this.player.maxMp)/10);
			document.getElementById("imHp").width = (150*this.player.currentHp/this.player.maxHp);
			document.getElementById("imSp").width = (150*this.player.currentSp/this.player.maxSp);
			document.getElementById("imMp").width = (150*this.player.currentMp/this.player.maxMp);
		}
		var viewD = document.getElementById("viewDist").value;
		var objsNear = this.getObjNear(this.player.x,this.player.y,Math.round(viewD/100.0));

		for (var k=0;k<objsNear.length;k++){
			var d = dist(this.player,objsNear[k]);
			if (d<viewD && objsNear[k].draw){
				if (objsNear[k].animate)
					objsNear[k].animate(elapsed);
				if (objsNear[k]){
					var theta = -this.player.orient*Math.PI/180.0;
					var rx = Math.cos(theta)*(objsNear[k].x-this.player.x)-Math.sin(theta)*(objsNear[k].y-this.player.y);
					var ry = Math.sin(theta)*(objsNear[k].x-this.player.x)+Math.cos(theta)*(objsNear[k].y-this.player.y);
					if(ry>0 || d<-viewDist*2)
						if (objsNear[k].modelName && models[objsNear[k].modelName].transparent)
							this.objectsWithAlpha.push(objsNear[k]);
						else
							objsNear[k].draw();
				}
			}
		}

		gl.enable(gl.BLEND);
		//this.sortZ();
		for(var i=0;i<this.objectsWithAlpha.length;i++)
			this.objectsWithAlpha[i].draw();
		this.objectsWithAlpha = [];
		gl.disable(gl.DEPTH_TEST);
		gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
		var newPart = [];
		for (var i=0;i<this.particles.length;i++){
			var d = dist(this.player,this.particles[i].parent)
			if (d<viewD)
				this.particles[i].draw();
			this.particles[i].process(elapsed);
			if(this.particles[i].alive && this.particles[i].currentTime<this.particles[i].parts.duration)
				newPart.push(this.particles[i]);
			else
				this.particles[i].finalize();
			
		}
		//debug(this.particles.length+', '+newPart.length);
		this.particles = newPart;
		//debug(this.particles.length+', '+newPart.length);
		gl.enable(gl.DEPTH_TEST);
		gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
		gl.disable(gl.BLEND);
	}
}
