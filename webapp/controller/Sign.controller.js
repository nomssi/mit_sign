sap.ui.define([
	"./BaseController",
	"../model/Signature",
	"../model/formatter",
	"sap/m/MessagePopover",
	"sap/m/MessagePopoverItem",
	"sap/ui/core/Fragment",
	"sap/ui/model/Filter",
	"../util/messages",
	"sap/m/MessageToast",
	"sap/ui/model/json/JSONModel",
	"sap/ui/core/syncStyleClass"
], function (
	BaseController,
	Signature,
	formatter,
	MessagePopover,
	MessagePopoverItem,
	Fragment,
	Filter,
	Messsages,
	MessageToast,
	JSONModel,
	syncStyleClass) {
	"use strict";

	return BaseController.extend("Signature.controller.Sign", {

		formatter: formatter,

		exit: function () {
			this._oHelper.destroy();
			this._oViewModel.destroy();
		},

		onInit: function () {

			this._wizard = this.byId("signWizard");
			this._oNavContainer = this.byId("wizardNavContainer");
			this._oWizardContentPage = this.byId("wizardContentPage");

			this.initMessageManager(this);

			// this._initViewPropertiesModel();
			var oComponent = this.getOwnerComponent();
			this._router = oComponent.getRouter();

			this._router.getRoute("sign").attachPatternMatched(this._routePatternMatched, this);

			this._oResourceBundle = oComponent.getModel("i18n").getResourceBundle();
			this._oHelper = new Signature(oComponent, this._oView);

			// View register Model for Draft handling
			this._oViewModel = new JSONModel({
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
			this.setModel(this._oViewModel, "draft");

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

			// this._oSourceReleaser.field.bindValue({
			// 	path: "{SignerName}",
			// 	mode: sap.ui.model.BindingMode.OneWay
			// });
		},

		_routePatternMatched: function (oEvent) {

			var sVbeln = oEvent.getParameter("arguments").id;
			this.bindVbelnTo(this.getModel(), sVbeln, this);
			this._setDraftProperty("/Vbeln", sVbeln);

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

		_setDraftProperty: function (sProperty, vValue) {
			this.getModel("draft").setProperty(sProperty, vValue);
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
					processor: this._oMessageProcessor
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
			var oState = {
				valid: false,
				errorId: ""
			};
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

		_validateField: function (oSource) {
			// First check Input field			
			var oInput = oSource.field;
			var oState = this._isValidInput(oInput);
			var sTarget = oInput.getBindingContext().getPath() + "/" + oInput.getBindingPath("value");

			this.removeMessageFromTarget(sTarget);

			if (oState.valid === false) {
				oInput.setValueStateText(this._popoverInvalidField(oInput, oState.errorId, sTarget));
				oInput.setValueState("Error");
			} else {
				this._setDraftProperty(oSource.property, oSource.field.getValue());
				// Then check SignPad
				if (oSource.pad.isEmpty()) {
					oState = {
						valid: false,
						errorId: "missing.signature"
					};
					oInput.setValueState("Warning");
					oInput.setValueStateText(this._popoverInvalidField(oInput, oState.errorId, sTarget));
				} else {
					oInput.setValueState("None");
				};
			};

			oSource.step.setValidated(oState.valid);
		},

		_validateSign: function (oSource, oEvent) {
			this._setDraftProperty(oSource.property, oEvent.getParameter("value"));
			this._validateField(oSource);
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

			this._validateField(oSource);
		},

		onClearButton: function (oEvent) {
			var oSource; // undefined

			switch (oEvent.getSource()) {
			case this._oSourceReleaser.button:
				oSource = this._cloneSource(this._oSourceReleaser, "/Releaser>Url");
				break;
			case this._oSourceReceiver.button:
				oSource = this._cloneSource(this._oSourceReceiver, "/Receiver>Url");
				break;
			default:
				return;
			};

			oSource.pad.clear();
			// this._oHelper.clearSignature(this.sVbeln);

			this._validateSign(oSource, oEvent);
			this._wizard.setCurrentStep(oSource.step);
		},

		onSignChange: function (oEvent) {
			var oSource; // undefined

			switch (oEvent.getSource()) {
			case this._oSourceReleaser.pad:
				oSource = this._cloneSource(this._oSourceReleaser, "/Releaser>Url");
				break;
			case this._oSourceReceiver.pad:
				oSource = this._cloneSource(this._oSourceReceiver, "/Receiver>Url");
				break;
			default:
				return;
			};

			this._validateSign(oSource, oEvent);
		},

		onSignerNameValueHelp: function (oEvent) {
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

		_handleValueHelpSearch: function (oEvent) {
			var sValue = oEvent.getParameter("value");
			var oFilter = new Filter(
				"Name",
				sap.ui.model.FilterOperator.Contains, sValue
			);
			oEvent.getSource().getBinding("items").filter([oFilter]);
		},

		_handleValueHelpClose: function (oEvent) {
			var oSelectedItem = oEvent.getParameter("selectedItem");
			if (oSelectedItem) {
				var sReleaserName = oSelectedItem.getTitle();
				this._oSourceReleaser.field.setValue(sReleaserName);
				this._setDraftProperty("/Releaser>Name", sReleaserName);
			}
			oEvent.getSource().getBinding("items").filter([]);
		},

		onTriggerOutput: function () {
			var oStep = this.byId("signReceiverStep");
			this._wizard.validateStep(oStep);
		},

		onWizardCompleted: function (oEvent) {

			var fnSaveError = function (oError) {
				// this._oApplicationProperties.setProperty("/isBusySaving", false);
				this._popoverMessage(this.sVbeln,
					this._oResourceBundle.getText("step.save"),
					sap.ui.core.MessageType.Information,
					this._oLink);

				this._popoverMessage(this.sVbeln,
					JSON.stringify(oError),
					sap.ui.core.MessageType.Error,
					this._oLink);

				this._oBusyDialog.close();

				this.getRouter().navTo("error", {
					id: this.sVbeln
				});
			};

			var fnAfterSave = function (oData, oResponse) {
				// this._oApplicationProperties.setProperty("/isBusySaving", false);

				this._popoverMessage(this.sVbeln,
					this._oResourceBundle.getText("step.save"),
					sap.ui.core.MessageType.Information,
					this._oLink);

				this._popoverMessage(this.sVbeln,
					this._oResourceBundle.getText("pdf.Created") + " Datei {PDFUrl}",
					sap.ui.core.MessageType.Success,
					this._oLink);

				this._popoverMessage(this.sVbeln,
					"EMail an {ReceiverName} per Mail mit Id {FloeId} versandt",
					sap.ui.core.MessageType.Information,
					this._oLink);

				// this._wizard.setCurrentStep(this.byId("contentStep"));
				this._oBusyDialog.close();

				this.getRouter().navTo("complete", {
					id: this.sVbeln
				});
			};

			// Save draft: load BusyDialog fragment asynchronously
			var that = this;
			if (this._oBusyDialog) {
				this._oBusyDialog.open();
				that._oHelper.saveSignature(fnAfterSave.bind(that), fnSaveError.bind(that), that.getView().getModel("draft"));
			} else {
				Fragment.load({
					name: "Signature.view.BusyDialog",
					controller: this
				}).then(function (oFragment) {
					this._oBusyDialog = oFragment;
					this.getView().addDependent(this._oBusyDialog);
					syncStyleClass("sapUiSizeCompact", this.getView(), this._oBusyDialog);
					this._oBusyDialog.open();
					that._oHelper.saveSignature(fnAfterSave.bind(that), fnSaveError.bind(that), that.getView().getModel("draft"));
				}.bind(this));
			};
		},

		onBusyDialogClosed: function (oEvent) {
			if (oEvent.getParameter("cancelPressed")) {
				MessageToast.show("Operation abgebrochen");
			};
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