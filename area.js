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
