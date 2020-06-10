/*global QUnit */

sap.ui.define([
], function (Core) {
	"use strict";

        QUnit.module("Module Sign Controller"); 

        QUnit.test("1. a basic Sign  example", 2, function (assert) {
                assert.ok(true, "this Sign test is fine"); 
                var value = "hello1"; 
                assert.equal(value, "hello1", "We expect value to be 'hello1'"); 
        });
  
});		