sap.ui.define([
	"./BaseController",
	"../model/Signature",
	"../model/formatter",
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
			this._oDraft.destroy();
		},

		onInit: function () {

			this._wizard = this.byId("signWizard");
			this._oNavContainer = this.byId("wizardNavContainer");
			this._oWizardContentPage = this.byId("wizardContentPage");

			this.initMessageManager(this);

			var oComponent = this.getOwnerComponent();
			this._router = oComponent.getRouter();
			this._router.getRoute("sign").attachPatternMatched(this._routePatternMatched, this);

			this._oResourceBundle = oComponent.getModel("i18n").getResourceBundle();
			this._oHelper = new Signature(oComponent);

			this.initDraftModel();

			this._oSourceReleaser = {
				step: this.byId("signReleaserStep"),
				pad: this.byId("signature-pad"), // Lager
				field: this.byId("sName"),
				button: this.byId("btnClear"),
				property: "/Releaser/Url"
			};
			this._oSourceReceiver = {
				step: this.byId("signReceiverStep"),
				pad: this.byId("signature-pad2"), // Empfänger
				field: this.byId("sRecvName"),
				button: this.byId("btnClear2"),
				property: "/Receiver/Url"
			};

			// this._oSourceReleaser.field.bindValue({
			// 	path: "{SignerName}",
			// 	mode: sap.ui.model.BindingMode.OneWay
			// });
		},

		_routePatternMatched: function (oEvent) {

			var sVbeln = oEvent.getParameter("arguments").id;
			this.bindVbelnTo(this.getModel(), sVbeln, this);

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
			// var sTarget = oInput.getBindingContext().getPath() + "/" + oInput.getBindingPath("value");
			var sTarget = "draft>" + oInput.getBindingPath("value");

			this.removeMessageFromTarget(sTarget);

			if (oState.valid === false) {
				oInput.setValueStateText(this._popoverInvalidField(oInput, oState.errorId, sTarget));
				oInput.setValueState("Error");
			} else {
				// unnecessary is field is assigned to draft JSON model (two way binding):
				// this.setDraftProperty(oSource.property, oSource.field.getValue()); 
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
			this.setDraftProperty(oSource.property, oEvent.getParameter("value"));
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
				oSource = this._cloneSource(this._oSourceReleaser, "/Releaser/Name");
				break;
			case this._oSourceReceiver.field:
				oSource = this._cloneSource(this._oSourceReceiver, "/Receiver/Name");
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
				oSource = this._cloneSource(this._oSourceReleaser, "/Releaser/Url");
				break;
			case this._oSourceReceiver.button:
				oSource = this._cloneSource(this._oSourceReceiver, "/Receiver/Url");
				break;
			default:
				return;
			};

			oSource.pad.clear();

			this._validateSign(oSource, oEvent);
			this._wizard.setCurrentStep(oSource.step);
		},

		onSignChange: function (oEvent) {
			var oSource; // undefined

			switch (oEvent.getSource()) {
			case this._oSourceReleaser.pad:
				oSource = this._cloneSource(this._oSourceReleaser, "/Releaser/Url");
				break;
			case this._oSourceReceiver.pad:
				oSource = this._cloneSource(this._oSourceReceiver, "/Receiver/Url");
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
				// unnecessary if field is assigned to draft JSON model (two way binding)
				// this.setDraftProperty("/Releaser/Name", sReleaserName);
			}
			oEvent.getSource().getBinding("items").filter([]);
		},

		onTriggerOutput: function () {
			var oStep = this.byId("signReceiverStep");
			this._wizard.validateStep(oStep);
		},

		_getDraftData: function (oControl) {
			var oModel = oControl.getView().getModel("draft");
			var oData = {
				Vbeln: oModel.getProperty("/Vbeln"),
				Issuer: oModel.getProperty("/Releaser/Name"),			// Klartext Name Lager
				Receiver: oModel.getProperty("/Receiver/Name"),			// Klartext Name Abholer
				SignatureIssuer: oModel.getProperty("/Releaser/Url"),	// Signatur Lager
				SignatureReceiver: oModel.getProperty("/Receiver/Url")	// Signatur Abholer
			};
			if (typeof oData.Issuer !== "undefined" && typeof oData.Receiver !== "undefined" &&
				typeof oData.SignatureIssuer !== "undefined" && typeof oData.SignatureReceiver !== "undefined") {
				return oData;
			};
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
			var oSignData = this._getDraftData(this);
			
			if (this._oBusyDialog) {
				this._oBusyDialog.open();
				this._oHelper.saveSignature(fnAfterSave.bind(this), fnSaveError.bind(this), oSignData);
			} else {
				var that = this;
				Fragment.load({
					name: "Signature.view.BusyDialog",
					controller: this
				}).then(function (oFragment) {
					this._oBusyDialog = oFragment;
					this.getView().addDependent(this._oBusyDialog);
					syncStyleClass("sapUiSizeCompact", this.getView(), this._oBusyDialog);
					this._oBusyDialog.open();
					that._oHelper.saveSignature(fnAfterSave.bind(that), fnSaveError.bind(that), oSignData);
				}.bind(this));
			};
		},

		onBusyDialogClosed: function (oEvent) {
			if (oEvent.getParameter("cancelPressed")) {
				MessageToast.show("{i18n>save.cancelled}");
			};
		}

	});
});