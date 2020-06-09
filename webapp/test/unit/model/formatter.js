/*global QUnit*/

sap.ui.define([
		"Signature/model/formatter"
	//	"test/unit/helper/FakeI18nModel",
	//	"sap/ui/thirdparty/sinon",
	//	"sap/ui/thirdparty/sinon-qunit"
	], function (formatter, FakeI18n) {
		"use strict";

		QUnit.module("Number Format");
		
		QUnit.test("Should display with 2 decimals", function (assert) {
			var sIsolatedFormatter = formatter.float("1.2334");

			assert.strictEqual(sIsolatedFormatter("1.23344"), "1.20");
			assert.strictEqual(sIsolatedFormatter("0.1"), "0.10");
		});
	}
);