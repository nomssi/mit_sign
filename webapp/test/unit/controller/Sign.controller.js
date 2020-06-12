/*global QUnit */

sap.ui.define([
	"Signature/controls/SignaturePad",
	"Signature/controller/Sign.controller"
], function (Pad, Controller) {
	"use strict";

	QUnit.module("Module Sign Controller", {
		beforeEach: function () {
			// var oCanvas = document.querySelector("canvas[id=" + this.getId() + "]");
			var oCanvas = document.querySelector("canvas");
			this.oSignature = new Pad(oCanvas);
			this.oInput = new sap.m.Input({
				type: "Text",
				maxLength: 80,
				constraints: {
					type: "sap.ui.model.type.String",
					search: '^[a-zA-ZäöüÄÖÜÀ-ÿŠŒšœžŽŸ\\- ]+$'
				},
				showValueHelp: true,
				showSuggestion: true
			});
			this.oButton = new sap.m.Button({
				icon: "sap-icon://undo",
				text: "{i18n&gt;Clear}"
					// press: "onClearButton" 
			});
		},
		afterEach: function () {
			this.oSignature.destroy();
		}
	});

	QUnit.test("1. a basic Sign  example", 2, function (assert) {
		assert.ok(true, "this Sign test is fine");
		var value = "hello1";
		assert.equal(value, "hello1", "We expect value to be 'hello1'");
	});

});