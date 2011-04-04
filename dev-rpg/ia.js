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
					this.parent.setAction(skills['Melee attack']);
				else
					this.parent.setAction(skills['idle']);
			}
		}
	}
}
