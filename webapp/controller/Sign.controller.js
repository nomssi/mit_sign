sap.ui.define([
	"./BaseController",
	"../model/Signature",
	"../util/messages",
	"../util/controls",
	"sap/ui/core/Fragment",
	"sap/ui/model/Filter",
	"sap/m/MessageToast"
], function (
	BaseController,
	Signature,
	Messages,
	controls,
	Fragment,
	Filter,
	MessageToast) {
	"use strict";

	return BaseController.extend("Signature.controller.Sign", {

		exit: function () {
			this._oHelper.destroy();
		},

		onInit: function () {

			this._wizard = this.byId("signWizard");

			this.initMessageManager(this);

			var oComponent = this.getOwnerComponent();
			this._router = oComponent.getRouter();
			this._router.getRoute("sign").attachPatternMatched(this._routePatternMatched, this);

			this._oResourceBundle = this.getResourceBundle();	// inherit von BaseController
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

		},

		_routePatternMatched: function (oEvent) {

			var sVbeln = oEvent.getParameter("arguments").id;
			this.bindVbelnTo(this.getModel(), sVbeln, this);

			this._oMessageManager.removeAllMessages(); // reset potential server-side messages

			this._wizard.setCurrentStep(this.byId("contentStep"));
		},

		/**
		 * Always navigates back to home
		 * @override
		 */
		onBack: function () {
			this.getRouter().navTo("home");
		},

		_popoverInvalidField: function (oInput, sText, sTarget) {
			var sMessage = this._oResourceBundle.getText(sText);
			Messages.popoverMessage(sMessage,
				oInput.getLabels()[0].getText(),
				sap.ui.core.MessageType.Error,
				sTarget, this);
			return sMessage;
		},

		_isValidInput: function (sCurrentValue) {
			var oState = {
				valid: false,
				errorId: "",
				state: "Error"
			};

			if (sCurrentValue) {
				var isValidEntry = (/^[a-zA-ZäöüÄÖÜÀ-ÿŠŒšœžŽŸ\- ]+$/).test(sCurrentValue); // RegEx: Letters, no number, Umlaut, space, .

				if (isValidEntry) {
					oState.valid = true;
					oState.state = "None";
				} else {
					oState.errorId = "invalid.Chars";
				}
			} else {
				oState.errorId = "mandatory.field";
			};
			return oState;
		},

		_validateSign: function (oSource) {
			var oInput = oSource.field; // First check Input field	
			var sPath = "draft>"; // oInput.getBindingContext().getPath() + "/";
			var sTarget = sPath + oInput.getBindingPath("value");

			this.removeMessageFromTarget(sTarget);

			var oState = this._isValidInput(oInput.getValue());
			if (oState.valid) {
				if (oSource.pad.isEmpty()) { // Then check SignPad
					oState = {
						valid: false,
						errorId: "missing.signature",
						state: "Warning"
					};
					oInput.setValueStateText(this._popoverInvalidField(oInput, oState.errorId, sTarget));
				} else {
					oState.state = "None";
				};
			} else {
				oInput.setValueStateText(this._popoverInvalidField(oInput, oState.errorId, sTarget));
			};

			oInput.setValueState(oState.state);
			oSource.step.setValidated(oState.valid);
		},

		_cloneSource: function (oOriginalSource, sProperty) {
			var oSource = Object.create(oOriginalSource); // clone step, pad, field, button, property
			oSource.property = sProperty;
			return oSource;
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

			this._validateSign(oSource);
			this._wizard.setCurrentStep(oSource.step);
		},

		onSignChange: function (oEvent) {
			// Whenever the clear text name is changed in the input field, update the draft model and validate
			// onSignChange is the change event defined in the XML view.
			var oSource; // undefined

			switch (oEvent.getSource()) {
			case this._oSourceReleaser.field:
				oSource = this._cloneSource(this._oSourceReleaser, "/Releaser/Name");
				break;
			case this._oSourceReceiver.field:
				oSource = this._cloneSource(this._oSourceReceiver, "/Receiver/Name");
				break;
			case this._oSourceReleaser.pad:
				oSource = this._cloneSource(this._oSourceReleaser, "/Releaser/Url");
				break;
			case this._oSourceReceiver.pad:
				oSource = this._cloneSource(this._oSourceReceiver, "/Receiver/Url");
				break;
			default:
				return;
			};

			this._validateSign(oSource);
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
				this._oSourceReleaser.field.setValue(oSelectedItem.getTitle()); // also sets JSON draft model property "/Releaser/Name" (TwoWay binding)
				this._validateSign(this._oSourceReleaser);
			}
			oEvent.getSource().getBinding("items").filter([]);
		},

		_getDraftData: function (oModel) {
			var oData = {
				Vbeln: oModel.getProperty("/Vbeln"),
				Issuer: oModel.getProperty("/Releaser/Name"), // Klartext Name Lager
				Receiver: oModel.getProperty("/Receiver/Name"), // Klartext Name Abholer
				SignatureIssuer: oModel.getProperty("/Releaser/Url"), // Signatur Lager
				SignatureReceiver: oModel.getProperty("/Receiver/Url") // Signatur Abholer
			};

			if (typeof oData.Issuer !== "undefined" && typeof oData.Receiver !== "undefined" &&
				typeof oData.SignatureIssuer !== "undefined" && typeof oData.SignatureReceiver !== "undefined") {
				return oData;
			};
		},

		onWizardCompleted: function (oEvent) {

			var fnSaveError = function (oDetails) {
				// this._oApplicationProperties.setProperty("/isBusySaving", false);
				var oError = oDetails.response ? oDetails.response : oDetails;
				Messages.popoverTechnicalMessage(this.sVbeln,
					this._oResourceBundle.getText("step.save"),
					oError.responseText,
					sap.ui.core.MessageType.Information,
					null, this);

				Messages.popoverHelpMessage(this.sVbeln, this);
				
				this._oBusyDialog.close();

				this.getRouter().navTo("error", {
					id: this.sVbeln
				});
			};

			var fnAfterSave = function (oData, oResponse) {
				// this._oApplicationProperties.setProperty("/isBusySaving", false);

				Messages.popoverTechnicalMessage(this.sVbeln,
					this._oResourceBundle.getText("step.save"),
					this._oResourceBundle.getText("pdf.Created") + " Datei {oData.PDFUrl}",
					sap.ui.core.MessageType.Success,
					null, this);

				this._oBusyDialog.close();

				this.getRouter().navTo("complete", {
					id: this.sVbeln
				});
			};

			var oModel = this.getModel("draft");
			// maintain signatures in the draft model now
			oModel.setProperty("/Releaser/Url", this._oSourceReleaser.pad.export()); // Signatur Lager
			oModel.setProperty("/Receiver/Url", this._oSourceReceiver.pad.export()); // Signatur Abholer

			// save draft to oData model
			var oSignData = this._getDraftData(oModel);

			if (this._oBusyDialog) {
				this._oBusyDialog.open();
				this._oHelper.saveSignature(fnAfterSave.bind(this), fnSaveError.bind(this), oSignData);
			} else {
				Fragment.load({
					name: "Signature.view.BusyDialog",
					controller: this
				}).then(function (oFragment) {
					this._oBusyDialog = oFragment;
					controls.attachControlToView(this.getView(), this._oBusyDialog);

					this._oBusyDialog.open();
					this._oHelper.saveSignature(fnAfterSave.bind(this), fnSaveError.bind(this), oSignData);
				}.bind(this));
			};
		},

		onBusyDialogClosed: function (oEvent) {
			if (oEvent.getParameter("cancelPressed")) {
				MessageToast.show(this._oResourceBundle.getText("save.cancelled"));
			};
		}

	});
});