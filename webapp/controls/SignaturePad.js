sap.ui.define([
		"./signature_pad",
		"sap/ui/core/Control",
		"sap/base/Log"
	],
	function (Szimek, Control, Log) {
		"use strict";

		return Control.extend("mit_sign.controls.SignaturePad", {

			signaturePad: null,
			// Adjust canvas coordinate space taking into account pixel ratio,
			// to make it look crisp on mobile devices.
			// This also causes canvas to be cleared.

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
					"thickness": {
						type: "int",
						defaultValue: 2
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
						"defaultValue": "#d6f5ff" // or "lightgrey"??
					},
					"signcolor": {
						type: "sap.ui.core.CSSColor",
						defaultValue: "black"
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
				render: function (oRm, oSignPad) {
					var thickness = parseInt(oSignPad.getProperty("thickness"), 10);

					oRm.openStart("canvas", oSignPad)
						//	   .writeControlData(oSignPad) // e.g id='signature-pad'
						.class("signature-pad")
						.style("width", oSignPad.getProperty("width"))
						.style("height", oSignPad.getProperty("height"))
					//	.style("background-color", oSignPad.getProperty("bgcolor"))
						.style("border", oSignPad.getBorderSize() + " " + oSignPad.getBorderStyle() + " " + oSignPad.getBorderColor())
						.writeClasses() // this call writes the above class plus enables support for Square.addStyleClass(...)
						.openEnd();

					oRm.close("canvas");
					
				 //TODO Write a canvas
					oRm.openStart("canvas", oSignPad);
				    oRm.write(" width='" + oSignPad.getProperty("width") + "' " +  "height='" + oSignPad.getProperty("height") + "'");
				    oRm.writeControlData(oSignPad);  // writes the Control ID and enables event handling - important!
				    oRm.addStyle("width", oSignPad.getProperty("width"));  // write the Control property size; the Control has validated it to be a CSS size
				    oRm.addStyle("height", oSignPad.getProperty("height"));
				    oRm.writeStyles();
				    oRm.write("></canvas>");
				    oRm.write("</div>");
				    oRm.openEnd();
				  
				}
			},

		
			resizeCanvas: function () {
				// When zoomed out to less than 100%, for some very strange reason,
				// some browsers report devicePixelRatio as less than 1
				// and only part of the canvas is cleared then.
				var canvas = document.querySelector("canvas");
				//This method may be called before canvas made its entry
				if (canvas) {
					var ratio = Math.max(window.devicePixelRatio || 1, 1);
					canvas.width = canvas.offsetWidth * ratio;
					canvas.height = canvas.offsetHeight * ratio;
					canvas.getContext("2d").scale(ratio, ratio);
				}
			},

			onAfterRendering: function () {
				if (sap.ui.core.Control.prototype.onAfterRendering) {
					sap.ui.core.Control.prototype.onAfterRendering.apply(this, arguments); //super class
					var that = this; //make the control resizable and redraw when something changed
                var oSignpad = this.getView().byId("signpad");
                oSignpad.activate();
					sap.ui.core.ResizeHandler.register(this, this.resizeCanvas);
				}
			},


			_strokeEnd : function(oEvent){
				var url = this.export();
				this.fireEvent("change", {
							value: url
						});			   
			},
			
			activate: function(){
		    	var canvasList = document.querySelectorAll("canvas");
		    	var canvas;
		    	for(var i=0; i < canvasList.length; i++) {
		    		if(canvasList[i].id.indexOf("signpad") !== -1)	{
		    			canvas = canvasList[i];
		    		}
		    	}
		    	try {
					this.signaturePad = new Szimek.SignaturePad(canvas, {onEnd: this._strokeEnd});
		    	}
		    	catch(e) {
		    		Log.error(e);
		    	}
	       },
			       
			clear: function () {
				this.signaturePad.clear();
			},

			isEmpty: function () {
				return this.signaturePad.isEmpty();
			},
			
			undo: function () {
				this.signaturePad.undo();
			},
			
			export: function () {
				return this.signaturePad.toDataURL();
			}
			
		});
	}
);