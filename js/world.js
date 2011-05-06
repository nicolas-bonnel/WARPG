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
