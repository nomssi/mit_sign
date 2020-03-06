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

	return BaseController.extend("mit_sign.controller.Step3", {
		formatter : formatter,

		onInit: function () {
			this._oView = this.getView();

			var oComponent = this.getOwnerComponent();
			this._router = oComponent.getRouter();
			this._router.getRoute("step3").attachPatternMatched(this._routePatternMatched, this);

			this._oResourceBundle = oComponent.getModel("i18n").getResourceBundle();
			this._oHelper = new Signature(this.getOwnerComponent(), this.getView());			
		},
		
		_routePatternMatched: function(oEvent) {
			
			var sVbeln = oEvent.getParameter("arguments").id;
			this._oHelper.bindVbelnTo(this.getModel(), sVbeln, this);	
			
			var oPDF = this.byId("PDF");
			oPDF.downloadPDF();
		},
		
		onNav: function(){
			this._router.navTo("home");
		}
	});
});