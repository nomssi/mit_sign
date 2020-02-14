sap.ui.define([
	"./BaseController",
	"../model/formatter",
	"sap/ui/Device",
	"../model/Signature"
], function (
	BaseController,
	formatter,
	Device,
	Signature) {
	"use strict";

	return BaseController.extend("mit_sign.controller.Step1", {
		formatter : formatter,

		onInit: function () {
			this._oView = this.getView();

			var oComponent = this.getOwnerComponent();
			this._router = oComponent.getRouter();
			this._router.getRoute("sign").attachPatternMatched(this._routePatternMatched, this);

			this._oResourceBundle = oComponent.getModel("i18n").getResourceBundle();
			this._oHelper = new Signature(this.getOwnerComponent(), this.getView());			
		},
		
		_routePatternMatched: function(oEvent) {
			
			var sVbeln = oEvent.getParameter("arguments").id,
				oView = this.getView(),
				oModel = oView.getModel();

			this.sVbeln = sVbeln;
			
			//ToDo in oHelper auslagern
			
			var oModel = this.getModel();

		
			// the binding should be done after insuring that the metadata is loaded successfully
			oModel.metadataLoaded().then(function () {
				
				var sPath = "/" + this.getModel().createKey("Events", {
						VBELN: sVbeln
					});
				oView.bindElement({
					path : sPath,
					events: {
						dataRequested: function () {
							oView.setBusy(true);
						},
						dataReceived: function () {
							oView.setBusy(false);
						}
					}
				});
				var oData = oModel.getData(sPath);
				
				//if there is no data the model has to request new data
				if (!oData) {
					oView.setBusyIndicatorDelay(0);
					oView.getElementBinding().attachEventOnce("dataReceived", function() {
						// reset to default
						oView.setBusyIndicatorDelay(null);
						//this._checkIfProductAvailable(sPath);
					});
				}
				
				
				
			}.bind(this));
			
			this._oHelper.clearSignature(this.sVbeln);
		},
		
		onNext: function(){
			this._router.navTo("step2",{id:this.sVbeln});
		},
		
		onNav: function(){
			this._router.navTo("home");
		}
		
	});
});