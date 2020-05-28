sap.ui.define([
	"./BaseController",
	"../model/Signature",
	"sap/m/MessageToast"
], function (BaseController, Signature, MessageToast) {
	"use strict";

	return BaseController.extend("Signature.controller.Error", {

		onInit: function () {
			this.getRouter().getRoute("error").attachPatternMatched(this._routePatternMatched, this);

			this.initMessageManager(this);
			this._oHelper = new Signature(this.getOwnerComponent());
			this._oResourceBundle = this.getRessourceBundle(); // from BaseController
		},

		_routePatternMatched: function (oEvent) {
			var sVbeln = oEvent.getParameter("arguments").id;
			this.bindVbelnTo(this.getModel(), sVbeln, this);
		},

		onActionPrint: function (oEvent) {
			var fnAfterTrigger = function () {
				MessageToast.show(this._oResourceBundle.getText("print.triggered"));
			};
			var fnOutputFailed = function () {
				MessageToast.show(this._oResourceBundle.getText("print.failed"));
			};
			var sVbeln = oEvent.getSource().getBindingContext().getProperty("VBELN");
			this._oHelper.triggerOutput(sVbeln, fnAfterTrigger.bind(this), fnOutputFailed.bind(this));
		},

		onActionClose: function (oEvent) {
			var sVbeln = oEvent.getSource().getBindingContext().getProperty("VBELN");

			var fnAfterTrigger = function () {
				MessageToast.show(sVbeln + " " + this._oResourceBundle.getText("close.completed"));
			};
			var fnOutputFailed = function () {
				MessageToast.show(sVbeln + " " + this._oResourceBundle.getText("close.failed"));
			};

			var bActive = false;
			this._oHelper.updateSignature(sVbeln, bActive,
				fnAfterTrigger.bind(this), fnOutputFailed.bind(this));
		}

	});
});