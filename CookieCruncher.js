Audio=function(src){
  this.play=function(){}
};
var _toggle = function(e) { e.classList.toggle('enabled'); e.classList.toggle('disabled'); return e.classList.contains('enabled') }
var CookieCruncher = {
  settings: {
    //volume: 50,
    autoClick: {
      count: 20,
      perSecond: 20,
      on: 0
    },
    goldenClick: {
      on: 0
    },
    wrinklerClick: {
      on: 0,
      sucked: 0
    },
    getFortunes: {
      on: 0
    },
    autoHarvest: {
      on: 0,
      mature: 0
    },
    autoCast: {
      on: 0,
      id: 1
    }
  },
  init: function(){
    /* Add the CSS */
    var cruncherCSS = document.createElement('link');
    cruncherCSS.setAttribute('rel', 'stylesheet');
    cruncherCSS.setAttribute('href', document.currentScript.src.replace('/CookieCruncher.js', '/CookieCruncher.css'));
    document.head.appendChild(cruncherCSS);

    /* Playing sounds too fast causes errors */
    //this.settings.volume = Game.volume;
    Game.setVolume(0);

    this.buildUI();

    // Game.registerHook('reincarnate',function(){Game.mods['test mod'].addIntro();});
    // Game.registerHook('check',function(){if (!Game.playerIntro){Game.mods['test mod'].addIntro();}});
    // Game.registerHook('click',function(){Game.Notify(choose(['A good click.','A solid click.','A mediocre click.','An excellent click!']),'',0,0.5);});
    // Game.registerHook('cps',function(cps){return cps*2;});
    Game.registerHook('check', this.updateUI);
  },

  save: function(){
    Object.entries(CookieCruncher.clickers).forEach(([name, clicker]) => {
      CookieCruncher.settings[name] = clicker.settings;
    });
    return JSON.stringify(CookieCruncher.settings)
  },

  load: function(str){
    var data = JSON.parse(str);

    Object.entries(data).forEach(([name, entry]) => {
      if (entry instanceof Object) Object.entries(entry).forEach(([name2, value]) => {
        CookieCruncher.settings[name][name2] = value;
      });
      else CookieCruncher.settings[name] = entry;
    });

    Object.entries(CookieCruncher.clickers).forEach(([name, clicker]) => {
      clicker.settings = CookieCruncher.settings[name];
      if (clicker.settings.on) clicker.element.click();
    });
  },

  clickers: {
    autoClick: {
      interval: function() { return Math.ceil(1000 / this.settings.perSecond) },
      title: () => 'Auto-click Cookie',
      description: function() {
                      return 'Click the big cookie '+(this.settings.count * this.settings.perSecond)+' times per second.'
                   },
      isActive: () => true,
      action: function() {
        var me = CookieCruncher.clickers.autoClick;
        if(!me.clicking) {
          me.clicking = true;
          for(var i = 0; i < me.settings.count; i++) {
            Game.ClickCookie();
            Game.lastClick = 0;
          }
          me.clicking = false;
        }
      }
    },
    goldenClick: {
      interval: () => 50,
      title: () => 'Golden Cookies',
      description: () => 'Click all of the golden cookies as soon as they show up',
      isActive: () => true,
      action: function() {
        if (shimmers.firstChild) shimmers.firstChild.click()
      }
    },
    wrinklerClick: {
      interval: () => 1000,
      title: () => 'Kill Wrinklers',
      description: () => 'Kill all the wrinklers as they get to the cookie',
      isActive: () => true,
      action: function() {
        var me = CookieCruncher.clickers.wrinklerClick
        Game.wrinklers.forEach((wrinkler, i) => {
          if (wrinkler.close && wrinkler.sucked >= me.settings.sucked)
            wrinkler.hp = 0;
        });
      }
    },
    getFortunes: {
      interval: () => 0,
      title: () => 'Fortune Cookies',
      description: () => 'Rotate through the news feed until a furtune comes up.',
      isActive: () => Game.UpgradesById[643].bought,
      action: function() {
        var timeout = 5,
            me = CookieCruncher.clickers.getFortunes;
        Game.getNewTicker();
        me.count ? me.count++ : (me.count = 1);
        if (commentsText.firstChild.className) {
          timeout = 5000;
          me.count = 0;
        }
        if (me.count < 200)
          me.timer=setTimeout(me.action, timeout)
        else {
          _toggle(me.element);
          me.settings.on = false;
          me.count = 0;
        }

      }
    },
    autoHarvest: {
      interval: () => 5000,
      title: () => 'Auto Harvest',
      description: () => 'Harvest and replant crops. Plant your crops and they will be replanted when mature.<br><small>Farm minigame must be unlocked</small>',
      isActive: () => Game.Objects['Farm'].minigameLoaded,
      action: function() {
        var me = CookieCruncher.clickers.autoHarvest;
        if (!Game.Objects['Farm'].minigameLoaded) return false;

        var M = Game.Objects["Farm"].minigame
        M.plot.forEach(function(arr,y) {
          arr.forEach(function(tile, x) {
            // if there's a plant
            if (tile[0]>=1) {
              var id = tile[0]-1;
              var plant = M.plantsById[id];
              if (me.settings.mature && tile[1] > plant.mature) {
                M.harvest(x, y ,1);
                M.useTool(id, x, y);
              }
              /* TODO: check to see if this works */
              /* average lifespan: Math.ceil((100/((me.ageTick+me.ageTickR/2)))*(1)) */
              else if (Math.ceil((100/(M.plotBoost[y][x][0]*(plant.ageTick+plant.ageTickR/2)))*((100-tile[1])/100))==1) {
                M.harvest(x, y ,1);
                M.useTool(id, x, y);
              }
            }
          })
        })
      },
    },
    autoCast: {
      interval: () => 1000,
      title: () => 'Auto Cast',
      description: () => 'Cast a spell whenever mana is full<br><small>Wizard Tower minigame must be unlocked</small>',
      isActive: () => Game.Objects['Wizard tower'].minigameLoaded,
      action: function() {
        var me = CookieCruncher.clickers.autoCast;
        if (!Game.Objects['Wizard tower'].minigameLoaded) return false;

        var M = Game.Objects['Wizard tower'].minigame;
        if (M.magic == M.magicM) {
          M.castSpell(M.spellsById[me.settings.id])
        }
      },
    }
  },

  clickerEvents: {
    mouseover: function() {
      Game.setOnCrate(this);
      Game.tooltip.dynamic=0;
      Game.tooltip.draw(this,
        '<div class="prompt cc-prompt"><h3>'+this.clicker.title()+'</h3><div class="line"></div>'+this.clicker.description()+'</div>',
        'left');
      Game.tooltip.wobble();
    },
    mouseout: function() {
      Game.setOnCrate(0);
      Game.tooltip.shouldHide=1;
    },
    click: function() { _toggle(this) ? this.clicker.start() : this.clicker.stop() },
  },

  buildings: [],
  /* TODO: use .bulkPrice if Game.buyBulk */
  bestDeals: function() {
  	Game.tooltip.dynamic=0;
  	Game.tooltip.draw(this, function () {
  		CookieCruncher.buildings = [];
  		Game.ObjectsById.forEach((building, index) => {
  			if (!building.locked)
  				CookieCruncher.buildings.push({
  					'icon': building.iconColumn,
  					'price': building.bulkPrice,
  					'canBuy':Game.cookies>=building.bulkPrice,
  					'name': building.name,
  					'count': building.amount,
  					'value': building.bulkPrice/(building.storedCps*Game.globalCpsMult*Game.buyBulk)
  				});

  		});
  		CookieCruncher.buildings.sort((a, b) => a.value - b.value);
  		output = '<div class="store-tooltip">';
  		CookieCruncher.buildings.forEach(building => {
  			var time = (building.price-Game.cookies)/Game.cookiesPs;
        var value = Math.round(((building.value/CookieCruncher.buildings[0].value)-1)*100);
  			output += `
    			<div class="icon" style="background-position:${(-48*building.icon)}px 0px;"></div>
    			<div class="prices">
    				${(value > 0 ? '<small>+</small>' + Beautify(value) + '%<br>' : '<br>')}
    				<small>
    					<span class="price ${(building.canBuy?'':'disabled')}" style="padding-top:3px">${Beautify(Math.round(building.price))}</span>
    				</small>
    			</div>
    			<div class="name">${building.name}</div>
    			<small>
            [owned: ${building.count}]
            ${(time > 0 ? `${Math.floor(time/86400)}, ${Math.floor(time%2586400/3600)}:${+Math.floor(time%253600/60)}:${Math.floor(time%2560)}`:'')}
    			</small>
    			<div class="line"></div>
        `
  		});
  		output += `<div style="font-weight:bold">per second: <span class="price">${Beautify(Game.cookiesPs)}</span>
                  <br>per minute: <span class="price">${Beautify(Game.cookiesPs*60)}</span>
                  <br>per 10 minutes: <span class="price">${Beautify(Game.cookiesPs*600)}</span>
                  <br>per 30 minutes: <span class="price">${Beautify(Game.cookiesPs*1800)}</span>
                  <br>per hour: <span class="price">${Beautify(Game.cookiesPs*3600)}</span>
                  <br>per day: <span class="price">${Beautify(Game.cookiesPs*86400)}</span>
                  </div>
              </div>`;
  		return output;
  	},'store');
  	Game.tooltip.wobble();
  },
  buildUI: function() {
    storeTitle.onmouseover=this.bestDeals;
    storeTitle.onmouseout=this.clickerEvents.mouseout;

    var container = document.createElement('div');
    container.id = 'cruncher';
    container.classList.add('crateBox');
    sectionLeft.appendChild(container);

    Object.entries(this.clickers).forEach(([name, clicker]) => {
      clicker.settings = this.settings[name];

      var el = document.createElement('div');
      el.id = 'CC' + name;
      el.classList.add('crate', 'buff', 'disabled');
      el.clicker = clicker;
      clicker.element = el;

      Object.entries(this.clickerEvents).forEach(([ev, cb]) => { el['on'+ev] = cb });

      clicker.start = function() {
        this.settings.on = 1;
        var interval = this.interval();
        if (interval) this.timer = setInterval(this.action, interval)
        else this.action();
      };
      clicker.stop = function() {
        this.settings.on = 0;
        clearTimeout(this.timer);
        clearInterval(this.timer);
      };

      cruncher.appendChild(el);
    });

    var el = document.createElement('div');
    el.id = 'CCsettings';
    el.classList.add('crate', 'buff', 'disabled');
    el.onclick = () => { CookieCruncher.buildSettings() };
    el.clicker = {
      title: () => 'Settings',
      description: () => 'Change CookieCruncher settings'
    };
    el.onmouseover = this.clickerEvents.mouseover;
    el.onmouseout = this.clickerEvents.mouseout;
    cruncher.appendChild(el);

    this.updateUI();
  },

  buildSettings: function() {
    Game.ShowMenu('CC');

    menu.innerHTML = `
      <div class="close menuClose" onclick="Game.ShowMenu();">x</div>
      <div class="section">CookieCruncher Settings</div>
      <div class="subsection">
        <div class="title">Auto Click</div>
        <div class="listing">
          <input type="text" value="${CookieCruncher.clickers.autoClick.settings.count}" onchange="CookieCruncher.clickers.autoClick.settings.count=parseInt(this.value)">
          <label>Clicks per activation</label>
          <br>
          <input type="text" value="${CookieCruncher.clickers.autoClick.settings.perSecond}" onchange="CookieCruncher.clickers.autoClick.settings.perSecond=parseInt(this.value)">
          <label>Activations per second</label>
        </div>
      </div>`;

    var enabled = CookieCruncher.clickers.autoHarvest.settings.mature == 1 ? 'enabled' : 'disabled';
    menu.innerHTML += `
      <div class="subsection">
        <div class="title">Auto Harvest Garden</div>
        <div class="listing">
          <a class="option ${enabled}" onclick="CookieCruncher.clickers.autoHarvest.settings.mature=(_toggle(this) ? 1 : 0)">Harvest when Mature</a>
          <label>Harvest immediately when mature. Otherwise, harvest at end of lifespan.</label>
        </div>
      </div>
    `;

    if (Game.Objects["Wizard tower"].minigameLoaded) {
      spells = '';
      Game.Objects["Wizard tower"].minigame.spellsById.forEach((spell) => {
        spells += '<option value="'+spell.id+'" '+(CookieCruncher.clickers.autoCast.settings.id==spell.id?'selected':'')+'>'+spell.name+'</option>'
      })
      menu.innerHTML += `
        <div class="subsection">
          <div class="title">Auto Cast Spells</div>
          <div class="listing">
            <select onchange="CookieCruncher.clickers.autoCast.settings.id=this.value">
              ${spells}
            </select>
            <label>Auto cast this spell when mana is full</label>
          </div>
        </div>
      `;
    }
  },
  updateUI: function() {
    Object.entries(CookieCruncher.clickers).forEach(([name, clicker]) => {
      CookieCruncher.settings[name] = clicker.settings;
      clicker.element.style.display = clicker.isActive() ? 'inline-block' : 'none';
    });

    if (Game.lumpRipeAge - (Date.now() - Game.lumpT) <= 0) Game.clickLump();
  }
}
Game.registerMod('CookieCruncher', CookieCruncher);
