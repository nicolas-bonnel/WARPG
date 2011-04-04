/* Javascript md5 loader
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

function parseMesh(data){
	//alert("Parsing file");
	//debug("Parsing md5 file");
	var pos = data.indexOf('numJoints');
	var numJoints = parseInt(data.substring(pos+10,data.indexOf('\n',pos)));
	pos = data.indexOf('numMeshes',pos);
	var numMeshes = parseInt(data.substring(pos+10,data.indexOf('\n',pos)));
	//debug('Number of joints : '+numJoints+', number of meshes : '+numMeshes);
	
	var joints = data.substring(data.indexOf('joints',pos),data.indexOf('}',pos)).split('\n');
	var bones = [];
	for (var i=0;i<numJoints;i++){
		var line = joints[i+1];
		var bone = new Object();
		bone.nam = line.substring(line.indexOf('"')+1,line.lastIndexOf('"'));
		bone.parent = bones[parseInt(line.substring(line.lastIndexOf('"')+1,line.indexOf('(')-1))];
		var pos = line.substring(line.indexOf('(')+2,line.indexOf(')')).split(' ');
		bone.x = parseFloat(pos[0]);
		bone.y = parseFloat(pos[1]);
		bone.z = parseFloat(pos[2]);
		var orient = line.substring(line.lastIndexOf('(')+2,line.lastIndexOf(')')).split(' ');
		bone.orient = new Quat(parseFloat(orient[0]),parseFloat(orient[1]),parseFloat(orient[2]));
		bones.push(bone);
	}
	
	var mesh = new Mesh('anim');
	mesh.bones = bones;
	var vOffset = 0;
	for (var k=0;k<numMeshes;k++){
		pos = data.indexOf('shader',pos)+8;
		var textName = data.substring(pos,data.indexOf('"',pos));

		pos = data.indexOf('numverts',pos);
		var numVert = parseInt(data.substring(pos+9,data.indexOf('\n',pos)));
		var verts = data.substring(data.indexOf('vert 0',pos),data.indexOf('numtris',pos)).split('\n');

		pos = data.indexOf('numtris',pos);
		var numTri = parseInt(data.substring(pos+8,data.indexOf('\n',pos)));
		var tris = data.substring(data.indexOf('tri 0',pos),data.indexOf('numweights',pos)).split('\n');
	
		pos = data.indexOf('numweights',pos);
		var numWeight = parseInt(data.substring(pos+11,data.indexOf('\n',pos)));
		var weights = data.substring(data.indexOf('weight 0',pos)).split('\n');

		mesh.materials.push(new Object());
		mesh.materials[k].faces = [];
		mesh.materials[k].textures = [];
		if (textName.length>3)
			mesh.materials[k].textures.push(initTexture('data/text/'+textName));


		mesh.weight1 = [];
		mesh.weight2 = [];
		mesh.weightBlend = [];	
		var normals = [];
		for (var i=0;i<numVert;i++){
			var wCount = verts[i].substring(verts[i].indexOf('(')+2).split(' ');
			var wInd = parseInt(wCount[3]);
			mesh.textures.push(parseFloat(wCount[0]));
			mesh.textures.push(parseFloat(wCount[1]));
			wCount = parseInt(wCount[4]);
			var x = 0.0;
			var y = 0.0;
			var z = 0.0;
			for (var j=wInd;j<wInd+wCount;j++){
				var spli = weights[j].split(' ');
				var bone = bones[parseInt(spli[2])];
				var bias = parseFloat(spli[3]);
				var q = bone.orient.rot(parseFloat(spli[5]),parseFloat(spli[6]),parseFloat(spli[7]));
				x += (bone.x+q.x)*bias;
				y += (bone.y+q.y)*bias;
				z += (bone.z+q.z)*bias;
			}
			var spli = weights[wInd].split(' ');
			mesh.weight1.push(parseFloat(spli[5]));
			mesh.weight1.push(parseFloat(spli[6]));
			mesh.weight1.push(parseFloat(spli[7]));
			mesh.weight1.push(parseFloat(spli[2]));
			mesh.weightBlend.push(parseFloat(spli[3]));
			if(wCount>1){
				spli = weights[wInd+1].split(' ');
				mesh.weight2.push(parseFloat(spli[5]));
				mesh.weight2.push(parseFloat(spli[6]));
				mesh.weight2.push(parseFloat(spli[7]));
				mesh.weight2.push(parseFloat(spli[2]));
				mesh.weightBlend.push(1.0-mesh.weightBlend[mesh.weightBlend.length-1]);
			}else{
				mesh.weight2.push(0.0);
				mesh.weight2.push(0.0);
				mesh.weight2.push(0.0);
				mesh.weight2.push(0.0);
				mesh.weightBlend.push(0.0);
			}
			mesh.vertices.push(x);
			mesh.vertices.push(y);
			mesh.vertices.push(z);
			normals.push([]);
		}
		for (var i=0;i<numTri;i++){
			//debug(i);
			var spli = tris[i].split(' ');
			var s1 = parseInt(spli[2])+vOffset;
			var s2 = parseInt(spli[3])+vOffset;
			var s3 = parseInt(spli[4])+vOffset;
			mesh.materials[k].faces.push(s1);
			mesh.materials[k].faces.push(s2);
			mesh.materials[k].faces.push(s3);
			var v1 = new Object();
			var v2 = new Object();
			v1.x = mesh.vertices[s1*3]-mesh.vertices[s2*3];
			v1.y = mesh.vertices[s1*3+1]-mesh.vertices[s2*3+1];
			v1.z = mesh.vertices[s1*3+2]-mesh.vertices[s2*3+2];
			v2.x = mesh.vertices[s1*3]-mesh.vertices[s3*3];
			v2.y = mesh.vertices[s1*3+1]-mesh.vertices[s3*3+1];
			v2.z = mesh.vertices[s1*3+2]-mesh.vertices[s3*3+2];

			var n = new Object();
			n.x = v1.y*v2.z-v1.z*v2.y;
			n.y = v1.z*v2.x-v1.x*v2.z;
			n.z = v1.x*v2.y-v1.y*v2.x;
			var norm = Math.sqrt(n.x*n.x+n.y*n.y+n.z*n.z);
			n.x /= norm;
			n.y /= norm;
			n.z /= norm;
			normals[s1-vOffset].push(n);
			normals[s2-vOffset].push(n);
			normals[s3-vOffset].push(n);
		}
		for (var i=0;i<numVert;i++){
			var nx = 0.0;
			var ny = 0.0;
			var nz = 0.0;
			for (j=0;j<normals[i].length;j++){
				nx += normals[i][j].x;
				ny += normals[i][j].y;
				nz += normals[i][j].z;
			}
			var norm = Math.sqrt(nx*nx+ny*ny+nz*nz);
			nx /= norm;
			ny /= norm;
			nz /= norm;
			mesh.normals.push(nx);
			mesh.normals.push(ny);
			mesh.normals.push(nz);
		}
		vOffset += numVert;
	}
	mesh.initShaders();
	mesh.initBuffers();
	if (mesh.materials[0].textures.length>0)
		gl.uniform1i(mesh.shaderProgram.useTexturesUniform, true);
	return mesh;
};


function parseAnim(data,fileName){
	//debug('Parsing animation');
	var pos = data.indexOf('numFrames');
	var numFrames = parseInt(data.substring(pos+10,data.indexOf('\n',pos)));
	pos = data.indexOf('numJoints',pos);
	var numJoints = parseInt(data.substring(pos+10,data.indexOf('\n',pos)));
	pos = data.indexOf('frameRate');
	var frameRate = parseInt(data.substring(pos+10,data.indexOf('\n',pos)));
	pos = data.indexOf('numAnimatedComponents',pos);
	var numAnimatedComponents = parseInt(data.substring(pos+22,data.indexOf('\n',pos)));
	//debug('Number of frames : '+numFrames+', number of joints : '+numJoints+', framerate : '+frameRate+', number of animated compopnents : '+numAnimatedComponents);
	
	var joints = data.substring(data.indexOf('hierarchy',pos),data.indexOf('}',pos)).split('\n');
	var bones = [];
	for (var i=0;i<numJoints;i++){
		var line = joints[i+1];
		var bone = new Object();
		bone.nam = line.substring(line.indexOf('"')+1,line.lastIndexOf('"'));
		var spli = line.split('\t');
		spli = spli[2].split(' ');		
		bone.parentNum = parseInt(spli[0]);
		bone.parent = bones[bone.parentNum];
		bone.flag = parseInt(spli[1]);
		bone.startIndex = parseInt(spli[2]);
		bones.push(bone);
	}
	/*var idem = (bones.length == object.mesh.bones.length);
	for (i=0;idem && i<numJoints;i++){
		idem = idem && (bones[i].nam == object.mesh.bones[i].nam);
		if (bones[i].parent && object.mesh.bones[i].parent)
			idem = idem && (bones[i].parent.nam == object.mesh.bones[i].parent.nam);
	}
	debug('Animation OK with skeleton ? '+idem);*/
	var boneAnim = [];
	for (var i=0;i<numFrames;i++){
		var frame = new Object();
		frame.bonePos = [];
		frame.boneOrient = [];
		pos = data.indexOf('frame '+i,pos);
		var lines = data.substring(pos,data.indexOf('}',pos)).split('\n');
		for (var j=0;j<numJoints;j++){
			var spli = lines[j+1].split(' ');
			var x = parseFloat(spli[0]);
			var y = parseFloat(spli[1]);
			var z = parseFloat(spli[2]);
			var q = new Quat(parseFloat(spli[3]),parseFloat(spli[4]),parseFloat(spli[5]));
			if (bones[j].parentNum>=0){
				var pq = new Quat(frame.boneOrient[bones[j].parentNum*4],frame.boneOrient[bones[j].parentNum*4+1],frame.boneOrient[bones[j].parentNum*4+2]);
				pq.w = frame.boneOrient[bones[j].parentNum*4+3];
				var cq = pq.rot(x,y,z);
				x = cq.x+frame.bonePos[bones[j].parentNum*3];
				y = cq.y+frame.bonePos[bones[j].parentNum*3+1];
				z = cq.z+frame.bonePos[bones[j].parentNum*3+2];
				q = pq.mul(q);
				q.normalize();
			}
			frame.bonePos.push(x);
			frame.bonePos.push(y);
			frame.bonePos.push(z);
			frame.boneOrient.push(q.x);
			frame.boneOrient.push(q.y);
			frame.boneOrient.push(q.z);				
			frame.boneOrient.push(q.w);
		}
		boneAnim.push(frame);
	}
	//debug(boneAnim.length +' frames');
	if(animations[fileName]['walkF'])
		for(var i=animations[fileName]['walkF'].lastFrame;i>=animations[fileName]['walkF'].firstFrame;i--)
			boneAnim.push(boneAnim[i]);
	return boneAnim; 
};

