sap.ui.define([
	"./BaseController"
], function (BaseController) {
	"use strict";
	
	return BaseController.extend("Signature.controller.Error", {
	
		onInit: function () {
			this.getRouter().getRoute("error").attachPatternMatched(this._routePatternMatched, this);
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