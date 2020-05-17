sap.ui.define([
	"sap/ui/core",
	"Signature/controls/SignaturePad"
], function (Core, Signature) {
	"use strict";

	QUnit.module("Signature Pad", {
		beforeEach: function () {
			this.oSignature = new Signature(this.getOwnerComponent());
		},
		afterEach: function () {
			this.oSignature.destroy();
		}
	});

	QUnit.test(" Should see a Signature canvas", function (assert) {
		var oSignature = sap.ui.getCore().byId("signature-pad");
		assert.ok(oSignature, "SignaturePad Instance was created");
	});

});