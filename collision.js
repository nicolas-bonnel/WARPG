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
