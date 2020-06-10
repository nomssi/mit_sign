/*global QUnit*/

sap.ui.define([
		"Signature/model/formatter"
	//	"test/unit/helper/FakeI18nModel",
	//	"sap/ui/thirdparty/sinon",
	//	"sap/ui/thirdparty/sinon-qunit"
	], function (Formatter, FakeI18n) {
		"use strict";

		QUnit.module("Lieferschein Number Format");
		
		QUnit.test("Should display with 2 decimals", function (assert) {
			var fnIsolatedFormatter = Formatter.float;

			assert.strictEqual(fnIsolatedFormatter("1.23344"), "1,23");
			assert.strictEqual(fnIsolatedFormatter("0.1"), "0,10");
		});
	}
);