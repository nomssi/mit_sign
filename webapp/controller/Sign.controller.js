sap.ui.define([
	"./BaseController",
	"../model/formatter",
	"sap/ui/Device",
	"../model/Signature",
	"sap/m/MessageBox",
	"sap/ui/core/Fragment"
], function (
	BaseController,
	formatter,
	Device,
	Signature,
    MessageBox,	
	Fragment) {
	"use strict";

	return BaseController.extend("mit_sign.controller.Sign", {
		formatter : formatter,

		
		onInit: function () {

			this._wizard = this.byId("signWizard");
			this._oNavContainer = this.byId("wizardNavContainer");
			this._oWizardContentPage = this.byId("wizardContentPage");

	
			this._oView = this.getView();
			var oComponent = this.getOwnerComponent();
			this._router = oComponent.getRouter();
			this._router.getRoute("sign").attachPatternMatched(this._routePatternMatched, this);
			this._router.getRoute("signcompleted").attachMatched(this._routePatternMatched, this);

			this._oResourceBundle = oComponent.getModel("i18n").getResourceBundle();
			this._oHelper = new Signature(oComponent, this._oView);	
		},

		_routePatternMatched: function(oEvent) {
				
			var sVbeln = oEvent.getParameter("arguments").id;
			this._oHelper.bindVbelnTo(this.getView().getModel(),sVbeln,this);

            // which step? 
			// this._oHelper.clearSignature(this.sVbeln);    

            // last step   
			// var oPDF = this.byId("PDF");
			// oPDF.downloadPDF();
		},
		
		/**
		 * Always navigates back to home
		 * @override
		 */
		onBack: function () {
			this.getRouter().navTo("home");
		},
		
        onResetStep1: function() {
			this._oHelper.clearSignature(this.sVbeln);
	        this._wizard.invalidateStep(this.byId("signStep"));	
		},	
		
		onClearButton: function(){
			
			this._oHelper.clearSignature(this.sVbeln);
			this._wizard.invalidateStep(this.byId("signStep2"));	
			//this.byId("signature-pad").clear();
			//this.byId("sName").setValue("");
		},

		onSaveButton: function(){
			
			var fnAfterSave = function(oData){
				if(oData.PDFUrl !== ""){
					var step = this.byId("signStep2");
					step.setValidated(true);
				}
			}.bind(this);
			this._oHelper.saveSignature(this.sVbeln, fnAfterSave);
		},
		
		onCompleteSigning: function(){
			
			return false;
		},

		onCompleteStep1: function() {
			var oHelper = this._oHelper;
	        this._wizard.validateStep(this.byId("signStep"));	
			var fnAfterSave = function(oData){
				sap.m.MessageToast.show("Ausgeber hat unterschrieben");
			};	        
			oHelper.saveSignature(this.sVbeln, fnAfterSave);
		},	
		
		onInputChange: function(oEvent) {
			// Whenever the value of an input field is changed, the system must
			// update the product draft. For most of the fields, no specific
			// processing is required on the update of the product draft. onInputChange is the
			// change event defined in the XML view for such fields.
			var oField = oEvent.getSource();
			jQuery.sap.log.Level.TRACE(oField);
			
			// Workaround to ensure that both the supplier Id and Name are updated in the model before the
			// draft is updated, otherwise only the Supplier Name is saved to the draft and Supplier Id is lost
			setTimeout(function() {
				this._fieldChange(oField);
			}.bind(this), 0);
		},
		
		_fieldChange: function(oControl) {
			// Handler for a changed field that needs to be written to the draft.  This allows
			// specific processing for the "Change" event on the input fields, such as for numbers
			// to set empty to "0".
			//this._setDirty();
			// Removes previous error state
			//oControl.setValueState(ValueState.None);
			// Callback function in the event that saving draft is unsuccessful
			var fnSubmitDraftSuccess = function(sMessage) {
				if (sMessage && oControl) {
					oControl.setValueState("Error");
					oControl.setValueStateText(sMessage);
				}
			};
			this._oHelper.updateSignature(fnSubmitDraftSuccess);
		},
		
		optionalStepActivation: function () {
			sap.m.MessageToast.show("Unterschrift Step3 active.");
			sap.base.Log.info("Unterschrift Step3 active.");
		},

		optionalStepCompletion: function () {
			sap.m.MessageToast.show("Unterscrift Step3 completed.");
		}
	});
});