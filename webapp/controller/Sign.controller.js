sap.ui.define([
	"./BaseController",
	"../model/Signature",
	"../model/formatter",
	"sap/m/MessagePopover",
	"sap/m/MessagePopoverItem",
	"../util/messages"
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
				Releaser: {
					Name: "",
					Url: ""
				},
				Receiver: {
					Name: "",
					Url: ""
				}
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

		_routePatternMatched: function (oEvent) {

			var sVbeln = oEvent.getParameter("arguments").id;
			this._oHelper.bindVbelnTo(this.getView().getModel(), sVbeln, this);
			this._updateViewModel("/Vbeln", sVbeln);

			this._oMessageManager.removeAllMessages(); // reset potential server-side messages
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

		onSaveButton: function () {
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

			var fnAfterSave = function (oData) {
				if (oData.PDFUrl !== "") {
					var step = this.byId("signReceiverStep");
					step.setValidated(true);
				}
			}.bind(this);
			var oViewModel = this.getView().getModel("pdfView");
			this._oHelper.saveSignature(this.sVbeln, fnAfterSave, oViewModel);
		},

		oCompleteContent: function (oEvent) {

			return false;
		},

		oSignCommit: function (oEvent) {
			// Initiate COMMIT, PDF generation
			return false;
		},

		onSigningCompleted: function (oEvent) {

			// Button icon="sap-icon://accept"  press="onCorrectPathClick"
			// Add message - sVeln signed - OK ?
			// Initiate/Inform about send Mail
			var oViewModel = this.getView().getModel();
			oViewModel.setProperty("/Status", "1");

			this.getRouter().navTo("home");
			this._wizard.setCurrentStep(this.byId("contentStep"));
		},

		onSigningFailed: function (oEvent) {
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

		_updateViewModel: function (sProperty, vValue) {
			var oViewModel = this.getView().getModel("pdfView");
			// oViewModel.getProperty(ssProperty);
			oViewModel.setProperty(sProperty, vValue);
		},

		_getSignButtonSource: function (oEvent) {
			var oSignSource = {};

			var oReleaserBtn = this.byId("btnClear");
			var oReceiverBtn = this.byId("btnClear2");
			var oSource = oEvent.getSource();

			if (oSource === oReleaserBtn) {
				oSignSource = {
					step: this.byId("signReleaserStep"),
					pad: this.byId("signature-pad"), // Lager
					field: this.byId("sName"),
					property: "/Releaser>Url"
				};
			} else
			if (oSource === oReceiverBtn) {
				oSignSource = {
					step: this.byId("signReceiverStep"),
					pad: this.byId("signature-pad2"), // Empfänger
					field: this.byId("sRecvName"),
					property: "/Receiver>Url"
				};
			} else {
				oSignSource = undefined;
			};
			return oSignSource;
		},

		_getSignPadSource: function (oEvent) {
			var oSignSource = {};

			var oReleaserSignPad = this.byId("signature-pad"); // Ausgebender
			var oReceiverSignPad = this.byId("signature-pad2"); // Empfänger
			var oSource = oEvent.getSource();

			if (oSource === oReleaserSignPad) {
				oSignSource = {
					step: this.byId("signReleaserStep"),
					pad: oSource,
					field: this.byId("sName"),
					property: "/Releaser>Url"
				};
			} else
			if (oSource === oReceiverSignPad) {
				oSignSource = {
					step: this.byId("signReceiverStep"),
					pad: oSource,
					field: this.byId("sRecvName"),
					property: "/Receiver>Url"
				};
			} else {
				oSignSource = undefined;
			};
			return oSignSource;
		},

		_getSignInputSource: function (oEvent) {
			var oSignSource = {};

			var oReleaserName = this.byId("sName"); // Ausgebender
			var oReceiverName = this.byId("sRecvName"); // Empfänger
			var oSource = oEvent.getSource();

			if (oSource === oReleaserName) {
				oSignSource = {
					step: this.byId("signReleaserStep"),
					field: oSource,					
					pad: this.byId("signature-pad"), // Lager
					property: "/Releaser>Name"
				};
			} else
			if (oSource === oReceiverName) {
				oSignSource = {
					step: this.byId("signReceiverStep"),
					field: oSource,					
					pad: this.byId("signature-pad2"), // Empfänger
					property: "/Receiver>Name"
				};
			} else {
				oSignSource = undefined;
			};
			return oSignSource;
		},

		onClearButton: function (oEvent) {
			var oSource = this._getSignButtonSource(oEvent);

			if (oSource !== undefined) {
				this._updateViewModel(oSource.property, "");

				oSource.pad.clear();
				this._wizard.invalidateStep(oSource.step);
				this._wizard.setCurrentStep(oSource.step);
				// this._oHelper.clearSignature(this.sVbeln);
			}
		},

		onUndoButton: function (oEvent) {
			var oSource = this._getSignButtonSource(oEvent);

			if (oSource !== undefined) {
				this._updateViewModel(oSource.property, "");

				oSource.pad.undo();
				if (oSource.pad.isEmpty()) {
					// this._oHelper.clearSignature(this.sVbeln);
					this._wizard.invalidateStep(oSource.step);
					this._wizard.setCurrentStep(oSource.step);
				}
			}
		},
		
		onCompleteButton: function (oEvent) {
			var oReceiverName = this.byId("sRecvName");
			
			if ( oReceiverName.getValue().includes("RAC")) {
				this.getRouter().navTo("complete");
				this._wizard.setCurrentStep(this.byId("contentStep"));
			} else {
				this.getRouter().navTo("error");
				this._wizard.setCurrentStep(this.byId("contentStep"));
			}

		},

		removeMessageFromTarget: function (sTarget) {
			// clear potential server-side messages to allow saving the item again			
			this._oMessageManager.getMessageModel().getData().forEach(function (oMessage) {
				if (oMessage.target === sTarget) {
					this._oMessageManager.removeMessages(oMessage);
				}
			}.bind(this));
		},

		_popoverMessage: function (sMessage, sText, sType, sTarget) {
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

		_popoverInvalidField: function (oInput, sText, sTarget) {
			this._popoverMessage(this._oResourceBundle.getText(sText),
				oInput.getLabels()[0].getText(),
				sap.ui.core.MessageType.Error,
				sTarget);
		},
		
		_validateField: function (oInput, oStep) {
			var sTarget = oInput.getBindingContext().getPath() + "/" + oInput.getBindingPath("value");
			this.removeMessageFromTarget(sTarget);
			var sCurrentValue = oInput.getValue();
            
			if (!sCurrentValue) {
				oStep.setValidated(false);
				this._popoverInvalidField(oInput, "mandatory.field", sTarget);
			}
			else 
			{   // Valid entry according to RegEx: Letters, no number, Umlaut, space, .
				var isOK = /^[a-zA-ZäöüÄÖÜ ]+$/.test(oInput.getValue()); 

				if (!isOK) {
					oStep.setValidated(false);
				    this._popoverInvalidField(oInput, "invalid.Chars", sTarget);
				}
			}
		},

		_validateStep: function (oSignSource) {  
			oSignSource.step.setValidated(false);
			
			if (oSignSource.field.getValue() !== "" && !oSignSource.pad.isEmpty()) {
				oSignSource.step.setValidated(true);
			}
		},

		onInputChange: function (oEvent) {
			// Whenever the clear text name is changed in the input field, update the draft model and validate
			// onInputChange is the change event defined in the XML view.
			var oSource = this._getSignInputSource(oEvent);

			if (oSource !== undefined) {

				this._validateStep(oSource);
				this._updateViewModel(oSource.property, oSource.field.getValue());
				this._validateField(oSource.field, oSource.step);

				// Workaround to ensure that both the supplier Id and Name are updated in the model before the
				// draft is updated, otherwise only the Supplier Name is saved to the draft and Supplier Id is lost
				setTimeout(function () {
					this._fieldChange(oSource.field);
				}.bind(this), 0);
			}
		},
		
		onSignChange: function (oEvent) {
			var oSource = this._getSignPadSource(oEvent);

			if (oSource !== undefined) {
				
				this._validateStep(oSource);
				this._updateViewModel(oSource.property, oEvent.getParameter("value"));

				setTimeout(function () {
					this._fieldChange(oSource.pad);
				}.bind(this), 0);
			};
		},		

		onCompleteSignReceiverStep: function (oEvent) {

			// this._wizard.validateStep(this.byId("signReceiverStep"));	
			var fnAfterSave = function (oData) {
				if (oData.PDFUrl !== "") {
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
		    var oViewModel = this.getView().getModel("pdfView");
			this._oHelper.saveSignature(this.sVbeln, fnAfterSave, oViewModel);
		},

		_fieldChange: function (oControl) {
			// Handler for a changed field that needs to be written to the draft.  This allows
			// specific processing for the "Change" event on the input fields, such as for numbers
			// to set empty to "0".
			//this._setDirty();
			// Removes previous error state
			//oControl.setValueState(ValueState.None);
			// Callback function in the event that saving draft is unsuccessful
			var fnSubmitDraftSuccess = function (sMessage) {
				if (sMessage && oControl) {
					oControl.setValueState("Error");
					oControl.setValueStateText(sMessage);
				}
			};
			var oViewModel = this.getView().getModel("pdfView");
			this._oHelper.updateSignature(fnSubmitDraftSuccess, oViewModel);
		},

		optionalStepActivation: function () {
			this._popoverMessage(this.sVbeln,
			    this._oResourceBundle.getText("step3.active"),
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