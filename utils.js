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

var melee = 1;
var cast = 1;
var fire = 1;
var air = 1;
var water = 1;
var slash = 1;

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
	melee = creature.melee.level;
	cast = creature.cast.level;
	fire = creature.fire.level;
	air = creature.air.level;
	water = creature.water.level;
	slash = creature.slash.level;
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

var DEBUG = true;

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

function clearConsole(){
	console = document.getElementById("console");
	while(console.hasChildNodes())
		console.removeChild(console.firstChild);
}


function closeTab(tabName){
	document.getElementById(tabName).style.visibility = 'hidden';
}

/*
function dragStart(event) {
        event.dataTransfer.effectAllowed = 'copy';
        event.dataTransfer.setData("Text", event.target.getAttribute('id'));
	return true;
}

function dragOver(event) {
	if (event.preventDefault)
		event.preventDefault(); // allows us to drop
  	event.dataTransfer.dropEffect = 'copy';
	return false;
}

function drop(event) {
	var element = event.dataTransfer.getData("Text");
	event.target.appendChild(document.getElementById(element));
	event.stopPropagation();
	return false;
}*/

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
				models[modelName].mesh = parseObj(reqMesh.responseText, '../data/obj/'+modelName+'/',recenter);
			}
	}
	reqMesh.send(null);
}