function createMap(w,h,map,tileSize,paths){
	var mesh = new Mesh('terrain');
	mesh.materials.push(new Object());
	mesh.materials[0].faces = [];
	mesh.materials[0].textures = [];
	var normals = [];	
	for (var i=0;i<w;i++)
		for (var j=0;j<h;j++){
			mesh.vertices.push(i*tileSize);
			mesh.vertices.push(j*tileSize);
			//var hei = Math.random()*2-2;
			/*if (i==0 || j==0 || i == w-1 || j == h-1)
				hei = 3.0;*/
			//map.push();
			mesh.vertices.push(map[i*h+j]);
			mesh.textures.push(i*1.0);
			mesh.textures.push(j*1.0);
			mesh.textures.push(paths[i*h+j]);
			normals.push([]);
		}

	
	for (var i=0;i<w-1;i++)
		for (var j=0;j<h-1;j++){
			mesh.materials[0].faces.push(j*h+i);
			mesh.materials[0].faces.push(j*h+i+1);
			mesh.materials[0].faces.push((j+1)*h+i);
			var n = faceNorm(mesh.vertices,j*h+i,j*h+i+1,(j+1)*h+i);
			normals[j*h+i].push(n);
			normals[j*h+i+1].push(n);
			normals[(j+1)*h+i].push(n);

			mesh.materials[0].faces.push(j*h+i+1);
			mesh.materials[0].faces.push((j+1)*h+i);
			mesh.materials[0].faces.push((j+1)*h+i+1);
			n = faceNorm(mesh.vertices,j*h+i,j*h+i+1,(j+1)*h+i);
			normals[j*h+i+1].push(n);
			normals[(j+1)*h+i].push(n);
			normals[(j+1)*h+i+1].push(n);
		}
	for (var i=0;i<w;i++)
		for (var j=0;j<h;j++){
			var n = new Object();
			n.x = 0.0;
			n.y = 0.0;
			n.z = 0.0;
			for (k=0;k<normals[i*h+j].length;k++){
				n.x += normals[i*h+j][k].x;
				n.y += normals[i*h+j][k].y;
				n.z += normals[i*h+j][k].z;
			}
			n.x /= normals[i*h+j].length;
			n.y /= normals[i*h+j].length;
			n.z /= normals[i*h+j].length;
			var norm = Math.sqrt(n.x*n.x+n.y*n.y+n.z*n.z);
			mesh.normals.push(n.x / norm);
			mesh.normals.push(n.y / norm);
			mesh.normals.push(n.z / norm);
		}
			
	mesh.initShaders();
	mesh.initBuffers();
	gl.uniform1i(mesh.shaderProgram.useTexturesUniform, true);
	return mesh;
}



