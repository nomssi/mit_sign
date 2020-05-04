sap.ui.define([
	"./BaseController"
], function (BaseController) {
	"use strict";

	return BaseController.extend("Signature.controller.Complete", {

		onInit: function () {
			this.getRouter().getRoute("complete").attachPatternMatched(this._routePatternMatched, this);
		},

		_routePatternMatched: function (oEvent) {
			var sVbeln = oEvent.getParameter("arguments").id;
			var oView = this.getView();
			var oModel = this.getModel();

			// the binding should be done after insuring that the metadata is loaded successfully
			oModel.metadataLoaded().then(function () {

				var sObjectPath = "/" + this.getModel().createKey("Events", {
					VBELN: sVbeln
				});
				oView.bindElement({
					path: sObjectPath,
					events: {
						dataRequested: function () {
							oView.setBusy(true);
						},
						dataReceived: function () {
							oView.setBusy(false);
						}
					}
				});
				var oData = oModel.getData(sObjectPath);

				//if there is no data the model has to request new data
				if (!oData) {
					oView.setBusyIndicatorDelay(0);
					oView.getElementBinding().attachEventOnce("dataReceived", function () {
						// reset to default
						oView.setBusyIndicatorDelay(null);
						//this._checkIfProductAvailable(sPath);
					}.bind(this));
				}

			}.bind(this));

		}
	});
});