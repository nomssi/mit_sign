/*global QUnit, opaTest*/

jQuery.sap.require("sap.ui.qunit.qunit-css");
jQuery.sap.require("sap.ui.thirdparty.qunit");

QUnit.config.autostart = false;

sap.ui.require([
	"sap/ui/test/opaQunit",
	"sap/ui/test/Opa5",
	"../../localService/mockserver",
	"../opaQunit",
	"./pages/App"
], function (mockserver) {
	"use strict";

	QUnit.module("Navigation");

    sap.ui.test.Opa5.extendConfig({  });
    
    // second we will write opaTests
	opaTest("Should open the Home page", function (Given, When, Then) {
	    
    	// Qunit.start();
		
		// initialize the mock server
		mockserver.init();

		// Arrangements
		Given.iStartMyApp({
			componentConfig: {
				name: "Signature"
			}
		});

		//Actions
		When.onTheHomePage.iPressTheFirstEvent();

		// Assertions
		Then.onTheSignPage.iShouldSeeTheOverview();

		// Cleanup
		Then.iTeardownMyApp();
	});
});
