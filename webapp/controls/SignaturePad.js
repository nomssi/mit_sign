/* global SignaturePad:true */
sap.ui.define([
		"./signature_pad",
		"sap/ui/core/Control"
	],
	function (Pad, Control) {
		"use strict";

		return Control.extend("Signature.controls.SignaturePad", {

			metadata: {
				properties: {
					/* other (configuration) properties */
					"width": {
						"type": "sap.ui.core.CSSSize",
						"defaultValue": "auto"
					},
					"height": {
						"type": "sap.ui.core.CSSSize",
						"defaultValue": "auto"
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
						"defaultValue": sap.ui.core.theming.Parameters.get("sapUiButtonHoverBackground")
					},
					"signcolor": {
						type: "sap.ui.core.CSSColor",
						defaultValue: "black"
					},
					"value": "string",
					"name": "string"
				},
				events: {
					onEndEvent: {
						parameters: {
							value: {
								type: "string"
							}
						}
					}
				}
			},

			clear: function () {
				if (this.signaturePad) {
					this.signaturePad.clear();
					this.fireEvent("onEndEvent", {
						value: ""
					});
					this.signaturePad.off();
					this.signaturePad.on();
				}
			},

			isEmpty: function () {
				var bState;
				if (this.signaturePad) {
					bState = this.signaturePad.isEmpty();
					if (!bState) {
						var aGroups = this.signaturePad.toData();
						// check if there's at leat one group with more than 5 points
						bState = !aGroups.some(function (group) {
							return group.points.length > 5;
						});
					}
				}
				return bState;
			},

			export: function () {
				var _url;
				if (this.signaturePad) {
					_url = this.signCanvas.toDataURL("image/png");
					this.signaturePad.on();
				}
				return _url;
			},

			init: function () {
				// var oControl = this;
				this.signCanvas = null;
				this.signaturePad = null;
			},

			renderer: {
				apiVersion: 2, // enable in-place DOM patching
				/*
				 * renders as Signature Tab
				 * @param {sap.ui.core.RenderManager} oRM - UI5's render manager
				 * @param {Signature.controls.SignPad} oControl - this UI5 custom control
				 */
				render: function (oRm, oSignPad) {
					// initialize button width
					// var iThickness = parseInt(oSignPad.getProperty("thickness"), 10);

					oRm.openStart("div", oSignPad).
						style("width", oSignPad.getWidth()).
						style("height", oSignPad.getHeight()).
						openEnd();

					oRm.openStart("canvas", oSignPad).
						style("width", oSignPad.getWidth()).
						style("height", oSignPad.getHeight()).
						//	   writeControlData(oSignPad). // e.g id='signature-pad'
						class("m-signature-pad").

						style("background-color", oSignPad.getProperty("bgColor")).
						// style("border", oSignPad.getBorderSize() + " " + oSignPad.getBorderStyle() + " " + oSignPad.getBorderColor()).
						// writeClasses().
						openEnd();

					oRm.close("canvas");

					oRm.close("div");

				}
			},

			// Adjust canvas coordinate space taking into account pixel ratio,
			// to make it look crisp on mobile devices.
			// This also causes canvas to be cleared.
			_resizeCanvas: function () {
				if (this.signaturePad) {
					var oCanvas = this.signCanvas;
					var ratio = Math.max(window.devicePixelRatio || 1, 1);

					/* set the size of the canvas
					var scale = ratio;
					oCanvas.width = oCanvas.width * scale;
					oCanvas.height = oCanvas.height * scale;
					oCanvas.getContext("2d").scale(scale, scale);
					*/

					// readjust the canvas's size to the device aspect ratio.
					oCanvas.width = oCanvas.offsetWidth * ratio;
					oCanvas.height = oCanvas.offsetHeight * ratio;
					oCanvas.getContext("2d").scale(ratio, ratio);

					// This library does not listen for canvas changes, so after the canvas is automatically
					// cleared by the browser, SignaturePad#isEmpty might still return false, even though the
					// canvas looks empty, because the internal data of this library wasn't cleared. To make sure
					// that the state of this library is consistent with visual state of the canvas, you
					// have to clear it manually.

					this.signaturePad.clear(); // otherwise isEmpty() might return incorrect value	
					this.signaturePad.off();
					this.signaturePad.on();   // fix?
				}
			},

			_activate: function (oCanvas, that) {

				if (oCanvas !== that.signCanvas) {
					that.signCanvas = oCanvas;
					var oOptions = {
						// It's Necessary to use an opaque color when saving image as JPEG;
						// this option can be omitted if only saving as PNG or SVG
						// backgroundColor: "rgb(255, 255, 255)",
						// onBegin: ??,
						penColor: that.getProperty("signcolor"),
						onEnd: function (oEvent) {
							this.fireEvent("onEndEvent", {
								value: "" // we only need the state (empty/not empty, not yet the sign data)
							});
						}.bind(that)
					};

					that.signaturePad = new SignaturePad(that.signCanvas, oOptions);

					// make the control resizable and redraw when something changed
					sap.ui.core.ResizeHandler.register(that, that._resizeCanvas.bind(that));

					that._resizeCanvas(that);
				};
			},

			onAfterRendering: function () {

				if (sap.ui.core.Control.prototype.onAfterRendering) {
					sap.ui.core.Control.prototype.onAfterRendering.apply(this, arguments); // super class

					var oCanvas = document.querySelector("canvas[id=" + this.getId() + "]");

					this._activate(oCanvas, this);
				}
			},

			exit: function () {
				if (this.signaturePad) {
					this.signaturePad.destroy();
				}
			}

		});
	}
);