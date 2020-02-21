sap.ui.define([
		"sap/ui/core/Control",
	    "sap/m/Image"],
	function(Control,Image) {
		"use strict";
		return Control.extend("mit_sign.controls.SignPad", {	
  metadata: {
      properties: {
    	  /* other (configuration) properties */
          "width"       : {"type" : "sap.ui.core.CSSSize", "defaultValue" : "auto"},
          "height"      : {"type" : "sap.ui.core.CSSSize", "defaultValue" : "100px"},
          "borderColor"	: {"type" : "sap.ui.core.CSSColor", "defaultValue":"#000000" },
          "borderSize"  : {"type" : "sap.ui.core.CSSSize", "defaultValue": "1px" },
          "borderStyle" : {
        	  type: "string",
        	  defaultValue: "none" //none, hidden, dotted, dashed, solid, double, groove, ridge, inset, outset, initial, inherit
        		  },
          "bgColor": {"type": "sap.ui.core.CSSColor", "defaultValue": "#ffffff"},
          "lineColor": {"type": "sap.ui.core.CSSColor", "defaultValue": "#666666"},
          "penColor": {"type": "sap.ui.core.CSSColor", "defaultValue": "#444444"},
          "value": "string",
          "name":"string"
      },
      events: {
    	  change : {
    		  parameters:
    			  { value : {type:"string"} }
    	  }
      }
    },

    init: function(){
    	// var oControl = this;
    	
    },

    renderer: function(oRm, oControl) {
    /*  var bgColor = oControl.getBgColor();
      var lineColor = oControl.getLineColor();
      var pen = oControl.getPenColor();
      var id = oControl.getId();
      var w = oControl.getWidth();
      var h = oControl.getHeight();*/


      /*oRm.write("<div id='signature-outer' class='sapMFlexBox'");
      oRm.writeControlData(oControl);

      oRm.addStyle("width", oControl.getWidth());
      oRm.addStyle("height", oControl.getHeight());
      oRm.addStyle("border", oControl.getBorderSize() + " " + oControl.getBorderStyle() + " " + oControl.getBorderColor());
      oRm.writeStyles();

      oRm.write(">");*/


      //oRm.write("<canvas id='signature-pad' class='signature-pad'");
    	oRm.write("<canvas class='signature-pad'");

      oRm.writeControlData(oControl);
      oRm.addStyle("width", oControl.getWidth());
      oRm.addStyle("height", oControl.getHeight());
      oRm.addStyle("border", oControl.getBorderSize() + " " + oControl.getBorderStyle() + " " + oControl.getBorderColor());
      oRm.writeStyles();

      oRm.write("></canvas>");

      //oRm.write("</div>");

    },


    onAfterRendering: function() {
    	
    	if(sap.ui.core.Control.prototype.onAfterRendering){
    		sap.ui.core.Control.prototype.onAfterRendering.apply(this,arguments); //super class
    		this._drawSignatureArea(this);
    		this._makeCanvasDrawable(this);
    		var that = this; //make the control resizable and redraw when something changed
    		sap.ui.core.ResizeHandler.register(this, function () {
    			that._drawSignatureArea(that);
    		});
    		
    		this._bindImage(this);
    		
    	}

    },

    _bindImage: function(oControl){
    	var canvas = $("#" + oControl.getId())[0];
		var context = canvas.getContext("2d");	
    	var uri = oControl.getValue();
		if(uri){
			// var img = document.createElement("img");
			var img = $("img");
			
			img.onload = function(){
				context.drawImage(img,0,0);
			};
			img.src = uri;
		}
    	
    	/*setTimeout(function() {
			var uri = oControl.getValue();
			if(uri){
				var img = document.createElement("img");
				img.onload = function(){
					context.drawImage(img,0,0);
				};
				img.src = uri;
				console.log(img);
			}
		}.bind(this), 1000);*/
    },

    _drawSignatureArea: function(oControl){
    	var canvas = $("#" + oControl.getId())[0];
		var context = canvas.getContext("2d");	
		canvas.width = canvas.clientWidth; //this.getWidth();
		canvas.height = canvas.clientHeight; //this.getHeight();
		context.fillStyle = oControl.getBgColor();
		context.strokeStyle = oControl.getPenColor();
		context.lineWidth = 1.5;
		context.lineCap = "round";
		context.fillRect(0, 0, canvas.width, canvas.height);
		
		/******************************************************/
    },

    _makeCanvasDrawable: function(oControl){
    	var that = this;
    	var canvas = $("#" + oControl.getId())[0];
    	var context = canvas.getContext("2d");
    	
    	//loading Image
		/*setTimeout(function() {
			var uri = oControl.getValue();
			if(uri){
				var img = document.createElement("img");
				img.onload = function(){
					context.drawImage(img,0,0);
				};
				img.src = uri;
				console.log(img);
			}
		}.bind(oControl), 1000);*/
		
		var disableSave = true;
		var pixels = [];
		// var cpixels = [];
		var xyLast = {};
		var xyAddLast = {};
		var calculate = false;
		 	//functions
			function getCoords(e) {
				var x, y;

				if (e.changedTouches && e.changedTouches[0]) {
					var offsety = canvas.offsetTop || 0;
					var offsetx = canvas.offsetLeft || 0;

					x = e.changedTouches[0].pageX - offsetx;
					y = e.changedTouches[0].pageY - offsety;
				} else if (e.layerX || e.layerX === 0) {
					x = e.layerX;
					y = e.layerY;
				} else if (e.offsetX || e.offsetX === 0) {
					x = e.offsetX;
					y = e.offsetY;
				}

				return {
					x : x, y : y
				};
			}

			function on_mousemove(e, finish) {
				e.preventDefault();
				e.stopPropagation();

				var xy = getCoords(e);
				var xyAdd = {
					x : (xyLast.x + xy.x) / 2,
					y : (xyLast.y + xy.y) / 2
				};

				if (calculate) {
					var xLast = (xyAddLast.x + xyLast.x + xyAdd.x) / 3;
					var yLast = (xyAddLast.y + xyLast.y + xyAdd.y) / 3;
					pixels.push(xLast, yLast);
				} else {
					calculate = true;
				}

				context.quadraticCurveTo(xyLast.x, xyLast.y, xyAdd.x, xyAdd.y);
				pixels.push(xyAdd.x, xyAdd.y);
				context.stroke();
				context.beginPath();
				context.moveTo(xyAdd.x, xyAdd.y);
				xyAddLast = xyAdd;
				xyLast = xy;

			}

			function on_mouseup(e) {
				remove_event_listeners();
				disableSave = false;
				context.stroke();
				pixels.push("e");
				calculate = false;
				var url = canvas.toDataURL("image/jpeg", 1.0);
				that.setValue(url);
				that.fireEvent("change", {
					value: url
				});
			}
			

			function on_mousedown(e) {
				e.preventDefault();
				e.stopPropagation();

				canvas.addEventListener("mouseup", on_mouseup, false);
				canvas.addEventListener("mousemove", on_mousemove, false);
				canvas.addEventListener("touchend", on_mouseup, false);
				canvas.addEventListener("touchmove", on_mousemove, false);
				// document.body.addEventListener("mouseup", on_mouseup, false);
				// document.body.addEventListener("touchend", on_mouseup, false);
				$("#body").addEventListener("mouseup", on_mouseup, false); // Nomssi
				$("#body").addEventListener("touchend", on_mouseup, false); // Nomssi

				//empty = false;
				var xy = getCoords(e);
				context.beginPath();
				pixels.push("moveStart");
				context.moveTo(xy.x, xy.y);
				pixels.push(xy.x, xy.y);
				xyLast = xy;
			}

			function remove_event_listeners() {
				canvas.removeEventListener("mousemove", on_mousemove, false);
				canvas.removeEventListener("mouseup", on_mouseup, false);
				canvas.removeEventListener("touchmove", on_mousemove, false);
				canvas.removeEventListener("touchend", on_mouseup, false);

				document.body.removeEventListener("mouseup", on_mouseup, false);
				document.body.removeEventListener("touchend", on_mouseup, false);
			}
			
		canvas.addEventListener("touchstart", on_mousedown, false);
		canvas.addEventListener("mousedown", on_mousedown, false); 
    },
    
	clear : function(oEvent){
		//var canvas = document.getElementById("signature-pad");
		var canvas = $("#" + this.getId())[0];
		var context = canvas.getContext("2d");
		context.clearRect(0, 0, canvas.width, canvas.height);
		/*context.fillStyle = "#fff";
		context.strokeStyle = "#444";
		context.lineWidth = 1.5;
		context.lineCap = "round";
		context.fillRect(0, 0, canvas.width, canvas.height);*/
		this._drawSignatureArea(this);

	}
	});
}
);