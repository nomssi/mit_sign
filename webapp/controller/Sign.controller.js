sap.ui.define([
	"./BaseController",
	"../model/Signature",
	"../model/formatter",	
	"sap/m/MessagePopover",
	"sap/m/MessagePopoverItem",	
	"../reuse/util/messages"
], function (
	BaseController,
	Signature,
	formatter,
	MessagePopover,
	MessagePopoverItem,
	Messages) {
	"use strict";

	return BaseController.extend("Signature.controller.Sign", {

        formatter: formatter,
        
		onInit: function () {
			
            this._oLink = Messages.createDefaultLink();
            
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
			
			
			//Binding für die Signatur erstellen, am besten die Kopfdaten der Lieferung mit den zwei Feldern für die Signatur verknüpfen
			//so kann die Signatur als base64 an SAP gesendet werden und im nächsten schritt angezeigt werden
			
		},

		exit: function () {
			this._oHelper.destroy();
			this._oViewModel.destroy();
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
			var oViewModel = this.getView().getModel();
			oViewModel.setProperty("/Status", "1");
			
			this.getRouter().navTo("home");
			this._wizard.setCurrentStep(this.byId("contentStep"));
		},

		onSigningFailed: function(oEvent){
            // Initiate Error procedure  
			var oViewModel = this.getView().getModel();
			oViewModel.setProperty("/Status", "2");
			
			// Add message - sVeln signed - Error ?
			this._popoverMessage(this.sVbeln, 
			    		         "Fehler bei der PDF Anzeige.", 
			                	 sap.ui.core.MessageType.Error, 
			                	 this._oLink);			
			return false;
		},

		_updateViewModel : function(sProperty, vValue) {
			var oViewModel = this.getView().getModel("pdfView");
			// oViewModel.getProperty(ssProperty);
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
		
		onUndoButton: function(oEvent){
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

			this.byId(sSignPadId).undo();
			
			var oSignPad = this.byId(sSignPadId);
			
			if (oSignPad.isEmpty()) {
				this._oHelper.clearSignature(this.sVbeln);
				this._wizard.invalidateStep(oStep);
				this._wizard.setCurrentStep(oStep);
			}
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

	        if (oField.getValue() !== "" && !oSignPad.isEmpty() ){
	     		 oStep.setValidated(true);
	        }				

			this._updateViewModel(sProperty, sUrl );

			setTimeout(function() {
				this._fieldChange(oField);
			}.bind(this), 0);
		},

		removeMessageFromTarget: function (sTarget) {
			// clear potential server-side messages to allow saving the item again			
			this._oMessageManager.getMessageModel().getData().forEach(function(oMessage){
				if (oMessage.target === sTarget) {
					this._oMessageManager.removeMessages(oMessage);
				}
			}.bind(this));
		},
		
		_popoverMessage: function(sMessage, sText, sType, sTarget) {
			this._oMessageManager.addMessages(
				new sap.ui.core.message.Message({
					message: sMessage,
					type: sType,
					additionalText: sText,
					target: sTarget,
					processor: this._oView.getModel()
				})
			);	
		},
		
		_handleRequiredField: function (oInput, oStep) {
			var sTarget = oInput.getBindingContext().getPath() + "/" + oInput.getBindingPath("value");

			this.removeMessageFromTarget(sTarget);

			if (!oInput.getValue()) {
				oStep.setValidated(false);
				
				this._popoverMessage(this._oResourceBundle.getText("mandatory.field"), 
				    		         oInput.getLabels()[0].getText(), 
				                	 sap.ui.core.MessageType.Error, 
				                	 sTarget);
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
		
		onCompleteSignReceiverStep: function(oEvent) {

	        // this._wizard.validateStep(this.byId("signReceiverStep"));	
			var fnAfterSave = function(oData){
				if(oData.PDFUrl !== ""){
					this._popoverMessage(this.sVbeln, 
					    		         "PDF created.", 
					                	 sap.ui.core.MessageType.Success, 
					                	 this._oLink);
				}
			};	        
			this._popoverMessage(this.sVbeln, 
			    		         "Unterschriften speichern", 
			                	 sap.ui.core.MessageType.Information, 
			                	 this._oLink);
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
			this._popoverMessage(this.sVbeln, 
			    		         "Unterschrift Step3 active.", 
			                	 sap.ui.core.MessageType.Information, 
			                	 this._oLink);
		},

		optionalStepCompletion: function () {
			this._popoverMessage(this.sVbeln, 
			    		         "Unterschrift Step3 completed.", 
			                	 sap.ui.core.MessageType.Information, 
			                	 this._oLink);
		},
		
		/**
		 * Only validation on client side, does not involve a back-end server.
		 * @param {sap.ui.base.Event} oEvent Press event of the button to display the MessagePopover
		 * From: openui5/src/sap.m/test/sap/m/demokit/cart/webapp/
		 */
		handleMessagePopoverPress: function (oEvent) {
			var oButton = oEvent.getSource();

			/**
			 * Gather information that will be visible on the MessagePopover
			 */
			var oMessageTemplate = new MessagePopoverItem({
				type: "{message>type}",
				title: "{message>message}",
				subtitle: "{message>additionalText}",
				// activeTitle: "{message>active}",
				// description: '{message>description}',
				link: this._oLink
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