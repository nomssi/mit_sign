/* global SignaturePad:true */
sap.ui.define([
		"./signature_pad",
		"sap/ui/core/Control",
		"sap/base/Log"
	],
	function (Pad, Control, Log) {
		"use strict";

		return Control.extend("Signature.controls.SignaturePad", {

			signCanvas: null,
			signaturePad: null,

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
						// "defaultValue": sap.ui.core.theming.Parameters.get("sapUiContentImagePlaceholderBackground")
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

			/**
			 * Crop signature canvas to only contain the signature and no whitespace.
			 *
			 * @since 1.0.0
			 */
			_cropSignatureCanvas: function (oCanvas) {

				// First duplicate the canvas to not alter the original
				var oCroppedCanvas = document.createElement("canvas");
				var croppedCtx = oCroppedCanvas.getContext("2d");

				oCroppedCanvas.width = oCanvas.width;
				oCroppedCanvas.height = oCanvas.height;
				croppedCtx.drawImage(oCanvas, 0, 0);

				// Next do the actual cropping
				var w = oCroppedCanvas.width,
					h = oCroppedCanvas.height,
					pix = {
						x: [],
						y: []
					},
					imageData = croppedCtx.getImageData(0, 0, oCroppedCanvas.width, oCroppedCanvas.height),
					x, y, index;

				for (y = 0; y < h; y++) {
					for (x = 0; x < w; x++) {
						index = (y * w + x) * 4;
						if (imageData.data[index + 3] > 0) {
							pix.x.push(x);
							pix.y.push(y);
						}
					}
				}
				pix.x.sort(function (a, b) {
					return a - b;
				});
				pix.y.sort(function (a, b) {
					return a - b;
				});
				var n = pix.x.length - 1;

				w = pix.x[n] - pix.x[0];
				h = pix.y[n] - pix.y[0];
				var cut = croppedCtx.getImageData(pix.x[0], pix.y[0], w, h);

				oCroppedCanvas.width = w;
				oCroppedCanvas.height = h;
				croppedCtx.putImageData(cut, 0, 0);

				return oCroppedCanvas.toDataURL("image/svg+xml", 1.0);
			},

			_raiseEndEvent: function (oEvent) {
				var that = this.signaturePad;
				var _url = "";
				if (that) {
					_url = this._cropSignatureCanvas(this.signCanvas);
				}
				this.fireEvent("onEndEvent", {
					value: _url
				});
			},

			clear: function () {
				if (this.signaturePad) {
					this.signaturePad.clear();
					this.fireEvent("onEndEvent", {
						value: ""
					});
				}
			},

			isEmpty: function () {
				var bState;
				if (this.signaturePad) {
					bState = this.signaturePad.isEmpty();
					if (!bState) {
						var aGroups = this.signaturePad.toData();
						// check if there's at leat one group with more than 5 points
						bState = !aGroups.some(function (group) { return group.points.length > 5; });
					}
				}
				return bState;
			},

			undo: function () {
				if (this.signaturePad) {
					// Undo
					var data = this.signaturePad.toData();
					if (data) {
						data.pop(); // remove the last dot or line
						this.signaturePad.fromData(data);
					}
					if (this.signaturePad.isEmpty()) {
						this.fireEvent("onEndEvent", {
							value: ""
						});
					}
				}
			},

			export: function () {
				var _url;
				if (this.signaturePad) {
					_url = this._cropSignatureCanvas(this.signCanvas);
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
				 * @param {Signature.controls.SignPad} oControl - this UI5 custom control
				 */
				render: function (oRm, oSignPad) {
					// initialize button width
					// var iThickness = parseInt(oSignPad.getProperty("thickness"), 10);

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

// Adjust canvas coordinate space taking into account pixel ratio,
// to make it look crisp on mobile devices.
// This also causes canvas to be cleared.
			_resizeCanvas: function (oControl) {
				var that = this;
				if (that.signaturePad) {
					var ratio = Math.max(window.devicePixelRatio || 1, 1);
					var oCanvas = that.signCanvas;

					oCanvas.width = oCanvas.offsetWidth * ratio;
					oCanvas.height = oCanvas.offsetHeight * ratio;
					oCanvas.getContext("2d").scale(ratio, ratio);

  // This library does not listen for canvas changes, so after the canvas is automatically
  // cleared by the browser, SignaturePad#isEmpty might still return false, even though the
  // canvas looks empty, because the internal data of this library wasn't cleared. To make sure
  // that the state of this library is consistent with visual state of the canvas, you
  // have to clear it manually.
					that.signaturePad.clear(); // otherwise isEmpty() might return incorrect value	
				}
			},

			onAfterRendering: function () {

				if (sap.ui.core.Control.prototype.onAfterRendering) {
					sap.ui.core.Control.prototype.onAfterRendering.apply(this, arguments); //super class

					this.signCanvas = document.querySelector("canvas[id=" + this.getId() + "]");  
					var oOptions = { 
					// It's Necessary to use an opaque color when saving image as JPEG;
					// this option can be omitted if only saving as PNG or SVG
						//backgroundColor: "rgb(255, 255, 255)",
						// onBegin: ??,
						onEnd: this._raiseEndEvent.bind(this)
					};

					this.signaturePad = new SignaturePad(this.signCanvas, oOptions);

					var that = this; //make the control resizable and redraw when something changed
					sap.ui.core.ResizeHandler.register(that, that._resizeCanvas.bind(this));

					//this.signaturePad.fromDataURL(sDataUrl, oOptions);
					this._resizeCanvas(this);
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