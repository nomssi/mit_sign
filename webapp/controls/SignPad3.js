sap.ui.define(
	["sap/ui/core/Control"],
	function (Control) {
		"use strict";
		return Control.extend("mit_sign.controls.SignPad", {
			signaturePad: null,
			// Adjust canvas coordinate space taking into account pixel ratio,
			// to make it look crisp on mobile devices.
			// This also causes canvas to be cleared.
			resizeCanvas: function resizeCanvas() {
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
			activate: function () {
				var canvas = document.querySelector("canvas");
				try {
					this.signaturePad = new SignaturePad(canvas);
				} catch (e) {
					jQuery.sap.lg.Level.ERROR(e);
				}
			},
			clear: function () {
				if (this.signaturePad)
					this.signaturePad.clear();
				else
					jQuery.sap.lg.Level.ERROR("signaturePad not initialized, did you called activate method?");
			},
			export: function () {
				return this.signaturePad.toDataURL();
			},
			metadata: {
				properties: {
					"width": {
						type: "sap.ui.core.CSSSize",
						defaultValue: "300px"
					},
					"height": {
						type: "sap.ui.core.CSSSize",
						defaultValue: "100px"
					},
					"thickness": {
						type: "int",
						defaultValue: 2
					},
					"bgcolor": {
						type: "sap.ui.core.CSSColor",
						defaultValue: "lightgrey"
					},
					"signcolor": {
						type: "sap.ui.core.CSSColor",
						defaultValue: "black"
					}
				}
			},

			renderer: function (oRm, oControl) {
				var thickness = parseInt(oControl.getProperty("thickness"), 10);
				oRm.write("<div");
				oRm.writeControlData(oControl); // writes the Control ID and enables event handling - important!
				oRm.addStyle("width", oControl.getProperty("width")); // write the Control property size; the Control has validated it to be a CSS size
				oRm.addStyle("height", oControl.getProperty("height"));
				oRm.addStyle("background-color", oControl.getProperty("bgcolor"));
				oRm.writeStyles();
				//oRm.addClass("rpb");        // add a CSS class for styles common to all control instances
				oRm.writeClasses(); // this call writes the above class plus enables support for Square.addStyleClass(...)
				oRm.write(">");
				//TODO Write a canvas
				oRm.write("<canvas width='" + oControl.getProperty("width") + "' " +
					"height='" + oControl.getProperty("height") + "'");
				oRm.writeControlData(oControl); // writes the Control ID and enables event handling - important!
				oRm.addStyle("width", oControl.getProperty("width")); // write the Control property size; the Control has validated it to be a CSS size
				oRm.addStyle("height", oControl.getProperty("height"));
				oRm.writeStyles();
				oRm.write("></canvas>");
				oRm.write("</div>");
			}
		});
		window.signaturePad = new mit_sign.controls.SignPad3.signature({
			width: "400px",
			thickness: 14,
			bgcolor: "lightblue",
			signcolor: "blue"
		}).placeAt("signature");
		setTimeout(function () {
			window.signaturePad.activate();
		}, 1000);

		$("#export").click(function () {
			if (window.signaturePad) {
				window.open(window.signaturePad.export());
			}
		});

		$("#clear").click(function () {
			window.signaturePad.clear();
		});

		$("#inline").click(function () {
			if (window.signaturePad) {
				$("#signed").attr("src", window.signaturePad.export());
			}
		});

		//Handle retina devices
		window.onresize = window.signaturePad.resizeCanvas;
		window.signaturePad.resizeCanvas();

	}
);