sap.ui.define([
	"./BaseController"
], function (BaseController) {
	"use strict";

	return BaseController.extend("Signature.controller.Complete", {

		onInit: function () {
			// base component's init function
			// BaseController.prototype.init.apply(this, arguments);

			this.getRouter().getRoute("complete").attachPatternMatched(this._routePatternMatched, this);

			this.initMessageManager(this);
		},

		_routePatternMatched: function (oEvent) {
			var sVbeln = oEvent.getParameter("arguments").id;
			this.bindVbelnTo(this.getModel(), sVbeln, this);
		}
	});
});