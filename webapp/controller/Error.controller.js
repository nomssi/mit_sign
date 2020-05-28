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

			var oComponent = this.getOwnerComponent();
			this._oHelper = new Signature(oComponent);
			this._oResourceBundle = oComponent.getModel("i18n").getResourceBundle();
		},

		_routePatternMatched: function (oEvent) {
			var sVbeln = oEvent.getParameter("arguments").id;
			this.bindVbelnTo(this.getModel(), sVbeln, this);
		},

		onActionPrint: function (oEvent) {
			var that = this;
			var fnAfterTrigger = function () {
				MessageToast.show(that._oResourceBundle.getText("print.triggered"));
			};
			var fnOutputFailed = function () {
				MessageToast.show(that._oResourceBundle.getText("print.failed"));
			};
			var sVbeln = oEvent.getSource().getBindingContext().getProperty("VBELN");
			this._oHelper.triggerOutput(sVbeln, fnAfterTrigger, fnOutputFailed);
		},

		onActionClose: function (oEvent) {
			var that = this;
			var sVbeln = oEvent.getSource().getBindingContext().getProperty("VBELN");

			var fnAfterTrigger = function () {
				MessageToast.show(sVbeln + " " + that._oResourceBundle.getText("close.completed"));
			};
			var fnOutputFailed = function () {
				MessageToast.show(sVbeln + " " + that._oResourceBundle.getText("close.failed"));
			};

			var bActive = false;
			this._oHelper.updateSignature(sVbeln, bActive,
				fnAfterTrigger, fnOutputFailed);
		}

	});
});