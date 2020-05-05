sap.ui.define([
	"./BaseController"
], function (BaseController) {
	"use strict";
	
	return BaseController.extend("Signature.controller.Error", {
	
		onInit: function () {
			this.getRouter().getRoute("error").attachPatternMatched(this._routePatternMatched, this);
		},
		
		_routePatternMatched: function (oEvent) {
			var sVbeln = oEvent.getParameter("arguments").id;
			this.bindVbelnTo(this.getModel(), sVbeln, this);
		}
	});
});