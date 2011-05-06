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
		if (world.player.equipment['weapon'].item)
  			world.player.setAction(skills['Melee attack']);//attack
		else
			world.player.setAction(skills['Punch']);//attack

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

