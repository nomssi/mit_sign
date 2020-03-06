sap.ui.define([
		"sap/ui/core/Control",
		"sap/m/Image"
	],
	function (Control, Image) {
		"use strict";
		return Control.extend("mit_sign.controls.SignPad", {
			metadata: {
				properties: {
					/* other (configuration) properties */
					"width": {
						"type": "sap.ui.core.CSSSize",
						"defaultValue": "auto"
					},
					"height": {
						"type": "sap.ui.core.CSSSize",
						"defaultValue": "100px"
					},
					"borderColor": {
						"type": "sap.ui.core.CSSColor",
						"defaultValue": "#000000"
					},
					"borderSize": {
						"type": "sap.ui.core.CSSSize",
						"defaultValue": "1px"
					},
					"borderStyle": {
						type: "string",
						defaultValue: "none" //none, hidden, dotted, dashed, solid, double, groove, ridge, inset, outset, initial, inherit
					},
					"bgColor": {
						"type": "sap.ui.core.CSSColor",
						"defaultValue": "#d6f5ff"
					},
					"lineColor": {
						"type": "sap.ui.core.CSSColor",
						"defaultValue": "#666666" 
					},
					"penColor": {
						"type": "sap.ui.core.CSSColor",
						"defaultValue": "#444444"
					},
					"value": "string",
					"name": "string"
				},
				events: {
					change: {
						parameters: {
							value: {
								type: "string"
							}
						}
					}
				}
			},

			init: function () {
				// var oControl = this;

			},

			renderer: {
				apiVersion: 2, // enable in-place DOM patching
			/**
             * renders as Signature Tab
             * @param {sap.ui.core.RenderManager} oRM - UI5's render manager
             * @param {mit_sign.controls.SignPad} oControl - this UI5 custom control
             */				
				render: function(oRm, oSignPad) {
                 	oRm.openStart("canvas", oSignPad)
                 	   .writeControlData(oSignPad) // e.g id='signature-pad'
					   .class("signature-pad")
					   .style("width", oSignPad.getWidth())
					   .style("height", oSignPad.getHeight())
					   .style("border", oSignPad.getBorderSize() + " " + oSignPad.getBorderStyle() + " " + oSignPad.getBorderColor())
                	   .openEnd();
	
					oRm.close("canvas");
					}
			},

			onAfterRendering: function () {

				if (sap.ui.core.Control.prototype.onAfterRendering) {
					sap.ui.core.Control.prototype.onAfterRendering.apply(this, arguments); //super class
					this._drawSignatureArea(this);
					this._makeCanvasDrawable(this);
					var that = this; //make the control resizable and redraw when something changed
					sap.ui.core.ResizeHandler.register(this, function () {
						that._drawSignatureArea(that);
					});

					this._bindImage(this);
				}

			},

			_bindImage: function (oControl) {
				var canvas = $("#" + oControl.getId())[0];
				var context = canvas.getContext("2d");
				var uri = oControl.getValue();
				if (uri) {
					var img = document.createElement("img"); //  $.parseHTML("<img/>");

					img.onload = function () {
						context.drawImage(img, 0, 0);
					};
					img.src = uri;
					
					// var oImage = new sap.m.Image("img", {
					// 	src: uri,
					// 	onload: function(){
					// 		context.drawImage(oImage,0,0);
					// 	}
					// }).placeAt("img");					
				}
	
				
			},

			_drawSignatureArea: function (oControl) {
				var canvas = $("#" + oControl.getId())[0];
				var context = canvas.getContext("2d");

				canvas.width = canvas.clientWidth;       //this.getWidth();
				canvas.height = canvas.clientHeight;    //this.getHeight();
				context.fillStyle = oControl.getBgColor();
				context.strokeStyle = oControl.getPenColor();
				context.lineWidth = 1.5;
				context.lineCap = "round";
				context.fillRect(0, 0, canvas.width, canvas.height);

				/******************************************************/
			},

			_makeCanvasDrawable: function (oControl) {
				var that = this;
				var canvas = $("#" + oControl.getId())[0];
				var context = canvas.getContext("2d");

				var disableSave = true;
				var pixels = [];
				// var cpixels = [];
				var lastPos = {};
				var lastNextPos = {};
				var calculate = false;

				//functions
				function getCoords(e) {
					var x, y;

					if (e.changedTouches && e.changedTouches[0]) {
						var canvasArea = canvas.getBoundingClientRect();
						var offsety = canvasArea.top || 0;
						var offsetx = canvasArea.left || 0;

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
						x: x,
						y: y
					};
				}

				function on_mousemove(e, finish) {
					e.preventDefault();
					e.stopPropagation();

					var position = getCoords(e);
					var nextPos = {
						x: (lastPos.x + position.x) / 2,
						y: (lastPos.y + position.y) / 2
					};

					if (calculate) {
						var xLast = (lastNextPos.x + lastPos.x + nextPos.x) / 3;
						var yLast = (lastNextPos.y + lastPos.y + nextPos.y) / 3;
						pixels.push(xLast, yLast);
					} else {
						calculate = true;
					}

					context.quadraticCurveTo(lastPos.x, lastPos.y, nextPos.x, nextPos.y);
					pixels.push(nextPos.x, nextPos.y);
					context.stroke();
					context.beginPath();
					context.moveTo(nextPos.x, nextPos.y);
					lastNextPos = nextPos;
					lastPos = position;

				}

				function on_mouseup(e) {
					remove_EventListeners();
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
                    // mouse events
					canvas.addEventListener("mouseup", on_mouseup, false);
					canvas.addEventListener("mousemove", on_mousemove, false);
					// touch events
					canvas.addEventListener("touchend", on_mouseup, false);
					canvas.addEventListener("touchmove", on_mousemove, false);
					
					$("#body").on("mouseup", on_mouseup, false);   // document.body.addEventListener("mouseup", on_mouseup, false);
					$("#body").on("touchend", on_mouseup, false);  // document.body.addEventListener("touchend", on_mouseup, false);

					//empty = false;
					var position = getCoords(e);
					context.beginPath();
					pixels.push("moveStart");
					context.moveTo(position.x, position.y);
					pixels.push(position.x, position.y);
					lastPos = position;
				}

				function remove_EventListeners() {
					// mouse events
					canvas.removeEventListener("mousemove", on_mousemove, false);
					canvas.removeEventListener("mouseup", on_mouseup, false);
					// touch events
					canvas.removeEventListener("touchmove", on_mousemove, false);
					canvas.removeEventListener("touchend", on_mouseup, false);

					$("#body").off("mouseup", on_mouseup, false);  	// document.body.removeEventListener("mouseup", on_mouseup, false);
					$("#body").off("touchend", on_mouseup, false);  // document.body.removeEventListener("touchend", on_mouseup, false);
				}

				canvas.addEventListener("touchstart", on_mousedown, false);
				canvas.addEventListener("mousedown", on_mousedown, false);
			},

			clear: function (oEvent) {
				// Clear canvas using background color
				var canvas = $("#" + this.getId())[0]; // document.getElementById("signature-pad");
				var context = canvas.getContext("2d");
				context.clearRect(0, 0, canvas.width, canvas.height);

				this._drawSignatureArea(this);
			}
		});
	}
);