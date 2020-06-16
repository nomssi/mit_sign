/*global QUnit*/

sap.ui.define([
	"Signature/model/formatter"
	//	"test/unit/helper/FakeI18nModel"
	//	"sap/ui/thirdparty/sinon",
	//	"sap/ui/thirdparty/sinon-qunit"
], function (Formatter) {
	"use strict";

	QUnit.module("Lieferschein Number Format");

	function numberUnitValueTestCase(assert, sValue, fExpectedNumber) {
		// Act
		var fNumber = Formatter.float(sValue);

		// Assert
		assert.strictEqual(fNumber, fExpectedNumber, "The rounding was correct");
	}

	QUnit.test("Should display with 2 decimals", function (assert) {
		numberUnitValueTestCase.call(this, assert, "1.23344", "1,23");
		numberUnitValueTestCase.call(this, assert, "0.1", "0,10");
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

	QUnit.test("Should round down a 3 digit number", function (assert) {
		numberUnitValueTestCase.call(this, assert, "3.123", "3,12");
	});

	QUnit.test("Should round up a 3 digit number", function (assert) {
		numberUnitValueTestCase.call(this, assert, "3.128", "3.13");
	});

	QUnit.test("Should round a negative number", function (assert) {
		numberUnitValueTestCase.call(this, assert, "-3", "-3,00");
	});

	QUnit.test("Should round an empty string", function (assert) {
		numberUnitValueTestCase.call(this, assert, "", "");
	});

	QUnit.test("Should round a zero", function (assert) {
		numberUnitValueTestCase.call(this, assert, "0", "0,00");
	});
});