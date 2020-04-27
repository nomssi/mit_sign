sap.ui.define([
	"sap/ui/core",
	"Signature/controls/SignaturePad"
], function (Core, Signature) {
	"use strict";

	QUnit.module("Signature Pad", {
		beforeEach: function () {
			var oComponent = this.getOwnerComponent();
			var oView = this.getView();
			this.oSignature = new Signature(oComponent, oView);
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