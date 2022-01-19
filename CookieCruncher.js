// This is an add-on
Game.Achievements['Third-party'].desc = 'Used the <b>add-on</b>: <b>Cookie Cruncher</b> by <b>Chibu</b>.<q>Om nom nom.</q>'
Game.Achievements['Third-party'].won = 1;

// Add the CSS
var cruncherVersion = /@(.*?)\//i.exec(document.currentScript.src)[1],
    cruncherCSS = document.createElement('link');
cruncherCSS.setAttribute('rel', 'stylesheet');
cruncherCSS.setAttribute('href', 'https://cdn.jsdelivr.net/gh/chibu/CookieCruncher@' + cruncherVersion + '/CookieCruncher.css');
document.head.appendChild(cruncherCSS);

document.getElementById('storeTitle').onmouseover=function() {
	Game.tooltip.dynamic=0;
	Game.tooltip.draw(this, function () {
		window.Buildings = [];
		Game.ObjectsById.forEach((building, index) => {
			if (!building.locked)
				Buildings.push({
					'icon': building.iconColumn,
					'price': Beautify(Math.round(building.price)),
					'canBuy':Game.cookies>=building.price,
					'name': building.name,
					'cost': building.price,
					'count': building.amount,
					'value': building.price/(building.storedCps*Game.globalCpsMult)
				})
		});
		Buildings.sort((a, b) => a.value - b.value);
		output = '<div style="padding:8px;min-width:300px;">';
		Buildings.forEach(building => {
			var time = (building.cost-Game.cookies)/Game.cookiesPs;
			output += ''+
			'<div class="icon" style="float:left;margin-left:-8px;margin-top:-8px;background-position:'+
				(-48*building.icon)+'px 0px;"></div>'+
			'<div style="float:right;text-align:right;font-weight:bold;color:#6f6;">'+
				'<small>+</small>' + Math.round(((building.value/Buildings[0].value)-1)*100) + '%<br>'+
				'<small>'+
					'<span class="price '+(building.canBuy?'':'disabled')+
						'" style="padding-top:3px">'+building.price+'</span>'+
				'</small>'+
			'</div>'+
			'<div class="name">' + building.name + '</div>'+
			'<small>[owned: '+building.count+'] '+(time>0?Math.floor(time/86400)+","+
				Math.floor(time%2586400/3600)+":"+Math.floor(time%253600/60)+':'+Math.floor(time%2560):'')+
			'</small>'+
			'<div class="line"></div>'
		});
		output += '<div style="font-weight:bold">per second: <span class="price">'+Beautify(Game.cookiesPs)+'</span>'+
					'<br>per minute: <span class="price">'+Beautify(Game.cookiesPs*60)+'</span>'+
					'<br>per 10 minutes: <span class="price">'+Beautify(Game.cookiesPs*600)+'</span>'+
					'<br>per 30 minutes: <span class="price">'+Beautify(Game.cookiesPs*1800)+'</span>'+
					'<br>per hour: <span class="price">'+Beautify(Game.cookiesPs*3600)+'</span>'+
					'<br>per day: <span class="price">'+Beautify(Game.cookiesPs*86400)+'</span>'+
				  '</div>';
		return output;
	},'store');
	Game.tooltip.wobble();
};
