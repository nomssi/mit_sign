sap.ui.define(
		["sap/ui/core/Control",
			"sap/m/MessageBox",
			"sap/m/Button",
		    "sap/m/Image"],
	function(Control,MessageBox,Button,Image) {
		"use strict";
		return Control.extend("Signature.controls.SignPad", {	
  metadata: {
      properties: {
    	  /* other (configuration) properties */
          "width"       : {"type" : "int", "defaultValue" : "auto"},
          "height"      : {"type" : "int", "defaultValue" : "auto"},
          "borderColor"	: {"type" : "sap.ui.core.CSSColor", "defaultValue":"#000000" },
          "borderSize"  : {"type" : "sap.ui.core.CSSSize", "defaultValue": "1px" },
          "borderStyle" : {
        	  type: "string",
        	  defaultValue: "none" //none, hidden, dotted, dashed, solid, double, groove, ridge, inset, outset, initial, inherit
        		  },
          "bgcolor": {"type": "string", "defaultValue": "#ffa"},
          "lineColor": {"type": "string", "defaultValue": "#666"},
          "penColor": {"type": "string", "defaultValue": "#333"},
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
      //var bgColor = oControl.getBgcolor();
      //var lineColor = oControl.getLineColor();
      //var pen = oControl.getPenColor();
      //var id = oControl.getId();
      //var w = oControl.getWidth();
      //var h = oControl.getHeight();

      
      oRm.write("<div id='signature-outer' class='sapMFlexBox'");
      oRm.writeControlData(oControl);

      oRm.addStyle("width", oControl.getWidth() + "px");
      oRm.addStyle("height", oControl.getHeight() + "px");
      oRm.addStyle("border", oControl.getBorderSize() + " " + oControl.getBorderStyle() + " " + oControl.getBorderColor());
      oRm.writeStyles();

      oRm.write(">");
      //DIV-COntent

      //oRm.write("<canvas id='signature-pad' width='"+oControl.getWidth()+"px' height='"+oControl.getHeight()+"px' class='signature-pad'></canvas>");
      oRm.write("<canvas id='signature-pad' class='signature-pad'");

      oRm.addStyle("width", oControl.getWidth() + "px");
      oRm.addStyle("height", oControl.getHeight() + "px");
      oRm.addStyle("border","1px solid #000");
      oRm.writeStyles();

      oRm.write("></canvas>");

      oRm.write("</div>");
      //"<canvas id='signature-pad' width='400' height='200' class='signature-pad'></canvas>"
    },

   /* setValue: function(sValue){
    	this.setProperty("value", sValue, true);
    	var canvas = document.getElementById("signature-pad");
    	if(!canvas){
    		console.log("canvas not found");
    		return;
    	}
		var context = canvas.getContext("2d");	
    	var uri = sValue;
		if(uri){
			var img = document.createElement("img");
			img.onload = function(){
				context.drawImage(img,0,0);
			};
			img.src = uri;
		}
    },*/

    onAfterRendering: function() {
    	var that = this;
    	var canvas = document.getElementById("signature-pad");
		var context = canvas.getContext("2d");	
		canvas.width = this.getWidth();
		canvas.height = this.getHeight();
		context.fillStyle = "#fff";
		context.strokeStyle = "#444";
		context.lineWidth = 1.5;
		context.lineCap = "round";
		context.fillRect(0, 0, canvas.width, canvas.height);
		
		setTimeout(function() {
			var uri = this.getValue();
			jQuery.sap.log.level.INFO(uri);
			if(uri){
				var oImage = new sap.m.Image("img", {
					src: uri,
					onload: function(){
					context.drawImage(oImage,0,0);
					}
				}).placeAt("img");
				
				// var img = document.createElement("img");
				// img.onload = function(){
				// 	context.drawImage(img,0,0);
				// };
				// img.src = uri;
			}
		}.bind(this), 1000);
		
		// var disableSave = true;
		var pixels = [];
		// var cpixels = [];
		var xyLast = {};
		var xyAddLast = {};
		var calculate = false;
		 	//functions
			function get_coords(e) {
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

				var xy = get_coords(e);
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
				pixels.push('e');
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
				document.body.addEventListener('mouseup', on_mouseup, false);
				document.body.addEventListener('touchend', on_mouseup, false);

				//empty = false;
				var xy = get_coords(e);
				context.beginPath();
				pixels.push('moveStart');
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
		
		canvas.addEventListener('touchstart', on_mousedown, false);
		canvas.addEventListener('mousedown', on_mousedown, false);

    },

	clear : function(oEvent){
		var canvas = document.getElementById("signature-pad");
		var context = canvas.getContext("2d");
		context.clearRect(0, 0, canvas.width, canvas.height);
		context.fillStyle = "#fff";
		context.strokeStyle = "#444";
		context.lineWidth = 1.5;
		context.lineCap = "round";
		context.fillRect(0, 0, canvas.width, canvas.height);

	}
	});
}
);