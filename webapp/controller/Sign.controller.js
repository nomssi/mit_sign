sap.ui.define([
	"./BaseController",
	"../model/Signature",
	"../model/formatter",	
	"sap/m/MessageBox",
	"sap/base/Log",
	"sap/m/MessagePopover",
	"sap/m/MessagePopoverItem",	
	"sap/m/Link"
], function (
	BaseController,
	Signature,
	formatter,
    MessageBox,	
	Log,
	MessagePopover,
	MessagePopoverItem,
	Link) {
	"use strict";

	return BaseController.extend("mit_sign.controller.Sign", {

        formatter: formatter,
        
		onInit: function () {

			this._wizard = this.byId("signWizard");
			this._oNavContainer = this.byId("wizardNavContainer");
			this._oWizardContentPage = this.byId("wizardContentPage");

			this._oView = this.getView();
			
			// create a message manager and register the message model
			this._oMessageManager = sap.ui.getCore().getMessageManager();
			this._oMessageManager.registerObject(this._oView, true);
			this._oView.setModel(this._oMessageManager.getMessageModel(), "message");	
			
			//this._initViewPropertiesModel();
			var oComponent = this.getOwnerComponent();
			this._router = oComponent.getRouter();

			this._router.getRoute("sign").attachPatternMatched(this._routePatternMatched, this);
			this._router.getRoute("signcompleted").attachMatched(this._routePatternMatched, this);

			/*this._oApplicationProperties = oComponent.getModel("appProperties");
			this._oApplicationController = this._oApplicationProperties.getProperty("/applicationController");*/
			this._oResourceBundle = oComponent.getModel("i18n").getResourceBundle();
			this._oHelper = new Signature(oComponent, this._oView);		
			
			// View register Model for Draft handling
			this._oViewModel = new sap.ui.model.json.JSONModel({
				Vbeln: "",
				PDFurl: "",
				Releaser : { Name: "", Url: "" },
				Receiver : { Name: "", Url: "" }
				// Set binding 2 ways
			});
			this.setModel(this._oViewModel, "pdfView");
			
			
			/*this._router.getTarget("product").attachDisplay(function (oEvent) {
				this.fnUpdateProduct(oEvent.getParameter("data").productId);// update the binding based on products cart selection
			}, this);*/
			//Binding für die Signatur erstellen, am besten die Kopfdaten der Lieferung mit den zwei Feldern für die Signatur verknüpfen
			//so kann die Signatur als base64 an SAP gesendet werden und im nächsten schritt angezeigt werden
			
		},

		_routePatternMatched: function(oEvent) {
				
			var sVbeln = oEvent.getParameter("arguments").id;
			this._oHelper.bindVbelnTo(this.getView().getModel(),sVbeln,this);
			this._updateViewModel("/Vbeln", sVbeln);
			this._oMessageManager.removeAllMessages();   // reset potential server-side messages
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

		oCompleteContent: function(oEvent){
			
			return false;
		},
		
		oSignCommit: function(oEvent){
			// Initiate COMMIT, PDF generation
			return false;
		},
		
		onSigningCompleted: function(oEvent){

            // Button icon="sap-icon://accept"  press="onCorrectPathClick"
			// Add message - sVeln signed - OK ?
			// Initiate/Inform about send Mail
			
			this.getRouter().navTo("home");
			this._wizard.setCurrentStep(this.byId("contentStep"));
		},

		onSigningFailed: function(oEvent){
            // Initiate Error procedure  
			// Add message - sVeln signed - Error ?
			return false;
		},

		_updateViewModel : function(sProperty, vValue) {
			// this._oViewModel.getProperty(ssProperty);
			var oViewModel = this.getView().getModel("pdfView");
			oViewModel.setProperty(sProperty, vValue );
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
				this._updateViewModel("/Releaser>Url", "");
			} else
			if (oSource === oReceiverBtn) { 
				sSignPadId = "signature-pad2";  // Empfänger
				oStep = this.byId("signReceiverStep");
				this._updateViewModel("/Receiver>Url", "");				
			} else 
			{ return; }
			this._oHelper.clearSignature(this.sVbeln);
			this.byId(sSignPadId).clear();
			this._wizard.invalidateStep(oStep);	
			this._wizard.setCurrentStep(oStep);	  			
		},

		removeMessageFromTarget: function (sTarget) {
			// clear potential server-side messages to allow saving the item again			
			this._oMessageManager.getMessageModel().getData().forEach(function(oMessage){
				if (oMessage.target === sTarget) {
					this._oMessageManager.removeMessages(oMessage);
				}
			}.bind(this));
		},
		
		_handleRequiredField: function (oInput, oStep) {
			var sTarget = oInput.getBindingContext().getPath() + "/" + oInput.getBindingPath("value");

			this.removeMessageFromTarget(sTarget);

			if (!oInput.getValue()) {
				oStep.setValidated(false);
							 
				this._oMessageManager.addMessages(
					new sap.ui.core.message.Message({
						message: this._oResourceBundle.getText("mandatory.field"),
						type: sap.ui.core.MessageType.Error,
						additionalText: oInput.getLabels()[0].getText(),
						target: sTarget,
						processor: this._oView.getModel()
					})
				);
			}
		},

		onInputChange: function(oEvent) {
			// Whenever the value of an input field is changed, the system must
			// update the product draft. For most of the fields, no specific
			// processing is required on the update of the product draft. onInputChange is the
			// change event defined in the XML view for such fields.
			var oStep;		
			var sProperty;
			var oNameField = oEvent.getSource();
			var oReleaserName = this.byId("sName");      // Ausgebender
			var oReceiverName = this.byId("sRecvName");  // Empfänger

			if (oNameField === oReleaserName) {
				oStep = this.byId("signReleaserStep");
				sProperty = "/Releaser>Name";
			} else
			if (oNameField === oReceiverName) { 
				oStep = this.byId("signReceiverStep");
				sProperty = "/Receiver>Name";
			} else 
			{ return; }

			this._updateViewModel(sProperty, oNameField.value );

			this._handleRequiredField(oNameField, oStep);			

			// Workaround to ensure that both the supplier Id and Name are updated in the model before the
			// draft is updated, otherwise only the Supplier Name is saved to the draft and Supplier Id is lost
			setTimeout(function() {
				this._fieldChange(oNameField);
			}.bind(this), 0);
		},
		
		onSignChange: function(oEvent) {
			var oStep;
			var oField;
			var sProperty;
			var sUrl = oEvent.getParameter("value");

			var oSignPad = oEvent.getSource();
			var oReleaserSignPad = this.byId("signature-pad");   // Ausgebender
			var oReceiverSignPad = this.byId("signature-pad2");  // Empfänger

			if (oSignPad === oReleaserSignPad) {
				oStep = this.byId("signReleaserStep");
				oField = this.byId("sName");
				sProperty = "/Releaser>Url";
			} else
			if (oSignPad === oReceiverSignPad) { 
				oField = this.byId("sRecvName");
				oStep = this.byId("signReceiverStep");
				sProperty = "/Receiver>Url";
			} else 
			{ return; }

			this._updateViewModel(sProperty, sUrl );

           if (oField.getValue() !== ""){
			 oStep.setValidated(true);
	       }

			setTimeout(function() {
				this._fieldChange(oField);
			}.bind(this), 0);
		},
		
		onCompleteSignReceiverStep: function(oEvent) {

	        // this._wizard.validateStep(this.byId("signReceiverStep"));	
			var fnAfterSave = function(oData){
				if(oData.PDFUrl !== ""){
					sap.m.MessageToast.show("PDF created.");
				}
			};	        
			sap.m.MessageToast.show("Unterschriften speichern");
			this._oHelper.saveSignature(this.sVbeln, fnAfterSave);
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
		},
		
		/**
		 * Only validation on client side, does not involve a back-end server.
		 * @param {sap.ui.base.Event} oEvent Press event of the button to display the MessagePopover
		 * From: openui5/src/sap.m/test/sap/m/demokit/cart/webapp/
		 */
		handleMessagePopoverPress: function (oEvent) {
			var oButton = oEvent.getSource();

			var oLink = new Link({
				text: "Allgemeine Informationen anzeigen",
				href: "http://eins.de",
				target: "_blank"
			});

			/**
			 * Gather information that will be visible on the MessagePopover
			 */
			var oMessageTemplate = new MessagePopoverItem({
				type: "{message>type}",
				title: "{message>message}",
				subtitle: "{message>additionalText}",
				// activeTitle: "{message>active}",
				// description: '{message>description}',
				link: oLink
			});


			if (!this.byId("errorMessagePopover")) {
				var oMessagePopover = new MessagePopover(this.createId("messagePopover"), {
					items: {
						path: "message>/",
						template: oMessageTemplate
					},
					afterClose: function () {
						oMessagePopover.destroy();
					}
				});
				this._addDependent(oMessagePopover);
			}

			oMessagePopover.openBy(oButton);
		},		

		//To be able to stub the addDependent function in unit test, we added it in a separate function
		_addDependent: function (oMessagePopover) {
			this.getView().addDependent(oMessagePopover);
		}
		
	});		
});