function loadTextures(mesh,data,dir){
	spli = data.split('\n');
	var textDic = {};
	var matName;
	for (var i=0;i<spli.length;i++){
		var line = spli[i].split(' ');
		if (line[0]=='newmtl')
			matName = line[1];
		if(line[0]=='map_Kd'&& !textDic[matName]){
			textDic[matName] = initTexture(dir+line[1]);
		}
	}
	mats = [];
	for (var i=0;i<mesh.materials.length;i++)
		if(textDic[mesh.materials[i].matName]){
			mesh.materials[i].textures.push(textDic[mesh.materials[i].matName]);
			mats.push(mesh.materials[i]);
		}
	mesh.materials = mats;
	//debug(data);

}

function parseObj(data,dir,recenter){
	//debug('Parsing obj file in '+dir);
	var spli = data.split('\n');
	var mesh = new Mesh('static');
	var normals = [];
	var vertices = [];
	var vertDic = {};
	var textures = [];
	var maxX = -100000;
	var maxY = -100000;
	var minX = 100000;
	var minY = 100000;
	var minZ = 10000000.0;
	var reqMat = new XMLHttpRequest();
	reqMat.onreadystatechange = function() { 
		if(reqMat.readyState == 4){
			if (reqMat.responseText.length>0){
				loadTextures(mesh,reqMat.responseText,dir);
			} 
		}
	}
	for (var i=0;i<spli.length;i++){
		var toks = spli[i].split(' ');
		if (toks[0]=='v'){
			var val = parseFloat(toks[1]);
			vertices.push(val);
			minX=Math.min(minX,val);
			maxX=Math.max(maxX,val);
			val = parseFloat(toks[3]);
			vertices.push(val);
			minY=Math.min(minY,val);
			maxY=Math.max(maxY,val);
			val = parseFloat(toks[2]);
			vertices.push(val);
			minZ = Math.min(val,minZ);
		}else if(toks[0]=='vt'){
			textures.push(parseFloat(toks[1]));
			textures.push(parseFloat(toks[2]));
		}else if(toks[0]=='f'){
			for (j=1;j<4;j++){
				if (!(toks[j] in vertDic)){
					var toks2 = toks[j].split('/');
					mesh.vertices.push(vertices[3*parseInt(toks2[0])-3]);
					mesh.vertices.push(vertices[3*parseInt(toks2[0])-2]);
					mesh.vertices.push(vertices[3*parseInt(toks2[0])-1]);
					normals.push([]);
					for (k=0;k<2;k++)
						mesh.textures.push(textures[2*parseInt(toks2[1])+k-2]);
					vertDic[toks[j]] = mesh.vertices.length/3-1;
				}
				mesh.materials[mesh.materials.length-1].faces.push(vertDic[toks[j]]);
				// TODO compute normals here
			}
		}else if (toks[0]=='mtllib'){
			reqMat.open('GET', dir+toks[1], true);
		}else if (toks[0]=='usemtl'){
			mesh.materials.push(new Object());
			var mat = mesh.materials[mesh.materials.length-1];
			mat.textures = [];
			mat.faces = [];
			mat.matName = toks[1];
		}
	}
	if (recenter){
		//debug('recentering : '+(minX+maxX)/2.0+','+(minY+maxY)/2.0);
		for (var i=0;i<mesh.vertices.length/3;i++){
			mesh.vertices[3*i] -= (minX+maxX)/2.0;
			mesh.vertices[3*i+1] -= (minY+maxY)/2.0;
			mesh.vertices[3*i+2] -= minZ;
		}
	}
	reqMat.send(null);
	/*debug(vertices.length/3+' vertices found');
	debug(mesh.vertices.length/3+' vertices loaded');
	debug(textures.length/2+' textures found');
	debug(mesh.textures.length/2+' textures loaded');
	debug(mesh.materials.length+' materials loaded');*/
	for (var k=0;k<mesh.materials.length;k++){
		//debug(mesh.materials[k].faces.length/3+' faces in this material');
		for (var i=0;i<mesh.materials[k].faces.length/3;i++){
			//for (j=0;j<3;j++){
				var v1 = new Object();
				var v2 = new Object();
				var s1 = mesh.materials[k].faces[i*3];
				var s2 = mesh.materials[k].faces[i*3+1];
				var s3 = mesh.materials[k].faces[i*3+2];
				v1.x = mesh.vertices[s1*3]-mesh.vertices[s2*3];
				v1.y = mesh.vertices[s1*3+1]-mesh.vertices[s2*3+1];
				v1.z = mesh.vertices[s1*3+2]-mesh.vertices[s2*3+2];
				v2.x = mesh.vertices[s1*3]-mesh.vertices[s3*3];
				v2.y = mesh.vertices[s1*3+1]-mesh.vertices[s3*3+1];
				v2.z = mesh.vertices[s1*3+2]-mesh.vertices[s3*3+2];
				//debug(v1.x+','+v1.y+','+v1.z+'/'+v2.x+','+v2.y+','+v2.z);
				var n = new Object();
				n.x = v1.y*v2.z-v1.z*v2.y;
				n.y = v1.z*v2.x-v1.x*v2.z;
				n.z = v1.x*v2.y-v1.y*v2.x;
				var norm = Math.sqrt(n.x*n.x+n.y*n.y+n.z*n.z);
				n.x /= norm;
				n.y /= norm;
				n.z /= norm;
				normals[s1].push(n);
				normals[s2].push(n);
				normals[s3].push(n);
				//debug(s1+','+s2+','+s3+'/'+n.x+','+n.y+','+n.z);
			//}
		}
	}
	for (var i=0;i<mesh.vertices.length/3;i++){
		var nx = 0.0;
		var ny = 0.0;
		var nz = 0.0;
		for (var j=0;j<normals[i].length;j++){
			nx += normals[i][j].x;
			ny += normals[i][j].y;
			nz += normals[i][j].z;
		}
		var norm = Math.sqrt(nx*nx+ny*ny+nz*nz);
		nx /= norm;
		ny /= norm;
		nz /= norm;
		mesh.normals.push(nx);
		mesh.normals.push(ny);
		mesh.normals.push(nz);
	}
	//debug(mesh.normals.length/3+' normals loaded');
	mesh.initShaders();
	mesh.initBuffers();
	gl.uniform1i(mesh.shaderProgram.useTexturesUniform, true);
	return mesh;
}

