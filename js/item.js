/* Javascript Item class
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

var numPower = {};
numPower['normal'] = "0";
numPower['magic'] = "1+Math.floor(rand()*2)";
numPower['rare'] = "3+Math.floor(rand()*2)";
numPower['epic'] = "5+Math.floor(rand()*2)";

var priceModif = {};
priceModif['normal'] = 1;
priceModif['magic'] = 2;
priceModif['rare'] = 4;
priceModif['epic'] = 8;

function Item(jsonItem,quality,itemLevel){
	if(jsonItem.modelName){
		//debug(jsonItem.modelName);
		var item = new Object3D(0,0,0,jsonItem.modelName);
	}else
		var item = new Object3D(0,0,0,null);
	item.name = jsonItem.name;
	item.type = jsonItem.type;
	item.requirements = jsonItem.requirements;
	if(item.type=='weapon'){
		item.damageType = jsonItem.damageType;
		item.damages = jsonItem.damages;
		item.damageRange = jsonItem.damageRange;
		item.range = jsonItem.range;
	}
	if(jsonItem.goldCost){
		item.goldCost = jsonItem.goldCost*priceModif[quality];
		item.description = jsonItem.description;
		item.icon = jsonItem.icon;
	}else
		item.goldCost = 0;
	if(jsonItem.stackable)
		item.stackable = jsonItem.stackable;
	item.id = item.name+(new Date().getTime());
	if(item.type == 'consumable'){
		item.quality = 'normal';
	}else{
		item.quality = quality;
	}
	item.level = jsonItem.level;
	//debug(item.name+' : '+item.level);
	item.powers = {};
	for (var i=0;i<eval(numPower[item.quality]);i++){
		var tmpPow = powers.list[Math.floor(rand()*powers.list.length)];
		if(item.powers[tmpPow.name]){
			//debug(tmpPow.name+' : '+item.powers[tmpPow.name].effect.value);
			item.powers[tmpPow.name].effect.value = Math.round(10*(eval(tmpPow.effect['value'])+item.powers[tmpPow.name].effect.value))/10;
		}else{
			var power = {};
			power.effect = {};
			for (var x in tmpPow.effect){
				if (x=='value')
					power.effect[x] = Math.round(10*eval(tmpPow.effect[x]))/10;
				else
					power.effect[x] = tmpPow.effect[x];
			}
			item.powers[tmpPow.name] = power;
		}
	}
	return item;
}

function getIcon(item){
	var ret = $('<div></div>').attr({'class':'item','id':item.id,'name':item.name,'style':'width:32;height:32;background-image:url(data/icons/'+item.icon+')'}).draggable({revert:'invalid',appendTo: 'body',helper: 'clone',start:function(){src = $(this).parent();}});
	ret.mouseover(function() {
	    $('#canvas3D').append(itemDescription(world.player.inventory[$(this).attr('id')]));
	  }).mouseout(function(){
	    $('.description').remove();
	  });
	if(item.stackable){
		ret.append('1');
		ret.attr({'count':1});
	}
	ret.addClass(item.type);
	if(items[item.name].type && items[item.name].type=='consumable'){
		ret.click(function(){
			var effect = items[$(this).attr('name')].effect;
			if(effect.recover)
				world.player.recover(effect.recover[0],effect.recover[1],effect.recover[2]);
			$(this).attr('count',eval($(this).attr('count'))-1);
			$(this).empty();
			$(this).append($(this).attr('count'));
			if($(this).attr('count')=='0'){
				$(this).remove();
				delete world.player.inventory[$(this).attr('id')];
			}
		});
	}
	return ret;
}

function itemDescription(item){
	setAptitudeVars(world.player);
	var descrip ='<div class="description" style=left:'+mouseX+';top:'+mouseY+';><font color="#';
	if(item.quality=='normal')
		descrip += 'FFFFFF';
	else if(item.quality=='magic')
		descrip += 'AAAAFF';
	else if(item.quality=='rare')
		descrip += 'AAFFAA';
	else if(item.quality=='epic')
		descrip += 'FFDDAA';
	descrip +='">'+ item.name+' ('+item.type+')</font><br>'+item.description+'<br>';
	if(item.type=='weapon')
		descrip += 'Damages ('+item.damageType+') : '+(item.damages-item.damages*item.damageRange)+'-'+(item.damages+item.damages*item.damageRange)+', range : '+item.range+'<br>';
	for (var x in item.powers){
		descrip += '+ '+item.powers[x].effect.value+' ';
		if (item.powers[x].effect.type == 'damage')
			descrip += item.powers[x].effect.damageType+ ' damage<br>';
		else if (item.powers[x].effect.type == 'bonus')
			descrip += item.powers[x].effect.aptitude+'<br>';
	}
	if (item.goldCost>0)
		descrip += '<font color="#EEEEAA">Price: '+item.goldCost+' gold.</font>';
	descrip += '</div>';
	return descrip;
}

function loot(level,qual){
	var itemNames = [];
	for (x in items)
		if (items[x].droppable && (!items[x].level || items[x].level <= level))
			itemNames.push(items[x].name);
	var quality;
	if (qual<0.01)
		quality = 'epic';
	else if (qual<0.05)
		quality = 'rare';
	else if (qual<0.2)
		quality = 'magic';
	else
		quality = 'normal';
	var it = new Item(items[itemNames[Math.floor(rand()*itemNames.length)]],quality,level);
	it.pickable = new ParticleEmiter(it,'itemdrop');
	world.particles.push(it.pickable);
	return it;
}
