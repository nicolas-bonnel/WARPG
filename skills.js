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
			this.lifeEffects.push(new ParticleEmiter(parent,skill.lifeEffects[i].particle));
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
	var minDmg = 0.0;
	var maxDmg = 0.0;
	for (var i=0;i<world.player.currentDamages.length;i++){
		var dam = world.player.currentDamages[i].value*eval(skills[sk].damagesModifier);
		minDmg += dam - dam*eval(world.player.currentDamages[i].range);
		maxDmg += dam + dam*eval(world.player.currentDamages[i].range);
	}
	if (skills[sk].damages)
		for (var i=0;i<skills[sk].damages.length;i++){
			var dam = eval(skills[sk].damages[i].value);
			minDmg += dam - dam*eval(skills[sk].damages[i].range);
			maxDmg += dam + dam*eval(skills[sk].damages[i].range);
		}
	if (minDmg>0)
		descrip += ' Damages: '+Math.round(minDmg*100)/100+'-'+Math.round(maxDmg*100)/100;
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