function createSky(){
	var sky = new Mesh('static');
	for (var i=0;i<4;i++){
		sky.materials.push(new Object());
		sky.materials[i].textures = [];
		sky.materials[i].faces = [4*i+0,4*i+1,4*i+2,4*i+1,4*i+2,4*i+3];
	}
	sky.materials[0].textures.push(initTexture('data/text/clouds1_north.jpg'));
	sky.materials[1].textures.push(initTexture('data/text/clouds1_south.jpg'));
	sky.materials[2].textures.push(initTexture('data/text/clouds1_east.jpg'));
	sky.materials[3].textures.push(initTexture('data/text/clouds1_west.jpg'));
	var s = 50.0;
	sky.vertices = [s,s,s,  -s, s,s,  s,s,-s, -s,s,-s, // north
			s,-s,s,  -s, -s,s,  s,-s,-s, -s,-s,-s, // south
			s,s,s,  s, -s,s,  s,s,-s, s,-s,-s, // east
			-s,s,s,  -s, -s,s,  -s,s,-s, -s,-s,-s]; //west
	sky.textures = [1.0,1.0,0.0,1.0,1.0,0.0,0.0,0.0,
			0.0,1.0,1.0,1.0,0.0,0.0,1.0,0.0,
			0.0,1.0,1.0,1.0,0.0,0.0,1.0,0.0,
			1.0,1.0,0.0,1.0,1.0,0.0,0.0,0.0];
	sky.normals = [0.0,0.0,-1.0,0.0,0.0,-1.0,0.0,0.0,-1.0,0.0,0.0,-1.0,0.0,
			0.0,-1.0,0.0,0.0,-1.0,0.0,0.0,-1.0,0.0,0.0,-1.0,0.0,
			0.0,-1.0,0.0,0.0,-1.0,0.0,0.0,-1.0,0.0,0.0,-1.0,0.0,
			0.0,-1.0,0.0,0.0,-1.0,0.0,0.0,-1.0,0.0,0.0,-1.0];
	sky.materials[0].faces = [0,1,2,1,2,3];
	sky.initShaders();
	sky.initBuffers();
	gl.uniform1i(sky.shaderProgram.useTexturesUniform, true);
	return sky;
}

function createHealthCircle(){
	var hc = new Mesh('health');
	hc.materials.push(new Object());
	hc.materials[0].textures = [];
	hc.materials[0].textures.push(initTexture('data/text/circleHealth.png'));
	hc.vertices = [-1.0,-1.0,0.1,-1.0,1.0,0.1,1.0,-1.0,0.1,1.0,1.0,0.1];
	hc.textures = [0.0,0.0,0.0,1.0,1.0,0.0,1.0,1.0];
	hc.normals = [0.0,0.0,-1.0,0.0,0.0,-1.0,0.0,0.0,-1.0,0.0,0.0,-1.0];
	hc.materials[0].faces = [0,1,2,1,2,3];
	hc.initShaders();
	hc.initBuffers();
	gl.uniform1i(hc.shaderProgram.useTexturesUniform, true);
	return hc;
}
