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

			this._oResourceBundle = oComponent.getModel("i18n").getResourceBundle();
			this._oHelper = new Signature(oComponent,this._oView);	
			
			this._router = oComponent.getRouter();
			this._router.getRoute("sign").attachPatternMatched(this._routePatternMatched, this);
		},
		
		_routePatternMatched: function(oEvent) {
			
			var sVbeln = oEvent.getParameter("arguments").id;
			this._oHelper.bindVbelnTo(this.getView().getModel(),sVbeln,this);
			
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