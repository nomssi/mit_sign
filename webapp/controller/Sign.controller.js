sap.ui.define([
	"./BaseController",
	"../model/Signature",
	"../model/formatter",
	"sap/m/MessagePopover",
	"sap/m/MessagePopoverItem",
	"../util/messages",
	"sap/ui/core/Fragment",
	"sap/ui/model/Filter"
], function (
	BaseController,
	Signature,
	formatter,
	MessagePopover,
	MessagePopoverItem,
	Messages,
	Fragment,
	Filter) {
	"use strict";

	return BaseController.extend("Signature.controller.Sign", {

		formatter: formatter,

		exit: function () {
			this._oHelper.destroy();
			this._oViewModel.destroy();
		},

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

			// this._initViewPropertiesModel();
			var oComponent = this.getOwnerComponent();
			this._router = oComponent.getRouter();

			this._router.getRoute("sign").attachPatternMatched(this._routePatternMatched, this);

			this._oResourceBundle = oComponent.getModel("i18n").getResourceBundle();
			this._oHelper = new Signature(oComponent, this._oView);

			// View register Model for Draft handling
			this._oViewModel = new sap.ui.model.json.JSONModel({
				Receiver: {
					Name: "",
					Url: ""
				},
				Releaser: {
					Name: "",
					Url: ""
				},
				Vbeln: ""
					// Set binding 2 ways
			});
			this.setModel(this._oViewModel, "pdfView");

			// set InputAssisted model
			this._oInputAssistedModel = new sap.ui.model.json.JSONModel({
					 "UserCollection": [
					 	{ "Name": "Jacques Nomssi Nzali" },
					 	{ "Name": "Christopher Hermann" },
					 	{ "Name": "Conny Richter" },
					 	{ "Name": "Felix Lemke" }
					 ]
				});
			this.setModel(this._oInputAssistedModel, "helpView");
			
			this._oSourceReleaser = {
				step: this.byId("signReleaserStep"),
				pad: this.byId("signature-pad"), // Lager
				field: this.byId("sName"),
				button: this.byId("btnClear"),
				property: "/Releaser>Url"
			};
			this._oSourceReceiver = {
				step: this.byId("signReceiverStep"),
				pad: this.byId("signature-pad2"), // Empfänger
				field: this.byId("sRecvName"),
				button: this.byId("btnClear2"),
				property: "/Receiver>Url"
			};
		
			this._oSourceReleaser.field.bindValue({
				path: "{SignerName}",
				mode: sap.ui.model.BindingMode.OneWay
			});
		},

		_routePatternMatched: function (oEvent) {

			var sVbeln = oEvent.getParameter("arguments").id;
			this.bindVbelnTo(this.getModel(), sVbeln, this);
			this._updateViewModel("/Vbeln", sVbeln);

			this._oMessageManager.removeAllMessages(); // reset potential server-side messages
		},

		/**
		 * Always navigates back to home
		 * @override
		 */
		onBack: function () {
			this.getRouter().navTo("home");

			this._wizard.setCurrentStep(this.byId("contentStep"));
		},

		_updateViewModel: function (sProperty, vValue) {
			this.getModel("pdfView").setProperty(sProperty, vValue);
		},

		onClearButton: function (oEvent) {
			var oSource; // undefined

			switch (oEvent.getSource()) {
			case this._oSourceReleaser.button:
				oSource = this._oSourceReleaser; // Lager
				oSource.property = "/Releaser>Url";
				break;
			case this._oSourceReceiver.button:
				oSource = this._oSourceReceiver; // Empfänger
				oSource.property = "/Receiver>Url";
				break;
			default:
				return;
			};

			this._updateViewModel(oSource.property, "");

			oSource.pad.clear();
			this._wizard.invalidateStep(oSource.step);
			this._wizard.setCurrentStep(oSource.step);
			// this._oHelper.clearSignature(this.sVbeln);
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
			var sMessage = this._oResourceBundle.getText(sText);
			this._popoverMessage(sMessage,
				oInput.getLabels()[0].getText(),
				sap.ui.core.MessageType.Error,
				sTarget);
			return sMessage;
		},

		_isValidInput: function (oInput) {
			var oState = {valid : false,
						errorId : ""};
			var sCurrentValue = oInput.getValue();

			if (sCurrentValue) {
				var isValidEntry = (/^[a-zA-ZäöüÄÖÜÀ-ÿŠŒšœžŽŸ\- ]+$/).test(oInput.getValue()); // RegEx: Letters, no number, Umlaut, space, .

				if (isValidEntry) {
					oState.valid = true;
				} else {
					oState.errorId = "invalid.Chars";
				}
			} else {
				oState.errorId = "mandatory.field";
			};
			return oState;
		},

		_validateField: function (oInput, oStep) {
			var sTarget = oInput.getBindingContext().getPath() + "/" + oInput.getBindingPath("value");

			this.removeMessageFromTarget(sTarget);

			var oState = this._isValidInput(oInput);
			if (oState.valid === false) {
				oInput.setValueStateText(this._popoverInvalidField(oInput, oState.errorId, sTarget));
				oInput.setValueState("Error");
				oStep.setValidated(false);
			};
			return oState.valid;
		},

		_validateStep: function (oSignSource) {
			var oState = this._isValidInput(oSignSource.field);

			if (oState.valid === true && oSignSource.pad.isEmpty()) {
				oState.valid = false;
			};
			oSignSource.step.setValidated(oState.valid);
		},

        _cloneSource: function (oOriginalSource, sProperty) {
			return {
				step: oOriginalSource.step,
				pad: oOriginalSource.pad,
				field: oOriginalSource.field,
				button: oOriginalSource.button,
				property: sProperty
			};
        },
        
		onInputChange: function (oEvent) {
			// Whenever the clear text name is changed in the input field, update the draft model and validate
			// onInputChange is the change event defined in the XML view.
			var oSource; // undefined

			switch (oEvent.getSource()) {
			case this._oSourceReleaser.field:
				oSource = this._cloneSource(this._oSourceReleaser, "/Releaser>Name");
				break;
			case this._oSourceReceiver.field:
				oSource = this._cloneSource(this._oSourceReceiver, "/Receiver>Name");
				break;
			default:
				return;
			};

			this._validateStep(oSource);
			this._updateViewModel(oSource.property, oSource.field.getValue());
			this._validateField(oSource.field, oSource.step);
		},

		onSignChange: function (oEvent) {
			var oSource; // undefined

			switch (oEvent.getSource()) {
			case this._oSourceReleaser.pad:
				oSource = this._cloneSource(this._oSourceReleaser, "/Releaser>Url");
				break;
			case this._oSourceReceiver.pad:
				oSource = this._cloneSource(this._oSourceReleaser, "/Receiver>Url");
				break;
			default:
				return;
			};

			this._validateStep(oSource);
			this._updateViewModel(oSource.property, oEvent.getParameter("value"));
		},

		onSignerNameValueHelp: function(oEvent) {
		 	var sInputValue = oEvent.getSource().getValue();

			// create value help dialog
			if (!this._valueHelpDialog) {
				this._valueHelpDialog = sap.ui.xmlfragment(
					"Signature.view.InputAssisted",
					this
				);
				this.getView().addDependent(this._valueHelpDialog);
			}

			// create a filter for the binding
			this._valueHelpDialog.getBinding("items").filter([new Filter(
				"Name",
				sap.ui.model.FilterOperator.Contains, sInputValue
			)]);

			// open value help dialog filtered by the input value
			this._valueHelpDialog.open(sInputValue);
		},

		_handleValueHelpSearch : function (oEvent) {
			var sValue = oEvent.getParameter("value");
			var oFilter = new Filter(
				"Name",
				sap.ui.model.FilterOperator.Contains, sValue
			);
			oEvent.getSource().getBinding("items").filter([oFilter]);
		},

		_handleValueHelpClose : function (oEvent) {
			var oSelectedItem = oEvent.getParameter("selectedItem");
			if (oSelectedItem) {
				this._oSourceReleaser.field.setValue(oSelectedItem.getTitle());
			}
			oEvent.getSource().getBinding("items").filter([]);
		},
		
		onTriggerOutput: function () {
			var oStep = this.byId("signReceiverStep");
			this._wizard.validateStep(oStep);
		},

		onWizardCompleted: function (oEvent) {
			var sMessageText = this._oResourceBundle.getText("step.save");
			var sMessageType = sap.ui.core.MessageType.Information;

			var fnSaveError = function (oError) {
				// this._oApplicationProperties.setProperty("/isBusySaving", false);

				this._popoverMessage(this.sVbeln,
					JSON.stringify(oError),
					sap.ui.core.MessageType.Error,
					this._oLink);

				this._wizard.setCurrentStep(this.byId("contentStep"));
				this.getRouter().navTo("error", {id: this.sVbeln});
			};

			var fnAfterSave = function (oData, oResponse) {
				// this._oApplicationProperties.setProperty("/isBusySaving", false);
				sMessageText = this._oResourceBundle.getText("pdf.Created");

				this._popoverMessage(this.sVbeln,
					sMessageText,
					sap.ui.core.MessageType.Success,
					this._oLink);

				this._wizard.setCurrentStep(this.byId("contentStep"));
				this.getRouter().navTo("complete", {id: this.sVbeln});
			};

			this._popoverMessage(this.sVbeln,
				sMessageText,
				sMessageType,
				this._oLink);
			this._oHelper.saveSignature(fnAfterSave.bind(this), fnSaveError.bind(this), this.getView().getModel("pdfView"));
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
				var oMessagePopover = new MessagePopover(this.createId("errorMessagePopover"), {
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

		// To be able to stub the addDependent function in unit test, we added it in a separate function
		_addDependent: function (oMessagePopover) {
			this.getView().addDependent(oMessagePopover);
		}

	});
});