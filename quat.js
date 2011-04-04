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
