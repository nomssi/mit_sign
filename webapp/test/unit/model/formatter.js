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
		
		QUnit.test("Validate input 'Jacques Nomssi'", 1, function (assert) {
			var oExpected = {
				errorId: "",
				state: "None",
				valid: true
			};
			var oState = Formatter.validateInput("Jacques Nomssi");
	
			assert.deepEqual(oState, oExpected, "We expect 'Jacques Nomssi' to be valid");
		});

		QUnit.test("Invalid input 'Jacques Nomssi Jr.'", 1, function (assert) {
			var oExpected = {
				errorId: "invalid.Chars",
				state: "Error",
				valid: false
			};
			var oState = Formatter.validateInput("Jacques Nomssi Jr.");
	
			assert.deepEqual(oState, oExpected, "We expect 'Jacques Nomssi Jr.' to be invalid");
		});
		
	}
);