sap.ui.define([
	"Signature/controls/SignaturePad"
], function (Signature) {
	"use strict";

	QUnit.module("Signature Pad", {
		beforeEach: function () {
			// var oCanvas = document.querySelector("canvas[id=" + this.getId() + "]");
			var oCanvas = document.querySelector("canvas");
						
			this.oSignature = new Signature(oCanvas);
		},
		afterEach: function () {
			this.oSignature.destroy();
		}
	});

	QUnit.test(" Should see a Signature canvas", function (assert) {
	//	var oSignature = sap.ui.getCore().byId("signature-pad");
		assert.ok(this.oSignature, "SignaturePad Instance was created");
	});

});