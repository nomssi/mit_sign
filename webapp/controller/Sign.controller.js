sap.ui.define([
	"./BaseController",
	"../model/formatter",
	"sap/ui/Device",
	"../model/Signature",
	"sap/m/MessageBox",
	"sap/ui/core/Fragment",
	"sap/base/Log"
], function (
	BaseController,
	formatter,
	Device,
	Signature,
    MessageBox,	
	Fragment,
	Log) {
	"use strict";

	return BaseController.extend("mit_sign.controller.Sign", {
		formatter : formatter,

		onInit: function () {

			this._wizard = this.byId("signWizard");
			this._oNavContainer = this.byId("wizardNavContainer");
			this._oWizardContentPage = this.byId("wizardContentPage");

/*
			Fragment.load({
				name: "sap.m.sample.Wizard.view.ReviewPage",
				controller: this
			}).then(function (oWizardReviewPage) {
				this._oWizardReviewPage = oWizardReviewPage;
				this._oNavContainer.addPage(this._oWizardReviewPage);
			}.bind(this));
*/

	
			this._oView = this.getView();
			//this._initViewPropertiesModel();
			var oComponent = this.getOwnerComponent();
			this._router = oComponent.getRouter();
			this._router.getRoute("sign").attachPatternMatched(this._routePatternMatched, this);
			this._router.getRoute("signcompleted").attachMatched(this._routePatternMatched, this);

			/*this._oApplicationProperties = oComponent.getModel("appProperties");
			this._oApplicationController = this._oApplicationProperties.getProperty("/applicationController");*/
			this._oResourceBundle = oComponent.getModel("i18n").getResourceBundle();
			this._oHelper = new Signature(oComponent, this._oView);		
			
			this._sValidPath = sap.ui.require.toUrl("sap/m/sample/PDFViewerEmbedded") + "/sample.pdf";
			this._sInvalidPath = sap.ui.require.toUrl("sap/m/sample/PDFViewerEmbedded") + "/sample_nonexisting.pdf";
			this._oModel = new sap.ui.model.json.JSONModel({
				Vbeln: "",
				sReleaserUrl : this._sInvalidPath,
				sReceiverUrl: this._sInvalidPath
			});
			this._oView.setModel(this._oModel, "PDFModel");
			
			/*this._router.getTarget("product").attachDisplay(function (oEvent) {
				this.fnUpdateProduct(oEvent.getParameter("data").productId);// update the binding based on products cart selection
			}, this);*/
			//Binding für die Signatur erstellen, am besten die Kopfdaten der Lieferung mit den zwei Feldern für die Signatur verknüpfen
			//so kann die Signatur als base64 an SAP gesendet werden und im nächsten schritt angezeigt werden
		},

		_routePatternMatched: function(oEvent) {
				
			var sVbeln = oEvent.getParameter("arguments").id;
			this._oHelper.bindVbelnTo(this.getView().getModel(),sVbeln,this);

		},

		/**
		 * Always navigates back to home
		 * @override
		 */
		onBack: function () {
			this.getRouter().navTo("home");

			// var oWizard = this.byId("signWizard");
			//oWizard.setCurrentStep(this.byId("contentStep"));
			this._wizard.setCurrentStep(this.byId("contentStep"));
		},

		onSaveButton: function(){
			//var oHelper = this._oHelper;

			/*var fnSave = function(oBlob){
				console.log(oBlob);
		    	var r = new Response(oBlob);
		    	console.log(r.text());&nbsp;
		    	var u = URL.createObjectURL(oBlob);
		    	console.log(u);
		    	
		    	var fnSubmitDraftSuccess = function(sMessage) {
					if (sMessage && oControl) {
						oControl.setValueState("Error");
						oControl.setValueStateText(sMessage);
					}
				};
				var data = {
						
				}
				oHelper.saveSignature(fnSubmitDraftSuccess);
		    	
			}.bind(this);
			
			var oCtrl = this.byId("signature-pad");
			oCtrl.getSignature(fnSave);*/

			var fnAfterSave = function(oData){
				if(oData.PDFUrl !== ""){
					var step = this.byId("signReceiverStep");
					step.setValidated(true);
				}
			}.bind(this);
			this._oHelper.saveSignature(this.sVbeln, fnAfterSave);
		},
		
		onCompleteSigning: function(){
			
			return false;
		},

		onClearButton: function(oEvent){
			var sSignPadId;
			var oStep;
			
			var oSource = oEvent.getSource();
			var oReleaserBtn = this.byId("btnClear");
			var oReceiverBtn = this.byId("btnClear2");
			if (oSource === oReleaserBtn) {
				sSignPadId = "signature-pad";   // Ausgebender
				oStep = this.byId("signReleaserStep");
				this._oModel.sReleaserUrl = "";
			} else
			if (oSource === oReceiverBtn) { 
				sSignPadId = "signature-pad2";  // Empfänger
				oStep = this.byId("signReceiverStep");
				this._oModel.sReceiverUrl = "";
			} else 
			{ return; }
			this._oHelper.clearSignature(this.sVbeln);
			this.byId(sSignPadId).clear();
			this._wizard.invalidateStep(oStep);	
			this._wizard.setCurrentStep(oStep);	  			
		},

		onSignChange: function(oEvent, vUrl) {
			var oStep;
			var oField;

			var oSignPad = oEvent.getSource();
			var oReleaserSignPad = this.byId("signature-pad");   // Ausgebender
			var oReceiverSignPad = this.byId("signature-pad2");  // Empfänger

			if (oSignPad === oReleaserSignPad) {
				oStep = this.byId("signReleaserStep");
				oField = this.byId("sName");
				this._oModel.setProperty("ReleaseUrl", vUrl);
			} else
			if (oSignPad === oReceiverSignPad) { 
				oField = this.byId("sRecvName");
				oStep = this.byId("signReceiverStep");
				this._oModel.setProperty("ReceiverUrl", vUrl);		
			} else 
			{ return; }

           if (oField.getValue() !== ""){
			 oStep.setValidated(true);
	       }

			setTimeout(function() {
				this._fieldChange(oField);
			}.bind(this), 0);
		},

		onCompleteSignReleaserStep: function() {
			var vReleaseUrl = this._oModel.getProperty("ReleaserUrl");
			var oReleaserSignPad = this.byId("signature-pad"); 
		    this._oModel.ReleaserUrl = oReleaserSignPad.value;
		    this._wizard.validateStep(this.byId("signReleaserStep"));
		},	
		
		onCompleteSignReceiverStep: function(vValue) {
			var vReceiverUrl = this._oModel.getProperty("ReceiverUrl");

	        this._wizard.validateStep(this.byId("signReceiverStep"));	
			var fnAfterSave = function(oData){
				if(oData.PDFUrl !== ""){
					sap.m.MessageToast.show("PDF created.");
				}
			};	        
			sap.m.MessageToast.show("Unterschriften speichern");
			this._oHelper.saveSignature(this.sVbeln, fnAfterSave);
		},	
		
		onInputChange: function(oEvent) {
			// Whenever the value of an input field is changed, the system must
			// update the product draft. For most of the fields, no specific
			// processing is required on the update of the product draft. onInputChange is the
			// change event defined in the XML view for such fields.
			var oField = oEvent.getSource();
			Log.trace(oField);
			
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