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
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
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

function State(goal,target){
	this.goal = goal;
	this.target = target;
}

State.prototype.process = funtion(goal, target){
	if (this.goal==goal)
		if (this.goal=='talk'){
			return (this.target==target);
		}else if (this.goal=='kill'){
			if (this.target.currentHp<=0.0)
				return true;
		}else if(this.goal=='collect'){
			this.target.name==target.name)
		}
	return false;
}

function Quest(states){
	this.currentState = 0;
	this.states = states;	

}
