/* global SignaturePad:true */
sap.ui.define([
		"../reuse/signature_pad",
		"sap/ui/core/Control",
		"sap/base/Log"
	],
	function (Pad, Control, Log) {
		"use strict";

		return Control.extend("mit_sign.controls.SignaturePad", {

			sign_canvas: null,
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
						defaultValue: 3
					},
					"borderColor": {
						"type": "sap.ui.core.CSSColor",
						"defaultValue": "#000000"
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

			_raise_change_event: function (oEvent) {
				var that = this.signaturePad;
				var _url = "";
				if (that) {
					_url = that.toDataURL("image/jpeg", 1.0);
				}
				this.fireEvent("change", {
					value: _url
				});
			},

			clear: function () {
				if (this.signaturePad) {
					this.signaturePad.clear();
					this.fireEvent("change", { value: "" });
				}
			},

			isEmpty: function () {
				var _state;
				if (this.signaturePad) {
					_state = this.signaturePad.isEmpty();
				}
				return _state;
			},

			undo: function () {
				if (this.signaturePad) {
					this.signaturePad.undo();
					if (this.signaturePad.isEmpty()) {
						this.fireEvent("change", { value: "" });
					}
				}
			},

			export: function () {
				var _url;
				if (this.signaturePad) {
					_url = this.signaturePad.toDataURL();
				}
				return _url;
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
					// initialize button width
					var thickness = parseInt(oSignPad.getProperty("thickness"), 10);

					oRm.openStart("div", oSignPad)
						.openEnd();

					oRm.openStart("canvas", oSignPad)
						//	   .writeControlData(oSignPad) // e.g id='signature-pad'
						.class("m-signature-pad");

					oRm.style("width", oSignPad.getWidth())
						.style("height", oSignPad.getHeight())
						.style("background-color", oSignPad.getProperty("bgColor"))
						// .style("border", oSignPad.getBorderSize() + " " + oSignPad.getBorderStyle() + " " + oSignPad.getBorderColor())
						// .writeClasses()
						.openEnd();

					oRm.close("canvas");

					oRm.close("div");

				}
			},

			_resizeCanvas: function (oControl) {
				var that = this;
				if (that.signaturePad) 	{
					var ratio = Math.max(window.devicePixelRatio || 1, 1);
					
					that.sign_canvas.width = that.sign_canvas.offsetWidth * ratio;
					that.sign_canvas.height = that.sign_canvas.offsetHeight * ratio;
					that.sign_canvas.getContext("2d").scale(ratio, ratio);

					that.signaturePad.clear(); // otherwise isEmpty() might return incorrect value	
				}
			},

			onAfterRendering: function () {

				if (sap.ui.core.Control.prototype.onAfterRendering) {
					sap.ui.core.Control.prototype.onAfterRendering.apply(this, arguments); //super class

					this.sign_canvas = document.querySelector("canvas");
					// this.sign_canvas = $("#" + this.getId())[0];
					var oOptions = { // onBegin: ??,
						onEnd: this._raise_change_event.bind(this)
					};

					this.signaturePad = new SignaturePad(this.sign_canvas, oOptions);

					var that = this; //make the control resizable and redraw when something changed
					sap.ui.core.ResizeHandler.register(that, that._resizeCanvas.bind(this));

					//this.signaturePad.fromDataURL(sDataUrl, oOptions);
					this._resizeCanvas(this);
				}
			}

		});
	}
);