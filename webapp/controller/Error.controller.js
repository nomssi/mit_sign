sap.ui.define([
	"./BaseController"
], function (BaseController) {
	"use strict";
	
	return BaseController.extend("Signature.controller.Error", {
	
		/**
		 * Always navigates back to home
		 * @override
		 */
		onBack: function () {
			this.getRouter().navTo("home");
	
		}
	});
});
