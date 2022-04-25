if (ModTools.version === undefined) {
    ModTools.makeBuilding = function(className, fields, spriteName, saveFunc, loadFunc, superClass) {
        var haxeClassName = "buildings." + className;
        var internalClassName = "buildings_" + className;
        
        //Choose super class based on buildinginfo.json info.
        if (superClass == undefined) {
            superClass = Building;

            const thisBuildingInfo = Resources.buildingInfo.h[haxeClassName];
            if (thisBuildingInfo == undefined) {
                throw "Building " + className + " is not defined in a buildinginfo.json.";
            }

            if (thisBuildingInfo.residents != undefined) {
                if (thisBuildingInfo.jobs != undefined)
                    superClass = buildings_WorkWithHome;
                else
                    superClass = buildings_House;
            } else if (thisBuildingInfo.jobs != undefined) {
                superClass = buildings_Work;
            }
        }

        var fieldsObject = {};
        if (typeof fields === "function")
            fieldsObject = fields(superClass);
        else
            fieldsObject = fields;

        //Then build the class
        var constructorOfBuilding = fieldsObject["__constructor__"];
        if (constructorOfBuilding === undefined)
            constructorOfBuilding = function(game,stage,bgStage,city,world,position,worldPosition,id) {
                superClass.call(this,game,stage,bgStage,city,world,position,worldPosition,id);
                this.isEntertainment = this._getIsEntertainment();
            };

        var newBuildingClass = window[internalClassName] = $hxClasses[haxeClassName] = constructorOfBuilding;
        newBuildingClass.__super__ = superClass;
        newBuildingClass.__name__ = haxeClassName;
        newBuildingClass.__interfaces__ = [];

        fieldsObject.__class__ = newBuildingClass;

        fieldsObject.save = function(queue) {
            var cur = queue.size;
            queue.addInt(0);

            superClass.prototype.save.call(this, queue);

            if (saveFunc != null)
                saveFunc.call(this, queue);

            queue.bytes.setInt32(cur, queue.size); 
        }

        fieldsObject.load = function(queue) {
            var queuePos = queue.readInt();

            superClass.prototype.load.call(this, queue);

            if (loadFunc != null)
                loadFunc.call(this, queue);

            // Just in case reset the queue read pos;
            // this should make it less likely that a mistake snowballs
            // into other save data.
            queue.readStart = queuePos;
        }
        
        fieldsObject._getIsEntertainment = () => false;

        newBuildingClass.prototype = $extend(superClass.prototype, fieldsObject);

        newBuildingClass.spriteName = spriteName;

        return newBuildingClass;
    }
}

function getTime(city){
    return city.simulation.time.timeSinceStart;
}

function isDay(city){
    var t = Math.floor(getTime(city) / 60) % 24;
    if(t > 6 && t < 18){
        return true;
    }
    return false;
}

var GLOBALS = {};
GLOBALS.dmMult = 1;

(function(ef){
    progress_Story.prototype.getDesiredGoalHighlights = function(){
        var highlights = ef();
        if(this.currentGoal == null) {
            return [];
        }
        var _g = 0;
        var _g1 = this.currentGoal.subGoals;
        while(_g < _g1.length) {
            var subGoal = _g1[_g];
            ++_g;
            if(!this.subGoalComplete(subGoal)) {
                var _g2 = subGoal.type;
                switch(_g2) {
                case "ClickBuilding":
                    var clickBuildingGoal = subGoal;
                    var className = clickBuildingGoal.permanentToClickClass;
                    if(!StringTools.startsWith(className,"buildings.") && !StringTools.startsWith(className,"worldResources.")) {
                        className = "buildings." + className;
                    }
                    highlights.push();
                    break;
                }
            }
        }
        return highlights;
    }
})(progress_Story.prototype.getDesiredGoalHighlights);

(function(ef){
    progress_Story.prototype.subGoalComplete = function(goal) {
		var _g = goal.type;
		switch(_g) {
    		case "ClickBuilding":
    			var clickBuildingGoal = goal;
    			var className = clickBuildingGoal.permanentToClickClass;
    			if(!StringTools.startsWith(className,"buildings.") && !StringTools.startsWith(className,"worldResources.")) {
    				className = "buildings." + className;
    			}
                var findFunc = function(pm){
                    return pm["is"](ofo);
                }
                var pm1 = Lambda.find(this.city.permanents, findFunc);
                if(this.city.gui.windowRelatedTo == pm1){
                    return true;
                }
        }
        return ef(goal);
    }
})(progress_Story.prototype.subGoalComplete);

var ofo = ModTools.makeBuilding('OverfluxOrb', (superClass) => {  return {
    update: function(timeMod) {
        // if(this.currentEvent == null){
        //     if(Math.random() < 0.05 && Math.floor(getTime(this.city) / 60) % 24 == 0){
        //         this.beginEvent();
        //     }
        // } else {
        //     this.tickEvent(timeMod);
        // }
        this.updateAnimation(timeMod);
    }
    ,updateAnimation: function(timeMod){
        var mainAnimSpeed = 4;
		var maxWaitTime = 0;
		var beginAnimTime = 0;
		var animLength = this.bgTextures.length * mainAnimSpeed + beginAnimTime + maxWaitTime;
		this.animProgress = Math.abs(this.animProgress + timeMod) % animLength;
        var currSprite = this.animProgress / mainAnimSpeed;
        this.backSprite.texture = this.bgTextures[Math.floor(currSprite)];
    }
    ,beginEvent: function(){
        this.currentEvent = Math.floor(Math.random()*1);
        this.setupEvent(this.currentEvent);
    }
    ,setupEvent: function(e){
        switch(e){
            case 0:
                this.currentEventData = {
                    duration: 60*24
                };
                break;
        }
    }
    ,tickEvent: function(timeMod){
        this.currentEventData.duration -= timeMod;
        if(this.currentEventData.duration <= 0){
            switch(this.currentEvent){
                case 0:
                    GLOBALS.dmMult = 1;
                    break;
            }
            this.currentEvent = null;
            this.currentEventData = {};
            return;
        }
        switch(this.currentEvent){
            case 0:
                var t = ((Math.floor(getTime(this.city)) % (60*24)) / (60*24)) * 2*Math.PI;
                var m = Math.sin(t)*1.5+2.5; // m is between 1 and 4
                GLOBALS.dmMult = m;
                break;
        }
    }
    ,createWindowAddBottomButtons: function() {
        this.city.gui.windowAddBottomButtons();
    }
	,positionSprites: function() {
		superClass.prototype.positionSprites.call(this);
		if(this.backSprite != null) {
			this.backSprite.position.set(this.position.x,this.position.y);
		}
	}
    ,__constructor__: function(game,stage,bgStage,city,world,position,worldPosition,id){
        this.currentEvent = null;
        this.currentEventData = {};
        superClass.call(this,game,stage,bgStage,city,world,position,worldPosition,id);
        this.bgTextures = Resources.getTexturesByWidth("spr_overflux_orb_frames",20);
        this.backSprite = new PIXI.Sprite(this.bgTextures[0]);
        this.backSprite.position.set(position.x,position.y);
        bgStage.addChild(this.backSprite);
	    this.animProgress = 0;
    }
};}, 'spr_overflux_orb', (queue) => {
    // queue.addByte(this.currentEvent);
    // queue.addFloat(this.currentEventData.duration);
}, (queue) => {
    // this.currentEvent = queue.readByte();
    // this.currentEventData.duration = queue.readFloat();
}, Building);