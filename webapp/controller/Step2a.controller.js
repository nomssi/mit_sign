sap.ui.define([
	"./BaseController",
	"../model/formatter",
	"sap/ui/Device",
	"../model/Signature",
	"sap/m/MessageToast"
], function (
	BaseController,
	formatter,
	Device,
	Signature,
	MessageToast) {
	"use strict";

	return BaseController.extend("mit_sign.controller.Step2a", {
		formatter : formatter,

		onInit: function () {
			this._oView = this.getView();

			var oComponent = this.getOwnerComponent();
			this._router = oComponent.getRouter();
			this._router.getRoute("step2a").attachPatternMatched(this._routePatternMatched, this);

			this._oResourceBundle = oComponent.getModel("i18n").getResourceBundle();
			this._oHelper = new Signature(this.getOwnerComponent(), this.getView());			
		},
		
		_routePatternMatched: function(oEvent) {
			
			var sVbeln = oEvent.getParameter("arguments").id;
			this._oHelper.bindVbelnTo(this.getView().getModel(), sVbeln, this);	
			
		},
		
		onNext: function(){
			this._router.navTo("step3",{id:this.sVbeln});
		},
		
		onClearButton: function(){
			
			this._oHelper.clearSignature(this.sVbeln);
			//this.byId("signature-pad").clear();
			//this.byId("sName").setValue("");
			
		},
		
		onSaveButton: function(){
			// var oHelper = this._oHelper;

			var fnAfterSave = function(oData){
				if(oData.PDFUrl !== ""){
					MessageToast.show("PDF erzeugt");
				}
			};
			this._oHelper.saveSignature(this.sVbeln, fnAfterSave);
		},
		
		onNav: function(){
			this._router.navTo("home");
		}
		
	});
});