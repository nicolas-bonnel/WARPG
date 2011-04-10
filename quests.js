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

var questGrammar = {};

questGrammar['<quest>'] = ['<knowledge>','<comfort>','<reputation>','<serenity>','<protection>','<conquest>','<wealth>','<ability>','<equipment>'];
questGrammar['<knowledge>'] = ['<get> <goto> give',/*'<spy>',*/'<goto> listen <goto> report','<get> <goto> use <goto> <give>'];
questGrammar['<comfort>'] = ['<get> <goto> <give>','<goto> damage <goto> report'];
questGrammar['<reputation>'] = ['<get> <goto> <give>', '<goto> <kill> <goto> report','<goto> <goto> report'];
questGrammar['<serenity>'] = ['<goto> damage','<get> <goto> use <goto> <give>',/*'<get> <goto> use capture <goto> <give>',*/'<goto> listen <goto> report','<goto> take <goto> give','<get> <goto> <give>','<goto> damage escort <goto> report'];
questGrammar['<protection>'] = ['<goto> damage <goto> report','<get> <goto> use','<goto> repair','<get> <goto> use','<goto> damage','<goto> repair','<goto> defend'];
questGrammar['<conquest>'] = ['<goto> damage','<goto> <steal> <goto> give'];
questGrammar['<wealth>'] = ['<goto> <get>','<goto> <steal>','repair'];
questGrammar['<ability>'] = ['repair use','<get> use','use','damage','use','<get> use','<get> experiment'];
questGrammar['<equipment>'] = ['repair','<get> <goto> <give>','<steal>','<goto> exchange'];


questGrammar['<subquest>'] = ['<goto>','<goto> <quest> <goto>'];
questGrammar['<goto>'] = ['','explore','<learn> goto'];
questGrammar['<learn>'] = ['','<goto> <subquest> listen','<goto> <get> read','<get> <subquest> give listen'];
questGrammar['<get>'] = ['','<steal>','<goto> gather','<goto> <get> <goto> <subquest> exchange'];
questGrammar['<steal>'] = [/*'<goto> stealth take',*/'<goto> <kill> take'];
//questGrammar['<spy>'] = ['<goto> spy <goto> report'];
//questGrammar['<capture>'] = ['<get> <goto> capture'];
questGrammar['<kill>'] = ['<goto> kill'];

function expandQuest(quest){
	var newQuest = '';
	var spli = quest.split(' ');
	for (var i=0;i<spli.length;i++){
		var rule = questGrammar[spli[i]];
		if(rule)
			newQuest += rule[Math.floor(rand()*rule.length)];
		else
			newQuest += spli[i];
		if(i<spli.length-1)
			newQuest += ' ';
	}
}

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
