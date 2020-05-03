sap.ui.define([
	"./BaseController"
], function (BaseController) {
	"use strict";
	
	return BaseController.extend("Signature.controller.Complete", {
	
		/**
		 * Always navigates back to home
		 * @override
		 */
		onBack: function () {
			this.getRouter().navTo("home");
		},
		
		onInit: function () {
			this.getRouter().getRoute("complete").attachPatternMatched(this._routePatternMatched, this);
		},
		
		_routePatternMatched: function (oEvent) {
			var that = this;
			var sVbeln = oEvent.getParameter("arguments").id;

			// var sObjectPath = "/id/" + sVbeln;
			var sObjectPath = "/" + that.getModel().createKey("Events", {
					VBELN: sVbeln
				});			
			this.getView().bindElement(sObjectPath);
		}
	});
});