sap.ui.define([
	"sap/ui/core/message/Message",
	"sap/ui/core/library",
	"./BaseController"
], function (Message, coreLibrary, BaseController) {
	"use strict";

	return BaseController.extend("Signature.controller.Error", {

		onInit: function () {
			this.getRouter().getRoute("error").attachPatternMatched(this._routePatternMatched, this);

			this.initMessageManager(this);
		},

		_routePatternMatched: function (oEvent) {
			var sVbeln = oEvent.getParameter("arguments").id;
			this.bindVbelnTo(this.getModel(), sVbeln, this);
		}

	});
});