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
			/*
             * renders as Signature Tab
             * @param {sap.ui.core.RenderManager} oRM - UI5's render manager
             * @param {mit_sign.controls.SignPad} oControl - this UI5 custom control
             */				
				render: function(oRm, oSignPad) {
                 	oRm.openStart("canvas", oSignPad)
                 //	   .writeControlData(oSignPad) // e.g id='signature-pad'
					   .class("signature-pad")
					   .style("width", oSignPad.getWidth())
					   .style("height", oSignPad.getHeight())
					   .style("border", oSignPad.getBorderSize() + " " + oSignPad.getBorderStyle() + " " + oSignPad.getBorderColor())
					   // .writeClasses()
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
					
					 //var oImage = new Image.Image("img", {
					 //	src: uri,
					 //	onload: function(){
					 //		context.drawImage(oImage,0,0);
					 //	}
					 //}).placeAt("img");					
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
				var oStartPoint = {};
				var oLastPoint = {};
				var calculate = false;

				//functions
				function _getPoint(oEvent) {
					var x, y;

					if (oEvent.changedTouches && oEvent.changedTouches[0]) {
						var canvasArea = canvas.getBoundingClientRect();
						var offsety = canvasArea.top || 0;
						var offsetx = canvasArea.left || 0;

						x = oEvent.changedTouches[0].pageX - offsetx;
						y = oEvent.changedTouches[0].pageY - offsety;
					} else if (event.layerX || event.layerX === 0) {
						x = oEvent.layerX;
						y = oEvent.layerY;
					} else if (event.offsetX || event.offsetX === 0) {
						x = oEvent.offsetX;
						y = oEvent.offsetY;
					}

					return {
						x: x,
						y: y
					};
				}

				function onMouseMove(oEvent, finish) {
					oEvent.preventDefault();
					oEvent.stopPropagation();

					var oPoint = _getPoint(event);
					var oNextPoint = {
						x: (oStartPoint.x + oPoint.x) / 2,
						y: (oStartPoint.y + oPoint.y) / 2
					};

					if (calculate) {
						var xLast = (oLastPoint.x + oStartPoint.x + oNextPoint.x) / 3;
						var yLast = (oLastPoint.y + oStartPoint.y + oNextPoint.y) / 3;
						pixels.push(xLast, yLast);
					} else {
						calculate = true;
					}

					context.quadraticCurveTo(oStartPoint.x, oStartPoint.y, oNextPoint.x, oNextPoint.y);
					pixels.push(oNextPoint.x, oNextPoint.y);
					context.stroke();
					context.beginPath();
					context.moveTo(oNextPoint.x, oNextPoint.y);
					
					oLastPoint = oNextPoint;
					oStartPoint = oPoint;
				}

				function onMouseUp(oEvent) {
					_removeEventListeners();
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

				function _removeEventListeners() {
					canvas.removeEventListener("mousemove", onMouseMove, false);  					// mouse events
					canvas.removeEventListener("mouseup", onMouseUp, false);
					canvas.removeEventListener("touchmove", onMouseMove, false); 					// touch events
					canvas.removeEventListener("touchend", onMouseUp, false);

					$("#body").off("mouseup", onMouseUp, false);  	// document.body.removeEventListener("mouseup", onMouseUp, false);
					$("#body").off("touchend", onMouseUp, false);  // document.body.removeEventListener("touchend", onMouseUp, false);
				}
				
				function _addEventListeners() {
					canvas.addEventListener("mouseup", onMouseUp, false);							// mouse events
					canvas.addEventListener("mousemove", onMouseMove, false);
					canvas.addEventListener("touchend", onMouseUp, false);							// touch events
					canvas.addEventListener("touchmove", onMouseMove, false);
					
					$("#body").on("mouseup", onMouseUp, false);   // document.body.addEventListener("mouseup", onMouseUp, false);
					$("#body").on("touchend", onMouseUp, false);  // document.body.addEventListener("touchend", onMouseUp, false);
				}
				
				function onMouseDown(oEvent) {
					oEvent.preventDefault();
					oEvent.stopPropagation();
					_addEventListeners();

					//empty = false;
					var oPosition = _getPoint(event);
					context.beginPath();
					pixels.push("moveStart");
					context.moveTo(oPosition.x, oPosition.y);
					pixels.push(oPosition.x, oPosition.y);
					oStartPoint = oPosition;
				}

				canvas.addEventListener("touchstart", onMouseDown, false);
				canvas.addEventListener("mousedown", onMouseDown, false);
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