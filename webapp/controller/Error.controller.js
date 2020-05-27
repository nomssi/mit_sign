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
		},

		_routePatternMatched: function (oEvent) {
			var sVbeln = oEvent.getParameter("arguments").id;
			this.bindVbelnTo(this.getModel(), sVbeln, this);
		},
		
		onActionPrint: function (oEvent) {
			var fnAfterTrigger = function () {
				MessageToast.show("Druck der Nachricht ZLD0 angestossen!");	
			};
			var fnOutputFailed = function () {
				MessageToast.show("Verarbeitung Nachricht ZLD0 konnte nicht gestartet werden");	
			};
			;
			var sVbeln = oEvent.getSource().getBindingContext().getProperty("VBELN");			
			this._oHelper.triggerOutput(sVbeln, fnAfterTrigger.bind(this), fnOutputFailed.bind(this));
		},
		
		onActionClose: function (oEvent) {
			MessageToast.show("Verarbeitung abschliessen... - Noch nicht implementiert!");
		}

	});
});